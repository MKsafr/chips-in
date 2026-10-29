const { test, expect } = require("@playwright/test");
const {
  createHost,
  joinPlayers,
  setStartChips,
  setBlinds,
  startPokerHand,
  confirmPokerStage,
  waitForPokerTurn,
  pokerCall,
  getState,
  playerIdByName,
  expectBalance,
  openDealer,
  closeDealer,
} = require("./helpers");

test.describe("Poker", () => {
  test("hand penuh hingga showdown membagi pot utama", async ({ browser }) => {
    const host = await createHost(browser, "HostPoker");
    const [p1, p2] = await joinPlayers(browser, host.code, [
      "PokerA",
      "PokerB",
    ]);

    await setStartChips(host.page, 1000);
    await setBlinds(host.page, 5, 10);
    await startPokerHand(host);

    const state = await getState(host.page);
    const id1 = playerIdByName(state, "PokerA");
    const id2 = playerIdByName(state, "PokerB");

    // Preflop: dealer membuka kartu, lalu call + check.
    await confirmPokerStage(host);
    await expect(host.page.getByTestId("poker-pot")).toHaveText("$15");
    await pokerCall([p1, p2]);
    await expect(host.page.getByTestId("poker-pot")).toHaveText("$20");
    await pokerCall([p1, p2]);

    // Flop, turn, river: check/check.
    for (let street = 0; street < 3; street++) {
      await confirmPokerStage(host);
      await pokerCall([p1, p2]);
      await pokerCall([p1, p2]);
    }

    await expect(host.page.getByTestId("poker-award")).toBeVisible();
    await host.page.getByTestId(`winner-0-${id1}`).click();
    await host.page.getByTestId("poker-award").click();

    await expectBalance(p1.page, "PokerA", 1010);
    await expectBalance(p2.page, "PokerB", 990);
    await expect(host.page.getByTestId("poker-pot")).toHaveText("$0");
    await expect
      .poll(async () => (await getState(host.page))?.poker?.active)
      .toBe(false);

    await host.context.close();
    await p1.context.close();
    await p2.context.close();
  });

  test("side pot dibagi sesuai layer kontribusi", async ({ browser }) => {
    const host = await createHost(browser, "HostSidePot");
    const [p1, p2, p3] = await joinPlayers(browser, host.code, [
      "PokerA",
      "PokerB",
      "PokerC",
    ]);

    await setStartChips(host.page, 1000);
    await setBlinds(host.page, 5, 10);

    const initial = await getState(host.page);
    const id1 = playerIdByName(initial, "PokerA");
    const id2 = playerIdByName(initial, "PokerB");
    const id3 = playerIdByName(initial, "PokerC");

    // Pemain C hanya punya 20 chip agar bisa all-in dan membentuk side pot.
    await openDealer(host.page);
    await host.page.getByTestId(`chip-remove-${id3}`).click();
    await host.page.getByTestId("chip-adjust-amount").fill("980");
    await host.page.getByTestId("chip-adjust-save").click();
    await expectBalance(p3.page, "PokerC", 20);
    await closeDealer(host.page);

    await startPokerHand(host);
    await confirmPokerStage(host);

    // Preflop: A raise ke 30, B call 30, C all-in 20.
    const first = await waitForPokerTurn([p1, p2, p3]);
    await first.page.getByTestId("poker-raise-amount").fill("30");
    await first.page.getByTestId("poker-raise").click();
    await expect(first.page.getByTestId("poker-turn-card")).toBeHidden();

    await pokerCall([p1, p2, p3]);

    const shortStack = await waitForPokerTurn([p1, p2, p3]);
    await shortStack.page.getByTestId("poker-call").click();
    await shortStack.page.getByTestId("allin-confirm").click();
    await expect(shortStack.page.getByTestId("poker-turn-card")).toBeHidden();

    // Flop, turn, river: dua pemain tersisa check/check.
    for (let street = 0; street < 3; street++) {
      await confirmPokerStage(host);
      await pokerCall([p1, p2, p3]);
      await pokerCall([p1, p2, p3]);
    }

    await expect
      .poll(async () => (await getState(host.page))?.poker?.layers)
      .toEqual([
        { amount: 60, elig: [id1, id2, id3] },
        { amount: 20, elig: [id1, id2] },
      ]);

    await host.page.getByTestId(`winner-0-${id3}`).click();
    await host.page.getByTestId(`winner-1-${id2}`).click();
    await host.page.getByTestId("poker-award").click();

    await expectBalance(p1.page, "PokerA", 970);
    await expectBalance(p2.page, "PokerB", 990);
    await expectBalance(p3.page, "PokerC", 60);
    await expect(host.page.getByTestId("poker-pot")).toHaveText("$0");

    await host.context.close();
    await p1.context.close();
    await p2.context.close();
    await p3.context.close();
  });

  test("batalkan hand mengembalikan chip ke semua pemain", async ({
    browser,
  }) => {
    const host = await createHost(browser, "HostCancel");
    const [p1, p2] = await joinPlayers(browser, host.code, [
      "PokerA",
      "PokerB",
    ]);

    await setStartChips(host.page, 1000);
    await setBlinds(host.page, 5, 10);
    await startPokerHand(host);

    await host.page.getByTestId("cancel-round").click();
    await expect
      .poll(async () => (await getState(host.page))?.poker?.active)
      .toBe(false);

    await expectBalance(p1.page, "PokerA", 1000);
    await expectBalance(p2.page, "PokerB", 1000);
    await expect(host.page.getByTestId("poker-pot")).toHaveText("$0");

    await host.context.close();
    await p1.context.close();
    await p2.context.close();
  });
});
