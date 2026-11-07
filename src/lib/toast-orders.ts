/**
 * Creates a pickup order in Toast for a paid web order.
 *
 * PLACEHOLDER: this needs the `orders:write` scope, which Toast grants after
 * reviewing the integration (requested from our Toast rep). Until then it
 * always throws, so the Stripe webhook answers 500 and Stripe keeps retrying
 * (for up to ~3 days) instead of silently dropping the paid order.
 *
 * When implementing:
 * - Make it idempotent on `stripeSessionId` (Stripe retries and may deliver
 *   the same event twice). Use Toast's external ID on the order, or look up
 *   an existing order first, so one payment never creates two Toast orders.
 * - Confirm whether Toast deducts tracked inventory automatically for
 *   API-created orders. If not, follow up with `stock:write`.
 */

export interface ToastOrderItem {
  toastItemGuid: string;
  name: string;
  quantity: number;
  /** Unit price in dollars, as charged */
  price: number;
}

export interface ToastOrderRequest {
  stripeSessionId: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  items: ToastOrderItem[];
}

export class ToastOrdersNotEnabledError extends Error {
  constructor() {
    super("Toast order creation is not enabled yet (needs orders:write).");
    this.name = "ToastOrdersNotEnabledError";
  }
}

export async function createToastOrder(
  _order: ToastOrderRequest,
): Promise<{ toastOrderGuid: string }> {
  throw new ToastOrdersNotEnabledError();
}
