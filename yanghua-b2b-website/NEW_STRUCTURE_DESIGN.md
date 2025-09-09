# 杨华B2B网站优化文件结构设计

## 当前结构问题分析

### 主要问题
1. **配置文件重复**: 存在 `next.config.js` 和 `next.config.ts` 两个配置文件
2. **静态资源混乱**: `public` 目录下存在语言特定的数据文件，应该移到 `src` 目录
3. **组件分类不清**: 组件按页面分类，但缺乏通用组件的分类
4. **无用目录**: `web/` 和 `cable/` 目录存在但用途不明
5. **层级过深**: 某些路径超过3层，如 `src/app/[locale]/products/category/[name]/`
6. **命名不统一**: 文件命名风格不一致

## 新的优化结构设计

### 设计原则
1. **功能模块化**: 按业务功能组织目录
2. **层级控制**: 确保目录层级不超过3层
3. **命名统一**: 采用一致的命名规范
4. **职责分离**: 清晰分离配置、源码、资源
5. **易于维护**: 结构清晰，便于开发和维护

### 新目录结构

```
yanghua-b2b-website/
├── docs/                          # 项目文档
│   ├── README.md                  # 项目说明
│   ├── STRUCTURE.md              # 结构说明
│   └── CHANGELOG.md              # 更新日志
├── public/                        # 静态资源
│   ├── images/                    # 图片资源
│   │   ├── icons/                # 图标文件
│   │   ├── photos/               # 照片文件
│   │   └── logos/                # 标志文件
│   ├── data/                     # 静态数据文件
│   └── favicon.ico               # 网站图标
├── src/                          # 源代码
│   ├── app/                      # Next.js App Router
│   │   ├── (pages)/              # 页面组
│   │   │   ├── about/            # 关于页面
│   │   │   ├── contact/          # 联系页面
│   │   │   ├── news/             # 新闻页面
│   │   │   ├── products/         # 产品页面
│   │   │   ├── projects/         # 项目页面
│   │   │   ├── services/         # 服务页面
│   │   │   └── solutions/        # 解决方案页面
│   │   ├── globals.css           # 全局样式
│   │   ├── layout.tsx            # 根布局
│   │   └── page.tsx              # 首页
│   ├── components/               # React组件
│   │   ├── ui/                   # 通用UI组件
│   │   │   ├── Button.tsx        # 按钮组件
│   │   │   ├── Form.tsx          # 表单组件
│   │   │   └── Modal.tsx         # 模态框组件
│   │   ├── layout/               # 布局组件
│   │   │   ├── Header.tsx        # 页头
│   │   │   ├── Footer.tsx        # 页脚
│   │   │   └── Navigation.tsx    # 导航
│   │   ├── business/             # 业务组件
│   │   │   ├── ProductCard.tsx   # 产品卡片
│   │   │   ├── NewsCard.tsx      # 新闻卡片
│   │   │   └── ProjectCard.tsx   # 项目卡片
│   │   └── features/             # 功能组件
│   │       ├── ContactForm.tsx   # 联系表单
│   │       ├── InquiryForm.tsx   # 询价表单
│   │       └── SearchBox.tsx     # 搜索框
│   ├── lib/                      # 工具库
│   │   ├── utils.ts              # 通用工具
│   │   ├── constants.ts          # 常量定义
│   │   └── api.ts                # API接口
│   ├── types/                    # 类型定义
│   │   ├── index.ts              # 主要类型
│   │   ├── api.ts                # API类型
│   │   └── components.ts         # 组件类型
│   └── styles/                   # 样式文件
│       ├── globals.css           # 全局样式
│       └── components.css        # 组件样式
├── .env.example                  # 环境变量示例
├── .gitignore                    # Git忽略文件
├── eslint.config.mjs             # ESLint配置
├── next.config.ts                # Next.js配置
├── package.json                  # 项目依赖
├── postcss.config.mjs            # PostCSS配置
└── tsconfig.json                 # TypeScript配置
```

## 主要改进点

### 1. 目录结构优化
- **移除重复配置**: 只保留 `next.config.ts`
- **清理无用目录**: 删除 `web/` 和 `cable/` 目录
- **层级控制**: 所有路径不超过3层
- **功能分组**: 使用 `(pages)` 路由组织页面

### 2. 组件重新分类
- **ui/**: 通用UI组件，可复用
- **layout/**: 布局相关组件
- **business/**: 业务特定组件
- **features/**: 功能性组件

### 3. 静态资源整理
- **images/**: 按类型分类图片
- **data/**: 静态数据文件
- **移除语言目录**: 数据文件移到 `src/lib/`

### 4. 代码组织优化
- **lib/**: 工具函数和常量
- **types/**: 类型定义集中管理
- **styles/**: 样式文件独立目录

### 5. 文档完善
- **docs/**: 项目文档集中管理
- **README.md**: 详细的项目说明
- **STRUCTURE.md**: 结构设计文档

## 命名规范

### 文件命名
- **组件文件**: PascalCase (如 `ProductCard.tsx`)
- **工具文件**: camelCase (如 `utils.ts`)
- **配置文件**: kebab-case (如 `next.config.ts`)
- **样式文件**: kebab-case (如 `globals.css`)

### 目录命名
- **功能目录**: kebab-case (如 `contact-form/`)
- **页面目录**: kebab-case (如 `about/`)
- **组件目录**: kebab-case (如 `ui/`)

## 迁移计划

### 阶段1: 重组组件
1. 创建新的组件目录结构
2. 按新分类移动组件文件
3. 更新组件导入路径

### 阶段2: 整理静态资源
1. 重组 `public` 目录
2. 移动数据文件到合适位置
3. 更新资源引用路径

### 阶段3: 优化配置和文档
1. 清理重复配置文件
2. 创建新的文档结构
3. 更新项目说明

### 阶段4: 测试和验证
1. 验证所有路由正常工作
2. 检查资源加载正确
3. 确保构建成功

## 预期收益

1. **提高开发效率**: 清晰的结构便于快速定位文件
2. **降低维护成本**: 统一的规范减少混乱
3. **增强可扩展性**: 模块化设计便于功能扩展
4. **改善团队协作**: 标准化的结构便于团队开发
5. **优化构建性能**: 合理的组织有助于构建优化

---

**设计时间**: 2025年1月2日  
**设计目标**: 创建清晰、高效、易维护的项目结构  
**实施优先级**: 高