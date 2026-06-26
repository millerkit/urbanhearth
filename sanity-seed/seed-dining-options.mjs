/**
 * seed-dining-options.mjs — Seed dining options from src/fallback-content/dining-options.json into Sanity
 *
 * Handles text content and dining-options-page photos only (photo, photoSecondary).
 * Homepage teaser photos are seeded separately via seed-homepage.mjs.
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

// Primary photos keyed by area id (Dining Options page)
const localPhotos = {
  "dining-room": "src/assets/photos/OptionsDiningRoomTeaser.webp",
  "chefs-counter": "src/assets/photos/OptionsChefsCounterTeaserSmall.webp",
  salon: "src/assets/photos/OptionsSalonTeaser.webp",
};

// Secondary photos shown side-by-side with the primary on the Dining Options page
const localPhotosSecondary = {
  "chefs-counter": "src/assets/photos/OptionsChefsCounterTeaserLarge.webp",
  salon: "src/assets/photos/OptionsBarTeaser.webp",
};

async function uploadPhoto(rawPath) {
  const absPath = join(__dirname, "..", rawPath);
  if (!existsSync(absPath)) {
    console.warn(`    ⚠  Photo not found: ${absPath} — skipping`);
    return undefined;
  }
  const ext = extname(absPath).toLowerCase();
  const contentType =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";
  const asset = await client.assets.upload("image", createReadStream(absPath), {
    filename: basename(absPath),
    contentType,
  });
  return { _type: "image", asset: { _type: "reference", _ref: asset._id } };
}

function docId(id) {
  return `diningOption-${id}`;
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
      _type: "diningOption",
      _id: docId(area.id),
      order: area.order,
      number: area.number,
      label: area.label,
      title: area.title,
      id: { _type: "slug", current: area.id },
      dark: area.dark ?? false,
      photoAlt: area.photoAlt,
      description: area.description,
      ...(area.descriptionShort
        ? { descriptionShort: area.descriptionShort }
        : {}),
      details: area.details.map((d) => ({
        _type: "diningOptionDetail",
        _key: d.label.toLowerCase().replace(/\s+/g, "-"),
        label: d.label,
        value: d.value ?? "",
        linkType: d.linkType ?? "none",
      })),
      ctaLabel: area.ctaLabel,
      phoneReserve: area.phoneReserve ?? false,
      ...(area.price ? { price: area.price } : {}),
      ...(area.priceSuffix ? { priceSuffix: area.priceSuffix } : {}),
      ...(area.bookingNote ? { bookingNote: area.bookingNote } : {}),
      ...(area.pairings?.length
        ? {
            pairings: area.pairings.map((p, i) => ({
              _type: "object",
              _key: `pairing-${i}`,
              label: p.label,
              price: p.price,
            })),
          }
        : {}),
      ...(area.finePrint ? { finePrint: area.finePrint } : {}),
      ...(photo ? { photo } : {}),
      ...(photoSecondary ? { photoSecondary } : {}),
    });

    await client.delete(`drafts.${docId(area.id)}`).catch(() => {});
    console.log("✓");
  }

  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
