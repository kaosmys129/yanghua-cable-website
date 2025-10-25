#!/usr/bin/env python3
"""
分析有canonical URL问题的页面，找出具体原因
"""

from bs4 import BeautifulSoup
import os

def analyze_page_canonical(file_path, expected_url):
    """分析单个页面的canonical和hreflang标签"""
    
    if not os.path.exists(file_path):
        return {"error": f"文件不存在: {file_path}"}
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    soup = BeautifulSoup(content, 'html.parser')
    
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
    
    # 查找英文hreflang
    en_hreflang = None
    for hreflang in hreflang_urls:
        if hreflang['hreflang'] == 'en':
            en_hreflang = hreflang['href']
            break
    
    return {
        'expected_url': expected_url,
        'canonical_url': canonical_url,
        'en_hreflang_url': en_hreflang,
        'all_hreflang': hreflang_urls,
        'canonical_matches_expected': canonical_url == expected_url,
        'hreflang_matches_canonical': en_hreflang == canonical_url,
        'hreflang_matches_expected': en_hreflang == expected_url
    }

def main():
    """分析多个有问题的页面"""
    
    pages_to_analyze = [
        {
            'file': 'partners_page_source.html',
            'expected_url': 'https://www.yhflexiblebusbar.com/en/partners',
            'name': 'Partners页面'
        },
        {
            'file': 'contact_page_source.html',
            'expected_url': 'https://www.yhflexiblebusbar.com/en/contact',
            'name': 'Contact页面'
        },
        {
            'file': 'projects_4_page_source.html',
            'expected_url': 'https://www.yhflexiblebusbar.com/en/projects/4',
            'name': 'Projects/4页面'
        },
        {
            'file': 'fire_resistant_cables_page_source.html',
            'expected_url': 'https://www.yhflexiblebusbar.com/en/products/category/fire-resistant-cables',
            'name': '防火电缆分类页面'
        }
    ]
    
    print("=== 分析Canonical URL问题 ===\n")
    
    for page in pages_to_analyze:
        print(f"📄 {page['name']} ({page['file']})")
        print(f"   期望URL: {page['expected_url']}")
        
        result = analyze_page_canonical(page['file'], page['expected_url'])
        
        if 'error' in result:
            print(f"   ❌ {result['error']}")
        else:
            print(f"   Canonical URL: {result['canonical_url']}")
            print(f"   英文Hreflang URL: {result['en_hreflang_url']}")
            
            # 问题诊断
            issues = []
            if not result['canonical_matches_expected']:
                issues.append("Canonical URL不匹配期望URL")
            if not result['hreflang_matches_canonical']:
                issues.append("英文Hreflang URL与Canonical URL不一致")
            if not result['hreflang_matches_expected']:
                issues.append("英文Hreflang URL不匹配期望URL")
            
            if issues:
                print(f"   ❌ 问题: {', '.join(issues)}")
            else:
                print(f"   ✅ 无问题")
            
            # 显示所有hreflang
            if result['all_hreflang']:
                print(f"   所有Hreflang标签:")
                for hreflang in result['all_hreflang']:
                    print(f"     - {hreflang['hreflang']}: {hreflang['href']}")
        
        print()

if __name__ == "__main__":
    main()