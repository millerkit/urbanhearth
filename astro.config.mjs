// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://www.urbanhearth.net",
  adapter: cloudflare({
    imageService: "passthrough",
  }),
  integrations: [
    sitemap({
      // While HOLDING_PAGE=true, only the holding page is live — exclude everything else
      // to avoid wasting crawl budget on pages that 302 to /holding.
      filter: (page) =>
        process.env.HOLDING_PAGE !== "true" ||
        page === "https://www.urbanhearth.net/holding/",
    }),
    react(),
  ],
});
