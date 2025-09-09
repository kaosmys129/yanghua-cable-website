import { Wrench, FileText, Package, Download } from 'lucide-react';

export default function ServicesPage() {
  const services = [
    {
      number: '01',
      title: 'Technical Support',
      description: 'Expert guidance from initial consultation through system commissioning',
      features: ['24/7 technical consultation', 'System design assistance', 'Installation supervision', 'Performance optimization'],
      icon: <Wrench className="w-8 h-8 text-gray-700" />,
    },
    {
      number: '02',
      title: 'Installation Guide',
      description: 'Comprehensive installation support with detailed documentation and training',
      features: ['Detailed installation manuals', 'Video tutorials', 'On-site training', 'Remote assistance'],
      icon: <FileText className="w-8 h-8 text-gray-700" />,
    },
    {
      number: '03',
      title: 'After-sales Service',
      description: 'Long-term support and maintenance to ensure optimal system performance',
      features: ['Preventive maintenance', 'Warranty service', 'Spare parts supply', 'System upgrades'],
      icon: <Package className="w-8 h-8 text-gray-700" />,
    },
    {
      number: '04',
      title: 'Download Center',
      description: 'Access technical documents, certifications, and resources 24/7',
      features: ['Product specifications', 'CAD drawings', 'Certification documents', 'Case studies'],
      icon: <Download className="w-8 h-8 text-gray-700" />,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#212529] mb-4">
            Service & Support
          </h1>
          <p className="text-xl text-[#6c757d] max-w-3xl mx-auto">
            Comprehensive support throughout your project lifecycle, from initial design to long-term maintenance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {services.map((service) => (
            <div key={service.title} className="card p-6 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-3xl font-bold tex-yellow-600 mb-2">{service.number}</div>
              <div className="mb-4">{service.icon}</div>
              <h3 className="text-xl font-semibold text-[#212529] mb-3">
                {service.title}
              </h3>
              <p className="text-[#6c757d] mb-4">
                {service.description}
              </p>
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

        <div className="bg-[#f8f9fa] rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-[#212529] mb-4">
            Need Technical Support?
          </h2>
          <p className="text-[#6c757d] mb-6">
            Our technical team is ready to assist with your specific requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary">
              Contact Technical Support
            </button>
            <button className="btn-secondary">
              Download Resources
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}