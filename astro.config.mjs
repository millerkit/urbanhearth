// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";

// Keep the unlaunched custom shop out of the sitemap. Mirrors
// customShopEnabled in src/lib/shop.ts, which can't be imported here (no
// import.meta.env). Only SHOP_MODE=custom opens it.
const customShopEnabled = process.env.SHOP_MODE === "custom";

export default defineConfig({
  site: "https://www.urbanhearth.net",
  adapter: cloudflare({
    imageService: "passthrough",
  }),
  integrations: [
    sitemap({
      filter: (page) => {
        if (page.includes("/checkout/")) return false;
        if (!customShopEnabled) {
          const { pathname } = new URL(page);
          if (/^\/products\/?$/.test(pathname)) return false;
          if (pathname.startsWith("/product/")) return false;
        }
        return true;
      },
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
