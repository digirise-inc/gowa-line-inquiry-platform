import { test, expect } from "@playwright/test";

/**
 * 公開エンドポイント (認証不要) の動作確認
 */

test.describe("公開API", () => {
  test("/api/health は 200 を返す", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
  });

  test("/api/webhook/line GET でヘルス情報を返す", async ({ request }) => {
    const res = await request.get("/api/webhook/line");
    expect(res.status()).toBe(200);
  });

  test("/api/webhook/line POST はDEMO_MODEで200を返す (署名スキップ)", async ({ request }) => {
    const res = await request.post("/api/webhook/line", {
      headers: { "Content-Type": "application/json" },
      data: { events: [] },
    });
    expect(res.status()).toBe(200);
  });
});
