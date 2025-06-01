// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import awsAmplify from "astro-aws-amplify";

// https://astro.build/config
export default defineConfig({
  site: "https://main.d2k1nzj1fqurn2.amplifyapp.com", // Your AWS Amplify domain
  output: "server",
  adapter: awsAmplify(),
  image: {
    service: { entrypoint: "astro/assets/services/noop" },
  },
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ["fs", "path", "crypto"],
      noExternal: ["@supabase/supabase-js", "@supabase/ssr"],
    },
  },
});
