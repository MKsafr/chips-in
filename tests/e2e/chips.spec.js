const { test, expect } = require("@playwright/test");
const {
  createHost,
  joinPlayers,
  openDealer,
  closeDealer,
  setStartChips,
  getState,
  expectBalance,
  playerIdByName,
} = require("./helpers");

async function setupChips(browser, names = ["ChipA", "ChipB"]) {
  const host = await createHost(browser, "HostChips");
  const players = await joinPlayers(browser, host.code, names);
  await setStartChips(host.page, 1000);
  return { host, players };
}

async function closeAll(session) {
  await session.host.context.close();
  for (const player of session.players) await player.context.close();
}

test.describe("Kelola chip", () => {
  test("tambah dan kurangi chip lewat panel Bandar", async ({ browser }) => {
    const session = await setupChips(browser);
    const [p1] = session.players;
    const id = playerIdByName(await getState(session.host.page), "ChipA");

    await openDealer(session.host.page);
    await session.host.page.getByTestId(`chip-add-${id}`).click();
    await session.host.page.getByTestId("chip-adjust-amount").fill("500");
    await session.host.page.getByTestId("chip-adjust-save").click();
    await expectBalance(p1.page, "ChipA", 1500);

    await session.host.page.getByTestId(`chip-remove-${id}`).click();
    await session.host.page.getByTestId("chip-adjust-amount").fill("200");
    await session.host.page.getByTestId("chip-adjust-save").click();
    await expectBalance(p1.page, "ChipA", 1300);

    await closeDealer(session.host.page);
    await closeAll(session);
  });

  test("reset semua chip mengembalikan saldo awal", async ({ browser }) => {
    const session = await setupChips(browser);
    const [p1, p2] = session.players;
    const id = playerIdByName(await getState(session.host.page), "ChipA");

    await openDealer(session.host.page);
    await session.host.page.getByTestId(`chip-add-${id}`).click();
    await session.host.page.getByTestId("chip-adjust-amount").fill("500");
    await session.host.page.getByTestId("chip-adjust-save").click();
    await expectBalance(p1.page, "ChipA", 1500);

    await closeDealer(session.host.page);
    await session.host.page.getByTestId("reset-all").click();
    await expectBalance(p1.page, "ChipA", 1000);
    await expectBalance(p2.page, "ChipB", 1000);

    await closeAll(session);
  });

  test("transfer chip memindahkan saldo ke penerima", async ({ browser }) => {
    const session = await setupChips(browser);
    const [p1, p2] = session.players;
    const id2 = playerIdByName(await getState(session.host.page), "ChipB");

    await p1.page.getByTestId("chip-transfer-open").click();
    await p1.page.getByTestId("transfer-target").selectOption(String(id2));
    await p1.page.getByTestId("transfer-amount").fill("250");
    await p1.page.getByTestId("transfer-submit").click();

    await expectBalance(p1.page, "ChipA", 750);
    await expectBalance(p2.page, "ChipB", 1250);
    await expect(p1.page.getByTestId("transfer-submit")).toBeHidden();

    await closeAll(session);
  });

  test("transfer melebihi saldo ditolak dan saldo tidak berubah", async ({
    browser,
  }) => {
    const session = await setupChips(browser);
    const [p1, p2] = session.players;
    const id2 = playerIdByName(await getState(session.host.page), "ChipB");

    await p1.page.getByTestId("chip-transfer-open").click();
    await p1.page.getByTestId("transfer-target").selectOption(String(id2));
    await p1.page.getByTestId("transfer-amount").fill("5000");
    await p1.page.getByTestId("transfer-submit").click();

    await expect(p1.page.locator(".toast")).toContainText("Chip tidak mencukupi");
    await expectBalance(p1.page, "ChipA", 1000);
    await expectBalance(p2.page, "ChipB", 1000);

    await closeAll(session);
  });

  test("reorder pemain mengubah urutan kursi (API-assisted)", async ({
    browser,
  }) => {
    const session = await setupChips(browser);
    const state = await getState(session.host.page);
    const id1 = playerIdByName(state, "ChipA");
    const id2 = playerIdByName(state, "ChipB");

    await session.host.page.evaluate(
      (newOrder) => api("reorderPlayers", { newOrder }),
      [id2, id1],
    );

    await expect
      .poll(async () =>
        (await getState(session.host.page)).players.map((player) => player.id),
      )
      .toEqual([id2, id1]);

    await expect(
      session.host.page.locator('[data-testid="player-row"]').first(),
    ).toHaveAttribute("data-player-id", String(id2));

    await closeAll(session);
  });

  test("kick mengeluarkan pemain dari meja", async ({ browser }) => {
    const session = await setupChips(browser);
    const [, p2] = session.players;
    const id2 = playerIdByName(await getState(session.host.page), "ChipB");

    await openDealer(session.host.page);
    await session.host.page.getByTestId(`kick-${id2}`).click();

    await expect(p2.page.getByTestId("create-room")).toBeVisible();
    await expect(p2.page.locator("#alert")).toContainText(
      "Kamu telah dikeluarkan",
    );
    await expect
      .poll(async () => (await getState(session.host.page)).players.length)
      .toBe(1);

    await closeDealer(session.host.page);
    await closeAll(session);
  });

  test("tawaran Bandar diterima pemain dan mengganti host", async ({
    browser,
  }) => {
    const session = await setupChips(browser);
    const [, p2] = session.players;
    const id2 = playerIdByName(await getState(session.host.page), "ChipB");

    await openDealer(session.host.page);
    await session.host.page.getByTestId(`offer-host-${id2}`).click();
    await expect(p2.page.getByTestId("respond-host-accept")).toBeVisible();
    await p2.page.getByTestId("respond-host-accept").click();

    await expect(p2.page.getByTestId("dealer-controls-open")).toBeVisible();
    await expect
      .poll(async () => (await getState(p2.page))?.isHost)
      .toBe(true);
    await expect(session.host.page.getByTestId("leave-seat")).toBeVisible();
    await expect
      .poll(async () => (await getState(session.host.page))?.isHost)
      .toBe(false);

    await closeAll(session);
  });

  test("pemain keluar dari meja kembali ke lobby", async ({ browser }) => {
    const session = await setupChips(browser, ["ChipA"]);
    const [p1] = session.players;

    await p1.page.getByTestId("leave-seat").click();
    await expect(p1.page.getByTestId("create-room")).toBeVisible();
    await expect
      .poll(async () => (await getState(session.host.page)).players.length)
      .toBe(0);

    await closeAll(session);
  });

  test("host keluar dan peran Bandar dialihkan ke pemain", async ({
    browser,
  }) => {
    const session = await setupChips(browser, ["ChipA"]);
    const [p1] = session.players;
    const code = session.host.code;

    await session.host.page.getByTestId("leave-host").click();
    await expect(session.host.page.getByTestId("create-room")).toBeVisible();
    await expect(p1.page.getByTestId("dealer-controls-open")).toBeVisible();
    await expect(p1.page.getByTestId("room-code")).toHaveText(code);
    await expect.poll(async () => (await getState(p1.page))?.isHost).toBe(true);

    await closeAll(session);
  });
});
