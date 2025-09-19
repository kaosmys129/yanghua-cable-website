# Vercel 部署指南

本指南将详细介绍如何将 Yanghua B2B 网站前端项目部署到 Vercel 平台。

## 📋 前期准备

### 1. 确认项目结构
确保您在正确的项目目录：
```bash
cd /Users/peterpc/Documents/Documents/yanghua\ cable\ web/yanghua-b2b-website/yanghua-b2b-website
```

### 2. 检查项目依赖
```bash
# 安装依赖
npm install

# 测试本地构建
npm run build
```

### 3. 环境变量准备
复制环境变量模板：
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入实际值：
```bash
# Strapi Configuration
STRAPI_API_TOKEN=your_actual_strapi_api_token
STRAPI_BASE_URL=https://fruitful-presence-02d7be759c.strapiapp.com

# Preview Configuration
STRAPI_PREVIEW_SECRET=your_secure_preview_secret
PREVIEW_SECRET=your_secure_preview_secret

# Revalidation Configuration
REVALIDATION_TOKEN=your_secure_revalidation_token
```

## 🚀 Vercel 部署步骤

### 方法一：通过 Vercel CLI（推荐）

#### 1. 安装 Vercel CLI
```bash
npm install -g vercel
```

#### 2. 登录 Vercel
```bash
vercel login
```
按提示选择登录方式（GitHub、GitLab、Bitbucket 或 Email）

#### 3. 初始化项目
在项目根目录运行：
```bash
vercel
```

按提示配置：
- **Set up and deploy**: 选择 `Y`
- **Which scope**: 选择您的账户或团队
- **Link to existing project**: 选择 `N`（首次部署）
- **Project name**: 输入项目名称，如 `yanghua-b2b-website`
- **In which directory**: 按 Enter（使用当前目录）
- **Want to override settings**: 选择 `N`（使用默认设置）

#### 4. 配置环境变量
部署完成后，在 Vercel 控制台配置环境变量：

```bash
# 通过 CLI 添加环境变量
vercel env add STRAPI_API_TOKEN
vercel env add STRAPI_BASE_URL
vercel env add STRAPI_PREVIEW_SECRET
vercel env add PREVIEW_SECRET
vercel env add REVALIDATION_TOKEN
```

或者在 Vercel 控制台手动添加：
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 进入 **Settings** → **Environment Variables**
4. 添加以下变量：

| 变量名 | 值 | 环境 |
|--------|----|---------|
| `STRAPI_API_TOKEN` | 您的 Strapi API Token | Production, Preview, Development |
| `STRAPI_BASE_URL` | `https://fruitful-presence-02d7be759c.strapiapp.com` | Production, Preview, Development |
| `STRAPI_PREVIEW_SECRET` | 您的预览密钥 | Production, Preview, Development |
| `PREVIEW_SECRET` | 您的预览密钥（同上） | Production, Preview, Development |
| `REVALIDATION_TOKEN` | 您的重新验证令牌 | Production, Preview, Development |

#### 5. 重新部署
```bash
vercel --prod
```

### 方法二：通过 Git 集成

#### 1. 推送代码到 Git 仓库
```bash
# 初始化 Git（如果还没有）
git init
git add .
git commit -m "Initial commit for Vercel deployment"

# 添加远程仓库（替换为您的仓库地址）
git remote add origin https://github.com/yourusername/yanghua-b2b-website.git
git push -u origin main
```

#### 2. 连接 Vercel 和 Git
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **New Project**
3. 选择 **Import Git Repository**
4. 选择您的仓库
5. 配置项目设置：
   - **Project Name**: `yanghua-b2b-website`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `./`（如果项目在根目录）
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### 3. 配置环境变量
在项目设置中添加上述环境变量。

#### 4. 部署
点击 **Deploy** 开始部署。

## 🔧 高级配置

### 1. 自定义域名
1. 在 Vercel 项目设置中，进入 **Domains**
2. 添加您的自定义域名
3. 按照提示配置 DNS 记录

### 2. 构建优化
创建 `vercel.json` 配置文件：
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["hkg1", "sin1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### 3. 预览部署
每次推送到非主分支时，Vercel 会自动创建预览部署：
```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
```

## 📊 部署后验证

### 1. 检查网站功能
- ✅ 首页加载正常
- ✅ 多语言切换功能
- ✅ 文章列表和详情页
- ✅ 产品页面
- ✅ 联系表单
- ✅ 图片加载

### 2. 检查 API 连接
访问 `https://your-domain.vercel.app/test-cloud` 检查 Strapi 连接状态。

### 3. 检查预览功能
测试文章预览功能是否正常工作。

## 🔍 故障排除

### 常见问题

#### 1. 构建失败
```bash
# 检查本地构建
npm run build

# 检查依赖
npm install

# 清理缓存
npm run clean
rm -rf .next
npm run build
```

#### 2. 环境变量未生效
- 确保变量名拼写正确
- 检查变量是否应用到正确的环境（Production/Preview/Development）
- 重新部署项目

#### 3. 图片加载失败
检查 `next.config.ts` 中的 `remotePatterns` 配置是否包含所有需要的域名。

#### 4. API 连接失败
- 检查 `STRAPI_BASE_URL` 是否正确
- 验证 `STRAPI_API_TOKEN` 是否有效
- 确认 Strapi 服务器可访问

### 调试命令
```bash
# 查看 Vercel 项目信息
vercel ls

# 查看部署日志
vercel logs

# 查看环境变量
vercel env ls

# 本地预览生产构建
npm run build
npm run start
```

## 📈 性能优化建议

1. **启用 CDN**: Vercel 自动提供全球 CDN
2. **图片优化**: 使用 Next.js Image 组件
3. **代码分割**: 利用 Next.js 自动代码分割
4. **缓存策略**: 配置适当的缓存头
5. **监控**: 使用 Vercel Analytics 监控性能

## 🔐 安全建议

1. **环境变量**: 不要在代码中硬编码敏感信息
2. **API 密钥**: 定期轮换 API 密钥
3. **域名**: 配置 HTTPS 和安全头
4. **访问控制**: 限制预览功能的访问

## 📞 支持

如果遇到问题，可以：
1. 查看 [Vercel 文档](https://vercel.com/docs)
2. 检查 [Next.js 部署指南](https://nextjs.org/docs/deployment)
3. 联系技术支持团队

---

**部署完成后，您的网站将在以下地址可用：**
- 生产环境: `https://your-project-name.vercel.app`
- 自定义域名: `https://your-custom-domain.com`

祝您部署顺利！ 🎉