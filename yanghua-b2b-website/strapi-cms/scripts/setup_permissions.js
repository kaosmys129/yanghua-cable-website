#!/usr/bin/env node

/**
 * Strapi API 权限设置脚本
 * 为本地 Strapi 设置公共 API 访问权限
 */

async function setPublicPermissions(strapi, newPermissions) {
  console.log('🔧 开始设置公共权限...');
  
  try {
    // Find the ID of the public role
    const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: {
        type: 'public',
      },
    });

    if (!publicRole) {
      console.error('❌ 找不到公共角色');
      return false;
    }

    console.log(`✅ 找到公共角色 ID: ${publicRole.id}`);

    // 删除现有权限（可选）
    await strapi.query('plugin::users-permissions.permission').deleteMany({
      where: {
        role: publicRole.id,
      },
    });

    console.log('🗑️  已清除现有权限');

    // Create the new permissions and link them to the public role
    const allPermissionsToCreate = [];
    Object.keys(newPermissions).map((controller) => {
      const actions = newPermissions[controller];
      console.log(`📝 为 ${controller} 设置权限: ${actions.join(', ')}`);
      
      const permissionsToCreate = actions.map((action) => {
        return strapi.query('plugin::users-permissions.permission').create({
          data: {
            action: `api::${controller}.${controller}.${action}`,
            role: publicRole.id,
          },
        });
      });
      allPermissionsToCreate.push(...permissionsToCreate);
    });
    
    await Promise.all(allPermissionsToCreate);
    console.log('✅ 权限设置完成');
    return true;
    
  } catch (error) {
    console.error('❌ 设置权限失败:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 开始设置 Strapi API 权限\n');
  
  try {
    const { createStrapi, compileStrapi } = require('@strapi/strapi');

    console.log('📦 编译 Strapi...');
    const appContext = await compileStrapi();
    
    console.log('🔄 加载 Strapi...');
    const app = await createStrapi(appContext).load();

    // 设置日志级别
    app.log.level = 'error';

    // 设置公共权限
    const success = await setPublicPermissions(app, {
      article: ['find', 'findOne'],
      category: ['find', 'findOne'],
      author: ['find', 'findOne'],
      global: ['find', 'findOne'],
      about: ['find', 'findOne'],
    });

    if (success) {
      console.log('\n🎉 权限设置成功！现在可以访问以下 API 端点:');
      console.log('   - GET /api/articles');
      console.log('   - GET /api/articles/:id');
      console.log('   - GET /api/categories');
      console.log('   - GET /api/categories/:id');
      console.log('   - GET /api/authors');
      console.log('   - GET /api/authors/:id');
      console.log('   - GET /api/globals');
      console.log('   - GET /api/globals/:id');
      console.log('   - GET /api/abouts');
      console.log('   - GET /api/abouts/:id');
    } else {
      console.log('\n❌ 权限设置失败');
    }

    await app.destroy();
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  }
}

main();