import { defineConfig } from "vitest/config";
import { getViteConfig } from "astro/config";

// Load the Vite configuration from Astro
// This ensures Vitest uses the same plugins, aliases, etc. as the Astro dev server/build
export default defineConfig(
  getViteConfig({
    test: {
      // Vitest specific configurations
      environment: "jsdom",
      globals: true,
      setupFiles: ["src/vitest.setup.ts"],
      // Exclude playwright tests from vitest runs if they exist
      exclude: ["**/node_modules/**", "**/dist/**", "**/tests-e2e/**"],
      // Increase default timeout to 30 seconds for async tests
      testTimeout: 30000,
      alias: {
        "@/": new URL("./src/", import.meta.url).pathname,
      },
      coverage: {
        // Consider adding coverage config later if needed
        // provider: 'v8'
        // reporter: ['text', 'json', 'html'],
      },
    },
    // Note: Aliases defined in astro.config.mjs (via tsconfig.json) should be inherited
    // No need to redefine resolve.alias here if using getViteConfig
  })
);
