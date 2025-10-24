import { getTranslations } from 'next-intl/server';
import { generateCanonicalUrl } from '@/lib/seo';
import { buildLocalizedUrl } from '@/lib/url-localization';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';
  
  const titles: Record<string, string> = {
    en: 'Privacy Policy | Yanghua Cable',
    es: 'Política de Privacidad | Yanghua Cable',
  };
  
  const descriptions: Record<string, string> = {
    en: 'Privacy Policy for Yanghua Cable website and flexible busbar systems services.',
    es: 'Política de Privacidad para el sitio web de Yanghua Cable y servicios de sistemas de barras colectoras flexibles.',
  };

  const canonical = generateCanonicalUrl('/privacy', locale as any, baseUrl);

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical,
      languages: {
        en: buildLocalizedUrl('privacy', 'en', undefined, baseUrl),
        es: buildLocalizedUrl('privacy', 'es', undefined, baseUrl),
      },
    },
  };
}

export default async function PrivacyPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations('privacy');
  const locale = params.locale;

  const content = {
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: October 2024',
      sections: [
        {
          title: '1. Information We Collect',
          content: 'We collect information you provide directly to us, such as when you contact us through our website, request product information, or subscribe to our newsletter.'
        },
        {
          title: '2. How We Use Your Information',
          content: 'We use the information we collect to provide, maintain, and improve our services, respond to your inquiries, and send you technical notices and support messages.'
        },
        {
          title: '3. Information Sharing',
          content: 'We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this privacy policy.'
        },
        {
          title: '4. Data Security',
          content: 'We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.'
        },
        {
          title: '5. Cookies',
          content: 'Our website uses cookies to enhance your browsing experience. You can choose to disable cookies through your browser settings.'
        },
        {
          title: '6. Contact Information',
          content: 'If you have any questions about this Privacy Policy, please contact us through our contact page.'
        }
      ]
    },
    es: {
      title: 'Política de Privacidad',
      lastUpdated: 'Última actualización: Octubre 2024',
      sections: [
        {
          title: '1. Información que Recopilamos',
          content: 'Recopilamos información que nos proporciona directamente, como cuando nos contacta a través de nuestro sitio web, solicita información del producto o se suscribe a nuestro boletín.'
        },
        {
          title: '2. Cómo Usamos Su Información',
          content: 'Utilizamos la información que recopilamos para proporcionar, mantener y mejorar nuestros servicios, responder a sus consultas y enviarle avisos técnicos y mensajes de soporte.'
        },
        {
          title: '3. Compartir Información',
          content: 'No vendemos, intercambiamos o transferimos su información personal a terceros sin su consentimiento, excepto como se describe en esta política de privacidad.'
        },
        {
          title: '4. Seguridad de Datos',
          content: 'Implementamos medidas de seguridad apropiadas para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción.'
        },
        {
          title: '5. Cookies',
          content: 'Nuestro sitio web utiliza cookies para mejorar su experiencia de navegación. Puede elegir deshabilitar las cookies a través de la configuración de su navegador.'
        },
        {
          title: '6. Información de Contacto',
          content: 'Si tiene alguna pregunta sobre esta Política de Privacidad, por favor contáctenos a través de nuestra página de contacto.'
        }
      ]
    }
  };

  const pageContent = content[locale as keyof typeof content] || content.en;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">{pageContent.title}</h1>
          <p className="text-green-100">{pageContent.lastUpdated}</p>
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
                ? 'Si tiene preguntas sobre esta política de privacidad, no dude en contactarnos.'
                : 'If you have any questions about this privacy policy, please feel free to contact us.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}