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

export default function FastInstallationHub({ params }: PageProps) {
  const { locale } = params;
  const t = locale === 'es'
    ? {
        title: 'Instalación Rápida para Reacondicionamiento | Barra Flexible 2000A',
        subtitle: 'Menos tiempo de inactividad · Instalación modular · Menos retrabajo',
        intro: 'Soluciones de barra colectora flexible de alta corriente para plantas químicas y centros de datos. Reduzca la pérdida de calor y mejore la confiabilidad con una instalación más rápida.',
        ctaPrimary: 'Solicitar Cotización',
        ctaSecondary: 'Descargar Especificaciones',
        interestTitle: 'Escenarios y Tecnología',
        interestItems: [
          'Reacondicionamiento de plantas químicas: ajuste flexible y conexión confiable',
          'Centros de datos: menor pérdida térmica y mayor estabilidad',
          'Compatibilidad con paneles existentes y gabinetes de distribución',
        ],
        desireTitle: 'Casos y Pruebas',
        desireItems: [
          'Caso de planta química: reducción de tiempo de instalación y costos',
          'Visita de liderazgo de CSG Shenzhen (noticias y confianza)',
        ],
        actionTitle: 'Obtenga su Presupuesto',
        actionDesc: 'Comparta sus necesidades (corriente, longitud, entorno) y obtenga una propuesta técnica personalizada.',
        viewArticles: 'Ver Artículos',
      }
    : {
        title: 'Fast Retrofit Installation | 2000A Flexible Busbar',
        subtitle: 'Shorter Downtime · Modular Installation · Less Rework',
        intro: 'High‑current flexible busbar solutions for chemical plants and data centers. Reduce heat loss and improve reliability with faster installation.',
        ctaPrimary: 'Request a Quote',
        ctaSecondary: 'Download Specs',
        interestTitle: 'Scenarios & Technology',
        interestItems: [
          'Chemical plant retrofit: flexible routing and reliable connection',
          'Data center power: lower heat loss and greater stability',
          'Compatibility with existing busbars and switchgear',
        ],
        desireTitle: 'Cases & Proof',
        desireItems: [
          'Chemical plant case: reduced install time and cost',
          'Shenzhen CSG leadership visit (news & trust)',
        ],
        actionTitle: 'Get Your Quote',
        actionDesc: 'Share your needs (current, length, environment) and receive a tailored technical proposal.',
        viewArticles: 'View Articles',
      };

  const contactPath = getLocalizedPath('contact', locale);
  const articlesPath = getLocalizedPath('articles', locale);

  return (
    <>
      {/* Full-screen hero section */}
      <Hero />
      <main className="container mx-auto px-4 py-12 max-w-5xl">
      <Breadcrumbs locale={locale} currentTitle={t.title} currentSlug="retrofit-fast-installation" />

      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{t.title}</h1>
        <p className="text-gray-600">{t.subtitle}</p>
      </header>

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
            id: 'case-chem-plant',
            title: locale === 'es' ? 'Planta Química – Reacondicionamiento Rápido' : 'Chemical Plant – Fast Retrofit',
            client: 'Confidential',
            industry: locale === 'es' ? 'Química' : 'Chemical',
            location: locale === 'es' ? 'Shenzhen, China' : 'Shenzhen, China',
            params: [
              { label: locale === 'es' ? 'Corriente' : 'Current', value: '2000A' },
              { label: locale === 'es' ? 'Temperatura' : 'Temperature', value: '≤ 85°C' },
              { label: locale === 'es' ? 'Tiempo de instalación' : 'Install Time', value: '30% faster' },
            ],
            testimonial: locale === 'es'
              ? 'La instalación fue rápida y redujo el tiempo de inactividad.'
              : 'Installation was fast and reduced downtime significantly.'
          },
          {
            id: 'case-data-center',
            title: locale === 'es' ? 'Centro de Datos – Estabilidad de Energía' : 'Data Center – Power Stability',
            client: 'Confidential',
            industry: locale === 'es' ? 'TI' : 'IT',
            location: locale === 'es' ? 'Guangdong, China' : 'Guangdong, China',
            params: [
              { label: locale === 'es' ? 'Corriente' : 'Current', value: '2500A' },
              { label: locale === 'es' ? 'Pérdida térmica' : 'Heat Loss', value: 'Low' },
              { label: locale === 'es' ? 'Estabilidad' : 'Stability', value: 'Improved' },
            ],
            testimonial: locale === 'es'
              ? 'La solución mejoró la estabilidad de energía y redujo la temperatura de contacto.'
              : 'The solution improved power stability and lowered contact temperatures.'
          },
          {
            id: 'case-industrial',
            title: locale === 'es' ? 'Planta Industrial – Ajuste Flexible' : 'Industrial Plant – Flexible Routing',
            client: 'Confidential',
            industry: locale === 'es' ? 'Industrial' : 'Industrial',
            location: locale === 'es' ? 'Dongguan, China' : 'Dongguan, China',
            params: [
              { label: locale === 'es' ? 'Longitud' : 'Length', value: 'Custom' },
              { label: locale === 'es' ? 'Accesorios' : 'Accessories', value: 'Insulation set' },
              { label: locale === 'es' ? 'Instalación' : 'Installation', value: 'Modular' },
            ],
            testimonial: locale === 'es'
              ? 'Se adaptó bien a rutas complejas y redujo los retrabajos.'
              : 'Adapted well to complex routing and reduced rework.'
          }
        ]}
      />
      </main>
    </>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = params;
  const localizedPath = getLocalizedPath('articles-hub-detail', locale, { slug: 'retrofit-fast-installation' });
  const canonical = generateCanonicalUrl(localizedPath, locale);
  const title = locale === 'es' ? 'Instalación Rápida | Barra Flexible 2000A | Yanghua' : 'Fast Installation | 2000A Flexible Busbar | Yanghua';
  const description = locale === 'es'
    ? 'Soluciones de reacondicionamiento ágil con barra colectora flexible de alta corriente para plantas químicas y centros de datos.'
    : 'Rapid retrofit solutions with high‑current flexible busbar for chemical plants and data centers.';
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