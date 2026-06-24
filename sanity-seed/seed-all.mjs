/**
 * seed-all.mjs — Run all Sanity seed scripts in sequence
 *
 * Usage:
 *   node --env-file=.env.local sanity-seed/seed-all.mjs
 *
 * Skips audit.mjs, extract-menu.mjs, and seed-posts.mjs (manual/read-only).
 */

import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const scripts = [
  "seed-site-settings.mjs",
  "seed-nav-links.mjs",
  "seed-footer-links.mjs",
  "seed-homepage.mjs",
  "seed-dining-options.mjs",
  "seed-menu.mjs",
  "seed-menus-page.mjs",
  "seed-reservations.mjs",
  "seed-reservations-page.mjs",
  "seed-chef.mjs",
  "seed-team.mjs",
  "seed-team-page.mjs",
  "seed-farms.mjs",
  "seed-gallery.mjs",
  "seed-large-party.mjs",
  "seed-about-page.mjs",
  "seed-mailing-list-page.mjs",
  "seed-faq.mjs",
];

for (const script of scripts) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`▶  ${script}`);
  console.log("─".repeat(60));
  execSync(`node --env-file=.env.local ${join(__dirname, script)}`, {
    stdio: "inherit",
  });
}

console.log(`\n${"─".repeat(60)}`);
console.log("✓  All seed scripts complete.");
console.log("─".repeat(60));
