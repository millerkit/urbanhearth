/**
 * sync-toast.mjs — Toast "Online Ordering" menu → Sanity products
 *
 * Usage:
 *   node --env-file=.env.local scripts/sync-toast.mjs
 *
 * Or explicitly:
 *   TOAST_CLIENT_ID=xxx TOAST_CLIENT_SECRET=xxx TOAST_RESTAURANT_GUID=xxx \
 *   SANITY_PROJECT_ID=xxx SANITY_TOKEN=xxx node scripts/sync-toast.mjs
 *
 * The Sanity token must have Editor (write) access.
 * Products are matched by toastItemGuid and upserted — safe to re-run.
 * Fields managed in Sanity (longDescription, category, image) are never overwritten.
 *
 * All items from the SYNC_MENU_NAME menu are synced, preserving the group
 * structure so the storefront can display groups with their descriptions.
 */

import { config } from "dotenv";
import { createClient } from "@sanity/client";

config({ path: ".env.local" });

const TOAST_BASE_URL = "https://ws-api.toasttab.com";

// Name of the Toast menu to sync. Must match exactly.
const SYNC_MENU_NAME = "Online Ordering";

const TOAST_CLIENT_ID = process.env.TOAST_CLIENT_ID;
const TOAST_CLIENT_SECRET = process.env.TOAST_CLIENT_SECRET;
const TOAST_RESTAURANT_GUID = process.env.TOAST_RESTAURANT_GUID;
const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID;
const SANITY_TOKEN = process.env.SANITY_TOKEN;
const SANITY_DATASET = process.env.SANITY_DATASET ?? "production";

for (const [key, val] of Object.entries({
  TOAST_CLIENT_ID,
  TOAST_CLIENT_SECRET,
  TOAST_RESTAURANT_GUID,
  SANITY_PROJECT_ID,
  SANITY_TOKEN,
})) {
  if (!val) {
    console.error(`Missing ${key}`);
    process.exit(1);
  }
}

// ── Sanity client ────────────────────────────────────────────────────────────

const sanity = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  token: SANITY_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

// ── Toast helpers ────────────────────────────────────────────────────────────

async function toastFetch(path, token) {
  const res = await fetch(`${TOAST_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Toast-Restaurant-External-ID": TOAST_RESTAURANT_GUID,
    },
  });
  if (!res.ok)
    throw new Error(`Toast API ${path} → ${res.status} ${res.statusText}`);
  return res.json();
}

async function getToastToken() {
  const res = await fetch(
    `${TOAST_BASE_URL}/authentication/v1/authentication/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: TOAST_CLIENT_ID,
        clientSecret: TOAST_CLIENT_SECRET,
        userAccessType: "TOAST_MACHINE_CLIENT",
      }),
    },
  );
  if (!res.ok)
    throw new Error(`Toast auth failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.token.accessToken;
}

// ── Collect items from a group and its subgroups ──────────────────────────────

function collectGroupItems(group) {
  const items = (group.menuItems ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  for (const subgroup of group.menuGroups ?? []) {
    items.push(...collectGroupItems(subgroup));
  }
  return items;
}

// ── Slug ─────────────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Authenticating with Toast...");
  const token = await getToastToken();

  console.log("Fetching menus...");
  const data = await toastFetch("/menus/v2/menus", token);
  const menus = data.menus ?? [];

  const menu = menus.find((m) => m.name === SYNC_MENU_NAME);
  if (!menu) {
    const names = menus.map((m) => `"${m.name}"`).join(", ");
    console.error(
      `Menu "${SYNC_MENU_NAME}" not found. Available menus: ${names}`,
    );
    process.exit(1);
  }

  console.log(
    `Found menu: "${menu.name}" (${(menu.menuGroups ?? []).length} groups)`,
  );

  // Modifier groups are included in the top-level response
  const modifierGroupRefs = data.modifierGroupReferences ?? [];
  const modifierGroupMap = Array.isArray(modifierGroupRefs)
    ? new Map(modifierGroupRefs.map((g) => [g.guid, g]))
    : new Map(Object.entries(modifierGroupRefs));

  // ── Collect all items grouped by their menu group ─────────────────────────

  const groups = menu.menuGroups ?? [];
  let totalItems = 0;

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
    const group = groups[groupIndex];
    const items = collectGroupItems(group);
    totalItems += items.length;

    console.log(
      `  Group ${groupIndex + 1}: "${group.name}" — ${items.length} item(s)`,
    );

    for (const item of items) {
      const docId = `product-${item.guid}`;

      const modifierGroups = (item.modifierGroupReferences ?? [])
        .map((ref) => {
          const g = modifierGroupMap.get(ref.guid);
          if (!g) return null;
          return {
            _type: "modifierGroup",
            _key: g.guid,
            name: g.name,
            toastGuid: g.guid,
            minSelections: ref.minSelections ?? 0,
            maxSelections: ref.maxSelections ?? 1,
            modifiers: (g.modifiers ?? g.menuItemModifierOptions ?? []).map(
              (m) => ({
                _type: "modifier",
                _key: m.guid,
                name: m.name,
                price: m.price ?? 0,
                toastGuid: m.guid,
              }),
            ),
          };
        })
        .filter(Boolean);

      const existing = await sanity.fetch(
        `*[_type == "product" && toastItemGuid == $guid][0]{ _id }`,
        { guid: item.guid },
      );

      // Fields synced from Toast on every run
      const toastFields = {
        name: item.name,
        price: item.price ?? 0,
        description: item.description ?? "",
        available: !item.isDeferred,
        toastItemGuid: item.guid,
        toastGroupGuid: group.guid,
        toastGroupName: group.name,
        toastGroupDescription: group.description ?? "",
        toastGroupIndex: groupIndex,
        toastSortOrder: item.sortOrder ?? 0,
        modifierGroups,
      };

      if (existing) {
        await sanity.patch(existing._id).set(toastFields).commit();
        console.log(`    Updated: ${item.name}`);
      } else {
        await sanity.create({
          _type: "product",
          _id: docId,
          slug: { _type: "slug", current: slugify(item.name) },
          ...toastFields,
        });
        console.log(`    Created: ${item.name}`);
      }
    }
  }

  console.log(
    `\nDone. ${totalItems} item(s) across ${groups.length} group(s).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
