// @ts-check
// Preview-environment config: SSR via Cloudflare Workers, draft Storyblok content.
// Build with: pnpm build:preview
// Deploy with: pnpm deploy:preview
import { storyblok } from '@storyblok/astro';
import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'passthrough',
  }),
  integrations: [
    storyblok({
      accessToken: process.env.STORYBLOK_TOKEN,
      apiOptions: { region: 'eu' },
      components: {
        menu: 'storyblok/Menu',
        menuSection: 'storyblok/MenuSection',
        menuItem: 'storyblok/MenuItem',
      },
    }),
  ],
});
