#!/bin/bash

echo "=== 本地环境 hreflang 标签测试 ==="
echo "测试时间: $(date)"
echo ""

# 测试页面列表
declare -a pages=(
    "http://localhost:3000/en"
    "http://localhost:3000/es" 
    "http://localhost:3000/en/about"
    "http://localhost:3000/es/about"
    "http://localhost:3000/en/products"
    "http://localhost:3000/es/products"
    "http://localhost:3000/en/contact"
    "http://localhost:3000/es/contact"
)

# 测试每个页面
for page in "${pages[@]}"; do
    echo "=== 测试页面: $page ==="
    
    # 检查页面状态
    status=$(curl -s -o /dev/null -w "%{http_code}" "$page")
    echo "HTTP状态码: $status"
    
    if [ "$status" = "200" ]; then
        # 获取页面内容并提取hreflang标签
        echo "hreflang 标签:"
        curl -s "$page" | grep -i 'hreflang' | sed 's/^[[:space:]]*/  /' || echo "  未找到hreflang标签"
        
        echo ""
        echo "canonical 标签:"
        curl -s "$page" | grep -i 'rel="canonical"' | sed 's/^[[:space:]]*/  /' || echo "  未找到canonical标签"
        
    else
        echo "页面无法访问 (状态码: $status)"
    fi
    
    echo ""
    echo "----------------------------------------"
    echo ""
done

echo "=== 测试完成 ==="
