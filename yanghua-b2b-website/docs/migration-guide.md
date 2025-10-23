# WordPress CMS 迁移操作手册

## 概述

本文档提供了从 Strapi CMS 迁移到 WordPress CMS 的完整操作指南。迁移过程包括数据导出、格式转换、数据导入、URL重定向设置和系统验证等步骤。

## 目录

1. [迁移前准备](#迁移前准备)
2. [环境配置](#环境配置)
3. [数据迁移](#数据迁移)
4. [URL和SEO优化](#url和seo优化)
5. [系统测试](#系统测试)
6. [上线部署](#上线部署)
7. [故障排除](#故障排除)
8. [维护指南](#维护指南)

## 迁移前准备

### 1. 系统要求

**WordPress 环境要求:**
- PHP 8.0 或更高版本
- MySQL 8.0 或 MariaDB 10.5 或更高版本
- Apache 2.4 或 Nginx 1.18 或更高版本
- 至少 2GB 内存
- 至少 10GB 可用磁盘空间

**开发环境要求:**
- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器
- Git 版本控制
- 代码编辑器 (推荐 VS Code)

### 2. 备份现有数据

在开始迁移之前，务必备份所有重要数据：

```bash
# 备份 Strapi 数据库
mysqldump -u username -p strapi_database > strapi_backup.sql

# 备份 Strapi 媒体文件
tar -czf strapi_media_backup.tar.gz /path/to/strapi/public/uploads

# 备份 WordPress 数据库 (如果已存在)
mysqldump -u username -p wordpress_database > wordpress_backup.sql
```

### 3. 数据清单

创建迁移数据清单，确保所有内容都被包含：

- [ ] 文章内容 (中文/英文)
- [ ] 媒体文件 (图片、文档)
- [ ] 分类和标签
- [ ] 用户和作者信息
- [ ] SEO 元数据
- [ ] URL 结构映射

## 环境配置

### 1. WordPress 安装和配置

```bash
# 下载 WordPress
wget https://wordpress.org/latest.tar.gz
tar -xzf latest.tar.gz

# 配置数据库连接
cp wp-config-sample.php wp-config.php
# 编辑 wp-config.php 设置数据库信息
```

**wp-config.php 关键配置:**

```php
// 数据库设置
define('DB_NAME', 'wordpress_database');
define('DB_USER', 'username');
define('DB_PASSWORD', 'password');
define('DB_HOST', 'localhost');

// 多语言支持
define('WP_LANG', 'zh_CN');

// 调试模式 (开发环境)
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);

// 内存限制
ini_set('memory_limit', '512M');
```

### 2. 必需插件安装

```bash
# 通过 WP-CLI 安装插件
wp plugin install polylang --activate
wp plugin install wordpress-seo --activate
wp plugin install wp-rest-api --activate
wp plugin install custom-post-type-ui --activate
```

### 3. 主题配置

安装和配置支持多语言的主题，确保与现有设计保持一致。

## 数据迁移

### 1. 运行迁移工具

```bash
# 进入项目目录
cd /path/to/yanghua-b2b-website

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件设置 API 凭据
```

**环境变量配置 (.env):**

```env
# Strapi 配置
STRAPI_URL=https://your-strapi-instance.com
STRAPI_TOKEN=your-strapi-api-token

# WordPress 配置
WORDPRESS_URL=http://localhost:8080
WORDPRESS_USERNAME=admin
WORDPRESS_PASSWORD=your-secure-password

# 数据库配置
DB_HOST=localhost
DB_USER=username
DB_PASSWORD=password
DB_NAME=wordpress_database
```

### 2. 执行数据迁移

```bash
# 运行完整迁移流程
npm run migrate:full

# 或分步执行
npm run migrate:articles    # 迁移文章
npm run migrate:media      # 迁移媒体文件
npm run migrate:categories # 迁移分类
npm run migrate:users      # 迁移用户
```

**手动执行迁移脚本:**

```bash
# 使用 tsx 直接运行
npx tsx scripts/migration/strapi-to-wordpress-migrator.ts

# 验证迁移结果
npx tsx scripts/migration/migration-validator.ts
```

### 3. 迁移进度监控

迁移过程中会生成详细的日志文件：

- `migration-log-[timestamp].log` - 迁移操作日志
- `migration-report-[timestamp].md` - 迁移结果报告
- `validation-report-[timestamp].md` - 数据验证报告

### 4. 常见迁移问题处理

**问题 1: API 连接失败**
```bash
# 检查 API 连接
curl -H "Authorization: Bearer $STRAPI_TOKEN" $STRAPI_URL/api/articles

# 检查 WordPress API
curl -u $WORDPRESS_USERNAME:$WORDPRESS_PASSWORD $WORDPRESS_URL/wp-json/wp/v2/posts
```

**问题 2: 媒体文件上传失败**
```bash
# 检查 WordPress 上传目录权限
chmod 755 wp-content/uploads
chown www-data:www-data wp-content/uploads

# 增加上传限制
# 在 wp-config.php 中添加:
ini_set('upload_max_filesize', '64M');
ini_set('post_max_size', '64M');
```

**问题 3: 内存不足**
```bash
# 增加 PHP 内存限制
echo "memory_limit = 512M" >> /etc/php/8.0/apache2/php.ini

# 或在 wp-config.php 中设置
ini_set('memory_limit', '512M');
```

## URL和SEO优化

### 1. 运行 SEO 优化工具

```bash
# 执行 URL 和 SEO 优化
npx tsx scripts/migration/url-seo-optimizer.ts
```

这将生成：
- 重定向规则文件
- XML 站点地图
- SEO 优化报告

### 2. 配置服务器重定向

**Apache (.htaccess):**

```apache
RewriteEngine On

# Strapi 到 WordPress 重定向
RewriteRule ^zh-CN/articles/(.*)$ /zh-CN/articles/$1 [R=301,L]
RewriteRule ^en-US/articles/(.*)$ /en-US/articles/$1 [R=301,L]

# 旧 API 端点重定向
RewriteRule ^api/articles/(.*)$ /wp-json/wp/v2/posts/$1 [R=301,L]
```

**Nginx:**

```nginx
# 在 server 块中添加
location ~ ^/(zh-CN|en-US)/articles/(.*)$ {
    return 301 /$1/articles/$2;
}

location ~ ^/api/articles/(.*)$ {
    return 301 /wp-json/wp/v2/posts/$1;
}
```

### 3. 提交站点地图

```bash
# 提交到 Google Search Console
curl "https://www.google.com/ping?sitemap=https://yoursite.com/sitemap.xml"

# 提交到百度站长工具
curl -X POST "https://data.zz.baidu.com/urls?site=https://yoursite.com&token=your-token" \
     -H "Content-Type: text/plain" \
     -d "https://yoursite.com/sitemap.xml"
```

## 系统测试

### 1. 运行自动化测试

```bash
# 执行完整测试套件
npx tsx scripts/migration/automated-test-suite.ts

# 或运行特定测试类型
npm run test:functional    # 功能测试
npm run test:performance   # 性能测试
npm run test:seo          # SEO 测试
npm run test:security     # 安全测试
```

### 2. 手动测试检查清单

**功能测试:**
- [ ] 首页正常加载
- [ ] 文章列表页面显示正确
- [ ] 文章详情页面内容完整
- [ ] 多语言切换功能正常
- [ ] 搜索功能工作正常
- [ ] 分类和标签筛选正常

**性能测试:**
- [ ] 页面加载时间 < 3秒
- [ ] API 响应时间 < 1秒
- [ ] 图片加载优化
- [ ] 缓存机制工作正常

**SEO 测试:**
- [ ] 页面标题和描述正确
- [ ] URL 结构友好
- [ ] 站点地图可访问
- [ ] robots.txt 配置正确
- [ ] 结构化数据标记

### 3. 用户验收测试

邀请关键用户进行测试，收集反馈：

1. 内容编辑人员测试后台管理
2. 前端用户测试浏览体验
3. SEO 团队验证搜索优化
4. 技术团队检查系统稳定性

## 上线部署

### 1. 生产环境准备

```bash
# 生产环境配置检查
wp config list
wp plugin list --status=active
wp theme list --status=active

# 性能优化
wp plugin install w3-total-cache --activate
wp plugin install wp-optimize --activate
```

### 2. DNS 和 SSL 配置

```bash
# 配置 SSL 证书 (Let's Encrypt)
certbot --apache -d yoursite.com -d www.yoursite.com

# 或使用 Nginx
certbot --nginx -d yoursite.com -d www.yoursite.com
```

### 3. 监控设置

```bash
# 设置系统监控
# 安装监控工具 (如 New Relic, DataDog)

# 设置日志监控
tail -f /var/log/apache2/error.log
tail -f /var/log/nginx/error.log
```

### 4. 上线检查清单

- [ ] 数据库连接正常
- [ ] 所有插件激活
- [ ] 主题配置正确
- [ ] SSL 证书有效
- [ ] 重定向规则生效
- [ ] 站点地图提交
- [ ] 监控系统运行
- [ ] 备份策略实施

## 故障排除

### 常见问题和解决方案

**1. 白屏错误 (WSOD)**

```bash
# 启用调试模式
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);

# 检查错误日志
tail -f wp-content/debug.log

# 常见原因：
# - 内存不足
# - 插件冲突
# - 主题错误
# - 文件权限问题
```

**2. 数据库连接错误**

```bash
# 检查数据库连接
mysql -u username -p -h localhost database_name

# 检查 wp-config.php 配置
grep -n "DB_" wp-config.php

# 重置数据库密码
ALTER USER 'username'@'localhost' IDENTIFIED BY 'new_password';
```

**3. 媒体文件无法访问**

```bash
# 检查文件权限
ls -la wp-content/uploads/

# 修复权限
find wp-content/uploads/ -type d -exec chmod 755 {} \;
find wp-content/uploads/ -type f -exec chmod 644 {} \;

# 检查 .htaccess 规则
cat .htaccess | grep -A5 -B5 uploads
```

**4. API 响应慢**

```bash
# 启用查询调试
define('SAVEQUERIES', true);

# 安装查询监控插件
wp plugin install query-monitor --activate

# 优化数据库
wp db optimize
```

### 性能优化建议

**1. 缓存配置**

```php
// wp-config.php 中启用缓存
define('WP_CACHE', true);
define('WPCACHEHOME', '/path/to/wp-content/plugins/wp-super-cache/');
```

**2. 数据库优化**

```sql
-- 清理无用数据
DELETE FROM wp_posts WHERE post_status = 'auto-draft';
DELETE FROM wp_comments WHERE comment_approved = 'spam';

-- 优化表
OPTIMIZE TABLE wp_posts, wp_postmeta, wp_comments, wp_options;
```

**3. 图片优化**

```bash
# 安装图片优化插件
wp plugin install smush --activate

# 或使用命令行工具
find wp-content/uploads/ -name "*.jpg" -exec jpegoptim --max=85 {} \;
find wp-content/uploads/ -name "*.png" -exec optipng -o2 {} \;
```

## 维护指南

### 日常维护任务

**每日:**
- 检查网站可访问性
- 监控错误日志
- 检查备份状态

**每周:**
- 更新插件和主题
- 检查安全扫描结果
- 优化数据库

**每月:**
- 全站备份
- 性能分析报告
- SEO 排名检查
- 安全审计

### 备份策略

```bash
# 自动备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/wordpress"

# 数据库备份
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/db_$DATE.sql

# 文件备份
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /path/to/wordpress

# 清理旧备份 (保留30天)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### 安全维护

```bash
# 定期安全扫描
wp plugin install wordfence --activate

# 更新 WordPress 核心
wp core update

# 更新所有插件
wp plugin update --all

# 检查文件完整性
wp core verify-checksums
```

### 监控和报告

**设置监控指标:**
- 网站可用性 (99.9% 目标)
- 页面加载时间 (< 3秒)
- API 响应时间 (< 1秒)
- 错误率 (< 0.1%)

**生成月度报告:**
- 性能统计
- 安全事件
- 用户访问分析
- SEO 排名变化

## 联系支持

如果在迁移过程中遇到问题，请联系技术支持团队：

- **技术支持邮箱**: tech-support@company.com
- **紧急联系电话**: +86-xxx-xxxx-xxxx
- **文档更新**: 请在项目 GitHub 仓库提交 Issue

## 附录

### A. 环境变量模板

```env
# Strapi 配置
STRAPI_URL=https://your-strapi-instance.com
STRAPI_TOKEN=your-strapi-api-token

# WordPress 配置
WORDPRESS_URL=http://localhost:8080
WORDPRESS_USERNAME=admin
WORDPRESS_PASSWORD=your-secure-password

# 数据库配置
DB_HOST=localhost
DB_USER=username
DB_PASSWORD=password
DB_NAME=wordpress_database

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 安全配置
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

### B. 有用的 WP-CLI 命令

```bash
# 站点信息
wp core version
wp plugin list
wp theme list
wp user list

# 数据库操作
wp db check
wp db optimize
wp db repair

# 缓存管理
wp cache flush
wp rewrite flush

# 用户管理
wp user create username email@example.com --role=administrator
wp user update admin --user_pass=newpassword

# 内容管理
wp post list --post_type=page
wp post create --post_type=page --post_title="New Page" --post_content="Content"
```

### C. 故障排除检查清单

**网站无法访问:**
- [ ] 检查服务器状态
- [ ] 验证 DNS 解析
- [ ] 检查 SSL 证书
- [ ] 查看错误日志

**性能问题:**
- [ ] 检查数据库查询
- [ ] 验证缓存配置
- [ ] 分析慢查询日志
- [ ] 检查服务器资源

**功能异常:**
- [ ] 验证插件兼容性
- [ ] 检查主题文件
- [ ] 查看 PHP 错误日志
- [ ] 测试 API 端点

---

*本文档最后更新时间: 2024年12月*
*版本: 1.0*