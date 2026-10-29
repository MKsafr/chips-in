// Helper bersama untuk test E2E Chips-in.
const { expect } = require("@playwright/test");

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3100";

async function newPage(browser, options = {}) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  await context.addInitScript((lang) => {
    try {
      localStorage.cb_language = lang;
    } catch {}
  }, options.lang || "id");
  const page = await context.newPage();
  page.on("dialog", (dialog) => dialog.accept().catch(() => {}));
  return { context, page };
}

async function waitForRoomCode(page) {
  const codeEl = page
    .locator('[data-testid="room-code"], .room-code-line b')
    .first();
  await expect(codeEl).toHaveText(/^[A-Z0-9]{6}$/, { timeout: 15000 });
  return (await codeEl.textContent()).trim();
}

async function createHost(browser, name = "HostTest") {
  const { context, page } = await newPage(browser);
  await page.goto("/");
  await page.getByTestId("create-room").click();
  await page.getByTestId("profile-name").waitFor({ state: "visible" });
  await page.getByTestId("profile-name").fill(name);
  await page.getByTestId("profile-save").click();
  const code = await waitForRoomCode(page);
  return { context, page, code };
}

async function joinPlayer(browser, code, name = "PlayerTest") {
  const { context, page } = await newPage(browser);
  await page.goto("/");
  await page.getByTestId("room-code-input").fill(code);
  await page.getByTestId("join-room").click();
  await page.getByTestId("profile-name").waitFor({ state: "visible" });
  await page.getByTestId("profile-name").fill(name);
  await page.getByTestId("profile-save").click();
  await page.waitForFunction((expected) => {
    const el = document.querySelector(
      '[data-testid="room-code"], .room-code-line b',
    );
    return el && (el.textContent || "").trim() === expected;
  }, code);
  return { context, page, code };
}

async function joinPlayers(browser, code, names) {
  const players = [];
  for (const name of names) players.push(await joinPlayer(browser, code, name));
  return players;
}

async function openDealer(page) {
  await page.getByTestId("dealer-controls-open").click();
  await expect(page.locator(".dealer-controls-heading")).toBeVisible();
}

async function closeDealer(page) {
  const close = page.locator(".dealer-controls-heading button").first();
  if (await close.count()) await close.click();
}

async function setStartChips(page, amount) {
  await openDealer(page);
  const input = page.getByTestId("table-chips");
  await input.fill(String(amount));
  await page.getByTestId("table-save").click();
  await expect
    .poll(async () => (await getState(page))?.startChips, { timeout: 15000 })
    .toBe(Number(amount));
  await closeDealer(page);
}

async function setBlinds(page, sb, bb) {
  await openDealer(page);
  await page.getByTestId("table-sb").fill(String(sb));
  await page.getByTestId("table-bb").fill(String(bb));
  await page.getByTestId("table-save").click();
  await expect
    .poll(async () => {
      const state = await getState(page);
      return state ? [state.sb, state.bb] : null;
    }, { timeout: 15000 })
    .toEqual([Number(sb), Number(bb)]);
  await closeDealer(page);
}

function playerRow(page, name) {
  return page
    .locator('[data-testid="player-row"]')
    .filter({ has: page.locator('[data-player-name]', { hasText: name }) })
    .first();
}

function parseMoney(text) {
  const digits = String(text || "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

async function readBalance(page, name) {
  const balance = playerRow(page, name).getByTestId("player-balance").first();
  await expect(balance).toBeVisible();
  return parseMoney(await balance.textContent());
}

async function readBalanceState(page, name) {
  return page.evaluate((playerName) => {
    if (typeof st === "undefined" || !st || !Array.isArray(st.players))
      return null;
    const player = st.players.find((p) => p.name === playerName);
    return player ? player.chips : null;
  }, name);
}

async function expectBalance(page, name, expected) {
  await expect.poll(() => readBalanceState(page, name), { timeout: 15000 }).toBe(
    expected,
  );
}

async function getState(page) {
  return page.evaluate(() => (typeof st === "undefined" ? null : st));
}

async function ensureResumed(page, timeout = 4000) {
  const resume = page.getByTestId("resume-continue");
  try {
    await resume.waitFor({ state: "visible", timeout });
    await resume.click();
  } catch {}
}

function playerIdByName(state, name) {
  const player = (state?.players || []).find((item) => item.name === name);
  return player ? player.id : null;
}

async function startPokerHand(host) {
  await host.page.getByTestId("start-hand").click();
  await expect
    .poll(async () => (await getState(host.page))?.poker?.active, {
      timeout: 15000,
    })
    .toBe(true);
}

async function confirmPokerStage(host) {
  await host.page.getByTestId("confirm-stage").click();
  await expect(host.page.getByTestId("confirm-stage")).toBeHidden();
}

async function waitForPokerTurn(players, timeout = 15000) {
  let actor = null;
  await expect
    .poll(
      async () => {
        for (const player of players) {
          const visible = await player.page
            .getByTestId("poker-turn-card")
            .isVisible()
            .catch(() => false);
          if (visible) {
            actor = player;
            return true;
          }
        }
        return false;
      },
      { timeout, intervals: [100, 200, 300] },
    )
    .toBe(true);
  return actor;
}

async function pokerCall(players) {
  const actor = await waitForPokerTurn(players);
  await actor.page.getByTestId("poker-call").click();
  await expect(actor.page.getByTestId("poker-turn-card")).toBeHidden();
}

module.exports = {
  BASE_URL,
  newPage,
  createHost,
  joinPlayer,
  joinPlayers,
  openDealer,
  closeDealer,
  setStartChips,
  setBlinds,
  playerRow,
  parseMoney,
  readBalance,
  readBalanceState,
  expectBalance,
  getState,
  ensureResumed,
  waitForRoomCode,
  playerIdByName,
  startPokerHand,
  confirmPokerStage,
  waitForPokerTurn,
  pokerCall,
};
