# 仕様変更・設計判断の記録

このファイルはプロトタイプ開発中にユーザーから受けた指示・仕様変更・設計判断を記録する。
次回の開発・改修時に参照すること。

---

## 支払い入力モデル

**指示:** カテゴリ・割り勘モードは不要。「貸した人」と「借りた人」のみを選択する。

- `category`、`splitMode`、`customShares` フィールドを廃止
- `paidById` → `lenderId`、`splitMemberIds` → `borrowerIds[]` に変更
- 貸した人を選択すると、借りた人の選択肢から自動除外する
- 借りた人のデフォルトは「未選択」（全員選択ではない）
- 「全員」ボタンは不要なため削除

---

## 精算アルゴリズム

**指示:** 3人以上の場合、直接関係のないユーザー間の精算案（三角精算）を提示しない。

例: A→B ¥2,000、B→C ¥2,000 の場合
- ✓ 「B は A に ¥2,000 払う」「C は B に ¥2,000 払う」
- ✗ 「C は A に ¥2,000 払う」（A と C に直接の貸し借りなし）

**実装:** 直接ペアごとに集計し、同ペア双方向のみネット相殺。greedy min-transfers アルゴリズムは使わない。

---

## 精算フロー（タブ構成）

**指示:**
- 支払いタブ: 未精算のみ表示
- 精算タブ: 残高・支出割合は不要。誰が誰に払うかのみ表示
- 精算済みタブ: 精算済み履歴を閲覧できる新タブを追加
- 「まとめて精算する」ボタンで全未精算支払いを一括精算済みに移動

**実装:** `Payment.settled: boolean` フィールドで管理。`settleAllPayments()` で一括更新。

---

## 表示項目

**指示（グループ一覧・グループ詳細）:**
- 総支出ではなく「未精算金額」を表示する
- 1人あたりの割り勘金額は表示不要

---

## 日付入力

**指示:** 支払い記録に「借りた日付」を入力できるようにする。

- `Payment.date: string`（YYYY-MM-DD）を追加
- デフォルトは今日の日付
- Web: `<input type="date">` のネイティブピッカー
- iOS: テキスト入力（YYYY-MM-DD 形式）

---

## まとめて精算ボタン

**指示:** 精算タブに「まとめて精算する」ボタンを追加。

- タップ → 確認ダイアログ → 全未精算支払いを精算済みに
- 全件精算済みの場合はボタンを非表示

---

## デザイン方針

**指示:** グラデーションをやめてフラット・マテリアルデザインにする。

- `LinearGradient` を全コンポーネントから削除
- ヘッダー・ボタン・FAB・アイコンタイル・セグメントタブすべてソリッドカラーに統一
- 奥行きは影（shadow）のみで表現

---

## テーマ切り替え

**指示:** 設定画面でカラーテーマを選択できるようにする。

実装テーマ一覧:
| ID | 名称 | 特徴 |
|----|------|------|
| `green` | グリーン | パステルミント `#6FCFA0` |
| `blue` | ブルー | インディゴ `#2563EB` |
| `light` | ライト | チャコール×グレーのモノトーン `#424242` |
| `dark` | ダーク | ブラックベースのモノトーン `#1C1C1C` |
| `coral` | コーラル | デフォルト `#FF6B6B` |

- ダークテーマはモノトーン（紫・ティールなどのアクセントなし）
- 設定はアプリ再起動後も維持（AsyncStorage: `kashikari.me/themeId`）

---

## アプリ名

**最終決定:** `Kashikari.me`（英語表記）

経緯: 日本語「かしかり.me」→ 英語「Kashikari.me」に変更（ユーザー判断）

---

## iOS / 検証環境

- Expo Go（SDK 54）で実機テスト
- iOS シミュレータ（Xcode 26.5 / iPhone 17）
- Web 検証: `npx expo start --web` → `http://localhost:8081`
- Playwright による自動テスト（Chromium・390×844 ビューポート）

---

## SafeArea 対応

`SafeAreaProvider` に `initialMetrics={initialWindowMetrics}` を渡すことで、
起動直後から正確な `insets.top` を取得できるようにしている。
ヘッダーの `paddingTop` は `insets.top + 6`（ホーム）。

---

## Firestore データ共有 + QRコード招待（アーキテクチャ変更）

**指示:** Firebase Firestore でグループ・支払いをリアルタイム共有し、QRコードでメンバーを招待できるようにする。

### データモデル
- **ユーザーID:** 端末ごとに UUID を `AsyncStorage`（key `kashikari.me/userId`）へ永続化。初回生成時に Firestore `users/{id}` を best-effort 作成。`expo-crypto` の `randomUUID()`（失敗時 v4 風フォールバック）。
- **Firestore 構造:**
  - `groups/{groupId}` … `name`/`color`/`icon`/`ownerId`/`participantIds[]`/`members[]`/`createdAt`/`updatedAt`
  - `groups/{groupId}/payments/{paymentId}` … `amount`/`lenderId`/`borrowerIds[]`/`memo`/`date`/`settled`/`createdAt`/`updatedAt`
- **型変更:** `Group` に `ownerId`/`participantIds` を追加、`Payment` に `groupId?` を追加。`Group.payments?` はローカルキャッシュ用に optional 残置（Firestore では subcollection 管理）。

### 共有・アクセス制御
- グループの可視性は `participantIds` で管理。`subscribeGroups` は全 groups を購読し、クライアント側で `participantIds.includes(userId) || ownerId===userId` をフィルタ。
- 招待 = QRコード（`kashikarime://join/{groupId}`）。スキャンまたはディープリンクで `joinGroup` → `participantIds` に `arrayUnion`。
- `firestore.rules` はプロトタイプ用オープンルール。**本番前に participantIds ベースのルールへ要強化。**

### リアルタイム同期
- 一覧・詳細とも `onSnapshot` 購読に統一。詳細画面の `useFocusEffect` 手動 reload は廃止。
- グループ一覧では各グループの payments を個別購読して未精算合計（`GroupCard.unsettledAmount`）を算出。

### フォールバック方針
- `src/firebase/config.ts` が placeholder（未設定）でもアプリは起動する。`db=null` 時、購読系は空配列通知＋no-op unsubscribe、書き込み系は throw → 呼び出し側で Alert。
- 実 DB 同期・参加の検証には Firebase コンソールの設定値貼り付けと `firestore.rules` デプロイが必要。

### スキーム / ルーティング
- `scheme: "kashikarime"`（既存）。`app/join/[groupId].tsx` が expo-router で `kashikarime://join/{id}` を処理。
- `app/scan.tsx` は `expo-camera` の `CameraView` + `useCameraPermissions`。
