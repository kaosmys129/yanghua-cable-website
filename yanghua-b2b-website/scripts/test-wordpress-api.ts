#!/usr/bin/env tsx

import axios from 'axios';

const WP_URL = 'http://localhost:8080';
const WP_USERNAME = 'wp_user';
const WP_PASSWORD = 'wp_password';

async function testWordPressAPI() {
  console.log('🧪 测试WordPress REST API连接...');
  
  try {
    // 测试基本连接
    const response = await axios.get(`${WP_URL}/wp-json/wp/v2/posts`);
    console.log('✅ API连接成功，当前文章数:', response.data.length);
    
    // 测试创建文章
    console.log('📝 测试创建文章...');
    const createResponse = await axios.post(`${WP_URL}/wp-json/wp/v2/posts`, {
      title: '测试项目导入',
      content: '这是从脚本导入的测试内容',
      status: 'publish'
    }, {
      auth: {
        username: WP_USERNAME,
        password: WP_PASSWORD
      }
    });
    
    console.log('✅ 文章创建成功:', createResponse.data.id, createResponse.data.title.rendered);
    
    // 验证文章已创建
    const verifyResponse = await axios.get(`${WP_URL}/wp-json/wp/v2/posts/${createResponse.data.id}`);
    console.log('✅ 文章验证成功:', verifyResponse.data.title.rendered);
    
  } catch (error: Error) {
    console.error('❌ API连接失败:', error.message);
    return false;
  }
}

async function testCreatePost(): Promise<boolean> {
  try {
    const response = await fetch(`${WP_URL}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${WP_USER}:${WP_PASSWORD}`).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: '测试文章 - API测试',
        content: '这是一篇通过REST API创建的测试文章',
        status: 'draft'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 文章创建成功:', data.title?.rendered || data.title);
    return true;

  } catch (error: Error) {
    console.error('❌ 文章创建失败:', error.message);
    return false;
  }
}

testWordPressAPI();