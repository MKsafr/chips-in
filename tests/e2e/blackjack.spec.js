const { test, expect } = require("@playwright/test");
const {
  createHost,
  joinPlayers,
  openDealer,
  closeDealer,
  getState,
  expectBalance,
} = require("./helpers");

async function currentPlayer(page) {
  const state = await getState(page);
  return (state?.players || []).find((player) => player.id === state.you);
}

async function myBet(page) {
  return (await currentPlayer(page))?.bjBet || 0;
}

async function setupBlackjack(browser, names) {
  const host = await createHost(browser, "HostBlackjack");
  const players = await joinPlayers(browser, host.code, names);

  await openDealer(host.page);
  await host.page.getByTestId("table-chips").fill("1000");
  await host.page.getByTestId("mode-blackjack").click();
  await expect
    .poll(async () => (await getState(host.page))?.mode)
    .toBe("blackjack");
  await host.page.getByTestId("table-save").click();
  await expect
    .poll(async () => (await getState(host.page))?.startChips)
    .toBe(1000);
  await closeDealer(host.page);

  return { host, players };
}

async function placeBet(player, amount = 100) {
  await player.page.getByTestId(`bj-bet-${amount}`).click();
  await expect.poll(async () => myBet(player.page)).toBe(amount);
}

async function deal(host) {
  await host.page.getByTestId("bj-deal").click();
  await expect
    .poll(async () => (await getState(host.page))?.bj?.phase)
    .toBe("playing");
}

async function closeAll(session) {
  await session.host.context.close();
  for (const player of session.players) await player.context.close();
}

test.describe("Blackjack", () => {
  test("Menang membayar 2x taruhan", async ({ browser }) => {
    const session = await setupBlackjack(browser, ["BJ1"]);
    const [player] = session.players;

    await placeBet(player);
    await deal(session.host);
    await session.host.page.getByTestId("bj-resolve-win").click();

    await expectBalance(player.page, "BJ1", 1100);
    await expect(session.host.page.getByTestId("bj-total-bet")).toHaveText(
      "$0",
    );
    await closeAll(session);
  });

  test("Seri mengembalikan taruhan", async ({ browser }) => {
    const session = await setupBlackjack(browser, ["BJ1"]);
    const [player] = session.players;

    await placeBet(player);
    await deal(session.host);
    await session.host.page.getByTestId("bj-resolve-push").click();

    await expectBalance(player.page, "BJ1", 1000);
    await closeAll(session);
  });

  test("Kalah menghanguskan taruhan", async ({ browser }) => {
    const session = await setupBlackjack(browser, ["BJ1"]);
    const [player] = session.players;

    await placeBet(player);
    await deal(session.host);
    await session.host.page.getByTestId("bj-resolve-lose").click();

    await expectBalance(player.page, "BJ1", 900);
    await closeAll(session);
  });

  test("Blackjack 3:2 membayar 2,5x taruhan", async ({ browser }) => {
    const session = await setupBlackjack(browser, ["BJ1"]);
    const [player] = session.players;

    await placeBet(player);
    await deal(session.host);
    await session.host.page.getByTestId("bj-resolve-bj").click();

    await expectBalance(player.page, "BJ1", 1150);
    await closeAll(session);
  });

  test("Double lalu menang membayar taruhan ganda", async ({ browser }) => {
    const session = await setupBlackjack(browser, ["BJ1"]);
    const [player] = session.players;

    await placeBet(player);
    await deal(session.host);
    await player.page.getByTestId("bj-double").click();
    await expect.poll(async () => myBet(player.page)).toBe(200);

    await session.host.page.getByTestId("bj-resolve-win").click();
    await expectBalance(player.page, "BJ1", 1200);
    await closeAll(session);
  });

  test("Split: satu hand menang, satu kalah", async ({ browser }) => {
    const session = await setupBlackjack(browser, ["BJ1"]);
    const [player] = session.players;

    await placeBet(player);
    await deal(session.host);
    await player.page.getByTestId("bj-split").click();
    await expect
      .poll(async () => (await currentPlayer(player.page))?.bjSplitBet)
      .toBe(100);

    await session.host.page.getByTestId("bj-resolve-win").click();
    await expect(
      session.host.page.getByTestId("bj-resolve-lose"),
    ).toBeVisible();
    await session.host.page.getByTestId("bj-resolve-lose").click();

    await expectBalance(player.page, "BJ1", 1000);
    await closeAll(session);
  });

  test("Semua menang untuk dua pemain", async ({ browser }) => {
    const session = await setupBlackjack(browser, ["BJ1", "BJ2"]);
    const [p1, p2] = session.players;

    await placeBet(p1);
    await placeBet(p2);
    await deal(session.host);
    await session.host.page.getByTestId("bj-all-win").click();

    await expectBalance(p1.page, "BJ1", 1100);
    await expectBalance(p2.page, "BJ2", 1100);
    await expect(session.host.page.getByTestId("bj-total-bet")).toHaveText(
      "$0",
    );
    await closeAll(session);
  });

  test("Batalkan ronde mengembalikan taruhan", async ({ browser }) => {
    const session = await setupBlackjack(browser, ["BJ1"]);
    const [player] = session.players;

    await placeBet(player);
    await deal(session.host);
    await session.host.page.getByTestId("cancel-round").click();

    await expect
      .poll(async () => (await getState(session.host.page))?.bj?.phase)
      .toBe("betting");
    await expectBalance(player.page, "BJ1", 1000);
    await closeAll(session);
  });
});
