# Urban Hearth

Restaurant website for Urban Hearth, built with Astro and Sanity.

## Typography

The brand guide (see `docs/Urban_Hearth_Brand_Guide.pdf`) specifies three typefaces. All are licensed. Notes on substitutions:

| Role                   | Brand Guide Specifies  | Implementation                                      | Notes                                                                                                                                                                                                |
| :--------------------- | :--------------------- | :-------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Display headlines      | Contax Sans 35         | Contax Sans 35 (`--font-headline`)                  | Exact match. Used for page titles and short section headings only — not for multi-sentence text.                                                                                                     |
| Section headers / CTAs | Basic Commercial       | Akzidenz Grotesk W1G Light (`--font-header-action`) | Basic Commercial is Linotype's licensed name for Akzidenz-Grotesk. Same typeface; renamed for trademark reasons.                                                                                     |
| Body copy              | Cardinal Classic Short | Cormorant Garamond (`--font-body`)                  | Cardinal Classic Short is cost-prohibitive. Cormorant Garamond is a close visual substitute — both are elegant, light-weight modernized serifs. Replace if Cardinal Classic Short becomes available. |

Font files live in `src/assets/fonts/`. Cormorant Garamond is loaded from Google Fonts in `src/styles/global.css`.

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
