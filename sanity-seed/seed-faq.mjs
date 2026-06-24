/**
 * seed-faq.mjs — Seed FAQ items from src/fallback-content/faq.json
 *
 * Usage:
 *   node --env-file=.env.local sanity-seed/seed-faq.mjs
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

const items = JSON.parse(
  readFileSync(join(__dirname, "../src/fallback-content/faq.json"), "utf-8"),
);

async function run() {
  console.log(`\nSeeding FAQ → Sanity (${SANITY_DATASET})\n`);

  const tx = client.transaction();

  for (const [i, item] of items.entries()) {
    const id = `faqItem-${item._key}`;
    tx.createOrReplace({
      _type: "faqItem",
      _id: id,
      question: item.question,
      answer: item.answer,
      order: i,
    });
  }

  await tx.commit();

  // Discard any stale drafts
  for (const item of items) {
    await client.delete(`drafts.faqItem-${item._key}`).catch(() => {});
  }

  console.log(`  ${items.length} FAQ items written ✓\n\nDone.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
