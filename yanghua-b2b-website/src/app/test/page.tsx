'use client';

import React, { useEffect, useState } from 'react';

export default function TestPage() {
  const [imageStatus, setImageStatus] = useState<string>('loading');
  const [apiStatus, setApiStatus] = useState<string>('unknown');

  useEffect(() => {
    // 测试图片加载
    const img = new Image();
    img.onload = () => setImageStatus('success');
    img.onerror = () => setImageStatus('error');
    img.src = '/images/about/img-strength.jpg';

    // 测试API访问
    fetch('/api/health')
      .then(response => {
        setApiStatus(response.ok ? 'success' : 'error');
      })
      .catch(() => {
        setApiStatus('error');
      });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Vercel部署测试页面</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>图片加载测试</h2>
        <p>状态: {imageStatus === 'loading' ? '加载中...' : imageStatus === 'success' ? '✅ 成功' : '❌ 失败'}</p>
        {imageStatus === 'success' && (
          <img 
            src="/images/about/img-strength.jpg" 
            alt="测试图片" 
            style={{ maxWidth: '200px', height: 'auto' }}
          />
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>API访问测试</h2>
        <p>状态: {apiStatus === 'unknown' ? '未知' : apiStatus === 'success' ? '✅ 成功' : '❌ 失败'}</p>
      </div>

      <div>
        <h2>部署信息</h2>
        <p>如果此页面能正常访问，说明Vercel部署配置已修复。</p>
        <p>图片和API都应该能正常加载。</p>
      </div>
    </div>
  );
}