# Tina Local CMS Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在当前 Next.js 项目中接通可本地访问的 Tina CMS 编辑后台，并为文章与 Hub 内容提供稳定的本地编辑入口。

**Architecture:** 保留现有 `/admin` 系统页不动，把 Tina 后台挂到静态路径 `/cms`。开发时通过 Tina CLI 启动本地编辑模式，生产/构建时通过 Tina build 生成 `public/cms` 静态后台入口。

**Tech Stack:** Next.js 14, TinaCMS, TypeScript, npm scripts

---

### Task 1: 补齐 Tina 运行依赖与脚本

**Files:**
- Modify: `package.json`

- [ ] 增加独立的 Next 开发脚本，避免和 Tina CLI 链路冲突。
- [ ] 增加 Tina 本地开发脚本，例如 `cms:dev`。
- [ ] 增加 Tina 静态后台构建脚本，例如 `cms:build`。

### Task 2: 调整 Tina 输出路径到 `/cms`

**Files:**
- Modify: `tina/config.ts`

- [ ] 把 `build.outputFolder` 从 `admin` 改为 `cms`，避免和现有 `/admin` 页面冲突。
- [ ] 保持 `publicFolder: 'public'`，确保生成结果直接落到 `public/cms`。
- [ ] 确认文章与 Hub 集合继续指向 `content/` 目录。

### Task 3: 提供明确的本地后台使用说明

**Files:**
- Modify: `README.md`
- Modify: `.env.example`

- [ ] 在 README 中新增“Tina 本地编辑后台”章节。
- [ ] 说明本地启动命令、访问地址、适用内容集合。
- [ ] 在 `.env.example` 中补充 Tina 本地模式说明，标明本地编辑不依赖 Tina Cloud 登录。

### Task 4: 生成后台静态入口并验证

**Files:**
- Generated: `public/cms/*`

- [ ] 运行 Tina 构建，生成后台静态入口。
- [ ] 确认生成物存在于 `public/cms`。
- [ ] 记录实际访问地址为 `/cms/index.html`。

### Task 5: 回归验证

**Files:**
- Verify: `tina/config.ts`
- Verify: `package.json`
- Verify: `public/cms/index.html`

- [ ] 运行 `npm run cms:build`。
- [ ] 运行 `npm run build`，确认 Next 构建不受影响。
- [ ] 验证本地开发时能通过 `npm run cms:dev` 打开 Tina 后台。
