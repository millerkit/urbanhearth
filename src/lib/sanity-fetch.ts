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
      useCdn: false,
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

export async function fetchProductPrices(
  slugs: string[],
): Promise<
  { slug: string; name: string; price: number; available: boolean }[]
> {
  const products = await client!.fetch(
    `*[_type == "product" && slug.current in $slugs]{
      "slug": slug.current,
      name,
      price,
      available
    }`,
    { slugs },
  );
  return products ?? [];
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

export async function fetchDiningOptions() {
  const options = await client!.fetch(`
    *[_type == "diningOption"] | order(order asc){
      order,
      number,
      label,
      title,
      "id": id.current,
      dark,
      "photo": photo.asset->url,
      photoAlt,
      "photoSecondary": photoSecondary.asset->url,
      photoSecondaryAlt,
      description,
      details[]{ label, value, linkType },
      ctaLabel,
      phoneReserve
    }
  `);
  return options ?? [];
}

export async function fetchReservationExperiences() {
  const experiences = await client!.fetch(`
    *[_type == "reservationExperience"] | order(order asc){
      order,
      number,
      eyebrow,
      title,
      "id": id.current,
      description,
      details[]{ label, value, linkType },
      note
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
      teasersEyebrow,
      diningTeasers[]{ areaId, "photo": photo.asset->url, photoAlt }
    }
  `);
}

export async function fetchFarms() {
  const doc = await client!.fetch(`
    *[_type == "partners"][0]{ items[]{ name, location } }
  `);
  return (doc?.items ?? []) as { name: string; location: string }[];
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

export async function fetchPrivateEventsPage() {
  return client!.fetch(`
    *[_type == "largePartyPage"][0]{
      capacityStats[]{ value, label }
    }
  `);
}

export async function fetchPrivateEventPackages() {
  const packages = await client!.fetch(`
    *[_type == "large_party_package"] | order(order asc){
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

export async function fetchAboutPage() {
  return client!.fetch(`*[_type == "aboutPage"][0]{ statement, farmsIntro }`);
}

export async function fetchMenusPage() {
  return client!.fetch(
    `*[_type == "menusPage"][0]{ accuracyNote, walkInsNote }`,
  );
}

export async function fetchChefsCounter() {
  return client!.fetch(`
    *[_type == "diningOption" && id.current == "chefs-counter"][0]{
      "eyebrow": label,
      "priceDisplay": details[label == "Price"][0].value,
      "description": description[0],
      "pairingsLabel": details[label == "Pairings"][0].label,
      "pairingsValue": details[label == "Pairings"][0].value,
      finePrint
    }
  `);
}

export async function fetchNavLinks() {
  const doc = await client!.fetch(`
    *[_type == "navLinks"][0]{
      links[]{ label, href, hidden, children[]{ label, href } }
    }
  `);
  return (doc?.links ?? []) as {
    label: string;
    href?: string;
    hidden?: boolean;
    children?: { label: string; href: string }[];
  }[];
}

export async function fetchFooterLinks() {
  const doc = await client!.fetch(`
    *[_type == "footerLinks"][0]{
      secondaryLinks[]{ label, href },
      legalLinks[]{ label, href }
    }
  `);
  return doc as {
    secondaryLinks: { label: string; href: string }[];
    legalLinks: { label: string; href: string }[];
  } | null;
}

export async function fetchReservationsPage() {
  return client!.fetch(
    `*[_type == "reservationsPage"][0]{ pageTitle, pageLead, seoDescription, bookingUrl }`,
  );
}

export async function fetchTeamPage() {
  return client!.fetch(
    `*[_type == "teamPage"][0]{ pageTitle, pageLead, seoDescription, chefLinkText }`,
  );
}

export async function fetchMailingListPage() {
  return client!.fetch(`
    *[_type == "mailingListPage"][0]{
      eyebrow, pageTitle, pageLead, seoDescription,
      submitLabel, successEyebrow, successMessage
    }
  `);
}

export async function fetchFaq() {
  return client!.fetch<
    { question: string; answer: string; mapUrl?: string }[]
  >(`
    *[_type == "faqItem"] | order(order asc){ question, answer, mapUrl }
  `);
}
