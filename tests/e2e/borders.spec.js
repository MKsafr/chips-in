const { test, expect } = require("@playwright/test");
const {
  createHost,
  joinPlayers,
  setStartChips,
  openDealer,
  closeDealer,
  getState,
  expectBalance,
  startPokerHand,
  playerIdByName,
} = require("./helpers");

function closeStore(page) {
  return page.evaluate(() => closeBorderStore());
}

async function openBorderTab(page) {
  await page.getByTestId("store-open").click();
  await page.getByTestId("store-tab-border").click();
  await expect(page.getByTestId("store-tab-border")).toHaveText("Toko Border");
}

test.describe("Border store", () => {
  test("beli border red mengurangi saldo dan menampilkan class", async ({
    browser,
  }) => {
    const host = await createHost(browser, "HostBorder");
    const [p1] = await joinPlayers(browser, host.code, ["BorderP"]);
    await setStartChips(host.page, 20000);
    await host.page.evaluate(() => api("resetAll"));

    await openBorderTab(p1.page);
    await p1.page.getByTestId("border-buy-red").click();
    await expectBalance(p1.page, "BorderP", 15000);
    await expect(p1.page.locator(".pl.pl-border-red")).toBeVisible();
    await closeStore(p1.page);
    await host.context.close();
    await p1.context.close();
  });

  test("bundle green mengurangi saldo sesuai diskon 25%", async ({
    browser,
  }) => {
    const host = await createHost(browser, "HostBundle");
    const [p1] = await joinPlayers(browser, host.code, ["BorderP"]);
    await setStartChips(host.page, 20000);
    await host.page.evaluate(() => api("resetAll"));

    await openBorderTab(p1.page);
    await p1.page.getByTestId("border-bundle-green").click();
    await expectBalance(p1.page, "BorderP", 12500);
    await expect(p1.page.locator(".pl.pl-border-green")).toBeVisible();
    await closeStore(p1.page);
    await host.context.close();
    await p1.context.close();
  });

  test("reload mempertahankan kepemilikan dan peralatan", async ({
    browser,
  }) => {
    const host = await createHost(browser, "HostBorderReload");
    const [p1] = await joinPlayers(browser, host.code, ["BorderP"]);
    await setStartChips(host.page, 20000);
    await host.page.evaluate(() => api("resetAll"));

    await openBorderTab(p1.page);
    await p1.page.getByTestId("border-buy-red").click();
    await expectBalance(p1.page, "BorderP", 15000);
    await closeStore(p1.page);

    await p1.page.reload();
    await expect(p1.page.locator(".pl.pl-border-red")).toBeVisible();
    await host.context.close();
    await p1.context.close();
  });

  test("pemimpin chip bisa membuka trial dan memilih gaya", async ({
    browser,
  }) => {
    const host = await createHost(browser, "HostLeader");
    const [p1, p2] = await joinPlayers(browser, host.code, [
      "BorderP1",
      "BorderP2",
    ]);
    await setStartChips(host.page, 20000);
    await host.page.evaluate(() => api("resetAll"));

    // P1 menjadi pemimpin chip karena 20000 > 20000? dengan 2 pemain sama = null leader.
    // Atur P1 tinggi dan P2 rendah.
    const id1 = playerIdByName(await getState(host.page), "BorderP1");
    await openDealer(host.page);
    await host.page.getByTestId(`chip-add-${id1}`).click();
    await host.page.getByTestId("chip-adjust-amount").fill("5000");
    await host.page.getByTestId("chip-adjust-save").click();
    await closeDealer(host.page);

    await openBorderTab(p1.page);
    await p1.page.getByTestId("leader-unlock").click();
    await expectBalance(p1.page, "BorderP1", 20000);
    await expect(p1.page.getByTestId("leader-unlock")).toBeHidden();
    await closeStore(p1.page);
    await host.context.close();
    await p1.context.close();
    await p2.context.close();
  });

  test("pembelian saat ronde aktif ditolak dengan alasan", async ({ browser }) => {
    const host = await createHost(browser, "HostBorderActive");
    const [p1, p2] = await joinPlayers(browser, host.code, [
      "BorderA",
      "BorderB",
    ]);
    await setStartChips(host.page, 20000);
    await host.page.evaluate(() => api("resetAll"));
    await startPokerHand(host);

    await openBorderTab(p1.page);
    await p1.page.getByTestId("border-buy-red").click();
    await expect(p1.page.locator(".toast")).toContainText(
      "Border hanya dapat dibeli saat ronde tidak aktif",
    );
    await closeStore(p1.page);
    await host.context.close();
    await p1.context.close();
    await p2.context.close();
  });
});
