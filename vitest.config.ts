import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom", // Use jsdom for DOM simulation
    globals: true, // Optional: Use if you want global APIs like describe, it, expect
    setupFiles: [], // Optional: Add setup files if needed later
  },
});
