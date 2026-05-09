"""本番E2Eテスト v2（locator修正版）"""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

BASE = "https://gowa-platform.vercel.app"
SHOTS = Path("/Users/masahirochaen/work/digirise/clients/post-order/active/gowa/02_post-order/products/issue-01-line-inquiry/app/tests/screenshots-prod")
SHOTS.mkdir(exist_ok=True)

results = []

def record(name, ok, detail=""):
    results.append({"name": name, "ok": ok, "detail": detail})
    sym = "✅" if ok else "❌"
    print(f"  {sym} {name}" + (f" — {detail}" if detail else ""))

async def login_as(p, role, expand_first=False):
    await p.goto(f"{BASE}/login", wait_until="networkidle", timeout=20000)
    await p.wait_for_timeout(1500)
    if expand_first:
        await p.locator('button:has-text("他のロールで試す")').click()
        await p.wait_for_timeout(800)
    await p.locator(f'[data-testid="demo-card-{role}"]').click(timeout=8000)
    await p.wait_for_timeout(7000)

async def visit_check(p, path, name):
    await p.goto(f"{BASE}{path}", wait_until="networkidle", timeout=20000)
    await p.wait_for_timeout(2500)
    body = await p.locator("body").inner_text()
    if "Application error" in body or "An error occurred" in body:
        record(name, False, "server error"); return False
    record(name, True, f"len={len(body)}"); return True

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()

        # ── G1: ログイン画面 ───────────────────────────
        print("\n=== G1: ログイン画面 ===")
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, locale="ja-JP")
        p = await ctx.new_page()
        errs = []
        p.on("pageerror", lambda e: errs.append(("pageerror", str(e)[:150])))
        await p.goto(f"{BASE}/login", wait_until="networkidle", timeout=20000)
        await p.wait_for_timeout(1500)
        body = await p.locator("body").inner_text()
        record("G1.1 業務管理プラットフォーム表示", "業務管理プラットフォーム" in body)
        record("G1.2 Googleログインボタン表示", "Google アカウント" in body)
        record("G1.3 管理者ボタン表示", await p.locator('[data-testid="demo-card-kowa"]').count() == 1)
        record("G1.4 一般社員ボタン表示", await p.locator('[data-testid="demo-card-staff_office"]').count() == 1)
        record("G1.5 折りたたみボタン表示", await p.locator('button:has-text("他のロールで試す")').count() == 1)
        record("G1.6 デモバナー表示", "デモモード稼働中" in body)
        record("G1.7 pageerror 0件", len(errs) == 0, f"errs={len(errs)}")
        await p.screenshot(path=str(SHOTS / "01_login.png"), full_page=True)
        await ctx.close()

        # ── G2: 折りたたみ展開 ───────────────────────────
        print("\n=== G2: 「他のロール」展開 ===")
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, locale="ja-JP")
        p = await ctx.new_page()
        await p.goto(f"{BASE}/login", wait_until="networkidle", timeout=20000)
        await p.wait_for_timeout(1500)
        record("G2.0 展開前: driverカード非表示", await p.locator('[data-testid="demo-card-driver"]').count() == 0)
        await p.locator('button:has-text("他のロールで試す")').click()
        await p.wait_for_timeout(1000)
        body = await p.locator("body").inner_text()
        record("G2.1 展開後: 田中 健 表示", "田中 健" in body)
        record("G2.2 展開後: 辻野 和彦 表示", "辻野 和彦" in body)
        record("G2.3 driverカード表示", await p.locator('[data-testid="demo-card-driver"]').count() == 1)
        record("G2.4 financeカード表示", await p.locator('[data-testid="demo-card-finance"]').count() == 1)
        await p.screenshot(path=str(SHOTS / "02_login_expanded.png"), full_page=True)
        await ctx.close()

        # ── G3: 管理者ロール ───────────────────────────
        print("\n=== G3: 管理者ロール ===")
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, locale="ja-JP")
        p = await ctx.new_page()
        await login_as(p, "kowa")
        body = await p.locator("body").inner_text()
        record("G3.1 ダッシュボード遷移", p.url == f"{BASE}/")
        record("G3.2 「後和 直樹」表示", "後和 直樹" in body)
        record("G3.3 「専務」表示", "専務" in body)
        record("G3.4 KPI「未対応」表示", "未対応" in body)
        record("G3.5 KPI「対応中」表示", "対応中" in body)
        record("G3.6 KPI「完了」表示", "完了" in body)
        record("G3.7 KPI「失注」表示", "失注" in body)
        record("G3.8 ユーザー管理リンク表示（manager only）", "ユーザー管理" in body)
        record("G3.9 設定リンク表示", "設定" in body)
        record("G3.10 Application error なし", "Application error" not in body)
        await p.screenshot(path=str(SHOTS / "03_dashboard_admin.png"), full_page=True)

        # ナビゲーション
        await visit_check(p, "/tickets",     "G3.11 /tickets 表示")
        await p.screenshot(path=str(SHOTS / "04_tickets_admin.png"), full_page=True)
        await visit_check(p, "/kanban",      "G3.12 /kanban 表示")
        await p.screenshot(path=str(SHOTS / "05_kanban_admin.png"), full_page=True)
        await visit_check(p, "/chat",        "G3.13 /chat 表示")
        await p.screenshot(path=str(SHOTS / "06_chat_admin.png"), full_page=True)
        await visit_check(p, "/mappings",    "G3.14 /mappings 表示")
        await p.screenshot(path=str(SHOTS / "07_mappings_admin.png"), full_page=True)
        await visit_check(p, "/admin/users", "G3.15 /admin/users 表示（manager OK）")
        await p.screenshot(path=str(SHOTS / "08_admin_users.png"), full_page=True)
        await visit_check(p, "/settings",    "G3.16 /settings 表示（manager OK）")
        await p.screenshot(path=str(SHOTS / "09_settings_admin.png"), full_page=True)
        await ctx.close()

        # ── G4: 一般社員ロール + 権限差分 ───────────────
        print("\n=== G4: 一般社員 + 権限差分 ===")
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, locale="ja-JP")
        p = await ctx.new_page()
        await login_as(p, "staff_office")
        body = await p.locator("body").inner_text()
        record("G4.1 ダッシュボード遷移", p.url == f"{BASE}/")
        record("G4.2 「中尾 花子」表示", "中尾 花子" in body)
        record("G4.3 「管理部・事務員」表示", "管理部" in body)
        record("G4.4 ユーザー管理リンク非表示（権限差分）", "👥 ユーザー管理" not in body)
        await p.screenshot(path=str(SHOTS / "10_dashboard_staff.png"), full_page=True)

        # /admin/users にアクセス → リダイレクト
        await p.goto(f"{BASE}/admin/users", wait_until="networkidle", timeout=20000)
        await p.wait_for_timeout(2500)
        record("G4.5 /admin/users 一般社員アクセス → リダイレクト",
               p.url == f"{BASE}/" or "denied" in p.url)
        await p.screenshot(path=str(SHOTS / "11_staff_admin_denied.png"), full_page=True)
        await ctx.close()

        # ── G5: ドライバーロール ───────────────────────
        print("\n=== G5: 営業ドライバーロール ===")
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, locale="ja-JP")
        p = await ctx.new_page()
        await login_as(p, "driver", expand_first=True)
        body = await p.locator("body").inner_text()
        record("G5.1 ドライバーログイン → ダッシュボード", p.url == f"{BASE}/")
        record("G5.2 「田中 健」表示", "田中 健" in body)
        record("G5.3 「営業ドライバー」表示", "営業ドライバー" in body)
        record("G5.4 ユーザー管理非表示", "👥 ユーザー管理" not in body)
        await p.screenshot(path=str(SHOTS / "13_dashboard_driver.png"), full_page=True)
        await ctx.close()

        # ── G6: 経理ロール ─────────────────────────────
        print("\n=== G6: 経理ロール ===")
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, locale="ja-JP")
        p = await ctx.new_page()
        await login_as(p, "finance", expand_first=True)
        body = await p.locator("body").inner_text()
        record("G6.1 経理ログイン → ダッシュボード", p.url == f"{BASE}/")
        record("G6.2 「辻野 和彦」表示", "辻野 和彦" in body)
        record("G6.3 「経理 / 横断管理」表示", "経理" in body)
        record("G6.4 ユーザー管理リンク表示（financeも管理者扱い）", "ユーザー管理" in body)
        await p.screenshot(path=str(SHOTS / "14_dashboard_finance.png"), full_page=True)
        await ctx.close()

        # ── G7: 招待受諾ページ（公開） ─────────────────
        print("\n=== G7: 招待受諾ページ（公開） ===")
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, locale="ja-JP")
        p = await ctx.new_page()
        await p.goto(f"{BASE}/invite/sample-token-12345", wait_until="networkidle", timeout=20000)
        await p.wait_for_timeout(2500)
        body = await p.locator("body").inner_text()
        record("G7.1 /invite/[token] 公開ページ表示", "業務管理" in body or "招待" in body)
        record("G7.2 Application error なし", "Application error" not in body)
        await p.screenshot(path=str(SHOTS / "12_invite_token.png"), full_page=True)
        await ctx.close()

        # ── G8: ロール切替（リログイン） ───────────────
        print("\n=== G8: ロール切替 ===")
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, locale="ja-JP")
        p = await ctx.new_page()
        await login_as(p, "kowa")
        body1 = await p.locator("body").inner_text()
        record("G8.1 初回: 後和ログイン", "後和 直樹" in body1)
        # /login?demo=true で再ログイン
        await p.goto(f"{BASE}/login?demo=true", wait_until="networkidle", timeout=20000)
        await p.wait_for_timeout(1500)
        await p.locator('[data-testid="demo-card-staff_office"]').click()
        await p.wait_for_timeout(7000)
        body2 = await p.locator("body").inner_text()
        record("G8.2 切替後: 中尾ログイン", "中尾 花子" in body2)
        await ctx.close()

        await browser.close()

    passed = sum(1 for r in results if r["ok"])
    failed = sum(1 for r in results if not r["ok"])
    total = len(results)
    print(f"\n{'='*70}")
    print(f"E2E TEST RESULT: {passed}/{total} pass ({failed} fail)")
    print(f"{'='*70}")
    if failed > 0:
        print("\nFailed tests:")
        for r in results:
            if not r["ok"]:
                print(f"  ❌ {r['name']} — {r['detail']}")
    out = SHOTS / "results.json"
    out.write_text(json.dumps({"passed": passed, "failed": failed, "total": total, "tests": results}, ensure_ascii=False, indent=2))
    print(f"\nResults JSON: {out}")
    print(f"Screenshots: {SHOTS}/")

asyncio.run(main())
