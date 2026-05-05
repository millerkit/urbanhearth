import { useStoryblokApi } from '@storyblok/astro';
import { renderRichText } from '@storyblok/astro';

const sbVersion = (import.meta.env.STORYBLOK_VERSION ?? (import.meta.env.DEV ? 'draft' : 'published')) as 'draft' | 'published';

export async function fetchMenu() {
  const api = useStoryblokApi();
  const { data } = await api.get('cdn/stories/menu', { version: sbVersion });
  return data.story?.content ?? null;
}

export async function fetchAllPosts() {
  const api = useStoryblokApi();
  const { data } = await api.get('cdn/stories', {
    version: 'published',
    starts_with: 'happenings/',
    sort_by: 'content.publishedAt:desc',
  });
  return (data.stories ?? []).map((s: any) => ({
    title: s.content.title,
    slug: s.slug,
    publishedAt: s.content.publishedAt,
    excerpt: s.content.excerpt,
    coverImage: s.content.coverImage?.filename ?? null,
  }));
}

export async function fetchPostBySlug(slug: string) {
  const api = useStoryblokApi();
  const { data } = await api.get(`cdn/stories/happenings/${slug}`, { version: 'published' });
  const c = data.story?.content;
  if (!c) return null;
  return {
    title: c.title,
    publishedAt: c.publishedAt,
    excerpt: c.excerpt,
    coverImage: c.coverImage?.filename ?? null,
    body: c.body ? renderRichText(c.body) : '',
  };
}

export async function fetchAllPostSlugs(): Promise<string[]> {
  const api = useStoryblokApi();
  const { data } = await api.get('cdn/stories', {
    version: 'published',
    starts_with: 'happenings/',
    per_page: 100,
  });
  return (data.stories ?? []).map((s: any) => s.slug);
}
