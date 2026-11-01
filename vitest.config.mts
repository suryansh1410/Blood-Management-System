import { defineConfig } from "vitest/config";
import path from "node:path";

if (typeof (process as any).loadEnvFile === "function") {
  try {
    (process as any).loadEnvFile(".env");
  } catch (e) {
    // ignore if missing
  }
}

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    hookTimeout: 60000,
    testTimeout: 60000,
    fileParallelism: false,
    alias: {
      "@": path.resolve(import.meta.dirname, "./"),
    },
  },
});
