import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import LightboxImage from '@/components/LightboxImage';
import SolutionDownloadButton from '@/components/ui/SolutionDownloadButton';
import SolutionsHeroImage from '@/components/SolutionsHeroImage';
import SolutionsGallery from '@/components/SolutionsGallery';
import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { getLocalizedPath } from '@/lib/url-localization';

type Solution = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  highlights: string[];
  applications: string[];
  advantages: { title: string; description: string }[];
  technicalSpecs: { parameter: string; value: string }[];
  galleryCaptions?: { title: string; description: string }[];
};

// Generate static params for all available solutions
export async function generateStaticParams({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'solutions' });
  const solutions = t.raw('solutions') as Solution[];
  
  return solutions.map((solution) => ({
    id: solution.id,
  }));
}

interface PageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default async function SolutionDetailPage({ params: { id, locale } }: PageProps) {
  const t = await getTranslations({ locale, namespace: 'solutions' });
  const solutions = t.raw('solutions') as Solution[];
  const solution = solutions.find((s) => s.id === id);

  if (!solution) {
    notFound();
  }

  // 自动/配置生成 Gallery 数量：优先使用 captions 长度，否则根据目录文件数量自动计算，最后回退为 4
  let galleryCount = (solution.galleryCaptions && solution.galleryCaptions.length) ? solution.galleryCaptions.length : 0;
  try {
    const galleryDir = path.join(process.cwd(), 'public', 'images', 'solutions', solution.id, 'gallery');
    const exists = fs.existsSync(galleryDir);
    const files = exists ? fs.readdirSync(galleryDir) : [];
    const imageFiles = files.filter((f) => /\.(webp|png|jpg|jpeg)$/i.test(f));
    if (!galleryCount) {
      galleryCount = imageFiles.length;
    }
  } catch (e) {
    // ignore fs errors and fallback later
  }
  if (!galleryCount) {
    galleryCount = 4;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <SolutionsHeroImage src={solution.image} alt={solution.title} />
        <div className="p-6 md:p-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{solution.title}</h1>
          <p className="text-xl text-gray-600 mb-6">{solution.subtitle}</p>
          <p className="text-gray-700 leading-relaxed mb-8">{solution.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 items-start">
            <div className="md:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Key Highlights</h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                            {solution.highlights.map((highlight, index) => (
                            <li key={index}>{highlight}</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Typical Applications</h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                            {solution.applications.map((application, index) => (
                            <li key={index}>{application}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            <LightboxImage 
                src={`/images/solutions/${solution.id}/detail.webp`}
                alt={solution.title}
            />
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Advantages</h2>
            <div className="space-y-6">
              {solution.advantages.map((advantage, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900">{advantage.title}</h3>
                  <p className="text-gray-600 mt-2">{advantage.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gallery Section */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Gallery</h2>
            
            <SolutionsGallery solutionId={solution.id} solutionTitle={solution.title} count={galleryCount} captions={solution.galleryCaptions} />
          </div>
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Technical Specifications</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {solution.technicalSpecs.map((spec, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{spec.parameter}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      <div className="mt-12 text-center bg-gray-50 py-10 px-6 rounded-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Have a Project in Mind?</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Download the full specification sheet for more details or get in touch with our experts to find the perfect solution for you.
        </p>
        <div className="flex justify-center items-center gap-4">
          <SolutionDownloadButton 
            solutionId={id}
            locale={locale}
            className="px-8 py-3"
          >
            Download PDF
          </SolutionDownloadButton>
          <Link href="/contact" className="btn-primary px-8 py-3">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}

// 页面级别元数据：为 /solutions/[id] 生成正确的 canonical 与 hreflang（包含动态段）
export async function generateMetadata({ params }: { params: { locale: string; id: string } }): Promise<Metadata> {
  const { locale, id } = params;
  const t = await getTranslations({ locale, namespace: 'solutions' });
  const solutions = t.raw('solutions') as Solution[];
  const solution = solutions.find((s) => s.id === id);
  const titleBase = solution?.title || id;
  const titles: Record<string, string> = {
    en: `${titleBase} | Flexible Busbar Solutions | Yanghua`,
    es: `${titleBase} | Soluciones de Barras Flexibles | Yanghua`,
  };
  const descriptions: Record<string, string> = {
    en: solution?.description || 'Flexible busbar solution details and specifications.',
    es: solution?.description || 'Detalles y especificaciones de la solución de barras colectoras flexibles.',
  };
  const canonical = generateCanonicalUrl(getLocalizedPath('solutions-detail', locale as any, { id }), locale as any);
  const currentPathForLocale = getLocalizedPath('solutions-detail', locale as any, { id });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';
  const currentUrl = locale === 'es' 
    ? `${baseUrl}/es/soluciones/${id}`
    : `${baseUrl}/solutions/${id}`;
  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    openGraph: {
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
      url: currentUrl,
      siteName: 'Yanghua Cable',
      type: 'article',
      locale,
    },
    alternates: {
      canonical,
      languages: generateHreflangAlternatesForMetadata(currentPathForLocale, locale as any),
    },
  };
}