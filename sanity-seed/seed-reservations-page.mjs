/**
 * seed-reservations-page.mjs — Seed reservations page content from src/fallback-content/reservations-page.json
 *
 * Usage:
 *   node --env-file=.env.local sanity-seed/seed-reservations-page.mjs
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

const page = JSON.parse(
  readFileSync(
    join(__dirname, "../src/fallback-content/reservations-page.json"),
    "utf-8",
  ),
);

async function run() {
  console.log(`\nSeeding Reservations page → Sanity (${SANITY_DATASET})\n`);
  await client.createOrReplace({
    _type: "reservationsPage",
    _id: "reservationsPage",
    pageTitle: page.pageTitle,
    pageLead: page.pageLead,
    seoDescription: page.seoDescription,
    bookingUrl: page.bookingUrl,
  });
  await client.delete("drafts.reservationsPage").catch(() => {});
  console.log("  Reservations page written ✓\n\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
