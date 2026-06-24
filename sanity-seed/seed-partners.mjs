/**
 * seed-partners.mjs — Seed agriculture and fisheries partners into Sanity
 *
 * Usage:
 *   node --env-file=.env.local sanity-seed/seed-partners.mjs
 *
 * Creates a single partners singleton document. Safe to re-run.
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

const { heading, items } = JSON.parse(
  readFileSync(
    join(__dirname, "../src/fallback-content/partners.json"),
    "utf-8",
  ),
);

async function run() {
  console.log(
    `\nSeeding ${items.length} partners → Sanity (${SANITY_DATASET})\n`,
  );

  await client.createOrReplace({
    _type: "partners",
    _id: "partners",
    heading,
    items: items.map((p, i) => ({
      _type: "partnerItem",
      _key: `partner-${i + 1}`,
      name: p.name,
      location: p.location ?? "",
    })),
  });
  await client.delete("drafts.partners").catch(() => {});

  console.log(`  ${items.length} partners written ✓`);
  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
