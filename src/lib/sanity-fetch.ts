import { createClient } from "@sanity/client";
import { toHTML } from "@portabletext/to-html";

const isPreview = import.meta.env.SANITY_PREVIEW === "true";

// Client is only created when projectId is available; the isSanityConfigured
// guard in each page prevents calls when it isn't.
const client = import.meta.env.SANITY_PROJECT_ID
  ? createClient({
      projectId: import.meta.env.SANITY_PROJECT_ID,
      dataset: import.meta.env.SANITY_DATASET ?? "production",
      apiVersion: "2025-01-01",
      useCdn: !isPreview && !import.meta.env.DEV,
      perspective: isPreview ? "previewDrafts" : "published",
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

export async function fetchAllPosts(page = 1, perPage = 10) {
  const start = (page - 1) * perPage;
  const end = start + perPage - 1;
  const [posts, total] = await Promise.all([
    client!.fetch(`
      *[_type == "blog_post"] | order(publishedAt desc) [${start}..${end}]{
        title,
        "slug": slug.current,
        publishedAt,
        excerpt,
        "coverImage": coverImage.asset->url
      }
    `),
    client!.fetch(`count(*[_type == "blog_post"])`),
  ]);
  return {
    posts: (posts ?? []) as any[],
    totalPages: Math.ceil((total ?? 0) / perPage),
  };
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
    { slug },
  );
  if (!post) return null;
  return {
    ...post,
    body: post.body
      ? toHTML(post.body, {
          components: {
            types: {
              image: ({ value }: any) =>
                value.caption
                  ? `<figure><img src="${value.url ?? ""}" alt="${value.alt ?? ""}" /><figcaption>${value.caption}</figcaption></figure>`
                  : `<img src="${value.url ?? ""}" alt="${value.alt ?? ""}" />`,
            },
          },
        })
      : "",
  };
}

export async function fetchAllPostSlugs(): Promise<string[]> {
  const slugs = await client!.fetch(`*[_type == "blog_post"].slug.current`);
  return slugs ?? [];
}

export async function fetchAllProducts() {
  const products = await client!.fetch(`
    *[_type == "product"] | order(toastGroupIndex asc, toastSortOrder asc){
      name,
      "slug": slug.current,
      price,
      description,
      available,
      "image": image.asset->url,
      toastGroupGuid,
      toastGroupName,
      toastGroupDescription
    }
  `);
  return (products ?? []) as any[];
}

export async function fetchProductBySlug(slug: string) {
  const product = await client!.fetch(
    `*[_type == "product" && slug.current == $slug][0]{
      name,
      "slug": slug.current,
      category,
      price,
      description,
      longDescription[]{
        ...
      },
      available,
      "image": image.asset->url,
      modifierGroups[]{
        name, toastGuid, minSelections, maxSelections,
        modifiers[]{ name, price, toastGuid }
      }
    }`,
    { slug },
  );
  if (!product) return null;
  return {
    ...product,
    longDescriptionHtml: product.longDescription
      ? toHTML(product.longDescription)
      : "",
  };
}

export async function fetchAllProductSlugs(): Promise<string[]> {
  const slugs = await client!.fetch(`*[_type == "product"].slug.current`);
  return slugs ?? [];
}

export async function fetchTeamMembers() {
  const members = await client!.fetch(`
    *[_type == "teamMember"] | order(order asc){
      name,
      roles,
      bio,
      "photo": photo.asset->url,
      order
    }
  `);
  return (members ?? []) as any[];
}

export async function fetchDiningAreas() {
  const areas = await client!.fetch(`
    *[_type == "diningArea"] | order(order asc){
      order,
      number,
      label,
      title,
      "id": id.current,
      dark,
      "photo": photo.asset->url,
      photoAlt,
      description,
      details[]{ label, value, linkType },
      ctaLabel,
      phoneReserve
    }
  `);
  return areas ?? [];
}

export async function fetchReservationExperiences() {
  const experiences = await client!.fetch(`
    *[_type == "reservationExperience"] | order(order asc){
      order,
      number,
      eyebrow,
      title,
      "id": id.current,
      theme,
      description,
      details[]{ label, value, linkType },
      note,
      bookingLabel,
      otWidgetSrc,
      phoneReserve
    }
  `);
  return experiences ?? [];
}

export async function fetchGalleryPhotos() {
  const photos = await client!.fetch(`
    *[_type == "galleryPhoto"] | order(order asc){
      order,
      "photo": photo.asset->url,
      alt,
      span
    }
  `);
  return photos ?? [];
}

export async function fetchHomepageContent() {
  return client!.fetch(`
    *[_type == "homepageContent"][0]{
      statement{ eyebrow, tags, definitionTerm, definitionText, description },
      intro{ eyebrow, paragraphs }
    }
  `);
}

export async function fetchFarms() {
  const farms = await client!.fetch(`
    *[_type == "farm"] | order(order asc){ name, location, order }
  `);
  return farms ?? [];
}

export async function fetchChefProfile() {
  return client!.fetch(`
    *[_type == "chefProfile"][0]{
      name,
      title,
      roles,
      bio,
      "photo": photo.asset->url,
      accolades[]{ year, text }
    }
  `);
}

export async function fetchSiteSettings() {
  return client!.fetch(`
    *[_type == "siteSettings"][0]{
      name,
      tagline,
      url,
      address,
      phone,
      hours,
      privateDiningEmail,
      reservations{ label, shortLabel, href },
      social{ instagram, facebook }
    }
  `);
}

export async function fetchPrivateEventPackages() {
  const packages = await client!.fetch(`
    *[_type == "private_event_package"] | order(order asc){
      _id,
      order,
      eyebrow,
      title,
      description,
      details[]{ label, value },
      note,
      dark
    }
  `);
  return packages ?? [];
}
