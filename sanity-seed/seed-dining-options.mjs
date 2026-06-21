/**
 * seed-dining-options.mjs — Seed dining options from src/fallback-content/dining-options.json into Sanity
 *
 * Usage:
 *   node --env-file=.env.local sanity-seed/seed-dining-options.mjs
 *
 * The Sanity token must have Editor (write) access.
 * Documents use deterministic IDs — safe to re-run.
 * Photos are uploaded to Sanity's asset pipeline before the document is created.
 */

import { createClient } from "@sanity/client";
import { createReadStream, existsSync, readFileSync } from "fs";
import { basename, dirname, extname, join } from "path";
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

const areas = JSON.parse(
  readFileSync(
    join(__dirname, "../src/fallback-content/dining-options.json"),
    "utf-8",
  ),
);

// Primary photos keyed by area id
const localPhotos = {
  "dining-room": "src/assets/photos/OptionsDiningRoomTeaser.jpeg",
  "chefs-counter": "src/assets/photos/OptionsChefsCounterTeaser.jpeg",
  salon: "src/assets/photos/OptionsBarTeaser.jpeg",
};

// Secondary photos (shown side-by-side with primary)
const localPhotosSecondary = {
  salon: "src/assets/photos/OptionsSalonTeaser.jpeg",
};

async function uploadPhoto(rawPath) {
  const absPath = join(__dirname, "..", rawPath);
  if (!existsSync(absPath)) {
    console.warn(`    ⚠  Photo not found: ${absPath} — skipping`);
    return undefined;
  }
  const ext = extname(absPath).toLowerCase();
  const contentType = ext === ".png" ? "image/png" : "image/jpeg";
  const asset = await client.assets.upload("image", createReadStream(absPath), {
    filename: basename(absPath),
    contentType,
  });
  return { _type: "image", asset: { _type: "reference", _ref: asset._id } };
}

function docId(id) {
  return `diningArea-${id}`;
}

async function run() {
  console.log(
    `\nSeeding ${areas.length} dining options → Sanity (${SANITY_DATASET})\n`,
  );

  for (const area of areas) {
    process.stdout.write(`  ${area.title} … `);

    const photoPath = localPhotos[area.id];
    const photo = photoPath ? await uploadPhoto(photoPath) : undefined;

    const photoSecondaryPath = localPhotosSecondary[area.id];
    const photoSecondary = photoSecondaryPath
      ? await uploadPhoto(photoSecondaryPath)
      : undefined;

    await client.createOrReplace({
      _type: "diningArea",
      _id: docId(area.id),
      order: area.order,
      number: area.number,
      label: area.label,
      title: area.title,
      id: { _type: "slug", current: area.id },
      dark: area.dark ?? false,
      photoAlt: area.photoAlt,
      description: area.description,
      details: area.details.map((d) => ({
        _type: "diningAreaDetail",
        _key: d.label.toLowerCase().replace(/\s+/g, "-"),
        label: d.label,
        value: d.value ?? "",
        linkType: d.linkType ?? "none",
      })),
      ctaLabel: area.ctaLabel,
      phoneReserve: area.phoneReserve ?? false,
      ...(photo ? { photo } : {}),
      ...(photoSecondary ? { photoSecondary } : {}),
    });

    console.log("✓");
  }

  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
