\n=== 目标域名 ===
[prod-email-diagnose] https://www.yhflexiblebusbar.com
\n=== 获取 CSRF cookie（尝试多个页面路径） ===
[prod-email-diagnose] 尝试路径: https://www.yhflexiblebusbar.com/
[prod-email-diagnose] 尝试路径: https://www.yhflexiblebusbar.com/en
[prod-email-diagnose] 尝试路径: https://www.yhflexiblebusbar.com/es
[prod-email-diagnose] 尝试路径: https://www.yhflexiblebusbar.com/zh
[prod-email-diagnose] 尝试路径: https://www.yhflexiblebusbar.com/contact
[prod-email-diagnose] 尝试路径: https://www.yhflexiblebusbar.com/products
[prod-email-diagnose] 未能从 https://www.yhflexiblebusbar.com 获取到 CSRF token。请检查：
[prod-email-diagnose] - 访问使用的是 https（Secure Cookie 只在 https 下发）
[prod-email-diagnose] - 尝试在浏览器访问首页与联系页，确认是否设置了 csrf-token cookie
[prod-email-diagnose] - 如站点仅在特定页面下发 CSRF，请把该路径加入脚本 paths 数组
