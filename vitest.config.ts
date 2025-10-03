import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    include: ["tests/vitest/**/*.test.ts"],
    environment: "node",
    reporters: "default",
    hookTimeout: 60_000,
    teardownTimeout: 30_000,
    setupFiles: ["./tests/vitest/setup-env.ts"],
  },
});
