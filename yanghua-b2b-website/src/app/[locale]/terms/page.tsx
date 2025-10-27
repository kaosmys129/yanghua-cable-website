import { getTranslations } from 'next-intl/server';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { getLocalizedPath } from '@/lib/url-localization';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';
  
  const titles: Record<string, string> = {
    en: 'Terms of Service | Yanghua Cable',
    es: 'Términos de Servicio | Yanghua Cable',
  };
  
  const descriptions: Record<string, string> = {
    en: 'Terms of Service for Yanghua Cable flexible busbar systems and power distribution solutions.',
    es: 'Términos de Servicio para sistemas de barras colectoras flexibles y soluciones de distribución de energía de Yanghua Cable.',
  };

  const localizedPath = getLocalizedPath('terms', locale as any);
  const canonical = generateCanonicalUrl(localizedPath, locale as any, baseUrl);
  const languages = generateHreflangAlternatesForMetadata(localizedPath, locale as any);

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical,
      languages,
    },
  };
}

export default async function TermsPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations('terms');
  const locale = params.locale;

  const content = {
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: October 2024',
      sections: [
        {
          title: '1. Acceptance of Terms',
          content: 'By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.'
        },
        {
          title: '2. Products and Services',
          content: 'Yanghua Cable provides flexible busbar systems and power distribution solutions. All product specifications are subject to change without notice.'
        },
        {
          title: '3. Intellectual Property',
          content: 'All content on this website, including but not limited to text, graphics, logos, and images, is the property of Yanghua Cable and protected by copyright laws.'
        },
        {
          title: '4. Limitation of Liability',
          content: 'Yanghua Cable shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use of our products or services.'
        },
        {
          title: '5. Contact Information',
          content: 'For questions about these Terms of Service, please contact us through our contact page or email.'
        }
      ]
    },
    es: {
      title: 'Términos de Servicio',
      lastUpdated: 'Última actualización: Octubre 2024',
      sections: [
        {
          title: '1. Aceptación de Términos',
          content: 'Al acceder y usar este sitio web, usted acepta y está de acuerdo en cumplir con los términos y disposiciones de este acuerdo.'
        },
        {
          title: '2. Productos y Servicios',
          content: 'Yanghua Cable proporciona sistemas de barras colectoras flexibles y soluciones de distribución de energía. Todas las especificaciones del producto están sujetas a cambios sin previo aviso.'
        },
        {
          title: '3. Propiedad Intelectual',
          content: 'Todo el contenido de este sitio web, incluyendo pero no limitado a texto, gráficos, logotipos e imágenes, es propiedad de Yanghua Cable y está protegido por las leyes de derechos de autor.'
        },
        {
          title: '4. Limitación de Responsabilidad',
          content: 'Yanghua Cable no será responsable de ningún daño directo, indirecto, incidental o consecuente que surja del uso de nuestros productos o servicios.'
        },
        {
          title: '5. Información de Contacto',
          content: 'Para preguntas sobre estos Términos de Servicio, por favor contáctenos a través de nuestra página de contacto o correo electrónico.'
        }
      ]
    }
  };

  const pageContent = content[locale as keyof typeof content] || content.en;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">{pageContent.title}</h1>
          <p className="text-blue-100">{pageContent.lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            {pageContent.sections.map((section, index) => (
              <div key={index} className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {section.title}
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {locale === 'es' ? 'Contacto' : 'Contact Us'}
            </h3>
            <p className="text-gray-700">
              {locale === 'es' 
                ? 'Si tiene preguntas sobre estos términos, no dude en contactarnos.'
                : 'If you have any questions about these terms, please feel free to contact us.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}