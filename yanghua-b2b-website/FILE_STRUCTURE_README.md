# 杨华B2B网站文件结构说明

## 概述

本文档详细说明了杨华B2B网站经过优化后的文件结构设计，旨在提供更清晰、更逻辑化、更易维护的代码组织方式。

## 项目结构

```
yanghua-b2b-website/
├── public/                    # 静态资源目录
│   ├── images/               # 图片资源（按类型分类）
│   │   ├── certifications/   # 认证证书图片
│   │   ├── news/            # 新闻相关图片
│   │   ├── partners/        # 合作伙伴logo
│   │   ├── products/        # 产品图片
│   │   ├── projects/        # 项目案例图片
│   │   └── solutions/       # 解决方案图片
│   ├── data/                # JSON数据文件
│   ├── english/             # 英文相关资源
│   └── *.svg, *.jpg         # 通用图标和背景
├── src/                      # 源代码目录
│   ├── app/                 # Next.js App Router页面
│   │   ├── about/           # 关于我们页面
│   │   ├── contact/         # 联系我们页面
│   │   ├── news/            # 新闻页面
│   │   ├── products/        # 产品页面
│   │   ├── projects/        # 项目页面
│   │   ├── services/        # 服务页面
│   │   ├── solutions/       # 解决方案页面
│   │   ├── layout.tsx       # 根布局
│   │   ├── page.tsx         # 首页
│   │   └── globals.css      # 全局样式
│   ├── components/          # React组件（按功能分类）
│   │   ├── business/        # 业务相关组件
│   │   │   ├── ApplicationAreas.tsx
│   │   │   ├── CompanyStrength.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── ImageWithFallback.tsx
│   │   │   ├── Partners.tsx
│   │   │   └── ProductFeatures.tsx
│   │   ├── features/        # 功能特性组件
│   │   │   ├── ContactForm.tsx
│   │   │   └── InquiryForm.tsx
│   │   ├── layout/          # 布局组件
│   │   │   ├── Footer.tsx
│   │   │   └── Header.tsx
│   │   └── ui/              # 通用UI组件
│   │       ├── DebugPanel.tsx
│   │       └── ErrorBoundary.tsx
│   ├── lib/                 # 工具函数库
│   │   └── errorLogger.ts
│   ├── assets/              # 源码相关资源
│   │   ├── images/          # 组件内使用的图片
│   │   ├── icons/           # 图标资源
│   │   └── styles/          # 样式文件
│   └── types/               # TypeScript类型定义
│       └── news.ts
├── next.config.ts           # Next.js配置
├── package.json             # 项目依赖
├── tsconfig.json            # TypeScript配置
└── README.md                # 项目说明
```

## 设计原则

### 1. 功能模块化
- **按功能分类**：组件按业务功能、特性功能、布局功能、UI功能分类
- **职责分离**：静态资源、源代码、配置文件明确分离
- **逻辑清晰**：相关文件就近放置，便于查找和维护

### 2. 层级控制
- **最大3层**：目录层级不超过3层，避免过深嵌套
- **扁平化**：在保持逻辑性的前提下尽量扁平化结构

### 3. 命名规范
- **一致性**：使用统一的命名约定
- **描述性**：目录和文件名能清楚表达其用途
- **英文命名**：所有目录和文件使用英文命名

## 组件分类说明

### business/ - 业务组件
包含与具体业务逻辑相关的组件：
- `Hero.tsx` - 首页英雄区域
- `CompanyStrength.tsx` - 公司实力展示
- `ProductFeatures.tsx` - 产品特性
- `ApplicationAreas.tsx` - 应用领域
- `Partners.tsx` - 合作伙伴
- `ImageWithFallback.tsx` - 带回退的图片组件

### features/ - 功能组件
包含特定功能的组件：
- `ContactForm.tsx` - 联系表单
- `InquiryForm.tsx` - 询价表单

### layout/ - 布局组件
包含页面布局相关的组件：
- `Header.tsx` - 页面头部
- `Footer.tsx` - 页面底部

### ui/ - 通用UI组件
包含可复用的通用组件：
- `ErrorBoundary.tsx` - 错误边界
- `DebugPanel.tsx` - 调试面板

## 静态资源组织

### images/ 目录结构
按业务类型分类存放图片：
- `certifications/` - 认证证书
- `news/` - 新闻图片
- `partners/` - 合作伙伴logo
- `products/` - 产品图片
- `projects/` - 项目案例
- `solutions/` - 解决方案

### data/ 目录
存放所有JSON数据文件，统一管理数据资源。

## 维护指南

### 添加新组件
1. 确定组件类型（business/features/layout/ui）
2. 在对应目录下创建组件文件
3. 使用PascalCase命名组件文件
4. 更新相关的导入路径

### 添加新页面
1. 在`src/app/`下创建对应目录
2. 创建`page.tsx`文件
3. 如需要，创建相关的子页面目录

### 添加静态资源
1. 图片资源放入`public/images/`对应分类目录
2. 数据文件放入`public/data/`目录
3. 使用描述性文件名

### 导入路径规范
- 使用相对路径或`@/`别名
- 保持导入路径的一致性
- 及时更新重构后的路径

## 迁移记录

### 已完成的重构
1. ✅ 清理重复配置文件和无用目录
2. ✅ 重组组件目录结构
3. ✅ 更新所有导入路径
4. ✅ 重组静态资源目录
5. ✅ 统一命名规范
6. ✅ 创建文档说明

### 主要变更
- 删除了`cable/`和`web/`重复目录
- 将`src/utils/`重命名为`src/lib/`
- 重组`src/components/`为功能分类
- 重组`public/`目录按资源类型分类
- 修正了`enlighs`为`english`的拼写错误

## 注意事项

1. **URL兼容性**：所有页面路由保持不变，确保现有链接正常工作
2. **导入路径**：重构后及时更新所有相关的导入语句
3. **资源引用**：更新代码中对静态资源的引用路径
4. **团队协作**：确保团队成员了解新的文件结构规范

---

*最后更新：2025年1月*