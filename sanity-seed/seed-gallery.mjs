/**
 * seed-gallery.mjs — Seed gallery photos into Sanity
 *
 * Usage:
 *   node --env-file=.env.local sanity-seed/seed-gallery.mjs
 *
 * Reads every image in src/assets/photos/gallery/, uploads each to Sanity's
 * asset pipeline, and creates/replaces a galleryPhoto document for it.
 * Documents use deterministic IDs — safe to re-run.
 */

import { createClient } from "@sanity/client";
import { createReadStream, readdirSync } from "fs";
import { basename, dirname, extname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GALLERY_DIR = join(__dirname, "..", "src/assets/photos/gallery");

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

const SUPPORTED = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function getPhotos() {
  return readdirSync(GALLERY_DIR)
    .filter((f) => SUPPORTED.has(extname(f).toLowerCase()))
    .sort()
    .map((filename, i) => ({
      order: i + 1,
      filename,
      path: join(GALLERY_DIR, filename),
    }));
}

async function uploadPhoto({ path, filename }) {
  const ext = extname(filename).toLowerCase();
  const contentType =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";
  const asset = await client.assets.upload("image", createReadStream(path), {
    filename,
    contentType,
  });
  return { _type: "image", asset: { _type: "reference", _ref: asset._id } };
}

async function run() {
  const photos = getPhotos();
  console.log(
    `\nSeeding ${photos.length} gallery photos → Sanity (${SANITY_DATASET})\n`,
  );

  for (const item of photos) {
    process.stdout.write(
      `  [${String(item.order).padStart(2, "0")}] ${item.filename} … `,
    );

    const photo = await uploadPhoto(item);
    const id = `galleryPhoto-${String(item.order).padStart(3, "0")}`;

    await client.createOrReplace({
      _type: "galleryPhoto",
      _id: id,
      order: item.order,
      alt: "",
      span: "normal",
      photo,
    });
    await client.delete(`drafts.${id}`).catch(() => {});

    console.log("✓");
  }

  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
