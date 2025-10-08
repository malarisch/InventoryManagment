import {defineConfig} from "@playwright/test";
import path from "path";
import '@/lib/setup-env'
import type {TestOptions} from "./tests/playwright_setup.types";


// Ensure required env vars are set
const requiredEnv = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`⚠️  Playwright config: Missing required env vars: ${missing.join(", ")}`);
}

export const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/user.json');

export default defineConfig<TestOptions>({
  testDir: "./tests/e2e",
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  workers: 15,
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
  projects: [
    {"name": "base",
      "testMatch": /.*\.base\.spec.ts/,
    },
    { "name": "setup",
      "testMatch": /.*\.setup\.ts/,
      use: {
        
      },
        teardown: "cleanup db"
    },
    {
      name: "loggedin",
      dependencies: ["setup"],
      use: {
        storageState: STORAGE_STATE
      },
      "testMatch": /.*\.loggedin\.spec\.ts/,
        teardown: "cleanup db"
    },
      {
          name: 'cleanup db',
          testMatch: /.*\.teardown\.ts/,
      },
  ]
});
