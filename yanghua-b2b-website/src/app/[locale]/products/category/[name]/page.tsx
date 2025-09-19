import Link from 'next/link';
import { notFound } from 'next/navigation';

interface ProductCategory {
  name: string;
  models: string[];
  applications: string[];
  description: string[];
  structure: string[];
  specifications: {
    ratedCurrent: string;
    ratedVoltage: string;
    ratedFrequency: string;
    protectionLevel: string;
    maxOperatingTemp: string;
  };
  coreConfigurations: string[];
}

// Simulate fetching product category data
async function getProductCategoryData(name: string): Promise<ProductCategory | null> {
  // In real applications, this would fetch data from API or database
  // Now we get data from b2b_website_data.json
  
  // Decode URL-encoded characters (e.g., %C3%B3 -> ó)
  const decodedName = decodeURIComponent(name);
  
  // Simulate data
  const categoryData: { [key: string]: ProductCategory } = {
    'general': {
      name: "General Purpose Cables",
      models: ["TMRVV", "TMRVSV"],
      applications: ["Indoor", "Outdoor"],
      description: [],
      structure: [
        "Copper wire conductors",
        "Winding layers", 
        "Insulation layers",
        "Metal armor layers",
        "Sheath layers"
      ],
      specifications: {
        ratedCurrent: "200-6300A",
        ratedVoltage: "≤3kV",
        ratedFrequency: "50Hz",
        protectionLevel: "IP68",
        maxOperatingTemp: "105℃"
      },
      coreConfigurations: [
        "4-core: A,B,C,N equal cross-section",
        "5-core: A,B,C,N,PE equal cross-section", 
        "3+1: A,B,C equal cross section, N 50% cross section (without PE)",
        "4+1: A,B,C,N equal cross section, PE 50%",
        "3+2: A,B,C equal cross section, N and PE 50% cross section"
      ]
    },
    'general-purpose-cables': {
      name: "General Purpose Cables",
      models: ["TMRVV", "TMRVSV"],
      applications: ["Indoor", "Outdoor", "Commercial Buildings", "Industrial Applications"],
      description: [],
      structure: [
        "Copper wire conductors",
        "Winding layers", 
        "Insulation layers",
        "Metal armor layers",
        "Sheath layers"
      ],
      specifications: {
        ratedCurrent: "200-6300A",
        ratedVoltage: "≤3kV",
        ratedFrequency: "50Hz",
        protectionLevel: "IP68",
        maxOperatingTemp: "105℃"
      },
      coreConfigurations: [
        "4-core: A,B,C,N equal cross-section",
        "5-core: A,B,C,N,PE equal cross-section", 
        "3+1: A,B,C equal cross section, N 50% cross section (without PE)",
        "4+1: A,B,C,N equal cross section, PE 50%",
        "3+2: A,B,C equal cross section, N and PE 50% cross section"
      ]
    },
    'flame-retardant': {
      name: "Flame-retardant",
      models: ["Z(A,B,C)-TMRVV", "Z(A,B,C)-TMRYY", "Z(A,B,C)-TMRYSY"],
      applications: ["In densely populated public places such as high-rise buildings, shopping malls, schools, subway stations, airports, sports stadiums, exhibition halls, hospitals, etc."],
      description: [],
      structure: [
        "Copper wire conductors",
        "Winding layers", 
        "Insulation layers",
        "Metal armor layers",
        "Sheath layers"
      ],
      specifications: {
        ratedCurrent: "200-6300A",
        ratedVoltage: "≤3kV",
        ratedFrequency: "50Hz",
        protectionLevel: "IP68",
        maxOperatingTemp: "105℃"
      },
      coreConfigurations: [
        "4-core: A,B,C,N equal cross-section",
        "5-core: A,B,C,N,PE equal cross-section", 
        "3+1: A,B,C equal cross section, N 50% cross section (without PE)",
        "4+1: A,B,C,N equal cross section, PE 50%",
        "3+2: A,B,C equal cross section, N and PE 50% cross section"
      ]
    },
    'fire-resistant': {
      name: "Fire-resistant", 
      models: ["Z(A,B,C)N-TMRVV", "Z(A,B,C)N-TMRYY", "Z(A,B,C)N-TMRYSY"],
      applications: ["Use fire-resistant and high-temperature resistant materials. In a fire environment, ensure normal and stable power supply for a certain period of time."],
      description: [],
      structure: [
        "Copper wire conductors",
        "Winding layers", 
        "Insulation layers",
        "Metal armor layers",
        "Sheath layers"
      ],
      specifications: {
        ratedCurrent: "200-6300A",
        ratedVoltage: "≤3kV",
        ratedFrequency: "50Hz",
        protectionLevel: "IP68",
        maxOperatingTemp: "105℃"
      },
      coreConfigurations: [
        "4-core: A,B,C,N equal cross-section",
        "5-core: A,B,C,N,PE equal cross-section", 
        "3+1: A,B,C equal cross section, N 50% cross section (without PE)",
        "4+1: A,B,C,N equal cross section, PE 50%",
        "3+2: A,B,C equal cross section, N and PE 50% cross section"
      ]
    },
    'low-smoke-halogen-free': {
      name: "Low smoke & halogen-free",
      models: ["WDZ(A,B,C)-TMRYY", "WDZ(A,B,C)N-TMRYY", "B1(60,90,α1)-WDZ(A,B,C)-TMRYY"],
      applications: ["The material does not contain halogens, and the corrosiveness of combustion products is low."],
      description: [],
      structure: [
        "Copper wire conductors",
        "Winding layers", 
        "Insulation layers",
        "Metal armor layers",
        "Sheath layers"
      ],
      specifications: {
        ratedCurrent: "200-6300A",
        ratedVoltage: "≤3kV",
        ratedFrequency: "50Hz",
        protectionLevel: "IP68",
        maxOperatingTemp: "105℃"
      },
      coreConfigurations: [
        "4-core: A,B,C,N equal cross-section",
        "5-core: A,B,C,N,PE equal cross-section", 
        "3+1: A,B,C equal cross section, N 50% cross section (without PE)",
        "4+1: A,B,C,N equal cross section, PE 50%",
        "3+2: A,B,C equal cross section, N and PE 50% cross section"
      ]
    },
    // Spanish category mappings
    'cables-de-propósito-general': {
      name: "Cables de Propósito General",
      models: ["TMRVV", "TMRVSV"],
      applications: ["Instalaciones interiores", "Instalaciones exteriores"],
      description: ["Cables estándar para instalaciones eléctricas generales y aplicaciones de transmisión de energía."],
      structure: [
        "Conductores de alambre de cobre",
        "Capas de bobinado", 
        "Capas de aislamiento",
        "Capas de armadura metálica",
        "Capas de vaina"
      ],
      specifications: {
        ratedCurrent: "200-6300A",
        ratedVoltage: "≤3kV",
        ratedFrequency: "50Hz",
        protectionLevel: "IP68",
        maxOperatingTemp: "105℃"
      },
      coreConfigurations: [
        "4-núcleos: A,B,C,N sección transversal igual",
        "5-núcleos: A,B,C,N,PE sección transversal igual", 
        "3+1: A,B,C sección transversal igual, N 50% sección transversal (sin PE)",
        "4+1: A,B,C,N sección transversal igual, PE 50%",
        "3+2: A,B,C sección transversal igual, N y PE 50% sección transversal"
      ]
    },
    'cables-retardantes-de-llama': {
      name: "Cables Retardantes de Llama",
      models: ["Z(A,B,C)-TMRVV", "Z(A,B,C)-TMRYY", "Z(A,B,C)-TMRYSY"],
      applications: [
        "Edificios de gran altura",
        "Centros comerciales",
        "Escuelas y universidades",
        "Sistemas de metro",
        "Aeropuertos",
        "Estadios deportivos",
        "Centros de exposiciones",
        "Hospitales"
      ],
      description: ["Cables con propiedades retardantes de llama para aplicaciones en lugares públicos densamente poblados."],
      structure: [
        "Conductores de alambre de cobre",
        "Capas de bobinado", 
        "Capas de aislamiento",
        "Capas de armadura metálica",
        "Capas de vaina"
      ],
      specifications: {
        ratedCurrent: "200-6300A",
        ratedVoltage: "≤3kV",
        ratedFrequency: "50Hz",
        protectionLevel: "IP68",
        maxOperatingTemp: "105℃"
      },
      coreConfigurations: [
        "4-núcleos: A,B,C,N sección transversal igual",
        "5-núcleos: A,B,C,N,PE sección transversal igual", 
        "3+1: A,B,C sección transversal igual, N 50% sección transversal (sin PE)",
        "4+1: A,B,C,N sección transversal igual, PE 50%",
        "3+2: A,B,C sección transversal igual, N y PE 50% sección transversal"
      ]
    },
    'cables-resistentes-al-fuego': {
      name: "Cables Resistentes al Fuego",
      models: ["Z(A,B,C)N-TMRVV", "Z(A,B,C)N-TMRYY", "Z(A,B,C)N-TMRYSY"],
      applications: ["Utilizan materiales resistentes al fuego y altas temperaturas. En un entorno de incendio, garantizan un suministro de energía normal y estable durante un cierto período de tiempo."],
      description: ["Cables diseñados para mantener la funcionalidad en condiciones de incendio."],
      structure: [
        "Conductores de alambre de cobre",
        "Capas de bobinado", 
        "Capas de aislamiento",
        "Capas de armadura metálica",
        "Capas de vaina"
      ],
      specifications: {
        ratedCurrent: "200-6300A",
        ratedVoltage: "≤3kV",
        ratedFrequency: "50Hz",
        protectionLevel: "IP68",
        maxOperatingTemp: "105℃"
      },
      coreConfigurations: [
        "4-núcleos: A,B,C,N sección transversal igual",
        "5-núcleos: A,B,C,N,PE sección transversal igual", 
        "3+1: A,B,C sección transversal igual, N 50% sección transversal (sin PE)",
        "4+1: A,B,C,N sección transversal igual, PE 50%",
        "3+2: A,B,C sección transversal igual, N y PE 50% sección transversal"
      ]
    },
    'cables-libres-de-humo-y-halógenos': {
      name: "Cables Libres de Humo y Halógenos",
      models: ["WDZ(A,B,C)-TMRYY", "WDZ(A,B,C)N-TMRYY", "B1(60,90,α1)-WDZ(A,B,C)-TMRYY"],
      applications: ["El material no contiene halógenos, y la corrosividad de los productos de combustión es baja."],
      description: ["Cables que no emiten humos tóxicos ni gases halógenos durante la combustión."],
      structure: [
        "Conductores de alambre de cobre",
        "Capas de bobinado", 
        "Capas de aislamiento",
        "Capas de armadura metálica",
        "Capas de vaina"
      ],
      specifications: {
        ratedCurrent: "200-6300A",
        ratedVoltage: "≤3kV",
        ratedFrequency: "50Hz",
        protectionLevel: "IP68",
        maxOperatingTemp: "105℃"
      },
      coreConfigurations: [
        "4-núcleos: A,B,C,N sección transversal igual",
        "5-núcleos: A,B,C,N,PE sección transversal igual", 
        "3+1: A,B,C sección transversal igual, N 50% sección transversal (sin PE)",
        "4+1: A,B,C,N sección transversal igual, PE 50%",
        "3+2: A,B,C sección transversal igual, N y PE 50% sección transversal"
      ]
    },
    'accessories-components': {
      name: "Accessories & Components",
      models: ["Connectors", "Terminals", "Supports"],
      applications: ["Complementary components for flexible busbar systems"],
      description: ["Accessories and components necessary for the installation and operation of cable systems."],
      structure: [
        "High-quality materials",
        "Ergonomic design", 
        "Corrosion resistance",
        "Easy installation"
      ],
      specifications: {
        ratedCurrent: "200-6300A",
        ratedVoltage: "≤3kV",
        ratedFrequency: "50Hz",
        protectionLevel: "IP68",
        maxOperatingTemp: "105℃"
      },
      coreConfigurations: [
        "Custom configurations according to application"
      ]
    },
    'accesorios-y-componentes': {
      name: "Accesorios y Componentes",
      models: ["Conectores", "Terminales", "Soportes"],
      applications: ["Componentes complementarios para sistemas de barras flexibles"],
      description: ["Accesorios y componentes necesarios para la instalación y funcionamiento de sistemas de cables."],
      structure: [
        "Materiales de alta calidad",
        "Diseño ergonómico", 
        "Resistencia a la corrosión",
        "Fácil instalación"
      ],
      specifications: {
        ratedCurrent: "200-6300A",
        ratedVoltage: "≤3kV",
        ratedFrequency: "50Hz",
        protectionLevel: "IP68",
        maxOperatingTemp: "105℃"
      },
      coreConfigurations: [
        "Configuraciones personalizadas según aplicación"
      ]
    },
    // English category mappings with -cables suffix
    'flame-retardant-cables': {
      name: "Flame Retardant Cables",
      models: ["Z(A,B,C)-TMRVV", "Z(A,B,C)-TMRYY", "Z(A,B,C)-TMRYSY"],
      applications: ["In densely populated public places such as high-rise buildings, shopping malls, schools, subway stations, airports, sports stadiums, exhibition halls, hospitals, etc."],
      description: ["Cables with flame retardant properties for applications in densely populated public places."],
      structure: [
        "Copper wire conductors",
        "Winding layers", 
        "Insulation layers",
        "Metal armor layers",
        "Sheath layers"
      ],
      specifications: {
        ratedCurrent: "200-6300A",
        ratedVoltage: "≤3kV",
        ratedFrequency: "50Hz",
        protectionLevel: "IP68",
        maxOperatingTemp: "105℃"
      },
      coreConfigurations: [
        "4-core: A,B,C,N equal cross-section",
        "5-core: A,B,C,N,PE equal cross-section", 
        "3+1: A,B,C equal cross section, N 50% cross section (without PE)",
        "4+1: A,B,C,N equal cross section, PE 50%",
        "3+2: A,B,C equal cross section, N and PE 50% cross section"
      ]
    },
    'fire-resistant-cables': {
      name: "Fire Resistant Cables", 
      models: ["Z(A,B,C)N-TMRVV", "Z(A,B,C)N-TMRYY", "Z(A,B,C)N-TMRYSY"],
      applications: ["Use fire-resistant and high-temperature resistant materials. In a fire environment, ensure normal and stable power supply for a certain period of time."],
      description: ["Cables designed to maintain functionality in fire conditions."],
      structure: [
        "Copper wire conductors",
        "Winding layers", 
        "Insulation layers",
        "Metal armor layers",
        "Sheath layers"
      ],
      specifications: {
        ratedCurrent: "200-6300A",
        ratedVoltage: "≤3kV",
        ratedFrequency: "50Hz",
        protectionLevel: "IP68",
        maxOperatingTemp: "105℃"
      },
      coreConfigurations: [
        "4-core: A,B,C,N equal cross-section",
        "5-core: A,B,C,N,PE equal cross-section", 
        "3+1: A,B,C equal cross section, N 50% cross section (without PE)",
        "4+1: A,B,C,N equal cross section, PE 50%",
        "3+2: A,B,C equal cross section, N and PE 50% cross section"
      ]
    },
    'low-smoke-halogen-free-cables': {
      name: "Low Smoke & Halogen-free Cables",
      models: ["WDZ(A,B,C)-TMRYY", "WDZ(A,B,C)N-TMRYY", "B1(60,90,α1)-WDZ(A,B,C)-TMRYY"],
      applications: ["The material does not contain halogens, and the corrosiveness of combustion products is low."],
      description: ["Cables that do not emit toxic smoke or halogen gases during combustion."],
      structure: [
        "Copper wire conductors",
        "Winding layers", 
        "Insulation layers",
        "Metal armor layers",
        "Sheath layers"
      ],
      specifications: {
        ratedCurrent: "200-6300A",
        ratedVoltage: "≤3kV",
        ratedFrequency: "50Hz",
        protectionLevel: "IP68",
        maxOperatingTemp: "105℃"
      },
      coreConfigurations: [
        "4-core: A,B,C,N equal cross-section",
        "5-core: A,B,C,N,PE equal cross-section", 
        "3+1: A,B,C equal cross section, N 50% cross section (without PE)",
        "4+1: A,B,C,N equal cross section, PE 50%",
        "3+2: A,B,C equal cross section, N and PE 50% cross section"
      ]
    }
  };
  
  return categoryData[decodedName] || null;
}

// Generate static params for all available categories
export async function generateStaticParams() {
  const categories = ['general', 'fire-resistant', 'halogen-free', 'low-smoke', 'special-purpose'];
  const locales = ['en', 'es'];
  
  const params = [];
  for (const locale of locales) {
    for (const name of categories) {
      params.push({ locale, name });
    }
  }
  
  return params;
}

interface PageProps {
  params: {
    name: string;
    locale: string;
  };
}

export default async function ProductCategoryPage({ params }: PageProps) {
  const { name } = params;
  const categoryData = await getProductCategoryData(name);

  if (!categoryData) {
    notFound();
  }

  return (
     <div className="min-h-screen bg-white">
      {/* Product category header */}
      <div className="relative h-96 bg-gradient-to-r from-gray-900 to-gray-700">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-3xl">
            <span className="text-yellow-500 text-sm font-semibold tracking-wide uppercase">
              Product Category
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-2 mb-4">
              {categoryData.name} Flexible Busbar
            </h1>
            <p className="text-xl text-gray-200">
              High-performance flexible busbar solutions for diverse applications
            </p>
          </div>
        </div>
      </div>

      {/* Product category details content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Product overview */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Product Overview</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Our {categoryData.name} flexible busbar systems are engineered to deliver exceptional performance and reliability. 
                These solutions are designed for a wide range of applications, providing safe and efficient power transmission.
              </p>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Applications</h3>
                <div className="flex flex-wrap gap-2">
                  {categoryData.applications.map((application, index) => (
                    <span key={index} className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-medium">
                      {application}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Product structure */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Product Structure</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categoryData.structure.map((item, index) => (
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

            {/* Technical specifications */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Technical Specifications</h2>
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Rated Current</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{categoryData.specifications.ratedCurrent}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Rated Voltage</td>
      
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{categoryData.specifications.ratedVoltage}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Rated Frequency</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{categoryData.specifications.ratedFrequency}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Protection Level</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{categoryData.specifications.protectionLevel}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Max Operating Temperature</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{categoryData.specifications.maxOperatingTemp}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Core configuration */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Core Configurations</h2>
              <div className="space-y-4">
                {categoryData.coreConfigurations.map((config, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-yellow-500 flex items-center justify-center mr-4 mt-1">
                      <span className="text-xs font-bold text-gray-900">{index + 1}</span>
                    </div>
                    <p className="text-gray-600">{config}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Product gallery */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Product Gallery</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Product images can be added here */}
                {[1, 2, 3].map((item, index) => (
                  <div key={index} className="relative h-64 rounded-lg overflow-hidden shadow-lg">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-full flex items-center justify-center">
                      <span className="text-gray-500">Product Image {item}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Product comparison section can be added here */}

          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-8">
            {/* Quick inquiry */}
            <div className="bg-yellow-500 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inquire About This Category</h3>
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

            {/* Back to product list */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Browse Other Categories</h3>
              <Link href="/products">
                <button className="btn-primary w-full">
                  Back to Product List
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}