import type { APIRoute } from "astro";
import Stripe from "stripe";
import { fetchProductPrices } from "../../lib/sanity-fetch";
import { customShopEnabled } from "../../lib/shop";
import { createToastOrder } from "../../lib/toast-orders";

export const prerender = false;

function respond(status: number, body: string) {
  return new Response(body, { status });
}

/**
 * Stripe → Toast: when a checkout is paid, create the order in Toast.
 *
 * Status codes matter here. 2xx tells Stripe the event is handled; anything
 * else makes Stripe retry, which is what we want when Toast is down or order
 * creation isn't enabled yet, so a paid order is never silently lost.
 */
export const POST: APIRoute = async ({ request }) => {
  // Same gate as /api/checkout: nothing shop-related runs until launch
  if (!customShopEnabled) return respond(200, "Shop is closed.");

  const stripeKey = import.meta.env.STRIPE_SECRET_KEY;
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    return respond(503, "Webhook is not configured.");
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return respond(400, "Missing signature.");

  // Signature verification needs the exact raw body
  const rawBody = await request.text();
  const stripe = new Stripe(stripeKey);

  let event: Stripe.Event;
  try {
    // Async variant: Workers only has the Web Crypto API
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch {
    return respond(400, "Invalid signature.");
  }

  if (event.type !== "checkout.session.completed") {
    return respond(200, "Ignored.");
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return respond(200, "Not paid yet.");
  }

  // Cart contents were stored in metadata at checkout; re-read GUIDs and
  // prices from Sanity rather than trusting anything client-derived.
  let cart: { id: string; qty: number }[];
  try {
    cart = JSON.parse(session.metadata?.items ?? "[]");
  } catch {
    cart = [];
  }
  if (cart.length === 0) {
    console.error(`Stripe session ${session.id}: no cart items in metadata`);
    return respond(200, "Nothing to fulfil.");
  }

  const products = await fetchProductPrices(cart.map((c) => c.id));
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const items = [];
  for (const line of cart) {
    const product = bySlug.get(line.id);
    if (!product?.toastItemGuid) {
      // Paid for something we can't map to Toast; needs a human
      console.error(
        `Stripe session ${session.id}: cannot map "${line.id}" to a Toast item`,
      );
      return respond(500, "Unmappable item.");
    }
    items.push({
      toastItemGuid: product.toastItemGuid,
      name: product.name,
      quantity: line.qty,
      price: product.price,
    });
  }

  try {
    await createToastOrder({
      stripeSessionId: session.id,
      customerName: session.customer_details?.name ?? null,
      customerPhone: session.customer_details?.phone ?? null,
      customerEmail: session.customer_details?.email ?? null,
      items,
    });
  } catch (err) {
    // Customer details are in the Stripe dashboard; keep PII out of the logs
    console.error(
      `ORDER NOT SENT TO TOAST (Stripe session ${session.id}):`,
      err instanceof Error ? err.message : err,
      JSON.stringify(items.map((i) => ({ n: i.name, q: i.quantity }))),
    );
    return respond(500, "Toast order failed; will retry.");
  }

  return respond(200, "OK");
};
