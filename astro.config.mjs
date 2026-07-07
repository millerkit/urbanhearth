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
      filter: (page) => !page.includes("/checkout/"),
      // Match the no-slash canonical form used everywhere else (internal
      // links, the canonical <link> in Base.astro) instead of the
      // trailing-slash form Astro generates by default. The sitemap was
      // the thing actively telling Google about the wrong URL form.
      serialize(item) {
        const url = new URL(item.url);
        if (url.pathname !== "/") {
          url.pathname = url.pathname.replace(/\/+$/, "");
        }
        return { ...item, url: url.href };
      },
    }),
    react(),
  ],
});
