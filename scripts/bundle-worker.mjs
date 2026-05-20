/**
 * bundle-worker.mjs
 *
 * Post-build step for Cloudflare Pages deployments.
 *
 * @astrojs/cloudflare v13 changed its output format: the SSR Worker is emitted
 * as dist/server/entry.mjs (+ chunks), not the old dist/_worker.js single file.
 * Cloudflare Pages only picks up a Worker from _worker.js in the static output
 * directory, so we bundle everything into dist/client/_worker.js here.
 *
 * Build command in Cloudflare Pages:
 *   astro build && node scripts/bundle-worker.mjs
 */

import { build } from "esbuild";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const entry = resolve(root, "dist/server/entry.mjs");
const out = resolve(root, "dist/client/_worker.js");

if (!existsSync(entry)) {
  console.error(
    "bundle-worker: dist/server/entry.mjs not found — run astro build first.",
  );
  process.exit(1);
}

console.log("bundle-worker: bundling SSR Worker into dist/client/_worker.js …");

await build({
  entryPoints: [entry],
  bundle: true,
  outfile: out,
  format: "esm",
  platform: "neutral",
  // Cloudflare and Node compat modules are provided by the runtime.
  // node:* requires the nodejs_compat compatibility flag in the Pages project.
  external: ["cloudflare:*", "node:*"],
  minify: true,
  logLevel: "info",
});

console.log("bundle-worker: done.");
