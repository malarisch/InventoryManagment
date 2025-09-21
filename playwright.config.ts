import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  reporter: [["list"]],
  webServer: {
    command: "npm run dev",
    port: 3000,
    timeout: 120_000,
    reuseExistingServer: true,
  },
});
