/**
 * seed-team.mjs — Seed team members from src/content/team.json into Sanity
 *
 * Usage:
 *   SANITY_PROJECT_ID=xxx SANITY_API_TOKEN=xxx node scripts/seed-team.mjs
 *
 * Or with Node 22's --env-file flag:
 *   node --env-file=.env.local scripts/seed-team.mjs
 *
 * The Sanity token must have Editor (write) access.
 * Documents use deterministic IDs — safe to re-run.
 * Photos are uploaded to Sanity's asset pipeline before the document is created.
 */

import { createClient } from "@sanity/client";
import { createReadStream, existsSync, readFileSync } from "fs";
import { dirname, extname, basename, join } from "path";
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

const team = JSON.parse(
  readFileSync(join(__dirname, "../src/content/team.json"), "utf-8"),
);

/** Uploads a local image file and returns a Sanity image reference object. */
async function uploadPhoto(rawPath) {
  const absPath = join(__dirname, "..", rawPath.replace(/^\//, ""));
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

/** Produces a stable Sanity document ID from a member's name. */
function docId(name) {
  return (
    "teamMember-" +
    name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
  );
}

async function run() {
  console.log(
    `\nSeeding ${team.length} team members → Sanity (${SANITY_DATASET})\n`,
  );

  for (const member of team) {
    process.stdout.write(`  ${member.name} … `);

    const photo = member.photo ? await uploadPhoto(member.photo) : undefined;

    await client.createOrReplace({
      _type: "teamMember",
      _id: docId(member.name),
      name: member.name,
      roles: member.roles,
      bio: member.bio,
      order: member.order,
      ...(photo ? { photo } : {}),
    });

    console.log("✓");
  }

  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
