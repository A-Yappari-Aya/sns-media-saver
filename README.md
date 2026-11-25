# メディア保存 (sns-media-saver)

X (Twitter) / Instagram / TikTok / YouTube の**公開投稿**URLからメディア情報を取得し、ブラウザでダウンロードできる Web アプリです。

> 免責: 各プラットフォームの利用規約・著作権法を遵守してください。非公開コンテンツや権利侵害目的の利用は想定していません。抽出は非公式手法（yt-dlp）に依存するため、予告なく動作しなくなることがあります。

## 構成

| サービス | 役割 |
|---------|------|
| `web` | Next.js (App Router) UI + `/api/resolve` |
| `worker` | yt-dlp + ffmpeg によるメディア解決 |

Vercel 等のサーバーレスのみでは yt-dlp が動かないため、**本番では worker を別途ホスティング**してください。`WORKER_URL` で Web から接続します。

## 必要環境

- Node.js 22.12+
- （推奨）Docker / Docker Compose
- ローカル検証時: yt-dlp / ffmpeg

## クイックスタート（Docker Compose）

```bash
cp .env.example .env
# .env の WORKER_TOKEN を openssl rand -hex 32 などで必ず置き換える
docker compose up --build
```

- Web: http://localhost:3000
- Worker health: http://localhost:4100/health

## ローカル開発

### 1. 依存関係

```bash
bun install          # bun.lock が正（推奨）
# または npm install  # Node 22.12+ が必要。lock は bun.lock を使ってください
```

### 2. ワーカー起動

yt-dlp を PATH に置くか、`/workspace/bin/yt-dlp` 等を `YT_DLP_PATH` に指定:

```bash
export YT_DLP_PATH=yt-dlp
export PORT=4100
export WORKER_TOKEN=change-me-local-only   # または ALLOW_INSECURE_WORKER_NO_AUTH=true
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
| `WORKER_TOKEN` | Web↔ワーカー間の共有シークレット（必須。未設定ならワーカーは起動しない） |
| `ALLOW_INSECURE_WORKER_NO_AUTH` | `true` のときだけ、本番以外でトークンなし起動を許可（ループバック開発用） |
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

- `__tests__/validate-url.test.ts`: URL バリデータ（許可ホスト・私有IP拒否など）
- `__tests__/resolve-route.test.ts`: `/api/resolve`（入力検証・ワーカー未設定・トークン転送・障害時・レート制限）
- `__tests__/rate-limit.test.ts`: レート制限とクライアント IP 判定（`cf-connecting-ip` 優先）
- `__tests__/worker-lib.test.ts`: ワーカーのホスト判定・yt-dlp 結果の変換・トークン認証・起動設定
- `__tests__/worker-http.test.ts`: ワーカー HTTP（401/400/200、本番でトークン無しなら起動しない）

`npm run check` で型チェック・テスト・本番ビルドをまとめて実行します。

## デプロイ

構成は **Web（Next.js）を Cloudflare Workers**、**ワーカー（yt-dlp）を Docker が動くサーバー** に置く形を想定しています。
yt-dlp / ffmpeg は Python とネイティブバイナリが要るので、Cloudflare Workers 本体では動きません。

```
ブラウザ ──> Cloudflare Workers (Next.js / OpenNext) ──Bearer WORKER_TOKEN──> worker (Docker, :4100)
```

### 0. 事前チェック（ローカル）

```bash
bun install          # bun.lock が正（Docker の web イメージもこれを使う）
npm run check        # 型チェック + テスト + next build
npm run cf:build     # OpenNext で .open-next/ を生成（Cloudflare アカウント不要）
npx wrangler dev     # http://localhost:8787 でローカル確認（アカウント不要）
```

### 1. ワーカー（yt-dlp）をホスト

Docker が動く VPS（既存の VPS でも可）で:

```bash
export WORKER_TOKEN="$(openssl rand -hex 32)"   # Web 側と同じ値を使う
docker build -t sns-media-saver-worker ./worker
docker run -d --name sns-worker --restart unless-stopped \
  -e WORKER_TOKEN="$WORKER_TOKEN" -p 4100:4100 sns-media-saver-worker
curl http://<server>:4100/health
```

- `WORKER_TOKEN` は必須です。未設定のまま `NODE_ENV=production`（ワーカーイメージの既定）で起動するとプロセスが終了します。`/resolve` は `Authorization: Bearer <token>` が無いと 401 を返します。ローカルでトークンなしを試すときだけ `ALLOW_INSECURE_WORKER_NO_AUTH=true` を付けます（本番では無効）。
- Cloudflare Workers からは**公開 HTTPS の URL**で到達できる必要があります（`global_fetch_strictly_public` を有効にしているため、プライベート IP には届きません）。Caddy などのリバースプロキシで TLS を終端するか、Cloudflare Tunnel を使ってください。
- yt-dlp は SNS 側の仕様変更で壊れやすいので、定期的にイメージを作り直して最新版にしてください。
- 代替: Fly.io / Render / Cloud Run でも `worker/Dockerfile` がそのまま使えます。Cloudflare Containers も選択肢ですが Workers Paid プランが必要です（未検証）。

### 2. Web を Cloudflare Workers にデプロイ

設定は `wrangler.jsonc` と `open-next.config.ts` に用意済みです。

```bash
npx wrangler login                         # 初回のみ（ブラウザで Cloudflare にログイン）
npx wrangler secret put WORKER_URL         # 例: https://worker.example.com
npx wrangler secret put WORKER_TOKEN       # 手順1と同じ値

# 広告 ID はビルド時に埋め込まれる（NEXT_PUBLIC_*）ので、ビルド前に環境変数で渡す
export NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxx
export NEXT_PUBLIC_ADSENSE_SLOT_TOP=xxxxxxxx
export NEXT_PUBLIC_ADSENSE_SLOT_RESULT=xxxxxxxx

npm run cf:deploy                          # = opennextjs-cloudflare build && deploy
```

デプロイ先は `https://sns-media-saver.<your-subdomain>.workers.dev` になります。独自ドメインは Cloudflare ダッシュボードの Workers → Settings → Domains & Routes で追加します。

Git 連携で自動デプロイしたい場合は、Cloudflare ダッシュボードの Workers Builds でこのリポジトリをつなぎ、ビルドコマンドを `npx opennextjs-cloudflare build`、デプロイコマンドを `npx opennextjs-cloudflare deploy` にしてください。

### 3. デプロイ後の確認

```bash
curl https://<your-worker>.workers.dev/api/health   # {"ok":true,...,"worker":"ok"} なら Web→ワーカーが通っている
```

### 広告（AdSense）について

- AdSense の審査には独自ドメイン・プライバシーポリシー（`/privacy`）・利用規約（`/terms`）が必要です。
- 動画ダウンロード系サイトは AdSense のポリシー（著作権で保護されたコンテンツへのアクセス手段の提供）で審査に落ちたり停止されたりする可能性があります。公開前に最新のポリシーを確認してください。

### 既知の制限

- レート制限はメモリ上のカウンタなので、Workers のインスタンスごとに別々に数えられます。厳密にしたい場合は Cloudflare の Rate Limiting ルールか KV / Durable Objects に置き換えてください。
- YouTube などの直リンクは、取得したサーバーの IP に紐づく場合があり、ブラウザから直接落とせないことがあります（未検証）。

### Docker Compose で一式を自前サーバーに置く場合

```bash
cp .env.example .env    # WORKER_TOKEN を必ず本番用の値に置き換える
docker compose up -d --build
```

## セキュリティ上の注意

- 許可ホスト以外は拒否
- レート制限・タイムアウト・サイズ上限あり
- 資格情報付き URL / ローカルアドレスは拒否
- それでも規約違反・著作権リスクは利用者側に残ります（利用規約 `/terms` 参照）

## ライセンス

個人・検証用途向けのサンプル実装です。本番運用前に法務・各 SNS 規約を確認してください。
