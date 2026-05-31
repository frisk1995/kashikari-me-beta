# Kashikari.me

旅行・日常での立て替えを記録し、「誰が誰にいくら払えばよいか」を提示する iPhone 向けアプリ。

## 概要

- アカウント登録不要、オフライン完結
- 「貸した人」「借りた人」を選ぶだけのシンプルな記録
- 精算案は直接の貸し借りペアごとに計算（三角精算なし）
- テーマカラーを設定画面から切り替え可能

## 起動方法

```bash
# 依存インストール（初回のみ）
npm install

# Expo Go（実機・シミュレータ）
npx expo start

# iOS シミュレータ直接起動
npx expo start --ios

# Web ブラウザ
npx expo start --web
```

**テスト URL（Web）:** `http://localhost:8081`

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | Expo SDK 54 / React Native 0.81 |
| ルーティング | expo-router v6（file-based） |
| 言語 | TypeScript |
| 永続化 | AsyncStorage（`kashikari.me/appData`） |
| スタイリング | React Native StyleSheet（グラデーションなし・フラット） |
| フォント | Noto Sans JP / Baloo 2 |
| アイコン | @expo/vector-icons（Ionicons） |

## 主要機能

### グループ管理
- グループの作成・編集・削除
- メンバーの追加・編集・削除

### 支払い記録（貸し借り）
- 貸した人・借りた人・金額・用途・日付を記録
- 貸した人を選ぶと借りた人の選択肢から自動除外
- 借りた人はデフォルト未選択

### 精算
- **支払いタブ**: 未精算の貸し借り一覧
- **精算タブ**: 直接ペアベースの精算案（「A が B に ¥X,XXX 払う」形式）
- **精算済みタブ**: 「まとめて精算する」後の履歴
- 精算結果のテキスト共有・コピー

### テーマ切り替え
設定画面（ホーム右上の歯車アイコン）から選択可能：

| テーマ | 説明 |
|--------|------|
| グリーン | パステルミントグリーン |
| ブルー | インディゴブルー |
| ライト | チャコール×グレーのモノトーン |
| ダーク | ブラックベースのモノトーン |
| コーラル | デフォルト |

## ディレクトリ構成

```
app/                    # expo-router 画面
  index.tsx             # グループ一覧（ホーム）
  settings.tsx          # 設定（テーマ切り替え）
  group/
    new.tsx             # グループ作成
    [id]/
      index.tsx         # グループ詳細（支払い・精算・精算済みタブ）
      edit.tsx          # グループ編集・削除
      payment/
        new.tsx         # 支払い追加
        [paymentId]/edit.tsx  # 支払い編集・削除

src/
  types/index.ts        # 型定義（Group, Member, Payment, Transfer）
  storage/index.ts      # AsyncStorage ラッパー（CRUD・精算済み一括処理）
  context/
    ThemeContext.tsx    # テーマ Context（useTheme フック）
  theme.ts              # デザイントークン・5テーマ定義
  utils/
    settlement.ts       # 精算計算（直接ペアベースアルゴリズム）
    share.ts            # 精算結果テキスト共有
    confirm.ts          # 破壊的操作の確認ダイアログ（Web/native 分岐）
    categories.ts       # （廃止済み）
  components/           # 共通コンポーネント

docs/
  spec.md               # 製品仕様書（Planner 生成）
  design.md             # デザイン仕様書（UIDesigner 確定）
  progress.md           # 実装進捗（Generator 記録）
  decisions.md          # 仕様変更・設計判断の記録
  feedback/             # スプリント評価結果（Evaluator 出力）
```

## データ構造

```typescript
interface Group {
  id: string;
  name: string;
  members: Member[];
  payments: Payment[];
}

interface Payment {
  id: string;
  amount: number;
  lenderId: string;      // 貸した人
  borrowerIds: string[]; // 借りた人（複数可）
  memo: string;
  date: string;          // YYYY-MM-DD
  createdAt: number;
  settled: boolean;      // true = 精算済み
}
```

## 開発パイプライン

このプロジェクトは Planner → UIDesigner → Generator → Evaluator の4エージェントによる自動開発パイプラインで構築されました。詳細は `CLAUDE.md` を参照。
