/**
 * seed-chef.mjs — Seed the chef profile from src/content/chef.json into Sanity
 *
 * Usage:
 *   SANITY_PROJECT_ID=xxx SANITY_TOKEN=xxx node scripts/seed-chef.mjs
 *
 * Or with Node 22's --env-file flag:
 *   node --env-file=.env.local scripts/seed-chef.mjs
 *
 * The Sanity token must have Editor (write) access.
 * Uses a fixed document ID — safe to re-run.
 * The photo is uploaded to Sanity's asset pipeline before the document is created.
 */

import { createClient } from "@sanity/client";
import { createReadStream, existsSync, readFileSync } from "fs";
import { dirname, extname, basename, join } from "path";
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

const chef = JSON.parse(
  readFileSync(join(__dirname, "../src/content/chef.json"), "utf-8"),
);

/** Uploads a local image file and returns a Sanity image reference object. */
async function uploadPhoto(rawPath) {
  const absPath = join(__dirname, "..", rawPath.replace(/^\//, ""));
  if (!existsSync(absPath)) {
    console.warn(`  ⚠  Photo not found: ${absPath} — skipping`);
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
  console.log(`\nSeeding chef profile → Sanity (${SANITY_DATASET})\n`);

  process.stdout.write(`  Uploading photo … `);
  const photo = await uploadPhoto("src/assets/photos/erin.jpg");
  console.log(photo ? "✓" : "skipped");

  process.stdout.write(`  Creating document … `);
  await client.createOrReplace({
    _type: "chefProfile",
    _id: "chefProfile",
    name: chef.name,
    title: chef.title,
    roles: chef.roles,
    bio: chef.bio,
    accolades: chef.accolades,
    ...(photo ? { photo } : {}),
  });
  console.log("✓");

  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
