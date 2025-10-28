#!/usr/bin/env python3
"""
生产环境与本地开发环境 SEO 标签对比脚本
对比两个环境的 hreflang 和 canonical 标签配置差异
"""

import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import sys

# 环境配置
PRODUCTION_BASE_URL = "https://www.yhflexiblebusbar.com"
LOCAL_BASE_URL = "http://localhost:3003"

# 要对比的页面
PAGES_TO_COMPARE = [
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

def compare_seo_data(prod_data, local_data, page_name):
    """对比两个环境的 SEO 数据"""
    comparison = {
        'page_name': page_name,
        'differences': [],
        'similarities': [],
        'issues': []
    }
    
    if not prod_data or not local_data:
        comparison['issues'].append("无法获取其中一个环境的数据")
        return comparison
    
    # 对比 canonical URL
    if prod_data['canonical'] != local_data['canonical']:
        comparison['differences'].append({
            'field': 'canonical',
            'production': prod_data['canonical'],
            'local': local_data['canonical']
        })
    else:
        comparison['similarities'].append('canonical URL 一致')
    
    # 对比 hreflang 标签
    prod_hreflang = {tag['hreflang']: tag['href'] for tag in prod_data['hreflang']}
    local_hreflang = {tag['hreflang']: tag['href'] for tag in local_data['hreflang']}
    
    # 检查 hreflang 语言覆盖
    prod_langs = set(prod_hreflang.keys())
    local_langs = set(local_hreflang.keys())
    
    if prod_langs != local_langs:
        comparison['differences'].append({
            'field': 'hreflang_languages',
            'production': list(prod_langs),
            'local': list(local_langs)
        })
    
    # 检查 hreflang URL 差异
    hreflang_url_diffs = []
    for lang in prod_langs.intersection(local_langs):
        if prod_hreflang[lang] != local_hreflang[lang]:
            hreflang_url_diffs.append({
                'language': lang,
                'production': prod_hreflang[lang],
                'local': local_hreflang[lang]
            })
    
    if hreflang_url_diffs:
        comparison['differences'].append({
            'field': 'hreflang_urls',
            'details': hreflang_url_diffs
        })
    
    # 对比页面标题
    if prod_data['title'] != local_data['title']:
        comparison['differences'].append({
            'field': 'title',
            'production': prod_data['title'],
            'local': local_data['title']
        })
    else:
        comparison['similarities'].append('页面标题一致')
    
    # 对比 meta 描述
    if prod_data['description'] != local_data['description']:
        comparison['differences'].append({
            'field': 'description',
            'production': prod_data['description'][:100] + '...' if prod_data['description'] else None,
            'local': local_data['description'][:100] + '...' if local_data['description'] else None
        })
    else:
        comparison['similarities'].append('Meta 描述一致')
    
    return comparison

def check_environment_seo(base_url, page_info):
    """检查指定环境的 SEO 配置"""
    url = f"{base_url}{page_info['path']}"
    html_content = get_page_content(url)
    return extract_seo_tags(html_content)

def main():
    """主函数"""
    print("🚀 开始对比生产环境与本地开发环境的 SEO 标签配置")
    print(f"🌐 生产环境: {PRODUCTION_BASE_URL}")
    print(f"🏠 本地环境: {LOCAL_BASE_URL}")
    print(f"⏰ 对比时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    comparison_results = {}
    
    for page_info in PAGES_TO_COMPARE:
        print(f"\n🔍 对比页面: {page_info['name']} ({page_info['path']})")
        
        try:
            # 获取生产环境数据
            print("   📡 获取生产环境数据...")
            prod_data = check_environment_seo(PRODUCTION_BASE_URL, page_info)
            
            # 获取本地环境数据
            print("   🏠 获取本地环境数据...")
            local_data = check_environment_seo(LOCAL_BASE_URL, page_info)
            
            # 对比数据
            comparison = compare_seo_data(prod_data, local_data, page_info['name'])
            comparison_results[page_info['path']] = comparison
            
            # 显示对比结果
            if comparison['differences']:
                print(f"   ⚠️  发现 {len(comparison['differences'])} 个差异:")
                for diff in comparison['differences']:
                    print(f"      - {diff['field']}: 生产环境与本地环境不同")
            
            if comparison['similarities']:
                print(f"   ✅ {len(comparison['similarities'])} 个配置一致")
            
            if comparison['issues']:
                print(f"   ❌ 问题: {', '.join(comparison['issues'])}")
                
        except Exception as e:
            print(f"❌ 对比页面 {page_info['name']} 时出错: {e}")
            comparison_results[page_info['path']] = {
                'page_name': page_info['name'],
                'error': str(e)
            }
    
    # 保存结果到文件
    output_file = f"seo_environment_comparison_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(comparison_results, f, ensure_ascii=False, indent=2)
    
    print(f"\n📊 对比完成，结果已保存到: {output_file}")
    
    # 生成摘要
    total_pages = len(comparison_results)
    pages_with_differences = sum(1 for result in comparison_results.values() 
                                if 'differences' in result and result['differences'])
    pages_with_errors = sum(1 for result in comparison_results.values() 
                           if 'error' in result)
    
    print(f"\n📈 对比摘要:")
    print(f"   - 总页面数: {total_pages}")
    print(f"   - 有差异的页面: {pages_with_differences}")
    print(f"   - 检查失败的页面: {pages_with_errors}")
    print(f"   - 完全一致的页面: {total_pages - pages_with_differences - pages_with_errors}")
    
    if pages_with_differences == 0 and pages_with_errors == 0:
        print("🎉 所有页面的 SEO 配置在两个环境中完全一致！")
    elif pages_with_differences > 0:
        print("⚠️  部分页面在两个环境中存在差异，请查看详细报告")
    
    if pages_with_errors > 0:
        print("❌ 部分页面检查失败，可能是本地环境未启动或网络问题")

if __name__ == "__main__":
    main()