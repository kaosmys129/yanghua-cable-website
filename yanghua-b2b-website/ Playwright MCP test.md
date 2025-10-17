使用 Playwright MCP 创建一个完整的多语言网站功能测试套件，按以下步骤逐步执行：

项目名称：multilingual-website-comprehensive-test
测试网站：www.yhflexiblebusbar.com

## 配置定义

1. 定义测试配置常量：
   
   支持的语言列表（locale codes）：
   - en (English)
   - es (Español)
   
   核心页面路径模板（不含 locale 前缀）：
   - / (首页)
   - /about (关于我们)
   - /products (产品页面)
   - /products/[product-id] (产品详情，如 /products/sample-product)
   - /contact (联系我们)
   - /blog (博客)
   - [添加其他页面路径]
   
   设置默认语言：en

## 第一阶段：跨语言页面可访问性测试

2. 创建双层嵌套测试循环：
   
   外层循环：遍历每种语言 (locale)
   内层循环：遍历每个页面路径 (path)
   
   对于每个 locale + path 组合执行：
   - 构建完整 URL：{baseURL}/{locale}{path}
     例如：https://example.com/zh/products
   - 使用 page.goto() 导航到目标 URL
   - 等待页面网络空闲状态（waitUntil: 'networkidle'）
   - 验证 HTTP 响应状态码为 200 或 3xx
   - 验证页面未显示 404 或 500 错误页面
   - 验证 HTML lang 属性与当前 locale 匹配（如 <html lang="en">）
   - 验证页面标题不为空且包含正确语言内容
   - 记录页面加载时间（使用 performance API）
   - 截取全页面截图，保存路径：screenshots/{locale}/{path}/page-load.png
   - 在控制台输出：✓ {locale}{path} - 状态码 200 - 加载时间 Xms

3. 记录所有失败的 URL 及错误原因到数组中

## 第二阶段：内容渲染和本地化验证

4. 对每个 locale + path 组合验证内容：
   
   **通用元素检查**：
   - 验证导航菜单存在且所有菜单项可见
   - 检查导航菜单文本是否为对应语言（非默认语言文本）
   - 验证页面主标题（h1）存在、可见且内容非空
   - 检查页脚是否完整显示
   - 验证语言切换器元素存在（通常在导航栏或页脚）
   
   **资源加载验证**：
   - 检查所有图片元素已加载完成：
     遍历所有 <img> 标签，验证 naturalWidth > 0 且 complete === true
   - 统计未加载的图片数量，记录其 src 属性
   - 监听页面 console.error 事件，捕获 JavaScript 错误
   - 检查是否有 CSS 加载失败（检查 document.styleSheets）
   
   **语言特定内容验证**：
   - 定义每个语言的关键词验证字典，例如：
     * en: {home: "Home", products: "Products", contact: "Contact"}
     * es: {home: "Inicio", products: "Productos", contact: "contacto"}
   - 在页面中搜索这些关键词，验证至少 70% 的关键词出现
   - 检查是否有混合语言内容（同时出现多种语言的关键词）
   - 验证日期格式符合该语言地区习惯（如果页面有日期）
   
   **CTA 按钮和链接验证**：
   - 识别所有按钮和链接元素
   - 验证关键 CTA 按钮文本已本地化
   - 检查链接 href 是否包含正确的 locale 前缀
   - 随机抽查 3-5 个内部链接，验证它们指向同语言版本页面
   
5. 为每个语言版本截图对比：
   - 针对同一页面的不同语言版本截图
   - 保存到 screenshots/comparison/{path}/ 目录
   - 记录布局是否一致（手动检查或记录尺寸差异）

## 第三阶段：响应式布局多语言测试

6. 选择 2-3 个关键页面进行响应式测试：
   
   对每种语言的关键页面：
   - 设置视口为桌面尺寸（1920x1080）
     * 导航到 {baseURL}/{locale}/{keyPage}
     * 验证关键元素可见
     * 截图保存：screenshots/{locale}/{keyPage}/desktop.png
   
   - 设置视口为平板尺寸（768x1024）
     * 刷新或重新导航
     * 验证移动端导航菜单（汉堡菜单）正确显示
     * 验证内容不溢出
     * 截图保存：screenshots/{locale}/{keyPage}/tablet.png
   
   - 设置视口为移动端尺寸（375x667）
     * 刷新或重新导航
     * 验证触摸友好的按钮大小
     * 验证文本在小屏幕下可读
     * 截图保存：screenshots/{locale}/{keyPage}/mobile.png

## 第四阶段：语言切换功能测试

7. 语言切换器交互测试（针对每个起始语言）：
   
   **定位语言切换器**：
   - 尝试多种选择器策略定位语言切换元素：
     * [data-testid*="language"], [data-testid*="locale"]
     * button:has-text("语言"), button:has-text("Language")
     * select[name="language"], select[id*="lang"]
     * a[href*="/en/"], a[href*="/es/"] 等语言链接
   - 记录语言切换器的类型（下拉菜单/按钮组/链接列表）
   
   **测试每种语言的切换**：
   从默认语言页面开始（如 /en/products）：
   
   对目标语言列表中的每种语言：
   - 如果是下拉菜单：点击打开，选择目标语言选项
   - 如果是按钮/链接：直接点击对应语言按钮
   - 等待页面响应（2-3 秒或等待 URL 变化）
   - 验证 URL 已更新为 /{targetLocale}/products
   - 验证 HTML lang 属性已更新为目标语言
   - 验证页面标题已切换到目标语言
   - 验证页面主要内容（h1, 导航菜单）文本已切换
   - 使用关键词字典验证内容语言正确性
   - 截图保存：screenshots/language-switch/from-{sourceLocale}-to-{targetLocale}.png
   - 记录切换耗时
   
8. 语言切换稳定性和持久性测试：
   
   **快速切换测试**：
   - 在 3 种不同语言之间快速切换（每次间隔 1 秒）
   - 每次切换后验证内容正确性
   - 检查是否有语言混乱或残留文本
   
   **跨页面导航测试**：
   - 切换到非默认语言（如 zh）
   - 点击导航菜单访问其他页面
   - 验证新页面 URL 保持 /zh/ 前缀
   - 验证语言设置在页面间保持一致
   - 测试 3-4 个不同页面的跨页导航
   
   **Cookie/LocalStorage 持久化测试**：
   - 切换到特定语言
   - 刷新页面（page.reload()）
   - 验证语言设置是否保持
   - 检查浏览器存储中的语言偏好设置
   - 记录持久化机制（Cookie/LocalStorage/URL only）

## 第五阶段：语言特定功能测试

9. 表单和交互元素本地化测试：
   
   选择包含表单的页面（如 /contact）：
   - 对每种语言版本验证：
     * 表单标签文本已本地化
     * placeholder 文本已本地化
     * 验证消息（required, invalid email 等）已本地化
     * 提交按钮文本已本地化
   - 测试表单验证：输入无效数据，检查错误提示语言
   - 测试表单提交：填写有效数据，验证成功消息语言

10. 搜索功能多语言测试（如有）：
    - 在每种语言版本测试搜索功能
    - 使用该语言的关键词进行搜索
    - 验证搜索结果页面语言一致性
    - 验证"无结果"提示已本地化

## 第六阶段：性能和 SEO 验证

11. 多语言 SEO 元数据检查：
    
    对每个 locale + path 组合：
    - 验证 <title> 标签内容符合目标语言
    - 检查 meta description 是否存在且已本地化
    - 验证 hreflang 标签配置：
      * 检查是否存在 <link rel="alternate" hreflang="{locale}">
      * 验证所有支持语言的 hreflang 链接都存在
      * 验证 x-default hreflang 指向合理的默认版本
    - 检查 canonical 标签是否正确
    - 验证 Open Graph 标签（og:title, og:description）已本地化
    - 记录缺失或错误的 meta 标签

12. 性能指标收集（每种语言的首页和 1-2 个关键页面）：
    - 使用 page.evaluate() 收集性能指标：
      * FCP (First Contentful Paint)
      * LCP (Largest Contentful Paint)
      * TTI (Time to Interactive)
      * Total Blocking Time
    - 对比不同语言版本的性能差异
    - 记录是否有语言版本性能明显低于其他版本
    - 检查网络请求：验证是否加载了不必要的语言资源

13. 控制台错误和网络请求监控：
    - 监听每个页面的 console 消息
    - 分类记录 error, warning, log
    - 收集网络请求列表（page.on('request')）
    - 检查是否有 404/500 资源请求
    - 验证字体、CSS、JS 文件是否正确加载
    - 检查是否有跨域问题（CORS errors）

## 第七阶段：边缘情况和错误处理

14. 测试不支持的语言代码：
    - 尝试访问 /xx/products（不存在的语言代码）
    - 验证网站如何处理（重定向到默认语言/显示 404/显示错误页）
    - 记录错误处理策略

15. URL 参数与 locale 路径冲突测试：
    - 测试 /zh/products?lang=en 这种情况
    - 验证哪个优先级更高
    - 记录处理逻辑

16. 语言切换后的状态保持测试：
    - 在某语言版本登录（如有登录功能）
    - 切换到另一种语言
    - 验证登录状态是否保持
    - 验证购物车等状态数据（如适用）

## 测试配置要求

- 使用 headed 模式运行以便观察过程
- 每个关键步骤之间等待 1-2 秒确保稳定性
- 为每个测试阶段添加彩色 console.log 输出（使用 emoji 标识状态）
  * ✅ 成功
  * ❌ 失败
  * ⚠️ 警告
  * 🔍 检查中
- 所有截图使用完整页面模式（fullPage: true）
- 测试失败时保存失败截图和详细错误堆栈
- 设置合理的超时时间：页面导航 30 秒，元素查找 10 秒

## 输出要求

17. 生成详细的测试报告：
    
    创建 JSON 格式报告（test-results.json），包含：
    ```
    {
      "summary": {
        "totalTests": 120,
        "passed": 115,
        "failed": 5,
        "warnings": 8,
        "duration": "5m 32s",
        "timestamp": "2025-10-17T10:00:00Z"
      },
      "locales": {
        "en": { "pages": 20, "passed": 20, "failed": 0 },
        "es": { "pages": 20, "passed": 19, "failed": 1 },
        ...
      },
      "failedTests": [
        {
          "url": "/en/products/detail",
          "error": "图片加载失败",
          "screenshot": "screenshots/zh/products/detail/failure.png"
        }
      ],
      "performanceMetrics": {
        "en": { "avgLCP": 1200, "avgFCP": 800 },
        "zh": { "avgLCP": 1350, "avgFCP": 850 }
      },
      "seoIssues": [
        {
          "url": "/ja/about",
          "issue": "缺少 hreflang 标签"
        }
      ],
      "languageSwitchTests": {
        "totalSwitches": 20,
        "successful": 20,
        "avgSwitchTime": "1.2s"
      }
    }
    ```
    
18. 生成 HTML 可视化报告：
    - 包含所有截图的对比视图
    - 按语言分组显示测试结果
    - 性能指标图表
    - 失败用例详细信息
    - 保存为 reports/index.html

19. 生成测试脚本代码：
    - 保存完整测试代码为 tests/multilingual-website-test.spec.js
    - 使用 Page Object Model 模式组织代码
    - 创建辅助类：
      * LanguageHelper（处理语言切换逻辑）
      * LocalizationValidator（验证内容本地化）
      * UrlBuilder（构建多语言 URL）
    - 添加详细中文注释
    - 包含完整的错误处理和重试逻辑

## 执行方式

- 使用 Playwright MCP 工具逐步执行上述所有阶段
- 每完成一个阶段，输出进度百分比和发现的关键问题
- 允许部分失败但继续执行后续测试
- 最后使用 headed 模式运行完整测试套件
- 在测试完成后生成并展示测试报告摘要

请开始执行测试，优先处理所有语言版本的核心页面，然后再进行深度功能测试。
