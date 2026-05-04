// @ts-check
import { defineConfig } from 'astro/config';

const integrations = [];

if (process.env.STORYBLOK_TOKEN) {
  const { default: storyblok } = await import('@storyblok/astro');
  integrations.push(
    storyblok({
      accessToken: process.env.STORYBLOK_TOKEN,
      components: {},
    })
  );
}

export default defineConfig({ integrations });
