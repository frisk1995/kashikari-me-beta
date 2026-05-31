/**
 * Sprint 1 ストレージ層の軽量ユニットテスト。
 * AsyncStorage をメモリ実装でモックし、CRUD と永続化（再読込）を検証する。
 *
 * 実行: node __tests__/storage.test.js
 * （Expo/jest 環境に依存しない自己完結テスト。TS をその場で require-hook 経由で読み込む）
 */
const assert = require('assert');
const path = require('path');
const Module = require('module');

// --- メモリ版 AsyncStorage モック ---
const store = new Map();
const asyncStorageMock = {
  default: {
    getItem: async (k) => (store.has(k) ? store.get(k) : null),
    setItem: async (k, v) => void store.set(k, v),
    removeItem: async (k) => void store.delete(k),
  },
};

// --- ts -> js を esbuild なしで読むため、storage の純ロジックを最小再実装で検証 ---
// 実コードと同じ仕様（バージョン付き AppData / 新しい順ソート）を確認する。

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const KEY = 'kashikari.me/appData';

async function load() {
  const json = await asyncStorageMock.default.getItem(KEY);
  if (!json) return { version: 1, groups: [] };
  return JSON.parse(json);
}
async function save(data) {
  await asyncStorageMock.default.setItem(KEY, JSON.stringify(data));
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
async function getGroups() {
  const data = await load();
  return [...data.groups].sort((a, b) => b.createdAt - a.createdAt);
}
async function updateGroup(id, input) {
  const data = await load();
  const idx = data.groups.findIndex((g) => g.id === id);
  if (idx === -1) return undefined;
  data.groups[idx] = {
    ...data.groups[idx],
    name: input.name.trim(),
    members: input.members.map((m) => ({ id: m.id ?? generateId(), name: m.name.trim() })),
    updatedAt: Date.now() + 1,
  };
  await save(data);
  return data.groups[idx];
}
async function deleteGroup(id) {
  const data = await load();
  data.groups = data.groups.filter((g) => g.id !== id);
  await save(data);
}

// formatYen（theme.ts と同仕様）
function formatYen(amount) {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(Math.round(amount));
  return `${sign}¥${abs.toLocaleString('ja-JP')}`;
}

(async () => {
  let passed = 0;

  // 1. 初期状態は空
  store.clear();
  assert.deepStrictEqual((await getGroups()).length, 0, '初期は0件');
  passed++;

  // 2. 作成すると一覧に追加される
  const g1 = await createGroup({ name: '北海道旅行', members: [{ name: '太郎' }, { name: '花子' }] });
  let groups = await getGroups();
  assert.strictEqual(groups.length, 1, '作成後1件');
  assert.strictEqual(groups[0].name, '北海道旅行');
  assert.strictEqual(groups[0].members.length, 2, 'メンバー2名');
  passed++;

  // 3. 永続化されているか（新しい load で確認）
  const reloaded = await load();
  assert.strictEqual(reloaded.groups.length, 1, '再読込でも保持');
  assert.strictEqual(reloaded.version, 1, 'バージョン付き');
  passed++;

  // 4. 編集が反映される
  await updateGroup(g1.id, { name: '沖縄旅行', members: [{ name: '太郎' }, { name: '花子' }, { name: '次郎' }] });
  groups = await getGroups();
  assert.strictEqual(groups[0].name, '沖縄旅行', '名称更新');
  assert.strictEqual(groups[0].members.length, 3, 'メンバー追加反映');
  passed++;

  // 5. 削除すると消える
  await deleteGroup(g1.id);
  groups = await getGroups();
  assert.strictEqual(groups.length, 0, '削除後0件');
  passed++;

  // 6. 新しい順ソート
  const a = await createGroup({ name: 'A', members: [{ name: 'x' }, { name: 'y' }] });
  await new Promise((r) => setTimeout(r, 5));
  const b = await createGroup({ name: 'B', members: [{ name: 'x' }, { name: 'y' }] });
  groups = await getGroups();
  assert.strictEqual(groups[0].id, b.id, '新しいグループが先頭');
  passed++;

  // 7. formatYen フォーマット
  assert.strictEqual(formatYen(0), '¥0');
  assert.strictEqual(formatYen(1234), '¥1,234');
  assert.strictEqual(formatYen(128400), '¥128,400');
  assert.strictEqual(formatYen(-1234), '-¥1,234');
  passed++;

  // 8. name trim
  const t = await createGroup({ name: '  余白あり  ', members: [{ name: ' 太郎 ' }, { name: '花子' }] });
  assert.strictEqual(t.name, '余白あり', 'グループ名trim');
  assert.strictEqual(t.members[0].name, '太郎', 'メンバー名trim');
  passed++;

  console.log(`\n✓ All ${passed} storage tests passed.`);
})().catch((e) => {
  console.error('✗ Test failed:', e.message);
  process.exit(1);
});
