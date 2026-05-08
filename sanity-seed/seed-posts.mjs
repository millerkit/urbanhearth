/**
 * seed-posts.mjs — posts.json → Sanity
 *
 * Usage:
 *   SANITY_PROJECT_ID=xxx SANITY_TOKEN=xxx node sanity-seed/seed-posts.mjs
 *
 * The token must have Editor (write) access.
 * Images are uploaded from sanity-seed/images/.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { Readable } from 'node:stream'
import { createClient } from '@sanity/client'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PROJECT_ID = process.env.SANITY_PROJECT_ID
const TOKEN      = process.env.SANITY_TOKEN
const DATASET    = process.env.SANITY_DATASET ?? 'production'

if (!PROJECT_ID || !TOKEN) {
  console.error('Missing SANITY_PROJECT_ID or SANITY_TOKEN')
  process.exit(1)
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: '2025-01-01',
  token: TOKEN,
  useCdn: false,
})

const posts = JSON.parse(fs.readFileSync(path.join(__dirname, 'posts.json'), 'utf8'))

// ── Image upload ─────────────────────────────────────────────────────────────

const uploadedImages = new Map()

async function uploadImage(filePath) {
  if (uploadedImages.has(filePath)) return uploadedImages.get(filePath)

  const absPath = path.join(__dirname, filePath)
  if (!fs.existsSync(absPath)) {
    console.warn(`  Image not found, skipping: ${filePath}`)
    return null
  }

  const filename = path.basename(filePath)
  console.log(`  Uploading image: ${filename}`)
  const asset = await client.assets.upload('image', fs.createReadStream(absPath), { filename })
  uploadedImages.set(filePath, asset._id)
  return asset._id
}

async function uploadImageFromUrl(url) {
  if (uploadedImages.has(url)) return uploadedImages.get(url)

  const filename = new URL(url).pathname.split('/').pop()?.split('~')[0] || 'image.jpg'
  console.log(`  Uploading from URL: ${filename}`)
  const res = await fetch(url)
  if (!res.ok) {
    console.warn(`  Failed to fetch image URL: ${url}`)
    return null
  }
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const stream = Readable.fromWeb(res.body)
  const asset = await client.assets.upload('image', stream, { filename, contentType })
  uploadedImages.set(url, asset._id)
  return asset._id
}

// ── Portable Text builder ─────────────────────────────────────────────────────

function span(text) {
  return { _type: 'span', _key: randomUUID(), text, marks: [] }
}

function block(style, text) {
  return { _type: 'block', _key: randomUUID(), style, children: [span(text)], markDefs: [] }
}

function bulletBlock(text) {
  return { _type: 'block', _key: randomUUID(), style: 'normal', listItem: 'bullet', level: 1, children: [span(text)], markDefs: [] }
}

async function buildBody(nodes) {
  const blocks = []
  for (const node of nodes) {
    if (node.type === 'paragraph') {
      blocks.push(block('normal', node.text))
    } else if (node.type === 'heading2') {
      blocks.push(block('h2', node.text))
    } else if (node.type === 'heading3') {
      blocks.push(block('h3', node.text))
    } else if (node.type === 'bullet_list') {
      for (const item of node.items) blocks.push(bulletBlock(item))
    } else if (node.type === 'image') {
      const assetId = node.url
        ? await uploadImageFromUrl(node.url)
        : await uploadImage(node.file)
      if (assetId) {
        blocks.push({
          _type: 'image',
          _key: randomUUID(),
          asset: { _type: 'reference', _ref: assetId },
          alt: node.alt ?? '',
        })
      }
    }
  }
  return blocks
}

// ── Seed ─────────────────────────────────────────────────────────────────────

for (const post of posts) {
  console.log(`\nProcessing: ${post.name}`)

  const coverAssetId = post.coverImageUrl
    ? await uploadImageFromUrl(post.coverImageUrl)
    : post.coverImage
      ? await uploadImage(post.coverImage)
      : null
  const body = await buildBody(post.body ?? [])

  const doc = {
    _type: 'blog_post',
    title: post.name,
    slug: { _type: 'slug', current: post.slug },
    publishedAt: post.publishedAt,
    excerpt: post.excerpt,
    ...(coverAssetId && {
      coverImage: { _type: 'image', asset: { _type: 'reference', _ref: coverAssetId } },
    }),
    body,
  }

  const existing = await client.fetch(
    `*[_type == "blog_post" && slug.current == $slug][0]._id`,
    { slug: post.slug }
  )

  if (existing) {
    await client.patch(existing).set(doc).commit()
    console.log(`  Updated: ${post.slug}`)
  } else {
    await client.create(doc)
    console.log(`  Created: ${post.slug}`)
  }
}

console.log('\nDone.')
