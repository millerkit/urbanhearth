/**
 * seed-blog-post.mjs — one blog post JSON → Sanity
 *
 * Usage:
 *   node --env-file=.env.local sanity-seed/seed-blog-post.mjs sanity-seed/blog-posts/<file>.json
 *
 * Upserts a single `blog_post` document, matched by slug. Re-running with the
 * same slug patches the existing document in place, so it is safe to run twice.
 *
 * The token must have Editor (write) access.
 *
 * Input JSON shape:
 * {
 *   "name": "Post title",
 *   "slug": "post-title",                 // optional, derived from name if absent
 *   "publishedAt": "2026-09-07T00:00:00.000Z",
 *   "excerpt": "One or two sentences.",
 *   "coverImage": "images/foo.jpg",       // optional, path relative to sanity-seed/
 *   "coverImageUrl": "https://…",          // optional, alternative to coverImage
 *   "body": [
 *     { "type": "paragraph", "text": "…" },
 *     { "type": "heading2", "text": "…" },
 *     { "type": "heading3", "text": "…" },
 *     { "type": "bullet_list", "items": ["…", "…"] },
 *     { "type": "image", "file": "images/foo.jpg", "alt": "…" },
 *     { "type": "image", "url": "https://…", "alt": "…" }
 *   ]
 * }
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_ID = process.env.SANITY_PROJECT_ID;
const TOKEN = process.env.SANITY_API_TOKEN;
const DATASET = process.env.SANITY_DATASET ?? "production";

if (!PROJECT_ID || !TOKEN) {
  console.error("Missing SANITY_PROJECT_ID or SANITY_API_TOKEN");
  process.exit(1);
}

const inputArg = process.argv[2];
if (!inputArg) {
  console.error(
    "Usage: node --env-file=.env.local sanity-seed/seed-blog-post.mjs <path-to-post.json>",
  );
  process.exit(1);
}

const inputPath = path.resolve(process.cwd(), inputArg);
if (!fs.existsSync(inputPath)) {
  console.error(`File not found: ${inputPath}`);
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: "2025-01-01",
  token: TOKEN,
  useCdn: false,
});

const post = JSON.parse(fs.readFileSync(inputPath, "utf8"));

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// ── Image upload ─────────────────────────────────────────────────────────────

const uploadedImages = new Map();

async function uploadImage(filePath) {
  if (uploadedImages.has(filePath)) return uploadedImages.get(filePath);

  const absPath = path.join(__dirname, filePath);
  if (!fs.existsSync(absPath)) {
    console.warn(`  Image not found, skipping: ${filePath}`);
    return null;
  }

  const filename = path.basename(filePath);
  console.log(`  Uploading image: ${filename}`);
  const asset = await client.assets.upload(
    "image",
    fs.createReadStream(absPath),
    { filename },
  );
  uploadedImages.set(filePath, asset._id);
  return asset._id;
}

async function uploadImageFromUrl(url) {
  if (uploadedImages.has(url)) return uploadedImages.get(url);

  const filename =
    new URL(url).pathname.split("/").pop()?.split("~")[0] || "image.jpg";
  console.log(`  Uploading from URL: ${filename}`);
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  Failed to fetch image URL: ${url}`);
    return null;
  }
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const stream = Readable.fromWeb(res.body);
  const asset = await client.assets.upload("image", stream, {
    filename,
    contentType,
  });
  uploadedImages.set(url, asset._id);
  return asset._id;
}

// ── Portable Text builder ─────────────────────────────────────────────────────

function span(text) {
  return { _type: "span", _key: randomUUID(), text, marks: [] };
}

function block(style, text) {
  return {
    _type: "block",
    _key: randomUUID(),
    style,
    children: [span(text)],
    markDefs: [],
  };
}

function bulletBlock(text) {
  return {
    _type: "block",
    _key: randomUUID(),
    style: "normal",
    listItem: "bullet",
    level: 1,
    children: [span(text)],
    markDefs: [],
  };
}

async function buildBody(nodes) {
  const blocks = [];
  for (const node of nodes) {
    if (node.type === "paragraph") {
      blocks.push(block("normal", node.text));
    } else if (node.type === "heading2") {
      blocks.push(block("h2", node.text));
    } else if (node.type === "heading3") {
      blocks.push(block("h3", node.text));
    } else if (node.type === "bullet_list") {
      for (const item of node.items) blocks.push(bulletBlock(item));
    } else if (node.type === "image") {
      const assetId = node.url
        ? await uploadImageFromUrl(node.url)
        : await uploadImage(node.file);
      if (assetId) {
        blocks.push({
          _type: "image",
          _key: randomUUID(),
          asset: { _type: "reference", _ref: assetId },
          alt: node.alt ?? "",
          ...(node.caption && { caption: node.caption }),
        });
      }
    } else {
      console.warn(`  Unknown body node type, skipping: ${node.type}`);
    }
  }
  return blocks;
}

// ── Seed ─────────────────────────────────────────────────────────────────────

const slug = post.slug ?? slugify(post.name);
console.log(`\nProcessing: ${post.name}`);

const coverAssetId = post.coverImageUrl
  ? await uploadImageFromUrl(post.coverImageUrl)
  : post.coverImage
    ? await uploadImage(post.coverImage)
    : null;

const body = await buildBody(post.body ?? []);

const doc = {
  _type: "blog_post",
  title: post.name,
  slug: { _type: "slug", current: slug },
  ...(post.publishedAt && { publishedAt: post.publishedAt }),
  ...(post.excerpt && { excerpt: post.excerpt }),
  ...(coverAssetId && {
    coverImage: {
      _type: "image",
      asset: { _type: "reference", _ref: coverAssetId },
    },
  }),
  body,
};

const existing = await client.fetch(
  `*[_type == "blog_post" && slug.current == $slug][0]._id`,
  { slug },
);

if (existing) {
  await client.patch(existing).set(doc).commit();
  await client.delete(`drafts.${existing}`).catch(() => {});
  console.log(`  Updated: ${slug}`);
} else {
  const created = await client.create(doc);
  console.log(`  Created: ${slug} (${created._id})`);
}

console.log("\nDone.");
