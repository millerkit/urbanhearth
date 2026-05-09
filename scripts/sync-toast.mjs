/**
 * sync-toast.mjs — Toast "Retail" menu group → Sanity products
 *
 * Usage:
 *   TOAST_CLIENT_ID=xxx TOAST_CLIENT_SECRET=xxx TOAST_RESTAURANT_GUID=xxx \
 *   SANITY_PROJECT_ID=xxx SANITY_TOKEN=xxx node scripts/sync-toast.mjs
 *
 * Or with Node 22's --env-file flag:
 *   node --env-file=.env.local scripts/sync-toast.mjs
 *
 * The Sanity token must have Editor (write) access.
 * Products are matched by toastItemGuid and upserted — safe to re-run.
 * Fields managed in Sanity (longDescription, category, image) are never overwritten.
 */

import { createClient } from '@sanity/client'

const TOAST_BASE_URL  = 'https://ws-api.toasttab.com'
const RETAIL_GROUP    = 'Retail' // must match the menu group name in Toast exactly

const TOAST_CLIENT_ID     = process.env.TOAST_CLIENT_ID
const TOAST_CLIENT_SECRET = process.env.TOAST_CLIENT_SECRET
const TOAST_RESTAURANT_GUID = process.env.TOAST_RESTAURANT_GUID
const SANITY_PROJECT_ID   = process.env.SANITY_PROJECT_ID
const SANITY_TOKEN        = process.env.SANITY_TOKEN
const SANITY_DATASET      = process.env.SANITY_DATASET ?? 'production'

for (const [key, val] of Object.entries({
  TOAST_CLIENT_ID, TOAST_CLIENT_SECRET, TOAST_RESTAURANT_GUID,
  SANITY_PROJECT_ID, SANITY_TOKEN
})) {
  if (!val) { console.error(`Missing ${key}`); process.exit(1) }
}

// ── Sanity client ────────────────────────────────────────────────────────────

const sanity = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  token: SANITY_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false
})

// ── Toast helpers ────────────────────────────────────────────────────────────

async function toastFetch(path, token) {
  const res = await fetch(`${TOAST_BASE_URL}${path}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Toast-Restaurant-External-ID': TOAST_RESTAURANT_GUID
    }
  })
  if (!res.ok) throw new Error(`Toast API ${path} → ${res.status} ${res.statusText}`)
  return res.json()
}

async function getToastToken() {
  const res = await fetch(`${TOAST_BASE_URL}/authentication/v1/authentication/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: TOAST_CLIENT_ID,
      clientSecret: TOAST_CLIENT_SECRET,
      userAccessType: 'TOAST_MACHINE_CLIENT'
    })
  })
  if (!res.ok) throw new Error(`Toast auth failed: ${res.status} ${res.statusText}`)
  const data = await res.json()
  return data.token.accessToken
}

// ── Slug ─────────────────────────────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Authenticating with Toast...')
  const token = await getToastToken()

  console.log('Fetching menus...')
  const menus = await toastFetch('/menus/v2/menus', token)

  // Collect all items from groups named "Retail" across all menus
  const retailItems = []
  for (const menu of menus) {
    for (const group of menu.groups ?? []) {
      if (group.name === RETAIL_GROUP) {
        retailItems.push(...(group.items ?? []))
      }
    }
  }

  if (retailItems.length === 0) {
    console.warn(`No items found in a menu group named "${RETAIL_GROUP}". Check Toast setup.`)
    process.exit(0)
  }

  console.log(`Found ${retailItems.length} retail item(s).`)

  console.log('Fetching modifier groups...')
  const modifierGroupsRaw = await toastFetch('/menus/v2/modifierGroups', token)
  const modifierGroupMap = new Map(modifierGroupsRaw.map(g => [g.guid, g]))

  // ── Build and upsert Sanity documents ──────────────────────────────────────

  let created = 0, updated = 0

  for (const item of retailItems) {
    const docId = `product-${item.guid}`

    // Resolve modifier groups from their references
    const modifierGroups = (item.modifierGroupReferences ?? [])
      .map(ref => {
        const group = modifierGroupMap.get(ref.guid)
        if (!group) return null
        return {
          _type: 'modifierGroup',
          _key: group.guid,
          name: group.name,
          toastGuid: group.guid,
          minSelections: ref.minSelections ?? 0,
          maxSelections: ref.maxSelections ?? 1,
          modifiers: (group.modifiers ?? []).map(m => ({
            _type: 'modifier',
            _key: m.guid,
            name: m.name,
            price: m.price ?? 0,
            toastGuid: m.guid
          }))
        }
      })
      .filter(Boolean)

    // Check if this product already exists in Sanity
    const existing = await sanity.fetch(`*[_type == "product" && toastItemGuid == $guid][0]{ _id }`, { guid: item.guid })

    // Fields synced from Toast on every run
    const toastFields = {
      name: item.name,
      price: item.price ?? 0,
      description: item.description ?? '',
      available: !item.outOfStock,
      toastItemGuid: item.guid,
      modifierGroups
    }

    if (existing) {
      // Patch only Toast-owned fields — never touch longDescription, category, image
      await sanity.patch(existing._id).set(toastFields).commit()
      console.log(`  Updated: ${item.name}`)
      updated++
    } else {
      // Create with a stable, deterministic ID
      await sanity.create({
        _type: 'product',
        _id: docId,
        slug: { _type: 'slug', current: slugify(item.name) },
        ...toastFields
      })
      console.log(`  Created: ${item.name}`)
      created++
    }
  }

  console.log(`\nDone. ${created} created, ${updated} updated.`)
}

main().catch(err => { console.error(err); process.exit(1) })
