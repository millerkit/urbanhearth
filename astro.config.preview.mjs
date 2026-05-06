// @ts-check
// Preview-environment config: SSR via Cloudflare Workers, draft Storyblok content.
// Build with: pnpm build:preview
// Deploy with: pnpm deploy:preview
import { storyblok } from '@storyblok/astro';
import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';
import { readFileSync } from 'fs';

// Vite resolves the config file before loading .env files, so
// process.env.STORYBLOK_TOKEN is not yet populated from .env.local at this
// point. Read the file directly — the same approach used in astro.config.mjs.
function getToken() {
  if (process.env.STORYBLOK_TOKEN) return process.env.STORYBLOK_TOKEN;
  try {
    const content = readFileSync(new URL('.env.local', import.meta.url), 'utf-8');
    return content.match(/^STORYBLOK_TOKEN=(.+)$/m)?.[1]?.trim() ?? '';
  } catch {
    return '';
  }
}

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'passthrough',
  }),
  integrations: [
    storyblok({
      accessToken: getToken(),
      apiOptions: { region: 'eu' },
      components: {
        menu: 'storyblok/Menu',
        menuSection: 'storyblok/MenuSection',
        menuItem: 'storyblok/MenuItem',
      },
    }),
  ],
});
