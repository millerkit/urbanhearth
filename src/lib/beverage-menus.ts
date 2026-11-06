import { isSanityConfigured } from "./sanity";
import { fetchWineMenu, fetchSpiritsMenu } from "./sanity-fetch";
import wineFallback from "../fallback-content/wine-menu.json";
import spiritsFallback from "../fallback-content/spirits-menu.json";

// Sanity content wins field by field; anything unset (null) falls back to
// the JSON in fallback-content/, which is also what runs without Sanity.
function overlay<T extends object>(fallback: T, data: any): T {
  if (!data) return fallback;
  return {
    ...fallback,
    ...Object.fromEntries(Object.entries(data).filter(([, v]) => v != null)),
  };
}

export async function getWineMenu() {
  if (!isSanityConfigured) return wineFallback;
  try {
    return overlay(wineFallback, await fetchWineMenu());
  } catch (e) {
    console.error("[wine] Sanity fetch failed, using fallback:", e);
    return wineFallback;
  }
}

export async function getSpiritsMenu() {
  if (!isSanityConfigured) return spiritsFallback;
  try {
    return overlay(spiritsFallback, await fetchSpiritsMenu());
  } catch (e) {
    console.error("[spirits] Sanity fetch failed, using fallback:", e);
    return spiritsFallback;
  }
}
