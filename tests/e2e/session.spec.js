const { test, expect } = require("@playwright/test");
const {
  newPage,
  createHost,
  joinPlayer,
  getState,
  ensureResumed,
} = require("./helpers");

test.describe("Sesi & reconnect", () => {
  test("host refresh tetap di room yang sama sebagai Bandar", async ({
    browser,
  }) => {
    const host = await createHost(browser, "HostSession");

    await host.page.reload();
    await ensureResumed(host.page);

    await expect(host.page.getByTestId("room-code")).toHaveText(host.code);
    await expect(host.page.getByTestId("dealer-controls-open")).toBeVisible();
    await expect.poll(async () => (await getState(host.page))?.isHost).toBe(
      true,
    );

    await host.context.close();
  });

  test("pemain refresh tetap duduk dengan saldo yang sama", async ({
    browser,
  }) => {
    const host = await createHost(browser, "HostSession");
    const player = await joinPlayer(browser, host.code, "SessA");

    await player.page.reload();
    await ensureResumed(player.page);

    await expect(player.page.getByTestId("room-code")).toHaveText(host.code);
    await expect(player.page.getByTestId("my-balance")).toHaveText("$1.000");
    await expect
      .poll(
        async () =>
          (await getState(host.page)).players.filter(
            (item) => item.name === "SessA",
          ).length,
      )
      .toBe(1);

    await host.context.close();
    await player.context.close();
  });

  test("pemain menutup lalu membuka halaman kembali ke kursi semula", async ({
    browser,
  }) => {
    const host = await createHost(browser, "HostSession");
    const player = await joinPlayer(browser, host.code, "SessA");

    await player.page.close();
    const reopened = await player.context.newPage();
    await reopened.goto("/");
    await ensureResumed(reopened);

    await expect(reopened.getByTestId("room-code")).toHaveText(host.code);
    await expect(reopened.getByTestId("my-balance")).toHaveText("$1.000");
    await expect
      .poll(
        async () =>
          (await getState(host.page)).players.filter(
            (item) => item.name === "SessA",
          ).length,
      )
      .toBe(1);

    await host.context.close();
    await player.context.close();
  });

  test("kode room 6 karakter yang salah menampilkan alert", async ({
    browser,
  }) => {
    const { context, page } = await newPage(browser);
    await page.goto("/");
    await page.getByTestId("room-code-input").fill("ZZZZZZ");
    await page.getByTestId("join-room").click();

    await expect(page.locator("#alert")).toContainText("Room tidak ditemukan");
    await expect(page.locator("#alert")).toContainText("Kode room salah");
    await context.close();
  });

  test("kode room kurang dari 6 karakter ditolak", async ({ browser }) => {
    const { context, page } = await newPage(browser);
    await page.goto("/");
    await page.getByTestId("room-code-input").fill("ABC");
    await page.getByTestId("join-room").click();

    await expect(page.locator("#alert")).toContainText(
      "Kode room tidak valid",
    );
    await expect(page.locator("#alert")).toContainText(
      "Kode room terdiri dari 6 karakter",
    );
    await context.close();
  });
});
