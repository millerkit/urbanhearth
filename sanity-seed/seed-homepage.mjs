/**
 * seed-homepage.mjs — Seed homepage content into Sanity
 *
 * Handles the homepageContent document: text fields and the diningTeasers
 * array of homepage teaser photos (one per dining option, keyed by areaId).
 *
 * Usage:
 *   node --env-file=.env.local sanity-seed/seed-homepage.mjs
 *
 * The Sanity token must have Editor (write) access.
 * Uses a fixed document ID — safe to re-run.
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

const homepage = JSON.parse(
  readFileSync(
    join(__dirname, "../src/fallback-content/homepage.json"),
    "utf-8",
  ),
);

// Homepage teaser photos keyed by dining option area id
const teaserPhotos = {
  "dining-room": {
    path: "src/assets/photos/HomeDiningRoomTeaser.webp",
    alt: "Dining Room at Urban Hearth",
  },
  "chefs-counter": {
    path: "src/assets/photos/HomeChefsCounterTeaser.webp",
    alt: "Chef's Counter at Urban Hearth",
  },
  salon: {
    path: "src/assets/photos/HomeBarTeaser.webp",
    alt: "Bar & Salon at Urban Hearth",
  },
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

async function run() {
  console.log("\nSeeding homepage content → Sanity (" + SANITY_DATASET + ")\n");

  console.log("  Uploading dining teaser photos…");
  const diningTeasers = [];
  for (const [areaId, { path, alt }] of Object.entries(teaserPhotos)) {
    process.stdout.write(`    ${areaId} … `);
    const photo = await uploadPhoto(path);
    if (photo) {
      diningTeasers.push({
        _type: "diningTeaser",
        _key: areaId,
        areaId,
        photo,
        photoAlt: alt,
      });
      console.log("✓");
    }
  }

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
    teasersEyebrow: homepage.teasersEyebrow,
    diningTeasers,
  });
  await client.delete("drafts.homepageContent").catch(() => {});

  console.log("  ✓ Homepage content seeded\n\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
