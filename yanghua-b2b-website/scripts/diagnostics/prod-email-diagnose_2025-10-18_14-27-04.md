\n=== 目标域名 ===
[prod-email-diagnose] https://www.yhflexiblebusbar.com
\n=== 获取 CSRF cookie（尝试多个页面路径） ===
[prod-email-diagnose] 尝试路径: https://www.yhflexiblebusbar.com/
[prod-email-diagnose] CSRF_TOKEN=MTc2MDc2ODgyNzM5ODpzaXRqMTF1ejRubDpHS1daTUhDTmNPbGdUNENVbzdqVWh2ZUFQcHdicFZiVUlIOEJhK1RwbmJFdWF6SUNoemVoVnNEamFQQjNqSGhs
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
[prod-email-diagnose] HTTP_CODE=400
[prod-email-diagnose] 响应体：
{
  "success": false,
  "error": "Invalid recipient",
  "code": "INVALID_RECIPIENT",
  "processingTime": 26054
}
[prod-email-diagnose] 解析：success=, code=INVALID_RECIPIENT, error=Invalid recipient, messageId=
