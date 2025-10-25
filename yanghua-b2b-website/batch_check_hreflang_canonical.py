#!/usr/bin/env python3
"""
批量检查多个URL的 canonical 和 hreflang 标签一致性
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
        
        # 检查 hreflang 一致性和双斜杠问题
        current_lang = 'en' if '/en' in url else 'es'
        
        for hreflang in hreflang_urls:
            # 检查双斜杠
            if hreflang['href'] and '//' in hreflang['href'].replace('https://', '').replace('http://', ''):
                double_slash_issues.append(f"Hreflang ({hreflang['hreflang']}): {hreflang['href']}")
            
            # 检查当前语言的 hreflang 是否与 canonical 一致
            if canonical_url and hreflang['hreflang'] == current_lang:
                if hreflang['href'] != canonical_url:
                    canonical_consistent = False
        
        return {
            'url': url,
            'canonical_url': canonical_url,
            'hreflang_urls': hreflang_urls,
            'canonical_consistent': canonical_consistent,
            'double_slash_issues': double_slash_issues,
            'success': canonical_consistent and len(double_slash_issues) == 0
        }
        
    except Exception as e:
        return {
            'url': url,
            'error': str(e),
            'success': False
        }

def main():
    """批量检查多个URL"""
    
    # 要检查的URL列表（基于截图中的所有24个URL）
    test_urls = [
        'https://www.yhflexiblebusbar.com/en',
        'https://www.yhflexiblebusbar.com/en/products',
        'https://www.yhflexiblebusbar.com/en/services',
        'https://www.yhflexiblebusbar.com/en/partners',
        'https://www.yhflexiblebusbar.com/en/solutions/data-center',
        'https://www.yhflexiblebusbar.com/en/about',
        'https://www.yhflexiblebusbar.com/en/articles',
        'https://www.yhflexiblebusbar.com/en/solutions/new-energy',
        'https://www.yhflexiblebusbar.com/en/contact',
        'https://www.yhflexiblebusbar.com/en/solutions/manufacturing',
        'https://www.yhflexiblebusbar.com/en/solutions/power-system',
        'https://www.yhflexiblebusbar.com/en/projects/4',
        'https://www.yhflexiblebusbar.com/en/solutions',
        'https://www.yhflexiblebusbar.com/en/projects/2',
        'https://www.yhflexiblebusbar.com/en/projects/1',
        'https://www.yhflexiblebusbar.com/en/solutions/metallurgy',
        'https://www.yhflexiblebusbar.com/en/solutions/charging-station',
        'https://www.yhflexiblebusbar.com/en/projects/6',
        'https://www.yhflexiblebusbar.com/en/projects/5',
        'https://www.yhflexiblebusbar.com/en/projects/7',
        'https://www.yhflexiblebusbar.com/en/products/category/fire-resistant-cables',
        'https://www.yhflexiblebusbar.com/en/products/category/general-purpose-cables',
        'https://www.yhflexiblebusbar.com/en/products/category/low-smoke-halogen-free-cables',
        'https://www.yhflexiblebusbar.com/en/products/category/special-cables'
    ]
    
    print("=== 批量检查 Hreflang 'Not Using Canonical' 问题 ===\n")
    
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
            else:
                print(f"  ❌ 失败")
                if not result['canonical_consistent']:
                    print(f"    - Hreflang 未使用 canonical URL")
                if result['double_slash_issues']:
                    print(f"    - 双斜杠问题: {len(result['double_slash_issues'])} 个")
                all_passed = False
        
        # 避免请求过快
        if i < len(test_urls):
            time.sleep(1)
    
    # 输出总结
    print(f"\n=== 检查结果总结 ===")
    passed_count = sum(1 for r in results if r.get('success', False))
    total_count = len(results)
    
    print(f"总计检查: {total_count} 个URL")
    print(f"通过检查: {passed_count} 个URL")
    print(f"失败检查: {total_count - passed_count} 个URL")
    
    if all_passed:
        print(f"\n🎉 所有检查通过! 24个URL的 Hreflang 'Not Using Canonical' 问题已修复!")
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
                        print(f"    问题: Hreflang 未使用 canonical URL")
                    if result.get('double_slash_issues'):
                        for issue in result['double_slash_issues']:
                            print(f"    问题: {issue}")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)