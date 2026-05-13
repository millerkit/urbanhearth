/**
 * seed-private-events.mjs — Seed private event packages and page config into Sanity
 *
 * Usage:
 *   SANITY_PROJECT_ID=xxx SANITY_TOKEN=xxx node sanity-seed/seed-private-events.mjs
 *
 * Or with Node 22's --env-file flag:
 *   node --env-file=.env.local sanity-seed/seed-private-events.mjs
 *
 * The Sanity token must have Editor (write) access.
 * Documents use deterministic IDs — safe to re-run.
 */

import { createClient } from "@sanity/client";
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

// ── Packages ──────────────────────────────────────────────────────────────────

const packages = [
  {
    id: "full-buyout",
    order: 1,
    eyebrow: "Full Buyout",
    title: "Make It Yours",
    description:
      "Reserve the entire restaurant for your celebration. We'll tailor the evening around your guests — custom menus, curated beverages, and service at your pace.",
    details: [
      { label: "Availability", value: "Tuesday – Sunday" },
      { label: "Capacity", value: "Up to 52 seated" },
      { label: "Min. (Tue–Thu)", value: "$4,000" },
      { label: "Min. (Fri–Sun)", value: "$5,000" },
      { label: "Deposit", value: "50% to confirm" },
    ],
    note: "Minimums exclude tax, gratuity, and coordination fees. We'll work with you on menus, dietary needs, and beverage program.",
    dark: true,
  },
  {
    id: "large-party",
    order: 2,
    eyebrow: "Groups up to 12",
    title: "Large Party",
    description:
      "Book a section of the dining room for your group. Choose from à la carte service or a custom 3–5 course prix fixe menu.",
    details: [
      { label: "Per person", value: "$85 minimum (excl. tax & gratuity)" },
      { label: "Availability", value: "Tuesday – Saturday" },
      { label: "Seatings", value: "5:00–7:00 pm or 8:00–10:00 pm" },
      { label: "Cancellation", value: "7 days' notice for parties of 8+" },
    ],
    note: "A credit card is required to secure the reservation. Late cancellations for parties of 8 or more are subject to a $50 per guest fee.",
    dark: false,
  },
];

// ── Capacity stats ─────────────────────────────────────────────────────────────

const capacityStats = [
  { value: "50", label: "Indoor seated" },
  { value: "24", label: "Outdoor seated (seasonal)" },
  { value: "80", label: "Cocktail reception" },
];

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
