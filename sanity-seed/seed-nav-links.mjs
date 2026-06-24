/**
 * seed-nav-links.mjs — Seed nav links from src/fallback-content/nav-links.json into Sanity
 *
 * Usage:
 *   node --env-file=.env.local sanity-seed/seed-nav-links.mjs
 *
 * Creates a single navLinks singleton document. Safe to re-run.
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

const links = JSON.parse(
  readFileSync(
    join(__dirname, "../src/fallback-content/nav-links.json"),
    "utf-8",
  ),
);

function toNavLink(item) {
  const key = item.href
    ? item.href.replace(/\//g, "-").replace(/^-/, "")
    : item.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
  return {
    _type: "navLink",
    _key: key || "home",
    label: item.label,
    ...(item.href ? { href: item.href } : {}),
    hidden: item._hidden === true,
    ...(item.children
      ? {
          children: item.children.map((child) => ({
            _type: "navLinkChild",
            _key: child.href.replace(/\//g, "-").replace(/^-/, ""),
            label: child.label,
            href: child.href,
          })),
        }
      : {}),
  };
}

async function run() {
  console.log(`\nSeeding nav links → Sanity (${SANITY_DATASET})\n`);

  await client.createOrReplace({
    _type: "navLinks",
    _id: "navLinks",
    links: links.map(toNavLink),
  });
  await client.delete("drafts.navLinks").catch(() => {});

  console.log(`  ${links.length} nav links written ✓`);
  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
