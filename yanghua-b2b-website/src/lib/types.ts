export interface Article {
  id: number;
  documentId: string;
  title: string;
  description: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  locale: string;
  cover: {
    id: number;
    documentId: string
    name: string
    alternativeText: string
    url: string
  }
  category: {
    id: number
    documentId: string
    name: string
    slug: string
  }
  // Optional: cross-locale mappings from Strapi i18n
  localizations?: {
    id: number
    locale: string
    slug: string
    documentId?: string
  }[]
  // Optional: related articles (to be added in Strapi)
  related_articles?: ArticleSummary[]
  // Optional: tags (if present in Strapi)
  tags?: Tag[]
  author: {
    id: number
    documentId: string
    name: string
    email: string
    createdAt: string
    updatedAt: string
    publishedAt: string
    avatar: {
      id: number
      documentId: string
      url: string
      alternativeText: string
      width: number
      height: number
    }
  }
  blocks: Block[]
}

export interface ArticleSummary {
  id: number
  documentId: string
  title: string
  slug: string
  locale: string
  cover?: {
    id: number
    documentId: string
    url: string
    alternativeText?: string
  }
  category?: {
    id: number
    documentId: string
    name: string
    slug: string
  }
}

export interface Tag {
  id: number
  documentId: string
  name: string
  slug: string
}

export interface Hub {
  id: number
  documentId?: string
  title: string
  slug: string
  intro?: string
  locale: string
  cover?: {
    id: number
    documentId?: string
    url: string
    alternativeText?: string
  }
  featured_articles?: ArticleSummary[]
}

export type Block = RichTextBlock | QuoteBlock | MediaBlock | SliderBlock

export interface RichTextBlock {
  __component: "shared.rich-text"
  id: number
  body: string
}

export interface QuoteBlock {
  __component: "shared.quote"
  id: number
  title: string
  body: string
}

export interface MediaBlock {
  __component: "shared.media"
  id: number
  file: {
    id: number
    documentId: string
    url: string
    alternativeText: string
    width?: number
    height?: number
  }
}

export interface SliderBlock {
  __component: "shared.slider"
  id: number
  files: {
    id: number
    documentId: string
    name: string
    url: string
    alternativeText: string
  }[]
}
