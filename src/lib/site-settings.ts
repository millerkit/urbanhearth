/**
 * getSiteSettings()
 *
 * Returns site-wide settings, fetching from Sanity when configured and
 * falling back to the static restaurant.json file otherwise.
 *
 * Uses a module-level cache so each page build makes at most one Sanity
 * request, regardless of how many components call this function.
 */
import restaurantFallback from "../content/restaurant.json";
import { fetchSiteSettings } from "./sanity-fetch";

export type SiteSettings = typeof restaurantFallback;

let _cache: SiteSettings | null = null;

export async function getSiteSettings(): Promise<SiteSettings> {
  if (_cache) return _cache;

  if (!import.meta.env.SANITY_PROJECT_ID) {
    _cache = restaurantFallback;
    return _cache;
  }

  try {
    const data = await fetchSiteSettings();
    if (data) {
      _cache = data as SiteSettings;
      return _cache;
    }
  } catch (e) {
    console.error("Failed to fetch site settings from Sanity:", e);
  }

  _cache = restaurantFallback;
  return _cache;
}
