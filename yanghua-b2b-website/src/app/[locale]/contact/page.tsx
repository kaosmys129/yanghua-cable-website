'use client';

import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ContactForm from '@/components/features/ContactForm';

export default function ContactPage() {
  const t = useTranslations('contact');
  
  const contactInfo = [
    {
      icon: Phone,
      title: t('info.phone.title'),
      content: t('info.phone.content'),
      description: t('info.phone.description'),
    },
    {
      icon: Mail,
      title: t('info.email.title'),
      content: t('info.email.content'),
      description: t('info.email.description'),
    },
    {
      icon: MapPin,
      title: t('info.address.title'),
      content: t('info.address.content'),
      description: t('info.address.description'),
    },
    {
      icon: Clock,
      title: t('info.hours.title'),
      content: t('info.hours.content'),
      description: t('info.hours.description'),
    },
  ];

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold text-[#212529] mb-6">
              {t('sections.getInTouch')}
            </h2>
            
            <div className="space-y-6">
              {contactInfo.map((info) => (
                <div key={info.title} className="flex items-start">
                  <div className="bg-[#fdb827] p-3 rounded-lg mr-4">
                    <info.icon className="h-6 w-6 text-[#212529]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#212529]">{info.title}</h3>
                    <p className="text-[#212529]">{info.content}</p>
                    <p className="text-sm text-[#6c757d]">{info.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-[#f8f9fa] rounded-lg">
              <h3 className="font-semibold text-[#212529] mb-2">
                {t('globalSupport.title')}
              </h3>
              <p className="text-sm text-[#6c757d] mb-4">
                {t('globalSupport.description')}
              </p>
              <ul className="text-sm text-[#6c757d] space-y-1">
                <li>• {t('globalSupport.regions.northAmerica')}</li>
                <li>• {t('globalSupport.regions.europe')}</li>
                <li>• {t('globalSupport.regions.asiaPacific')}</li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}