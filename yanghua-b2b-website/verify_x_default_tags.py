#!/usr/bin/env python3
"""
验证 x-default 标签实现脚本
检查生产环境中所有页面的 x-default hreflang 标签是否正确实现
"""

import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import time

# 配置
PRODUCTION_BASE_URL = 'https://www.yhflexiblebusbar.com'
PAGES_TO_CHECK = [
    {'path': '/en', 'name': 'Homepage (EN)'},
    {'path': '/es', 'name': 'Homepage (ES)'},
    {'path': '/en/projects', 'name': 'Projects (EN)'},
    {'path': '/es/proyectos', 'name': 'Projects (ES)'},
    {'path': '/en/solutions', 'name': 'Solutions (EN)'},
    {'path': '/es/soluciones', 'name': 'Solutions (ES)'},
    {'path': '/en/services', 'name': 'Services (EN)'},
    {'path': '/es/servicios', 'name': 'Services (ES)'},
    {'path': '/en/contact', 'name': 'Contact (EN)'},
    {'path': '/es/contacto', 'name': 'Contact (ES)'},
]

def get_page_content(url):
    """获取页面内容"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"Error fetching {url}: {str(e)}")
        return None

def extract_hreflang_tags(html_content):
    """提取页面中的 hreflang 标签"""
    if not html_content:
        return []
    
    soup = BeautifulSoup(html_content, 'html.parser')
    hreflang_tags = []
    
    # 查找所有 hreflang 相关的 link 标签
    links = soup.find_all('link', {'rel': 'alternate'})
    for link in links:
        hreflang = link.get('hreflang')
        href = link.get('href')
        if hreflang and href:
            hreflang_tags.append({
                'hreflang': hreflang,
                'href': href
            })
    
    return hreflang_tags

def check_x_default_tag(hreflang_tags):
    """检查是否存在 x-default 标签"""
    x_default_tags = [tag for tag in hreflang_tags if tag['hreflang'] == 'x-default']
    return x_default_tags

def verify_x_default_points_to_english(x_default_tags):
    """验证 x-default 标签是否指向英文版本"""
    if not x_default_tags:
        return False, "No x-default tag found"
    
    for tag in x_default_tags:
        href = tag['href']
        # 检查是否指向英文版本（包含 /en/ 或以英文域名结尾）
        if '/en/' in href or href.endswith('/en') or (href.count('/') <= 3 and 'en' in href):
            return True, f"x-default points to English version: {href}"
    
    return False, f"x-default does not point to English version: {[tag['href'] for tag in x_default_tags]}"

def main():
    """主函数"""
    print("🔍 验证 x-default 标签实现")
    print("=" * 60)
    
    results = []
    summary = {
        'total_pages': len(PAGES_TO_CHECK),
        'pages_with_x_default': 0,
        'pages_x_default_correct': 0,
        'pages_missing_x_default': 0,
        'timestamp': datetime.now().isoformat()
    }
    
    for page in PAGES_TO_CHECK:
        url = PRODUCTION_BASE_URL + page['path']
        print(f"\n📄 检查页面: {page['name']}")
        print(f"   URL: {url}")
        
        # 获取页面内容
        html_content = get_page_content(url)
        if not html_content:
            result = {
                'page': page['name'],
                'url': url,
                'status': 'error',
                'error': 'Failed to fetch page content',
                'hreflang_tags': [],
                'x_default_found': False,
                'x_default_correct': False
            }
            results.append(result)
            continue
        
        # 提取 hreflang 标签
        hreflang_tags = extract_hreflang_tags(html_content)
        print(f"   找到 {len(hreflang_tags)} 个 hreflang 标签")
        
        # 检查 x-default 标签
        x_default_tags = check_x_default_tag(hreflang_tags)
        x_default_found = len(x_default_tags) > 0
        
        if x_default_found:
            summary['pages_with_x_default'] += 1
            print(f"   ✅ 找到 x-default 标签: {len(x_default_tags)} 个")
            
            # 验证 x-default 是否指向英文版本
            is_correct, message = verify_x_default_points_to_english(x_default_tags)
            if is_correct:
                summary['pages_x_default_correct'] += 1
                print(f"   ✅ {message}")
            else:
                print(f"   ❌ {message}")
        else:
            summary['pages_missing_x_default'] += 1
            print(f"   ❌ 未找到 x-default 标签")
        
        # 显示所有 hreflang 标签
        if hreflang_tags:
            print("   📋 所有 hreflang 标签:")
            for tag in hreflang_tags:
                marker = "🎯" if tag['hreflang'] == 'x-default' else "  "
                print(f"      {marker} {tag['hreflang']}: {tag['href']}")
        
        result = {
            'page': page['name'],
            'url': url,
            'status': 'success',
            'hreflang_tags': hreflang_tags,
            'x_default_found': x_default_found,
            'x_default_correct': is_correct if x_default_found else False,
            'x_default_tags': x_default_tags
        }
        results.append(result)
        
        # 添加延迟避免请求过快
        time.sleep(1)
    
    # 生成报告
    print("\n" + "=" * 60)
    print("📊 验证结果摘要")
    print("=" * 60)
    print(f"总页面数: {summary['total_pages']}")
    print(f"包含 x-default 标签的页面: {summary['pages_with_x_default']}")
    print(f"x-default 标签正确的页面: {summary['pages_x_default_correct']}")
    print(f"缺少 x-default 标签的页面: {summary['pages_missing_x_default']}")
    
    success_rate = (summary['pages_x_default_correct'] / summary['total_pages']) * 100
    print(f"成功率: {success_rate:.1f}%")
    
    # 保存详细结果
    report_data = {
        'summary': summary,
        'results': results
    }
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"x_default_verification_{timestamp}.json"
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 详细报告已保存到: {filename}")
    
    # 结论
    if summary['pages_x_default_correct'] == summary['total_pages']:
        print("\n🎉 所有页面的 x-default 标签都已正确实现！")
    elif summary['pages_with_x_default'] == summary['total_pages']:
        print("\n⚠️  所有页面都有 x-default 标签，但部分配置可能不正确")
    else:
        print(f"\n❌ 还有 {summary['pages_missing_x_default']} 个页面缺少 x-default 标签")

if __name__ == "__main__":
    main()