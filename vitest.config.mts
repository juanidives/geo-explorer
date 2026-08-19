import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["commands/**/*.ts"],
      exclude: ["**/*.d.ts"],
      reporter: ["text", "text-summary"],
      reportsDirectory: "./coverage",
    },
  },
});
