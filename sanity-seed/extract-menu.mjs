/**
 * extract-menu.mjs — PDF → menu.json
 *
 * Usage:
 *   ANTHROPIC_API_KEY=xxx node storyblok-import/extract-menu.mjs path/to/menu.pdf
 *
 * Outputs storyblok-import/menu.json for review before importing.
 * No packages required beyond Node 22 built-ins.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY is not set");
  process.exit(1);
}

const pdfPath = process.argv[2];
if (!pdfPath) {
  console.error(
    "Usage: node storyblok-import/extract-menu.mjs path/to/menu.pdf",
  );
  process.exit(1);
}

const absPath = path.resolve(pdfPath);
if (!fs.existsSync(absPath)) {
  console.error(`File not found: ${absPath}`);
  process.exit(1);
}

console.log(`Reading ${path.basename(absPath)}...`);
const base64 = fs.readFileSync(absPath).toString("base64");

const SYSTEM = `You extract restaurant menu data from PDFs into structured JSON.
Output ONLY valid JSON — no markdown fences, no commentary, no trailing text.

Required shape:
{
  "name": "<menu name, e.g. 'Spring 2026'>",
  "slug": "<url-safe slug, e.g. 'spring-2026'>",
  "footer_note": "<fine-print at the bottom of the menu, or empty string>",
  "sections": [
    {
      "title": "<section heading>",
      "items": [
        {
          "name": "<dish name>",
          "price": "<price as string, e.g. '28' or '4 ea', no dollar sign>",
          "description": "<ingredients, using · as separator, e.g. 'Parsnip crème · blistered grape · tender herbs', or empty string>",
          "note": "<any fine-print note on the item, e.g. 'contains nuts' or 'GF available', or empty string>"
        }
      ]
    }
  ]
}

Rules:
- Preserve section order and item order exactly as they appear in the PDF
- Use · (middle dot U+00B7) as the separator between description elements
- Strip the $ from prices; keep modifiers like 'ea' or 'per person'
- If a dish has a parenthetical or fine-print note separate from the description, put it in "note"
- If no footer note is present, use an empty string
- Output only the JSON object`;

console.log("Sending to Claude API...");

const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 8096,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64,
            },
          },
          {
            type: "text",
            text: "Extract all menu sections and items from this PDF into the JSON format described.",
          },
        ],
      },
    ],
  }),
});

if (!response.ok) {
  console.error(`API error ${response.status}: ${await response.text()}`);
  process.exit(1);
}

const result = await response.json();
const raw = result.content?.[0]?.text?.trim() ?? "";

let menu;
try {
  menu = JSON.parse(raw);
} catch {
  console.error(
    "Claude returned non-JSON. Raw output saved to menu-raw.txt for inspection.",
  );
  fs.writeFileSync(path.join(__dirname, "menu-raw.txt"), raw);
  process.exit(1);
}

const outPath = path.join(__dirname, "menu.json");
fs.writeFileSync(outPath, JSON.stringify(menu, null, 2));

const itemCount = (menu.sections ?? []).reduce(
  (n, s) => n + (s.items?.length ?? 0),
  0,
);
console.log(`\n✓ Wrote ${outPath}`);
console.log(`  ${menu.sections?.length ?? 0} sections, ${itemCount} items`);
console.log("\nReview menu.json, then run:");
console.log(
  "  SANITY_PROJECT_ID=xxx SANITY_API_TOKEN=xxx node sanity-seed/seed-menu.mjs",
);
