# メディア保存 — モバイル (Expo)

X / Instagram / TikTok / YouTube の公開投稿 URL からメディアを取得・保存する React Native (Expo) アプリです。Web と同じ `POST /api/resolve` を呼び出します。

## セットアップ

```bash
cd mobile
cp .env.example .env
bun install
npx expo start
```

- iOS: `npx expo start --ios`
- Android: `npx expo start --android`
- 実機: Expo Go で QR（AdMob は Expo Go 非対応。開発ビルドが必要）

## API

`EXPO_PUBLIC_API_URL` は Next.js の `/api` ベース URL（例: `http://127.0.0.1:3000/api`）。
Docker Compose の web+worker 起動後に `/api/resolve` を呼び出します。

## AdMob

- 既定は Google 公式テスト App ID / バナー ID
- 本番 ID は `.env` の `EXPO_PUBLIC_ADMOB_*`（`EXPO_PUBLIC_ADMOB_USE_TEST=0`）
- `react-native-google-mobile-ads` は EAS Build / 開発クライアントが必要

## EAS Build（概要）

```bash
eas-cli を入れたうえで:
eas login
eas build --platform android --profile preview
eas build --platform ios --profile production
```

iOS 本番は EAS 以外に Xcode Cloud も選択肢です（GHA macos 必須ではありません）。

## 免責

各プラットフォーム規約・著作権法を遵守してください。
