#!/usr/bin/env python3
"""
生产环境 SEO 标签验证脚本
检查 https://www.yhflexiblebusbar.com 的 hreflang 和 canonical 标签
"""

import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import sys

# 生产环境配置
PRODUCTION_BASE_URL = "https://www.yhflexiblebusbar.com"

# 要检查的页面
PAGES_TO_CHECK = [
    {"path": "/en", "name": "英文首页"},
    {"path": "/es", "name": "西班牙语首页"},
    {"path": "/en/products", "name": "英文产品页"},
    {"path": "/es/productos", "name": "西班牙语产品页"},
    {"path": "/en/about", "name": "英文关于页"},
    {"path": "/es/acerca-de", "name": "西班牙语关于页"},
]

def get_page_content(url):
    """获取页面内容"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"❌ 获取页面失败 {url}: {e}")
        return None

def extract_seo_tags(html_content):
    """提取 SEO 相关标签"""
    if not html_content:
        return None
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # 提取 canonical 标签
    canonical = soup.find('link', {'rel': 'canonical'})
    canonical_url = canonical.get('href') if canonical else None
    
    # 提取 hreflang 标签
    hreflang_tags = soup.find_all('link', {'rel': 'alternate', 'hreflang': True})
    hreflang_data = []
    for tag in hreflang_tags:
        hreflang_data.append({
            'hreflang': tag.get('hreflang'),
            'href': tag.get('href')
        })
    
    # 提取基本 meta 标签
    title = soup.find('title')
    title_text = title.get_text().strip() if title else None
    
    meta_description = soup.find('meta', {'name': 'description'})
    description = meta_description.get('content') if meta_description else None
    
    # 提取 Open Graph 标签
    og_url = soup.find('meta', {'property': 'og:url'})
    og_url_content = og_url.get('content') if og_url else None
    
    return {
        'canonical': canonical_url,
        'hreflang': hreflang_data,
        'title': title_text,
        'description': description,
        'og_url': og_url_content
    }

def check_page_seo(page_info):
    """检查单个页面的 SEO 配置"""
    url = f"{PRODUCTION_BASE_URL}{page_info['path']}"
    print(f"\n🔍 检查页面: {page_info['name']} ({url})")
    
    html_content = get_page_content(url)
    if not html_content:
        return None
    
    seo_data = extract_seo_tags(html_content)
    if not seo_data:
        print("❌ 无法提取 SEO 标签")
        return None
    
    # 检查结果
    print(f"📄 页面标题: {seo_data['title']}")
    print(f"📝 Meta 描述: {seo_data['description'][:100] if seo_data['description'] else 'None'}...")
    
    # Canonical 检查
    if seo_data['canonical']:
        print(f"🔗 Canonical URL: {seo_data['canonical']}")
        if url in seo_data['canonical'] or seo_data['canonical'].endswith(page_info['path']):
            print("✅ Canonical URL 正确")
        else:
            print("⚠️  Canonical URL 可能不匹配")
    else:
        print("❌ 缺少 Canonical 标签")
    
    # Hreflang 检查
    if seo_data['hreflang']:
        print(f"🌐 Hreflang 标签数量: {len(seo_data['hreflang'])}")
        for hreflang in seo_data['hreflang']:
            print(f"   - {hreflang['hreflang']}: {hreflang['href']}")
        
        # 检查是否包含英文和西班牙语
        languages = [tag['hreflang'] for tag in seo_data['hreflang']]
        if 'en' in languages and 'es' in languages:
            print("✅ 包含英文和西班牙语 hreflang")
        else:
            print("⚠️  可能缺少某些语言的 hreflang")
    else:
        print("❌ 缺少 Hreflang 标签")
    
    # Open Graph URL 检查
    if seo_data['og_url']:
        print(f"📱 OG URL: {seo_data['og_url']}")
    
    return seo_data

def main():
    """主函数"""
    print("🚀 开始检查生产环境 SEO 标签配置")
    print(f"🌐 生产环境: {PRODUCTION_BASE_URL}")
    print(f"⏰ 检查时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    for page_info in PAGES_TO_CHECK:
        try:
            seo_data = check_page_seo(page_info)
            if seo_data:
                results[page_info['path']] = {
                    'name': page_info['name'],
                    'seo_data': seo_data,
                    'status': 'success'
                }
            else:
                results[page_info['path']] = {
                    'name': page_info['name'],
                    'status': 'failed'
                }
        except Exception as e:
            print(f"❌ 检查页面 {page_info['name']} 时出错: {e}")
            results[page_info['path']] = {
                'name': page_info['name'],
                'status': 'error',
                'error': str(e)
            }
    
    # 保存结果到文件
    output_file = f"production_seo_check_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n📊 检查完成，结果已保存到: {output_file}")
    
    # 生成摘要
    successful_checks = sum(1 for r in results.values() if r['status'] == 'success')
    total_checks = len(results)
    
    print(f"\n📈 检查摘要:")
    print(f"   - 总页面数: {total_checks}")
    print(f"   - 成功检查: {successful_checks}")
    print(f"   - 失败检查: {total_checks - successful_checks}")
    
    if successful_checks == total_checks:
        print("🎉 所有页面检查完成！")
    else:
        print("⚠️  部分页面检查失败，请查看详细日志")

if __name__ == "__main__":
    main()