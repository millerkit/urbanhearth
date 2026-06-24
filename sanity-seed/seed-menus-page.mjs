/**
 * seed-menus-page.mjs — Seed menus page content from src/fallback-content/menus-page.json
 *
 * Usage:
 *   node --env-file=.env.local sanity-seed/seed-menus-page.mjs
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
    join(__dirname, "../src/fallback-content/menus-page.json"),
    "utf-8",
  ),
);

async function run() {
  console.log(`\nSeeding Menus page → Sanity (${SANITY_DATASET})\n`);
  await client.createOrReplace({
    _type: "menusPage",
    _id: "menusPage",
    accuracyNote: page.accuracyNote,
    walkInsNote: page.walkInsNote,
  });
  await client.delete("drafts.menusPage").catch(() => {});
  console.log("  Menus page written ✓\n\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
