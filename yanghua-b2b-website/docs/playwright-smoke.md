# Playwright Smoke 自动化

本项目的 Playwright 自动化现在分为两层：

- `npm run test:smoke`
  只验证当前最关键的 3 条链路：
  - `/cms`
  - `/en/articles`
  - `/es/articulos`
- 旧的 `playwright.config.ts`
  继续保留给更宽的回归测试，但不再作为日常验收入口。

## 使用方式

```bash
npm run test:smoke
```

如需有头浏览器：

```bash
npm run test:smoke:headed
```

## 端口与服务

- smoke 测试会先自动探测你当前已经启动的本地站点
- 如果检测到 `3000-3010` 或 `dev.log` 里的有效地址，就直接复用，不再额外起服务
- 如果没检测到可用站点，才会在 `3011` 端口启动一个独立的 Next dev server
- 如需改端口：

```bash
PLAYWRIGHT_PORT=3020 npm run test:smoke
```

- 如需手动指定要复用的本地服务：

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run test:smoke
```

## macOS 权限建议

如果你要跑有头浏览器，建议给启动 Playwright 的终端应用这些权限：

- 系统设置 → 隐私与安全性 → 自动化
- 系统设置 → 隐私与安全性 → 辅助功能
- 系统设置 → 隐私与安全性 → 屏幕录制
- 系统设置 → 隐私与安全性 → 本地网络

常见目标应用：

- Terminal
- iTerm
- Codex

## 当前 smoke 覆盖范围

- Tina CMS 后台是否能进入 `Articles`
- 英文文章列表是否有文章
- 西语文章列表是否有文章
- 英文文章详情是否能打开
- 西语文章详情是否能打开
