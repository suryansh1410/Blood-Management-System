import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    hookTimeout: 60000,
    testTimeout: 60000,
    alias: {
      "@": path.resolve(import.meta.dirname, "./"),
    },
  },
});
