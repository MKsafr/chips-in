// Konfigurasi Playwright untuk Chips-in.
// Memakai Google Chrome yang sudah terpasang (channel: "chrome"),
// jadi TIDAK perlu mengunduh browser Playwright.
const { defineConfig } = require("@playwright/test");

const PORT = Number(process.env.E2E_PORT || 3100);
const baseURL = `http://localhost:${PORT}`;

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 45000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    channel: "chrome",
    headless: true,
    serviceWorkers: "block",
    viewport: { width: 1280, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    launchOptions: {
      // Membantu agar audio preview tidak diblokir kebijakan autoplay saat test.
      args: ["--autoplay-policy=no-user-gesture-required"],
    },
  },
  webServer: {
    command: "node server.js",
    url: baseURL,
    timeout: 30000,
    reuseExistingServer: true,
    env: { PORT: String(PORT) },
  },
});
