/**
 * シードデータ: リカーショップゴワ向け Phase 1.0 デモデータ
 *
 * - 5名のスタッフ (manager / staff_office / staff_field)
 * - 12社の顧客マスタ (和歌山の飲食店を想定)
 * - 30件のLINEマッピング (うち5件未紐付け)
 * - 22件のチケット + 各5-10件のメッセージ
 * - Google Chat ダミースペース
 */

import { PrismaClient } from "@prisma/client";
import { addDays, addHours, addMinutes, subDays, subHours, subMinutes } from "date-fns";

const db = new PrismaClient();

const now = new Date();

// ──────────────────────────────
// Users (demo-users.ts の固定ID と一致)
// ──────────────────────────────
const usersSeed = [
  {
    id: "demo-kowa",
    name: "後和 直樹",
    email: "demo+kowa@gowa58.co.jp",
    image: "https://api.dicebear.com/9.x/initials/png?seed=GN&backgroundColor=274af0",
    role: "manager",
    position: "専務取締役",
  },
  {
    id: "user_office_ikeda",
    name: "池田 美咲",
    email: "ikeda@gowa58.co.jp",
    image: "https://api.dicebear.com/9.x/initials/png?seed=IM&backgroundColor=e51d1d",
    role: "staff_office",
    position: "管理部 リーダー",
  },
  {
    id: "demo-nakao",
    name: "中尾 花子",
    email: "demo+nakao@gowa58.co.jp",
    image: "https://api.dicebear.com/9.x/initials/png?seed=NH&backgroundColor=28b53d",
    role: "staff_office",
    position: "管理部・事務員",
  },
  {
    id: "user_office_sakamoto",
    name: "坂本 涼子",
    email: "sakamoto@gowa58.co.jp",
    image: "https://api.dicebear.com/9.x/initials/png?seed=SR&backgroundColor=f59e0b",
    role: "staff_office",
    position: "事務員(火木土)",
  },
  {
    id: "demo-tanaka",
    name: "田中 健",
    email: "demo+tanaka@gowa58.co.jp",
    image: "https://api.dicebear.com/9.x/initials/png?seed=TK&backgroundColor=8b5cf6",
    role: "staff_field",
    position: "営業ドライバー",
  },
  {
    id: "demo-tsujino",
    name: "辻野 和彦",
    email: "demo+tsujino@gowa58.co.jp",
    image: "https://api.dicebear.com/9.x/initials/png?seed=TZ&backgroundColor=f59e0b",
    role: "staff_office",
    position: "経理 / 横断管理",
  },
];

// ──────────────────────────────
// Customers (和歌山飲食店)
// ──────────────────────────────
const customersSeed = [
  { id: "cust_izakaya_abc", code: "1001", name: "居酒屋ABC", contactName: "田中 和也", phone: "0734011234", email: "abc@example.com", area: "和歌山市", segment: "居酒屋" },
  { id: "cust_yakitori_kushi", code: "1002", name: "焼鳥串源", contactName: "源 太郎", phone: "0734021234", email: "kushi@example.com", area: "和歌山市", segment: "焼鳥" },
  { id: "cust_sushi_kibun", code: "1003", name: "鮨 喜分", contactName: "喜分 雅", phone: "0734031234", email: "kibun@example.com", area: "和歌山市", segment: "鮨" },
  { id: "cust_yado_tsubaki", code: "1004", name: "椿の宿 紀州", contactName: "椿原 真理子", phone: "0738451234", email: "tsubaki@example.com", area: "白浜町", segment: "旅館" },
  { id: "cust_french_lyon", code: "1005", name: "ビストロ LYON", contactName: "松本 シェフ", phone: "0734991234", email: "lyon@example.com", area: "和歌山市", segment: "フレンチ" },
  { id: "cust_chuka_haseki", code: "1006", name: "中華料理 はせき", contactName: "長谷木 真人", phone: "0734111234", email: "haseki@example.com", area: "海南市", segment: "中華" },
  { id: "cust_pub_kotoshi", code: "1007", name: "PUB 古都市", contactName: "古都 翔太", phone: "0734221234", email: "kotoshi@example.com", area: "和歌山市", segment: "バー" },
  { id: "cust_tonkatsu_yu", code: "1008", name: "とんかつ 優", contactName: "優 義信", phone: "0734331234", email: "yu@example.com", area: "和歌山市", segment: "とんかつ" },
  { id: "cust_okonomi_kogaki", code: "1009", name: "お好み焼 こがき", contactName: "小垣 香代", phone: "0734441234", email: "kogaki@example.com", area: "海南市", segment: "お好み焼" },
  { id: "cust_ramen_kuro", code: "1010", name: "らーめん 黒衛門", contactName: "黒衛門 蔵人", phone: "0734551234", email: "kuro@example.com", area: "和歌山市", segment: "らーめん" },
  { id: "cust_kaiseki_tsuru", code: "1011", name: "懐石 つるや", contactName: "鶴田 明子", phone: "0738471234", email: "tsuru@example.com", area: "白浜町", segment: "懐石" },
  { id: "cust_wine_libre", code: "1012", name: "ワインバー Libre", contactName: "ライブル 拓海", phone: "0734881234", email: "libre@example.com", area: "和歌山市", segment: "バー" },
];

// ──────────────────────────────
// LINE Mappings (30件、うち5件未紐付け)
// ──────────────────────────────
function lineUid(seed: string) {
  // U + 32hex (xorshift32 ベースで擬似ランダム化、シード差を確実に反映)
  let r = 0x12345678;
  for (let i = 0; i < seed.length; i++) {
    r = ((r ^ seed.charCodeAt(i)) * 16777619) >>> 0;
  }
  let h = "";
  for (let i = 0; i < 32; i++) {
    r ^= r << 13;
    r ^= r >>> 17;
    r ^= r << 5;
    r >>>= 0;
    h += (r & 0xf).toString(16);
  }
  return "U" + h;
}

const linkedMappings = customersSeed.slice(0, 10).map((c, i) => ({
  lineUserId: lineUid(c.id + "_a"),
  displayName: c.contactName ?? c.name,
  pictureUrl: `https://api.dicebear.com/9.x/avataaars/png?seed=${encodeURIComponent(c.code)}`,
  status: "linked",
  customerId: c.id,
  recentPreview: "ありがとうございます、また連絡します",
  messageCount: 5 + (i % 6),
  linkedById: "user_office_ikeda",
  linkedAt: subDays(now, 30 - i),
  linkedMethod: i % 2 === 0 ? "ai_suggested_confirmed" : "manual",
}));

const unverifiedMappings = [
  {
    lineUserId: lineUid("unmapped_1"),
    displayName: "店長",
    status: "unverified",
    recentPreview: "明日の朝イチで日本酒10本届けてもらえますか",
    messageCount: 3,
    candidateCustomerIds: JSON.stringify(["cust_izakaya_abc", "cust_yakitori_kushi"]),
    candidateEvidences: JSON.stringify([
      { customer_id: "cust_izakaya_abc", score: 0.78, evidence: "displayName一致 + 過去同商品の発注履歴" },
      { customer_id: "cust_yakitori_kushi", score: 0.42, evidence: "電話番号末尾4桁一致" },
    ]),
  },
  {
    lineUserId: lineUid("unmapped_2"),
    displayName: "Hiro_pub",
    status: "multiple_candidates",
    recentPreview: "プレミアム焼酎の在庫教えてください",
    messageCount: 7,
    candidateCustomerIds: JSON.stringify(["cust_pub_kotoshi", "cust_wine_libre"]),
    candidateEvidences: JSON.stringify([
      { customer_id: "cust_pub_kotoshi", score: 0.62, evidence: "displayName類似 + 営業時間一致" },
      { customer_id: "cust_wine_libre", score: 0.55, evidence: "displayName類似 + 過去注文ジャンル一致" },
    ]),
  },
  {
    lineUserId: lineUid("unmapped_3"),
    displayName: "ゆう",
    status: "unverified",
    recentPreview: "請求書の宛名を変えていただけますか",
    messageCount: 2,
    candidateCustomerIds: JSON.stringify(["cust_tonkatsu_yu"]),
    candidateEvidences: JSON.stringify([
      { customer_id: "cust_tonkatsu_yu", score: 0.91, evidence: "displayName完全一致 + 過去問合せ内容類似" },
    ]),
  },
  {
    lineUserId: lineUid("unmapped_4"),
    displayName: "黒衛門",
    status: "unverified",
    recentPreview: "今度のキャンペーン詳細欲しい",
    messageCount: 1,
    candidateCustomerIds: JSON.stringify(["cust_ramen_kuro"]),
    candidateEvidences: JSON.stringify([
      { customer_id: "cust_ramen_kuro", score: 0.85, evidence: "displayName一致 + 業態一致" },
    ]),
  },
  {
    lineUserId: lineUid("unmapped_5"),
    displayName: "新規問合せ",
    status: "failed",
    recentPreview: "(既存マスタに該当なし、新規登録待ち)",
    messageCount: 1,
    candidateCustomerIds: JSON.stringify([]),
  },
];

const allMappings = [...linkedMappings, ...unverifiedMappings];

// 残りの linked マッピングを15件水増し (合計30件)
for (let i = 0; i < 15; i++) {
  const cust = customersSeed[i % customersSeed.length];
  allMappings.push({
    lineUserId: lineUid(`extra_${i}`),
    displayName: `${cust.contactName ?? cust.name}さん #${i + 2}`,
    status: "linked",
    customerId: cust.id,
    pictureUrl: `https://api.dicebear.com/9.x/personas/png?seed=${i}`,
    recentPreview: ["先ほどの件、了解です", "また来週よろしく", "請求書届きました", "新商品のご提案ありがとうございます"][i % 4],
    messageCount: 2 + (i % 8),
    linkedById: "demo-nakao",
    linkedAt: subDays(now, 60 - i),
    linkedMethod: "manual",
  } as any);
}

// ──────────────────────────────
// Tickets (22件)
// ──────────────────────────────
type TicketSeed = {
  publicId: string;
  ticketType?: string;
  kind: string;
  channel: string;
  category: string;
  status: string;
  priority?: string;
  subject: string;
  preview: string;
  customerCode?: string;
  customerName?: string;
  lineUserMappingIdx?: number; // -1 で未紐付けマッピングを使う
  isUnmapped?: boolean;
  assigneeId?: string;
  handoverNote?: string;
  lostReason?: string;
  lostReasonNote?: string;
  dueAtOffsetH?: number;
  hoursAgo: number; // createdAt のオフセット
  messages: { dir: string; ch?: string; sender: string; content: string; minsAgo: number; senderId?: string }[];
  suggestedTemplateId?: string;
  aiCategories?: string[];
};

const ticketsSeed: TicketSeed[] = [
  // 未対応 (open) ── 4件
  {
    publicId: "TKT-1001",
    kind: "inbound",
    channel: "official_line",
    category: "billing",
    status: "open",
    priority: "high",
    subject: "5月分の請求書PDFが届いていない件",
    preview: "先月分の請求書PDFがまだ届いていません。月末締めの処理をしたいので至急ご対応お願いします。",
    customerCode: "1001",
    customerName: "居酒屋ABC",
    lineUserMappingIdx: 0,
    hoursAgo: 1.2,
    dueAtOffsetH: 4,
    aiCategories: ["請求", "緊急"],
    messages: [
      { dir: "inbound", ch: "line", sender: "田中 和也", content: "先月分の請求書PDFがまだ届いていません。月末締めの処理をしたいので至急ご対応お願いします。", minsAgo: 72 },
    ],
  },
  {
    publicId: "TKT-1002",
    kind: "inbound",
    channel: "official_line",
    category: "inquiry",
    status: "open",
    priority: "normal",
    subject: "プレミアム焼酎の在庫確認",
    preview: "森伊蔵の在庫ありますか？お客様用に5本ほど欲しいです。",
    isUnmapped: true,
    customerName: "(未紐付け: Hiro_pub)",
    lineUserMappingIdx: -2,
    hoursAgo: 0.4,
    suggestedTemplateId: "ASK_QUANTITY_DATE",
    aiCategories: ["在庫確認", "問合せ"],
    messages: [
      { dir: "inbound", ch: "line", sender: "Hiro_pub", content: "森伊蔵の在庫ありますか？", minsAgo: 24 },
      { dir: "inbound", ch: "line", sender: "Hiro_pub", content: "5本ほど欲しいです", minsAgo: 22 },
    ],
  },
  {
    publicId: "TKT-1003",
    kind: "inbound",
    channel: "official_line",
    category: "delivery",
    status: "open",
    priority: "high",
    subject: "明日10時納品に変更希望",
    preview: "明日の納品時刻を10時に変更お願いします。仕込みの都合で。",
    customerCode: "1004",
    customerName: "椿の宿 紀州",
    lineUserMappingIdx: 3,
    hoursAgo: 2.8,
    dueAtOffsetH: 12,
    aiCategories: ["配送変更"],
    messages: [
      { dir: "inbound", ch: "line", sender: "椿原 真理子", content: "明日の納品時刻を10時に変更お願いします。仕込みの都合で。", minsAgo: 168 },
    ],
  },
  {
    publicId: "TKT-1004",
    kind: "inbound",
    channel: "email",
    category: "inquiry",
    status: "open",
    priority: "normal",
    subject: "新規取扱い銘柄について問合せ",
    preview: "山形県の十四代の取扱い予定はありますでしょうか。",
    customerCode: "1011",
    customerName: "懐石 つるや",
    hoursAgo: 5.5,
    aiCategories: ["新規取引", "問合せ"],
    messages: [
      { dir: "inbound", ch: "email", sender: "鶴田 明子", content: "お世話になっております。十四代の取扱い予定はありますでしょうか。年末年始に向け検討中です。", minsAgo: 330 },
    ],
  },

  // 一次対応中 (triaging) ── 3件
  {
    publicId: "TKT-1005",
    kind: "inbound",
    channel: "official_line",
    category: "inquiry",
    status: "triaging",
    priority: "normal",
    subject: "シャンパンの価格確認",
    preview: "ドンペリ白の業務卸価格を教えてください。",
    customerCode: "1005",
    customerName: "ビストロ LYON",
    lineUserMappingIdx: 4,
    assigneeId: "user_office_ikeda",
    hoursAgo: 3.5,
    suggestedTemplateId: "ASK_QUANTITY_DATE",
    aiCategories: ["価格問合せ"],
    messages: [
      { dir: "inbound", ch: "line", sender: "松本 シェフ", content: "ドンペリ白の業務卸価格を教えてください。", minsAgo: 210 },
      { dir: "internal", sender: "池田 美咲", senderId: "user_office_ikeda", content: "数量と必要日聞いた方がよさそう。テンプレ使う", minsAgo: 200 },
      { dir: "outbound", ch: "line", sender: "池田 美咲", senderId: "user_office_ikeda", content: "お世話になっております。ご希望の本数と必要日を教えていただけますでしょうか？", minsAgo: 195 },
    ],
  },
  {
    publicId: "TKT-1006",
    kind: "inbound",
    channel: "phone",
    category: "claim",
    status: "triaging",
    priority: "high",
    subject: "前回納品の梱包破損クレーム",
    preview: "瓶が1本割れていました。返品交換お願いします。",
    customerCode: "1006",
    customerName: "中華料理 はせき",
    assigneeId: "user_office_ikeda",
    hoursAgo: 4.5,
    aiCategories: ["クレーム", "返品"],
    messages: [
      { dir: "inbound", ch: "phone", sender: "長谷木 真人", content: "(電話) 前回納品の瓶が1本割れていました。返品交換お願いします", minsAgo: 270 },
      { dir: "internal", sender: "池田 美咲", senderId: "user_office_ikeda", content: "倉庫の高羽さんに確認中", minsAgo: 240 },
    ],
  },
  {
    publicId: "TKT-1007",
    kind: "outbound",
    channel: "manual",
    category: "billing",
    status: "triaging",
    priority: "normal",
    subject: "5月分集金日確認 (PUB古都市)",
    preview: "5/30(金) 14時集金で動きます。専務確認のうえ確定願います。",
    customerCode: "1007",
    customerName: "PUB 古都市",
    assigneeId: "demo-nakao",
    hoursAgo: 12,
    dueAtOffsetH: 48,
    aiCategories: ["集金", "outbound"],
    messages: [
      { dir: "internal", sender: "中尾 直美", senderId: "demo-nakao", content: "今月分集金、5/30 14:00 で確定取りに行きます", minsAgo: 720 },
    ],
  },

  // 社内確認中 (internal_check) ── 3件
  {
    publicId: "TKT-1008",
    kind: "inbound",
    channel: "official_line",
    category: "inquiry",
    status: "internal_check",
    priority: "normal",
    subject: "OEM瓶ラベル印刷の社内確認",
    preview: "オリジナルラベル日本酒の話、可能か社内確認中です。",
    customerCode: "1003",
    customerName: "鮨 喜分",
    lineUserMappingIdx: 2,
    assigneeId: "user_office_sakamoto",
    handoverNote: "営業の高羽さんに振りました。月内回答予定。",
    hoursAgo: 24,
    dueAtOffsetH: 96,
    aiCategories: ["新規企画"],
    messages: [
      { dir: "inbound", ch: "line", sender: "喜分 雅", content: "オリジナルラベルで日本酒作ってもらえますか？開店20周年で。", minsAgo: 1440 },
      { dir: "internal", sender: "坂本 涼子", senderId: "user_office_sakamoto", content: "高羽さんに見積もり相談中", minsAgo: 1200 },
      { dir: "internal", sender: "高羽 健", senderId: "demo-tanaka", content: "蔵元と打ち合わせして来週回答します", minsAgo: 600 },
    ],
  },
  {
    publicId: "TKT-1009",
    kind: "inbound",
    channel: "official_line",
    category: "inquiry",
    status: "internal_check",
    priority: "low",
    subject: "クラフトビール樽生サーバー貸出",
    preview: "夏季限定で樽生サーバー貸出可能か確認中。",
    customerCode: "1010",
    customerName: "らーめん 黒衛門",
    lineUserMappingIdx: 9,
    assigneeId: "user_office_ikeda",
    hoursAgo: 36,
    aiCategories: ["設備貸出"],
    messages: [
      { dir: "inbound", ch: "line", sender: "黒衛門 蔵人", content: "夏季限定でクラフトビール樽生サーバー貸出してもらえます？", minsAgo: 2160 },
      { dir: "internal", sender: "池田 美咲", senderId: "user_office_ikeda", content: "サーバー在庫と契約条件を専務に確認中", minsAgo: 2000 },
    ],
  },
  {
    publicId: "TKT-1010",
    kind: "outbound",
    channel: "manual",
    category: "other",
    status: "internal_check",
    priority: "normal",
    subject: "新メニュー提案 (椿の宿 紀州)",
    preview: "和食ペアリング向け日本酒5本リスト作成中。",
    customerCode: "1004",
    customerName: "椿の宿 紀州",
    assigneeId: "demo-tanaka",
    hoursAgo: 48,
    dueAtOffsetH: 72,
    aiCategories: ["提案", "outbound"],
    messages: [
      { dir: "internal", sender: "高羽 健", senderId: "demo-tanaka", content: "椿の宿 紀州向け新メニュー提案中。日本酒5本リスト作成", minsAgo: 2880 },
    ],
  },

  // 仕入先見積中 (supplier_quote) ── 2件
  {
    publicId: "TKT-1011",
    kind: "inbound",
    channel: "official_line",
    category: "inquiry",
    status: "supplier_quote",
    priority: "normal",
    subject: "白桃シロップ業務用5L缶仕入価格",
    preview: "国産白桃シロップ5Lの仕入先見積もり待ち",
    customerCode: "1009",
    customerName: "お好み焼 こがき",
    assigneeId: "demo-nakao",
    hoursAgo: 18,
    aiCategories: ["仕入価格"],
    messages: [
      { dir: "inbound", ch: "line", sender: "小垣 香代", content: "業務用白桃シロップ5L缶ありますか？月10缶ペース欲しい", minsAgo: 1080 },
      { dir: "internal", sender: "中尾 直美", senderId: "demo-nakao", content: "東京の問屋に見積依頼中", minsAgo: 600 },
    ],
  },
  {
    publicId: "TKT-1012",
    kind: "inbound",
    channel: "email",
    category: "inquiry",
    status: "supplier_quote",
    priority: "normal",
    subject: "海外ワインケース取り寄せ",
    preview: "ナパバレーの限定ワイン12本ケースの取り寄せ可否",
    customerCode: "1012",
    customerName: "ワインバー Libre",
    assigneeId: "demo-tanaka",
    hoursAgo: 30,
    aiCategories: ["取り寄せ", "海外"],
    messages: [
      { dir: "inbound", ch: "email", sender: "ライブル 拓海", content: "ナパバレーの限定ワイン12本ケース取り寄せ可能でしょうか", minsAgo: 1800 },
      { dir: "internal", sender: "高羽 健", senderId: "demo-tanaka", content: "輸入元へ問合せ中", minsAgo: 1500 },
    ],
  },

  // 回答待ち (awaiting_reply) ── 2件
  {
    publicId: "TKT-1013",
    kind: "outbound",
    channel: "official_line",
    category: "inquiry",
    status: "awaiting_reply",
    priority: "normal",
    subject: "焼酎○○20本 在庫確認OK 数量返答待ち",
    preview: "在庫20本確保しました、ご注文確定お願いします",
    customerCode: "1002",
    customerName: "焼鳥串源",
    lineUserMappingIdx: 1,
    assigneeId: "user_office_sakamoto",
    hoursAgo: 6,
    dueAtOffsetH: 24,
    aiCategories: ["回答待ち"],
    messages: [
      { dir: "inbound", ch: "line", sender: "源 太郎", content: "焼酎○○の在庫教えて", minsAgo: 480 },
      { dir: "outbound", ch: "line", sender: "坂本 涼子", senderId: "user_office_sakamoto", content: "在庫20本確保しています、ご注文確定お願いします", minsAgo: 360 },
    ],
  },
  {
    publicId: "TKT-1014",
    kind: "outbound",
    channel: "email",
    category: "billing",
    status: "awaiting_reply",
    priority: "high",
    subject: "4月請求書発送済 着金確認待ち",
    preview: "4月分振込確認待ち、明日まで未確認なら電話確認",
    customerCode: "1011",
    customerName: "懐石 つるや",
    assigneeId: "user_office_ikeda",
    hoursAgo: 72,
    dueAtOffsetH: 24,
    aiCategories: ["集金", "outbound"],
    messages: [
      { dir: "outbound", ch: "email", sender: "池田 美咲", senderId: "user_office_ikeda", content: "4月分のご請求書をお送りしました。月末までにお振込みお願いいたします。", minsAgo: 4320 },
    ],
  },

  // 回答完了 (answered) ── 2件
  {
    publicId: "TKT-1015",
    kind: "inbound",
    channel: "official_line",
    category: "inquiry",
    status: "answered",
    priority: "normal",
    subject: "新ジャガ取扱いについて",
    preview: "新ジャガ業務用は当社では非取扱いと回答済",
    customerCode: "1006",
    customerName: "中華料理 はせき",
    assigneeId: "demo-nakao",
    hoursAgo: 8,
    aiCategories: ["問合せ"],
    messages: [
      { dir: "inbound", ch: "line", sender: "長谷木 真人", content: "新ジャガの業務用ありますか？", minsAgo: 480 },
      { dir: "outbound", ch: "line", sender: "中尾 直美", senderId: "demo-nakao", content: "申し訳ございません、当社では青果類は取扱っておりません", minsAgo: 460 },
    ],
  },
  {
    publicId: "TKT-1016",
    kind: "outbound",
    channel: "official_line",
    category: "billing",
    status: "answered",
    priority: "normal",
    subject: "5月価格改定通知配信済",
    preview: "ビールメーカー5社の改定通知を配信完了",
    customerCode: "1007",
    customerName: "PUB 古都市",
    lineUserMappingIdx: 6,
    assigneeId: "user_office_ikeda",
    hoursAgo: 24,
    aiCategories: ["価格改定", "outbound"],
    messages: [
      { dir: "outbound", ch: "line", sender: "池田 美咲", senderId: "user_office_ikeda", content: "5月よりビールメーカー5社が価格改定となります。詳細はPDFをご覧ください。", minsAgo: 1440 },
      { dir: "inbound", ch: "line", sender: "古都 翔太", content: "了解しました、ありがとうございます", minsAgo: 1200 },
    ],
  },

  // 案件完了 (closed_won) ── 2件
  {
    publicId: "TKT-1017",
    kind: "inbound",
    channel: "official_line",
    category: "order",
    status: "closed_won",
    priority: "normal",
    subject: "梅酒ケース注文確定",
    preview: "和歌山の梅酒6本ケース×3、配送完了",
    customerCode: "1008",
    customerName: "とんかつ 優",
    assigneeId: "user_office_sakamoto",
    hoursAgo: 48,
    aiCategories: ["注文", "完了"],
    messages: [
      { dir: "inbound", ch: "line", sender: "優 義信", content: "南方の梅酒6本ケースを3ケースお願いします", minsAgo: 2880 },
      { dir: "outbound", ch: "line", sender: "坂本 涼子", senderId: "user_office_sakamoto", content: "ありがとうございます、明日納品いたします", minsAgo: 2800 },
      { dir: "inbound", ch: "line", sender: "優 義信", content: "受け取りました、ありがとう", minsAgo: 2500 },
    ],
  },
  {
    publicId: "TKT-1018",
    kind: "outbound",
    channel: "manual",
    category: "other",
    status: "closed_won",
    priority: "normal",
    subject: "夏季メニュー提案→受注 (椿の宿)",
    preview: "ペアリング日本酒5本セット採用、月20セット定期",
    customerCode: "1004",
    customerName: "椿の宿 紀州",
    assigneeId: "demo-tanaka",
    hoursAgo: 96,
    aiCategories: ["提案", "受注"],
    messages: [
      { dir: "internal", sender: "高羽 健", senderId: "demo-tanaka", content: "夏季メニュー提案、月20セット定期で受注確定", minsAgo: 5760 },
    ],
  },

  // 失注 (closed_lost) ── 2件
  {
    publicId: "TKT-1019",
    kind: "inbound",
    channel: "official_line",
    category: "inquiry",
    status: "closed_lost",
    priority: "normal",
    subject: "希少日本酒 失注",
    preview: "在庫切れで他社購入、機会損失",
    customerCode: "1003",
    customerName: "鮨 喜分",
    lineUserMappingIdx: 2,
    assigneeId: "user_office_sakamoto",
    lostReason: "out_of_stock",
    lostReasonNote: "蔵元在庫終了、他社で確保された模様",
    hoursAgo: 72,
    aiCategories: ["失注", "在庫切れ"],
    messages: [
      { dir: "inbound", ch: "line", sender: "喜分 雅", content: "○○の十四代3本確保できますか", minsAgo: 4320 },
      { dir: "outbound", ch: "line", sender: "坂本 涼子", senderId: "user_office_sakamoto", content: "申し訳ございません、蔵元在庫切れで確保できませんでした", minsAgo: 4200 },
      { dir: "inbound", ch: "line", sender: "喜分 雅", content: "わかりました、他で当たります", minsAgo: 4100 },
    ],
  },
  {
    publicId: "TKT-1020",
    kind: "inbound",
    channel: "official_line",
    category: "inquiry",
    status: "closed_lost",
    priority: "normal",
    subject: "シャンパン価格 失注",
    preview: "他社が安値提示、価格失注",
    customerCode: "1005",
    customerName: "ビストロ LYON",
    lineUserMappingIdx: 4,
    assigneeId: "user_office_ikeda",
    lostReason: "price",
    lostReasonNote: "他社が大量仕入で1割安値、20本需要を取られた",
    hoursAgo: 120,
    aiCategories: ["失注", "価格"],
    messages: [
      { dir: "inbound", ch: "line", sender: "松本 シェフ", content: "ドンペリ白20本、他社の見積もりと比べたいので価格お願いします", minsAgo: 7200 },
      { dir: "outbound", ch: "line", sender: "池田 美咲", senderId: "user_office_ikeda", content: "卸価格○○○円でご提案します", minsAgo: 7100 },
      { dir: "inbound", ch: "line", sender: "松本 シェフ", content: "ありがとうございます、他社の方が安かったため今回は見送ります", minsAgo: 7000 },
    ],
  },

  // エスカレ (escalated) ── 2件
  {
    publicId: "TKT-1021",
    kind: "inbound",
    channel: "official_line",
    category: "claim",
    status: "escalated",
    priority: "urgent",
    subject: "【30分超】配送遅延クレーム",
    preview: "急ぎの納品が30分遅れ、開店に間に合わない",
    customerCode: "1009",
    customerName: "お好み焼 こがき",
    lineUserMappingIdx: 8,
    assigneeId: "user_office_ikeda",
    hoursAgo: 0.6,
    handoverNote: "30分以上未対応で自動エスカレ。専務にメンション送信済",
    aiCategories: ["クレーム", "エスカレ"],
    messages: [
      { dir: "inbound", ch: "line", sender: "小垣 香代", content: "今日の納品、開店12時に間に合わないと困ります。急ぎでお願いします", minsAgo: 36 },
    ],
  },
  {
    publicId: "TKT-1022",
    kind: "inbound",
    channel: "official_line",
    category: "inquiry",
    status: "escalated",
    priority: "high",
    subject: "未紐付け顧客から大量注文打診",
    preview: "新規顧客らしき方から100本単位の打診、紐付け要",
    isUnmapped: true,
    customerName: "(未紐付け: 新規問合せ)",
    lineUserMappingIdx: -5,
    hoursAgo: 1.4,
    aiCategories: ["新規取引", "未紐付け"],
    messages: [
      { dir: "inbound", ch: "line", sender: "新規問合せ", content: "新店舗オープン予定で焼酎・ビール各100本仕入れたいです。価格と取引条件知りたいです", minsAgo: 84 },
    ],
  },
];

async function main() {
  console.log("Cleaning database...");
  await db.gchatMessage.deleteMany();
  await db.gchatThread.deleteMany();
  await db.gchatSpace.deleteMany();
  await db.lineMessageLog.deleteMany();
  await db.message.deleteMany();
  await db.ticket.deleteMany();
  await db.lineMapping.deleteMany();
  await db.customer.deleteMany();
  // Invitation/AuditLog/InviteEmailLog: User より先に消す (FK)
  await db.inviteEmailLog.deleteMany();
  await db.invitation.deleteMany();
  await db.auditLog.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.user.deleteMany();

  console.log("Seeding users...");
  // role -> デフォルト permissions の対応 (constants.defaultPermissionsForRole と同期)
  const permissionsForRole = (role: string): string[] => {
    switch (role) {
      case "manager":
        return ["admin", "manager", "view_all"];
      case "finance":
        return ["view_all", "kpi"];
      case "staff_office":
        return ["view_assigned", "create_ticket", "mapping"];
      case "staff_field":
      case "driver":
        return ["view_self", "mobile"];
      default:
        return ["view_self"];
    }
  };
  for (const u of usersSeed) {
    await db.user.create({
      data: {
        ...u,
        title: u.position,
        permissions: JSON.stringify(permissionsForRole(u.role)),
        isActive: true,
        emailVerified: subDays(now, 30),
      },
    });
  }

  console.log("Seeding customers...");
  for (const c of customersSeed) {
    await db.customer.create({ data: c });
  }

  console.log("Seeding mappings...");
  // 重複lineUserId 除去（最初に出現したものを優先）
  const seenIds = new Set<string>();
  const uniqueMappings = allMappings.filter((m: any) => {
    if (seenIds.has(m.lineUserId)) return false;
    seenIds.add(m.lineUserId);
    return true;
  });
  for (let i = 0; i < uniqueMappings.length; i++) {
    const m: any = uniqueMappings[i];
    await db.lineMapping.upsert({
      where: { lineUserId: m.lineUserId },
      update: {
        ...m,
        lastSeenAt: subHours(now, (i % 48) + 1),
      },
      create: {
        ...m,
        firstSeenAt: subDays(now, 90 - i),
        lastSeenAt: subHours(now, (i % 48) + 1),
      },
    });
  }

  console.log("Seeding tickets...");
  for (const t of ticketsSeed) {
    const createdAt = subHours(now, t.hoursAgo);
    let lineUserId: string | null = null;
    if (t.lineUserMappingIdx !== undefined) {
      if (t.lineUserMappingIdx >= 0) {
        lineUserId = allMappings[t.lineUserMappingIdx]?.lineUserId ?? null;
      } else {
        // negative index = unverified mappings (-1 → unverified[0], -2 → unverified[1] ...)
        const idx = -t.lineUserMappingIdx - 1;
        lineUserId = unverifiedMappings[idx]?.lineUserId ?? null;
      }
    }

    const customer = t.customerCode ? customersSeed.find((c) => c.code === t.customerCode) : null;

    const created = await db.ticket.create({
      data: {
        publicId: t.publicId,
        ticketType: t.ticketType ?? "single",
        kind: t.kind,
        channel: t.channel,
        category: t.category,
        status: t.status,
        priority: t.priority ?? "normal",
        subject: t.subject,
        preview: t.preview,
        customerId: customer?.id ?? null,
        customerName: t.customerName ?? customer?.name ?? null,
        lineUserId,
        isUnmapped: t.isUnmapped ?? false,
        assigneeId: t.assigneeId ?? null,
        handoverNote: t.handoverNote ?? null,
        lostReason: t.lostReason ?? null,
        lostReasonNote: t.lostReasonNote ?? null,
        suggestedTemplateId: t.suggestedTemplateId ?? null,
        aiCategories: t.aiCategories ? JSON.stringify(t.aiCategories) : null,
        dueAt: t.dueAtOffsetH ? addHours(now, t.dueAtOffsetH) : null,
        createdAt,
        updatedAt: createdAt,
        firstResponseAt: t.messages.some((m) => m.dir === "outbound") ? subMinutes(now, t.messages.filter((m) => m.dir === "outbound")[0]?.minsAgo ?? 0) : null,
        answeredAt: t.status === "answered" || t.status === "closed_won" || t.status === "closed_lost"
          ? subMinutes(now, t.messages.filter((m) => m.dir === "outbound").pop()?.minsAgo ?? 0)
          : null,
        closedAt: t.status === "closed_won" || t.status === "closed_lost"
          ? subHours(now, t.hoursAgo - 0.5)
          : null,
      },
    });

    for (const m of t.messages) {
      await db.message.create({
        data: {
          ticketId: created.id,
          direction: m.dir,
          channel: m.ch ?? "line",
          senderId: m.senderId ?? null,
          senderName: m.sender,
          content: m.content,
          contentType: "text",
          sentAt: subMinutes(now, m.minsAgo),
        },
      });
    }
  }

  console.log("Seeding Google Chat...");
  const space = await db.gchatSpace.create({
    data: {
      name: "リカーショップゴワ_管理部",
      description: "業務管理プラットフォーム連携用スペース",
      type: "space",
    },
  });

  const t1 = await db.gchatThread.create({
    data: { spaceId: space.id, subject: "5/9 配送変更まとめ" },
  });
  await db.gchatMessage.createMany({
    data: [
      { threadId: t1.id, senderName: "高羽 健", senderImg: usersSeed[4].image, content: "本日の配送変更3件、共有します。" },
      { threadId: t1.id, senderName: "池田 美咲", senderImg: usersSeed[1].image, content: "了解。明日朝の便で対応します。" },
    ],
  });

  const t2 = await db.gchatThread.create({
    data: { spaceId: space.id, subject: "TKT-1021 エスカレ通知" },
  });
  await db.gchatMessage.createMany({
    data: [
      { threadId: t2.id, senderName: "システム Bot", content: "@後和専務 TKT-1021 が30分以上未対応です。対応をお願いします。" },
      { threadId: t2.id, senderName: "後和 直樹", senderImg: usersSeed[0].image, content: "確認しました。池田さん対応お願いします。" },
    ],
  });

  console.log("Seeding LINE message log (sample)...");
  for (let i = 0; i < 8; i++) {
    await db.lineMessageLog.create({
      data: {
        webhookEventId: `evt_${Date.now()}_${i}`,
        lineUserId: allMappings[i % allMappings.length].lineUserId,
        messageId: `msg_${Date.now()}_${i}`,
        eventType: "message",
        messageType: ["text", "image", "sticker", "text", "text"][i % 5],
        rawPayload: JSON.stringify({ type: "message", source: { type: "user" } }),
        signatureValid: true,
        receivedAt: subMinutes(now, i * 30),
        processedAt: subMinutes(now, i * 30 - 1),
      },
    });
  }

  console.log("Seeding invitations...");
  // 固定トークン: デモ動作確認のため (本番では generateInviteToken() を使う)
  const invitationsSeed = [
    // pending 3件 — 異なるロール / 異なる期限
    {
      id: "inv_pending_yamada",
      email: "yamada@gowa58.co.jp",
      name: "山田 太郎",
      role: "staff_office",
      title: "管理部 (新人)",
      permissions: JSON.stringify(["view_assigned", "create_ticket", "mapping"]),
      token: "demo_token_yamada_pending_001abcdefghijklmnopqrstuvwxyz",
      expiresAt: addDays(now, 6),
      status: "pending",
      invitedById: "demo-kowa",
      message: "山田さん、業務管理プラットフォーム使い始めましょう。\n初週は中尾さんとペアで触ってみてください。",
      createdAt: subDays(now, 1),
    },
    {
      id: "inv_pending_satoh",
      email: "satoh-driver@gowa58.co.jp",
      name: "佐藤 健",
      role: "driver",
      title: "営業ドライバー (新人)",
      permissions: JSON.stringify(["view_self", "mobile"]),
      token: "demo_token_satoh_pending_002abcdefghijklmnopqrstuvwxyz",
      expiresAt: addDays(now, 3),
      status: "pending",
      invitedById: "demo-kowa",
      message: "佐藤さん、配送ルート用のスマホUIで使ってみてください。",
      createdAt: subDays(now, 4),
    },
    {
      id: "inv_pending_morimoto",
      email: "morimoto@gowa58.co.jp",
      name: "森本 京子",
      role: "finance",
      title: "経理 (パート)",
      permissions: JSON.stringify(["view_all", "kpi"]),
      token: "demo_token_morimoto_pending_003abcdefghijklmnopqrstuvw",
      expiresAt: addHours(now, 12), // 直近で切れそう
      status: "pending",
      invitedById: "demo-kowa",
      message: null,
      createdAt: subDays(now, 6),
    },
    // accepted 2件
    {
      id: "inv_accepted_kondoh",
      email: "kondoh@gowa58.co.jp",
      name: "近藤 修",
      role: "staff_field",
      title: "倉庫担当",
      permissions: JSON.stringify(["view_self", "mobile"]),
      token: "demo_token_kondoh_accepted_004abcdefghijklmnopqrstuv",
      expiresAt: subDays(now, 5),
      status: "accepted",
      invitedById: "demo-kowa",
      acceptedAt: subDays(now, 12),
      message: null,
      createdAt: subDays(now, 14),
    },
    {
      id: "inv_accepted_okada",
      email: "okada@gowa58.co.jp",
      name: "岡田 翔",
      role: "staff_office",
      title: "管理部・補佐",
      permissions: JSON.stringify(["view_assigned", "create_ticket", "mapping"]),
      token: "demo_token_okada_accepted_005abcdefghijklmnopqrstuvw",
      expiresAt: subDays(now, 1),
      status: "accepted",
      invitedById: "demo-kowa",
      acceptedAt: subDays(now, 8),
      message: "岡田さん、ようこそ。",
      createdAt: subDays(now, 10),
    },
    // revoked 1件
    {
      id: "inv_revoked_temp",
      email: "temp-spam@example.com",
      name: null,
      role: "staff_office",
      title: null,
      permissions: JSON.stringify(["view_assigned"]),
      token: "demo_token_revoked_006abcdefghijklmnopqrstuvwxyz1234",
      expiresAt: addDays(now, 7),
      status: "revoked",
      invitedById: "demo-kowa",
      message: null,
      createdAt: subDays(now, 3),
    },
    // expired 1件 (UI動作確認用 / 過去日)
    {
      id: "inv_expired_legacy",
      email: "legacy-staff@gowa58.co.jp",
      name: "(期限切れ招待)",
      role: "staff_office",
      title: null,
      permissions: JSON.stringify(["view_assigned"]),
      token: "demo_token_expired_007abcdefghijklmnopqrstuvwxyz1234",
      expiresAt: subDays(now, 2),
      status: "expired",
      invitedById: "demo-kowa",
      message: null,
      createdAt: subDays(now, 12),
    },
  ];

  for (const inv of invitationsSeed) {
    await db.invitation.create({ data: inv as any });
  }

  console.log("Seeding invite email logs...");
  // 各招待につき 1〜3件のログ (送信成功 / 再送 / 失敗 のバリエーション)
  const emailLogs = [
    // pending Yamada — 1件 (sent)
    {
      invitationId: "inv_pending_yamada",
      toEmail: "yamada@gowa58.co.jp",
      subject: "【業務管理プラットフォーム】後和 直樹様より招待が届いています",
      bodyText: "山田 太郎様\n\n後和 直樹さんより招待が届いています...",
      status: "sent",
      providerMsgId: "mock_msg_001",
      sentAt: subDays(now, 1),
      createdAt: subDays(now, 1),
    },
    // pending Satoh — 2件 (初回sent + 再送sent)
    {
      invitationId: "inv_pending_satoh",
      toEmail: "satoh-driver@gowa58.co.jp",
      subject: "【業務管理プラットフォーム】後和 直樹様より招待が届いています",
      bodyText: "佐藤 健様\n...",
      status: "sent",
      providerMsgId: "mock_msg_002",
      sentAt: subDays(now, 4),
      createdAt: subDays(now, 4),
    },
    {
      invitationId: "inv_pending_satoh",
      toEmail: "satoh-driver@gowa58.co.jp",
      subject: "【業務管理プラットフォーム】後和 直樹様より招待が届いています",
      bodyText: "佐藤 健様\n(再送)\n...",
      status: "sent",
      providerMsgId: "mock_msg_002b",
      sentAt: subDays(now, 1),
      createdAt: subDays(now, 1),
    },
    // pending Morimoto — 1件 sent
    {
      invitationId: "inv_pending_morimoto",
      toEmail: "morimoto@gowa58.co.jp",
      subject: "【業務管理プラットフォーム】後和 直樹様より招待が届いています",
      bodyText: "森本 京子様\n...",
      status: "sent",
      providerMsgId: "mock_msg_003",
      sentAt: subDays(now, 6),
      createdAt: subDays(now, 6),
    },
    // accepted Kondoh — 1件 sent
    {
      invitationId: "inv_accepted_kondoh",
      toEmail: "kondoh@gowa58.co.jp",
      subject: "【業務管理プラットフォーム】後和 直樹様より招待が届いています",
      bodyText: "近藤 修様\n...",
      status: "sent",
      providerMsgId: "mock_msg_004",
      sentAt: subDays(now, 14),
      createdAt: subDays(now, 14),
    },
    // accepted Okada — 1件 sent
    {
      invitationId: "inv_accepted_okada",
      toEmail: "okada@gowa58.co.jp",
      subject: "【業務管理プラットフォーム】後和 直樹様より招待が届いています",
      bodyText: "岡田 翔様\n...",
      status: "sent",
      providerMsgId: "mock_msg_005",
      sentAt: subDays(now, 10),
      createdAt: subDays(now, 10),
    },
    // revoked — 1件 sent + 失敗例
    {
      invitationId: "inv_revoked_temp",
      toEmail: "temp-spam@example.com",
      subject: "【業務管理プラットフォーム】後和 直樹様より招待が届いています",
      bodyText: "...",
      status: "failed",
      errorMessage: "550 5.1.1 Recipient address rejected (mock)",
      sentAt: null,
      createdAt: subDays(now, 3),
    },
    // expired — 1件 sent
    {
      invitationId: "inv_expired_legacy",
      toEmail: "legacy-staff@gowa58.co.jp",
      subject: "【業務管理プラットフォーム】後和 直樹様より招待が届いています",
      bodyText: "(legacy)",
      status: "sent",
      providerMsgId: "mock_msg_007",
      sentAt: subDays(now, 12),
      createdAt: subDays(now, 12),
    },
  ];
  for (const l of emailLogs) {
    await db.inviteEmailLog.create({ data: l as any });
  }

  console.log("Seeding audit logs (sample)...");
  await db.auditLog.createMany({
    data: [
      {
        actorId: "demo-kowa",
        actorEmail: "demo+kowa@gowa58.co.jp",
        action: "invitation.created",
        targetType: "invitation",
        targetId: "inv_pending_yamada",
        metadata: JSON.stringify({ email: "yamada@gowa58.co.jp", role: "staff_office" }),
        createdAt: subDays(now, 1),
      },
      {
        actorId: "demo-kowa",
        actorEmail: "demo+kowa@gowa58.co.jp",
        action: "invitation.resent",
        targetType: "invitation",
        targetId: "inv_pending_satoh",
        metadata: JSON.stringify({ email: "satoh-driver@gowa58.co.jp" }),
        createdAt: subDays(now, 1),
      },
      {
        actorId: "demo-kowa",
        actorEmail: "demo+kowa@gowa58.co.jp",
        action: "invitation.revoked",
        targetType: "invitation",
        targetId: "inv_revoked_temp",
        metadata: JSON.stringify({ email: "temp-spam@example.com" }),
        createdAt: subDays(now, 2),
      },
      {
        actorId: "demo-kowa",
        actorEmail: "demo+kowa@gowa58.co.jp",
        action: "invitation.accepted",
        targetType: "invitation",
        targetId: "inv_accepted_kondoh",
        metadata: JSON.stringify({ email: "kondoh@gowa58.co.jp" }),
        createdAt: subDays(now, 12),
      },
    ],
  });

  console.log("Done. Counts:");
  console.log("  users       :", await db.user.count());
  console.log("  customers   :", await db.customer.count());
  console.log("  mappings    :", await db.lineMapping.count());
  console.log("  tickets     :", await db.ticket.count());
  console.log("  messages    :", await db.message.count());
  console.log("  invitations :", await db.invitation.count());
  console.log("  emailLogs   :", await db.inviteEmailLog.count());
  console.log("  auditLogs   :", await db.auditLog.count());
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
