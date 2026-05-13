# Urban Hearth

Restaurant website for Urban Hearth, built with Astro and Sanity.

## Development

```sh
pnpm install       # Install dependencies
pnpm dev           # Start local dev server at localhost:4321
pnpm build         # Build production site to ./dist/
pnpm sanity:dev    # Start Sanity Studio
```

## Environments

| Environment    | URL                                         | How it deploys                                                   |
| :------------- | :------------------------------------------ | :--------------------------------------------------------------- |
| **Production** | `urbanhearth.pages.dev`                     | Cloudflare Pages — auto-deploys on push to `main`                |
| **Preview**    | `urbanhearth-preview.kmillercc.workers.dev` | Cloudflare Worker — deploys via GitHub Actions on push to `main` |

**Production** is a static build (`astro.config.mjs`) that fetches Sanity content at build time.

**Preview** is an SSR build (`astro.config.preview.mjs`) that fetches Sanity draft content at request time. To deploy manually: `pnpm deploy:preview`.

## Environment Variables

### Production (Cloudflare Pages build settings)

- `SANITY_PROJECT_ID` — Sanity project ID
- `SANITY_DATASET` — `production`
- `NODE_VERSION` — `22.15.0`

### Preview (GitHub Actions secrets)

- `SANITY_PROJECT_ID`
- `SANITY_API_TOKEN`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### Github Workflow Sync with Toast for Retail Products Page (GitHub Actions secrets)

- `SANITY_PROJECT_ID` — same as above
- `SANITY_API_TOKEN` — same as above
- `TOAST_CLIENT_ID`
- `TOAST_CLIENT_SECRET`
- `TOAST_RESTAURANT_GUID`
