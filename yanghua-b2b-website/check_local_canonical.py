#!/usr/bin/env python3
"""
检查本地开发环境的 canonical 和 hreflang 标签一致性
"""

import requests
from bs4 import BeautifulSoup
import sys
import time

def check_url_hreflang_canonical(url):
    """检查单个URL的 canonical 和 hreflang 标签一致性"""
    
    try:
        # 获取页面内容
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 查找 canonical 标签
        canonical_tag = soup.find('link', rel='canonical')
        canonical_url = canonical_tag.get('href') if canonical_tag else None
        
        # 查找所有 hreflang 标签
        hreflang_tags = soup.find_all('link', rel='alternate')
        hreflang_urls = []
        
        for tag in hreflang_tags:
            if tag.get('hreflang'):
                hreflang_urls.append({
                    'hreflang': tag.get('hreflang'),
                    'href': tag.get('href')
                })
        
        # 检查一致性
        canonical_consistent = True
        double_slash_issues = []
        
        # 检查双斜杠问题
        if canonical_url and '//' in canonical_url.replace('https://', '').replace('http://', ''):
            double_slash_issues.append(f"Canonical: {canonical_url}")
        
        # 检查 hreflang 双斜杠问题
        for hreflang in hreflang_urls:
            href = hreflang['href']
            
            # 检查双斜杠问题
            if '//' in href.replace('https://', '').replace('http://', ''):
                double_slash_issues.append(f"Hreflang ({hreflang['hreflang']}): {href}")
        
        # 检查 hreflang 完整性 - 应该包含所有支持的语言
        hreflang_langs = [h['hreflang'] for h in hreflang_urls]
        expected_langs = ['en', 'es', 'x-default']
        missing_langs = [lang for lang in expected_langs if lang not in hreflang_langs]
        
        # 如果缺少必要的hreflang标签，标记为不一致
        if missing_langs:
            canonical_consistent = False
        
        success = canonical_consistent and len(double_slash_issues) == 0
        
        return {
            'url': url,
            'success': success,
            'canonical_url': canonical_url,
            'hreflang_urls': hreflang_urls,
            'canonical_consistent': canonical_consistent,
            'double_slash_issues': double_slash_issues,
            'missing_hreflang_langs': missing_langs if 'missing_langs' in locals() else []
        }
        
    except Exception as e:
        return {
            'url': url,
            'success': False,
            'error': str(e)
        }

def main():
    """批量检查本地开发环境的URL"""
    
    # 本地开发环境的URL列表
    test_urls = [
        "http://localhost:3000/en",
        "http://localhost:3000/es", 
        "http://localhost:3000/en/products",
        "http://localhost:3000/es/productos",
        "http://localhost:3000/en/services",
        "http://localhost:3000/es/servicios",
        "http://localhost:3000/en/solutions",
        "http://localhost:3000/es/soluciones",
        "http://localhost:3000/en/projects/1",
        "http://localhost:3000/es/proyectos/1",
        # 使用实际存在的产品ID
        "http://localhost:3000/en/products/flexible-busbar-2000a",
        "http://localhost:3000/es/productos/flexible-busbar-2000a",
        # 移除不存在的articles/1页面，因为文章使用slug而不是数字ID
        "http://localhost:3000/en/products/category/general",
        "http://localhost:3000/es/productos/categoria/general",
        "http://localhost:3000/en/products/category/fire-resistant",
        "http://localhost:3000/es/productos/categoria/fire-resistant"
    ]
    
    print("=== 检查本地开发环境 Canonical URL 修复效果 ===\n")
    
    all_passed = True
    results = []
    
    for i, url in enumerate(test_urls, 1):
        print(f"[{i}/{len(test_urls)}] 检查: {url}")
        
        result = check_url_hreflang_canonical(url)
        results.append(result)
        
        if 'error' in result:
            print(f"  ❌ 错误: {result['error']}")
            all_passed = False
        else:
            if result['success']:
                print(f"  ✅ 通过")
                print(f"    Canonical: {result['canonical_url']}")
            else:
                print(f"  ❌ 失败")
                if not result['canonical_consistent']:
                    if result.get('missing_hreflang_langs'):
                        print(f"    - 缺少 hreflang 标签: {', '.join(result['missing_hreflang_langs'])}")
                    else:
                        print(f"    - Hreflang 配置问题")
                if result['double_slash_issues']:
                    print(f"    - 双斜杠问题: {len(result['double_slash_issues'])} 个")
                    for issue in result['double_slash_issues']:
                        print(f"      {issue}")
                all_passed = False
        
        # 避免请求过快
        if i < len(test_urls):
            time.sleep(0.5)
    
    # 输出总结
    print(f"\n=== 检查结果总结 ===")
    passed_count = sum(1 for r in results if r.get('success', False))
    total_count = len(results)
    
    print(f"总计检查: {total_count} 个URL")
    print(f"通过检查: {passed_count} 个URL")
    print(f"失败检查: {total_count - passed_count} 个URL")
    
    if all_passed:
        print(f"\n🎉 所有检查通过! 本地开发环境的 Canonical URL 问题已修复!")
    else:
        print(f"\n⚠️  仍有问题需要修复")
        
        # 显示失败的URL详情
        print(f"\n失败的URL详情:")
        for result in results:
            if not result.get('success', False):
                print(f"  - {result['url']}")
                if 'error' in result:
                    print(f"    错误: {result['error']}")
                else:
                    if not result.get('canonical_consistent', True):
                        if result.get('missing_hreflang_langs'):
                            print(f"    问题: 缺少 hreflang 标签: {', '.join(result['missing_hreflang_langs'])}")
                        else:
                            print(f"    问题: Hreflang 配置问题")
                    if result.get('double_slash_issues'):
                        for issue in result['double_slash_issues']:
                            print(f"    问题: {issue}")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)