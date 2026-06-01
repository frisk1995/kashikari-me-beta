# EAS 証明書・ビルド設定

## 概要

EAS（Expo Application Services）による iOS ビルド・証明書管理の設定を記録する。

## eas.json プロファイル

| プロファイル | 配布方式 | 用途 |
|-------------|---------|------|
| development | internal | 開発中の実機テスト（Development Client 使用） |
| preview | internal | レビュー・ステークホルダー向け TestFlight 前の内部配布 |
| production | App Store | App Store 申請用本番ビルド |

## iOS ビルド設定

- **バンドルID:** `me.kashikari.beta`
- **buildNumber:** `1`（初回リリース、`autoIncrement: true` により production ビルド時に自動インクリメント）
- **リソースクラス:** `m-medium`（Apple Silicon ビルドマシン）
- **証明書管理:** EAS による自動管理（`credentialsSource` 未指定 = managed）

## App Store Connect 設定

- **Apple ID:** toshiki.priv@gmail.com
- **ascAppId:** App Store Connect でアプリ登録後に記入
- **appleTeamId:** Apple Developer ポータルで確認後に記入

## ビルド実行コマンド

```bash
# 開発ビルド
eas build --platform ios --profile development

# プレビュービルド（TestFlight 等での内部テスト）
eas build --platform ios --profile preview

# 本番ビルド（App Store 申請用）
eas build --platform ios --profile production

# App Store へ申請（本番ビルド完了後）
eas submit --platform ios --profile production
```

## 証明書の自動管理について

EAS Managed 方式を採用しているため、以下は EAS が自動で処理する：

- Distribution Certificate（配布証明書）の生成・管理
- Provisioning Profile の生成・更新
- Push Notification Certificate（将来の通知機能追加時）

## 注意事項

- Apple Developer Program への加入（年間 $99）が App Store 申請に必要
- 初回ビルド時に `eas login` でアカウント認証が必要
- `eas build:configure` を実行すると `app.json` の EAS 設定が自動補完される

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-06-01 | 初回設定。eas.json 作成、buildNumber / versionCode 追加 |
