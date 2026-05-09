# SETUP — リカーショップゴワ LINE問い合わせ進捗管理プラットフォーム

> 開発・運用環境のセットアップ手順書
> 対象: 開発者・運用担当（株式会社デジライズ / 株式会社リカーショップゴワ システム担当）

---

## 0. このドキュメントの読み方

| 起動シナリオ | 所要時間 | 必要なもの |
|---|---|---|
| **A. デモモード（最速）** | 5〜10分 | Node.js + pnpm のみ |
| **B. 開発モード（DB付き）** | 15〜30分 | Node.js + pnpm + SQLite |
| **C. 本番モード（完全）** | 1〜2時間 | Postgres + Google OAuth + LINE Channel + Google Chat Webhook |

> **Note**: お客様商談用デモを起動するだけなら **A** で十分です。

---

## 1. 前提環境

### 1.1 必須ソフトウェア

| ツール | 推奨バージョン | 確認コマンド |
|---|---|---|
| Node.js | 20 LTS 以上（22 推奨） | `node -v` |
| pnpm | 9.x 以上 | `pnpm -v` |
| Git | 2.40 以上 | `git --version` |

#### macOS でのインストール例（Homebrew）

```bash
brew install node
npm install -g pnpm
```

#### nvm で Node.js を切り替える場合

```bash
nvm install 20
nvm use 20
```

### 1.2 推奨ソフトウェア（本番運用時）

| ツール | 用途 |
|---|---|
| Vercel CLI | デプロイ自動化 (`npm i -g vercel`) |
| ngrok / cloudflared | LINE Webhook をローカルで受信する際のトンネル |
| Postgres (Supabase / Neon) | 本番 DB |

### 1.3 アカウント類

| サービス | 用途 | 取得タイミング |
|---|---|---|
| Google Cloud Console | OAuth クライアント（Sign in with Google） | 開発開始時 |
| LINE Developers | LINE Messaging API Channel | LINE連携を有効化する直前 |
| Google Workspace | Google Chat Webhook | 通知連携時 |
| Vercel | ホスティング | 商談デモ・本番デプロイ時 |
| Supabase / Neon | Postgres ホスティング | 本番化前 |

---

## 2. ローカル開発セットアップ（Step by Step）

### Step 1. リポジトリをクローン

```bash
cd ~/work/digirise/clients/post-order/active/gowa/02_post-order/products/issue-01-line-inquiry
ls app  # → README.md, package.json, prisma, src, ...
cd app
```

### Step 2. 依存パッケージをインストール

```bash
pnpm install
```

`postinstall` フックで `prisma generate` が自動実行されます。

> **Warning**: `npm install` ではなく **pnpm を使用してください**。`pnpm-lock.yaml` が正です。

### Step 3. 環境変数ファイルを準備

```bash
cp .env.example .env.local
```

最低限の値を埋めます（DEMOモード起動なら以下だけで OK）。

```bash
# .env.local
AUTH_SECRET="$(openssl rand -base64 32)"
DATABASE_URL="file:./dev.db"
DEMO_MODE=true
NEXT_PUBLIC_DEMO_MODE=true
ALLOWED_EMAIL_DOMAINS=gowa58.co.jp,digirise.ai
```

### Step 4. データベースの初期化

```bash
pnpm db:push    # schema.prisma → SQLite に反映
pnpm db:seed    # シードデータ投入（顧客・チケット・マッピング・ユーザー）
```

> **Note**: SQLiteファイル `prisma/dev.db` がカレントディレクトリ直下に生成されます。

リセットしたい場合：

```bash
pnpm db:reset   # dev.db を削除 → push → seed を一括実行
```

### Step 5. 開発サーバ起動

```bash
pnpm dev
```

ブラウザで http://localhost:3000 を開きます。

ログイン画面で「**他のロールで試す**」から `kowa`（後和専務） / `staff_office`（事務員） / `driver`（ドライバー） / `manager` / `finance` を切り替え可能です。

---

## 3. 環境変数の取得方法

### 3.1 AUTH_SECRET（NextAuth用シークレット）

```bash
openssl rand -base64 32
```

> **Warning**: 本番と開発で **必ず別の値**を使ってください。Gitにコミット禁止。

### 3.2 Google OAuth（AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET）

1. https://console.cloud.google.com/ にアクセス
2. プロジェクトを選択（無ければ「新しいプロジェクト」作成）
3. 左メニュー > **APIs & Services** > **Credentials**
4. **+ CREATE CREDENTIALS** > **OAuth client ID**
5. Application type: **Web application**
6. Name: `gowa-line-inquiry-platform-dev`（任意）
7. **Authorized redirect URIs** に以下を追加:
   - `http://localhost:3000/api/auth/callback/google`（開発用）
   - `https://your-domain.vercel.app/api/auth/callback/google`（本番用）
8. **CREATE** → 表示された **Client ID** と **Client Secret** をコピー
9. `.env.local` に貼り付け:
   ```bash
   AUTH_GOOGLE_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
   AUTH_GOOGLE_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
   ```

> **Note**: 開発と本番で **別の OAuth Client を作る**ことを強く推奨。redirect_uri ミスマッチでハマるとつらいです。

### 3.3 LINE Messaging API（LINE_CHANNEL_*）

1. https://developers.line.biz/console/ にアクセス
2. **Provider** を作成（無ければ）→ プロバイダ名: `リカーショップゴワ`
3. **新規チャネル** > **Messaging API** を選択
4. 以下を入力:
   - チャネル名: `ゴワ業務管理プラットフォーム（開発用）`
   - チャネル説明: `LINE問い合わせ進捗管理`
   - 大業種: `ライフスタイル`
   - 小業種: `その他ライフスタイル`
5. 作成完了後、以下の3つを取得:

   | 項目 | 取得場所 |
   |---|---|
   | `LINE_CHANNEL_ID` | チャネル基本設定 > チャネルID |
   | `LINE_CHANNEL_SECRET` | チャネル基本設定 > チャネルシークレット |
   | `LINE_CHANNEL_ACCESS_TOKEN` | Messaging API設定 > チャネルアクセストークン > 「発行」 |

6. **Webhook URL** を設定:
   - 開発用: ngrok の HTTPS URL + `/api/webhook/line`
   - 本番用: `https://your-domain.vercel.app/api/webhook/line`
7. **Webhookの利用** を **オン** にする
8. **応答メッセージ** を **オフ** にする（自動応答を切る）

> **Warning**: 本番と開発で **別のチャネル**を作ってください。テスト中の Webhook が顧客に届く事故を防ぐため。

#### ローカルで Webhook を受信する（ngrok）

```bash
brew install ngrok
ngrok http 3000
# 表示された https://xxxxxx.ngrok-free.app をLINE側のWebhook URLに設定
```

### 3.4 Google Chat Webhook URL

1. Google Chat で対象スペースを開く
2. スペース名横の **▼** > **アプリと統合** > **Webhook を管理**
3. **Webhook を追加**
   - 名前: `ゴワ業務管理プラットフォーム`
   - アバターURL: 任意
4. **保存** → URL をコピー
5. `.env.local`:
   ```bash
   GCHAT_WEBHOOK_URL=https://chat.googleapis.com/v1/spaces/AAAA.../messages?key=...&token=...
   ```

> **Note**: Webhook URL は **シークレット相当**です。Gitに絶対コミット禁止。

### 3.5 DATABASE_URL

#### 開発（SQLite）

```bash
DATABASE_URL="file:./dev.db"
```

#### Vercel デモ（SQLite を /tmp に置く）

```bash
DATABASE_URL="file:/tmp/dev.db"
```

> **Warning**: Vercel の `/tmp` は **コールドスタートで消える**ため、`vercel-build` スクリプトが起動毎に seed を流し直します（仕様上 OK）。

#### 本番（Postgres）

Supabase または Neon で DB を作成し、接続文字列を取得:

```bash
DATABASE_URL="postgres://user:password@host:5432/db?sslmode=require"
```

`prisma/schema.prisma` の `datasource db` の `provider` を `"postgresql"` に変更し、`pnpm db:push` を実行。

### 3.6 ALLOWED_EMAIL_DOMAINS

Google OAuth でログインを許可するメールドメインのカンマ区切り。

```bash
ALLOWED_EMAIL_DOMAINS=gowa58.co.jp,digirise.ai
```

> **Warning**: 空のままにすると **どのGoogleアカウントでもログイン可能**になります。本番では必ず設定してください。

---

## 4. Prisma 初期化

### 4.1 schema.prisma 概要

主要モデル:

| モデル | 用途 |
|---|---|
| `User` / `Account` / `Session` | NextAuth.js v5 標準 |
| `Customer` | 顧客マスタ（基幹BPS連携想定） |
| `Ticket` | チケット（業務管理プラットフォーム共通基盤） |
| `Message` | チケット内のスレッドメッセージ |
| `LineMapping` | LINE userId ↔ 顧客コード マッピング |
| `LineMessageLog` | LINE Webhook 受信ログ |
| `GchatSpace` / `GchatThread` / `GchatMessage` | Google Chat スペース・ダミー |

詳細は [`DEVELOPMENT.md`](./DEVELOPMENT.md#dbスキーマ詳細) を参照。

### 4.2 主要コマンド

| コマンド | 動作 |
|---|---|
| `pnpm db:generate` | `node_modules/@prisma/client` 再生成 |
| `pnpm db:push` | schema.prisma → DB に反映（マイグレーション無し） |
| `pnpm db:seed` | シードデータ投入 |
| `pnpm db:reset` | SQLite削除 → push → seed |

### 4.3 マイグレーション運用

開発初期は `db:push` で十分。本番Postgres切替後は `prisma migrate dev` を導入予定。

```bash
# 将来的な運用（参考）
pnpm prisma migrate dev --name add_xxx
pnpm prisma migrate deploy   # 本番適用
```

---

## 5. DEMO_MODE で起動する手順（最速）

### 5.1 最小構成

```bash
cd app
cp .env.example .env.local

# .env.local を編集
cat > .env.local <<'EOF'
AUTH_SECRET=demo_local_secret_change_me_replace_with_random
DATABASE_URL="file:./dev.db"
DEMO_MODE=true
NEXT_PUBLIC_DEMO_MODE=true
ALLOWED_EMAIL_DOMAINS=gowa58.co.jp,digirise.ai
EOF

pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

### 5.2 ログイン

http://localhost:3000/login にアクセスし、**「他のロールで試す」**ボタンから役割を選択:

| デモロール | 想定ユーザー | 主な権限 |
|---|---|---|
| `kowa` | 後和専務 | 全権限 |
| `manager` | マネージャー | 担当アサイン・差し戻し・KPI |
| `staff_office` | 管理部・事務員 | 一次対応・チケット更新 |
| `driver` | 営業ドライバー | 自分担当のみ・スマホUI |
| `finance` | 経理・横断管理 | KPI閲覧・月次レポート |

### 5.3 Webhook をデモ送信

```bash
# テキストメッセージのデモ送信
curl -X POST http://localhost:3000/api/webhook/line \
  -H "Content-Type: application/json" \
  -d '{
    "events": [{
      "type": "message",
      "message": { "type": "text", "id": "demo-msg-001", "text": "明日の納品を10時に変更お願いします" },
      "source": { "userId": "Udemo0123456789abcdef0123456789abc" },
      "timestamp": 1715251200000,
      "webhookEventId": "demo-evt-001"
    }]
  }'
```

> **Note**: `DEMO_MODE=true` の間は **署名検証がスキップ**されます。本番では絶対に true のままにしないこと。

---

## 6. 本番モードで起動する手順（完全）

### 6.1 .env.local（本番想定）

```bash
AUTH_SECRET=<openssl rand -base64 32>
AUTH_GOOGLE_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
NEXTAUTH_URL=https://gowa-line-mgr.vercel.app

DATABASE_URL=postgres://user:pass@host:5432/db?sslmode=require

LINE_CHANNEL_ID=1234567890
LINE_CHANNEL_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LINE_CHANNEL_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

GCHAT_WEBHOOK_URL=https://chat.googleapis.com/v1/spaces/AAAA.../messages?key=...&token=...

ALLOWED_EMAIL_DOMAINS=gowa58.co.jp,digirise.ai

DEMO_MODE=false
NEXT_PUBLIC_DEMO_MODE=false
```

### 6.2 Vercel へのデプロイ

```bash
npm i -g vercel
cd app
vercel link    # プロジェクトを紐付け
vercel env add AUTH_SECRET production
vercel env add AUTH_GOOGLE_ID production
# ... 全環境変数を登録

vercel --prod
```

### 6.3 デプロイ後チェックリスト

- [ ] https://your-domain.vercel.app/login にアクセスでき Google ログインできる
- [ ] LINE Developersコンソールで Webhook URL を更新
- [ ] LINE Developers の **接続確認** ボタンで 200 OK が返る
- [ ] テスト送信したメッセージが `/tickets` 一覧に出る
- [ ] Google Chat Webhook に通知が届く

---

## 7. トラブルシューティング

### 7.1 `Error: PrismaClient is unable to be run in the browser`

サーバ専用APIをClient Componentから直接インポートしている。
→ Server Component or API Route で呼び出すよう修正。

### 7.2 `Can't reach database server at localhost:5432`

`DATABASE_URL` が Postgres を指しているが Postgres が起動していない。
→ ローカル開発は SQLite (`file:./dev.db`) に切り替え。

### 7.3 LINE Webhook が呼ばれない

| 原因 | 対処 |
|---|---|
| Webhook URL が間違っている | LINE Developers > Messaging API設定 > Webhook URL を確認 |
| Webhookの利用がオフ | 同画面で「利用」を ON に |
| 応答メッセージが ON | 「応答メッセージ」を OFF に（応答メッセージが優先される） |
| 署名検証で 401 | `LINE_CHANNEL_SECRET` を確認 / `DEMO_MODE=true` で一時バイパス |

### 7.4 Google ログインで `redirect_uri_mismatch`

Google Cloud Console の **Authorized redirect URIs** に正しい URL が登録されていない。

```
http://localhost:3000/api/auth/callback/google
https://your-domain.vercel.app/api/auth/callback/google
```

を両方登録すること。

### 7.5 `Module not found: Can't resolve '@/lib/...'`

`tsconfig.json` の `paths` 設定が読み込まれていない。
→ `next.config.js` を確認 / VSCode を再起動 / `pnpm dev` を再起動。

### 7.6 `pnpm db:seed` が失敗する

```bash
rm -f prisma/dev.db
pnpm db:push
pnpm db:seed
```

それでも失敗する場合は `prisma/seed.ts` の最新化を確認。

### 7.7 Vercel で 500 エラー（`PrismaClientInitializationError`）

`vercel-build` スクリプトで `prisma db push` が失敗している可能性。
→ `DATABASE_URL` を再確認。Vercel側で `Production` 環境にも変数が登録されているかチェック。

### 7.8 ngrok の URL が変わった

無料版 ngrok は再起動毎に URL が変わる。LINE Developers の Webhook URL を毎回更新するか、cloudflared で固定ドメインを使う。

```bash
cloudflared tunnel --url http://localhost:3000
```

---

## 8. 参考リンク

- 製品仕様: [`../../specs/SPEC.md`](../../specs/SPEC.md) v0.3
- LINE連携設計: [`../../../integrated-dashboard/integration/LINE_INTEGRATION.md`](../../../integrated-dashboard/integration/LINE_INTEGRATION.md)
- 開発者向け詳細: [`./DEVELOPMENT.md`](./DEVELOPMENT.md)
- お客様向けガイド: [`./USAGE.md`](./USAGE.md)
- API仕様: [`./API.md`](./API.md)

---

> **質問・トラブル相談先**
> 株式会社デジライズ 茶圓将裕（チャエン）
> https://x.com/masahirochaen
