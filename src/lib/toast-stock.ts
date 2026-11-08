/**
 * Live stock check against Toast's Stock API.
 *
 * Sanity's `available` flag is only as fresh as the last sync, so this is the
 * real oversell protection: call it right before taking payment.
 * Requires the Toast API credentials to include the `stock:read` scope.
 */

const TOAST_BASE_URL = "https://ws-api.toasttab.com";

type ToastStockStatus = "IN_STOCK" | "OUT_OF_STOCK" | "QUANTITY";

interface ToastInventoryEntry {
  guid: string;
  status?: ToastStockStatus;
  quantity?: number;
  itemGuidValidity?: "VALID" | "INVALID";
}

export interface StockRequestItem {
  /** Toast menu item GUID */
  guid: string;
  quantity: number;
}

export type StockCheckResult =
  | { ok: true }
  | { ok: false; reason: "unavailable"; unavailableGuids: string[] }
  | { ok: false; reason: "error"; message: string };

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToastToken(
  clientId: string,
  clientSecret: string,
): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const res = await fetch(
    `${TOAST_BASE_URL}/authentication/v1/authentication/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        clientSecret,
        userAccessType: "TOAST_MACHINE_CLIENT",
      }),
    },
  );
  if (!res.ok) throw new Error(`Toast auth failed: ${res.status}`);

  const data = await res.json();
  const expiresInSec: number = data.token?.expiresIn ?? 3600;
  cachedToken = {
    value: data.token.accessToken,
    // Refresh a minute early; cap at 1 hour so a stale token can't linger
    expiresAt: Date.now() + Math.min(expiresInSec - 60, 3600) * 1000,
  };
  return cachedToken.value;
}

/**
 * Checks every requested item against Toast's live inventory.
 * Fails closed: if Toast can't be reached, the result is an error so the
 * caller can refuse the order rather than risk overselling.
 */
export async function checkToastStock(
  items: StockRequestItem[],
): Promise<StockCheckResult> {
  const clientId = import.meta.env.TOAST_CLIENT_ID;
  const clientSecret = import.meta.env.TOAST_CLIENT_SECRET;
  const restaurantGuid = import.meta.env.TOAST_RESTAURANT_GUID;

  if (!clientId || !clientSecret || !restaurantGuid) {
    return { ok: false, reason: "error", message: "Toast is not configured." };
  }
  if (items.length === 0) return { ok: true };

  // Same item may be in the cart more than once; sum quantities per GUID
  const wanted = new Map<string, number>();
  for (const item of items) {
    wanted.set(item.guid, (wanted.get(item.guid) ?? 0) + item.quantity);
  }

  try {
    const token = await getToastToken(clientId, clientSecret);
    const res = await fetch(`${TOAST_BASE_URL}/stock/v1/inventory/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Toast-Restaurant-External-ID": restaurantGuid,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ guids: [...wanted.keys()] }),
    });
    if (!res.ok) {
      // A rejected token may have been revoked; drop the cache for next time
      if (res.status === 401) cachedToken = null;
      return {
        ok: false,
        reason: "error",
        message: `Toast stock API returned ${res.status}`,
      };
    }

    const entries = (await res.json()) as ToastInventoryEntry[];
    const byGuid = new Map(entries.map((e) => [e.guid, e]));

    const unavailableGuids: string[] = [];
    for (const [guid, qty] of wanted) {
      const entry = byGuid.get(guid);
      // No entry or an invalid GUID: treat as unavailable, never as in stock
      if (!entry || entry.itemGuidValidity === "INVALID") {
        unavailableGuids.push(guid);
      } else if (entry.status === "OUT_OF_STOCK") {
        unavailableGuids.push(guid);
      } else if (entry.status === "QUANTITY" && (entry.quantity ?? 0) < qty) {
        unavailableGuids.push(guid);
      }
      // IN_STOCK: Toast isn't counting this item, so any quantity is fine
    }

    return unavailableGuids.length > 0
      ? { ok: false, reason: "unavailable", unavailableGuids }
      : { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : "Toast request failed",
    };
  }
}
