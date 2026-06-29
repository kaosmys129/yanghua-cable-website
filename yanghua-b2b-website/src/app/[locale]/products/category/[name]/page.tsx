import Link from 'next/link';
import { notFound } from 'next/navigation';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { getLocalizedPath } from '@/lib/url-localization';
import type { Metadata } from 'next';
import TechSpecsTable from '@/components/products/TechSpecsTable';
import CTAButtons from '@/components/products/CTAButtons';
import ProductComparison from '@/components/products/ProductComparison';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Info,
  Layers,
  Cpu,
  Wrench,
  ImageIcon,
  CheckCircle2,
  ArrowLeft,
  Tag,
  MessagesSquare,
  Grid3X3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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

async function getProductCategoryData(name: string): Promise<ProductCategory | null> {
  const decodedName = decodeURIComponent(name);

  const categoryData: { [key: string]: ProductCategory } = {
    'general': {
      name: 'General Purpose Cables',
      models: ['TMRVV', 'TMRVSV'],
      applications: ['Indoor', 'Outdoor'],
      description: ['High-performance flexible busbar systems for general electrical installations and power transmission applications.'],
      structure: [
        'Copper wire conductors',
        'Winding layers',
        'Insulation layers',
        'Metal armor layers',
        'Sheath layers',
      ],
      specifications: {
        ratedCurrent: '200-6300A',
        ratedVoltage: '≤3kV',
        ratedFrequency: '50Hz',
        protectionLevel: 'IP68',
        maxOperatingTemp: '105℃',
      },
      coreConfigurations: [
        '4-core: A,B,C,N equal cross-section',
        '5-core: A,B,C,N,PE equal cross-section',
        '3+1: A,B,C equal cross section, N 50% cross section (without PE)',
        '4+1: A,B,C,N equal cross section, PE 50%',
        '3+2: A,B,C equal cross section, N and PE 50% cross section',
      ],
    },
    'general-purpose-cables': {
      name: 'General Purpose Cables',
      models: ['TMRVV', 'TMRVSV'],
      applications: ['Indoor', 'Outdoor', 'Commercial Buildings', 'Industrial Applications'],
      description: ['High-performance flexible busbar systems for general electrical installations and power transmission applications.'],
      structure: [
        'Copper wire conductors',
        'Winding layers',
        'Insulation layers',
        'Metal armor layers',
        'Sheath layers',
      ],
      specifications: {
        ratedCurrent: '200-6300A',
        ratedVoltage: '≤3kV',
        ratedFrequency: '50Hz',
        protectionLevel: 'IP68',
        maxOperatingTemp: '105℃',
      },
      coreConfigurations: [
        '4-core: A,B,C,N equal cross-section',
        '5-core: A,B,C,N,PE equal cross-section',
        '3+1: A,B,C equal cross section, N 50% cross section (without PE)',
        '4+1: A,B,C,N equal cross section, PE 50%',
        '3+2: A,B,C equal cross section, N and PE 50% cross section',
      ],
    },
    'flame-retardant': {
      name: 'Flame-retardant',
      models: ['Z(A,B,C)-TMRVV', 'Z(A,B,C)-TMRYY', 'Z(A,B,C)-TMRYSY'],
      applications: [
        'High-rise buildings',
        'Shopping malls',
        'Schools',
        'Subway stations',
        'Airports',
        'Sports stadiums',
        'Exhibition halls',
        'Hospitals',
      ],
      description: ['Cables with flame retardant properties for applications in densely populated public places.'],
      structure: [
        'Copper wire conductors',
        'Winding layers',
        'Insulation layers',
        'Metal armor layers',
        'Sheath layers',
      ],
      specifications: {
        ratedCurrent: '200-6300A',
        ratedVoltage: '≤3kV',
        ratedFrequency: '50Hz',
        protectionLevel: 'IP68',
        maxOperatingTemp: '105℃',
      },
      coreConfigurations: [
        '4-core: A,B,C,N equal cross-section',
        '5-core: A,B,C,N,PE equal cross-section',
        '3+1: A,B,C equal cross section, N 50% cross section (without PE)',
        '4+1: A,B,C,N equal cross section, PE 50%',
        '3+2: A,B,C equal cross section, N and PE 50% cross section',
      ],
    },
    'fire-resistant': {
      name: 'Fire-resistant',
      models: ['Z(A,B,C)N-TMRVV', 'Z(A,B,C)N-TMRYY', 'Z(A,B,C)N-TMRYSY'],
      applications: [
        'Use fire-resistant and high-temperature resistant materials. In a fire environment, ensure normal and stable power supply for a certain period of time.',
      ],
      description: ['Cables designed to maintain functionality in fire conditions.'],
      structure: [
        'Copper wire conductors',
        'Winding layers',
        'Insulation layers',
        'Metal armor layers',
        'Sheath layers',
      ],
      specifications: {
        ratedCurrent: '200-6300A',
        ratedVoltage: '≤3kV',
        ratedFrequency: '50Hz',
        protectionLevel: 'IP68',
        maxOperatingTemp: '105℃',
      },
      coreConfigurations: [
        '4-core: A,B,C,N equal cross-section',
        '5-core: A,B,C,N,PE equal cross-section',
        '3+1: A,B,C equal cross section, N 50% cross section (without PE)',
        '4+1: A,B,C,N equal cross section, PE 50%',
        '3+2: A,B,C equal cross section, N and PE 50% cross section',
      ],
    },
    'low-smoke-halogen-free': {
      name: 'Low smoke & halogen-free',
      models: ['WDZ(A,B,C)-TMRYY', 'WDZ(A,B,C)N-TMRYY', 'B1(60,90,α1)-WDZ(A,B,C)-TMRYY'],
      applications: [
        'The material does not contain halogens, and the corrosiveness of combustion products is low.',
      ],
      description: ['Cables that do not emit toxic smoke or halogen gases during combustion.'],
      structure: [
        'Copper wire conductors',
        'Winding layers',
        'Insulation layers',
        'Metal armor layers',
        'Sheath layers',
      ],
      specifications: {
        ratedCurrent: '200-6300A',
        ratedVoltage: '≤3kV',
        ratedFrequency: '50Hz',
        protectionLevel: 'IP68',
        maxOperatingTemp: '105℃',
      },
      coreConfigurations: [
        '4-core: A,B,C,N equal cross-section',
        '5-core: A,B,C,N,PE equal cross-section',
        '3+1: A,B,C equal cross section, N 50% cross section (without PE)',
        '4+1: A,B,C,N equal cross section, PE 50%',
        '3+2: A,B,C equal cross section, N and PE 50% cross section',
      ],
    },
    'cables-de-propósito-general': {
      name: 'Cables de Propósito General',
      models: ['TMRVV', 'TMRVSV'],
      applications: ['Instalaciones interiores', 'Instalaciones exteriores'],
      description: ['Cables estándar para instalaciones eléctricas generales y aplicaciones de transmisión de energía.'],
      structure: [
        'Conductores de alambre de cobre',
        'Capas de bobinado',
        'Capas de aislamiento',
        'Capas de armadura metálica',
        'Capas de vaina',
      ],
      specifications: {
        ratedCurrent: '200-6300A',
        ratedVoltage: '≤3kV',
        ratedFrequency: '50Hz',
        protectionLevel: 'IP68',
        maxOperatingTemp: '105℃',
      },
      coreConfigurations: [
        '4-núcleos: A,B,C,N sección transversal igual',
        '5-núcleos: A,B,C,N,PE sección transversal igual',
        '3+1: A,B,C sección transversal igual, N 50% sección transversal (sin PE)',
        '4+1: A,B,C,N sección transversal igual, PE 50%',
        '3+2: A,B,C sección transversal igual, N y PE 50% sección transversal',
      ],
    },
    'cables-de-uso-general': {
      name: 'Cables de Propósito General',
      models: ['TMRVV', 'TMRVSV'],
      applications: ['Instalaciones interiores', 'Instalaciones exteriores'],
      description: ['Cables estándar para instalaciones eléctricas generales y aplicaciones de transmisión de energía.'],
      structure: [
        'Conductores de alambre de cobre',
        'Capas de bobinado',
        'Capas de aislamiento',
        'Capas de armadura metálica',
        'Capas de vaina',
      ],
      specifications: {
        ratedCurrent: '200-6300A',
        ratedVoltage: '≤3kV',
        ratedFrequency: '50Hz',
        protectionLevel: 'IP68',
        maxOperatingTemp: '105℃',
      },
      coreConfigurations: [
        '4-núcleos: A,B,C,N sección transversal igual',
        '5-núcleos: A,B,C,N,PE sección transversal igual',
        '3+1: A,B,C sección transversal igual, N 50% sección transversal (sin PE)',
        '4+1: A,B,C,N sección transversal igual, PE 50%',
        '3+2: A,B,C sección transversal igual, N y PE 50% sección transversal',
      ],
    },
    'cables-retardantes-de-llama': {
      name: 'Cables Retardantes de Llama',
      models: ['Z(A,B,C)-TMRVV', 'Z(A,B,C)-TMRYY', 'Z(A,B,C)-TMRYSY'],
      applications: [
        'Edificios de gran altura',
        'Centros comerciales',
        'Escuelas y universidades',
        'Sistemas de metro',
        'Aeropuertos',
        'Estadios deportivos',
        'Centros de exposiciones',
        'Hospitales',
      ],
      description: ['Cables con propiedades retardantes de llama para aplicaciones en lugares públicos densamente poblados.'],
      structure: [
        'Conductores de alambre de cobre',
        'Capas de bobinado',
        'Capas de aislamiento',
        'Capas de armadura metálica',
        'Capas de vaina',
      ],
      specifications: {
        ratedCurrent: '200-6300A',
        ratedVoltage: '≤3kV',
        ratedFrequency: '50Hz',
        protectionLevel: 'IP68',
        maxOperatingTemp: '105℃',
      },
      coreConfigurations: [
        '4-núcleos: A,B,C,N sección transversal igual',
        '5-núcleos: A,B,C,N,PE sección transversal igual',
        '3+1: A,B,C sección transversal igual, N 50% sección transversal (sin PE)',
        '4+1: A,B,C,N sección transversal igual, PE 50%',
        '3+2: A,B,C sección transversal igual, N y PE 50% sección transversal',
      ],
    },
    'cables-resistentes-al-fuego': {
      name: 'Cables Resistentes al Fuego',
      models: ['Z(A,B,C)N-TMRVV', 'Z(A,B,C)N-TMRYY', 'Z(A,B,C)N-TMRYSY'],
      applications: [
        'Utilizan materiales resistentes al fuego y altas temperaturas. En un entorno de incendio, garantizan un suministro de energía normal y estable durante un cierto período de tiempo.',
      ],
      description: ['Cables diseñados para mantener la funcionalidad en condiciones de incendio.'],
      structure: [
        'Conductores de alambre de cobre',
        'Capas de bobinado',
        'Capas de aislamiento',
        'Capas de armadura metálica',
        'Capas de vaina',
      ],
      specifications: {
        ratedCurrent: '200-6300A',
        ratedVoltage: '≤3kV',
        ratedFrequency: '50Hz',
        protectionLevel: 'IP68',
        maxOperatingTemp: '105℃',
      },
      coreConfigurations: [
        '4-núcleos: A,B,C,N sección transversal igual',
        '5-núcleos: A,B,C,N,PE sección transversal igual',
        '3+1: A,B,C sección transversal igual, N 50% sección transversal (sin PE)',
        '4+1: A,B,C,N sección transversal igual, PE 50%',
        '3+2: A,B,C sección transversal igual, N y PE 50% sección transversal',
      ],
    },
    'cables-libres-de-humo-y-halógenos': {
      name: 'Cables Libres de Humo y Halógenos',
      models: ['WDZ(A,B,C)-TMRYY', 'WDZ(A,B,C)N-TMRYY', 'B1(60,90,α1)-WDZ(A,B,C)-TMRYY'],
      applications: [
        'El material no contiene halógenos, y la corrosividad de los productos de combustión es baja.',
      ],
      description: ['Cables que no emiten humos tóxicos ni gases halógenos durante la combustión.'],
      structure: [
        'Conductores de alambre de cobre',
        'Capas de bobinado',
        'Capas de aislamiento',
        'Capas de armadura metálica',
        'Capas de vaina',
      ],
      specifications: {
        ratedCurrent: '200-6300A',
        ratedVoltage: '≤3kV',
        ratedFrequency: '50Hz',
        protectionLevel: 'IP68',
        maxOperatingTemp: '105℃',
      },
      coreConfigurations: [
        '4-núcleos: A,B,C,N sección transversal igual',
        '5-núcleos: A,B,C,N,PE sección transversal igual',
        '3+1: A,B,C sección transversal igual, N 50% sección transversal (sin PE)',
        '4+1: A,B,C,N sección transversal igual, PE 50%',
        '3+2: A,B,C sección transversal igual, N y PE 50% sección transversal',
      ],
    },
    'accessories-components': {
      name: 'Accessories & Components',
      models: ['Connectors', 'Terminals', 'Supports'],
      applications: ['Complementary components for flexible busbar systems'],
      description: ['Accessories and components necessary for the installation and operation of cable systems.'],
      structure: [
        'High-quality materials',
        'Ergonomic design',
        'Corrosion resistance',
        'Easy installation',
      ],
      specifications: {
        ratedCurrent: '200-6300A',
        ratedVoltage: '≤3kV',
        ratedFrequency: '50Hz',
        protectionLevel: 'IP68',
        maxOperatingTemp: '105℃',
      },
      coreConfigurations: ['Custom configurations according to application'],
    },
    'accesorios-y-componentes': {
      name: 'Accesorios y Componentes',
      models: ['Conectores', 'Terminales', 'Soportes'],
      applications: ['Componentes complementarios para sistemas de barras flexibles'],
      description: ['Accesorios y componentes necesarios para la instalación y funcionamiento de sistemas de cables.'],
      structure: [
        'Materiales de alta calidad',
        'Diseño ergonómico',
        'Resistencia a la corrosión',
        'Fácil instalación',
      ],
      specifications: {
        ratedCurrent: '200-6300A',
        ratedVoltage: '≤3kV',
        ratedFrequency: '50Hz',
        protectionLevel: 'IP68',
        maxOperatingTemp: '105℃',
      },
      coreConfigurations: ['Configuraciones personalizadas según aplicación'],
    },
    'flame-retardant-cables': {
      name: 'Flame Retardant Cables',
      models: ['Z(A,B,C)-TMRVV', 'Z(A,B,C)-TMRYY', 'Z(A,B,C)-TMRYSY'],
      applications: [
        'High-rise buildings',
        'Shopping malls',
        'Schools',
        'Subway stations',
        'Airports',
        'Sports stadiums',
        'Exhibition halls',
        'Hospitals',
      ],
      description: ['Cables with flame retardant properties for applications in densely populated public places.'],
      structure: [
        'Copper wire conductors',
        'Winding layers',
        'Insulation layers',
        'Metal armor layers',
        'Sheath layers',
      ],
      specifications: {
        ratedCurrent: '200-6300A',
        ratedVoltage: '≤3kV',
        ratedFrequency: '50Hz',
        protectionLevel: 'IP68',
        maxOperatingTemp: '105℃',
      },
      coreConfigurations: [
        '4-core: A,B,C,N equal cross-section',
        '5-core: A,B,C,N,PE equal cross-section',
        '3+1: A,B,C equal cross section, N 50% cross section (without PE)',
        '4+1: A,B,C,N equal cross section, PE 50%',
        '3+2: A,B,C equal cross section, N and PE 50% cross section',
      ],
    },
    'fire-resistant-cables': {
      name: 'Fire Resistant Cables',
      models: ['Z(A,B,C)N-TMRVV', 'Z(A,B,C)N-TMRYY', 'Z(A,B,C)N-TMRYSY'],
      applications: [
        'Use fire-resistant and high-temperature resistant materials. In a fire environment, ensure normal and stable power supply for a certain period of time.',
      ],
      description: ['Cables designed to maintain functionality in fire conditions.'],
      structure: [
        'Copper wire conductors',
        'Winding layers',
        'Insulation layers',
        'Metal armor layers',
        'Sheath layers',
      ],
      specifications: {
        ratedCurrent: '200-6300A',
        ratedVoltage: '≤3kV',
        ratedFrequency: '50Hz',
        protectionLevel: 'IP68',
        maxOperatingTemp: '105℃',
      },
      coreConfigurations: [
        '4-core: A,B,C,N equal cross-section',
        '5-core: A,B,C,N,PE equal cross-section',
        '3+1: A,B,C equal cross section, N 50% cross section (without PE)',
        '4+1: A,B,C,N equal cross section, PE 50%',
        '3+2: A,B,C equal cross section, N and PE 50% cross section',
      ],
    },
    'low-smoke-halogen-free-cables': {
      name: 'Low Smoke & Halogen-free Cables',
      models: ['WDZ(A,B,C)-TMRYY', 'WDZ(A,B,C)N-TMRYY', 'B1(60,90,α1)-WDZ(A,B,C)-TMRYY'],
      applications: [
        'The material does not contain halogens, and the corrosiveness of combustion products is low.',
      ],
      description: ['Cables that do not emit toxic smoke or halogen gases during combustion.'],
      structure: [
        'Copper wire conductors',
        'Winding layers',
        'Insulation layers',
        'Metal armor layers',
        'Sheath layers',
      ],
      specifications: {
        ratedCurrent: '200-6300A',
        ratedVoltage: '≤3kV',
        ratedFrequency: '50Hz',
        protectionLevel: 'IP68',
        maxOperatingTemp: '105℃',
      },
      coreConfigurations: [
        '4-core: A,B,C,N equal cross-section',
        '5-core: A,B,C,N,PE equal cross-section',
        '3+1: A,B,C equal cross section, N 50% cross section (without PE)',
        '4+1: A,B,C,N equal cross section, PE 50%',
        '3+2: A,B,C equal cross section, N and PE 50% cross section',
      ],
    },
  };

  return categoryData[decodedName] || null;
}

export async function generateStaticParams() {
  const categories = [
    'general',
    'general-purpose-cables',
    'flame-retardant',
    'flame-retardant-cables',
    'fire-resistant',
    'fire-resistant-cables',
    'low-smoke-halogen-free',
    'low-smoke-halogen-free-cables',
    'cables-de-propósito-general',
    'cables-de-uso-general',
    'cables-retardantes-de-llama',
    'cables-resistentes-al-fuego',
    'cables-libres-de-humo-y-halógenos',
  ];
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
  const { name, locale } = params;
  const categoryData = await getProductCategoryData(name);

  if (!categoryData) {
    notFound();
  }

  const isEs = locale === 'es';

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD Breadcrumbs */}
      {(() => {
        const baseUrl = 'https://www.yhflexiblebusbar.com';
        const breadcrumbJsonLd = {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/en` },
            { '@type': 'ListItem', position: 2, name: 'Products', item: `${baseUrl}/en/products` },
            { '@type': 'ListItem', position: 3, name: categoryData?.name || name, item: `${baseUrl}/en/products/category/${name}` },
          ],
        };
        return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />;
      })()}

      {/* Hero */}
      <div className="relative h-96 bg-gradient-to-r from-gray-900 to-gray-700 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 text-yellow-400 border-yellow-400/50 bg-yellow-400/10 text-sm">
              {isEs ? 'Categoría de Producto' : 'Product Category'}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-2 mb-4 tracking-tight">
              {categoryData.name} {isEs ? 'Barra Flexible' : 'Flexible Busbar'}
            </h1>
            <p className="text-xl text-gray-200">
              {isEs
                ? 'Soluciones de barras colectoras flexibles de alto rendimiento para diversas aplicaciones'
                : 'High-performance flexible busbar solutions for diverse applications'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Product Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  {isEs ? 'Resumen del Producto' : 'Product Overview'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {isEs
                    ? `Nuestros sistemas de barras colectoras flexibles ${categoryData.name} están diseñados para ofrecer un rendimiento y fiabilidad excepcionales. Estas soluciones están diseñadas para una amplia gama de aplicaciones, proporcionando una transmisión de energía segura y eficiente.`
                    : `Our ${categoryData.name} flexible busbar systems are engineered to deliver exceptional performance and reliability. These solutions are designed for a wide range of applications, providing safe and efficient power transmission.`}
                </p>

                {/* Models */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4 text-primary" />
                    {isEs ? 'Modelos Disponibles' : 'Available Models'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categoryData.models.map((model, idx) => (
                      <Badge key={idx} variant="secondary" className="font-mono text-sm py-1.5 px-3">
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Applications */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    {isEs ? 'Aplicaciones' : 'Applications'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categoryData.applications.map((app, idx) => (
                      <Badge key={idx} variant="outline" className="text-sm py-1.5 px-3">
                        {app}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Structure - Accordion */}
            <Accordion type="single" collapsible defaultValue="structure">
              <AccordionItem value="structure">
                <AccordionTrigger className="text-lg font-semibold">
                  <span className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    {isEs ? 'Estructura del Producto' : 'Product Structure'}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {categoryData.structure.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center mt-0.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Technical Specifications */}
            <TechSpecsTable
              items={[
                { label: isEs ? 'Corriente Nominal' : 'Rated Current', value: categoryData.specifications.ratedCurrent },
                { label: isEs ? 'Voltaje Nominal' : 'Rated Voltage', value: categoryData.specifications.ratedVoltage },
                { label: isEs ? 'Frecuencia Nominal' : 'Rated Frequency', value: categoryData.specifications.ratedFrequency },
                { label: isEs ? 'Nivel de Protección' : 'Protection Level', value: categoryData.specifications.protectionLevel },
                { label: isEs ? 'Temperatura Máx. de Operación' : 'Max Operating Temperature', value: categoryData.specifications.maxOperatingTemp },
              ]}
              title={isEs ? 'Especificaciones Técnicas' : 'Technical Specifications'}
            />

            {/* Core Configurations - Accordion */}
            <Accordion type="single" collapsible>
              <AccordionItem value="configurations">
                <AccordionTrigger className="text-lg font-semibold">
                  <span className="flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    {isEs ? 'Configuraciones de Núcleo' : 'Core Configurations'}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {categoryData.coreConfigurations.map((config, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-primary-foreground">{idx + 1}</span>
                        </div>
                        <span className="text-sm">{config}</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Product Gallery - Accordion */}
            <Accordion type="single" collapsible>
              <AccordionItem value="gallery">
                <AccordionTrigger className="text-lg font-semibold">
                  <span className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    {isEs ? 'Galería del Producto' : 'Product Gallery'}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {[1, 2, 3].map((item, idx) => (
                      <div key={idx} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted group">
                        <div className="w-full h-full border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">
                            {isEs ? `Imagen del Producto ${item}` : `Product Image ${item}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Product Comparison */}
            <ProductComparison locale={locale as any} />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Inquiry */}
            <Card className="bg-[#fdb827] border-[#fdb827] sticky top-8">
              <CardHeader>
                <CardTitle className="text-[#212529] text-lg flex items-center gap-2">
                  <MessagesSquare className="h-5 w-5" />
                  {isEs ? 'Consultar Sobre Esta Categoría' : 'Inquire About This Category'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-3">
                  <input
                    type="text"
                    placeholder={isEs ? 'Nombre' : 'Name'}
                    className="w-full px-3 py-2.5 border border-[#e5a61e] rounded-md bg-white/90 focus:outline-none focus:ring-2 focus:ring-white text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full px-3 py-2.5 border border-[#e5a61e] rounded-md bg-white/90 focus:outline-none focus:ring-2 focus:ring-white text-sm"
                  />
                  <input
                    type="text"
                    placeholder={isEs ? 'Empresa' : 'Company'}
                    className="w-full px-3 py-2.5 border border-[#e5a61e] rounded-md bg-white/90 focus:outline-none focus:ring-2 focus:ring-white text-sm"
                  />
                  <textarea
                    placeholder={isEs ? 'Requisitos del Producto' : 'Product Requirements'}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-[#e5a61e] rounded-md bg-white/90 focus:outline-none focus:ring-2 focus:ring-white text-sm"
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#212529] text-white py-2.5 rounded-md font-semibold hover:bg-gray-800 transition-colors shadow-sm"
                  >
                    {isEs ? 'Enviar Consulta' : 'Submit Inquiry'}
                  </button>
                </form>
              </CardContent>
            </Card>

            {/* Browse Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isEs ? 'Explorar Otras Categorías' : 'Browse Other Categories'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href={`/${locale}/products`} className="block w-full">
                  <Button variant="outline" className="w-full font-semibold">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {isEs ? 'Volver a la Lista de Productos' : 'Back to Product List'}
                  </Button>
                </Link>
                <div className="flex justify-center">
                  <CTAButtons locale={locale as any} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: { locale: string; name: string } }): Promise<Metadata> {
  const { locale, name } = params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';
  const decodedName = decodeURIComponent(name);
  const category = await getProductCategoryData(decodedName);

  const categoryName = category?.name || decodedName;
  const titles: Record<string, string> = {
    en: `${categoryName} | Flexible Busbar Category | Yanghua`,
    es: `${categoryName} | Categoría de Barra Colectora Flexible | Yanghua`,
  };
  const descriptions: Record<string, string> = {
    en: `Discover ${categoryName} flexible busbar models, structure and specifications for diverse applications.`,
    es: `Descubra modelos, estructura y especificaciones de ${categoryName} en barras colectoras flexibles para diversas aplicaciones.`,
  };

  const canonicalName = locale === 'es' && decodedName === 'cables-de-uso-general'
    ? 'cables-de-propósito-general'
    : decodedName;
  const localizedPath = getLocalizedPath('products-category', locale as any, { name: canonicalName });
  const canonical = generateCanonicalUrl(localizedPath, locale as any, baseUrl);

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical,
      languages: generateHreflangAlternatesForMetadata(localizedPath, locale as any),
    },
  };
}
