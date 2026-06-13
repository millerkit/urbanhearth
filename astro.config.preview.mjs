// @ts-check
// Preview-environment config: SSR via Cloudflare Workers, Sanity draft content.
// Build with: pnpm build:preview
// Deploy with: pnpm deploy:preview
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    imageService: "passthrough",
  }),
  integrations: [react()],
});
