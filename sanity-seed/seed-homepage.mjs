/**
 * seed-homepage.mjs — Seed homepage content into Sanity
 *
 * Usage:
 *   SANITY_PROJECT_ID=xxx SANITY_TOKEN=xxx node sanity-seed/seed-homepage.mjs
 *
 * Or with Node 22's --env-file flag:
 *   node --env-file=.env.local sanity-seed/seed-homepage.mjs
 *
 * The Sanity token must have Editor (write) access.
 * Uses a fixed document ID — safe to re-run.
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

const homepage = JSON.parse(
  readFileSync(join(__dirname, "../src/content/homepage.json"), "utf-8"),
);

async function run() {
  console.log("\nSeeding homepage content → Sanity (" + SANITY_DATASET + ")\n");

  await client.createOrReplace({
    _type: "homepageContent",
    _id: "homepageContent",
    statement: {
      eyebrow: homepage.statement.eyebrow,
      tags: homepage.statement.tags,
      definitionTerm: homepage.statement.definitionTerm,
      definitionText: homepage.statement.definitionText,
      description: homepage.statement.description,
    },
    intro: {
      eyebrow: homepage.intro.eyebrow,
      paragraphs: homepage.intro.paragraphs,
    },
  });

  console.log("  ✓ Homepage content seeded\n\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
