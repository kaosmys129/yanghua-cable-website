#!/bin/bash

# WordPress CMS 安装和配置脚本
# 用于从Strapi CMS迁移到WordPress CMS

set -e

echo "🚀 开始WordPress CMS安装和配置..."

# 配置变量
WP_DIR="wordpress"
DB_NAME="yanghua_wordpress"
DB_USER="wp_user"
DB_PASS="wp_secure_pass_$(date +%s)"
WP_ADMIN_USER="admin"
WP_ADMIN_PASS="admin_$(date +%s)"
WP_ADMIN_EMAIL="admin@yanghuasti.com"
SITE_TITLE="Yanghua B2B Website"
SITE_URL="http://localhost:8080"

# 检查系统要求
echo "📋 检查系统要求..."

# 检查PHP
if ! command -v php &> /dev/null; then
    echo "❌ PHP未安装，请先安装PHP 7.4或更高版本"
    exit 1
fi

PHP_VERSION=$(php -v | head -n1 | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "✅ PHP版本: $PHP_VERSION"

# 检查MySQL/MariaDB
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL未安装，请先安装MySQL或MariaDB"
    exit 1
fi

echo "✅ MySQL已安装"

# 检查Composer
if ! command -v composer &> /dev/null; then
    echo "⚠️  Composer未安装，将使用wget下载WordPress"
fi

# 创建WordPress目录
echo "📁 创建WordPress目录..."
mkdir -p $WP_DIR
cd $WP_DIR

# 下载WordPress
echo "⬇️  下载WordPress最新版本..."
if [ ! -f "wordpress-latest.tar.gz" ]; then
    wget https://wordpress.org/latest.tar.gz -O wordpress-latest.tar.gz
fi

# 解压WordPress
echo "📦 解压WordPress..."
tar -xzf wordpress-latest.tar.gz --strip-components=1

# 创建数据库
echo "🗄️  创建WordPress数据库..."
mysql -u root -p << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

# 配置WordPress
echo "⚙️  配置WordPress..."
cp wp-config-sample.php wp-config.php

# 更新数据库配置
sed -i "s/database_name_here/$DB_NAME/g" wp-config.php
sed -i "s/username_here/$DB_USER/g" wp-config.php
sed -i "s/password_here/$DB_PASS/g" wp-config.php
sed -i "s/localhost/localhost/g" wp-config.php

# 生成安全密钥
echo "🔐 生成WordPress安全密钥..."
wget -O - https://api.wordpress.org/secret-key/1.1/salt/ >> wp-config.php

# 启动PHP内置服务器
echo "🌐 启动WordPress开发服务器..."
echo "服务器地址: $SITE_URL"
echo "管理员用户: $WP_ADMIN_USER"
echo "管理员密码: $WP_ADMIN_PASS"
echo "数据库: $DB_NAME"
echo "数据库用户: $DB_USER"
echo "数据库密码: $DB_PASS"

# 保存配置信息
cat > ../wordpress-config.txt << EOF
=== WordPress安装配置信息 ===
安装时间: $(date)
服务器地址: $SITE_URL
管理员用户: $WP_ADMIN_USER
管理员密码: $WP_ADMIN_PASS
管理员邮箱: $WP_ADMIN_EMAIL
数据库名称: $DB_NAME
数据库用户: $DB_USER
数据库密码: $DB_PASS
站点标题: $SITE_TITLE
EOF

echo "✅ WordPress安装完成！"
echo "📄 配置信息已保存到: ../wordpress-config.txt"
echo "🚀 请访问 $SITE_URL 完成WordPress初始化设置"

# 启动服务器（后台运行）
php -S localhost:8080 &
echo $! > ../wordpress-server.pid

echo "🎉 WordPress服务器已启动！PID: $(cat ../wordpress-server.pid)"
echo "💡 使用 'kill $(cat ../wordpress-server.pid)' 停止服务器"