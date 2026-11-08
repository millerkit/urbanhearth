/**
 * upload-product-images.mjs — sanity-seed/images/products/* → product.image in Sanity
 *
 * Usage:
 *   node --env-file=.env.local sanity-seed/upload-product-images.mjs           # dry run
 *   node --env-file=.env.local sanity-seed/upload-product-images.mjs --apply   # upload + patch
 *   ... --apply --force                                                        # also replace existing images
 *
 * Products are matched by exact name (case-insensitive) against the Toast-synced
 * product documents. Only the `image` field is written, so the Toast sync and
 * Studio-managed fields are untouched. Products that already have an image are
 * skipped unless --force is passed.
 *
 * The token must have Editor (write) access.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_DIR = path.join(__dirname, "images/products");

// filename → product name as it appears in Toast/Sanity
const IMAGE_TO_PRODUCT = {
  "appleshrub.jpeg": "apple ginger shrub",
  "beetshrub.jpeg": "beet root shrub",
  "elderflower.jpeg": "Elderflower Vinegar 8oz",
  "gluhwein.jpeg": "Gluhwein 28oz Bottle",
  "magnoliavin.jpeg": "Magnolia Vinegar",
  "mustard.jpeg": "pickled mustard seed",
  "Trumpets.jpeg": "candied black trumpets",
  "trumpetsyrup.jpeg": "black trumpet mushroom syrup",
};

const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force");

const PROJECT_ID = process.env.SANITY_PROJECT_ID;
const TOKEN = process.env.SANITY_API_TOKEN;
const DATASET = process.env.SANITY_DATASET ?? "production";

if (!PROJECT_ID || !TOKEN) {
  console.error("Missing SANITY_PROJECT_ID or SANITY_API_TOKEN");
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: "2025-01-01",
  token: TOKEN,
  useCdn: false,
});

const norm = (s) => s.trim().toLowerCase();

// Published documents only (drafts.* ids are excluded by the path filter)
const products = await client.fetch(
  `*[_type == "product" && !(_id in path("drafts.**"))]{ _id, name, "hasImage": defined(image.asset) }`,
);
const byName = new Map();
for (const p of products) {
  const key = norm(p.name);
  byName.set(key, [...(byName.get(key) ?? []), p]);
}

console.log(APPLY ? "APPLY mode\n" : "DRY RUN (pass --apply to upload)\n");

let uploaded = 0;
let skipped = 0;

for (const [filename, productName] of Object.entries(IMAGE_TO_PRODUCT)) {
  const filePath = path.join(IMAGE_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`✗ ${filename}: file not found`);
    skipped++;
    continue;
  }

  const matches = byName.get(norm(productName)) ?? [];
  if (matches.length !== 1) {
    console.log(
      `✗ ${filename}: expected 1 product named "${productName}", found ${matches.length}`,
    );
    skipped++;
    continue;
  }

  const product = matches[0];
  if (product.hasImage && !FORCE) {
    console.log(
      `– ${filename} → "${product.name}": already has an image, skipped`,
    );
    skipped++;
    continue;
  }

  const kb = Math.round(fs.statSync(filePath).size / 1024);
  if (!APPLY) {
    console.log(
      `✓ ${filename} (${kb} KB) → "${product.name}" [${product._id}]`,
    );
    continue;
  }

  const asset = await client.assets.upload(
    "image",
    fs.createReadStream(filePath),
    { filename, contentType: "image/jpeg" },
  );
  await client
    .patch(product._id)
    .set({
      image: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
    })
    .commit();
  console.log(`✓ ${filename} (${kb} KB) → "${product.name}" uploaded`);
  uploaded++;
}

console.log(
  APPLY
    ? `\nDone: ${uploaded} uploaded, ${skipped} skipped.`
    : `\nDry run complete. ${skipped} would be skipped.`,
);
