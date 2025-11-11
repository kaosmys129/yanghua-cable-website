import Link from "next/link";
import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';
import { StrapiImage } from '@/components/custom/StrapiImage';
import { getLocalizedPath } from '@/lib/url-localization';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import ProductComparison from '@/components/ui/FlexibleBusbarComparison';
import CompanyStrength from '@/components/business/CompanyStrength';
import CertificationsGallery from '@/components/business/CertificationsGallery';
import CasesWithDetails from '@/components/business/CasesWithDetails';
import Hero from '@/components/business/Hero';

interface PageProps { params: { locale: 'en' | 'es' } }

export default function SaferDistributionHub({ params }: PageProps) {
  const { locale } = params;
  const t = locale === 'es'
    ? {
        title: 'Distribución Segura de Alta Corriente｜Barra Flexible 2500A',
        subtitle: 'Baja pérdida térmica · Menor temperatura de contacto · Energía estable',
        intro: 'Sistemas de barra flexible de 2500A para distribución eléctrica industrial. Cumplimiento UL/IEC y operación confiable.',
        ctaPrimary: 'Contactar Ingeniería',
        ctaSecondary: 'Descargar Pruebas',
        interestTitle: 'Tecnología y Cumplimiento',
        interestItems: [
          'Diseño de disipación térmica y materiales conductores',
          'Pruebas de temperatura en puntos de contacto',
          'Cumplimiento UL/IEC (si aplica)',
        ],
        desireTitle: 'Casos y Confianza',
        desireItems: [
          'Estabilidad en centros de datos y proyectos industriales',
          'Whitepaper/Informe técnico (si aplica)',
        ],
        actionTitle: 'Consulta Técnica',
        actionDesc: 'Comparta requerimientos (corriente/longitud/entorno/temperatura) y obtenga soporte técnico.',
        viewArticles: 'Ver Artículos',
      }
    : {
        title: 'Safer High‑Current Distribution｜Flexible Busbar 2500A',
        subtitle: 'Low Heat Loss · Lower Contact Temperature · Stable Power',
        intro: '2500A flexible busbar systems for industrial power distribution. UL/IEC compliant and highly reliable.',
        ctaPrimary: 'Talk to Engineering',
        ctaSecondary: 'Download Test Data',
        interestTitle: 'Technology & Compliance',
        interestItems: [
          'Thermal management design and conductor materials',
          'Contact temperature testing and validation',
          'UL/IEC compliance (if applicable)',
        ],
        desireTitle: 'Cases & Trust',
        desireItems: [
          'Power stability in data centers and industrial projects',
          'Technical whitepaper/report (if applicable)',
        ],
        actionTitle: 'Technical Consultation',
        actionDesc: 'Share requirements (current/length/environment/temperature) and get technical support.',
        viewArticles: 'View Articles',
      };

  const contactPath = getLocalizedPath('contact', locale);
  const articlesPath = getLocalizedPath('articles', locale);

  return (
    <>
      <Hero />
      <main className="container mx-auto px-4 py-12 max-w-5xl">
      <Breadcrumbs locale={locale} currentTitle={t.title} currentSlug="high-current-safer-distribution" />

      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{t.title}</h1>
        <p className="text-gray-600">{t.subtitle}</p>
      </header>

      {/* remove duplicate local hero image to avoid redundancy */}

      {/* Attention */}
      <section className="mb-10">
        <p className="text-lg text-gray-700">{t.intro}</p>
        <div className="mt-4 flex gap-4">
          <Link href={`/${locale}${contactPath === '/' ? '' : contactPath}`} className="px-5 py-2 bg-[#fdb827] text-[#212529] rounded hover:bg-[#e0a020] font-semibold">
            {t.ctaPrimary}
          </Link>
          <Link href={`/${locale}${articlesPath === '/' ? '' : articlesPath}`} className="px-5 py-2 border border-[#fdb827] text-[#fdb827] rounded hover:bg-[#fdb827] hover:text-[#212529] font-semibold">
            {t.ctaSecondary}
          </Link>
        </div>
      </section>

      {/* Interest */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">{t.interestTitle}</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          {t.interestItems.map((item, i) => (<li key={i}>{item}</li>))}
        </ul>
      </section>

      {/* Desire */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">{t.desireTitle}</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          {t.desireItems.map((item, i) => (<li key={i}>{item}</li>))}
        </ul>
      </section>

      {/* Action */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">{t.actionTitle}</h2>
        <p className="text-gray-700 mb-4">{t.actionDesc}</p>
        <Link href={`/${locale}${contactPath === '/' ? '' : contactPath}`} className="px-5 py-2 bg-[#fdb827] text-[#212529] rounded hover:bg-[#e0a020] font-semibold">
          {t.ctaPrimary}
        </Link>
        <div className="mt-6">
          <Link href={`/${locale}${articlesPath === '/' ? '' : articlesPath}`} className="text-[#fdb827] hover:text-[#e0a020] font-medium">
            {t.viewArticles}
          </Link>
        </div>
      </section>

      {/* Production Compare */}
      <ProductComparison />

      {/* Company Strength */}
      <CompanyStrength />

      {/* Certifications Gallery */}
      <CertificationsGallery locale={locale} />

      {/* Engineering Cases */}
      <CasesWithDetails
        cases={[
          {
            id: 'case-dc-stability',
            title: locale === 'es' ? 'Centro de Datos – Estabilidad Energética' : 'Data Center – Energy Stability',
            client: 'Confidential',
            industry: locale === 'es' ? 'TI' : 'IT',
            location: locale === 'es' ? 'Guangdong, China' : 'Guangdong, China',
            params: [
              { label: locale === 'es' ? 'Corriente' : 'Current', value: '2500A' },
              { label: locale === 'es' ? 'Temperatura de contacto' : 'Contact Temp', value: 'Lowered' },
              { label: locale === 'es' ? 'Estabilidad' : 'Stability', value: 'Improved' },
            ],
            testimonial: locale === 'es'
              ? 'Estabilidad y temperatura bajo control, operación confiable.'
              : 'Stability and contact temperatures under control; reliable operation.'
          },
          {
            id: 'case-industrial-safety',
            title: locale === 'es' ? 'Industria – Seguridad de Alta Corriente' : 'Industrial – High‑Current Safety',
            client: 'Confidential',
            industry: locale === 'es' ? 'Industrial' : 'Industrial',
            location: locale === 'es' ? 'Shenzhen, China' : 'Shenzhen, China',
            params: [
              { label: locale === 'es' ? 'Ensayo UL/IEC' : 'UL/IEC Test', value: 'Compliant' },
              { label: locale === 'es' ? 'Pérdida térmica' : 'Heat Loss', value: 'Low' },
              { label: locale === 'es' ? 'Fiabilidad' : 'Reliability', value: 'High' },
            ],
            testimonial: locale === 'es'
              ? 'Cumplimiento con estándares y operación estable.'
              : 'Standards compliant and stable operation.'
          },
          {
            id: 'case-energy',
            title: locale === 'es' ? 'Energía – Distribución Segura' : 'Energy – Safer Distribution',
            client: 'Confidential',
            industry: locale === 'es' ? 'Energía' : 'Energy',
            location: locale === 'es' ? 'Dongguan, China' : 'Dongguan, China',
            params: [
              { label: locale === 'es' ? 'Corriente' : 'Current', value: '2000A' },
              { label: locale === 'es' ? 'Temperatura' : 'Temperature', value: 'Stable' },
              { label: locale === 'es' ? 'Accesorios' : 'Accessories', value: 'Insulation set' },
            ],
            testimonial: locale === 'es'
              ? 'Distribución confiable con parámetros bajo control.'
              : 'Reliable distribution with controlled parameters.'
          }
        ]}
      />
      </main>
    </>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = params;
  const localizedPath = getLocalizedPath('articles-hub-detail', locale, { slug: 'high-current-safer-distribution' });
  const canonical = generateCanonicalUrl(localizedPath, locale);
  const title = locale === 'es' ? 'Distribución Segura de Alta Corriente | Barra Flexible 2500A | Yanghua' : 'Safer High‑Current Distribution | Flexible Busbar 2500A | Yanghua';
  const description = locale === 'es'
    ? 'Sistemas de barra flexible de 2500A para distribución industrial. Baja pérdida térmica y cumplimiento UL/IEC.'
    : '2500A flexible busbar systems for industrial power. Low heat loss and UL/IEC compliance.';
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: generateHreflangAlternatesForMetadata(localizedPath, locale),
    },
  };
}

export const dynamicParams = false;