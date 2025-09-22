import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  reporter: [["list"]],
  webServer: {
    command: "npm run dev",
    port: 3001,
    timeout: 120_000,
    reuseExistingServer: true,
  },
});
