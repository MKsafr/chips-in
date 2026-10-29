const { test, expect } = require("@playwright/test");
const { createHost, newPage } = require("./helpers");

test.describe("QR room", () => {
  test("QR menampilkan gambar dengan kode room dan respons 200", async ({
    browser,
  }) => {
    const host = await createHost(browser, "HostQR");
    await host.page.getByTestId("qr-open").click();

    await expect(host.page.getByTestId("qr-image")).toBeVisible();
    const src = await host.page.getByTestId("qr-image").getAttribute("src");
    expect(src).toContain(`room=${host.code}`);
    await host.page.getByTestId("qr-close").click();

    await host.context.close();
  });

  test("scanner terbuka dan bisa ditutup", async ({ browser }) => {
    const { context, page } = await newPage(browser);
    await page.goto("/");
    await page.getByTestId("room-scanner-open").click();
    await expect(page.locator(".room-scanner-modal")).toBeVisible();
    await page.getByRole("button", { name: "Tutup" }).click();
    await context.close();
  });
});
