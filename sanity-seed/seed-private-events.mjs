/**
 * seed-private-events.mjs — Seed private event packages and page config into Sanity
 *
 * Usage:
 *   SANITY_PROJECT_ID=xxx SANITY_API_TOKEN=xxx node sanity-seed/seed-private-events.mjs
 *
 * Or with Node 22's --env-file flag:
 *   node --env-file=.env.local sanity-seed/seed-private-events.mjs
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

// ── Packages (read from canonical JSON fallback) ──────────────────────────────

const rawPackages = JSON.parse(
  readFileSync(
    join(__dirname, "../src/content/private-event-packages.json"),
    "utf-8",
  ),
);

const packages = rawPackages.map((pkg, i) => ({
  id: pkg.title.toLowerCase().replace(/\s+/g, "-"),
  order: i + 1,
  ...pkg,
}));

// ── Capacity stats (read from canonical JSON fallback) ────────────────────────

const { capacityStats } = JSON.parse(
  readFileSync(
    join(__dirname, "../src/content/private-events-page.json"),
    "utf-8",
  ),
);

// ── Seed ───────────────────────────────────────────────────────────────────────

async function run() {
  console.log("\nSeeding private events → Sanity (" + SANITY_DATASET + ")\n");

  console.log("  Packages:");
  for (const pkg of packages) {
    process.stdout.write(`    ${pkg.title} … `);
    await client.createOrReplace({
      _type: "private_event_package",
      _id: `privateEventPackage-${pkg.id}`,
      order: pkg.order,
      eyebrow: pkg.eyebrow,
      title: pkg.title,
      description: pkg.description,
      details: pkg.details.map((d) => ({
        _type: "packageDetail",
        _key: d.label.toLowerCase().replace(/\s+/g, "-"),
        label: d.label,
        value: d.value,
      })),
      ...(pkg.note ? { note: pkg.note } : {}),
      dark: pkg.dark,
    });
    console.log("✓");
  }

  console.log("\n  Page config (capacity stats) … ");
  await client.createOrReplace({
    _type: "privateEventsPage",
    _id: "privateEventsPage",
    capacityStats: capacityStats.map((s, i) => ({
      _type: "capacityStat",
      _key: `stat-${i + 1}`,
      value: s.value,
      label: s.label,
    })),
  });
  console.log("    ✓");

  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
