/**
 * seed-beverage-menus.mjs — fallback-content wine/spirits JSON → Sanity
 *
 * Usage:
 *   node --env-file=.env.local sanity-seed/seed-beverage-menus.mjs
 *
 * The token must have Editor (write) access. Creates/replaces two singleton
 * documents: "wineMenu" (wine-menu.json) and "spiritsMenu" (spirits-menu.json,
 * which also holds cocktails, small format, zero proof, and beer).
 * Any stale draft of each is discarded so the seeded version is what you see.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

const readJson = (name) =>
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../src/fallback-content", name),
      "utf8",
    ),
  );

const keyed = (type, obj) => ({ _type: type, _key: randomUUID(), ...obj });
const strings = (arr) => (arr ?? []).map((s) => s);

// ── Wine ────────────────────────────────────────────────────────────────────
const wine = readJson("wine-menu.json");
const wineDoc = {
  _id: "wineMenu",
  _type: "wineMenu",
  curatedBy: strings(wine.curatedBy),
  footerNote: wine.footerNote ?? "",
  sections: (wine.sections ?? []).map((section) =>
    keyed("wineSection", {
      title: section.title,
      items: (section.items ?? []).map((w) =>
        keyed("wineItem", {
          name: w.name,
          region: w.region ?? "",
          description: w.description ?? "",
          price: w.price ?? "",
        }),
      ),
    }),
  ),
};

// ── Spirits / cocktails / beer ──────────────────────────────────────────────
const sp = readJson("spirits-menu.json");
const drink = (d) =>
  keyed("simpleDrink", {
    name: d.name,
    description: d.description ?? "",
    ...(d.nonAlcoholic ? { nonAlcoholic: true } : {}),
  });

const spiritsDoc = {
  _id: "spiritsMenu",
  _type: "spiritsMenu",
  curatedBy: strings(sp.curatedBy),
  cocktailPrice: sp.cocktailPrice ?? "",
  cocktails: (sp.cocktails ?? []).map(drink),
  zeroProofPrice: sp.zeroProofPrice ?? "",
  smallFormatPrice: sp.smallFormatPrice ?? "",
  smallFormat: (sp.smallFormat ?? []).map(drink),
  spiritsSections: (sp.spiritsSections ?? []).map((section) =>
    keyed("spiritSection", {
      title: section.title,
      items: (section.items ?? []).map((i) =>
        keyed("spiritItem", { name: i.name, price: i.price ?? "" }),
      ),
    }),
  ),
  beer: (sp.beer ?? []).map((b) =>
    keyed("beerItem", {
      name: b.name,
      brewery: b.brewery ?? "",
      price: b.price ?? "",
      format: b.format,
      description: b.description ?? "",
      ...(b.nonAlcoholic ? { nonAlcoholic: true } : {}),
    }),
  ),
};

for (const doc of [wineDoc, spiritsDoc]) {
  console.log(`Seeding ${doc._id}`);
  await client.createOrReplace(doc);
  await client.delete(`drafts.${doc._id}`).catch(() => {});
}

console.log(
  `Wine: ${wineDoc.sections.length} sections, ${wineDoc.sections.reduce((n, s) => n + s.items.length, 0)} wines`,
);
console.log(
  `Spirits doc: ${spiritsDoc.cocktails.length} cocktails, ${spiritsDoc.spiritsSections.length} spirit categories, ${spiritsDoc.beer.length} beers`,
);
console.log("Done.");
