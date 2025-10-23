# WordPress 集成指南

## 概述

本项目已成功集成 WordPress 作为内容管理系统（CMS），支持通过 WordPress REST API 获取和管理内容。项目同时支持 Strapi 和 WordPress 之间的灵活切换。

## 🚀 快速开始

### 1. WordPress 服务器设置

WordPress 服务器运行在 `http://localhost:8080`，使用 PHP 内置服务器：

```bash
# 在 WordPress 目录中启动服务器
cd wordpress/wordpress
php -S localhost:8080
```

### 2. 环境变量配置

在 `.env.local` 文件中配置以下 WordPress 相关环境变量：

```env
# CMS 类型配置
CMS_TYPE=wordpress
NEXT_PUBLIC_CMS_TYPE=wordpress
ENABLE_WORDPRESS=true

# WordPress 服务器配置
WORDPRESS_BASE_URL=http://localhost:8080
NEXT_PUBLIC_WORDPRESS_BASE_URL=http://localhost:8080
NEXT_PUBLIC_WORDPRESS_API_URL=http://localhost:8080/wp-json/wp/v2

# WordPress 管理员配置
WORDPRESS_ADMIN_USER=admin
WORDPRESS_ADMIN_PASSWORD=your_password_here
```

### 3. 启动 Next.js 开发服务器

```bash
npm run dev
```

## 📋 功能特性

### ✅ 已实现功能

- **WordPress 核心安装和配置**
- **REST API 集成**
  - 文章（Posts）API
  - 页面（Pages）API
  - 分类（Categories）API
  - 标签（Tags）API
  - 媒体（Media）API
- **插件支持**
  - WP-REST-API V2 Menus（菜单 API）
  - Polylang（多语言支持）
  - WordPress SEO by Yoast
- **CMS 配置切换**
  - 支持 Strapi 和 WordPress 之间切换
  - 环境变量驱动的配置管理
- **演示页面**
  - WordPress 内容展示页面 (`/wordpress-demo`)
  - 实时 API 数据获取和显示

### 🔧 技术实现

#### CMS 配置管理

项目使用 `src/lib/cms-config.ts` 管理 CMS 配置：

```typescript
// 自动检测和切换 CMS 类型
const cmsConfig = getCMSConfig();
console.log(cmsConfig.type); // 'wordpress' 或 'strapi'
```

#### WordPress API 调用

```typescript
// 获取文章列表
const response = await fetch(`${WORDPRESS_API_URL}/posts`);
const posts = await response.json();

// 获取特定文章
const post = await fetch(`${WORDPRESS_API_URL}/posts/${postId}`);
```

## 🧪 测试和验证

### 1. WordPress REST API 集成测试

运行完整的 API 集成测试：

```bash
node test-wordpress-integration.cjs
```

**测试结果示例：**
```
🎉 所有测试通过！WordPress 集成正常工作。

📊 测试结果汇总
✅ 通过: 8
❌ 失败: 0
📈 总计: 8
```

### 2. CMS 配置验证测试

验证 CMS 配置的正确性：

```bash
node test-cms-config.cjs
```

**验证结果示例：**
```
🎉 CMS 配置验证通过！

📊 验证结果汇总
✅ 通过: 3
❌ 失败: 0
📈 总计: 3
```

### 3. 演示页面测试

访问 WordPress 演示页面查看集成效果：
- URL: `http://localhost:3000/wordpress-demo`
- 功能: 实时显示 WordPress 文章、分类和媒体内容

## 📊 API 端点

### WordPress REST API 端点

| 端点 | 描述 | 示例 URL |
|------|------|----------|
| 文章 | 获取文章列表 | `/wp-json/wp/v2/posts` |
| 页面 | 获取页面列表 | `/wp-json/wp/v2/pages` |
| 分类 | 获取分类列表 | `/wp-json/wp/v2/categories` |
| 标签 | 获取标签列表 | `/wp-json/wp/v2/tags` |
| 媒体 | 获取媒体文件 | `/wp-json/wp/v2/media` |
| 用户 | 获取用户信息 | `/wp-json/wp/v2/users` |

### API 响应示例

**文章列表响应：**
```json
[
  {
    "id": 174,
    "title": {
      "rendered": "Welcome to Yanghua B2B"
    },
    "excerpt": {
      "rendered": "文章摘要..."
    },
    "date": "2025-10-22T22:21:04",
    "status": "publish",
    "link": "http://localhost:8080/?p=174"
  }
]
```

## 🔄 CMS 切换

### 从 Strapi 切换到 WordPress

1. 更新环境变量：
```env
CMS_TYPE=wordpress
NEXT_PUBLIC_CMS_TYPE=wordpress
ENABLE_WORDPRESS=true
ENABLE_STRAPI=false
```

2. 重启开发服务器：
```bash
npm run dev
```

### 从 WordPress 切换到 Strapi

1. 更新环境变量：
```env
CMS_TYPE=strapi
NEXT_PUBLIC_CMS_TYPE=strapi
ENABLE_STRAPI=true
ENABLE_WORDPRESS=false
```

2. 确保 Strapi 服务器运行
3. 重启开发服务器

## 🛠️ 开发工具

### 测试脚本

- `test-wordpress-integration.cjs` - WordPress API 集成测试
- `test-cms-config.cjs` - CMS 配置验证测试

### 生成的报告

- `wordpress-integration-test-report.json` - API 测试详细报告
- `cms-config-test-report.json` - 配置验证详细报告

## 📝 WordPress 管理

### 管理后台访问

- URL: `http://localhost:8080/wp-admin`
- 用户名: `admin`
- 密码: 在环境变量中配置

### 内容管理

1. **文章管理**: 创建、编辑和发布文章
2. **页面管理**: 管理静态页面内容
3. **媒体库**: 上传和管理图片、文档等媒体文件
4. **分类和标签**: 组织内容结构

### 插件管理

已安装的插件：
- **WP-REST-API V2 Menus**: 提供菜单 REST API
- **Polylang**: 多语言支持
- **WordPress SEO by Yoast**: SEO 优化

## 🚨 故障排除

### 常见问题

1. **API 返回 404 错误**
   - 检查固定链接设置：`wp option get permalink_structure`
   - 重新设置固定链接：`wp rewrite structure '/%postname%/' --hard`

2. **CORS 错误**
   - 确保 WordPress 允许跨域请求
   - 检查 Next.js 和 WordPress 服务器配置

3. **环境变量未生效**
   - 重启开发服务器
   - 检查 `.env.local` 文件格式

### 调试命令

```bash
# 检查 WordPress 安装状态
wp core is-installed

# 检查数据库表
wp db tables

# 检查插件状态
wp plugin list

# 测试 API 连接
curl http://localhost:8080/wp-json/wp/v2/posts
```

## 📈 性能优化

### 建议

1. **缓存策略**: 实现 API 响应缓存
2. **分页加载**: 使用 `per_page` 参数限制返回数据量
3. **字段选择**: 使用 `_fields` 参数只获取需要的字段
4. **图片优化**: 配置 WordPress 图片尺寸和压缩

### 示例优化

```typescript
// 分页获取文章
const response = await fetch(`${WORDPRESS_API_URL}/posts?per_page=10&page=1`);

// 只获取特定字段
const response = await fetch(`${WORDPRESS_API_URL}/posts?_fields=id,title,excerpt,date`);
```

## 🔐 安全考虑

1. **API 访问控制**: 配置适当的用户权限
2. **HTTPS**: 生产环境使用 HTTPS
3. **认证**: 对敏感操作实施认证机制
4. **输入验证**: 验证和清理用户输入

## 📚 相关文档

- [WordPress REST API 官方文档](https://developer.wordpress.org/rest-api/)
- [Next.js 官方文档](https://nextjs.org/docs)
- [项目开发文档](./PROJECT_DEVELOPMENT_DOCUMENTATION.md)

---

**最后更新**: 2025年10月22日  
**版本**: 1.0.0  
**状态**: ✅ 完全集成并测试通过