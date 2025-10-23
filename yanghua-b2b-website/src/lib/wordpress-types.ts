/**
 * WordPress REST API 数据类型定义
 * 用于映射 WordPress 自定义文章类型和 ACF 字段
 */

// WordPress 基础响应接口
export interface WordPressResponse<T> {
  data: T[];
  meta?: {
    total: number;
    pages: number;
    page: number;
  };
}

// WordPress 媒体对象
export interface WordPressMedia {
  id: number;
  date: string;
  date_gmt: string;
  guid: {
    rendered: string;
  };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  author: number;
  comment_status: string;
  ping_status: string;
  template: string;
  meta: any[];
  description: {
    rendered: string;
  };
  caption: {
    rendered: string;
  };
  alt_text: string;
  media_type: string;
  mime_type: string;
  media_details: {
    width: number;
    height: number;
    file: string;
    sizes: {
      [key: string]: {
        file: string;
        width: number;
        height: number;
        mime_type: string;
        source_url: string;
      };
    };
  };
  source_url: string;
}

// WordPress 用户对象
export interface WordPressUser {
  id: number;
  name: string;
  url: string;
  description: string;
  link: string;
  slug: string;
  avatar_urls: {
    [size: string]: string;
  };
  meta: any[];
  acf?: {
    email?: string;
    avatar?: WordPressMedia;
  };
}

// WordPress 分类对象
export interface WordPressCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
  meta: any[];
  acf?: any;
}

// WordPress ACF 内容块类型
export interface WordPressACFBlock {
  acf_fc_layout: string;
  [key: string]: any;
}

// WordPress ACF 富文本块
export interface WordPressRichTextBlock extends WordPressACFBlock {
  acf_fc_layout: 'rich_text';
  body: string;
}

// WordPress ACF 引用块
export interface WordPressQuoteBlock extends WordPressACFBlock {
  acf_fc_layout: 'quote';
  title: string;
  body: string;
}

// WordPress ACF 媒体块
export interface WordPressMediaBlock extends WordPressACFBlock {
  acf_fc_layout: 'media';
  file: WordPressMedia | number;
}

// WordPress ACF 轮播块
export interface WordPressSliderBlock extends WordPressACFBlock {
  acf_fc_layout: 'slider';
  files: (WordPressMedia | number)[];
}

// WordPress 文章对象
export interface WordPressArticle {
  id: number;
  date: string;
  date_gmt: string;
  guid: {
    rendered: string;
  };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: 'publish' | 'draft' | 'private' | 'pending';
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  comment_status: string;
  ping_status: string;
  sticky: boolean;
  template: string;
  format: string;
  meta: any[];
  categories: number[];
  tags: number[];
  
  // ACF 自定义字段
  acf?: {
    document_id?: string;
    article_description?: string;
    article_locale?: 'en' | 'es';
    article_cover?: WordPressMedia | number;
    article_category?: WordPressCategory | number;
    article_author?: WordPressUser | number;
    article_blocks?: WordPressACFBlock[];
  };
  
  // 扩展字段（通过 _embed 参数获取）
  _embedded?: {
    author?: WordPressUser[];
    'wp:featuredmedia'?: WordPressMedia[];
    'wp:term'?: WordPressCategory[][];
  };
}

// WordPress API 查询参数
export interface WordPressQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  author?: number;
  categories?: number[];
  tags?: number[];
  status?: string[];
  slug?: string;
  lang?: string;
  _embed?: boolean;
  _fields?: string;
  orderby?: 'date' | 'id' | 'include' | 'title' | 'slug';
  order?: 'asc' | 'desc';
}

// WordPress 健康检查响应
export interface WordPressHealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  database: {
    status: 'connected' | 'disconnected';
    version?: string;
  };
  plugins: {
    active: string[];
    total: number;
  };
  theme: {
    name: string;
    version: string;
  };
}

// WordPress 错误响应
export interface WordPressError {
  code: string;
  message: string;
  data?: {
    status: number;
    params?: any;
  };
}

// WordPress API 配置
export interface WordPressConfig {
  baseUrl: string;
  username?: string;
  password?: string;
  applicationPassword?: string;
  timeout?: number;
  retries?: number;
  locale?: 'en' | 'es';
}

// WordPress 批量操作响应
export interface WordPressBatchResponse<T> {
  responses: {
    status: number;
    body: T | WordPressError;
  }[];
}

// WordPress 自定义端点响应
export interface WordPressCustomEndpoints {
  articles: '/wp-json/wp/v2/yanghua_article';
  categories: '/wp-json/wp/v2/yanghua_category';
  health: '/wp-json/wp/v2/health';
  search: '/wp-json/wp/v2/search';
}

// WordPress 语言支持
export type WordPressLocale = 'en' | 'es';

// WordPress 文章状态
export type WordPressPostStatus = 'publish' | 'draft' | 'private' | 'pending' | 'future';

// WordPress 排序选项
export type WordPressOrderBy = 'date' | 'id' | 'include' | 'title' | 'slug' | 'relevance';
export type WordPressOrder = 'asc' | 'desc';