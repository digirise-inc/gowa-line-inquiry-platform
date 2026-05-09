/**
 * /admin/users と /invite/[token] のスクリーンショットを撮るユーティリティ。
 *
 * 使い方:
 *   pnpm dev   # 別タブで起動しておく
 *   npx tsx scripts/capture-admin-screenshots.ts
 *
 * 出力先: docs/screenshots/
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const BASE = process.env.SCREENSHOT_BASE ?? "http://localhost:3000";
const OUT = join(process.cwd(), "docs", "screenshots");

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // 1. ログイン (kowa)
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("demo-section").waitFor();
  await page.screenshot({
    path: join(OUT, "01-login.png"),
    fullPage: false,
  });
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 15_000,
    }),
    page.getByTestId("demo-card-kowa").click(),
  ]);

  // 2. /admin/users (一覧)
  await page.goto(`${BASE}/admin/users`, { waitUntil: "networkidle" });
  await page.getByTestId("stat-totalUsers").waitFor();
  await page.screenshot({
    path: join(OUT, "02-admin-users-list.png"),
    fullPage: true,
  });

  // 3. ペンディング招待タブ
  await page.getByTestId("tab-pending").click();
  await page.waitForTimeout(400);
  await page.screenshot({
    path: join(OUT, "03-admin-users-pending.png"),
    fullPage: true,
  });

  // 4. 招待ダイアログ
  await page.getByTestId("tab-users").click();
  await page.getByTestId("open-invite-dialog").click();
  await page.getByTestId("invite-form").waitFor();
  // dialog overlay のフェードイン完了を待つ
  await page.waitForTimeout(600);
  await page.screenshot({
    path: join(OUT, "04-invite-dialog.png"),
    fullPage: false,
  });

  // 5. 招待ダイアログ - 入力後 → 成功
  await page
    .getByTestId("invite-email-input")
    .fill(`screenshot+${Date.now()}@gowa58.co.jp`);
  await page.getByTestId("invite-submit").click();
  await page.getByTestId("invite-success").waitFor({ timeout: 10_000 });
  await page.screenshot({
    path: join(OUT, "05-invite-success.png"),
    fullPage: false,
  });
  // ESCで閉じる
  await page.keyboard.press("Escape");

  // 6. /invite/[token] (有効)
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const inv = await ctx2.newPage();
  await inv.goto(`${BASE}/invite/demo-token-pending-saito`, {
    waitUntil: "networkidle",
  });
  await inv.getByTestId("invitation-accept-card").waitFor({ timeout: 10_000 });
  await inv.screenshot({
    path: join(OUT, "06-invite-accept.png"),
    fullPage: false,
  });

  // 7. /invite/[token] (失効)
  await inv.goto(`${BASE}/invite/demo-token-expired`, {
    waitUntil: "networkidle",
  });
  await inv.getByTestId("invitation-error-card").waitFor({ timeout: 10_000 });
  await inv.screenshot({
    path: join(OUT, "07-invite-expired.png"),
    fullPage: false,
  });

  // 8. /invite/[token] (取消)
  await inv.goto(`${BASE}/invite/demo-token-revoked`, {
    waitUntil: "networkidle",
  });
  await inv.getByTestId("invitation-error-card").waitFor({ timeout: 10_000 });
  await inv.screenshot({
    path: join(OUT, "08-invite-revoked.png"),
    fullPage: false,
  });

  // 9. /invite/[token] (不正)
  await inv.goto(`${BASE}/invite/totally-bogus-token`, {
    waitUntil: "networkidle",
  });
  await inv.getByTestId("invitation-error-card").waitFor({ timeout: 10_000 });
  await inv.screenshot({
    path: join(OUT, "09-invite-invalid.png"),
    fullPage: false,
  });

  await browser.close();
  console.log(`Screenshots saved to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
