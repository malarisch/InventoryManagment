import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: "http://localhost:3005",
    trace: "on-first-retry",
  },
  reporter: [["list"]],
  webServer: {
    command: "PORT=3005 npm run dev",
    port: 3005,
    timeout: 120_000,
    reuseExistingServer: true,
  },
});
