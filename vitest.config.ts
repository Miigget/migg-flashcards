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
      setupFiles: [],
      // Exclude playwright tests from vitest runs if they exist
      exclude: ["**/node_modules/**", "**/dist/**", "**/tests-e2e/**"],
    },
    // Note: Aliases defined in astro.config.mjs (via tsconfig.json) should be inherited
    // No need to redefine resolve.alias here if using getViteConfig
  })
);
