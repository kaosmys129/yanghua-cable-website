#!/usr/bin/env python3
"""
检查生产环境页面的 canonical 和 hreflang 标签一致性
"""

from bs4 import BeautifulSoup
import sys

def analyze_canonical_hreflang(html_file):
    """分析 canonical 和 hreflang 标签的一致性"""
    
    with open(html_file, 'r', encoding='utf-8') as f:
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
    
    # 输出结果
    print("=== Canonical 和 Hreflang 标签分析 ===")
    print(f"Canonical URL: {canonical_url}")
    print("\nHreflang URLs:")
    
    canonical_consistent = True
    
    for hreflang in hreflang_urls:
        print(f"  {hreflang['hreflang']}: {hreflang['href']}")
        
        # 检查 hreflang 是否使用了与 canonical 一致的 URL 格式
        if canonical_url and hreflang['hreflang'] == 'en':
            if hreflang['href'] != canonical_url:
                canonical_consistent = False
                print(f"    ⚠️  警告: 英文 hreflang URL 与 canonical URL 不一致!")
    
    print(f"\n=== 一致性检查结果 ===")
    if canonical_consistent:
        print("✅ Hreflang 标签使用了正确的 canonical URL")
    else:
        print("❌ Hreflang 标签未使用正确的 canonical URL")
    
    # 检查双斜杠问题
    print(f"\n=== 双斜杠问题检查 ===")
    double_slash_issues = []
    
    if canonical_url and '//' in canonical_url.replace('https://', '').replace('http://', ''):
        double_slash_issues.append(f"Canonical: {canonical_url}")
    
    for hreflang in hreflang_urls:
        if hreflang['href'] and '//' in hreflang['href'].replace('https://', '').replace('http://', ''):
            double_slash_issues.append(f"Hreflang ({hreflang['hreflang']}): {hreflang['href']}")
    
    if double_slash_issues:
        print("❌ 发现双斜杠问题:")
        for issue in double_slash_issues:
            print(f"  - {issue}")
    else:
        print("✅ 未发现双斜杠问题")
    
    return canonical_consistent and len(double_slash_issues) == 0

if __name__ == "__main__":
    html_file = "production_page_source_latest.html"
    success = analyze_canonical_hreflang(html_file)
    
    if success:
        print("\n🎉 所有检查通过! Hreflang 'not using canonical' 问题已修复!")
    else:
        print("\n⚠️  仍存在问题需要修复")
    
    sys.exit(0 if success else 1)