# Yanghua B2B Website

## 本地开发

标准网站开发：

```bash
npm run dev
```

这会启动 Next.js 开发服务器，并同时开放本地 Tina 编辑后台入口。

## Tina 本地编辑后台

本项目已经接入 Tina CMS 的本地编辑模式，文章与 Hub 内容保存在仓库内的 `content/` 目录。

如需单独跑 Tina CLI 本地模式，可显式使用：

```bash
npm run cms:dev
```

启动后可访问：

- 网站前台：`http://localhost:3000` 或终端显示的实际端口
- Tina 后台：`http://localhost:3000/cms` 或对应端口下的 `/cms`

说明：

- 当前是 **本地编辑模式**，不需要 Tina Cloud 登录。
- 可直接编辑以下内容集合：
  - `content/articles/en/*.mdx`
  - `content/articles/es/*.mdx`
  - `content/hubs/en/*.mdx`
  - `content/hubs/es/*.mdx`

## Tina 调试脚本

如果你需要单独调试 Tina 自身的索引/后台生成流程：

```bash
npm run cms:build
```

## 生产构建

项目生产构建：

```bash
npm run build
```
