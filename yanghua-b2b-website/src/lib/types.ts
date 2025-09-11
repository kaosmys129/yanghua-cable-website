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
