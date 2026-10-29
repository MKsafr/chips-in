const { test, expect } = require("@playwright/test");
const { createHost, joinPlayer } = require("./helpers");

test.describe("Room multiplayer & mode game", () => {
  test("host membuat room, pemain kedua bergabung, mode bisa diganti", async ({ browser }) => {
    const host = await createHost(browser, "HostTest");
    const player = await joinPlayer(browser, host.code, "PlayerTest");

    // Kedua sisi melihat satu sama lain (lewat SSE).
    await expect(
      player.page.locator("[data-player-name]", { hasText: "HostTest" }).first(),
    ).toBeVisible();
    await expect(
      host.page.locator("[data-player-name]", { hasText: "PlayerTest" }).first(),
    ).toBeVisible();

    // Host membuka Kontrol Dealer lalu mengganti mode ke Blackjack.
    await host.page.getByRole("button", { name: /Kontrol Dealer/ }).click();
    await expect(host.page.locator(".dealer-controls-heading")).toBeVisible();
    await host.page.getByRole("button", { name: /Blackjack/ }).click();

    await expect(
      host.page.locator(".logo", { hasText: "Blackjack" }).first(),
    ).toBeVisible();
    // Perubahan mode tersinkron ke pemain lewat SSE.
    await expect(
      player.page.locator(".logo", { hasText: "Blackjack" }).first(),
    ).toBeVisible();

    await host.context.close();
    await player.context.close();
  });
});
