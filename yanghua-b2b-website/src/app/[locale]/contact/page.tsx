import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import ContactForm from '@/components/features/ContactForm';
import { contentRepository } from '@/lib/content-repository';

type ContactPageContent = {
  content: {
    page: { title: string; description: string };
    sections: { getInTouch: string };
    info: {
      phone: { title: string; content: string; description: string };
      email: { title: string; content: string; description: string };
      address: { title: string; content: string; description: string };
      hours: { title: string; content: string; description: string };
    };
    globalSupport: {
      title: string;
      description: string;
      regions: {
        northAmerica: string;
        europe: string;
        asiaPacific: string;
      };
    };
  };
};

export default async function ContactPage({ params }: { params: { locale: string } }) {
  const locale = (params.locale || 'en') as 'en' | 'es';
  const pageContent = contentRepository.getPageContent<ContactPageContent>('contact', locale)?.content;

  const contactInfo = [
    {
      icon: Phone,
      title: pageContent?.info.phone.title,
      content: pageContent?.info.phone.content,
      description: pageContent?.info.phone.description,
    },
    {
      icon: Mail,
      title: pageContent?.info.email.title,
      content: pageContent?.info.email.content,
      description: pageContent?.info.email.description,
    },
    {
      icon: MapPin,
      title: pageContent?.info.address.title,
      content: pageContent?.info.address.content,
      description: pageContent?.info.address.description,
    },
    {
      icon: Clock,
      title: pageContent?.info.hours.title,
      content: pageContent?.info.hours.content,
      description: pageContent?.info.hours.description,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#212529] mb-4">{pageContent?.page.title}</h1>
          <p className="text-xl text-[#6c757d] max-w-3xl mx-auto">{pageContent?.page.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-[#212529] mb-6">{pageContent?.sections.getInTouch}</h2>

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
              <h3 className="font-semibold text-[#212529] mb-2">{pageContent?.globalSupport.title}</h3>
              <p className="text-sm text-[#6c757d] mb-4">{pageContent?.globalSupport.description}</p>
              <ul className="text-sm text-[#6c757d] space-y-1">
                <li>• {pageContent?.globalSupport.regions.northAmerica}</li>
                <li>• {pageContent?.globalSupport.regions.europe}</li>
                <li>• {pageContent?.globalSupport.regions.asiaPacific}</li>
              </ul>
            </div>
          </div>

          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
