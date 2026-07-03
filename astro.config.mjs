// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://www.urbanhearth.net",
  trailingSlash: "never",
  adapter: cloudflare({
    imageService: "passthrough",
  }),
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes("/holding/") && !page.includes("/checkout/"),
    }),
    react(),
  ],
});
