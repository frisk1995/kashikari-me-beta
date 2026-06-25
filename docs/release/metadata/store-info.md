# App Store 申請情報

## 基本情報

| 項目 | 値 |
|------|-----|
| アプリ名 | Kashikari.me ー割り勘・立替精算 |
| バンドルID | com.kashikarime.ios |
| バージョン | 1.0.0 |
| ビルド番号 | 1 |
| プラットフォーム | iOS のみ |
| 最小 iOS バージョン | iOS 16.0 以上（Expo SDK 54 の要件に準拠） |
| デバイス | iPhone のみ（iPad 非対応: supportsTablet: false） |
| 向き | 縦向きのみ（portrait） |

## カテゴリ

| 項目 | 値 |
|------|-----|
| プライマリカテゴリ | Finance（ファイナンス） |
| セカンダリカテゴリ | Utilities（ユーティリティ）※任意 |

## 価格・販売

| 項目 | 値 |
|------|-----|
| 価格 | 無料（Free） |
| アプリ内課金 | あり（月額サブスクリプション ¥300） |
| サブスクリプション | Premium Monthly（com.kashikarime.ios.premium.monthly） |
| 広告 | なし（IDFA 不使用） |

## 連絡先・サポート情報

| 項目 | 値 |
|------|-----|
| 開発者名 | Toshiki Kojima |
| メールアドレス | kashikari.me.26@gmail.com |
| サポートURL | https://toshimaru-dev.github.io/kashikari.me/ |
| プライバシーポリシーURL | https://toshimaru-dev.github.io/kashikari.me/privacy-policy.html |
| マーケティングURL | https://toshimaru-dev.github.io/kashikari.me/ |

## App Store Connect でのアプリ登録手順

1. [App Store Connect](https://appstoreconnect.apple.com) にログイン
2. 「マイ App」→「＋」→「新規 App」をクリック
3. プラットフォーム: iOS を選択
4. 名前: `Kashikari.me ー割り勘・立替精算`
5. プライマリ言語: 日本語
6. バンドル ID: `com.kashikarime.ios`
7. SKU: `kashikarime-001`
8. アクセス: 制限なし

## プライバシー申告（App Privacy）

App Store Connect の「App Privacy」セクションで以下を申告する：

- ユーザーIDをクラウド（Firebase）に保存（匿名認証）
- グループ・支払いデータをクラウドに保存
- 広告・トラッキング目的では使用しない

## 年齢制限（Age Rating）

App Store Connect の「App Rating」でアンケートに回答：

- 暴力・性的コンテンツ・ギャンブル等: すべて「なし」
- 想定年齢制限: **4+**（全年齢対象）

## 審査情報（Review Information）

| 項目 | 内容 |
|------|------|
| デモアカウント | 不要（匿名認証のためアカウント登録不要） |
| 審査担当者へのメモ | 本アプリはアカウント登録不要で、起動直後からすぐに利用できます。データはFirebase（クラウド）に保存されます。課金機能（月額サブスクリプション）を含みます。 |

## スクリーンショット要件

`/docs/release/screenshots/requirements.md` を参照。

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-06-01 | store-info.md 初版作成 |
| 2026-06-23 | アプリ名・バンドルID・URL・課金情報を最新化 |
