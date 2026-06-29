import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { buildLocalizedUrl, getLocalizedPath } from '@/lib/url-localization';
import StructuredDataScript from '@/components/seo/StructuredDataScript';
import { generateProductSchema, generateBreadcrumbSchema } from '@/lib/structured-data';
import ProductDetailLayout from '@/components/products/ProductDetailLayout';
import ProductComparison from '@/components/products/ProductComparison';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import TechSpecsTable from '@/components/products/TechSpecsTable';
import {
  Info,
  CheckCircle2,
  Layers,
  Tag,
  ImageIcon,
  Scale,
  Cable,
  Cpu,
} from 'lucide-react';

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

async function getProduct(id: string): Promise<Product | null> {
  const products: { [key: string]: Product } = {
    'flexible-busbar-2000a': {
      id: 'flexible-busbar-2000a',
      name: '2000A Flexible Busbar System',
      description: 'High-current flexible busbar system for efficient power transmission',
      detailedDescription:
        'Our 2000A flexible busbar system is designed for high-power applications in new energy, data centers, and industrial facilities. With superior conductivity and flexibility, it provides a reliable and efficient solution for power distribution.',
      applications: [
        'New Energy Power Plants',
        'Data Centers',
        'Industrial Manufacturing',
        'Commercial Buildings',
      ],
      features: [
        'High Current Capacity: 2000A rated current ensures stable power transmission',
        'Flexible Design: Adapt to complex installation environments and reduce installation difficulty',
        'Low Resistance: High-conductivity copper material reduces energy loss',
        'High Safety: Insulation protection and reliable connection design',
        'Easy Maintenance: Modular design for easy installation and maintenance',
        'Environmental Adaptability: Resistant to high temperature, humidity, and corrosion',
      ],
      technicalSpecs: {
        voltage: '1000V AC/1500V DC',
        current: '2000A',
        material: 'High-purity Copper + Insulation Sheath',
        temperature: '-40°C to +105°C',
        insulation: 'Cross-linked Polyethylene (XLPE)',
        standards: 'IEC 60228, IEC 60454',
      },
      images: ['/images/no-image-available.webp', '/images/no-image-available.webp', '/images/no-image-available.webp'],
      relatedProducts: ['flexible-busbar-1500a', 'flexible-busbar-2500a', 'insulation-accessories'],
    },
    'flexible-busbar-1500a': {
      id: 'flexible-busbar-1500a',
      name: '1500A Flexible Busbar System',
      description: 'Medium-current flexible busbar system for versatile power distribution',
      detailedDescription:
        'Our 1500A flexible busbar system offers excellent performance for medium-power applications. Designed for reliability and efficiency in various industrial and commercial environments.',
      applications: [
        'Commercial Buildings',
        'Industrial Facilities',
        'Power Distribution Centers',
        'Renewable Energy Systems',
      ],
      features: [
        'Medium Current Capacity: 1500A rated current for versatile applications',
        'Flexible Installation: Easy routing through complex pathways',
        'Cost-Effective: Optimal balance of performance and cost',
        'Reliable Connection: Secure and stable electrical connections',
        'Compact Design: Space-saving solution for tight installations',
        'Weather Resistant: Suitable for various environmental conditions',
      ],
      technicalSpecs: {
        voltage: '1000V AC/1500V DC',
        current: '1500A',
        material: 'High-purity Copper + Insulation Sheath',
        temperature: '-40°C to +105°C',
        insulation: 'Cross-linked Polyethylene (XLPE)',
        standards: 'IEC 60228, IEC 60454',
      },
      images: ['/images/no-image-available.webp', '/images/no-image-available.webp', '/images/no-image-available.webp'],
      relatedProducts: ['flexible-busbar-2000a', 'flexible-busbar-2500a', 'insulation-accessories'],
    },
    'flexible-busbar-2500a': {
      id: 'flexible-busbar-2500a',
      name: '2500A Flexible Busbar System',
      description: 'High-capacity flexible busbar system for heavy-duty power transmission',
      detailedDescription:
        'Our 2500A flexible busbar system is engineered for high-capacity power transmission in demanding industrial applications. Perfect for heavy-duty operations requiring maximum reliability.',
      applications: [
        'Heavy Industrial Plants',
        'Large Data Centers',
        'Power Generation Facilities',
        'Mining Operations',
      ],
      features: [
        'High Capacity: 2500A rated current for heavy-duty applications',
        'Superior Durability: Built to withstand harsh industrial environments',
        'Advanced Insulation: Enhanced protection for high-power operations',
        'Modular System: Scalable design for future expansion',
        'Low Maintenance: Designed for long-term reliable operation',
        'Safety Certified: Meets international safety standards',
      ],
      technicalSpecs: {
        voltage: '1000V AC/1500V DC',
        current: '2500A',
        material: 'High-purity Copper + Enhanced Insulation Sheath',
        temperature: '-40°C to +105°C',
        insulation: 'Cross-linked Polyethylene (XLPE)',
        standards: 'IEC 60228, IEC 60454',
      },
      images: ['/images/no-image-available.webp', '/images/no-image-available.webp', '/images/no-image-available.webp'],
      relatedProducts: ['flexible-busbar-2000a', 'flexible-busbar-1500a', 'insulation-accessories'],
    },
    'insulation-accessories': {
      id: 'insulation-accessories',
      name: 'Insulation Accessories & Components',
      description: 'Complete range of insulation accessories for flexible busbar systems',
      detailedDescription:
        'Our comprehensive collection of insulation accessories and components ensures optimal performance and safety for flexible busbar installations. Essential components for professional installations.',
      applications: [
        'Busbar System Installation',
        'Electrical Connection Points',
        'System Integration Support',
        'Maintenance Operations',
      ],
      features: [
        'Complete Accessory Range: All necessary components for installation',
        'High-Quality Materials: Premium insulation materials for safety',
        'Easy Installation: User-friendly design for quick setup',
        'Compatibility: Works with all flexible busbar systems',
        'Safety Compliance: Meets all relevant safety standards',
        'Long Service Life: Durable materials for extended operation',
      ],
      technicalSpecs: {
        voltage: 'Up to 1500V DC',
        current: 'Compatible with all current ratings',
        material: 'Various insulation materials',
        temperature: '-40°C to +105°C',
        insulation: 'Multiple insulation types available',
        standards: 'IEC 60228, IEC 60454, UL Standards',
      },
      images: ['/images/no-image-available.webp', '/images/no-image-available.webp', '/images/no-image-available.webp'],
      relatedProducts: ['flexible-busbar-2000a', 'flexible-busbar-1500a', 'flexible-busbar-2500a'],
    },
  };

  return products[id] || null;
}

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
  const { id, locale } = params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const isEs = locale === 'es';

  const productSchema = generateProductSchema({
    name: product.name,
    description: product.description,
    image: product.images?.[0] || '/images/products/default.jpg',
    sku: product.id,
    brand: 'Yanghua Cable',
    category: 'Flexible Busbar',
    specifications: {
      'Voltage Rating': product.technicalSpecs.voltage,
      'Current Rating': product.technicalSpecs.current,
      Material: product.technicalSpecs.material,
      'Temperature Range': product.technicalSpecs.temperature,
      Insulation: product.technicalSpecs.insulation,
      Standards: product.technicalSpecs.standards,
    },
    url: `/${locale}/products/${id}`,
    currentRating: product.technicalSpecs.current,
    voltage: product.technicalSpecs.voltage,
    material: product.technicalSpecs.material,
    applications: product.applications,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: isEs ? 'Inicio' : 'Home', url: `/${locale}` },
    { name: isEs ? 'Productos' : 'Products', url: `/${locale}/products` },
    { name: product.name, url: `/${locale}/products/${id}` },
  ]);

  const useV2 = process.env.NEXT_PUBLIC_PRODUCTS_LAYOUT_V2 === 'true';
  const specsItems = [
    { label: isEs ? 'Voltaje' : 'Voltage', value: product.technicalSpecs.voltage },
    { label: isEs ? 'Corriente' : 'Current', value: product.technicalSpecs.current },
    { label: isEs ? 'Material' : 'Material', value: product.technicalSpecs.material },
    { label: isEs ? 'Temperatura' : 'Temperature', value: product.technicalSpecs.temperature },
    { label: isEs ? 'Aislamiento' : 'Insulation', value: product.technicalSpecs.insulation },
    { label: isEs ? 'Estándares' : 'Standards', value: product.technicalSpecs.standards },
  ];

  if (useV2) {
    return (
      <>
        <StructuredDataScript schema={productSchema} />
        <StructuredDataScript schema={breadcrumbSchema} />
        <ProductDetailLayout
          title={product.name}
          description={product.description}
          features={product.features}
          specs={specsItems}
          images={product.images}
          locale={locale as any}
        />
      </>
    );
  }

  const PlaceholderImage = ({ className }: { className?: string }) => (
    <div className={`bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center ${className}`}>
      <span className="text-muted-foreground text-sm">
        {isEs ? 'Imagen No Disponible' : 'Image Not Available'}
      </span>
    </div>
  );

  return (
    <>
      <StructuredDataScript schema={productSchema} />
      <StructuredDataScript schema={breadcrumbSchema} />
      <div className="min-h-screen bg-background">
        {/* Product Hero */}
        <div className="relative h-96 bg-gradient-to-r from-gray-900 to-gray-700">
          <div className="absolute inset-0">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 100vw"
                className="object-cover opacity-40"
              />
            ) : (
              <PlaceholderImage className="w-full h-full opacity-40" />
            )}
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="max-w-3xl">
              <Badge variant="outline" className="mb-4 text-yellow-400 border-yellow-400/50 bg-yellow-400/10 text-sm">
                {isEs ? 'Sistema de Barra Flexible' : 'Flexible Busbar System'}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-white mt-2 mb-4 tracking-tight">
                {product.name}
              </h1>
              <p className="text-xl text-gray-200">{product.description}</p>
            </div>
          </div>
        </div>

        {/* Product Content with Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full mb-8 grid grid-cols-2 md:grid-cols-4">
                  <TabsTrigger value="overview">
                    <Info className="h-4 w-4 mr-2" />
                    {isEs ? 'Resumen' : 'Overview'}
                  </TabsTrigger>
                  <TabsTrigger value="features">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {isEs ? 'Características' : 'Features'}
                  </TabsTrigger>
                  <TabsTrigger value="specs">
                    <Cpu className="h-4 w-4 mr-2" />
                    {isEs ? 'Especificaciones' : 'Specs'}
                  </TabsTrigger>
                  <TabsTrigger value="gallery">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {isEs ? 'Galería' : 'Gallery'}
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        {isEs ? 'Resumen del Producto' : 'Product Overview'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-lg leading-relaxed">
                        {product.detailedDescription}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        {isEs ? 'Escenarios de Aplicación' : 'Application Scenarios'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {product.applications.map((app, idx) => (
                          <Badge key={idx} variant="secondary" className="text-sm py-1.5 px-3">
                            {app}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-primary" />
                        {isEs ? 'Estructura del Producto' : 'Product Structure'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          isEs ? 'Conductores de alambre de cobre' : 'Copper wire conductors',
                          isEs ? 'Capas de bobinado' : 'Winding layers',
                          isEs ? 'Capas de aislamiento' : 'Insulation layers',
                          isEs ? 'Capas de armadura metálica' : 'Metal armor layers',
                          isEs ? 'Capas de vaina' : 'Sheath layers',
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center mt-0.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                            </div>
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Accordion type="single" collapsible>
                    <AccordionItem value="name-explanation">
                      <AccordionTrigger className="text-lg font-semibold">
                        <span className="flex items-center gap-2">
                          <Tag className="h-5 w-5 text-primary" />
                          {isEs ? 'Explicación del Nombre' : 'Name Explanation'}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                          {[
                            { code: 'TMR', meaning: isEs ? 'Barra flexible' : 'Flexible busbar' },
                            { code: 'V', meaning: isEs ? 'Aislamiento PVC' : 'PVC insulation' },
                            { code: 'S', meaning: isEs ? 'Armadura de aluminio' : 'Aluminum alloy armor' },
                            { code: 'T', meaning: isEs ? 'Armadura de cobre' : 'Copper alloy armor' },
                            { code: 'V', meaning: isEs ? 'Vaina PVC' : 'PVC Sheath' },
                            { code: 'Y', meaning: isEs ? 'Poliolefinas' : 'Polyolefins' },
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                              <div className="flex-shrink-0 h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                                <span className="text-xs font-bold text-primary-foreground">{item.code}</span>
                              </div>
                              <span className="text-sm">{item.meaning}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>

                {/* Features Tab */}
                <TabsContent value="features" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        {isEs ? 'Características Clave' : 'Key Features'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          isEs
                            ? 'Seguro y Fiable: Combina tecnología de fabricación de cables parcial y artesanía fina original. Integra líneas de ensamblaje mecánico para producción estandarizada.'
                            : 'Safe & Reliable: Combine partial cable manufacturing technology and original fine craftsmanship. Integrate machine assembly lines for standardized production.',
                          isEs
                            ? 'Conveniente y Eficiente: Estructura compacta con pequeño volumen, fácil de almacenar y transportar. Flexible y ligero, fácil de instalar.'
                            : 'Convenient & Efficient: Compact structure with small volume, easy to store and transport. Flexible and lightweight, easy to construct and install.',
                          isEs
                            ? 'Mejor Rendimiento: Alto nivel de protección, resistente a humedad, agua y altas temperaturas. Sin corrientes de Foucault, buena disipación de calor.'
                            : 'Better Performance: High protection level, moisture-proof, water-resistant, and high-temperature resistant. No eddy currents, good heat dissipation.',
                          isEs
                            ? 'Mayor Relación Coste-Rendimiento: Los conductores de cobre tienen alta densidad de corriente y bajo coste de material. Menos accesorios, menor coste.'
                            : 'Higher Cost Performance: Copper wire conductors have high current density and low material cost. Less accessories, lower cost.',
                        ].map((feature, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{feature}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Specs Tab */}
                <TabsContent value="specs">
                  <TechSpecsTable
                    items={[
                      { label: isEs ? 'Voltaje Nominal' : 'Rated Voltage', value: 'AC 380V/220V' },
                      { label: isEs ? 'Corriente Nominal' : 'Rated Current', value: '200-6300A' },
                      { label: isEs ? 'Temperatura de Operación' : 'Operating Temperature', value: '-40℃~+90℃' },
                      { label: isEs ? 'Resistencia de Aislamiento' : 'Insulation Resistance', value: '≥1000MΩ' },
                      { label: isEs ? 'Rigidez Dieléctrica' : 'Dielectric Strength', value: '3750V AC/minute' },
                      { label: isEs ? 'Nivel de Protección' : 'Protection Level', value: 'IP66' },
                      { label: isEs ? 'Material' : 'Material', value: isEs ? 'Conductor de cobre, carcasa de aluminio' : 'Copper conductor, aluminum housing' },
                      { label: isEs ? 'Instalación' : 'Installation', value: isEs ? 'Montaje horizontal o vertical' : 'Horizontal or vertical mounting' },
                    ]}
                    title={isEs ? 'Especificaciones Técnicas' : 'Technical Specifications'}
                  />
                </TabsContent>

                {/* Gallery Tab */}
                <TabsContent value="gallery">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-primary" />
                        {isEs ? 'Galería del Producto' : 'Product Gallery'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {product.images.map((image, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted group cursor-pointer"
                          >
                            {image ? (
                              <Image
                                src={image}
                                alt={`Product image ${idx + 1}`}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, 33vw"
                              />
                            ) : (
                              <PlaceholderImage className="w-full h-full" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Product Comparison */}
              <div className="mt-12">
                <ProductComparison locale={locale as any} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Quick Inquiry */}
              <Card className="bg-[#fdb827] border-[#fdb827]">
                <CardHeader>
                  <CardTitle className="text-[#212529] text-lg">
                    {isEs ? 'Consultar Sobre Este Producto' : 'Inquire About This Product'}
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

              {/* Related Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {isEs ? 'Productos Relacionados' : 'Related Products'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {product.relatedProducts.map((rp, idx) => (
                      <a
                        key={idx}
                        href={`/${locale}/products/${rp}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                      >
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Cable className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">
                            {rp.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {isEs ? 'Ver detalles' : 'View details'} →
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export async function generateMetadata({ params }: { params: { locale: string; id: string } }): Promise<Metadata> {
  const { locale, id } = params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';
  const product = await getProduct(id);
  const name = product?.name || id;
  const titles: Record<string, string> = {
    en: `${name} | High Current & Reliable | Yanghua`,
    es: `${name} | Fiable y Eficiente | Yanghua`,
  };
  const descriptions: Record<string, string> = {
    en: product?.description || 'Flexible busbar product detail and specifications.',
    es: product?.description || 'Detalle y especificaciones del producto de barra colectora flexible.',
  };
  const localizedPath = getLocalizedPath('products-detail', locale as any, { id });
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
