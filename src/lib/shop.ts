// Launch switch for the online shop (/products, /product/*, /api/checkout).
//
// Off by default in production builds: the pages still render as a preview,
// but they're noindexed, left out of the sitemap, show no Add to Cart buttons,
// and the checkout API refuses orders. Always on under `astro dev` so the shop
// can be worked on locally.
//
// To launch: set SHOP_ENABLED=true in the Cloudflare Pages environment
// variables (Production) and redeploy. It's read at build time, so a redeploy
// is required for a change to take effect. The sitemap filter in
// astro.config.mjs reads the same variable from process.env.
export const shopEnabled =
  import.meta.env.DEV || import.meta.env.SHOP_ENABLED === "true";
