import Link from "next/link";
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getHubBySlug } from '@/lib/strapi-client';
import { getLocalizedPath } from '@/lib/url-localization';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { StrapiImage } from '@/components/custom/StrapiImage';

interface PageProps {
  params: { slug: string; locale: string }
}

export default async function HubPage({ params }: PageProps) {
  const { slug, locale } = params;
  const hub = await getHubBySlug(slug, locale as any);
  if (!hub) {
    return notFound();
  }

  const homePath = getLocalizedPath('home', locale as any);
  const listPath = getLocalizedPath('articles-hub', locale as any);
  const detailPath = getLocalizedPath('articles-hub-detail', locale as any, { slug });
  const homeUrl = generateCanonicalUrl(homePath, locale as any);
  const listUrl = generateCanonicalUrl(listPath, locale as any);
  const detailUrl = generateCanonicalUrl(detailPath, locale as any);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: locale === 'es' ? 'Inicio' : 'Home', item: homeUrl },
      { '@type': 'ListItem', position: 2, name: locale === 'es' ? 'Temas' : 'Topics', item: listUrl },
      { '@type': 'ListItem', position: 3, name: hub.title, item: detailUrl },
    ],
  };

  return (
    <main className="container mx-auto px-4 py-12 max-w-5xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <h1 className="text-4xl font-bold mb-4">{hub.title}</h1>
      {hub.cover?.url && (
        <div className="w-full h-72 relative rounded-lg overflow-hidden mb-6">
          <StrapiImage src={hub.cover.url} alt={hub.cover.alternativeText || hub.title} fill className="object-cover" />
        </div>
      )}
      {hub.intro && (
        <div className="prose max-w-none mb-8" dangerouslySetInnerHTML={{ __html: hub.intro }} />
      )}

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">{locale === 'es' ? 'Artículos destacados' : 'Featured Articles'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {(hub.featured_articles || []).map((a) => {
            const aDetailPath = getLocalizedPath('articles-detail', locale as any, { slug: a.slug });
            return (
              <article key={a.id} className="border rounded-lg overflow-hidden">
                <Link href={`/${locale}${aDetailPath === '/' ? '' : aDetailPath}`} className="block">
                  <div className="relative h-40 w-full">
                    <StrapiImage
                      src={a.cover?.url || "/placeholder.svg?height=160&width=320&query=cover"}
                      alt={a.cover?.alternativeText || a.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-medium line-clamp-2">{a.title}</h3>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = params;
  const hub = await getHubBySlug(slug, locale as any);
  const title = hub?.title ? `${hub.title} | Yanghua` : 'Topic Hub | Yanghua';
  const description = hub?.intro ? stripHtml(hub.intro).slice(0, 160) : 'Curated topic hub with featured articles.';

  const localizedPath = getLocalizedPath('articles-hub-detail', locale as any, { slug });
  const canonical = generateCanonicalUrl(localizedPath, locale as any);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: generateHreflangAlternatesForMetadata(localizedPath, locale as any),
    },
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export const dynamicParams = false;