# Strapi Cloud 预览功能设置指南

## 概述

本指南将帮助您在Strapi Cloud上配置文章预览功能，实现草稿内容的实时预览。

## 已完成的代码配置

### 1. Next.js 前端配置

- ✅ **预览API路由** (`/src/app/api/preview/route.ts`)
  - 支持启用/禁用预览模式
  - 验证预览请求的合法性
  - 集成Next.js Draft Mode

- ✅ **Strapi客户端更新** (`/src/lib/strapi-client.ts`)
  - 添加了 `getAllArticlesWithDrafts()` 函数
  - 添加了 `getArticleBySlugWithDrafts()` 函数
  - 支持获取草稿状态的内容

- ✅ **查询Hooks更新** (`/src/lib/queries.ts`)
  - 添加了 `useArticlesWithDrafts()` hook
  - 添加了 `useArticleWithDrafts()` hook
  - 针对草稿内容优化了缓存策略

- ✅ **文章页面组件更新** (`/src/app/[locale]/articles/[slug]/page.tsx`)
  - 支持预览模式检测
  - 显示预览模式提示
  - 根据URL参数选择不同的数据获取方式

- ✅ **Revalidation API** (`/src/app/api/revalidate/route.ts`)
  - 接收Strapi Webhook通知
  - 自动重新验证相关页面缓存

### 2. Strapi 后端配置

- ✅ **CORS配置更新** (`/config/middlewares.ts`)
  - 添加了本地开发环境支持
  - 添加了Vercel部署域名支持
  - 支持环境变量配置的前端URL

- ✅ **插件配置** (`/config/plugins.ts`)
  - 配置了预览按钮插件
  - 定义了文章预览URL模板

- ✅ **预览配置** (`/config/preview.ts`)
  - 定义了预览URL模板
  - 配置了Webhook设置
  - 设置了安全密钥

## 需要手动配置的部分

### 1. 环境变量设置

#### Strapi Cloud 环境变量
在Strapi Cloud控制台中添加以下环境变量：

```bash
# 前端应用URL
FRONTEND_URL=https://your-nextjs-app.vercel.app

# 预览功能密钥
PREVIEW_SECRET=your-secure-preview-secret-key

# 重新验证Token
REVALIDATION_TOKEN=your-secure-revalidation-token
```

#### Next.js 环境变量
在Next.js项目中添加以下环境变量：

```bash
# .env.local
STRAPI_API_TOKEN=your-strapi-api-token
STRAPI_API_URL=https://your-strapi-cloud-url.strapi.app/api
PREVIEW_SECRET=your-secure-preview-secret-key
REVALIDATION_TOKEN=your-secure-revalidation-token
```

### 2. Strapi Cloud 控制台配置

#### 安装预览按钮插件
1. 在Strapi项目中安装预览按钮插件：
   ```bash
   npm install strapi-plugin-preview-button
   ```

2. 重新部署Strapi应用

#### 配置Webhook
1. 登录Strapi Cloud控制台
2. 进入项目设置 → Webhooks
3. 创建新的Webhook：
   - **名称**: Content Revalidation
   - **URL**: `https://your-nextjs-app.vercel.app/api/revalidate`
   - **事件**: 选择以下事件
     - `entry.create`
     - `entry.update` 
     - `entry.delete`
     - `entry.publish`
     - `entry.unpublish`
   - **Headers**: 
     ```json
     {
       "Authorization": "Bearer your-secure-revalidation-token",
       "Content-Type": "application/json"
     }
     ```

### 3. 内容类型配置

确保Article内容类型已启用以下设置：
- ✅ **Draft & Publish**: 已启用
- ✅ **Internationalization**: 已启用
- ✅ **API权限**: 确保`find`和`findOne`权限已开放

## 使用方法

### 1. 创建草稿文章
1. 在Strapi管理面板中创建新文章
2. 填写内容但不要发布（保持为草稿状态）
3. 点击预览按钮查看草稿内容

### 2. 预览URL格式
- **草稿预览**: `https://your-app.com/{locale}/articles/{slug}?preview=true`
- **已发布内容**: `https://your-app.com/{locale}/articles/{slug}`

### 3. 预览模式特性
- 草稿内容实时显示
- 页面顶部显示预览模式提示
- 较短的缓存时间确保内容及时更新
- 支持多语言预览

## 测试预览功能

### 1. 本地测试
```bash
# 启动Next.js开发服务器
npm run dev

# 测试预览API
curl http://localhost:3000/api/preview?secret=your-preview-secret&slug=test-article&locale=en

# 测试revalidation API
curl -X POST http://localhost:3000/api/revalidate \
  -H "Authorization: Bearer your-revalidation-token" \
  -H "Content-Type: application/json" \
  -d '{"model": "article", "entry": {"id": 1, "slug": "test-article"}}'
```

### 2. 生产环境测试
1. 部署Next.js应用到Vercel
2. 更新Strapi Cloud环境变量中的FRONTEND_URL
3. 在Strapi中创建测试文章并使用预览功能

## 故障排除

### 常见问题

1. **预览按钮不显示**
   - 检查预览按钮插件是否正确安装
   - 确认plugins.ts配置是否正确
   - 重新部署Strapi应用

2. **预览页面显示404**
   - 检查FRONTEND_URL环境变量是否正确
   - 确认文章slug是否存在
   - 检查CORS配置是否包含前端域名

3. **草稿内容不显示**
   - 确认API Token权限是否足够
   - 检查publicationState参数是否正确传递
   - 验证Strapi客户端配置

4. **Webhook不工作**
   - 检查Webhook URL是否可访问
   - 确认Authorization header是否正确
   - 查看Strapi Cloud的Webhook日志

### 调试技巧

1. 启用详细日志记录
2. 使用浏览器开发者工具检查网络请求
3. 检查Strapi Cloud和Vercel的部署日志
4. 使用Postman测试API端点

## 安全注意事项

1. **密钥管理**
   - 使用强密码作为PREVIEW_SECRET和REVALIDATION_TOKEN
   - 定期轮换密钥
   - 不要在代码中硬编码密钥

2. **访问控制**
   - 限制预览功能的访问权限
   - 使用HTTPS确保数据传输安全
   - 定期审查API权限设置

3. **监控**
   - 监控预览API的使用情况
   - 设置异常访问告警
   - 定期检查Webhook日志

## 总结

通过以上配置，您的Strapi Cloud应用现在支持：
- 📝 草稿内容预览
- 🔄 自动缓存重新验证
- 🌐 多语言预览支持
- 🔒 安全的预览访问控制
- ⚡ 实时内容更新

预览功能现已完全配置完成，您可以开始使用草稿预览功能来改善内容创作和审核流程。