# SEO 内容治理运行规则

## 当前策略

内容治理采用英文核心优先、证据优先和小批量回滚策略。系统不会因为标题相似就自动删除、合并、noindex 或返回 410。

完整页面台账由以下命令生成：

```bash
pnpm run seo:ledger
```

输出文件为 `../exports/seo-content-governance/page-asset-ledger.json`，包含 URL、语言、页面类型、主题集群、目标查询、内容长度、证据信号、相关产品/解决方案和待补充的 GSC/GA4/RFQ 字段。

## 主题主页面

| 主题集群 | 英文主页面 |
| --- | --- |
| Data center | `/en/solutions/data-center` |
| Energy storage / solar PV | `/en/solutions/new-energy` |
| EV charging | `/en/solutions/charging-station` |
| Parallel cable / busduct comparison | `/en/articles/hub/flexible-busbar-vs-cable` |
| Manufacturing / retrofit | `/en/solutions/manufacturing` |
| General high-current distribution | `/en/articles/hub/high-current-power-distribution` |

## 页面处理流程

1. 从 GSC 导出过去 16 个月的页面、查询、国家、设备和搜索类型数据，并补充 GA4/RFQ 数据。
2. 在台账的 `governance.gsc` 字段中记录快照，标记页面为 `keep`、`merge`、`support`、`noindex` 或 `410`。
3. 只对有明确主页面的一对一合并建立一跳 301，同时更新 sitemap、canonical、hreflang 和站内链接。
4. 对技术文章补充至少一项可验证的工程证据：标准、测试、计算、安装图、项目数据或明确的成本假设。
5. 每次发布前运行：

```bash
pnpm run seo:content-check
pnpm run check
pnpm run build
pnpm run test:seo
```

质量检查中的低证据页面是待治理清单，不代表可以直接删除。治理完成后再按 28 天和 90 天的 GSC 指标评估下一批页面。
