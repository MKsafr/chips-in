const { test, expect } = require("@playwright/test");
const {
  createHost,
  joinPlayers,
  setStartChips,
  startPokerHand,
  closeStore,
  openDealer,
  closeDealer,
  getState,
  playerIdByName,
  confirmPokerStage,
  pokerCall,
  expectBalance,
  waitForPokerTurn,
} = require("./helpers");

function closeStoreLocal(page) {
  return page.evaluate(() => closeStore());
}

async function openMusicTab(page) {
  await page.getByTestId("store-open").click();
  await page.getByTestId("store-tab-music").click();
  await expect(page.getByTestId("store-tab-music")).toHaveText("Toko Musik");
}

test.describe("Musik MVP", () => {
  test("pratinjau play dan stop bekerja", async ({ browser }) => {
    const host = await createHost(browser, "HostMusic");
    const [p1] = await joinPlayers(browser, host.code, ["MusicP"]);
    await setStartChips(host.page, 5000);
    await host.page.evaluate(() => api("resetAll"));

    await openMusicTab(p1.page);
    await p1.page.getByTestId("music-preview-ltg").click();

    await expect.poll(async () =>
      p1.page.evaluate(() => {
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
    ).toBe(true);

    await p1.page.getByTestId("music-preview-ltg").click();
    await expect.poll(async () =>
      p1.page.evaluate(() => {
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
    ).toBe(true);

    await closeStoreLocal(p1.page);
    await host.context.close();
    await p1.context.close();
  });

  test("beli musik mengurangi chip dan menampilkan Dimiliki", async ({ browser }) => {
    const host = await createHost(browser, "HostMusic2");
    const [p1] = await joinPlayers(browser, host.code, ["MusicP"]);
    await setStartChips(host.page, 5000);
    await host.page.evaluate(() => api("resetAll"));

    await openMusicTab(p1.page);
    await p1.page.getByTestId("music-buy-ltg").click();

    await expectBalance(p1.page, "MusicP", 4000);
    await expect(p1.page.getByTestId("music-buy-ltg")).toBeHidden();
    await expect(p1.page.getByTestId("music-item-ltg")).toContainText("Dimiliki");
    await closeStoreLocal(p1.page);
    await host.context.close();
    await p1.context.close();
  });

  test("pemenang dengan lagu yang dimiliki memutar musik MVP", async ({ browser }) => {
    const host = await createHost(browser, "HostMusicWin");
    const [p1, p2] = await joinPlayers(browser, host.code, ["MusicP1", "MusicP2"]);
    await setStartChips(host.page, 5000);
    await host.page.evaluate(() => api("resetAll"));

    await openMusicTab(p1.page);
    await p1.page.getByTestId("music-buy-ltg").click();
    await expectBalance(p1.page, "MusicP1", 4000);
    await closeStoreLocal(p1.page);

    await startPokerHand(host);
    await confirmPokerStage(host);
    await pokerCall([p1, p2]);
    await pokerCall([p1, p2]);
    for (let s = 0; s < 3; s++) {
      await confirmPokerStage(host);
      await pokerCall([p1, p2]);
      await pokerCall([p1, p2]);
    }
    await expect.poll(async () => (await getState(host.page))?.poker?.stage).toBe("showdown");

    const id1 = playerIdByName(await getState(host.page), "MusicP1");
    await host.page.getByTestId(`winner-0-${id1}`).click();
    await host.page.getByTestId("poker-award").click();

    await expect.poll(async () => (await getState(host.page))?.mvpMusicTrackId).toBe("ltg");
    await expect.poll(async () =>
      host.page.evaluate(() => {
        try {
          return Boolean(
            typeof mvpMusicAudio !== "undefined" && mvpMusicAudio && !mvpMusicAudio.paused,
          );
        } catch (e) { return false; }
      }),
    ).toBe(true);

    await host.context.close();
    await p1.context.close();
    await p2.context.close();
  });

  test("pemenang tanpa lagu membuat mvpMusicTrackId null", async ({ browser }) => {
    const host = await createHost(browser, "HostMusicNo");
    const [p1, p2] = await joinPlayers(browser, host.code, ["MusicP1", "MusicP2"]);
    await setStartChips(host.page, 5000);
    await host.page.evaluate(() => api("resetAll"));

    await startPokerHand(host);
    await confirmPokerStage(host);
    await pokerCall([p1, p2]);
    await pokerCall([p1, p2]);
    for (let s = 0; s < 3; s++) {
      await confirmPokerStage(host);
      await pokerCall([p1, p2]);
      await pokerCall([p1, p2]);
    }
    await expect.poll(async () => (await getState(host.page))?.poker?.stage).toBe("showdown");

    const id2 = playerIdByName(await getState(host.page), "MusicP2");
    await host.page.getByTestId(`winner-0-${id2}`).click();
    await host.page.getByTestId("poker-award").click();

    await expect.poll(async () => (await getState(host.page))?.mvpMusicTrackId === null).toBe(true);

    await host.context.close();
    await p1.context.close();
    await p2.context.close();
  });

  test("beli musik saat ronde aktif ditolak dan tombol disabled", async ({ browser }) => {
    const host = await createHost(browser, "HostMusicLock");
    const [p1, p2] = await joinPlayers(browser, host.code, ["MusicP", "MusicP2"]);
    await setStartChips(host.page, 5000);
    await host.page.evaluate(() => api("resetAll"));

    await startPokerHand(host);

    await openMusicTab(p1.page);
    await expect(p1.page.getByTestId("music-buy-ltg")).toBeDisabled();
    await closeStoreLocal(p1.page);
    await host.context.close();
    await p1.context.close();
    await p2.context.close();
  });
});
