# Legacy Next.js Project

> 这个目录保留为 legacy 内容、Tina 和历史代码来源。当前本地前端已经限定为 `../astro-site` 的 Astro Small Business 主题。请不要在这里用 `npm run dev` 启动前台站点。

## 当前前端启动方式

从 monorepo 根目录启动 Astro：

```bash
cd "/Users/peterpc/Documents/Documents/yanghua cable web/yanghua-b2b-website"
npm run dev
```

构建和预览也从 monorepo 根目录执行：

```bash
npm run build
npm run start
# 或
npm run preview:astro
```

## Legacy 调试入口

只有在确实需要调试历史 Next/Tina 行为时，才使用显式 legacy 命令：

```bash
npm run legacy:next:dev
npm run legacy:next:build
npm run legacy:next:start
npm run legacy:cms:dev
```

直接运行 `npm run dev`、`npm run build` 或 `npm run start` 会显示保护提示并退出，避免误启动旧线上风格主题。

## 内容说明

Astro 当前仍会读取本目录中的内容、messages 和图片数据。这是内容复用，不代表旧 Next 主题仍参与本地默认前端。
