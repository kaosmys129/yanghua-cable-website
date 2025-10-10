'use client';

import { Wrench, FileText, Package, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Get services data from translations
function getServices(t: any) {
  try {
    const servicesData = t.raw('services');
    return Array.isArray(servicesData) ? servicesData : [];
  } catch (error) {
    console.error('Error loading services data:', error);
    return [];
  }
}

export default function ServicesPage() {
  const t = useTranslations('services');
  const services = getServices(t);

  // Icon mapping
  const iconMap: { [key: string]: any } = {
    '01': <Wrench className="w-8 h-8 text-gray-700" />,
    '02': <FileText className="w-8 h-8 text-gray-700" />,
    '03': <Package className="w-8 h-8 text-gray-700" />,
    '04': <Download className="w-8 h-8 text-gray-700" />,
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#212529] mb-4">
            {t('page.title')}
          </h1>
          <p className="text-xl text-[#6c757d] max-w-3xl mx-auto">
            {t('page.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {services.map((service: any) => (
            <div key={service.title} className="card p-6 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-3xl font-bold tex-yellow-600 mb-2">{service.number}</div>
              <div className="mb-4">{iconMap[service.number] || <Wrench className="w-8 h-8 text-gray-700" />}</div>
              <h3 className="text-xl font-semibold text-[#212529] mb-3">
                {service.title}
              </h3>
              <p className="text-[#6c757d] mb-4">
                {service.description}
              </p>
              <ul className="space-y-2">
                {service.features.map((feature: string) => (
                  <li key={feature} className="text-sm text-[#6c757d] flex items-center">
                    <div className="w-1.5 h-1.5 bg-[#fdb827] rounded-full mr-2"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-[#f8f9fa] rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-[#212529] mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-[#6c757d] mb-6">
            {t('cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary">
              {t('cta.contactSupport')}
            </button>
            <button className="btn-secondary">
              {t('cta.downloadResources')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}