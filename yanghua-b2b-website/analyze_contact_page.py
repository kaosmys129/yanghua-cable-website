#!/usr/bin/env python3
"""
详细分析联系页面的 canonical 和 hreflang 标签问题
"""

from bs4 import BeautifulSoup

def analyze_contact_page():
    """分析联系页面的标签"""
    
    with open('contact_page_source.html', 'r', encoding='utf-8') as f:
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
    
    print("=== 联系页面标签详细分析 ===")
    print(f"页面URL: https://www.yhflexiblebusbar.com/en/contact")
    print(f"Canonical URL: {canonical_url}")
    print("\nHreflang URLs:")
    
    for hreflang in hreflang_urls:
        print(f"  {hreflang['hreflang']}: {hreflang['href']}")
    
    # 检查问题
    print(f"\n=== 问题分析 ===")
    
    # 检查英文 hreflang 是否与 canonical 一致
    en_hreflang = None
    for hreflang in hreflang_urls:
        if hreflang['hreflang'] == 'en':
            en_hreflang = hreflang['href']
            break
    
    if canonical_url and en_hreflang:
        if canonical_url == en_hreflang:
            print("✅ 英文 hreflang 与 canonical URL 一致")
        else:
            print("❌ 英文 hreflang 与 canonical URL 不一致")
            print(f"   Canonical: {canonical_url}")
            print(f"   EN Hreflang: {en_hreflang}")
            print(f"   差异: {set(canonical_url) ^ set(en_hreflang) if canonical_url and en_hreflang else 'N/A'}")
    
    # 检查双斜杠问题
    print(f"\n=== 双斜杠检查 ===")
    issues = []
    
    if canonical_url and '//' in canonical_url.replace('https://', '').replace('http://', ''):
        issues.append(f"Canonical: {canonical_url}")
    
    for hreflang in hreflang_urls:
        if hreflang['href'] and '//' in hreflang['href'].replace('https://', '').replace('http://', ''):
            issues.append(f"Hreflang ({hreflang['hreflang']}): {hreflang['href']}")
    
    if issues:
        print("❌ 发现双斜杠问题:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print("✅ 未发现双斜杠问题")

if __name__ == "__main__":
    analyze_contact_page()