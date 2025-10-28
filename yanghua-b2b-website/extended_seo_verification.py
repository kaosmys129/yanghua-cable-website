#!/usr/bin/env python3
"""
扩展页面 SEO 验证脚本
验证 projects、solutions、services、contact 页面的 hreflang 和 canonical 标签配置
"""

import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import sys

# 环境配置
PRODUCTION_BASE_URL = "https://www.yhflexiblebusbar.com"
LOCAL_BASE_URL = "http://localhost:3003"

# 扩展页面配置
EXTENDED_PAGES = [
    {"path": "/en/projects", "name": "英文项目页", "type": "projects", "lang": "en"},
    {"path": "/es/proyectos", "name": "西班牙语项目页", "type": "projects", "lang": "es"},
    {"path": "/en/solutions", "name": "英文解决方案页", "type": "solutions", "lang": "en"},
    {"path": "/es/soluciones", "name": "西班牙语解决方案页", "type": "solutions", "lang": "es"},
    {"path": "/en/services", "name": "英文服务页", "type": "services", "lang": "en"},
    {"path": "/es/servicios", "name": "西班牙语服务页", "type": "services", "lang": "es"},
    {"path": "/en/contact", "name": "英文联系页", "type": "contact", "lang": "en"},
    {"path": "/es/contacto", "name": "西班牙语联系页", "type": "contact", "lang": "es"},
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
    
    og_title = soup.find('meta', {'property': 'og:title'})
    og_title_content = og_title.get('content') if og_title else None
    
    return {
        'canonical': canonical_url,
        'hreflang': hreflang_data,
        'title': title_text,
        'description': description,
        'og_url': og_url_content,
        'og_title': og_title_content
    }

def validate_seo_tags(seo_data, page_info, base_url):
    """验证 SEO 标签的正确性"""
    issues = []
    warnings = []
    
    if not seo_data:
        issues.append("无法提取 SEO 数据")
        return issues, warnings
    
    # 验证 canonical URL
    expected_canonical = f"{base_url}{page_info['path']}"
    if not seo_data['canonical']:
        issues.append("缺少 canonical 标签")
    elif seo_data['canonical'] != expected_canonical:
        issues.append(f"Canonical URL 不正确: 期望 {expected_canonical}, 实际 {seo_data['canonical']}")
    
    # 验证 hreflang 标签
    if not seo_data['hreflang']:
        issues.append("缺少 hreflang 标签")
    else:
        hreflang_langs = [tag['hreflang'] for tag in seo_data['hreflang']]
        
        # 检查必需的语言标签
        required_langs = ['en', 'es', 'x-default']
        missing_langs = [lang for lang in required_langs if lang not in hreflang_langs]
        if missing_langs:
            issues.append(f"缺少 hreflang 语言标签: {', '.join(missing_langs)}")
        
        # 检查 hreflang URL 格式
        for tag in seo_data['hreflang']:
            if not tag['href'].startswith('http'):
                issues.append(f"Hreflang URL 不是绝对路径: {tag['hreflang']} -> {tag['href']}")
    
    # 验证页面标题
    if not seo_data['title']:
        warnings.append("缺少页面标题")
    elif len(seo_data['title']) < 30:
        warnings.append("页面标题可能过短")
    elif len(seo_data['title']) > 60:
        warnings.append("页面标题可能过长")
    
    # 验证 meta 描述
    if not seo_data['description']:
        warnings.append("缺少 meta 描述")
    elif len(seo_data['description']) < 120:
        warnings.append("Meta 描述可能过短")
    elif len(seo_data['description']) > 160:
        warnings.append("Meta 描述可能过长")
    
    return issues, warnings

def check_page_seo(base_url, page_info):
    """检查单个页面的 SEO 配置"""
    url = f"{base_url}{page_info['path']}"
    print(f"   🔍 检查: {url}")
    
    html_content = get_page_content(url)
    seo_data = extract_seo_tags(html_content)
    issues, warnings = validate_seo_tags(seo_data, page_info, base_url)
    
    return {
        'url': url,
        'page_info': page_info,
        'seo_data': seo_data,
        'issues': issues,
        'warnings': warnings,
        'status': 'success' if not issues else 'failed'
    }

def compare_environments(page_info):
    """对比生产环境和本地环境的 SEO 配置"""
    print(f"🔄 对比环境: {page_info['name']}")
    
    # 检查生产环境
    prod_result = check_page_seo(PRODUCTION_BASE_URL, page_info)
    
    # 检查本地环境
    local_result = check_page_seo(LOCAL_BASE_URL, page_info)
    
    # 对比结果
    comparison = {
        'page_name': page_info['name'],
        'production': prod_result,
        'local': local_result,
        'differences': [],
        'environment_issues': []
    }
    
    # 检查环境差异
    if prod_result['status'] == 'success' and local_result['status'] == 'success':
        prod_seo = prod_result['seo_data']
        local_seo = local_result['seo_data']
        
        # 对比 canonical URL
        if prod_seo['canonical'] != local_seo['canonical']:
            comparison['differences'].append({
                'field': 'canonical',
                'production': prod_seo['canonical'],
                'local': local_seo['canonical']
            })
        
        # 对比 hreflang 标签
        prod_hreflang = {tag['hreflang']: tag['href'] for tag in prod_seo['hreflang']}
        local_hreflang = {tag['hreflang']: tag['href'] for tag in local_seo['hreflang']}
        
        if prod_hreflang != local_hreflang:
            comparison['differences'].append({
                'field': 'hreflang',
                'production': prod_hreflang,
                'local': local_hreflang
            })
    
    # 记录环境问题
    if prod_result['status'] == 'failed':
        comparison['environment_issues'].append(f"生产环境问题: {', '.join(prod_result['issues'])}")
    
    if local_result['status'] == 'failed':
        comparison['environment_issues'].append(f"本地环境问题: {', '.join(local_result['issues'])}")
    
    return comparison

def main():
    """主函数"""
    print("🚀 开始扩展页面 SEO 验证")
    print(f"🌐 生产环境: {PRODUCTION_BASE_URL}")
    print(f"🏠 本地环境: {LOCAL_BASE_URL}")
    print(f"⏰ 验证时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📄 验证页面数: {len(EXTENDED_PAGES)}")
    
    results = {
        'timestamp': datetime.now().isoformat(),
        'production_base_url': PRODUCTION_BASE_URL,
        'local_base_url': LOCAL_BASE_URL,
        'pages_checked': len(EXTENDED_PAGES),
        'results': {},
        'summary': {
            'total_pages': len(EXTENDED_PAGES),
            'successful_checks': 0,
            'failed_checks': 0,
            'pages_with_issues': 0,
            'pages_with_warnings': 0,
            'environment_differences': 0
        }
    }
    
    # 检查每个页面
    for page_info in EXTENDED_PAGES:
        print(f"\n📋 检查页面: {page_info['name']} ({page_info['path']})")
        
        try:
            # 对比两个环境
            comparison = compare_environments(page_info)
            results['results'][page_info['path']] = comparison
            
            # 更新统计
            if comparison['production']['status'] == 'success' and comparison['local']['status'] == 'success':
                results['summary']['successful_checks'] += 1
                
                if comparison['differences']:
                    results['summary']['environment_differences'] += 1
                    print(f"   ⚠️  发现 {len(comparison['differences'])} 个环境差异")
                else:
                    print("   ✅ 两个环境配置一致")
            else:
                results['summary']['failed_checks'] += 1
                print("   ❌ 检查失败")
            
            # 统计问题和警告
            prod_issues = len(comparison['production'].get('issues', []))
            local_issues = len(comparison['local'].get('issues', []))
            if prod_issues > 0 or local_issues > 0:
                results['summary']['pages_with_issues'] += 1
            
            prod_warnings = len(comparison['production'].get('warnings', []))
            local_warnings = len(comparison['local'].get('warnings', []))
            if prod_warnings > 0 or local_warnings > 0:
                results['summary']['pages_with_warnings'] += 1
                
        except Exception as e:
            print(f"❌ 检查页面 {page_info['name']} 时出错: {e}")
            results['results'][page_info['path']] = {
                'page_name': page_info['name'],
                'error': str(e)
            }
            results['summary']['failed_checks'] += 1
    
    # 保存结果到文件
    output_file = f"extended_seo_verification_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n📊 验证完成，结果已保存到: {output_file}")
    
    # 生成摘要报告
    summary = results['summary']
    print(f"\n📈 验证摘要:")
    print(f"   - 总页面数: {summary['total_pages']}")
    print(f"   - 成功检查: {summary['successful_checks']}")
    print(f"   - 检查失败: {summary['failed_checks']}")
    print(f"   - 有问题的页面: {summary['pages_with_issues']}")
    print(f"   - 有警告的页面: {summary['pages_with_warnings']}")
    print(f"   - 环境差异页面: {summary['environment_differences']}")
    
    # 按页面类型分组统计
    page_types = {}
    for page_info in EXTENDED_PAGES:
        page_type = page_info['type']
        if page_type not in page_types:
            page_types[page_type] = {'total': 0, 'success': 0}
        page_types[page_type]['total'] += 1
        
        result = results['results'].get(page_info['path'])
        if result and result.get('production', {}).get('status') == 'success' and result.get('local', {}).get('status') == 'success':
            page_types[page_type]['success'] += 1
    
    print(f"\n📊 按页面类型统计:")
    for page_type, stats in page_types.items():
        success_rate = (stats['success'] / stats['total']) * 100 if stats['total'] > 0 else 0
        print(f"   - {page_type}: {stats['success']}/{stats['total']} ({success_rate:.1f}%)")
    
    # 最终状态
    if summary['failed_checks'] == 0 and summary['environment_differences'] == 0:
        print("\n🎉 所有扩展页面的 SEO 配置验证通过！")
        return 0
    elif summary['failed_checks'] > 0:
        print(f"\n❌ {summary['failed_checks']} 个页面检查失败，请查看详细报告")
        return 1
    else:
        print(f"\n⚠️  发现 {summary['environment_differences']} 个页面存在环境差异")
        return 0

if __name__ == "__main__":
    sys.exit(main())