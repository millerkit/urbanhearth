// Strips the auto-generated SESSION KV binding from the preview Worker config.
// @astrojs/cloudflare v13 adds this binding unconditionally for SSR builds,
// but this site doesn't use server-side sessions and the binding requires a
// provisioned KV namespace ID to deploy successfully.
import { readFileSync, writeFileSync } from "fs";

const path = "dist/server/wrangler.json";
const config = JSON.parse(readFileSync(path, "utf-8"));

config.kv_namespaces = (config.kv_namespaces ?? []).filter(
  (ns) => ns.binding !== "SESSION",
);
if (config.previews?.kv_namespaces) {
  config.previews.kv_namespaces = config.previews.kv_namespaces.filter(
    (ns) => ns.binding !== "SESSION",
  );
}

writeFileSync(path, JSON.stringify(config, null, 2));
console.log("✓ Removed SESSION KV binding from dist/server/wrangler.json");
