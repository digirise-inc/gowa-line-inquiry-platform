/**
 * /admin/users と /invite/[token] の E2E テスト。
 *
 * 前提:
 *   - DEMO_MODE=true / NEXT_PUBLIC_DEMO_MODE=true で dev server 起動
 *   - prisma db push + db:seed 実行済み
 *
 * カバレッジ:
 *   1. 後和専務 (kowa) でログイン → /admin/users にアクセスできる
 *   2. 一般スタッフ (中尾 staff_office) は /admin/users で / にリダイレクト (denied)
 *   3. 招待ダイアログを開いて入力 → 送信 → 招待URL表示
 *   4. /invite/<demo-token-pending-saito> で受諾画面が表示される
 *   5. /invite/<demo-token-revoked> で「取消されました」表示
 *   6. /invite/<demo-token-expired> で「失効しています」表示
 */
import { test, expect, type Page } from "@playwright/test";

async function loginAs(
  page: Page,
  role: "kowa" | "staff_office" | "driver" | "finance",
) {
  await page.goto("/login");
  await page.getByTestId("demo-section").waitFor({ state: "visible" });
  const card = page.getByTestId(`demo-card-${role}`);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 15_000,
    }),
    card.click(),
  ]);
}

test.describe("/admin/users 権限", () => {
  test("kowa は /admin/users にアクセスできる", async ({ page }) => {
    await loginAs(page, "kowa");
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/admin\/users/);
    // 統計タイル確認
    await expect(page.getByTestId("stat-totalUsers")).toBeVisible();
    await expect(page.getByTestId("stat-pendingInvitations")).toBeVisible();
    // 招待ボタンがある
    await expect(page.getByTestId("open-invite-dialog")).toBeVisible();
  });

  test("finance は /admin/users にアクセスできる", async ({ page }) => {
    await loginAs(page, "finance");
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByTestId("stat-totalUsers")).toBeVisible();
  });

  test("staff_office (中尾) は /admin/users から / に蹴られる", async ({ page }) => {
    await loginAs(page, "staff_office");
    await page.goto("/admin/users");
    // middleware が / にリダイレクトする
    await page.waitForURL((url) => url.pathname === "/", { timeout: 10_000 });
    expect(page.url()).toContain("denied=");
  });

  test("driver も /admin/users から / に蹴られる", async ({ page }) => {
    await loginAs(page, "driver");
    await page.goto("/admin/users");
    await page.waitForURL((url) => url.pathname === "/", { timeout: 10_000 });
    expect(page.url()).toContain("denied=");
  });
});

test.describe("招待ダイアログ", () => {
  test("kowa が招待ダイアログを開いて入力 → 送信 → 招待URL表示", async ({
    page,
  }) => {
    await loginAs(page, "kowa");
    await page.goto("/admin/users");
    // ダイアログ open
    await page.getByTestId("open-invite-dialog").click();
    await expect(page.getByTestId("invite-form")).toBeVisible();

    // 入力
    const ts = Date.now();
    const email = `test+invite-${ts}@gowa58.co.jp`;
    await page.getByTestId("invite-email-input").fill(email);

    // 送信
    await page.getByTestId("invite-submit").click();

    // 成功画面
    await expect(page.getByTestId("invite-success")).toBeVisible({
      timeout: 10_000,
    });
    const url = page.getByTestId("invite-url");
    await expect(url).toBeVisible();
    const urlText = await url.innerText();
    expect(urlText).toContain("/invite/");
  });

  test("不正な email でバリデーションエラー", async ({ page }) => {
    await loginAs(page, "kowa");
    await page.goto("/admin/users");
    await page.getByTestId("open-invite-dialog").click();
    await page.getByTestId("invite-email-input").fill("not-an-email");
    await page.getByTestId("invite-submit").click();
    // 成功画面が出ないこと
    await expect(page.getByTestId("invite-success")).toHaveCount(0);
    // フォームは残る
    await expect(page.getByTestId("invite-form")).toBeVisible();
  });
});

test.describe("/invite/[token] 公開ページ", () => {
  test("有効な招待トークンで受諾画面が表示される", async ({ page }) => {
    await page.goto("/invite/demo-token-pending-saito");
    await expect(page.getByTestId("invitation-accept-card")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId("invite-accept-submit")).toBeVisible();
  });

  test("取消済の招待で『取り消されました』表示", async ({ page }) => {
    await page.goto("/invite/demo-token-revoked");
    await expect(page.getByTestId("invitation-error-card")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("取り消されました")).toBeVisible();
  });

  test("失効した招待で『失効しています』表示", async ({ page }) => {
    await page.goto("/invite/demo-token-expired");
    await expect(page.getByTestId("invitation-error-card")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("失効しています")).toBeVisible();
  });

  test("不正なトークンで『無効です』表示", async ({ page }) => {
    await page.goto("/invite/totally-bogus-token");
    await expect(page.getByTestId("invitation-error-card")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("招待リンクが無効です")).toBeVisible();
  });
});
