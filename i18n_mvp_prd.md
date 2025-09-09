# 杨华B2B网站i18n双语功能扩展开发PRD

## 1. 项目概述

### 1.1 项目背景
基于已完成的首页双语功能MVP实现，现需扩展实现about、product中心及其详情页、solution中心及其详情页、contact us页面的双语功能，以更好地服务国际客户，提升品牌国际化形象。

### 1.2 项目目标
- 基于已验证的Next.js App Router下的i18n实现方案进行扩展
- 实现核心业务页面的完整双语化
- 保持一致的语言切换体验和UI/UX设计规范
- 确保语言切换功能在各页面间无缝衔接

## 2. 已完成功能（MVP基础）

### 2.1 已实现的核心功能 ✅
- **语言切换器**：页面顶部提供EN/ES语言切换按钮
- **首页内容双语化**：首页关键内容支持英文和西班牙语显示
- **URL路由本地化**：支持 `/en` 和 `/es` 路由前缀
- **默认语言处理**：根据浏览器语言偏好自动选择默认语言
- **技术基础设施**：Next.js App Router + next-intl架构已搭建完成

## 3. 扩展功能需求

### 3.1 About页面双语化
#### 需要双语化的元素：
- **Hero区域**：主标题、副标题、CTA按钮
- **公司概述**：标题、描述段落、统计数据标签
- **使命与价值观**：使命标题、使命内容、价值观列表
- **发展历程**：标题、副标题、里程碑事件描述
- **质量认证**：标题、描述文本、CTA按钮
- **团队介绍**：标题、团队成员职位、经验描述
- **CTA区域**：标题、描述文本、按钮

### 3.2 Products页面双语化
#### 需要双语化的元素：
- **Hero区域**：主标题、描述
- **产品概述**：标题、产品组合介绍
- **产品分类**：分类名称、分类描述、型号标签、CTA按钮
- **技术规格**：标题、规格项目、规格描述
- **产品详情页**：规格参数、应用场景、技术特点、相关产品推荐

### 3.3 Solutions页面双语化
#### 需要双语化的元素：
- **Hero区域**：主标题、描述
- **解决方案分类**：方案名称、方案描述、亮点列表、应用场景
- **技术优势**：优势标题、优势描述
- **技术规格**：参数名称、参数值和说明
- **案例研究**：案例标题、案例描述
- **解决方案详情页**：方案详细介绍、成功案例、技术文档、相关解决方案

### 3.4 Contact Us页面双语化
#### 需要双语化的元素：
- **Hero区域**：主标题、描述
- **联系信息**：标题、联系方式标签、联系方式描述
- **全球支持**：标题、描述、地区列表
- **联系表单**：表单字段标签、按钮文本、状态消息

## 4. 技术实现方案

### 4.1 沿用已验证的技术架构
- **框架**：Next.js 14+ App Router
- **i18n库**：next-intl（已配置）
- **语言检测**：基于浏览器Accept-Language头（已实现）
- **存储**：localStorage保存用户语言偏好（已实现）
- **文件结构**：保持现有的 `[locale]` 路由结构

### 4.2 翻译文件扩展结构
现有的翻译文件需要扩展以支持新页面：

```json
// messages/en.json 扩展
{
  "navigation": { /* 已存在 */ },
  "hero": { /* 已存在 */ },
  "about": {
    "hero": {
      "title": "About Yang Hua",
      "subtitle": "Leading B2B solutions provider since 2013",
      "cta": {
        "explore": "Explore Our Solutions",
        "download": "Download Company Profile"
      }
    },
    "overview": {
      "title": "Company Overview",
      "description": "Yang Hua is a leading manufacturer...",
      "stats": {
        "experience": "Years of Experience",
        "clients": "Global Clients",
        "products": "Product Lines",
        "countries": "Countries Served"
      }
    }
    // ... 其他about相关内容
  },
  "products": {
    "hero": {
      "title": "Our Products",
      "description": "Discover our comprehensive range..."
    },
    "categories": {
      "industrial": "Industrial Solutions",
      "commercial": "Commercial Solutions",
      "residential": "Residential Solutions"
    }
    // ... 其他products相关内容
  },
  "solutions": {
    "hero": {
      "title": "Our Solutions",
      "description": "Comprehensive solutions for diverse industries"
    }
    // ... 其他solutions相关内容
  },
  "contact": {
    "hero": {
      "title": "Contact Us",
      "description": "Get in touch with our team..."
    },
    "form": {
      "name": "Name",
      "email": "Email",
      "company": "Company",
      "message": "Message",
      "submit": "Send Message"
    }
    // ... 其他contact相关内容
  }
}
```

### 4.3 组件改造策略

#### 使用 `useTranslations` Hook
```tsx
// About页面示例
import { useTranslations } from 'next-intl';

export default function AboutPage() {
  const t = useTranslations('about');
  
  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
      <button>{t('hero.cta.explore')}</button>
    </div>
  );
}
```

#### 动态数据处理
```tsx
// 产品分类数据示例
const getProductCategories = () => {
  const t = useTranslations('products');
  return [
    { id: 'industrial', name: t('categories.industrial') },
    { id: 'commercial', name: t('categories.commercial') },
    { id: 'residential', name: t('categories.residential') }
  ];
};
```

## 5. 设计规范保持

### 5.1 UI/UX一致性
- **语言切换器**：保持现有的设计和交互方式
- **布局结构**：各页面保持相同的布局逻辑
- **色彩方案**：沿用现有的品牌色彩
- **字体处理**：确保中英文字体的一致性和可读性

### 5.2 交互体验
- **切换动画**：保持平滑的语言切换过渡效果
- **状态保持**：在页面间切换时保持语言选择
- **加载性能**：确保翻译文件的按需加载
- **错误处理**：统一的错误提示和回退机制

### 5.3 响应式设计
- **移动端适配**：确保所有双语内容在移动设备上正常显示
- **文本长度处理**：考虑中英文文本长度差异对布局的影响
- **图片和媒体**：确保多媒体内容的多语言标注

## 6. 实施计划

### 6.1 开发阶段 (预计8-10天)

#### Phase 1: About页面双语化 (2天)
- [ ] 扩展翻译文件，添加about相关的所有文本
- [ ] 改造About页面组件，替换硬编码文本
- [ ] 测试语言切换功能
- [ ] 验证URL路由正确性

#### Phase 2: Products页面双语化 (3天)
- [ ] 扩展翻译文件，添加products相关文本
- [ ] 改造Products主页面和详情页组件
- [ ] 处理产品分类和型号的动态数据
- [ ] 测试产品详情页的语言切换

#### Phase 3: Solutions页面双语化 (3天)
- [ ] 扩展翻译文件，添加solutions相关文本
- [ ] 改造Solutions主页面和详情页组件
- [ ] 处理解决方案的复杂数据结构
- [ ] 测试案例研究的双语展示

#### Phase 4: Contact页面双语化 (1天)
- [ ] 扩展翻译文件，添加contact相关文本
- [ ] 改造Contact页面组件
- [ ] 确保表单验证消息的双语化
- [ ] 测试表单提交的多语言反馈

#### Phase 5: 整体测试与优化 (1天)
- [ ] 跨页面语言切换测试
- [ ] URL路由一致性检查
- [ ] 性能优化和代码审查
- [ ] 用户体验测试

### 6.2 测试计划
- **功能测试**：验证所有页面的语言切换、URL路由、默认语言设置
- **跨页面测试**：确保语言切换在页面间无缝衔接
- **动态内容测试**：验证产品信息、解决方案等动态数据的双语化
- **表单测试**：验证联系表单的多语言验证和反馈
- **浏览器测试**：Chrome, Firefox, Safari, Edge兼容性
- **移动端测试**：响应式布局下的语言切换
- **性能测试**：确保翻译文件按需加载，无性能下降

## 7. 验收标准

### 7.1 功能验收
- [ ] About页面所有文本内容支持中英文切换
- [ ] Products页面和详情页支持完整双语化
- [ ] Solutions页面和详情页支持完整双语化
- [ ] Contact页面支持完整双语化
- [ ] 语言切换在所有页面间无缝衔接
- [ ] URL路由在所有页面正确显示语言标识
- [ ] 动态数据（产品信息、解决方案等）正确双语化

### 7.2 性能验收
- [ ] 语言切换响应时间 < 200ms
- [ ] 页面加载时间无明显增加
- [ ] 翻译文件按需加载，避免冗余
- [ ] 图片和媒体资源优化加载

### 7.3 兼容性验收
- [ ] 支持主流浏览器（Chrome、Firefox、Safari、Edge）
- [ ] 移动端和桌面端适配正常
- [ ] SEO友好的URL结构保持
- [ ] 搜索引擎能正确索引多语言内容

### 7.4 用户体验验收
- [ ] 中英文文本排版美观，无布局错乱
- [ ] 语言切换后用户能快速理解页面内容
- [ ] 表单和交互元素的多语言反馈准确
- [ ] 错误提示和状态消息正确本地化

## 8. 后续维护和扩展

### 8.1 内容维护
- **翻译更新流程**：建立内容更新时的翻译同步机制
- **质量控制**：定期审查翻译质量和术语一致性
- **版本管理**：建立翻译文件的版本控制流程

### 8.2 功能扩展
- **更多语言**：为未来添加西班牙语、德语等做好架构准备
- **动态内容**：为CMS管理的动态内容做好多语言支持准备
- **SEO优化**：实施更高级的多语言SEO策略

### 8.3 性能优化
- **缓存策略**：实施翻译内容的缓存机制
- **CDN分发**：考虑多语言内容的全球分发
- **懒加载**：实施更精细的翻译内容懒加载策略

## 9. 注意事项

### 9.1 排除范围
- **News页面**：按要求暂不实现双语功能
- **管理后台**：暂不涉及后台管理界面的多语言化
- **第三方集成**：暂不处理第三方服务的多语言集成

### 9.2 技术约束
- **保持现有架构**：不对现有的技术架构做大幅调整
- **向后兼容**：确保新功能不影响现有功能
- **性能要求**：多语言功能不应显著影响网站性能

### 9.3 内容质量
- **专业术语**：确保行业专业术语的准确翻译
- **品牌一致性**：保持品牌信息在不同语言版本中的一致性
- **文化适应**：考虑不同文化背景下的表达习惯

## 10. 成功指标

- **技术指标**：语言切换响应时间 < 200ms，所有页面双语化完成率 100%
- **用户指标**：用户能够成功在所有页面间切换并浏览不同语言版本
- **质量指标**：翻译内容准确率 100%，无功能性bug，跨页面语言切换无缝衔接

---

**项目负责人**：前端开发团队  
**预计完成时间**：8-10个工作日  
**最后更新**：2025年1月