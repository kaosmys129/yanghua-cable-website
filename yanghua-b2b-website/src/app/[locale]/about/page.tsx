import VideoPlayer from '@/components/business/VideoPlayer';
import TestingEquipmentSlider from '@/components/business/TestingEquipmentSlider';
import DownloadButton from '@/components/ui/DownloadButton';
import StructuredDataScript from '@/components/seo/StructuredDataScript';
import { generateAboutPageSchema, generateOrganizationSchema } from '@/lib/structured-data';
import { contentRepository } from '@/lib/content-repository';

type AboutPageContent = {
  content: {
    hero: { title: string; subtitle: string; cta: { explore: string; download: string } };
    overview: {
      title: string;
      description: string;
      stats: Record<string, string>;
    };
    mission: {
      title: string;
      subtitle: string;
      missionTitle: string;
      missionContent: string;
      missionDescription: string;
      valuesTitle: string;
      values: Record<string, string>;
    };
    timeline: {
      title: string;
      subtitle: string;
      milestones: Array<{ year: string; event: string }>;
    };
    certifications: {
      title: string;
      subtitle: string;
      description: string;
      cta: string;
    };
    team: {
      title: string;
      subtitle: string;
      positions: Record<string, string>;
      experience: Record<string, string>;
    };
    cta: {
      title: string;
      subtitle: string;
      buttons: { contact: string; quote: string };
    };
    video: {
      companyIntro: string;
    };
  };
};

export default async function AboutPage({ params }: { params: { locale: string } }) {
  const locale = (params?.locale ?? 'en') as 'en' | 'es';
  const pageContent = contentRepository.getPageContent<AboutPageContent>('about', locale)?.content;

  const aboutPageSchema = generateAboutPageSchema();
  const organizationSchema = generateOrganizationSchema();

  const companyStats = [
    { number: '40+', key: 'patents' },
    { number: '2', key: 'productionlines' },
    { number: '3', key: 'laboratories' },
    { number: '11', key: 'enterprisestandards' },
  ];
  const milestones = pageContent?.timeline?.milestones || [];

  return (
    <>
      <StructuredDataScript schema={aboutPageSchema} />
      <StructuredDataScript schema={organizationSchema} />
      <div className="min-h-screen bg-white">
        <div className="relative bg-gradient-to-r from-[#212529] to-[#343a40] text-white overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <img src="/images/about/img-strength.jpg" alt="Yanghua Manufacturing Facility" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
            <div className="text-center transition-all duration-1000 opacity-100 translate-y-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">{pageContent?.hero.title}</h1>
              <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-10 text-gray-200">{pageContent?.hero.subtitle}</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button className="bg-[#fdb827] hover:bg-[#e6a51e] text-[#212529] font-semibold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105">
                  {pageContent?.hero.cta.explore}
                </button>
                <DownloadButton
                  resourceId="company-profile"
                  locale={locale}
                  variant="secondary"
                  className="bg-transparent border-2 border-white hover:bg-white hover:text-[#212529] text-white"
                >
                  {pageContent?.hero.cta.download}
                </DownloadButton>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#212529] mb-6">{pageContent?.overview.title}</h2>
              <p className="text-lg text-[#6c757d] mb-6">{pageContent?.overview.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {companyStats.map((stat, index) => (
                  <div key={index} className="text-center p-4 bg-[#f8f9fa] rounded-lg">
                    <div className="text-2xl md:text-3xl font-bold text-[#fdb827] mb-1">{stat.number}</div>
                    <div className="text-sm md:text-base text-[#6c757d]">{pageContent?.overview.stats?.[stat.key]}</div>
                  </div>
                ))}
              </div>
            </div>
            <VideoPlayer
              videoSources={{
                en: [
                  { src: '/videos/company-intro-en.mp4', type: 'video/mp4' },
                  { src: '/videos/company-intro-en.webm', type: 'video/webm' },
                ],
                es: [
                  { src: '/videos/company-intro-es.mp4', type: 'video/mp4' },
                  { src: '/videos/company-intro-es.webm', type: 'video/webm' },
                ],
              }}
              thumbnailUrl="/images/company-intro.webp"
              title={pageContent?.video.companyIntro || 'Company Introduction Video'}
              className="shadow-lg"
            />
          </div>
        </div>

        <div className="bg-[#f8f9fa] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#212529] mb-4">{pageContent?.mission.title}</h2>
              <p className="text-xl text-[#6c757d] max-w-3xl mx-auto">{pageContent?.mission.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="bg-white p-8 rounded-lg shadow-md">
                <h3 className="text-2xl font-bold text-[#212529] mb-4">{pageContent?.mission.missionTitle}</h3>
                <p className="text-lg text-[#6c757d] mb-6">{pageContent?.mission.missionContent}</p>
                <p className="text-[#6c757d]">{pageContent?.mission.missionDescription}</p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md">
                <h3 className="text-2xl font-bold text-[#212529] mb-4">{pageContent?.mission.valuesTitle}</h3>
                <ul className="space-y-3">
                  {Object.values(pageContent?.mission.values || {}).map((value) => (
                    <li key={value} className="flex items-start">
                      <div className="w-3 h-3 bg-[#fdb827] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-[#6c757d]">{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#212529] mb-4">{pageContent?.timeline.title}</h2>
            <p className="text-xl text-[#6c757d] max-w-3xl mx-auto">{pageContent?.timeline.subtitle}</p>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-[#fdb827] hidden md:block"></div>
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={`${milestone.year}-${index}`} className={`flex flex-col md:flex-row items-center ${index % 2 === 0 ? '' : 'md:flex-row-reverse'}`}>
                  <div className="md:w-1/2 mb-4 md:mb-0 md:px-8 md:pr-12 md:text-right">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-xl font-bold text-[#212529] mb-2">{milestone.year}</h3>
                      <p className="text-[#6c757d]">{milestone.event}</p>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-white font-bold border-4 border-white shadow-md">
                      {index + 1}
                    </div>
                  </div>
                  <div className="md:w-1/2 md:px-8 md:pl-12 hidden md:block"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <TestingEquipmentSlider />

        <div className="bg-[#212529] text-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{pageContent?.certifications.title}</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">{pageContent?.certifications.subtitle}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-12 justify-items-center">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-[#343a40] p-4 rounded-lg shadow-lg w-full max-w-[200px] h-auto flex items-center justify-center">
                  <img src={`/images/certifications/cert${i}.webp`} alt={`Certification ${i}`} className="w-full h-auto object-contain" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center">
              {[7, 8, 9, 10, 11].map((i) => (
                <div key={i} className="bg-[#343a40] p-4 rounded-lg shadow-lg w-full max-w-[200px] h-auto flex items-center justify-center">
                  <img src={`/images/certifications/cert${i}.webp`} alt={`Certification ${i}`} className="w-full h-auto object-contain" />
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">{pageContent?.certifications.description}</p>
              <button className="bg-[#fdb827] hover:bg-[#e6a51e] text-[#212529] font-semibold py-3 px-8 rounded-lg transition duration-300">
                {pageContent?.certifications.cta}
              </button>
            </div>
          </div>
        </div>

        <div className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#212529] mb-4">{pageContent?.team.title}</h2>
              <p className="text-xl text-[#6c757d] max-w-3xl mx-auto">{pageContent?.team.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                ['Du', 'Dr Du Jingbiao', 'ceo'],
                ['Hu', 'Mr Hu Runyi', 'cto'],
                ['Li', 'Mr Li Xiaohua', 'engineer'],
                ['peng', 'Mr Peng Qian', 'qa'],
              ].map(([image, name, key]) => (
                <div key={name} className="text-center">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32 mx-auto mb-4 flex items-center justify-center text-gray-500">
                    <img src={`/images/about/${image}.${image === 'peng' ? 'webp' : 'jpg'}`} alt={name} className="w-full h-auto object-contain" />
                  </div>
                  <h3 className="text-xl font-bold text-[#212529] mb-1">{name}</h3>
                  <p className="text-[#fdb827] mb-2">{pageContent?.team.positions[key]}</p>
                  <p className="text-[#6c757d] text-sm">{pageContent?.team.experience[key]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="bg-gradient-to-r from-[#212529] to-[#343a40] rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{pageContent?.cta.title}</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">{pageContent?.cta.subtitle}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-[#fdb827] hover:bg-[#e6a51e] text-[#212529] font-semibold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105">
                {pageContent?.cta.buttons.contact}
              </button>
              <button className="bg-transparent border-2 border-white hover:bg-white hover:text-[#212529] text-white font-semibold py-3 px-8 rounded-lg transition duration-300">
                {pageContent?.cta.buttons.quote}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
