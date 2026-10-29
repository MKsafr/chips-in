const { test, expect } = require("@playwright/test");

// Smoke test + regresi Phase 2 (lazy loading komponen).
test.describe("Smoke & lazy loading", () => {
  test("lobby tampil dan komponen Phase 2 dimuat sesuai kebutuhan", async ({ page }) => {
    let helpRequested = false;
    let scannerRequested = false;
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/assets/js/components/help.js")) helpRequested = true;
      if (url.includes("/assets/js/components/room-scanner.js")) scannerRequested = true;
    });

    await page.goto("/");
    await expect(page.locator("#app")).toContainText("Chips-in");
    await expect(page.getByRole("button", { name: /Buat Ruangan/ })).toBeVisible();

    // Belum ada komponen lazy yang dimuat saat load awal.
    expect(helpRequested).toBe(false);
    expect(scannerRequested).toBe(false);

    // Help dimuat saat diklik.
    await page.locator(".lobby-help-button").click();
    await expect(page.locator(".help-modal")).toBeVisible();
    await expect.poll(() => helpRequested).toBe(true);
    await page.locator(".help-modal .row.sp button").first().click();
    await expect(page.locator(".help-modal")).toHaveCount(0);

    // Scanner dimuat saat diklik (kamera ditolak -> graceful).
    await page.locator(".room-camera-button").click();
    await expect(page.locator(".room-scanner-modal")).toBeVisible();
    await expect.poll(() => scannerRequested).toBe(true);
    await page.locator(".room-scanner-modal button").last().click();
    await expect(page.locator(".room-scanner-modal")).toHaveCount(0);
  });

  test("aset audio MVP disajikan dengan benar", async ({ page }) => {
    const res = await page.request.get("/assets/sounds/mvp/ltg.mp3");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"] || "").toContain("audio/mpeg");

    const tracks = await page.request.get("/assets/sounds/mvp/tracks.json");
    expect(tracks.status()).toBe(200);
    const list = await tracks.json();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });
});
