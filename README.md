# メディア保存 (sns-media-saver)

X (Twitter) / Instagram / TikTok / YouTube の**公開投稿**URLからメディア情報を取得し、ブラウザでダウンロードできる Web アプリです。

> 免責: 各プラットフォームの利用規約・著作権法を遵守してください。非公開コンテンツや権利侵害目的の利用は想定していません。抽出は非公式手法（yt-dlp）に依存するため、予告なく動作しなくなることがあります。

## 構成

| サービス | 役割 |
|---------|------|
| `web` | Next.js (App Router) UI + `/api/resolve` |
| `worker` | yt-dlp + ffmpeg によるメディア解決 |
| `mobile` | Expo (iOS / Android) — 同一 `/api/resolve` |

Vercel 等のサーバーレスのみでは yt-dlp が動かないため、**本番では worker を別途ホスティング**してください。`WORKER_URL` で Web から接続します。

## 必要環境

- Node.js 20+
- （推奨）Docker / Docker Compose
- ローカル検証時: yt-dlp / ffmpeg

## クイックスタート（Docker Compose）

```bash
cp .env.example .env
docker compose up --build
```

- Web: http://localhost:3000
- Worker health: http://localhost:4100/health

## ローカル開発

### 1. 依存関係

```bash
npm install
# または bun install
```

### 2. ワーカー起動

yt-dlp を PATH に置くか、`/workspace/bin/yt-dlp` 等を `YT_DLP_PATH` に指定:

```bash
export YT_DLP_PATH=yt-dlp
export PORT=4100
npm run worker:start
```

### 3. Next.js 起動

```bash
cp .env.example .env.local
# WORKER_URL=http://127.0.0.1:4100
npm run dev
```

http://localhost:3000 を開きます。

## 環境変数

`.env.example` を参照。主なもの:

| 変数 | 説明 |
|------|------|
| `WORKER_URL` | ワーカーのベース URL |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | AdSense クライアント ID |
| `NEXT_PUBLIC_ADSENSE_SLOT_TOP` / `_RESULT` | 広告スロット |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_SEC` | API レート制限 |
| `RESOLVE_TIMEOUT_MS` | 解決タイムアウト |
| `YT_DLP_PATH` | yt-dlp バイナリパス |

未設定の AdSense 変数では UI にプレースホルダーが表示されます。

## テスト

```bash
npm test
```

URL バリデータ（許可ホスト・私有IP拒否など）のスモークテストが走ります。

## デプロイ

1. **Web**: Vercel に Next アプリをデプロイ。環境変数に `WORKER_URL`（公開到達可能なワーカー）を設定。
2. **Worker**: VPS / Fly.io / Render / Cloud Run 等で `worker/Dockerfile` をデプロイ。ポート 4100。
3. Web からワーカーへはサーバーサイドのみ通信（ブラウザにワーカーを晒さない構成を推奨）。

## セキュリティ上の注意

- 許可ホスト以外は拒否
- レート制限・タイムアウト・サイズ上限あり
- 資格情報付き URL / ローカルアドレスは拒否
- それでも規約違反・著作権リスクは利用者側に残ります（利用規約 `/terms` 参照）


## モバイルアプリ (Expo / React Native)

`mobile/` に iOS / Android 向け Expo アプリがあります。Web と同じ `POST /api/resolve`（`EXPO_PUBLIC_API_URL`）を呼び出します。

### 起動

```bash
# 先に Web + worker を起動（例: docker compose up --build）
cd mobile
cp .env.example .env
bun install
npx expo start
```

- iOS Simulator: `npx expo start --ios`
- Android Emulator: `npx expo start --android`（API 既定は `http://10.0.2.2:3000/api`）
- 実機: LAN 上のマシン IP を `EXPO_PUBLIC_API_URL` に設定

利用規約・プライバシーは `EXPO_PUBLIC_WEB_ORIGIN` の `/terms` `/privacy` を WebBrowser で開きます（失敗時はアプリ内テキスト）。

### AdMob

- パッケージ: `react-native-google-mobile-ads`
- 既定は Google テスト用 App ID / バナー ID（ホーム・結果画面にバナー）
- 本番 ID は `EXPO_PUBLIC_ADMOB_*` と `EXPO_PUBLIC_ADMOB_USE_TEST=0`
- Expo Go では広告ネイティブモジュールは動きません。EAS の development / production ビルドが必要です。

### EAS Build / Xcode Cloud

```bash
cd mobile
eas login
eas build --platform android --profile preview
eas build --platform ios --profile production
```

iOS の本番配信では Xcode Cloud を使う選択肢もあります。GitHub Actions の macOS ランナーを必須にはしていません。

Docker Compose の `web` / `worker` 構成は変更していません。

## ライセンス

個人・検証用途向けのサンプル実装です。本番運用前に法務・各 SNS 規約を確認してください。
