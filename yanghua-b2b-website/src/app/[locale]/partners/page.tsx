import Image from 'next/image';
import { contentRepository } from '@/lib/content-repository';

type PartnerPageContent = {
  content: {
    title: string;
    subtitle: string;
    heroDescription?: string;
    partners?: Array<{
      name: string;
      logo: string;
      description: string;
    }>;
    benefits?: {
      title: string;
      subtitle: string;
      items: Array<{
        title: string;
        description: string;
        icon: 'innovation' | 'global' | 'quality';
      }>;
    };
  };
};

function BenefitIcon({ icon }: { icon: 'innovation' | 'global' | 'quality' }) {
  if (icon === 'global') {
    return (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }

  if (icon === 'quality') {
    return (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }

  return (
    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

export default function PartnersPage({ params }: { params: { locale: string } }) {
  const page = contentRepository.getPageContent<PartnerPageContent>(`partners`, params.locale as 'en' | 'es');
  const content = page?.content;
  const partners = content?.partners || [];
  const benefits = content?.benefits;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {content?.title}
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              {content?.heroDescription || content?.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Partners Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {partners.map((partner, index) => (
              <div 
                key={index}
                className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 text-center border border-gray-100"
              >
                <div className="mb-6">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    width={120}
                    height={80}
                    className="mx-auto object-contain"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {partner.name}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {partner.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Benefits */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {benefits?.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {benefits?.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(benefits?.items || []).map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BenefitIcon icon={item.icon} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
