import { TOAST_SHOP_URL } from "./toast-storefront";

// Where the "Shop" links on the site go. One setting, so two shops can never
// be switched on at once.
//
//   off     (default) No Shop links anywhere. The custom shop pages still
//           render as a noindexed preview, show no Add to Cart buttons, are
//           left out of the sitemap, and the checkout API refuses orders.
//   toast   Shop links go to the Toast-hosted storefront (new tab). The custom
//           shop stays dark, exactly as in "off".
//   custom  Our own shop (/products, /api/checkout, Stripe webhook) is live,
//           and Shop links go to /products.
//
// To change it: set SHOP_MODE in the Cloudflare Pages environment (Production)
// and redeploy. It's read at build time, so a redeploy is required. Under
// `astro dev` an unset SHOP_MODE means "custom" so the shop can be worked on
// locally; set SHOP_MODE=toast (or off) in .env.local to try the other modes.
// The sitemap filter in astro.config.mjs reads the same variable.
export type ShopMode = "off" | "toast" | "custom";

function resolveShopMode(): ShopMode {
  const raw = import.meta.env.SHOP_MODE?.trim().toLowerCase();
  if (raw === "off" || raw === "toast" || raw === "custom") return raw;
  if (raw) {
    // A typo must never open a shop by accident
    console.warn(
      `Unknown SHOP_MODE "${raw}" (expected off, toast or custom); using "off".`,
    );
    return "off";
  }
  return import.meta.env.DEV ? "custom" : "off";
}

export const shopMode = resolveShopMode();

/** True only when our own shop (/products, checkout, webhook) is live. */
export const customShopEnabled = shopMode === "custom";

/** Where Shop links point, or null when there should be no Shop link. */
export const shopLink: { href: string; external: boolean } | null =
  shopMode === "custom"
    ? { href: "/products", external: false }
    : shopMode === "toast"
      ? { href: TOAST_SHOP_URL, external: true }
      : null;

/**
 * Applies the shop mode to a list of nav/footer links. Sanity and the fallback
 * JSON store the Shop entry with the Toast URL as a marker; this drops it when
 * there's no shop, or points it at /products in custom mode.
 */
export function withShopLink<T extends { href?: string | null }>(
  links: T[],
): T[] {
  return links.flatMap((link) => {
    if (link.href !== TOAST_SHOP_URL) return [link];
    return shopLink ? [{ ...link, href: shopLink.href }] : [];
  });
}
