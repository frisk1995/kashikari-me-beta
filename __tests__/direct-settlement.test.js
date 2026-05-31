/**
 * 直接ペアベース精算（computeDirectTransfers / computeSettlement）の検証。
 *
 * settlement.ts を TypeScript ストリップしてロードする（他テストと同方式）。
 * 実行: node __tests__/direct-settlement.test.js
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const settlementPath = path.resolve(__dirname, '../src/utils/settlement.ts');
let tsSrc = fs.readFileSync(settlementPath, 'utf8');
tsSrc = tsSrc.replace(/^import type .*$/gm, '');
const jsOut = ts.transpileModule(tsSrc, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
}).outputText;

const sandboxModule = { exports: {} };
const fn = new Function('module', 'exports', 'require', jsOut);
fn(sandboxModule, sandboxModule.exports, require);
const { computeDirectTransfers, computeSettlement, buildSettlementText } = sandboxModule.exports;

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error('  x FAIL:', msg);
  }
}

const members = [
  { id: 'A', name: 'A' },
  { id: 'B', name: 'B' },
  { id: 'C', name: 'C' },
];

function pay(id, lenderId, amount, borrowerIds, settled = false) {
  return { id, lenderId, amount, memo: '', borrowerIds, date: '2026-01-01', createdAt: 0, updatedAt: 0, settled };
}

function byKey(transfers) {
  return Object.fromEntries(transfers.map((t) => [t.key, t.amount]));
}

// --- 1. ショートカット禁止: A->B 2000, B->C 2000 ---
{
  const payments = [pay('p1', 'A', 2000, ['B']), pay('p2', 'B', 2000, ['C'])];
  const transfers = computeDirectTransfers(members, payments);
  const m = byKey(transfers);
  // B が A に 2000、C が B に 2000
  assert(m['B->A'] === 2000, '1: B->A = 2000');
  assert(m['C->B'] === 2000, '1: C->B = 2000');
  assert(m['C->A'] === undefined, '1: C->A は作らない（三角精算禁止）');
  assert(transfers.length === 2, '1: 送金は2件');
}

// --- 2. 同ペア双方向の相殺: A->B 3000, B->A 1000 => B->A 2000 ---
{
  const payments = [pay('p1', 'A', 3000, ['B']), pay('p2', 'B', 1000, ['A'])];
  const transfers = computeDirectTransfers(members, payments);
  const m = byKey(transfers);
  assert(m['B->A'] === 2000, '2: 相殺後 B->A = 2000');
  assert(m['A->B'] === undefined, '2: 逆方向は消える');
  assert(transfers.length === 1, '2: 送金は1件');
}

// --- 3. 完全相殺はゼロで除外: A->B 1000, B->A 1000 ---
{
  const payments = [pay('p1', 'A', 1000, ['B']), pay('p2', 'B', 1000, ['A'])];
  const transfers = computeDirectTransfers(members, payments);
  assert(transfers.length === 0, '3: 完全相殺で送金0件');
}

// --- 4. 複数借り手の均等割り: A が 3000 を A,B,C に ---
{
  const payments = [pay('p1', 'A', 3000, ['A', 'B', 'C'])];
  const transfers = computeDirectTransfers(members, payments);
  const m = byKey(transfers);
  // A 自身の負担は精算不要。B->A 1000, C->A 1000
  assert(m['B->A'] === 1000, '4: B->A = 1000');
  assert(m['C->A'] === 1000, '4: C->A = 1000');
  assert(transfers.length === 2, '4: 送金は2件');
}

// --- 5. computeSettlement は settled:false のみ対象 ---
{
  const g = { id: 'g', name: 'T', members, createdAt: 0, updatedAt: 0 };
  const payments = [
    pay('p1', 'A', 2000, ['B'], false),
    pay('p2', 'A', 5000, ['B'], true), // 精算済みは除外
  ];
  const r = computeSettlement(g, payments);
  assert(r.total === 2000, '5: 総支出は未精算のみ = 2000');
  assert(r.transfers.length === 1, '5: 未精算分の送金のみ');
  assert(byKey(r.transfers)['B->A'] === 2000, '5: B->A = 2000');
}

// --- 6. 全て精算済みなら送金0・総支出0 ---
{
  const g = { id: 'g', name: 'T', members, createdAt: 0, updatedAt: 0 };
  const payments = [pay('p1', 'A', 2000, ['B'], true)];
  const r = computeSettlement(g, payments);
  assert(r.total === 0, '6: 総支出 0');
  assert(r.transfers.length === 0, '6: 送金0件');
  const text = buildSettlementText(g, payments);
  assert(text.includes('みんな精算済み'), '6: 共有テキストは精算済み文言');
}

console.log(`\ndirect-settlement: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
