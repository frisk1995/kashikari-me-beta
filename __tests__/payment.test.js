/**
 * 支払い（Payment）ロジックの軽量ユニットテスト。
 * AsyncStorage をメモリ実装でモックし、支払いの CRUD・永続化・総支出集計・
 * 金額バリデーション・借りた人（borrowers）の指定を検証する。
 *
 * 実行: node __tests__/payment.test.js
 * （storage.test.js と同様、純ロジックを最小再実装して仕様を確認する）
 */
const assert = require('assert');

const store = new Map();
const KEY = 'kashikari.me/appData';

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function load() {
  const json = store.get(KEY);
  if (!json) return { version: 1, groups: [] };
  return JSON.parse(json);
}
async function save(data) {
  store.set(KEY, JSON.stringify(data));
}

async function createGroup(input) {
  const data = await load();
  const now = Date.now();
  const g = {
    id: generateId(),
    name: input.name.trim(),
    members: input.members.map((m) => ({ id: m.id ?? generateId(), name: m.name.trim() })),
    createdAt: now,
    updatedAt: now,
    payments: [],
  };
  data.groups.push(g);
  await save(data);
  return g;
}

async function addPayment(groupId, input) {
  const data = await load();
  const group = data.groups.find((g) => g.id === groupId);
  if (!group) return undefined;
  const now = Date.now();
  const p = {
    id: generateId(),
    amount: Math.round(input.amount),
    lenderId: input.lenderId,
    memo: (input.memo ?? '').trim(),
    borrowerIds: [...input.borrowerIds],
    createdAt: now,
    updatedAt: now,
  };
  group.payments = [...(group.payments ?? []), p];
  await save(data);
  return p;
}

async function getPayments(groupId) {
  const data = await load();
  const group = data.groups.find((g) => g.id === groupId);
  if (!group) return [];
  return [...(group.payments ?? [])].sort((a, b) => b.createdAt - a.createdAt);
}

async function updatePayment(groupId, paymentId, input) {
  const data = await load();
  const group = data.groups.find((g) => g.id === groupId);
  if (!group) return undefined;
  const idx = (group.payments ?? []).findIndex((p) => p.id === paymentId);
  if (idx === -1) return undefined;
  group.payments[idx] = {
    ...group.payments[idx],
    amount: Math.round(input.amount),
    lenderId: input.lenderId,
    memo: (input.memo ?? '').trim(),
    borrowerIds: [...input.borrowerIds],
    updatedAt: Date.now() + 1,
  };
  await save(data);
  return group.payments[idx];
}

async function deletePayment(groupId, paymentId) {
  const data = await load();
  const group = data.groups.find((g) => g.id === groupId);
  if (!group) return;
  group.payments = (group.payments ?? []).filter((p) => p.id !== paymentId);
  await save(data);
}

function totalSpent(payments) {
  return payments.reduce((sum, p) => sum + (p.amount || 0), 0);
}

function formatYen(amount) {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(Math.round(amount));
  return `${sign}¥${abs.toLocaleString('ja-JP')}`;
}

// 金額入力のサニタイズ（PaymentForm parseAmount と同仕様）
function parseAmount(raw) {
  const digits = String(raw).replace(/[^0-9]/g, '');
  if (digits.length === 0) return 0;
  return parseInt(digits, 10);
}

(async () => {
  let passed = 0;

  store.clear();
  const g = await createGroup({
    name: '沖縄旅行',
    members: [{ name: '太郎' }, { name: '花子' }, { name: '次郎' }],
  });
  const [m1, m2, m3] = g.members;

  // 1. 支払い追加 → 一覧に出る
  const p1 = await addPayment(g.id, {
    amount: 9000,
    lenderId: m1.id,
    memo: 'ホテル代',
    borrowerIds: [m1.id, m2.id, m3.id],
  });
  let payments = await getPayments(g.id);
  assert.strictEqual(payments.length, 1, '支払い1件');
  assert.strictEqual(payments[0].memo, 'ホテル代');
  assert.strictEqual(payments[0].borrowerIds.length, 3, '全員が借りた人');
  passed++;

  // 2. 個別選択の借りた人が保存される
  await new Promise((r) => setTimeout(r, 5));
  const p2 = await addPayment(g.id, {
    amount: 3000,
    lenderId: m2.id,
    memo: 'タクシー',
    borrowerIds: [m1.id, m2.id],
  });
  payments = await getPayments(g.id);
  const stored2 = payments.find((p) => p.id === p2.id);
  assert.deepStrictEqual(stored2.borrowerIds, [m1.id, m2.id], '個別選択2名');
  passed++;

  // 3. 時系列（新しい順）
  payments = await getPayments(g.id);
  assert.strictEqual(payments[0].id, p2.id, '新しい支払いが先頭');
  passed++;

  // 4. 総支出の集計
  assert.strictEqual(totalSpent(payments), 12000, '総支出 9000+3000');
  passed++;

  // 5. 編集が反映される
  await updatePayment(g.id, p1.id, {
    amount: 10000,
    lenderId: m3.id,
    memo: 'ホテル代（修正）',
    borrowerIds: [m1.id, m3.id],
  });
  payments = await getPayments(g.id);
  const edited = payments.find((p) => p.id === p1.id);
  assert.strictEqual(edited.amount, 10000, '金額更新');
  assert.strictEqual(edited.lenderId, m3.id, '貸した人更新');
  assert.strictEqual(edited.memo, 'ホテル代（修正）', 'メモ更新');
  assert.deepStrictEqual(edited.borrowerIds, [m1.id, m3.id], '借りた人更新');
  assert.strictEqual(totalSpent(payments), 13000, '更新後総支出 10000+3000');
  passed++;

  // 6. 削除 → 一覧から消え総支出も更新
  await deletePayment(g.id, p1.id);
  payments = await getPayments(g.id);
  assert.strictEqual(payments.length, 1, '削除後1件');
  assert.strictEqual(totalSpent(payments), 3000, '削除後総支出 3000');
  passed++;

  // 7. 永続化（別 load で確認）
  const reloaded = await load();
  assert.strictEqual(reloaded.groups[0].payments.length, 1, '再読込でも支払い保持');
  passed++;

  // 8. 金額フォーマット
  assert.strictEqual(formatYen(1234), '¥1,234');
  assert.strictEqual(formatYen(128400), '¥128,400');
  passed++;

  // 9. 金額入力サニタイズ（数字以外は無視、空・0 は 0）
  assert.strictEqual(parseAmount('1,234'), 1234, 'カンマ除去');
  assert.strictEqual(parseAmount('¥500'), 500, '記号除去');
  assert.strictEqual(parseAmount('abc'), 0, '非数値は0');
  assert.strictEqual(parseAmount(''), 0, '空は0');
  assert.strictEqual(parseAmount('012'), 12, '先頭0を整数化');
  passed++;

  console.log(`\n✓ All ${passed} payment tests passed.`);
})().catch((e) => {
  console.error('✗ Test failed:', e.message);
  process.exit(1);
});
