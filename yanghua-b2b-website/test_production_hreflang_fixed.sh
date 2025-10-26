#!/bin/bash

# 生产环境 hreflang 标签测试脚本 (修复版)
# 测试网站：https://www.yhflexiblebusbar.com

echo "=========================================="
echo "生产环境 hreflang 标签测试"
echo "测试时间: $(date)"
echo "=========================================="

# 定义测试页面数组
test_urls=(
    "https://www.yhflexiblebusbar.com/en"
    "https://www.yhflexiblebusbar.com/es"
    "https://www.yhflexiblebusbar.com/en/about"
    "https://www.yhflexiblebusbar.com/es/about"
    "https://www.yhflexiblebusbar.com/en/products"
    "https://www.yhflexiblebusbar.com/es/products"
    "https://www.yhflexiblebusbar.com/en/contact"
    "https://www.yhflexiblebusbar.com/es/contact"
)

test_names=(
    "首页_英语"
    "首页_西班牙语"
    "About_英语"
    "About_西班牙语"
    "Products_英语"
    "Products_西班牙语"
    "Contact_英语"
    "Contact_西班牙语"
)

# 测试函数
test_page() {
    local page_name="$1"
    local url="$2"
    
    echo ""
    echo "=== 测试页面: $page_name ==="
    echo "URL: $url"
    
    # 检查HTTP状态码
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    echo "HTTP状态码: $status_code"
    
    if [ "$status_code" != "200" ]; then
        echo "❌ 页面无法访问"
        return 1
    fi
    
    # 获取页面内容
    page_content=$(curl -s "$url")
    
    # 检查语言属性
    lang_attr=$(echo "$page_content" | grep -o '<html[^>]*lang="[^"]*"' | sed 's/.*lang="\([^"]*\)".*/\1/')
    echo "语言属性: $lang_attr"
    
    # 提取hreflang标签 - 使用更宽松的匹配
    echo "hreflang标签:"
    hreflang_found=false
    
    # 方法1: 查找包含hreflang的link标签
    while IFS= read -r line; do
        if [[ "$line" == *'hreflang='* ]]; then
            hreflang=$(echo "$line" | sed -n 's/.*hreflang="\([^"]*\)".*/\1/p')
            href=$(echo "$line" | sed -n 's/.*href="\([^"]*\)".*/\1/p')
            if [[ -n "$hreflang" && -n "$href" ]]; then
                echo "  - $hreflang: $href"
                hreflang_found=true
            fi
        fi
    done <<< "$(echo "$page_content" | grep -i 'hreflang')"
    
    if [ "$hreflang_found" = false ]; then
        echo "  ❌ 未找到hreflang标签"
        # 调试：显示所有link标签
        echo "  调试 - 所有link标签:"
        echo "$page_content" | grep -o '<link[^>]*>' | head -5 | while read -r tag; do
            echo "    $tag"
        done
    fi
    
    # 提取canonical标签
    canonical=$(echo "$page_content" | grep -o '<link[^>]*rel="canonical"[^>]*href="[^"]*"[^>]*>' | sed 's/.*href="\([^"]*\)".*/\1/')
    echo "Canonical URL: $canonical"
    
    # 检查meta标签
    title=$(echo "$page_content" | grep -o '<title[^>]*>[^<]*</title>' | sed 's/<title[^>]*>\(.*\)<\/title>/\1/')
    echo "页面标题: $title"
    
    description=$(echo "$page_content" | grep -o '<meta[^>]*name="description"[^>]*content="[^"]*"[^>]*>' | sed 's/.*content="\([^"]*\)".*/\1/')
    echo "页面描述: $description"
    
    echo "✅ 页面测试完成"
}

# 执行测试
for i in "${!test_urls[@]}"; do
    test_page "${test_names[$i]}" "${test_urls[$i]}"
    sleep 1  # 避免请求过于频繁
done

echo ""
echo "=========================================="
echo "生产环境 hreflang 标签测试完成"
echo "=========================================="

# 额外验证：检查hreflang双向关联
echo ""
echo "=== 验证hreflang双向关联 ==="

check_bidirectional() {
    local en_url="$1"
    local es_url="$2"
    local page_type="$3"
    
    echo ""
    echo "检查 $page_type 页面双向关联:"
    echo "英语页面: $en_url"
    echo "西班牙语页面: $es_url"
    
    # 检查英语页面是否指向西班牙语页面
    en_content=$(curl -s "$en_url")
    en_to_es=$(echo "$en_content" | grep -i 'hreflang="es"' | sed -n 's/.*href="\([^"]*\)".*/\1/p' | head -1)
    
    # 检查西班牙语页面是否指向英语页面  
    es_content=$(curl -s "$es_url")
    es_to_en=$(echo "$es_content" | grep -i 'hreflang="en"' | sed -n 's/.*href="\([^"]*\)".*/\1/p' | head -1)
    
    echo "英语页面指向西班牙语: $en_to_es"
    echo "西班牙语页面指向英语: $es_to_en"
    
    # 验证双向关联
    if [[ -n "$en_to_es" && -n "$es_to_en" ]]; then
        echo "✅ 找到双向hreflang标签"
        # 进一步验证URL是否匹配
        if [[ "$en_to_es" == *"/es"* && "$es_to_en" == *"/en"* ]]; then
            echo "✅ URL结构正确"
        else
            echo "⚠️  URL结构需要检查"
        fi
    else
        echo "❌ 双向关联存在问题"
        
        # 调试信息
        echo "调试 - 英语页面中的hreflang标签:"
        echo "$en_content" | grep -i 'hreflang' | head -3
        echo "调试 - 西班牙语页面中的hreflang标签:"
        echo "$es_content" | grep -i 'hreflang' | head -3
    fi
}

# 检查关键页面的双向关联
check_bidirectional "https://www.yhflexiblebusbar.com/en" "https://www.yhflexiblebusbar.com/es" "首页"
check_bidirectional "https://www.yhflexiblebusbar.com/en/about" "https://www.yhflexiblebusbar.com/es/about" "About"
check_bidirectional "https://www.yhflexiblebusbar.com/en/products" "https://www.yhflexiblebusbar.com/es/products" "Products"

echo ""
echo "=========================================="
echo "hreflang 双向关联验证完成"
echo "=========================================="