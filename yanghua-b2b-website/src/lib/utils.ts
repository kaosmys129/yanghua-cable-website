import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export function combineClasses(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

export function getStrapiURL() {
  return process.env.STRAPI_BASE_URL ?? "https://fruitful-presence-02d7be759c.strapiapp.com";
}

// PDF下载配置接口
export interface DownloadConfig {
  fileName: string;
  filePath: string;
  category: string;
  language: 'en' | 'es';
  fileSize?: string;
  description?: string;
}

// PDF下载主函数
export async function downloadPDF(config: DownloadConfig): Promise<boolean> {
  try {
    const fullPath = `/downloads/${config.category}/${config.fileName}`;
    
    // 检查文件是否存在
    const fileExists = await checkFileExists(fullPath);
    if (!fileExists) {
      showDownloadToast(`File not found: ${config.fileName}`, 'error');
      return false;
    }

    // 创建下载链接
    const link = document.createElement('a');
    link.href = fullPath;
    link.download = config.fileName;
    link.style.display = 'none';
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 记录下载日志
    logDownload(config);
    showDownloadToast(`Successfully downloaded: ${config.fileName}`, 'success');
    
    return true;
  } catch (error) {
    console.error('Download failed:', error);
    showDownloadToast('Download failed. Please try again.', 'error');
    return false;
  }
}

// 检查文件是否存在
async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    const response = await fetch(filePath, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// 构建文件名
export function buildFileName(baseName: string, language: 'en' | 'es', version: string = 'v1.0'): string {
  return `${baseName}_${language}_${version}.pdf`;
}

// 下载日志记录
function logDownload(config: DownloadConfig): void {
  const logData = {
    timestamp: new Date().toISOString(),
    fileName: config.fileName,
    category: config.category,
    language: config.language,
    userAgent: navigator.userAgent
  };
  
  // 存储到localStorage用于统计
  const logs = JSON.parse(localStorage.getItem('downloadLogs') || '[]');
  logs.push(logData);
  localStorage.setItem('downloadLogs', JSON.stringify(logs.slice(-100))); // 保留最近100条记录
}

// 显示下载提示
function showDownloadToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  // 创建简单的toast提示
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 transition-all duration-300 ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  }`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // 3秒后自动移除
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// 获取本地化文件名
export function getLocalizedFileName(baseName: string, language: 'en' | 'es'): string {
  const languageMap = {
    en: 'english',
    es: 'spanish'
  };
  return `${baseName}_${languageMap[language]}.pdf`;
}