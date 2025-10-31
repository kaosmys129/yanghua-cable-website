# Strapi文章上传脚本使用指南

## 概述
这个脚本用于将转换后的文章数据批量上传到Strapi CMS系统。

## 前置条件
1. 确保已经运行了转换脚本 `transform_for_strapi.js`
2. 确保生成了 `batch_upload_data.json` 文件
3. 拥有Strapi实例的访问权限和API令牌

## 环境配置

### 1. 设置环境变量
在运行上传脚本之前，需要设置以下环境变量：

```bash
export STRAPI_URL="https://your-strapi-instance.com"
export STRAPI_TOKEN="your-api-token-here"
```

#### 获取API令牌
1. 登录到您的Strapi管理后台
2. 进入 Settings → API Tokens
3. 创建一个新的Full Access令牌
4. 复制生成的令牌

#### 获取Strapi URL
- 如果是本地开发：`http://localhost:1337`
- 如果是Strapi Cloud：您的项目URL，如 `https://your-project.strapiapp.com`

### 2. 可选配置
可以设置批量上传的大小（默认为5）：
```bash
export BATCH_SIZE=10
```

## 运行脚本

### 基本用法
```bash
cd /Users/peterpc/Documents/Documents/yanghua cable web/yanghua-b2b-website/yanghua-b2b-website/strapi-cms
node scripts/upload_to_strapi.js
```

### 使用环境变量运行
```bash
cd /Users/peterpc/Documents/Documents/yanghua cable web/yanghua-b2b-website/yanghua-b2b-website/strapi-cms
STRAPI_URL="https://your-instance.com" STRAPI_TOKEN="your-token" node scripts/upload_to_strapi.js
```

## 脚本功能

### 主要特性
- **批量上传**：支持批量上传文章，每批默认5篇
- **智能处理**：自动检测文章是否已存在，存在则更新，不存在则创建
- **错误处理**：详细的错误信息和失败记录
- **结果验证**：上传后验证数据完整性
- **生成报告**：生成详细的上传报告和建议

### 输出文件
脚本会生成以下文件：
- `upload_results.json` - 详细的上传结果记录
- `upload_report.md` - 上传报告和建议

## 故障排除

### 常见问题

#### 1. "请设置 STRAPI_TOKEN 环境变量"
**原因**：未设置API令牌
**解决**：设置 `STRAPI_TOKEN` 环境变量

#### 2. "请设置 STRAPI_URL 环境变量"
**原因**：未设置Strapi服务器地址
**解决**：设置 `STRAPI_URL` 环境变量

#### 3. 连接超时或网络错误
**原因**：网络问题或服务器不可访问
**解决**：
- 检查网络连接
- 确认Strapi URL是否正确
- 检查防火墙设置

#### 4. 权限错误
**原因**：API令牌权限不足
**解决**：
- 确保使用Full Access令牌
- 检查令牌是否过期
- 确认用户角色权限

#### 5. 数据验证错误
**原因**：文章数据格式不符合要求
**解决**：
- 检查转换后的数据格式
- 确保必填字段完整
- 查看具体的验证错误信息

### 验证上传结果

#### 手动验证
1. 登录Strapi管理后台
2. 查看内容管理器中的文章
3. 检查文章数量是否正确
4. 验证文章内容完整性

#### 自动验证
脚本会自动验证：
- 文章标题是否正确
- 内容块是否完整
- 封面图片是否正常

## 最佳实践

### 1. 分批上传
- 建议每批5-10篇文章
- 避免一次性上传过多数据

### 2. 备份数据
- 上传前备份现有数据
- 保存上传结果和报告

### 3. 测试环境
- 先在测试环境验证
- 确认无误后再上传到生产环境

### 4. 监控上传过程
- 关注控制台输出
- 查看生成的报告文件
- 及时处理错误信息

## 支持

如果遇到问题，请检查：
1. 环境变量是否正确设置
2. Strapi实例是否正常运行
3. API令牌是否有效
4. 网络连接是否正常

查看生成的 `upload_report.md` 文件获取详细的错误信息和建议。