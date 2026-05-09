# 業務管理プラットフォーム — Phase 1.0

> **株式会社リカーショップゴワ × 株式会社デジライズ**
> LINE / メール / 電話の問い合わせを 8 段階のステータスで管理する SaaS プラットフォーム。
> 課題 #1「LINE問い合わせ進捗管理」を起点に、後続の #3 / #4 / #14 にも展開できる
> チケット型コアエンジンを Next.js 14 App Router で実装。

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)](https://prisma.io)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Playwright](https://img.shields.io/badge/Playwright-1.49-2EAD33?logo=playwright)](https://playwright.dev)

---

## スクリーンショット

| 画面 | プレビュー |
|---|---|
| ログイン | `docs/screenshots/01-login.png` |
| ダッシュボード | `docs/screenshots/02-dashboard.png` |
| チケット一覧 | `docs/screenshots/03-tickets.png` |
| カンバン (8段階FSM) | `docs/screenshots/04-kanban.png` |
| チャット統合 (LINE/GChat/Mail) | `docs/screenshots/05-chat.png` |
| マッピング管理 | `docs/screenshots/06-mappings.png` |
| 設定 | `docs/screenshots/07-settings.png` |
| チケット詳細 | `docs/screenshots/08-ticket-detail.png` |

スクリーンショット一括再生成: `node scripts/screenshots.mjs`（要 dev server 起動）

---

## クイックスタート (5分)

```bash
# 1. 依存関係をインストール
npm install
# or pnpm install / bun install

# 2. .env を作成（DEMO_MODE で起動）
cp .env.example .env
# AUTH_SECRET= の値を openssl rand -base64 32 で埋める
# (それ以外はデフォルトで OK)

# 3. DB を初期化 + シード投入
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts

# 4. 起動
npm run dev
# → http://localhost:3000

# 5. デモアカウントでログイン
# /login → 4 つのデモロールから選択（Google OAuth 不要）
```

| ロール | 表示名 | 主な権限 |
|---|---|---|
| `kowa` | 後和 直樹（専務） | 全件閲覧・全機能利用・設定変更 |
| `staff_office` | 中尾 花子（事務員） | LINE 一次対応・マッピング |
| `driver` | 田中 健（営業ドライバー） | 自分担当のみ（モバイル想定） |
| `finance` | 辻野 和彦（経理） | KPI 閲覧・横断管理 |

---

## 機能一覧

### 認証
- **NextAuth.js v5** + Google OAuth + Credentials Provider（デモ用）
- **Workspace SSO 風** UI（許可ドメイン制限：`gowa58.co.jp` / `digirise.ai`）
- middleware による未ログイン時の `/login` リダイレクト

### ダッシュボード（`/`）
- 4 KPI タイル：未対応 / 対応中 / 完了 / 失注（前日比 + クリックで遷移）
- AI 捕捉率・平均一次応答時間・本日処理件数（プログレスバー）
- 直近の要対応案件 TOP3（カードレイアウト）
- 7 日間受信トレンド（SVG エリアチャート）

### チケット一覧（`/tickets`）
- フィルタ：ステータス / 担当者 / カテゴリ / チャネル / 未紐付け
- カードレイアウト（line-clamp 2）
- 緊急度カラーチップ・引き継ぎメモ・経過時間・担当者アバター

### カンバン（`/kanban`）★最重要
- **8 段階ステータスをカラム化**：未対応 / 一次対応中 / 社内確認中 / 仕入先見積中 / 回答待ち / 回答完了 / 案件完了 / 失注
- WIP リミット超過は **赤枠で警告**
- **@dnd-kit** によるドラッグ&ドロップで状態変更（楽観的UI更新）

### チケット詳細（`/tickets/[id]`）
- LINE 風チャットスレッド（顧客は左、社内は右、内部メモは中央）
- **ページ内から直接返信送信**（LINE Push API・Mail mock）
- AI サジェスト（数量・必要日 / 急ぎ確認 / 予算感）→ 1クリックで下書きコピー
- 失注理由・引き継ぎメモ・顧客マスタ参照

### チャット統合（`/chat`）★今回の新機能
- **3 ペイン構成**（スレッド一覧 / 会話 / 顧客情報）
- タブ切替：**LINE / Google Chat / メール**
- 全チャネルから受信表示 + 返信送信を統合 UI で実行
- LINE / Google Chat スペースの両方で投稿可能

### マッピング管理（`/mappings`）
- userId↔顧客コードマッピング（4 タブ：要対応 / 紐付け済 / 該当なし / すべて）
- **AI 紐付け候補サジェスト**（過去類似問合せ 0.4 + displayName 0.3 + 電話 0.2 + 時間帯 0.1 のスコア）
- ワンクリック紐付け → 関連チケットを自動バックフィル
- 直近の紐付け履歴サイドパネル

### 設定（`/settings`）（manager / kowa / finance のみ）
- プロフィール
- 通知（新規受信 / エスカレ / リマインド / 日次サマリ）
- LINE Channel 設定（Channel ID / Secret / Token のマスク表示）
- Google Chat 連携 / 在庫データソース
- セキュリティ（許可ドメイン / データ保持期間 / 監査ログ BigQuery）

---

## アーキテクチャ

```
Next.js 14 App Router
├── src/
│   ├── app/                      # ルーティング（App Router）
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── tickets/{,[id]}/route.ts
│   │   │   ├── mappings/{,[id]}/route.ts
│   │   │   ├── messages/send/route.ts
│   │   │   ├── webhook/{line,gchat}/route.ts
│   │   │   └── health/route.ts
│   │   ├── (各ページ)/page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                  # shadcn風 (Button, Card, Dialog, ...)
│   │   ├── auth/                # ログインカード・Google ボタン
│   │   ├── chat/                # MessageBubble, Composer, ChatWorkspace
│   │   ├── dashboard/           # TrendChart
│   │   ├── kanban/              # Board (dnd-kit)
│   │   ├── mappings/            # MappingTable, LinkPicker, MappingStats
│   │   ├── tickets/             # TicketCard, FilterBar, StatusChanger
│   │   └── layout/              # Sidebar, Topbar, AppShell, DemoBanner
│   ├── lib/
│   │   ├── auth.ts              # NextAuth v5 config
│   │   ├── prisma.ts            # PrismaClient singleton
│   │   ├── line.ts              # LINE Messaging API（mock 対応）
│   │   ├── gchat.ts             # Google Chat（mock 対応）
│   │   ├── queries.ts           # サーバー側集約クエリ
│   │   ├── constants.ts         # FSM定義・カラー・テンプレ
│   │   ├── demo-users.ts        # デモロール定義
│   │   └── api.ts               # Response helpers (ok/fail/zodFail)
│   ├── types/
│   └── middleware.ts            # 認証ガード
├── prisma/
│   ├── schema.prisma            # 11 モデル（User/Customer/Ticket/Message/...）
│   ├── seed.ts                  # 22 チケット + 30 マッピング
│   └── dev.db                   # SQLite (gitignore)
├── tests/e2e/                   # Playwright（18 シナリオ）
└── docs/                        # SETUP / USAGE / DEVELOPMENT / API
```

### データモデル（11 entities）
- **NextAuth 標準**：User / Account / Session / VerificationToken
- **業務管理コア**：Customer / Ticket / Message
- **LINE 連携**：LineMapping / LineMessageLog
- **Google Chat**：GchatSpace / GchatThread / GchatMessage

詳しくは `prisma/schema.prisma` を参照。

---

## 実装している SPEC v0.3 仕様

### §3 — LINE Webhook 受信
- HMAC-SHA256 署名検証（`crypto.timingSafeEqual` 使用）
- 即 200 返却 + バックグラウンド処理（30 秒タイムアウト対策）
- メッセージ正規化 7 種（text / image / video / audio / file / sticker / location）
- DEMO_MODE で署名スキップ可

### §4 — userId↔顧客コードマッピング FSM
- `unverified` ⇄ `linked` ⇄ `multiple_candidates` ⇄ `failed`
- AI スコアリング（4 重み合算 → 上位 3 件）
- 紐付け確定時に同 userId の全チケットを customer_id バックフィル

### §5 — 8 段階ステータス FSM
- カンバンドラッグで FSM 検証付き状態遷移
- 完了の二段階定義（`answered` = 回答完了、`closed_won` = 案件完了）
- 失注理由トラッキング（5 タグ + freetext + AI 候補）
- 「次の担当者へのメモ」必須化
- 「聞き直し」サジェスト（3 テンプレート）

### §11 — 監視・アラート
- AI 捕捉率（≥70% 緑、未満赤）
- 平均一次応答時間（≤10 分緑、超過赤）
- 30 分以上未対応エスカレ（カードに 🔥 マーク）

---

## 開発コマンド

```bash
npm run dev              # 開発サーバー (http://localhost:3000)
npm run build            # 本番ビルド
npm run start            # 本番起動

npm run db:generate      # Prisma Client 生成
npm run db:push          # SQLite に schema 反映
npm run db:seed          # シード投入
npm run db:reset         # DB を破棄して再構築

npm run lint             # ESLint
npm run typecheck        # tsc --noEmit
npm run test:e2e         # Playwright E2E
```

---

## デプロイ（Vercel）

1. GitHub にプッシュ
2. Vercel ダッシュボードでインポート
3. 環境変数を設定：
   - `DATABASE_URL` → Vercel Postgres / Supabase / Neon の URL
   - `AUTH_SECRET` → `openssl rand -base64 32`
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
   - `NEXTAUTH_URL` → 本番 URL
   - `ALLOWED_EMAIL_DOMAINS=gowa58.co.jp,digirise.ai`
   - `DEMO_MODE=false`（本番）
4. Build Command: `prisma generate && next build`
5. Postgres へ schema 反映：`npx prisma db push`

---

## ライセンス・連絡先

- 開発元: 株式会社デジライズ（茶圓 / 新村）
- クライアント: 株式会社リカーショップゴワ
- 詳細仕様: `../specs/SPEC.md` v0.3
- 要件定義: `../requirements/REQUIREMENTS.md` v0.3
- 連絡先: n15.gowa@gowa58.co.jp（後和専務）
