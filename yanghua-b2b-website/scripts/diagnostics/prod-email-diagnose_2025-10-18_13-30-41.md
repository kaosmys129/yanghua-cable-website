\n=== 目标域名 ===
[prod-email-diagnose] https://www.yhflexiblebusbar.com
\n=== 获取 CSRF cookie（尝试多个页面路径） ===
[prod-email-diagnose] 尝试路径: https://www.yhflexiblebusbar.com/
[prod-email-diagnose] CSRF_TOKEN=MTc2MDc2NTQ0MTk4OTpveDV0cHdibzU0OmEtdmVyeS1zZWNyZXQtYW5kLXJhbmRvbS1zdHJpbmctZm9yLWxvY2FsLWRldg%3D%3D
\n=== 用例1：不带 CSRF 的联系表单（预期 403） ===
[prod-email-diagnose] 请求: https://www.yhflexiblebusbar.com/api/email/send
[prod-email-diagnose] 载荷: {"type":"contact","name":"Prod Test","email":"sender@yourdomain.com","company":"Test Co","country":"China","subject":"General","message":"Negative CSRF test","locale":"en"}
[prod-email-diagnose] HTTP_CODE=403
[prod-email-diagnose] 响应体：
CSRF Token Invalid[prod-email-diagnose] 解析：success=, code=, error=, messageId=
[prod-email-diagnose] 结论：403。可能未携带 CSRF 或 CSRF 校验失败。
\n=== 用例2：带 CSRF 的联系表单（预期 200 或 503） ===
[prod-email-diagnose] 请求: https://www.yhflexiblebusbar.com/api/email/send
[prod-email-diagnose] 载荷: {"type":"contact","name":"Prod Test","email":"sender@yourdomain.com","company":"Test Co","country":"China","subject":"General","message":"Positive contact test for SMTP diagnostics","locale":"en"}
[prod-email-diagnose] HTTP_CODE=403
[prod-email-diagnose] 响应体：
CSRF Token Invalid[prod-email-diagnose] 解析：success=, code=, error=, messageId=
[prod-email-diagnose] 结论：403。可能未携带 CSRF 或 CSRF 校验失败。
\n=== 用例3：带 CSRF 的询盘表单（预期 200 或 503） ===
[prod-email-diagnose] 请求: https://www.yhflexiblebusbar.com/api/email/send
[prod-email-diagnose] 载荷: {"type":"inquiry","name":"Prod Test","email":"sender@yourdomain.com","company":"Test Co","productInterest":"Flexible Busbar","message":"Positive inquiry test for SMTP diagnostics","locale":"en"}
[prod-email-diagnose] HTTP_CODE=403
[prod-email-diagnose] 响应体：
CSRF Token Invalid[prod-email-diagnose] 解析：success=, code=, error=, messageId=
[prod-email-diagnose] 结论：403。可能未携带 CSRF 或 CSRF 校验失败。
\n=== 报告位置 ===
[prod-email-diagnose] /Users/peterpc/Documents/Documents/yanghua cable web/yanghua-b2b-website/yanghua-b2b-website/scripts/diagnostics/prod-email-diagnose_2025-10-18_13-30-41.md
\n=== 后续建议 ===
[prod-email-diagnose] 1) 若任一正向用例返回 503，请据 code 精确定位并修复 SMTP 配置。
[prod-email-diagnose] 2) 若仍返回 500，请在 Vercel 控制台按路径 /api/email/send 与时间过滤日志，将错误堆栈与 x-vercel-id 片段发我，我会给出针对性修复方案。
[prod-email-diagnose] 3) 若生产环境对 SMTP 出口受限，建议切换到事务型邮件服务（Resend/SendGrid），我可以提供接入补丁。
