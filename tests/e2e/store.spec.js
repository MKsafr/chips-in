const { test, expect } = require("@playwright/test");
const { createHost, joinPlayer } = require("./helpers");

test.describe("Toko & audio preview", () => {
  test("pemain membuka toko, preview musik diputar, tab border tampil", async ({ browser }) => {
    const host = await createHost(browser, "HostStore");
    const player = await joinPlayer(browser, host.code, "PlayerStore");

    // Tombol toko default membuka Toko Border.
    await player.page.locator(".store-open-button").click();
    await expect(player.page.locator(".border-store-modal")).toBeVisible();

    // Pindah ke tab musik.
    await player.page.getByRole("tab", { name: /Toko Musik/ }).click();
    await expect(player.page.locator(".store-modal")).toBeVisible();
    await expect(player.page.locator(".store-music-item").first()).toBeVisible();

    await player.page.locator(".store-music-preview-button").first().click();

    // Ikon berubah menandakan preview aktif.
    await expect(
      player.page
        .locator(".store-music-preview-button[aria-label*='Hentikan']")
        .first(),
    ).toBeVisible();

    // Elemen audio preview benar-benar diputar (bukan sekadar state UI).
    await expect
      .poll(async () =>
        player.page.evaluate(() => {
          try {
            return Boolean(
              typeof mvpMusicPreviewAudio !== "undefined" &&
                mvpMusicPreviewAudio &&
                !mvpMusicPreviewAudio.paused,
            );
          } catch (e) {
            return false;
          }
        }),
      )
      .toBe(true);

    // Hentikan preview.
    await player.page.locator(".store-music-preview-button").first().click();
    await expect
      .poll(async () =>
        player.page.evaluate(() => {
          try {
            return !(
              typeof mvpMusicPreviewAudio !== "undefined" &&
              mvpMusicPreviewAudio &&
              !mvpMusicPreviewAudio.paused
            );
          } catch (e) {
            return true;
          }
        }),
      )
      .toBe(true);

    // Tab border tetap berfungsi.
    await player.page.getByRole("tab", { name: /Toko Border/ }).click();
    await expect(player.page.locator(".border-store-modal")).toBeVisible();
    await expect(player.page.locator(".border-store-preview").first()).toBeVisible();

    await host.context.close();
    await player.context.close();
  });
});
