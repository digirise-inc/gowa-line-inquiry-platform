// 手動スクショ用 (npx node tests/screenshot.mjs)
// dev server を localhost:3010 で起動済の前提
import { chromium } from "@playwright/test";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3010";
const OUT = path.resolve("tests/screenshots");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  page.on("console", (m) => console.log("[browser]", m.type(), m.text()));

  // 1) Login → demo kowa
  await page.goto(`${BASE}/login?demo=true`, { waitUntil: "networkidle" });
  console.log("Loaded login");
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/01_login.png`, fullPage: true });

  // demo login: kowa を選ぶカード (data-testid or button text)
  const kowaCard = page.locator('button, a').filter({ hasText: '後和 直樹' }).first();
  if (await kowaCard.isVisible()) {
    await kowaCard.click();
  } else {
    // フォールバック: 任意の demo button
    const btn = page.locator('button').filter({ hasText: 'ログイン' }).first();
    if (await btn.isVisible()) await btn.click();
  }

  // ダッシュボードへ遷移待ち
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15_000 }).catch(() => {});
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/02_dashboard.png`, fullPage: true });

  // 2) /mappings へ
  await page.goto(`${BASE}/mappings`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  console.log("Loaded /mappings");
  await page.screenshot({ path: `${OUT}/03_mappings.png`, fullPage: true });

  // 3) 紐付けダイアログを開く (link-btn-* )
  const firstLinkBtn = page.locator('[data-testid^="link-btn-"]').first();
  if (await firstLinkBtn.isVisible()) {
    await firstLinkBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/04_mappings_dialog.png`, fullPage: true });
  }

  await browser.close();
  console.log("Done. Screenshots in", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
