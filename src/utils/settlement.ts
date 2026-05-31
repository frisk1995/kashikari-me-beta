/**
 * 精算計算ロジック（純粋関数）。
 *
 * 「直接ペアベース」の精算:
 * - 各 Payment の lenderId と各 borrowerId のペアごとに、直接の貸し借り額を集計する。
 * - 同じ当事者間で双方向の貸し借りがある場合のみ相殺（ネット計算）する。
 * - 異なる当事者間ではショートカット（三角精算）を作らない。
 *   例: A→B ¥2000、B→C ¥2000 なら「B→A ¥2000」「C→B ¥2000」となり、
 *   「C→A」のような直接関係のない送金は生成しない。
 *
 * UI から切り離してテストしやすくするため、ストレージや React に依存しない。
 */

import type { Group, Member, Payment } from '@/types';

/** 1件の送金（精算案の1行） */
export interface SettlementTransfer {
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  amount: number;
  /** 安定キー（`${fromId}->${toId}`） */
  key: string;
}

/** 送金の安定キーを生成する */
export function transferKey(fromId: string, toId: string): string {
  return `${fromId}->${toId}`;
}

export interface SettlementResult {
  /** 精算案（送金リスト） */
  transfers: SettlementTransfer[];
  /** 総支出 */
  total: number;
  /** 1人あたり平均負担額（総支出 / メンバー数、切り捨て） */
  average: number;
}

function nameOf(members: Member[], id: string): string {
  return members.find((m) => m.id === id)?.name ?? '不明';
}

/**
 * 1件の支払いについて、借りた人ごとの負担額を均等割りで返す。
 * 借りた人が1人なら全額、複数なら amount / borrowers.length ずつ。
 * 割り切れない端数は対象メンバーの先頭から 1円ずつ配分し、合計が amount と一致するよう調整する。
 */
export function splitPayment(amount: number, borrowerIds: string[]): Record<string, number> {
  const result: Record<string, number> = {};
  const n = borrowerIds.length;
  if (n === 0 || amount <= 0) {
    borrowerIds.forEach((id) => {
      result[id] = 0;
    });
    return result;
  }
  const base = Math.floor(amount / n);
  let remainder = amount - base * n; // 0 <= remainder < n
  borrowerIds.forEach((id) => {
    let share = base;
    if (remainder > 0) {
      share += 1;
      remainder -= 1;
    }
    result[id] = (result[id] ?? 0) + share;
  });
  return result;
}

/**
 * 1件の支払いの負担額マップを計算する。
 * 借りた人（borrowerIds）に均等割りし、members に存在する id のみを対象とする。
 */
export function computePaymentShares(
  payment: Payment,
  validMemberIds: Set<string>
): Record<string, number> {
  const amount = Math.round(payment.amount || 0);
  const validBorrowers = (payment.borrowerIds ?? []).filter((id) => validMemberIds.has(id));
  return splitPayment(amount, validBorrowers);
}

/**
 * 直接ペアベースの精算案を生成する。
 *
 * アルゴリズム:
 *  1. 各 Payment について、貸した人（lender）と借りた人（borrower）の
 *     ペアごとの貸し借り額を集計する（均等割り）。
 *     キーは `${lenderId}|${borrowerId}` 形式。
 *  2. 同じ当事者間で双方向の貸し借りがある場合のみ相殺（ネット計算）する。
 *  3. ネット額が 0 になったペアは除外し、amount > 0 の送金のみ Transfer[] として返す。
 *
 * 貸した人＝借りた人（自分が自分に貸す）になるケースは無視する。
 */
export function computeDirectTransfers(
  members: Member[],
  payments: Payment[]
): SettlementTransfer[] {
  const validMemberIds = new Set(members.map((m) => m.id));

  // key: `${lenderId}|${borrowerId}` -> 借りた人が貸した人に払うべき累計額
  const pairDebt: Record<string, number> = {};

  payments.forEach((p) => {
    const amount = Math.round(p.amount || 0);
    if (amount <= 0) return;
    const lenderId = p.lenderId;
    if (!validMemberIds.has(lenderId)) return;
    const shares = computePaymentShares(p, validMemberIds);
    Object.entries(shares).forEach(([borrowerId, share]) => {
      if (share <= 0) return;
      // 自分が自分に貸す分は精算不要
      if (borrowerId === lenderId) return;
      const key = `${lenderId}|${borrowerId}`;
      pairDebt[key] = (pairDebt[key] ?? 0) + share;
    });
  });

  // 双方向のペアを相殺（ネット計算）する。
  // 例: A→B(借りがB) と B→A(借りがA) を突き合わせる。
  const netted: Record<string, number> = {};
  const processed = new Set<string>();

  Object.keys(pairDebt).forEach((key) => {
    if (processed.has(key)) return;
    const [lenderId, borrowerId] = key.split('|');
    const reverseKey = `${borrowerId}|${lenderId}`;
    const forward = pairDebt[key] ?? 0;
    const reverse = pairDebt[reverseKey] ?? 0;
    processed.add(key);
    processed.add(reverseKey);

    const diff = forward - reverse;
    if (diff > 0) {
      // borrowerId が lenderId に diff 払う
      netted[key] = diff;
    } else if (diff < 0) {
      // lenderId が borrowerId に -diff 払う
      netted[reverseKey] = -diff;
    }
    // diff === 0 のペアは完全に相殺されるため除外
  });

  const transfers: SettlementTransfer[] = [];
  Object.entries(netted).forEach(([key, amount]) => {
    if (amount <= 0) return;
    // key は `${lenderId}|${borrowerId}`。borrower が lender へ支払う。
    const [lenderId, borrowerId] = key.split('|');
    const fromId = borrowerId;
    const toId = lenderId;
    transfers.push({
      fromId,
      toId,
      fromName: nameOf(members, fromId),
      toName: nameOf(members, toId),
      amount,
      key: transferKey(fromId, toId),
    });
  });

  // 表示安定のため金額降順で並べる
  transfers.sort((a, b) => b.amount - a.amount);

  return transfers;
}

/**
 * グループ全体の精算結果を計算する（精算案 + サマリー）。
 * settled: false の支払いのみを精算対象にする。
 */
export function computeSettlement(group: Group, payments: Payment[]): SettlementResult {
  const members = group.members ?? [];
  const unsettled = payments.filter((p) => !p.settled);
  const transfers = computeDirectTransfers(members, unsettled);
  const total = unsettled.reduce((sum, p) => sum + Math.round(p.amount || 0), 0);
  const memberCount = members.length;
  const average = memberCount > 0 ? Math.floor(total / memberCount) : 0;
  return { transfers, total, average };
}

/** テキスト共有用に金額を「¥1,234」形式へ整形する（theme 非依存・テスト容易化のため自前実装） */
function yen(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(Math.round(amount));
  return `${sign}¥${abs.toLocaleString('ja-JP')}`;
}

/**
 * 精算結果を共有・コピー用のプレーンテキストへ整形する（純粋関数）。
 *
 * 例:
 *   【かしかり.me 精算結果】
 *   グループ: 北海道旅行2026
 *   総支出: ¥128,400
 *   1人あたり: ¥32,100
 *
 *   ■ 精算案
 *   太郎 → 花子: ¥5,000
 *   次郎 → 花子: ¥3,000
 *
 * 精算が不要（送金0件）の場合は「みんな精算済み！貸し借りはありません」を出力する。
 */
export function buildSettlementText(group: Group, payments: Payment[]): string {
  const result = computeSettlement(group, payments);
  const lines: string[] = [];
  lines.push('【Kashikari.me 精算結果】');
  lines.push(`グループ: ${group.name || '（無題）'}`);
  lines.push(`総支出: ${yen(result.total)}`);
  lines.push(`1人あたり: ${yen(result.average)}`);
  lines.push('');
  lines.push('■ 精算案');
  if (result.transfers.length === 0) {
    lines.push('みんな精算済み！貸し借りはありません');
  } else {
    result.transfers.forEach((t) => {
      lines.push(`${t.fromName} → ${t.toName}: ${yen(t.amount)}`);
    });
  }
  return lines.join('\n');
}

// nameOf は将来の拡張用に export しておく（現状は内部利用のみ）
export { nameOf };
