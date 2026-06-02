/**
 * ドメイン型定義。
 * 将来のサーバ同期を見据え、各エンティティに id / createdAt / updatedAt を持たせる。
 */

export interface Member {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
  members: Member[];
  createdAt: number;
  updatedAt: number;
  /** グループのテーマカラー（例: '#FF6B6B'）。未設定の既存データは normalizeGroup で補完される */
  color: string;
  /** グループのアイコン名（Ionicons、例: 'airplane-outline'）。未設定は normalizeGroup で補完される */
  icon: string;
  /** グループ作成者の userId（Firestore 共有用） */
  ownerId: string;
  /** アクセス可能な userId 一覧（招待で加わったメンバーを含む） */
  participantIds: string[];
  /**
   * AsyncStorage（ローカルキャッシュ）専用の支払い配列。
   * Firestore では payments subcollection で管理するため、Firestore 経由のデータには含まれない。
   * 後方互換のため optional として残す。
   */
  payments?: Payment[];
}

/**
 * 貸し借りを表す支払い型。
 *
 * 「貸した人（lender）」が「借りた人（borrowers）」全員に均等に貸した扱いになる。
 * 借りた人が1人なら全額、複数なら amount / borrowers.length ずつ（端数は先頭に +1円）。
 */
export interface Payment {
  id: string;
  /** 所属グループの id（Firestore subcollection 由来。ローカルデータでは未設定の場合がある） */
  groupId?: string;
  amount: number;
  /** 貸した人のメンバーID */
  lenderId: string;
  /** 借りた人のメンバーID（1人以上） */
  borrowerIds: string[];
  /** 用途メモ（任意） */
  memo: string;
  /** 借りた日付（ISO 8601 `YYYY-MM-DD`）。省略時は作成日から導出される */
  date: string;
  createdAt: number;
  updatedAt: number;
  /** 精算済みフラグ（false = 未精算、true = 精算済み） */
  settled: boolean;
}

/** ストレージに保存するルートデータ構造 */
export interface AppData {
  /** スキーマバージョン。将来のマイグレーション用 */
  version: number;
  groups: Group[];
}
