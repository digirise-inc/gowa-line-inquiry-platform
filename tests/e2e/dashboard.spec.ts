import { test, expect, type Page } from "@playwright/test";

/**
 * ダッシュボード / 主要画面の存在確認
 */

async function loginKowa(page: Page) {
  await page.goto("/login");
  await page.getByTestId("demo-card-kowa").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15_000 });
}

test.describe("メイン画面", () => {
  test("ダッシュボードに 4 つの KPI タイルと AI/運用メトリクスが表示される", async ({ page }) => {
    await loginKowa(page);
    await page.goto("/");
    // 4 つのKPI ラベル
    for (const label of ["未対応", "対応中", "完了", "失注"]) {
      await expect(page.locator("body")).toContainText(label);
    }
    await expect(page.locator("body")).toContainText("AI捕捉率");
    await expect(page.locator("body")).toContainText("平均一次応答時間");
  });

  test("チケット一覧ページが表示される", async ({ page }) => {
    await loginKowa(page);
    await page.goto("/tickets");
    await expect(page.getByRole("heading", { name: /チケット一覧/ })).toBeVisible();
    // フィルタバーの存在
    await expect(page.locator("body")).toContainText("未紐付けのみ");
  });

  test("カンバンビューが 8 カラム表示される", async ({ page }) => {
    await loginKowa(page);
    await page.goto("/kanban");
    await expect(page.getByRole("heading", { name: /カンバン/ })).toBeVisible();
    for (const label of ["未対応", "一次対応中", "社内確認中", "仕入先見積中", "回答待ち", "回答完了", "案件完了", "失注"]) {
      await expect(page.locator("body")).toContainText(label);
    }
  });

  test("マッピング管理ページが表示される", async ({ page }) => {
    await loginKowa(page);
    await page.goto("/mappings");
    await expect(page.getByRole("heading", { name: /マッピング管理/ })).toBeVisible();
    await expect(page.locator("body")).toContainText("紐付け済");
    await expect(page.locator("body")).toContainText("AI紐付け候補");
  });

  test("チャット統合ページに 3 つのタブがある", async ({ page }) => {
    await loginKowa(page);
    await page.goto("/chat");
    await expect(page.getByRole("heading", { name: /チャット統合/ })).toBeVisible();
    for (const tab of ["LINE", "Google Chat", "メール"]) {
      await expect(page.locator("body")).toContainText(tab);
    }
  });
});
