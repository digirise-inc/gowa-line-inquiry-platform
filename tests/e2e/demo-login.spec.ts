import { test, expect, type Page } from "@playwright/test";

/**
 * デモログイン E2E
 *
 * 前提:
 *   - DEMO_MODE=true / NEXT_PUBLIC_DEMO_MODE=true で dev server が起動していること
 *   - prisma db push + db:seed が完了していること
 *
 * カバレッジ:
 *   1. /login が 4 つのデモカードを表示する
 *   2. 各ロールでワンクリックログイン → / に到達 → DemoBanner が現れる
 *   3. driver / staff_office は /settings にアクセスすると / に蹴られる (denied)
 *   4. kowa / finance は /settings にアクセスできる
 */

const ROLES = [
  { role: "kowa", name: "後和 直樹", title: "専務 / 管理者", canAccessSettings: true },
  { role: "staff_office", name: "中尾 花子", title: "管理部・事務員", canAccessSettings: false },
  { role: "driver", name: "田中 健", title: "営業ドライバー", canAccessSettings: false },
  { role: "finance", name: "辻野 和彦", title: "経理 / 横断管理", canAccessSettings: true },
] as const;

async function loginAs(page: Page, role: (typeof ROLES)[number]["role"]) {
  await page.goto("/login");
  // デモセクションが見える
  await expect(page.getByTestId("demo-section")).toBeVisible();
  // 該当カードをクリック
  const card = page.getByTestId(`demo-card-${role}`);
  await expect(card).toBeVisible();
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 }),
    card.click(),
  ]);
}

test.describe("デモログイン", () => {
  test("/login に 4 つのデモカードが表示される", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByTestId("demo-section")).toBeVisible();
    for (const r of ROLES) {
      await expect(page.getByTestId(`demo-card-${r.role}`)).toBeVisible();
    }
  });

  for (const r of ROLES) {
    test(`${r.role} (${r.name}) でログイン → ダッシュボードに到達 + DemoBanner 表示`, async ({ page }) => {
      await loginAs(page, r.role);
      // / 配下に到達
      expect(page.url()).toMatch(/\/$|\/\?/);
      // バナーが見える
      await expect(page.getByTestId("demo-banner")).toBeVisible();
      // ユーザー名がトップバー or バナーに出る
      await expect(page.locator("body")).toContainText(r.name);
    });

    test(`${r.role}: /settings の権限差分`, async ({ page }) => {
      await loginAs(page, r.role);
      const resp = await page.goto("/settings");
      // 200 で settings が出る or リダイレクトされて denied=… が付く
      if (r.canAccessSettings) {
        // /settings のままに留まる (HTTP は middleware の挙動次第で 200/308)
        expect(page.url()).toContain("/settings");
      } else {
        // / に蹴られて denied クエリが付く
        expect(page.url()).toContain("denied=");
      }
      expect(resp).not.toBeNull();
    });
  }

  test("『他のロールで試す』リンクから別ロールへ切替できる", async ({ page }) => {
    await loginAs(page, "kowa");
    // 一旦 /login?demo=true へ
    await page.goto("/login?demo=true");
    await expect(page.getByTestId("demo-section")).toBeVisible();
    // 別ロール (driver) へ
    const card = page.getByTestId("demo-card-driver");
    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 }),
      card.click(),
    ]);
    await expect(page.locator("body")).toContainText("田中 健");
  });
});
