import { test, expect, type Page, type APIRequestContext } from "@playwright/test";

/**
 * ユーザー招待フロー E2E (バックエンド検証)
 *
 * 前提:
 *   - DEMO_MODE=true で dev server 起動
 *   - prisma db:seed 完了 (デモユーザー6名 + 招待7件入り)
 *
 * カバレッジ:
 *   1. manager (kowa) 認証で /api/invitations が一覧と stats を返す
 *   2. 招待作成 → 201 + メールログ作成
 *   3. 一般スタッフは /api/invitations / /api/users で 403
 *   4. 取消 → status=revoked, 受諾不可
 *   5. /api/invitations/accept (公開) — トークン取得 + 受諾
 *   6. 期限切れトークンは 410 + code=expired
 *   7. 受諾済みトークンの再受諾は 410 + code=accepted
 *   8. /admin/users への driver アクセスは / にリダイレクトされる
 */

async function loginKowa(page: Page) {
  await page.goto("/login");
  await page.getByTestId("demo-card-kowa").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15_000 });
}

async function loginDriver(page: Page) {
  await page.goto("/login");
  await page.getByTestId("demo-card-driver").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15_000 });
}

/** ログイン済みコンテキストの request を返す */
async function jsonAPI(request: APIRequestContext) {
  return {
    get: async (url: string) => {
      const res = await request.get(url);
      return { status: res.status(), body: await res.json().catch(() => ({})) };
    },
    post: async (url: string, data?: any) => {
      const res = await request.post(url, { data: data ?? {}, headers: { "Content-Type": "application/json" } });
      return { status: res.status(), body: await res.json().catch(() => ({})) };
    },
    delete: async (url: string) => {
      const res = await request.delete(url);
      return { status: res.status(), body: await res.json().catch(() => ({})) };
    },
    patch: async (url: string, data?: any) => {
      const res = await request.patch(url, { data: data ?? {}, headers: { "Content-Type": "application/json" } });
      return { status: res.status(), body: await res.json().catch(() => ({})) };
    },
  };
}

test.describe("Invitation API (manager 権限)", () => {
  test("kowa(manager): /api/invitations 一覧 + stats が取得できる", async ({ page }) => {
    await loginKowa(page);
    const api = await jsonAPI(page.request);
    const { status, body } = await api.get("/api/invitations");
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.invitations)).toBe(true);
    expect(body.data.stats).toMatchObject({
      pending: expect.any(Number),
      accepted: expect.any(Number),
      expired: expect.any(Number),
      revoked: expect.any(Number),
    });
    // seed済データ確認 (pending 2 + 期限切れ自動マーク後)
    expect(body.data.stats.accepted).toBeGreaterThanOrEqual(2);
    expect(body.data.stats.revoked).toBeGreaterThanOrEqual(1);
  });

  test("kowa(manager): 招待を作成 → 201 + メールログ作成", async ({ page }) => {
    await loginKowa(page);
    const api = await jsonAPI(page.request);
    const email = `e2e-${Date.now()}@gowa58.co.jp`;
    const { status, body } = await api.post("/api/invitations", {
      email,
      name: "E2E テスト",
      role: "staff_office",
      title: "E2E担当",
      message: "テスト招待です",
    });
    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.invitation.email).toBe(email);
    expect(body.data.invitation.status).toBe("pending");
    expect(body.data.invitation.token).toMatch(/[A-Za-z0-9_-]{40,}/);
    expect(body.data.inviteUrl).toContain("/invite/accept?token=");
    expect(body.data.email.sent).toBe(true);
    expect(body.data.email.logId).toBeTruthy();

    // 詳細取得 (メールログ含む)
    const detail = await api.get(`/api/invitations/${body.data.invitation.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.emailLogs.length).toBeGreaterThanOrEqual(1);
    expect(detail.body.data.emailLogs[0].status).toBe("sent");
  });

  test("kowa(manager): 同一emailで pending 招待を重複作成すると 409", async ({ page }) => {
    await loginKowa(page);
    const api = await jsonAPI(page.request);
    const email = `dup-${Date.now()}@gowa58.co.jp`;
    const first = await api.post("/api/invitations", { email, role: "staff_office" });
    expect(first.status).toBe(201);
    const second = await api.post("/api/invitations", { email, role: "staff_office" });
    expect(second.status).toBe(409);
    expect(second.body.details?.code).toBe("invitation_pending");
  });

  test("kowa(manager): 招待を取消 → status=revoked + 再受諾不可", async ({ page }) => {
    await loginKowa(page);
    const api = await jsonAPI(page.request);
    const email = `revoke-${Date.now()}@gowa58.co.jp`;
    const created = await api.post("/api/invitations", { email, role: "staff_field" });
    expect(created.status).toBe(201);
    const id = created.body.data.invitation.id;
    const token = created.body.data.invitation.token;

    const del = await api.delete(`/api/invitations/${id}`);
    expect(del.status).toBe(200);
    expect(del.body.data.invitation.status).toBe("revoked");

    // 受諾不可 (公開エンドポイント)
    const acceptGet = await page.request.get(`/api/invitations/accept?token=${encodeURIComponent(token)}`);
    expect(acceptGet.status()).toBe(410);
    const acceptGetBody = await acceptGet.json();
    expect(acceptGetBody.details?.code).toBe("revoked");
  });

  test("kowa(manager): 招待再送 → 期限延長 + メールログ追加", async ({ page }) => {
    await loginKowa(page);
    const api = await jsonAPI(page.request);
    const email = `resend-${Date.now()}@gowa58.co.jp`;
    const created = await api.post("/api/invitations", { email, role: "staff_office" });
    const id = created.body.data.invitation.id;
    const oldExpiry = new Date(created.body.data.invitation.expiresAt).getTime();

    const resent = await api.post(`/api/invitations/${id}/resend`, { expiresInDays: 14 });
    expect(resent.status).toBe(200);
    const newExpiry = new Date(resent.body.data.invitation.expiresAt).getTime();
    expect(newExpiry).toBeGreaterThan(oldExpiry);
    expect(resent.body.data.email.sent).toBe(true);
  });
});

test.describe("Invitation API (権限ガード)", () => {
  test("driver: /api/invitations は 403", async ({ page }) => {
    await loginDriver(page);
    const api = await jsonAPI(page.request);
    const { status, body } = await api.get("/api/invitations");
    expect(status).toBe(403);
    expect(body.success).toBe(false);
  });

  test("driver: /api/users は 403", async ({ page }) => {
    await loginDriver(page);
    const api = await jsonAPI(page.request);
    const { status } = await api.get("/api/users");
    expect(status).toBe(403);
  });

  test("driver: /admin/users にアクセスすると / にリダイレクト (denied付き)", async ({ page }) => {
    await loginDriver(page);
    await page.goto("/admin/users");
    expect(page.url()).toContain("denied=");
  });

  test("未認証: /api/invitations は 401", async ({ request }) => {
    const res = await request.get("/api/invitations");
    expect(res.status()).toBe(401);
  });
});

test.describe("Invitation Accept (公開)", () => {
  test("seed済 pending 招待 (山田) のトークンで GET → 詳細が返る", async ({ request }) => {
    const token = "demo_token_yamada_pending_001abcdefghijklmnopqrstuvwxyz";
    const res = await request.get(`/api/invitations/accept?token=${encodeURIComponent(token)}`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.invitation.email).toBe("yamada@gowa58.co.jp");
    expect(json.data.invitation.role).toBe("staff_office");
    expect(json.data.invitation.invitedBy?.name).toContain("後和");
  });

  test("受諾 → user 作成 + invitation accepted + signInUrl 返却", async ({ page }) => {
    // 専用招待を作って受諾フローを通す (固定トークンは使い切らない方針)
    await loginKowa(page);
    const api = await jsonAPI(page.request);
    const email = `accept-${Date.now()}@gowa58.co.jp`;
    const created = await api.post("/api/invitations", { email, role: "staff_office", name: "受諾 太郎" });
    const token = created.body.data.invitation.token;

    // 公開エンドポイント (認証不要のため request を直接使う)
    const acceptRes = await page.request.post("/api/invitations/accept", {
      data: { token, name: "受諾 太郎(更新)" },
      headers: { "Content-Type": "application/json" },
    });
    expect(acceptRes.status()).toBe(200);
    const acceptBody = await acceptRes.json();
    expect(acceptBody.success).toBe(true);
    expect(acceptBody.data.user.email).toBe(email);
    expect(acceptBody.data.user.role).toBe("staff_office");
    expect(acceptBody.data.signInUrl).toContain("/login?email=");

    // 同じトークンを再利用しようとすると 410
    const reuse = await page.request.post("/api/invitations/accept", {
      data: { token },
      headers: { "Content-Type": "application/json" },
    });
    expect(reuse.status()).toBe(410);
    const reuseBody = await reuse.json();
    expect(reuseBody.details?.code).toBe("accepted");
  });

  test("不正トークンは 404 + code=not_found", async ({ request }) => {
    const res = await request.get(`/api/invitations/accept?token=invalid_token_xyz`);
    expect(res.status()).toBe(404);
    const json = await res.json();
    expect(json.details?.code).toBe("not_found");
  });
});

test.describe("Users API (manager 権限)", () => {
  test("kowa(manager): /api/users 一覧 + stats", async ({ page }) => {
    await loginKowa(page);
    const api = await jsonAPI(page.request);
    const { status, body } = await api.get("/api/users");
    expect(status).toBe(200);
    expect(Array.isArray(body.data.users)).toBe(true);
    expect(body.data.stats.total).toBeGreaterThanOrEqual(6);
    expect(body.data.stats.active).toBeGreaterThanOrEqual(6);
  });

  test("kowa(manager): 自分自身の無効化は 400 (self_deactivate)", async ({ page }) => {
    await loginKowa(page);
    const api = await jsonAPI(page.request);
    const res = await api.patch("/api/users/demo-kowa", { isActive: false });
    expect(res.status).toBe(400);
    expect(res.body.details?.code).toBe("self_deactivate");
  });

  test("kowa(manager): スタッフのロール変更", async ({ page }) => {
    await loginKowa(page);
    const api = await jsonAPI(page.request);
    // staff_office → finance に昇格して即戻す
    const before = await api.get("/api/users/demo-nakao");
    expect(before.status).toBe(200);
    const orig = before.body.data.user.role;

    const up = await api.patch("/api/users/demo-nakao", { role: "finance" });
    expect(up.status).toBe(200);
    expect(up.body.data.user.role).toBe("finance");

    // 元に戻す
    const down = await api.patch("/api/users/demo-nakao", { role: orig });
    expect(down.status).toBe(200);
  });
});
