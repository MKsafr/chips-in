const { test, expect } = require("@playwright/test");
const { newPage } = require("./helpers");

test.describe("Halaman legal", () => {
  const pages = [
    { path: "/about", titleId: "Tentang Chips-in", titleEn: "About Chips-in" },
    { path: "/terms", titleId: "Ketentuan Layanan", titleEn: "Terms of Service" },
    { path: "/privacy", titleId: "Kebijakan Privasi", titleEn: "Privacy Policy" },
  ];

  for (const item of pages) {
    test(`halaman ${item.path}`, async ({ browser }) => {
      const { context, page } = await newPage(browser);
      await page.goto(item.path, { waitUntil: "load" });
      await expect(page.locator("title")).not.toBeEmpty();
      await expect(page.locator("main h1, header h1").first()).toBeVisible();
      await context.close();
    });
  }
});
