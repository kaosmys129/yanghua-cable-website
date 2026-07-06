---
name: multilingual-expansion
description: 阳华 B2B 网站的多语言（法语 fr, 葡语 pt 等）开发扩展指南与验证清单
---

# 阳华 B2B 网站多语言开发扩展技能

本 Skill 规范了扬华科技静态 Astro 5 网站的多语言架构设计以及扩展新语言（如法语 `fr`、葡萄牙语 `pt`）的完整操作流程，确保 URL 本地化、编译期 Glob 注入、重定向中间件以及多语言 SEO 相互对齐。

## 1. 阳华网站多语言核心架构

阳华外贸网站的国际化（i18n）采用**基于物理子目录和 URL 语义本地化**的方案。
* **默认语言**：英文，通过根路由 `/` 308 重定向到 `/en`。
* **物理本地化路由**：每种语言在 `src/pages/[locale]/` 下都拥有完全翻译为本地语言的对应目录。
* **编译期同步**：所有的文章、Hub 和页面配置数据都存放于遗留项目（`content/` 目录下），在 Astro 编译前通过 `copy-legacy-content.mjs` 拷贝至 `astro-site/src/data/legacy-content/`，在构建期静态渲染打包。

---

## 2. 后续扩展新语言（以 fr, pt 为例）的开发流程

当需要新增法语（`fr`） and 葡萄牙语（`pt`）版本时，请严格按照以下四个阶段执行：

### 阶段一：数据源准备（Data & Translation）
1. **文章和 Hub 翻译**：
   * 将所有的 MDX 文章翻译后，放置于 `content/articles/fr/` and `content/articles/pt/`。
   * 将所有的 MDX Hub 翻译后，放置于 `content/hubs/fr/` and `content/hubs/pt/`。
2. **基础页面配置**：
   * 复制一份 `content/pages/en/` 到 `content/pages/fr/` and `content/pages/pt/`，将其中的翻译字段修改为对应的法语/葡语。
3. **UI 字典翻译**：
   * 在 `src/messages/` 下创建 `fr.json` and `pt.json`，完成全部 UI 组件（如 Header、Footer、Contact 按钮等）的翻译。

### 阶段二：配置 Astro 构建读取（Vite Glob Extends）
由于 Astro 在静态构建时采用 Vite 的 `import.meta.glob` 静态分析文件，新语言的添加必须显式修改读取逻辑：
1. 打开 `astro-site/src/lib/yanghua/articles.mjs`。
2. 在 `localArticleModules`、`localHubModules`、`legacyArticleModules`、`legacyHubModules` 中追加对应语言的读取路径：
   ```javascript
   const localArticleModules = {
     en: import.meta.glob('../../data/legacy-content/content/articles/en/*.mdx', { eager: true }),
     es: import.meta.glob('../../data/legacy-content/content/articles/es/*.mdx', { eager: true }),
     fr: import.meta.glob('../../data/legacy-content/content/articles/fr/*.mdx', { eager: true }),
     pt: import.meta.glob('../../data/legacy-content/content/articles/pt/*.mdx', { eager: true }),
   };
   ```
3. 确保所有涉及到语言数组遍历的辅助函数中都引入了 `'fr'` and `'pt'`（例如 `getAllArticles` 中 `['en', 'es', 'fr', 'pt'].flatMap(...)`）。

### 阶段三：创建物理本地化路由页面（Astro Pages Setup）
1. 在 `astro-site/src/pages/` 下创建 `fr` and `pt` 目录。
2. 将 `es` 目录下的所有结构物理复制一份到 `fr` and `pt`。
3. **关键：对目录名进行本地化翻译**！例如：
   * 西文（已存在）：`es/acerca-de/` (关于我们)、`es/productos/` (产品)、`es/contacto/` (联系)
   * 法文：`fr/a-propos/` (关于我们)、`fr/produits/` (产品)、`fr/contact/` (联系)
   * 葡文：`pt/sobre/` (关于我们)、`pt/produtos/` (产品)、`pt/contato/` (联系)
4. 打开子目录下的 `index.astro`，将其中的参数硬编码或调用统一改为对应的 `locale="fr"` 或 `locale="pt"`（如 `<Header locale="fr" />`）。

### 阶段四：中间件重定向及路由规范（Middleware Configuration）
1. 打开 `astro-site/src/middleware.ts`。
2. 在 `ENGLISH_ROOT_PATTERNS` 类似的逻辑中，为 `fr` and `pt` 加上错漏路径 301 重定向映射。
   * 例如：如果用户输入了 `/fr/products`，应 301 重定向到 `/fr/produits`。
3. 扩展匹配逻辑，使中间件能够正确跳过 `fr` and `pt` 下的静态资源路由。

---

## 3. SEO 与质量核验验证清单

在新增语言发布前，必须进行以下验证以保证外贸推广的页面收录质量：
* **多语言 Canonical 验证**：每个页面对应的规范 URL 必须唯一且准确。
* **Hreflang 双向对称性验证**：
  * 在英文页面（如 `/en/about`）必须包含 `hreflang="fr" href=".../fr/a-propos"` 的 alternate 标签。
  * 在法语页面（如 `/fr/a-propos`）必须包含 `hreflang="en" href=".../en/about"` 的 alternate 标签。
  * 缺失任何一方的指向，都会导致 Google 在搜索控制台报错。
* **自动化测试运行**：
  * 运行 `python3 scripts/batch_check_hreflang_canonical.py`（如有需要，将新语言加入该脚本的核对数组中）来做全量页面 SEO 检查。
  * 运行 `npm run build` 验证 300+ 页面能够无错生成。
