import { Wrench, FileText, Package, Download } from 'lucide-react';
import FAQList from '@/components/Service/FAQList';
import DownloadButton from '@/components/ui/DownloadButton';
import { contentRepository } from '@/lib/content-repository';

type ServicesPageContent = {
  content: {
    page: { title: string; description: string };
    services: Array<{
      number: string;
      title: string;
      description: string;
      features: string[];
    }>;
    faq: {
      title: string;
      q1: { question: string; answer: string };
      q2: { question: string; answer: string };
      q3: { question: string; answer: string };
      q4: { question: string; answer: string };
      q5: { question: string; answer: string };
    };
    cta: {
      title: string;
      description: string;
      contactSupport: string;
      downloadResources: string;
    };
  };
};

export default async function ServicesPage({ params }: { params: { locale: string } }) {
  const locale = (params?.locale ?? 'en') as 'en' | 'es';
  const pageContent = contentRepository.getPageContent<ServicesPageContent>('services', locale)?.content;
  const services = pageContent?.services || [];
  const faqItems = pageContent?.faq
    ? ['q1', 'q2', 'q3', 'q4', 'q5'].map((key) => pageContent.faq[key as 'q1' | 'q2' | 'q3' | 'q4' | 'q5'])
    : [];

  const iconMap: Record<string, React.ReactNode> = {
    '01': <Wrench className="w-8 h-8 text-gray-700" />,
    '02': <FileText className="w-8 h-8 text-gray-700" />,
    '03': <Package className="w-8 h-8 text-gray-700" />,
    '04': <Download className="w-8 h-8 text-gray-700" />,
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#212529] mb-4">{pageContent?.page.title}</h1>
          <p className="text-xl text-[#6c757d] max-w-3xl mx-auto">{pageContent?.page.description}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {services.map((service) => (
            <div key={service.title} className="card p-6 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-3xl font-bold tex-yellow-600 mb-2">{service.number}</div>
              <div className="mb-4">{iconMap[service.number] || <Wrench className="w-8 h-8 text-gray-700" />}</div>
              <h3 className="text-xl font-semibold text-[#212529] mb-3">{service.title}</h3>
              <p className="text-[#6c757d] mb-4">{service.description}</p>
              <ul className="space-y-2">
                {service.features.map((feature) => (
                  <li key={feature} className="text-sm text-[#6c757d] flex items-center">
                    <div className="w-1.5 h-1.5 bg-[#fdb827] rounded-full mr-2"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <FAQList title={pageContent?.faq.title} items={faqItems} />

        <div className="bg-[#f8f9fa] rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-[#212529] mb-4">{pageContent?.cta.title}</h2>
          <p className="text-[#6c757d] mb-6">{pageContent?.cta.description}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary">{pageContent?.cta.contactSupport}</button>
            <DownloadButton resourceId="service-resources" locale={locale} variant="secondary" className="btn-secondary">
              {pageContent?.cta.downloadResources}
            </DownloadButton>
          </div>
        </div>
      </div>
    </div>
  );
}
