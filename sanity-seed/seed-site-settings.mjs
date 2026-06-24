/**
 * seed-site-settings.mjs — Seed siteSettings from src/fallback-content/restaurant.json
 *
 * Usage:
 *   node --env-file=.env.local sanity-seed/seed-site-settings.mjs
 *
 * Creates/replaces the singleton siteSettings document. Safe to re-run.
 * The token must have Editor (write) access.
 */

import { createClient } from "@sanity/client";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID;
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN;
const SANITY_DATASET = process.env.SANITY_DATASET ?? "production";

for (const [key, val] of Object.entries({
  SANITY_PROJECT_ID,
  SANITY_API_TOKEN,
})) {
  if (!val) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: "2025-01-01",
  token: SANITY_API_TOKEN,
  useCdn: false,
});

const r = JSON.parse(
  readFileSync(
    join(__dirname, "../src/fallback-content/restaurant.json"),
    "utf-8",
  ),
);

async function run() {
  console.log(`\nSeeding siteSettings → Sanity (${SANITY_DATASET})\n`);

  await client.createOrReplace({
    _type: "siteSettings",
    _id: "siteSettings",
    name: r.name,
    tagline: r.tagline,
    url: r.url,
    address: r.address,
    ...(r.mapsUrl ? { mapsUrl: r.mapsUrl } : {}),
    phone: r.phone,
    hours: r.hours,
    privateDiningEmail: r.privateDiningEmail,
    reservations: r.reservations,
    social: r.social,
  });
  await client.delete("drafts.siteSettings").catch(() => {});

  console.log("  siteSettings written ✓");
  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
