/**
 * seed-gallery.mjs — Seed gallery photos into Sanity
 *
 * Usage:
 *   SANITY_PROJECT_ID=xxx SANITY_API_TOKEN=xxx node sanity-seed/seed-gallery.mjs
 *
 * Or with Node 22's --env-file flag:
 *   node --env-file=.env.local sanity-seed/seed-gallery.mjs
 *
 * The Sanity token must have Editor (write) access.
 * Documents use deterministic IDs — safe to re-run.
 * Photos are uploaded to Sanity's asset pipeline before the document is created.
 */

import { createClient } from "@sanity/client";
import { createReadStream, existsSync } from "fs";
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

const photos = [
  {
    order: 1,
    alt: "Seasonal small plate",
    span: "normal",
    path: "src/assets/photos/food-photo-1.jpeg",
  },
  {
    order: 2,
    alt: "From the kitchen",
    span: "normal",
    path: "src/assets/photos/food-photo-2.jpeg",
  },
  {
    order: 3,
    alt: "Seasonal plate",
    span: "normal",
    path: "src/assets/photos/food-photo-4.jpeg",
  },
  {
    order: 4,
    alt: "Kitchen preparation",
    span: "normal",
    path: "src/assets/photos/food-photo-5.jpeg",
  },
  {
    order: 5,
    alt: "A course from the Chef's Counter",
    span: "normal",
    path: "src/assets/photos/food-photo-6.jpeg",
  },
  {
    order: 6,
    alt: "Dried botanicals",
    span: "normal",
    path: "src/assets/gallery/gallery-007.jpg",
  },
];

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

async function run() {
  console.log(
    `\nSeeding ${photos.length} gallery photos → Sanity (${SANITY_DATASET})\n`,
  );

  for (const item of photos) {
    process.stdout.write(`  [${item.order}] ${item.alt} … `);

    const photo = await uploadPhoto(item.path);
    if (!photo) {
      console.log("skipped (no photo)");
      continue;
    }

    await client.createOrReplace({
      _type: "galleryPhoto",
      _id: `galleryPhoto-${item.order}`,
      order: item.order,
      alt: item.alt,
      span: item.span,
      photo,
    });

    console.log("✓");
  }

  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
