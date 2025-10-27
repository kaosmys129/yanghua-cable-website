#!/usr/bin/env python3
"""
批量验证页面是否存在 hreflang 的“multiple entries”问题（同一语言出现多条 alternate）。
- 同时检查 HTTP 响应头中的 Link 是否仍包含 rel="alternate"; hreflang（我们期望没有）。
- 支持从 seo-pages.config.json 读取路径，并可指定 base-url（开发/生产环境）。

用法示例：
  python3 check_hreflang_multiple_entries.py --base-url http://localhost:3001
  python3 check_hreflang_multiple_entries.py --base-url https://www.yhflexiblebusbar.com
"""

import argparse
import json
import os
import re
import sys
import time
from typing import Dict, List, Tuple

import requests
from bs4 import BeautifulSoup

DEFAULT_CONFIG = "seo-pages.config.json"
EXPECTED_LANGS = ["en", "es", "x-default"]
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36"


def load_paths_from_config(config_path: str) -> List[str]:
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"未找到配置文件: {config_path}")
    with open(config_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    pages = data.get("pages", [])
    paths = [p.get("path") for p in pages if p.get("path")]
    return paths


def fetch(url: str) -> Tuple[int, Dict[str, str], bytes]:
    headers = {"User-Agent": UA}
    resp = requests.get(url, headers=headers, timeout=20)
    code = resp.status_code
    # 将多值 header 折叠为字符串
    hdrs = {k: ", ".join(v) if isinstance(v, list) else str(v) for k, v in resp.headers.items()}
    return code, hdrs, resp.content


def extract_html_alternates(html: bytes) -> List[Tuple[str, str]]:
    soup = BeautifulSoup(html, "html.parser")
    tags = soup.find_all("link", rel="alternate")
    results: List[Tuple[str, str]] = []
    for tag in tags:
        hreflang = (tag.get("hreflang") or "").strip().lower()
        href = (tag.get("href") or "").strip()
        if hreflang:
            results.append((hreflang, href))
    return results


def parse_link_header(link_value: str) -> List[Tuple[str, str]]:
    # RFC8288 格式示例：<https://example.com/en/about>; rel="alternate"; hreflang="en"
    if not link_value:
        return []
    pattern = re.compile(r"<([^>]+)>\s*;\s*rel=\"alternate\"\s*;\s*hreflang=\"([^\"]+)\"", re.IGNORECASE)
    matches = pattern.findall(link_value)
    return [(lang.lower(), href) for href, lang in matches]


def detect_duplicates(entries: List[Tuple[str, str]]) -> Dict[str, Dict[str, List[str]]]:
    # 返回 {lang: {"all": [...], "unique": [...], "is_duplicate": bool}}
    mapping: Dict[str, List[str]] = {}
    for lang, href in entries:
        mapping.setdefault(lang, []).append(href)
    result: Dict[str, Dict[str, List[str]]] = {}
    for lang, hrefs in mapping.items():
        normalized = [h.rstrip("/") for h in hrefs if h]
        uniq = sorted(set(normalized))
        result[lang] = {"all": hrefs, "unique": uniq, "is_duplicate": len(hrefs) > 1 and len(uniq) > 1}
    return result


def check_one_url(base_url: str, path: str) -> Dict:
    url = base_url.rstrip("/") + path
    code, headers, body = fetch(url)

    html_alternates = extract_html_alternates(body)
    header_link = headers.get("Link", "")
    header_alternates = parse_link_header(header_link)

    html_dup = detect_duplicates(html_alternates)
    header_dup = detect_duplicates(header_alternates)

    # 是否仍然使用了 Link 头输出 hreflang（我们期望没有）
    has_header_alternates = len(header_alternates) > 0
    # 是否出现重复（同一语言有多条不同 href）
    html_has_duplicates = any(v["is_duplicate"] for v in html_dup.values())
    header_has_duplicates = any(v["is_duplicate"] for v in header_dup.values())

    # 额外检查：是否存在非预期语言标签
    langs_found = sorted(set([lang for lang, _ in html_alternates]))
    unexpected_langs = [l for l in langs_found if l not in EXPECTED_LANGS]

    return {
        "url": url,
        "status_code": code,
        "html_alternates": html_alternates,
        "header_link_raw": header_link,
        "header_alternates": header_alternates,
        "html_duplicates": html_dup,
        "header_duplicates": header_dup,
        "has_header_alternates": has_header_alternates,
        "html_has_duplicates": html_has_duplicates,
        "header_has_duplicates": header_has_duplicates,
        "unexpected_langs": unexpected_langs,
        "passed": (code == 200) and (not has_header_alternates) and (not html_has_duplicates) and (not header_has_duplicates)
    }


def main():
    parser = argparse.ArgumentParser(description="验证 hreflang multiple entries 问题是否修复")
    parser.add_argument("--base-url", required=True, help="要测试的基础域名，例如 http://localhost:3001 或 https://www.yhflexiblebusbar.com")
    parser.add_argument("--config", default=DEFAULT_CONFIG, help="页面路径配置文件，默认 seo-pages.config.json")
    parser.add_argument("--delay", type=float, default=0.5, help="每个请求之间的延迟秒数")
    args = parser.parse_args()

    paths = load_paths_from_config(args.config)
    print(f"=== 开始检查（base: {args.base_url}） 共 {len(paths)} 个路径 ===\n")

    all_passed = True
    results: List[Dict] = []

    for i, path in enumerate(paths, 1):
        res = check_one_url(args.base_url, path)
        results.append(res)

        print(f"[{i}/{len(paths)}] {res['url']}  ->  HTTP {res['status_code']}")
        if res["has_header_alternates"]:
            print("   ❌ 响应头仍包含 Link alternates（应清理）")
        if res["html_has_duplicates"]:
            print("   ❌ HTML 中存在同一 hreflang 的多条条目")
            for lang, detail in res["html_duplicates"].items():
                if detail["is_duplicate"]:
                    print(f"      - {lang}: {detail['unique']}")
        if res["unexpected_langs"]:
            print(f"   ⚠️  存在非预期语言标签: {', '.join(res['unexpected_langs'])}")
        if not (res["status_code"] == 200 and not res["has_header_alternates"] and not res["html_has_duplicates"] and not res["header_has_duplicates"]):
            all_passed = False
        else:
            print("   ✅ 通过（无 Link 头，且无重复 hreflang 条目）")

        if i < len(paths):
            time.sleep(args.delay)

    # 汇总
    print("\n=== 汇总 ===")
    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    failed = total - passed
    print(f"总计: {total}  通过: {passed}  失败: {failed}")

    if failed > 0:
        print("\n失败页面列表：")
        for r in results:
            if not r["passed"]:
                print(f"- {r['url']}")
                if r["has_header_alternates"]:
                    print("    问题: 响应头 Link 仍包含 alternates")
                if r["html_has_duplicates"]:
                    print("    问题: HTML 同一语言多条 alternate")
                if r["unexpected_langs"]:
                    print(f"    问题: 非预期语言 {', '.join(r['unexpected_langs'])}")
    else:
        print("\n🎉 所有页面均已修复：无响应头 Link alternates，且 HTML 中无重复 hreflang 条目。")

    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()