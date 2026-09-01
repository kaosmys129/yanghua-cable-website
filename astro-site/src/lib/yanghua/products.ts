import type { Locale } from './loaders';
import { productImageFromIndex } from './assets';
import { PRODUCT_CATEGORY_ALIASES } from './seo-localized-routes.mjs';

export type ProductCategory = {
  slug: string;
  aliases: string[];
  name: string;
  description: string;
  models: string[];
  applications: string[];
  image: string;
  structure: string[];
  specifications: Record<string, string>;
  coreConfigurations: string[];
};

export type ProductDetail = {
  id: string;
  name: string;
  description: string;
  detailedDescription: string;
  applications: string[];
  features: string[];
  technicalSpecs: Record<string, string>;
  images: string[];
  relatedProducts: string[];
};

const CATEGORY_STRUCTURE = {
  en: ['Copper wire conductors', 'Winding layers', 'Insulation layers', 'Metal armor layers', 'Sheath layers'],
  es: ['Conductores de alambre de cobre', 'Capas de bobinado', 'Capas de aislamiento', 'Capas de armadura metálica', 'Capas de vaina'],
  pt: ['Condutores de fio de cobre', 'Camadas de enrolamento', 'Camadas de isolamento', 'Camadas de armadura metálica', 'Camadas de bainha'],
};

const CORE_CONFIGURATIONS = {
  en: [
    '4-core: A,B,C,N equal cross-section',
    '5-core: A,B,C,N,PE equal cross-section',
    '3+1: A,B,C equal cross section, N 50% cross section (without PE)',
    '4+1: A,B,C,N equal cross section, PE 50%',
    '3+2: A,B,C equal cross section, N and PE 50% cross section',
  ],
  es: [
    '4-núcleos: A,B,C,N sección transversal igual',
    '5-núcleos: A,B,C,N,PE sección transversal igual',
    '3+1: A,B,C sección transversal igual, N 50% sección transversal (sin PE)',
    '4+1: A,B,C,N sección transversal igual, PE 50%',
    '3+2: A,B,C sección transversal igual, N y PE 50% sección transversal',
  ],
  pt: [
    '4 vias: seção transversal igual para A, B, C, N',
    '5 vias: seção transversal igual para A, B, C, N, PE',
    '3+1: seção transversal igual para A, B, C, N 50% de seção transversal (sem PE)',
    '4+1: seção transversal igual para A, B, C, N, PE 50% de seção transversal',
    '3+2: seção transversal igual para A, B, C, N e PE 50% de seção transversal',
  ],
};

const CATEGORY_SPECIFICATIONS = {
  ratedCurrent: '200-6300A',
  ratedVoltage: '≤3kV',
  ratedFrequency: '50Hz',
  protectionLevel: 'IP68',
  maxOperatingTemp: '105℃',
};

export const categoryLabels = {
  en: {
    productCategory: 'Product Category',
    overview: 'Product Overview',
    applications: 'Applications',
    structure: 'Product Structure',
    specifications: 'Technical Specifications',
    coreConfigurations: 'Core Configurations',
    gallery: 'Product Gallery',
    models: 'Available Models',
    inquiry: 'Inquire About This Category',
    browse: 'Browse Other Categories',
    back: 'Back to Product List',
    heroDescription: 'High-performance flexible busbar solutions for diverse applications',
  },
  es: {
    productCategory: 'Categoría de Producto',
    overview: 'Resumen del Producto',
    applications: 'Aplicaciones',
    structure: 'Estructura del Producto',
    specifications: 'Especificaciones Técnicas',
    coreConfigurations: 'Configuraciones Principales',
    gallery: 'Galería de Productos',
    models: 'Modelos Disponibles',
    inquiry: 'Consultar Esta Categoría',
    browse: 'Explorar Otras Categorías',
    back: 'Volver a Productos',
    heroDescription: 'Soluciones de barra colectora flexible de alto rendimiento para diversas aplicaciones',
  },
  pt: {
    productCategory: 'Categoria de Produto',
    overview: 'Visão Geral do Produto',
    applications: 'Aplicações',
    structure: 'Estrutura do Produto',
    specifications: 'Especificações Técnicas',
    coreConfigurations: 'Configuraciones Principales',
    gallery: 'Galeria de Produtos',
    models: 'Modelos Disponíveis',
    inquiry: 'Consultar Esta Categoria',
    browse: 'Explorar Outras Categorias',
    back: 'Voltar para Produtos',
    heroDescription: 'Soluções de barramento flexível de alto desempenho para diversas aplicações',
  },
};

export const productLabels = {
  en: {
    productType: 'Flexible Busbar System',
    overview: 'Product Overview',
    features: 'Key Features',
    structure: 'Product Structure',
    nameExplanation: 'Name Explanation',
    specifications: 'Technical Specifications',
    applications: 'Application Scenarios',
    gallery: 'Product Gallery',
    comparison: 'Product Comparison',
    inquiry: 'Inquire About This Product',
    related: 'Related Products',
  },
  es: {
    productType: 'Sistema de Barra Colectora Flexible',
    overview: 'Resumen del Producto',
    features: 'Características Clave',
    structure: 'Estructura del Producto',
    nameExplanation: 'Explicación del Nombre',
    specifications: 'Especificaciones Técnicas',
    applications: 'Escenarios de Aplicación',
    gallery: 'Galería de Productos',
    comparison: 'Comparación de Productos',
    inquiry: 'Consultar Este Producto',
    related: 'Productos Relacionados',
  },
  pt: {
    productType: 'Sistema de Barramento Flexível',
    overview: 'Visão Geral do Produto',
    features: 'Principais Características',
    structure: 'Estrutura do Produto',
    nameExplanation: 'Explicação do Nome',
    specifications: 'Especificações Técnicas',
    applications: 'Cenários de Aplicação',
    gallery: 'Galeria de Produtos',
    comparison: 'Comparação de Produtos',
    inquiry: 'Consultar Este Produto',
    related: 'Produtos Relacionados',
  },
};

export function slugifyProductCategoryName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildProductCategories(locale: Locale, rawCategories: any[]): ProductCategory[] {
  const seen = new Set<string>();
  return rawCategories
    .map((category) => {
      const slug = slugifyProductCategoryName(String(category?.name ?? ''));
      return {
        slug,
        aliases: Object.entries(PRODUCT_CATEGORY_ALIASES[locale] ?? {})
          .filter(([, canonical]) => canonical === slug)
          .map(([alias]) => alias),
        name: String(category?.name ?? ''),
        description: String(category?.description ?? ''),
        models: Array.isArray(category?.models) ? category.models : [],
        applications: Array.isArray(category?.applications) ? category.applications : [],
        image: productImageFromIndex(category?.productIndex),
        structure: CATEGORY_STRUCTURE[locale],
        specifications: CATEGORY_SPECIFICATIONS,
        coreConfigurations: CORE_CONFIGURATIONS[locale],
      };
    })
    .filter((category) => {
      if (!category.name || seen.has(category.slug)) return false;
      seen.add(category.slug);
      return true;
    });
}

export function findProductCategory(categories: ProductCategory[], slug: string): ProductCategory | undefined {
  const decoded = decodeURIComponent(slug);
  const normalized = slugifyProductCategoryName(decoded);
  return categories.find((category) => category.slug === normalized || category.aliases.includes(decoded) || category.aliases.includes(normalized));
}

const productDetails: ProductDetail[] = [
  {
    id: 'flexible-busbar-2000a',
    name: '2000A Flexible Busbar System',
    description: 'High-current flexible busbar system for efficient power transmission',
    detailedDescription:
      'Our 2000A flexible busbar system is designed for high-power applications in new energy, data centers, and industrial facilities. With superior conductivity and flexibility, it provides a reliable and efficient solution for power distribution.',
    applications: ['New Energy Power Plants', 'Data Centers', 'Industrial Manufacturing', 'Commercial Buildings'],
    features: [
      'High Current Capacity: 2000A rated current ensures stable power transmission',
      'Flexible Design: Adapt to complex installation environments and reduce installation difficulty',
      'Low Resistance: High-conductivity copper material reduces energy loss',
      'High Safety: Insulation protection and reliable connection design',
      'Easy Maintenance: Modular design for easy installation and maintenance',
      'Environmental Adaptability: Resistant to high temperature, humidity, and corrosion',
    ],
    technicalSpecs: {
      Voltage: '1000V AC/1500V DC',
      Current: '2000A',
      Material: 'High-purity Copper + Insulation Sheath',
      Temperature: '-40°C to +105°C',
      Insulation: 'Cross-linked Polyethylene (XLPE)',
      Standards: 'IEC 60228, IEC 60454',
    },
    images: ['/images/products/flexible-busbar-1.jpg', '/images/products/flexible-busbar-2.jpg', '/images/products/flexible-busbar-3.jpg'],
    relatedProducts: ['flexible-busbar-1500a', 'flexible-busbar-2500a', 'insulation-accessories'],
  },
  {
    id: 'flexible-busbar-1500a',
    name: '1500A Flexible Busbar System',
    description: 'Medium-current flexible busbar system for versatile power distribution',
    detailedDescription:
      'Our 1500A flexible busbar system offers excellent performance for medium-power applications. Designed for reliability and efficiency in various industrial and commercial environments.',
    applications: ['Commercial Buildings', 'Industrial Facilities', 'Power Distribution Centers', 'Renewable Energy Systems'],
    features: [
      'Medium Current Capacity: 1500A rated current for versatile applications',
      'Flexible Installation: Easy routing through complex pathways',
      'Cost-Effective: Optimal balance of performance and cost',
      'Reliable Connection: Secure and stable electrical connections',
      'Compact Design: Space-saving solution for tight installations',
      'Weather Resistant: Suitable for various environmental conditions',
    ],
    technicalSpecs: {
      Voltage: '1000V AC/1500V DC',
      Current: '1500A',
      Material: 'High-purity Copper + Insulation Sheath',
      Temperature: '-40°C to +105°C',
      Insulation: 'Cross-linked Polyethylene (XLPE)',
      Standards: 'IEC 60228, IEC 60454',
    },
    images: ['/images/products/flexible-busbar-1.jpg', '/images/products/flexible-busbar-2.jpg', '/images/products/flexible-busbar-3.jpg'],
    relatedProducts: ['flexible-busbar-2000a', 'flexible-busbar-2500a', 'insulation-accessories'],
  },
  {
    id: 'flexible-busbar-2500a',
    name: '2500A Flexible Busbar System',
    description: 'High-capacity flexible busbar system for heavy-duty power transmission',
    detailedDescription:
      'Our 2500A flexible busbar system is engineered for high-capacity power transmission in demanding industrial applications. Perfect for heavy-duty operations requiring maximum reliability.',
    applications: ['Heavy Industrial Plants', 'Large Data Centers', 'Power Generation Facilities', 'Mining Operations'],
    features: [
      'High Capacity: 2500A rated current for heavy-duty applications',
      'Superior Durability: Built to withstand harsh industrial environments',
      'Advanced Insulation: Enhanced protection for high-power operations',
      'Modular System: Scalable design for future expansion',
      'Low Maintenance: Designed for long-term reliable operation',
      'Safety Certified: Meets international safety standards',
    ],
    technicalSpecs: {
      Voltage: '1000V AC/1500V DC',
      Current: '2500A',
      Material: 'High-purity Copper + Enhanced Insulation Sheath',
      Temperature: '-40°C to +105°C',
      Insulation: 'Cross-linked Polyethylene (XLPE)',
      Standards: 'IEC 60228, IEC 60454',
    },
    images: ['/images/products/flexible-busbar-1.jpg', '/images/products/flexible-busbar-2.jpg', '/images/products/flexible-busbar-3.jpg'],
    relatedProducts: ['flexible-busbar-2000a', 'flexible-busbar-1500a', 'insulation-accessories'],
  },
  {
    id: 'insulation-accessories',
    name: 'Insulation Accessories & Components',
    description: 'Complete range of insulation accessories for flexible busbar systems',
    detailedDescription:
      'Our comprehensive collection of insulation accessories and components ensures optimal performance and safety for flexible busbar installations. Essential components for professional installations.',
    applications: ['Busbar System Installation', 'Electrical Connection Points', 'System Integration Support', 'Maintenance Operations'],
    features: [
      'Complete Accessory Range: All necessary components for installation',
      'High-Quality Materials: Premium insulation materials for safety',
      'Easy Installation: User-friendly design for quick setup',
      'Compatibility: Works with all flexible busbar systems',
      'Safety Compliance: Meets all relevant safety standards',
      'Long Service Life: Durable materials for extended operation',
    ],
    technicalSpecs: {
      Voltage: 'Up to 1500V DC',
      Current: 'Compatible with all current ratings',
      Material: 'Various insulation materials',
      Temperature: '-40°C to +105°C',
      Insulation: 'Multiple insulation types available',
      Standards: 'IEC 60228, IEC 60454, UL Standards',
    },
    images: ['/images/product-center/Accessories.webp', '/images/product-center/accessories/Connector.webp'],
    relatedProducts: ['flexible-busbar-2000a', 'flexible-busbar-1500a', 'flexible-busbar-2500a'],
  },
];

type LocalizedProductCopy = Partial<Omit<ProductDetail, 'id'>>;

const localizedProductCopy: Record<'es' | 'pt', Record<string, LocalizedProductCopy>> = {
  es: {
    'flexible-busbar-2000a': {
      name: 'Sistema de barra colectora flexible de 2000 A',
      description: 'Sistema de barra colectora flexible de alta corriente para una transmisión eléctrica eficiente',
      detailedDescription: 'Nuestro sistema de barra colectora flexible de 2000 A está diseñado para aplicaciones de alta potencia en nuevas energías, centros de datos e instalaciones industriales. Su conductividad y flexibilidad ofrecen una solución fiable y eficiente para la distribución eléctrica.',
      applications: ['Plantas de nueva energía', 'Centros de datos', 'Fabricación industrial', 'Edificios comerciales'],
      features: [
        'Alta capacidad de corriente: la corriente nominal de 2000 A mantiene una transmisión estable',
        'Diseño flexible: se adapta a recorridos complejos y reduce la dificultad de instalación',
        'Baja resistencia: el cobre de alta conductividad reduce las pérdidas eléctricas',
        'Alta seguridad: aislamiento y conexiones diseñados para una protección fiable',
        'Mantenimiento sencillo: diseño modular para facilitar la instalación y el mantenimiento',
        'Adaptación ambiental: resistencia a temperatura, humedad y corrosión',
      ],
      technicalSpecs: {
        Tensión: '1000 V CA/1500 V CC',
        Corriente: '2000 A',
        Material: 'Cobre de alta pureza + cubierta aislante',
        Temperatura: '-40 °C a +105 °C',
        Aislamiento: 'Polietileno reticulado (XLPE)',
        Normas: 'IEC 60228, IEC 60454',
      },
    },
    'flexible-busbar-1500a': {
      name: 'Sistema de barra colectora flexible de 1500 A',
      description: 'Sistema de barra colectora flexible de corriente media para una distribución eléctrica versátil',
      detailedDescription: 'Nuestro sistema de barra colectora flexible de 1500 A ofrece un rendimiento fiable para aplicaciones de potencia media en entornos industriales y comerciales.',
    },
    'flexible-busbar-2500a': {
      name: 'Sistema de barra colectora flexible de 2500 A',
      description: 'Sistema de barra colectora flexible de alta capacidad para transmisión eléctrica exigente',
      detailedDescription: 'Nuestro sistema de barra colectora flexible de 2500 A está diseñado para la transmisión de alta capacidad en instalaciones industriales exigentes.',
    },
    'insulation-accessories': {
      name: 'Accesorios y componentes de aislamiento',
      description: 'Gama completa de accesorios de aislamiento para sistemas de barras colectoras flexibles',
      detailedDescription: 'Nuestra gama de accesorios y componentes de aislamiento ayuda a mantener el rendimiento y la seguridad de las instalaciones de barras colectoras flexibles.',
    },
  },
  pt: {
    'flexible-busbar-2000a': {
      name: 'Sistema de barramento flexível de 2000 A',
      description: 'Sistema de barramento flexível de alta corrente para transmissão eficiente de energia',
      detailedDescription: 'Nosso sistema de barramento flexível de 2000 A foi desenvolvido para aplicações de alta potência em novas energias, data centers e instalações industriais. A alta condutividade e a flexibilidade oferecem uma solução confiável e eficiente para a distribuição de energia.',
      applications: ['Usinas de novas energias', 'Data centers', 'Fabricação industrial', 'Edifícios comerciais'],
      features: [
        'Alta capacidade de corrente: a corrente nominal de 2000 A garante transmissão estável',
        'Design flexível: adapta-se a percursos complexos e reduz a dificuldade de instalação',
        'Baixa resistência: o cobre de alta condutividade reduz as perdas de energia',
        'Alta segurança: isolamento e conexões projetados para proteção confiável',
        'Manutenção simples: design modular facilita a instalação e a manutenção',
        'Adaptação ambiental: resistência a temperatura, umidade e corrosão',
      ],
      technicalSpecs: {
        Tensão: '1000 V CA/1500 V CC',
        Corrente: '2000 A',
        Material: 'Cobre de alta pureza + cobertura isolante',
        Temperatura: '-40 °C a +105 °C',
        Isolamento: 'Polietileno reticulado (XLPE)',
        Normas: 'IEC 60228, IEC 60454',
      },
    },
    'flexible-busbar-1500a': {
      name: 'Sistema de barramento flexível de 1500 A',
      description: 'Sistema de barramento flexível de corrente média para distribuição versátil de energia',
      detailedDescription: 'Nosso sistema de barramento flexível de 1500 A oferece desempenho confiável para aplicações de média potência em ambientes industriais e comerciais.',
    },
    'flexible-busbar-2500a': {
      name: 'Sistema de barramento flexível de 2500 A',
      description: 'Sistema de barramento flexível de alta capacidade para transmissão exigente de energia',
      detailedDescription: 'Nosso sistema de barramento flexível de 2500 A foi projetado para transmissão de alta capacidade em instalações industriais exigentes.',
    },
    'insulation-accessories': {
      name: 'Acessórios e componentes de isolamento',
      description: 'Linha completa de acessórios de isolamento para sistemas de barramentos flexíveis',
      detailedDescription: 'Nossa linha de acessórios e componentes de isolamento ajuda a manter o desempenho e a segurança das instalações de barramentos flexíveis.',
    },
  },
};

export function localizeProductDetail(product: ProductDetail, locale: Locale): ProductDetail {
  if (locale === 'en') return product;
  const copy = localizedProductCopy[locale]?.[product.id];
  if (!copy) return product;
  return {
    ...product,
    ...copy,
    technicalSpecs: copy.technicalSpecs ?? product.technicalSpecs,
  };
}

export function getProductDetails(locale: Locale = 'en'): ProductDetail[] {
  return productDetails.map((product) => localizeProductDetail(product, locale));
}

export function findProductDetail(id: string, locale: Locale = 'en'): ProductDetail | undefined {
  const product = productDetails.find((product) => product.id === id);
  return product ? localizeProductDetail(product, locale) : undefined;
}
