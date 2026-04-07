import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { getLocalizedPath } from '@/lib/url-localization';
import { getSiteUrl } from '@/lib/site-url';
import type { Metadata } from 'next';
import { contentRepository } from '@/lib/content-repository';

type LegalPageContent = {
  content: {
    title: string;
    description: string;
    lastUpdated: string;
    sections: Array<{ title: string; content: string }>;
    contactTitle: string;
    contactDescription: string;
  };
};

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const baseUrl = getSiteUrl();
  const pageContent = contentRepository.getPageContent<LegalPageContent>('terms', locale as 'en' | 'es');

  const localizedPath = getLocalizedPath('terms', locale as any);
  const canonical = generateCanonicalUrl(localizedPath, locale as any, baseUrl);
  const languages = generateHreflangAlternatesForMetadata(localizedPath, locale as any);

  return {
    title: pageContent?.content.title || 'Terms of Service | Yanghua Cable',
    description:
      pageContent?.content.description ||
      'Terms of Service for Yanghua Cable flexible busbar systems and power distribution solutions.',
    alternates: {
      canonical,
      languages,
    },
  };
}

export default async function TermsPage({ params }: { params: { locale: string } }) {
  const locale = (params.locale || 'en') as 'en' | 'es';
  const pageContent = contentRepository.getPageContent<LegalPageContent>('terms', locale)?.content;
  const sections = Array.isArray(pageContent?.sections) ? pageContent.sections : [];
  const fallbackTitle = locale === 'es' ? 'Terminos del servicio' : 'Terms of Service';
  const fallbackUpdated = locale === 'es' ? 'Ultima actualizacion disponible bajo solicitud.' : 'Latest update available on request.';
  const fallbackContactTitle = locale === 'es' ? 'Contacto' : 'Contact';
  const fallbackContactDescription =
    locale === 'es'
      ? 'Para cualquier consulta sobre terminos del servicio, ponte en contacto con el equipo de Yanghua.'
      : 'For any terms-related questions, please contact the Yanghua team.';

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">{pageContent?.title || fallbackTitle}</h1>
          <p className="text-blue-100">{pageContent?.lastUpdated || fallbackUpdated}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            {sections.map((section, index) => (
              <div key={index} className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{section.title}</h2>
                <p className="text-gray-700 leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">{pageContent?.contactTitle || fallbackContactTitle}</h3>
            <p className="text-gray-700">{pageContent?.contactDescription || fallbackContactDescription}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
