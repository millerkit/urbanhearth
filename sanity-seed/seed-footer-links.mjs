/**
 * seed-footer-links.mjs — Seed footer links from src/fallback-content/footer-links.json into Sanity
 *
 * Usage:
 *   node --env-file=.env.local sanity-seed/seed-footer-links.mjs
 *
 * Creates a single footerLinks singleton document. Safe to re-run.
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

const { secondaryLinks, legalLinks } = JSON.parse(
  readFileSync(
    join(__dirname, "../src/fallback-content/footer-links.json"),
    "utf-8",
  ),
);

function toLink(prefix, item) {
  return {
    _type: "object",
    _key: `${prefix}-${item.href.replace(/\//g, "-").replace(/^-/, "") || "home"}`,
    label: item.label,
    href: item.href,
  };
}

async function run() {
  console.log(`\nSeeding footer links → Sanity (${SANITY_DATASET})\n`);

  await client.createOrReplace({
    _type: "footerLinks",
    _id: "footerLinks",
    secondaryLinks: secondaryLinks.map((l) => toLink("sec", l)),
    legalLinks: legalLinks.map((l) => toLink("leg", l)),
  });
  await client.delete("drafts.footerLinks").catch(() => {});

  console.log(
    `  ${secondaryLinks.length} secondary links + ${legalLinks.length} legal links written ✓`,
  );
  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
