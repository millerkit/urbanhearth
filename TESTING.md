# Testing routing & infra changes

`astro dev` does not reproduce Cloudflare's own behavior — specifically its
static-asset serving layer, which has its own default trailing-slash/redirect
handling independent of anything Astro does. On 2026-07-03 a `trailingSlash`
and `_redirects` change looked correct locally but caused a live redirect
loop on `/menus` (and broke the entire top nav) because the SSR worker's
redirect logic and Cloudflare's asset-layer default fought each other in
production. Use this checklist for anything touching routing, redirects, or
Cloudflare config.

## 1. Local — real Worker runtime (fast, no deploy)

`astro dev` skips Cloudflare entirely. To catch conflicts with Cloudflare's
own routing/asset behavior, build the actual production bundle and run it
under `wrangler dev`, which executes the real Worker runtime:

```
pnpm build
cd dist/server && npx wrangler dev --config wrangler.json
```

Then click or `curl` through routes that matter, especially any that
redirect (`/menus`, trailing-slash variants, etc). Watch for redirect loops
or unexpected status codes.

This step runs automatically as a pre-push hook (`.githooks/pre-push`)
whenever a push touches `astro.config*.mjs`, `wrangler.toml`,
`public/_redirects`, `scripts/bundle-worker.mjs`,
`scripts/fix-preview-wrangler.mjs`, or anything under `src/pages/`. It smoke
tests every top-nav and footer destination, not just the files in the diff —
that's what caught us out last time, since `/menus` wasn't part of the
changed diff but broke anyway. Bypass in an emergency with
`git push --no-verify`, but treat that as a signal to test manually before
merging.

Note: `wrangler pages dev` currently hits an unrelated local sandbox bug
(`No such module "wrangler:modules-watch"`) in this environment — use
`wrangler dev` against `dist/server/wrangler.json` instead, which works and
exercises the same routing code.

## 2. Preview — real Cloudflare deployment, before merging

The preview environment (`urbanhearth-preview.kmillercc.workers.dev`) is a
genuine Cloudflare Worker deployment, not just a local simulation. Deploy to
it manually from your branch, without touching `main`:

```
pnpm deploy:preview
```

Then click through the site for real: every top-nav link, both with and
without a trailing slash on a few routes, and anything your change touches
directly.

**Important:** per the README, both preview (GitHub Actions) and production
(Cloudflare Pages) auto-deploy on push to `main` — they fire from the same
event, not sequentially. Pushing to `main` does **not** give you a safe
"check preview first" window. Do all verification on a branch, using
`pnpm deploy:preview`, before merging.

## 3. Merge

Only merge to `main` once step 2 looks right on the real preview deployment.
