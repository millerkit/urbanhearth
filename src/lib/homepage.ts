/**
 * getHomepageContent()
 *
 * Returns homepage content (intro statement + intro section), fetching from
 * Sanity when configured and falling back to homepage.json otherwise.
 *
 * Module-level cache ensures at most one Sanity request per page build.
 */
import homepageFallback from "../fallback-content/homepage.json";
import { fetchHomepageContent } from "./sanity-fetch";

export type HomepageContent = typeof homepageFallback;

let _cache: HomepageContent | null = null;

export async function getHomepageContent(): Promise<HomepageContent> {
  if (_cache) return _cache;

  if (!import.meta.env.SANITY_PROJECT_ID) {
    _cache = homepageFallback;
    return _cache;
  }

  try {
    const data = await fetchHomepageContent();
    if (data) {
      const defined = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v != null),
      );
      _cache = { ...homepageFallback, ...defined } as HomepageContent;
      return _cache;
    }
  } catch (e) {
    console.error("Failed to fetch homepage content from Sanity:", e);
  }

  _cache = homepageFallback;
  return _cache;
}
