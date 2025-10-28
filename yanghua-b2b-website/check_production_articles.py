#!/usr/bin/env python3
"""
生产环境文章页面 SEO 标签验证脚本
检查实际文章页面的 hreflang 和 canonical 标签
"""

import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import sys

# 生产环境配置
PRODUCTION_BASE_URL = "https://www.yhflexiblebusbar.com"

def get_articles_list():
    """获取文章列表"""
    try:
        # 先获取英文文章列表页面
        url = f"{PRODUCTION_BASE_URL}/en/articles"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 查找文章链接
        article_links = []
        
        # 查找所有可能的文章链接
        links = soup.find_all('a', href=True)
        for link in links:
            href = link.get('href')
            if href and '/articles/' in href:
                if href.startswith('/'):
                    href = PRODUCTION_BASE_URL + href
                article_links.append(href)
        
        # 去重并限制数量
        unique_links = list(set(article_links))[:5]  # 只检查前5篇文章
        
        print(f"找到 {len(unique_links)} 篇文章进行检查")
        return unique_links
        
    except Exception as e:
        print(f"❌ 获取文章列表失败: {e}")
        # 如果无法获取文章列表，使用一些常见的文章路径
        return [
            f"{PRODUCTION_BASE_URL}/en/articles/flexible-busbar-technology",
            f"{PRODUCTION_BASE_URL}/en/articles/data-center-power-solutions",
            f"{PRODUCTION_BASE_URL}/en/articles/ev-charging-infrastructure"
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
    
    # 提取文章特定的 meta 标签
    og_type = soup.find('meta', {'property': 'og:type'})
    og_type_content = og_type.get('content') if og_type else None
    
    article_author = soup.find('meta', {'name': 'author'})
    author = article_author.get('content') if article_author else None
    
    return {
        'canonical': canonical_url,
        'hreflang': hreflang_data,
        'title': title_text,
        'description': description,
        'og_url': og_url_content,
        'og_type': og_type_content,
        'author': author
    }

def check_article_seo(article_url):
    """检查单篇文章的 SEO 配置"""
    print(f"\n🔍 检查文章: {article_url}")
    
    html_content = get_page_content(article_url)
    if not html_content:
        return None
    
    seo_data = extract_seo_tags(html_content)
    if not seo_data:
        print("❌ 无法提取 SEO 标签")
        return None
    
    # 检查结果
    print(f"📄 文章标题: {seo_data['title']}")
    print(f"📝 Meta 描述: {seo_data['description'][:100] if seo_data['description'] else 'None'}...")
    
    if seo_data['author']:
        print(f"👤 作者: {seo_data['author']}")
    
    if seo_data['og_type']:
        print(f"📰 内容类型: {seo_data['og_type']}")
    
    # Canonical 检查
    if seo_data['canonical']:
        print(f"🔗 Canonical URL: {seo_data['canonical']}")
        if article_url in seo_data['canonical'] or seo_data['canonical'] == article_url:
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
        elif 'en' in languages:
            print("⚠️  只包含英文 hreflang，可能缺少西班牙语版本")
        else:
            print("⚠️  hreflang 配置可能不完整")
    else:
        print("❌ 缺少 Hreflang 标签")
    
    # Open Graph URL 检查
    if seo_data['og_url']:
        print(f"📱 OG URL: {seo_data['og_url']}")
    
    return seo_data

def main():
    """主函数"""
    print("🚀 开始检查生产环境文章页面 SEO 标签配置")
    print(f"🌐 生产环境: {PRODUCTION_BASE_URL}")
    print(f"⏰ 检查时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 获取文章列表
    article_urls = get_articles_list()
    
    if not article_urls:
        print("❌ 无法获取文章列表")
        return
    
    results = {}
    
    for article_url in article_urls:
        try:
            seo_data = check_article_seo(article_url)
            if seo_data:
                results[article_url] = {
                    'seo_data': seo_data,
                    'status': 'success'
                }
            else:
                results[article_url] = {
                    'status': 'failed'
                }
        except Exception as e:
            print(f"❌ 检查文章 {article_url} 时出错: {e}")
            results[article_url] = {
                'status': 'error',
                'error': str(e)
            }
    
    # 保存结果到文件
    output_file = f"production_articles_seo_check_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n📊 检查完成，结果已保存到: {output_file}")
    
    # 生成摘要
    successful_checks = sum(1 for r in results.values() if r['status'] == 'success')
    total_checks = len(results)
    
    print(f"\n📈 检查摘要:")
    print(f"   - 总文章数: {total_checks}")
    print(f"   - 成功检查: {successful_checks}")
    print(f"   - 失败检查: {total_checks - successful_checks}")
    
    if successful_checks == total_checks:
        print("🎉 所有文章检查完成！")
    else:
        print("⚠️  部分文章检查失败，请查看详细日志")

if __name__ == "__main__":
    main()