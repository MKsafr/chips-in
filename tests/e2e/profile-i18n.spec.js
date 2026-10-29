const { test, expect } = require("@playwright/test");
const { createHost, joinPlayer, newPage } = require("./helpers");

test.describe("Profil & i18n", () => {
  test("edit nama dan avatar disimpan", async ({ browser }) => {
    const host = await createHost(browser, "ProfileHost");
    const p1 = await joinPlayer(browser, host.code, "ProfileP");

    await p1.page.getByTestId("edit-profile-player").click();
    await p1.page.getByTestId("profile-name").fill("NewProfileName");
    await p1.page.getByTestId("profile-save").click();
    await expect(p1.page.locator("[data-testid='player-row']").filter({ hasText: 'NewProfileName' }).first()).toBeVisible();

    await p1.page.getByTestId("edit-profile-player").click();
    await p1.page.getByTestId("profile-avatar").click();
    await p1.page.getByRole("button", { name: "spade" }).click();
    await p1.page.getByTestId("profile-save").click();
    await expect(p1.page.locator("[data-testid='player-row']").filter({ hasText: 'NewProfileName' }).first()).toBeVisible();

    await host.context.close();
    await p1.context.close();
  });

  test("ganti bahasa English dan tema dark", async ({ browser }) => {
    const host = await createHost(browser, "ProfileHost");
    await host.page.getByTestId("settings-open").click();

    await host.page.getByTestId("language-select").selectOption("en");
    await host.page.getByTestId("theme-select").selectOption("dark");
    await host.page.evaluate(() => closeSettings());

    await expect.poll(async () => host.page.evaluate(() => document.documentElement.lang)).toBe("en");
    await expect.poll(async () => host.page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark");

    await host.context.close();
  });

  test("volume dan mute disimpan di localStorage", async ({ browser }) => {
    const host = await createHost(browser, "ProfileHost");
    await host.page.getByTestId("settings-open").click();

    await host.page.getByTestId("volume-slider").fill("50");
    await host.page.getByTestId("mute-toggle").click();

    await expect.poll(async () => host.page.evaluate(() => localStorage.cb_volume)).toBe("0.5");
    await expect.poll(async () => host.page.evaluate(() => localStorage.cb_muted)).toBe("true");

    await host.page.getByRole("button", { name: "Tutup" }).first().click();
    await host.context.close();
  });
});
