import type { APIRoute } from "astro";
import Stripe from "stripe";
import { fetchProductPrices } from "../../lib/sanity-fetch";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const stripeKey = import.meta.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return new Response(
      JSON.stringify({ error: "Checkout is not configured." }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  let body: { items: { id: string; quantity: number }[] };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { items } = body;
  if (!Array.isArray(items) || items.length === 0) {
    return new Response(JSON.stringify({ error: "Cart is empty." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fetch authoritative prices from Sanity — never trust client-sent prices
  const slugs = items.map((i) => i.id);
  const products = await fetchProductPrices(slugs);
  const productMap = new Map(products.map((p) => [p.slug, p]));

  // Validate every item exists and is available
  for (const item of items) {
    const product = productMap.get(item.id);
    if (!product) {
      return new Response(
        JSON.stringify({ error: `Product "${item.id}" not found.` }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    if (!product.available) {
      return new Response(
        JSON.stringify({
          error: `"${product.name}" is currently out of stock.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  const stripe = new Stripe(stripeKey);
  const origin = new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: items.map((item) => {
      const product = productMap.get(item.id)!;
      return {
        price_data: {
          currency: "usd",
          product_data: { name: product.name },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: item.quantity,
      };
    }),
    custom_text: {
      submit: {
        message:
          "Your order will be available for pickup at Urban Hearth. We'll be in touch to confirm a time.",
      },
    },
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/products`,
    metadata: {
      items: JSON.stringify(items.map((i) => ({ id: i.id, qty: i.quantity }))),
    },
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
