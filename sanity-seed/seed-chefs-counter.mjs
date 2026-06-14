/**
 * seed-chefs-counter.mjs — Seed Chef's Counter card from src/fallback-content/chefs-counter.json
 *
 * Usage:
 *   node --env-file=.env.local sanity-seed/seed-chefs-counter.mjs
 *
 * Creates a single chefsCounter singleton document. Safe to re-run.
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

const card = JSON.parse(
  readFileSync(
    join(__dirname, "../src/fallback-content/chefs-counter.json"),
    "utf-8",
  ),
);

async function run() {
  console.log(`\nSeeding Chef's Counter → Sanity (${SANITY_DATASET})\n`);

  await client.createOrReplace({
    _type: "chefsCounter",
    _id: "chefsCounter",
    eyebrow: card.eyebrow,
    price: card.price,
    priceLabel: card.priceLabel,
    description: card.description,
    winePairingLabel: card.winePairingLabel,
    winePairingValue: card.winePairingValue,
    finePrint: card.finePrint,
  });

  console.log("  Chef's Counter written ✓");
  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
