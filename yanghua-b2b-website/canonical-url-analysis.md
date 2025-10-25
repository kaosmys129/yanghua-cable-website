# Canonical URL 配置模式分析

## 当前状态总结

### ✅ 已修复的页面（使用 generateHreflangAlternatesForMetadata）
1. **首页** (`/src/app/[locale]/page.tsx`)
   - 正确使用 `generateHreflangAlternatesForMetadata('/', locale)`
   - 包含完整的 x-default 标签

2. **产品列表页** (`/src/app/[locale]/products/layout.tsx`)
   - 已修复，使用 `generateHreflangAlternatesForMetadata('/products', locale)`

3. **服务页面** (`/src/app/[locale]/services/layout.tsx`)
   - 已修复，使用 `generateHreflangAlternatesForMetadata('/services', locale)`

4. **解决方案页面** (`/src/app/[locale]/solutions/layout.tsx`)
   - 已修复，使用 `generateHreflangAlternatesForMetadata('/solutions', locale)`

5. **项目详情页** (`/src/app/[locale]/projects/[id]/page.tsx`)
   - 已修复，使用 `generateHreflangAlternatesForMetadata('/projects/${id}', locale)`

6. **产品详情页** (`/src/app/[locale]/products/[id]/page.tsx`)
   - 已修复，使用 `generateHreflangAlternatesForMetadata('/products/${id}', locale)`

7. **产品分类页** (`/src/app/[locale]/products/category/[name]/page.tsx`)
   - 已修复，使用 `generateHreflangAlternatesForMetadata('/products/category/${decodedName}', locale)`

### ⚠️ 需要修复的页面（仍使用手动配置）
1. **条款页面** (`/src/app/[locale]/terms/page.tsx`)
   - 使用手动 `languages` 配置，缺少 x-default

2. **隐私政策页面** (`/src/app/[locale]/privacy/page.tsx`)
   - 使用手动 `languages` 配置，缺少 x-default

3. **关于我们页面** (`/src/app/[locale]/about/layout.tsx`)
   - 使用手动 `languages` 配置，缺少 x-default

4. **合作伙伴页面** (`/src/app/[locale]/partners/layout.tsx`)
   - 使用手动 `languages` 配置，缺少 x-default

5. **文章列表页** (`/src/app/[locale]/articles/layout.tsx`)
   - 使用手动 `languages` 配置，缺少 x-default

6. **文章详情页** (`/src/app/[locale]/articles/[slug]/page.tsx`)
   - 使用手动 `languages` 配置，缺少 x-default

## 配置模式分析

### 正确的配置模式
```typescript
// 1. 导入必要的函数
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';

// 2. 在 generateMetadata 中使用
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const canonical = generateCanonicalUrl('/path', locale as any, baseUrl);
  
  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical,
      languages: generateHreflangAlternatesForMetadata('/path', locale as any),
    },
  };
}
```

### 错误的配置模式（需要避免）
```typescript
// ❌ 手动配置 languages，缺少 x-default
alternates: {
  canonical,
  languages: {
    en: buildLocalizedUrl('route-name', 'en', params, baseUrl),
    es: buildLocalizedUrl('route-name', 'es', params, baseUrl),
  },
}
```

## 最佳实践建议

### 1. 统一使用 generateHreflangAlternatesForMetadata
- 所有页面都应使用 `generateHreflangAlternatesForMetadata` 函数
- 确保包含 x-default 标签，指向英语版本
- 避免手动配置 languages 对象

### 2. Canonical URL 生成规则
- 使用 `generateCanonicalUrl` 函数统一生成
- 确保 canonical URL 始终指向主要语言版本（英语）
- 保持 URL 结构的一致性

### 3. 路径参数处理
- 对于动态路由，正确传递参数到 hreflang 生成函数
- 例如：`generateHreflangAlternatesForMetadata('/products/${id}', locale)`

### 4. 代码审查检查点
- 检查是否导入了 `generateHreflangAlternatesForMetadata`
- 确认没有手动配置 languages 对象
- 验证 canonical URL 指向正确的主要版本

## 下一步行动
1. 修复剩余的 6 个页面，使其使用正确的配置模式
2. 建立代码审查规范，确保新页面遵循最佳实践
3. 考虑创建 ESLint 规则来自动检测错误的配置模式