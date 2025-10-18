\n=== 目标域名 ===
[prod-email-diagnose] https://www.yhflexiblebusbar.com
\n=== 获取 CSRF cookie（尝试多个页面路径） ===
[prod-email-diagnose] 尝试路径: https://www.yhflexiblebusbar.com/
[prod-email-diagnose] CSRF_TOKEN=MTc2MDc2OTcyNjg1Njo2czNzeHo2bXNuZDpHS1daTUhDTmNPbGdUNENVbzdqVWh2ZUFQcHdicFZiVUlIOEJhK1RwbmJFdWF6SUNoemVoVnNEamFQQjNqSGhs
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
[prod-email-diagnose] HTTP_CODE=200
[prod-email-diagnose] 响应体：
{
  "success": true,
  "message": "Email sent successfully",
  "emailId": "509869bd-838a-4442-bfcb-aac4c1442882",
  "messageId": "<3bb3eee7-2ab2-fe85-75b8-96c29e361ff8@yhflexiblebusbar.com>",
  "processingTime": 1939
}
[prod-email-diagnose] 解析：success=true, code=, error=, messageId=<3bb3eee7-2ab2-fe85-75b8-96c29e361ff8@yhflexiblebusbar.com>
[prod-email-diagnose] 结论：成功（200）。邮件已发送或记录成功。
\n=== 用例3：带 CSRF 的询盘表单（预期 200 或 503） ===
[prod-email-diagnose] 请求: https://www.yhflexiblebusbar.com/api/email/send
[prod-email-diagnose] 载荷: {"type":"inquiry","name":"Prod Test","email":"sender@yourdomain.com","company":"Test Co","productInterest":"Flexible Busbar","message":"Positive inquiry test for SMTP diagnostics","locale":"en"}
[prod-email-diagnose] HTTP_CODE=200
[prod-email-diagnose] 响应体：
{
  "success": true,
  "message": "Email sent successfully",
  "emailId": "b26181ba-1ff2-418b-91ac-7925bb2f0b44",
  "messageId": "<1b931482-80ed-52c2-9cc0-95133efc6ca5@yhflexiblebusbar.com>",
  "processingTime": 1254
}
[prod-email-diagnose] 解析：success=true, code=, error=, messageId=<1b931482-80ed-52c2-9cc0-95133efc6ca5@yhflexiblebusbar.com>
[prod-email-diagnose] 结论：成功（200）。邮件已发送或记录成功。
\n=== 报告位置 ===
[prod-email-diagnose] /Users/peterpc/Documents/Documents/yanghua cable web/yanghua-b2b-website/yanghua-b2b-website/scripts/diagnostics/prod-email-diagnose_2025-10-18_14-42-04.md
\n=== 后续建议 ===
[prod-email-diagnose] 1) 若任一正向用例返回 503，请据 code 精确定位并修复 SMTP 配置。
[prod-email-diagnose] 2) 若仍返回 500，请在 Vercel 控制台按路径 /api/email/send 与时间过滤日志，将错误堆栈与 x-vercel-id 片段发我，我会给出针对性修复方案。
[prod-email-diagnose] 3) 若生产环境对 SMTP 出口受限，建议切换到事务型邮件服务（Resend/SendGrid），我可以提供接入补丁。
