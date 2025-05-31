// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import awsAmplify from "astro-aws-amplify";

// https://astro.build/config
export default defineConfig({
  site: "https://your-app-domain.com", // Will be updated during deployment
  output: "server",
  adapter: awsAmplify(),
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
});
