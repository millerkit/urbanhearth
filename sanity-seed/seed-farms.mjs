/**
 * seed-farms.mjs — Seed farm list from src/content/farms.json into Sanity
 *
 * Usage:
 *   SANITY_PROJECT_ID=xxx SANITY_TOKEN=xxx node scripts/seed-farms.mjs
 *
 * Or with Node 22's --env-file flag:
 *   node --env-file=.env.local scripts/seed-farms.mjs
 *
 * The Sanity token must have Editor (write) access.
 * Documents use deterministic IDs — safe to re-run.
 */

import { createClient } from "@sanity/client";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID;
const SANITY_TOKEN = process.env.SANITY_TOKEN;
const SANITY_DATASET = process.env.SANITY_DATASET ?? "production";

for (const [key, val] of Object.entries({ SANITY_PROJECT_ID, SANITY_TOKEN })) {
  if (!val) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: "2025-01-01",
  token: SANITY_TOKEN,
  useCdn: false,
});

const farms = JSON.parse(
  readFileSync(join(__dirname, "../src/content/farms.json"), "utf-8"),
);

function docId(name) {
  return (
    "farm-" +
    name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
  );
}

async function run() {
  console.log(`\nSeeding ${farms.length} farms → Sanity (${SANITY_DATASET})\n`);

  for (const farm of farms) {
    process.stdout.write(`  ${farm.name} … `);
    await client.createOrReplace({
      _type: "farm",
      _id: docId(farm.name),
      name: farm.name,
      location: farm.location,
      order: farm.order,
    });
    console.log("✓");
  }

  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
