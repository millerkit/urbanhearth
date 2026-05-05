// @ts-check
import { storyblok } from '@storyblok/astro';
import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';
import { readFileSync } from 'fs';

function getToken() {
  if (process.env.STORYBLOK_TOKEN) return process.env.STORYBLOK_TOKEN;
  try {
    const content = readFileSync(new URL('.env.local', import.meta.url), 'utf-8');
    return content.match(/^STORYBLOK_TOKEN=(.+)$/m)?.[1]?.trim() ?? '';
  } catch {
    return '';
  }
}

const token = getToken();
const isSSR = process.env.STORYBLOK_VERSION === 'draft';
const integrations = [];

if (token) {
  integrations.push(
    storyblok({
      accessToken: token,
      apiOptions: { region: 'eu' },
      components: {
        page: 'storyblok/Page',
        feature: 'storyblok/Feature',
      },
    }),
  );
}

export default defineConfig({
  output: isSSR ? 'server' : 'static',
  adapter: isSSR ? cloudflare() : undefined,
  integrations,
});
