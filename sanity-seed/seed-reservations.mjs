/**
 * seed-reservations.mjs — Seed reservation experience cards into Sanity
 *
 * Usage:
 *   SANITY_PROJECT_ID=xxx SANITY_API_TOKEN=xxx node sanity-seed/seed-reservations.mjs
 *
 * Or with Node 22's --env-file flag:
 *   node --env-file=.env.local sanity-seed/seed-reservations.mjs
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

const experiences = JSON.parse(
  readFileSync(join(__dirname, "../src/content/reservations.json"), "utf-8"),
);

async function run() {
  console.log(
    `\nSeeding ${experiences.length} reservation experiences → Sanity (${SANITY_DATASET})\n`,
  );

  for (const exp of experiences) {
    process.stdout.write(`  ${exp.title} … `);

    await client.createOrReplace({
      _type: "reservationExperience",
      _id: `reservationExperience-${exp.id}`,
      order: exp.order,
      number: exp.number,
      eyebrow: exp.eyebrow,
      title: exp.title,
      id: { _type: "slug", current: exp.id },
      theme: exp.theme,
      description: exp.description,
      details: exp.details.map((d) => ({
        _type: "diningAreaDetail",
        _key: d.label.toLowerCase().replace(/\s+/g, "-"),
        label: d.label,
        value: d.value ?? "",
        linkType: d.linkType ?? "none",
      })),
      ...(exp.note ? { note: exp.note } : {}),
      bookingLabel: exp.bookingLabel,
      ...(exp.otWidgetSrc ? { otWidgetSrc: exp.otWidgetSrc } : {}),
      phoneReserve: exp.phoneReserve ?? false,
    });

    console.log("✓");
  }

  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
