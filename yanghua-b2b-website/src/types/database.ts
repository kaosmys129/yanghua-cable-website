// 占位符信息接口
export interface PlaceholderInfo {
  id: string;
  path: string;           // 文件路径
  component: string;      // 所在组件
  category: string;       // 分类
  subcategory?: string;   // 子分类
  dimensions?: string;    // 推荐尺寸
  required: boolean;      // 是否必需
  status: 'uploaded' | 'pending' | 'missing' | 'broken';
  metadata?: {
    alt?: string;
    title?: string;
    description?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

// 图片信息接口
export interface ImageInfo {
  id: string;
  placeholder_id?: string;
  filename: string;
  original_name?: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  format?: string;
  quality?: number;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

// 图片版本接口
export interface ImageVersion {
  id: string;
  image_id: string;
  version_number: number;
  file_path: string;
  file_size?: number;
  created_at: string;
}

// 图片文件树接口
export interface ImageFileTree {
  [category: string]: {
    [subcategory: string]: {
      placeholders: PlaceholderInfo[];
      images: ImageInfo[];
      stats: {
        total: number;
        uploaded: number;
        pending: number;
        missing: number;
      };
    };
  };
}

// 上传选项接口
export interface UploadOptions {
  quality?: number;
  generateSizes?: boolean;
  sizes?: Array<{width: number, height?: number}>;
  category: string;
  subcategory?: string;
}

// 上传项目接口
export interface UploadItem {
  id: string;
  file: File;
  placeholderId?: string;
  options: UploadOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

// 上传队列接口
export interface UploadQueue {
  items: UploadItem[];
  processing: boolean;
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
}

// 裁剪数据接口
export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 处理选项接口
export interface ProcessOptions {
  quality?: number;
  sizes?: Array<{width: number, height?: number}>;
  category: string;
  subcategory?: string;
}

// 处理结果接口
export interface ProcessResult {
  success: boolean;
  files: {
    original: string;
    webp: string;
    sizes: Array<{size: string, path: string}>;
  };
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

// 分页信息接口
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// API响应基础接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 扫描请求接口
export interface ScanRequest {
  path?: string;
  force?: boolean;
  categories?: string[];
}

// 扫描响应接口
export interface ScanResponse {
  success: boolean;
  data: {
    placeholders: PlaceholderInfo[];
    stats: {
      total: number;
      new: number;
      updated: number;
      removed: number;
    };
  };
  message?: string;
}