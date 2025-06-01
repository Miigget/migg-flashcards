import { defineConfig } from "vitest/config";
import react from "@astrojs/react";

// Independent Vitest configuration that doesn't inherit SSR settings from Astro
export default defineConfig({
  plugins: [react()],
  test: {
    // Vitest specific configurations
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/vitest.setup.ts"],
    // Exclude playwright tests from vitest runs if they exist, and astro middleware tests
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/tests-e2e/**",
      "src/middleware/index.test.ts", // Exclude middleware test as it requires Astro runtime
    ],
    // Increase default timeout to 60 seconds for async tests (some tests with mocks can be slow)
    testTimeout: 60000,
    coverage: {
      // Consider adding coverage config later if needed
      // provider: 'v8'
      // reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      "@/": new URL("./src/", import.meta.url).pathname,
    },
  },
});
