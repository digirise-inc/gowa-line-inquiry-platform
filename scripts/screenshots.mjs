import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";
import { join } from "path";

const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const PAGES = [
  { name: "01-login", url: "/login", login: false },
  { name: "02-dashboard", url: "/", login: true },
  { name: "03-tickets", url: "/tickets", login: true },
  { name: "04-kanban", url: "/kanban", login: true },
  { name: "05-chat", url: "/chat", login: true },
  { name: "06-mappings", url: "/mappings", login: true },
  { name: "07-settings", url: "/settings", login: true },
];

async function main() {
  const baseURL = process.env.BASE_URL ?? "http://localhost:3000";
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  // login as kowa
  await page.goto(`${baseURL}/login`);
  await page.waitForSelector('[data-testid="demo-card-kowa"]');
  await Promise.all([
    page.waitForURL((u) => !new URL(u).pathname.startsWith("/login"), { timeout: 30_000 }).catch(() => null),
    page.click('[data-testid="demo-card-kowa"]'),
  ]);
  await page.waitForLoadState("networkidle");

  for (const p of PAGES) {
    console.log(`Capturing ${p.name}...`);
    if (!p.login) {
      // logout
      await page.context().clearCookies();
    }
    await page.goto(`${baseURL}${p.url}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800); // settle animations
    await page.screenshot({ path: join(OUT, `${p.name}.png`), fullPage: true });
    if (!p.login) {
      // re-login for next pages
      await page.goto(`${baseURL}/login`);
      await page.click('[data-testid="demo-card-kowa"]');
      await page.waitForURL((u) => !u.pathname.startsWith("/login"));
    }
  }

  // ticket detail
  await page.goto(`${baseURL}/tickets/TKT-1001`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(OUT, "08-ticket-detail.png"), fullPage: true });

  await browser.close();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
