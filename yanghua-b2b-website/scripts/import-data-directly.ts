#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

const DB_CONFIG = {
  host: 'localhost',
  user: 'wp_user',
  password: 'wp_password',
  database: 'wordpress_yanghua'
};

interface ProjectData {
  title: string;
  description: string;
  content: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  author: string;
  metadata: any;
}

interface NewsData {
  title: string;
  date: string;
  url?: string;
  image?: string;
  summary?: string;
  author?: string;
  content?: string;
}

async function importDataDirectly() {
  console.log('🚀 开始直接导入数据到WordPress数据库...');
  
  const connection = await mysql.createConnection(DB_CONFIG);
  
  try {
    // 获取管理员用户ID
    const [adminRows] = await connection.execute(
      'SELECT ID FROM wp_users ORDER BY ID ASC LIMIT 1'
    );
    const adminId = (adminRows as any)[0]?.ID || 1;
    
    // 导入项目数据
    await importProjects(connection, adminId);
    
    // 导入新闻数据
    await importNews(connection, adminId);
    
    console.log('✅ 数据导入完成！');
    
  } catch (error) {
    console.error('❌ 导入失败:', error);
  } finally {
    await connection.end();
  }
}

async function importProjects(connection: any, adminId: number) {
  console.log('📁 导入项目数据...');
  
  const projectsFile = path.join(__dirname, '../public/data/projects_complete_content.json');
  
  if (!fs.existsSync(projectsFile)) {
    console.log('⚠️ 项目数据文件不存在');
    return;
  }
  
  const projectsData = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
  const projects: ProjectData[] = projectsData.projects || projectsData || [];
  
  console.log(`📊 找到 ${projects.length} 个项目`);
  
  for (const project of projects) {
    const postContent = `
      <h2>${project.title}</h2>
      <div class="project-description">${project.description}</div>
      <div class="project-content">${project.content}</div>
      <div class="project-metadata">
        <p><strong>创建时间:</strong> ${project.created_at}</p>
        <p><strong>作者:</strong> ${project.author}</p>
        <p><strong>标签:</strong> ${project.tags.join(', ')}</p>
      </div>
    `;
    
    await connection.execute(
      `INSERT INTO wp_posts (post_author, post_date, post_date_gmt, post_content, post_title, post_excerpt, post_status, comment_status, ping_status, post_password, post_name, to_ping, pinged, post_modified, post_modified_gmt, post_content_filtered, post_parent, guid, menu_order, post_type, post_mime_type, comment_count) 
       VALUES (?, NOW(), NOW(), ?, ?, '', 'publish', 'open', 'open', '', ?, '', '', NOW(), NOW(), '', 0, '', 0, 'post', '', 0)`,
      [adminId, postContent, project.title, project.title.toLowerCase().replace(/\s+/g, '-')]
    );
    
    console.log(`✅ 项目导入成功: ${project.title}`);
  }
}

async function importNews(connection: any, adminId: number) {
  console.log('📰 导入新闻数据...');
  
  const newsFiles = [
    'cleaned_news_data_english.json'
  ];
  
  let totalNews = 0;
  
  for (const newsFile of newsFiles) {
    const filePath = path.join(__dirname, '../public/data', newsFile);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  新闻文件不存在: ${newsFile}`);
      continue;
    }
    
    const newsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const news: NewsData[] = newsData.news || newsData || [];
    
    console.log(`📄 处理 ${newsFile}: ${news.length} 条新闻`);
    
    for (const newsItem of news) {
      const postContent = `
        <h2>${newsItem.title}</h2>
        ${newsItem.content || newsItem.summary || ''}
        ${newsItem.image ? `<img src="${newsItem.image}" alt="${newsItem.title}" />` : ''}
        <div class="news-metadata">
          ${newsItem.date ? `<p><strong>发布日期:</strong> ${newsItem.date}</p>` : ''}
          ${newsItem.author ? `<p><strong>作者:</strong> ${newsItem.author}</p>` : ''}
          ${newsItem.url ? `<p><strong>原文链接:</strong> <a href="${newsItem.url}">${newsItem.url}</a></p>` : ''}
        </div>
      `;
      
      const postDate = newsItem.date ? new Date(newsItem.date) : new Date();
      
      await connection.execute(
        `INSERT INTO wp_posts (post_author, post_date, post_date_gmt, post_content, post_title, post_excerpt, post_status, comment_status, ping_status, post_password, post_name, to_ping, pinged, post_modified, post_modified_gmt, post_content_filtered, post_parent, guid, menu_order, post_type, post_mime_type, comment_count) 
         VALUES (?, ?, ?, ?, ?, '', 'publish', 'open', 'open', '', ?, '', '', ?, ?, '', 0, '', 0, 'post', '', 0)`,
        [adminId, postDate, postDate, postContent, newsItem.title, newsItem.title.toLowerCase().replace(/\s+/g, '-'), postDate, postDate]
      );
      
      totalNews++;
      
      if (totalNews % 10 === 0) {
        console.log(`📊 已导入 ${totalNews} 条新闻...`);
      }
    }
  }
  
  console.log(`✅ 新闻导入完成: ${totalNews} 条`);
}

importDataDirectly();