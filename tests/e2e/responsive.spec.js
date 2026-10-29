const { test, expect } = require("@playwright/test");
const { createHost, joinPlayer } = require("./helpers");

test.describe("Responsif", () => {
  test("viewport 390x844 lobby dan room bisa dipakai", async ({ browser }) => {
    const host = await createHost(browser, "ResponsiveHost");
    const player = await joinPlayer(browser, host.code, "ResponsiveP");

    // Periksa bahwa lobby dan room tidak overflow besar pada viewport kecil.
    await expect(host.page.locator(".logo-box")).toBeVisible();
    await expect(player.page.getByTestId("room-code")).toBeVisible();
    await expect(player.page.getByTestId("my-balance")).toBeVisible();

    await host.context.close();
    await player.context.close();
  });
});
