import { createClient } from '@sanity/client';
import { toHTML } from '@portabletext/to-html';

const isPreview = import.meta.env.SANITY_PREVIEW === 'true';

// Client is only created when projectId is available; the isSanityConfigured
// guard in each page prevents calls when it isn't.
const client = import.meta.env.SANITY_PROJECT_ID
  ? createClient({
      projectId: import.meta.env.SANITY_PROJECT_ID,
      dataset: import.meta.env.SANITY_DATASET ?? 'production',
      apiVersion: '2025-01-01',
      useCdn: !isPreview && !import.meta.env.DEV,
      perspective: isPreview ? 'previewDrafts' : 'published',
      token: isPreview ? import.meta.env.SANITY_API_TOKEN : undefined,
    })
  : null;

export async function fetchMenu() {
  return client!.fetch(`
    *[_type == "menu"] | order(_updatedAt desc) [0]{
      season,
      footer_note,
      sections[]{
        _key,
        title,
        items[]{ _key, name, price, description, note }
      }
    }
  `);
}

export async function fetchAllPosts() {
  const posts = await client!.fetch(`
    *[_type == "blog_post"] | order(publishedAt desc){
      title,
      "slug": slug.current,
      publishedAt,
      excerpt,
      "coverImage": coverImage.asset->url
    }
  `);
  return posts ?? [];
}

export async function fetchPostBySlug(slug: string) {
  const post = await client!.fetch(
    `*[_type == "blog_post" && slug.current == $slug][0]{
      title,
      publishedAt,
      excerpt,
      "coverImage": coverImage.asset->url,
      body[]{
        ...,
        _type == "image" => { ..., "url": asset->url }
      }
    }`,
    { slug }
  );
  if (!post) return null;
  return {
    ...post,
    body: post.body
      ? toHTML(post.body, {
          components: {
            types: {
              image: ({ value }: any) =>
                `<img src="${value.url ?? ''}" alt="${value.alt ?? ''}" />`,
            },
          },
        })
      : '',
  };
}

export async function fetchAllPostSlugs(): Promise<string[]> {
  const slugs = await client!.fetch(
    `*[_type == "blog_post"].slug.current`
  );
  return slugs ?? [];
}
