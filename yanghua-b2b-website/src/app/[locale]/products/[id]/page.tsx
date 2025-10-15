import Image from 'next/image';
import { notFound } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  description: string;
  detailedDescription: string;
  applications: string[];
  features: string[];
  technicalSpecs: {
    voltage: string;
    current: string;
    material: string;
    temperature: string;
    insulation: string;
    standards: string;
  };
  images: string[];
  relatedProducts: string[];
}

// Simulate product data fetching function
async function getProduct(id: string): Promise<Product | null> {
  // Simulate product data
  const products: { [key: string]: Product } = {
        'flexible-busbar-2000a': {
          id: 'flexible-busbar-2000a',
          name: '2000A Flexible Busbar System',
          description: 'High-current flexible busbar system for efficient power transmission',
          detailedDescription: 'Our 2000A flexible busbar system is designed for high-power applications in new energy, data centers, and industrial facilities. With superior conductivity and flexibility, it provides a reliable and efficient solution for power distribution.',
          applications: [
            'New Energy Power Plants',
            'Data Centers',
            'Industrial Manufacturing',
            'Commercial Buildings'
          ],
          features: [
            'High Current Capacity: 2000A rated current ensures stable power transmission',
            'Flexible Design: Adapt to complex installation environments and reduce installation difficulty',
            'Low Resistance: High-conductivity copper material reduces energy loss',
            'High Safety: Insulation protection and reliable connection design',
            'Easy Maintenance: Modular design for easy installation and maintenance',
            'Environmental Adaptability: Resistant to high temperature, humidity, and corrosion'
          ],
          technicalSpecs: {
            voltage: '1000V AC/1500V DC',
            current: '2000A',
            material: 'High-purity Copper + Insulation Sheath',
            temperature: '-40°C to +105°C',
            insulation: 'Cross-linked Polyethylene (XLPE)',
            standards: 'IEC 60228, IEC 60454'
          },
          images: ['/images/no-image-available.webp', '/images/no-image-available.webp', '/images/no-image-available.webp'],
          relatedProducts: ['flexible-busbar-1500a', 'flexible-busbar-2500a', 'insulation-accessories']
        }
      };
      
      return products[id] || null;
}

// Generate static params for all available products
export async function generateStaticParams() {
  const productIds = ['flexible-busbar-2000a', 'flexible-busbar-1500a', 'flexible-busbar-2500a', 'insulation-accessories'];
  const locales = ['en', 'es'];
  
  const params = [];
  for (const locale of locales) {
    for (const id of productIds) {
      params.push({ locale, id });
    }
  }
  
  return params;
}

interface PageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  // SEO: Product structured data (JSON-LD)
  const baseUrl = 'https://www.yhflexiblebusbar.com';
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    brand: { '@type': 'Brand', name: 'Yanghua' },
    sku: product.id,
    image: product.images?.length
      ? product.images.map((src) => `${baseUrl}${src}`)
      : undefined,
  };

  // Placeholder image component
  const PlaceholderImage = ({ className }: { className?: string }) => (
    <div className={`bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center ${className}`}>
      <span className="text-gray-500 text-sm">Image Not Available</span>
    </div>
  );

  // Simple image component for server rendering
  const ProductImage = ({ src, alt, className, priority = false, sizes = '100vw' }: { src: string; alt: string; className?: string; priority?: boolean; sizes?: string }) => {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={`object-cover ${className}`}
      />
    );
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="min-h-screen bg-white">
      {/* Product header */}
      <div className="relative h-96 bg-gradient-to-r from-gray-900 to-gray-700">
        <div className="absolute inset-0">
          {product.images[0] ? (
            <ProductImage
              src={product.images[0]}
              alt={product.name}
              className="opacity-50"
              priority
              sizes="(max-width: 768px) 100vw, 100vw"
            />
          ) : (
            <PlaceholderImage className="w-full h-full opacity-50" />
          )}
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-3xl">
            <span className="text-yellow-500 text-sm font-semibold tracking-wide uppercase">
              Flexible Busbar System
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-2 mb-4">
              {product.name}
            </h1>
            <p className="text-xl text-gray-200">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {/* Product details content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main content */}
          <div className="lg:col-span-2">
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Product Overview</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                {product.detailedDescription}
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Key Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  "Safe & Reliable: Combine partial cable manufacturing technology and original fine craftsmanship. Integrate machine assembly lines for standardized production. Comprehensive testing system and strict quality control. Real-time online monitoring of flexible busbar current, voltage, temperature, etc.",
                  "Convenient & Efficient: Compact structure with small volume, easy to store and transport. Flexible and lightweight, easy to construct, lay and install. Integrated long-distance laying without the need for multiple accessories. Suitable for various space sizes, and high flexibility in renovation.",
                  "Better Performance: High protection level, moisture-proof, water-resistant, and high-temperature resistant, suitable for outdoor and humid environments. No eddy currents, good heat dissipation performance, low temperature rise, high current carrying capacity, low line loss, and high electrical efficiency.",
                  "Higher Cost Performance: Within equal current carrying capacity, copper wire conductors have high current density and low material cost. Less accessories, lower cost. Low construction difficulty, short construction period, and low construction cost. Low failure rate and low maintenance cost."
                ].map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-yellow-500 flex items-center justify-center mr-4 mt-1">
                      <svg className="h-4 w-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-600">{feature}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Product Structure</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  "Copper wire conductors",
                  "Winding layers",
                  "Insulation layers",
                  "Metal armor layers",
                  "Sheath layers"
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-yellow-500 flex items-center justify-center mr-4 mt-1">
                      <svg className="h-4 w-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-600">{item}</p>
                  </div>
                ))}
              </div>
            </section>
            
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Name Explanation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { code: "TMR", meaning: "Flexible busbar" },
                  { code: "V", meaning: "PVC insulation" },
                  { code: "S", meaning: "Aluminum alloy armor" },
                  { code: "T", meaning: "Copper alloy armor" },
                  { code: "V", meaning: "PVC Sheath" },
                  { code: "Y", meaning: "Polyolefins" }
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-yellow-500 flex items-center justify-center mr-4 mt-1">
                      <span className="text-xs font-bold text-gray-900">{item.code}</span>
                    </div>
                    <p className="text-gray-600">{item.meaning}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Technical Specifications</h2>
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Rated Voltage</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">AC 380V/220V</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Rated Current</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">200-6300A</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Operating Temperature</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-40℃~+90℃</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Insulation Resistance</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">≥1000MΩ</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Dielectric Strength</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3750V AC/minute</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Protection Level</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">IP66</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Material</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Copper conductor, aluminum housing</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Installation</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Horizontal or vertical mounting</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Application Scenarios</h2>
              <div className="flex flex-wrap gap-2">
                {product.applications.map((application, index) => (
                  <span key={index} className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-medium">
                    {application}
                  </span>
                ))}
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Product Gallery</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {product.images.map((image, index) => (
                  <div key={index} className="relative h-64 rounded-lg overflow-hidden shadow-lg">
                    {image ? (
                      <ProductImage
                        src={image}
                        alt={`Product image ${index + 1}`}
                        className="transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <PlaceholderImage className="w-full h-full" />
                    )}
                  </div>
                ))}
              </div>
            </section>
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Product Comparison</h2>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8">
                <h3 className="text-xl font-semibold text-gray-900 p-4 bg-gray-50">Yanghua STI Flexible Busbar vs Traditional Solutions</h3>
                <div className="flex justify-center p-4">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32" />
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flexible Busbar</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Multiple Cables</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Performance</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Good resistance consistency and low heat generation</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Each resistor has a different value, resulting in differences in current flow and making it prone to heating</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Installation</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Small size, compact structure, easy installation; Specialized T-connector with high safety factor</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Multi splicing has a large volume and weight, and the joints are difficult to handle, which poses certain safety hazards</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Capacity</td>
                      <td className="px-6 py-4 text-sm text-gray-600">The product has a current carrying capacity of 200-6300A and does not require derating</td>
                      <td className="px-6 py-4 text-sm text-gray-600">A single unit has a small current carrying capacity and requires multiple splicing and capacity reduction for use</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Overall Cost</td>
                      <td className="px-6 py-4 text-sm text-gray-600">High current density, significant copper savings, and higher cost-effectiveness</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Low current density, more copper is used, and the cost-effectiveness is lower</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <h3 className="text-xl font-semibold text-gray-900 p-4 bg-gray-50">Flexible Busbar vs Compact Busbar</h3>
                <div className="flex justify-center p-4">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32" />
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flexible Busbar</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compact Busbar</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Shape and Volume</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Neat, tight and clear</td>
                      <td className="px-6 py-4 text-sm text-gray-600">It takes up a lot of installation space</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Overload Capacity</td>
                      <td className="px-6 py-4 text-sm text-gray-600">When the temperature rises by 135K and the surrounding environment temperature is 40°C, the overload capacity can withstand more than 33%</td>
                      <td className="px-6 py-4 text-sm text-gray-600">When the temperature rises by 70K and the surrounding environment temperature is 30°C, the overload capacity can withstand 15%</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Installation and Construction</td>
                      <td className="px-6 py-4 text-sm text-gray-600">The on-site assembly of flexible busbar is easy to construct, easy to install and disassemble, and can be rearranged as needed. The branch circuit can be modified without affecting the overall power supply when the main circuit is live</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Need to assemble in factory in advance, and the construction difficulty is high. If there is design change happens on site, products need to be returned to the factory. Low reuse rate, unable to carry out live branch operations</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Emergency Management</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Emergency backup can be used in case of system failure, utilizing the backup circuit conversion box can quickly restore power supply and improve system power supply stability</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Due to an accident requiring power outage for maintenance, it is impossible to restore power supply in a timely manner</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Line Loss and Energy Consumption</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Low temperature rise, low energy consumption, energy-saving, and the larger the current specification, the more superior its energy consumption value is displayed</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Poor heat dissipation, high line loss, and energy consumption exceeding 20%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick inquiry */}
            <div className="bg-yellow-500 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inquire About This Product</h3>
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                />
                <input
                  type="text"
                  placeholder="Company"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                />
                <textarea
                  placeholder="Product Requirements"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button
                  type="submit"
                  className="w-full bg-gray-900 text-white py-2 rounded-md font-semibold hover:bg-gray-800 transition-colors"
                >
                  Submit Inquiry
                </button>
              </form>
            </div>

            {/* Related products */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Products</h3>
              <div className="space-y-4">
                {product.relatedProducts.map((relatedProduct, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                    <div className="ml-4">
                      <div className="font-medium text-gray-900">{relatedProduct}</div>
                      <div className="text-sm text-gray-600">Product Description</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}