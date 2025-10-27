#!/usr/bin/env bash
set -euo pipefail

report_dir="$(dirname "$0")/../reports"
mkdir -p "$report_dir"
report_file="$report_dir/head_status_report.txt"
: > "$report_file"

echo "URL | Status | FinalURL" | tee -a "$report_file"
echo "---------------------------------------------" | tee -a "$report_file"

urls=(
  "https://www.yhflexiblebusbar.com/"
  "https://www.yhflexiblebusbar.com/es"
  "https://www.yhflexiblebusbar.com/about"
  "https://www.yhflexiblebusbar.com/es/acerca-de"
  "https://www.yhflexiblebusbar.com/solutions"
  "https://www.yhflexiblebusbar.com/es/soluciones"
  "https://www.yhflexiblebusbar.com/services"
  "https://www.yhflexiblebusbar.com/es/servicios"
  "https://www.yhflexiblebusbar.com/articles"
  "https://www.yhflexiblebusbar.com/es/articulos"
  "https://www.yhflexiblebusbar.com/solutions/new-energy"
  "https://www.yhflexiblebusbar.com/es/soluciones/new-energy"
  # Products
  "https://www.yhflexiblebusbar.com/products"
  "https://www.yhflexiblebusbar.com/es/productos"
  "https://www.yhflexiblebusbar.com/products/category/general"
  "https://www.yhflexiblebusbar.com/es/productos/categoria/general"
  "https://www.yhflexiblebusbar.com/products/flexible-busbar-2000a"
  "https://www.yhflexiblebusbar.com/es/productos/flexible-busbar-2000a"
  # Projects
  "https://www.yhflexiblebusbar.com/projects"
  "https://www.yhflexiblebusbar.com/es/proyectos"
  "https://www.yhflexiblebusbar.com/projects/1"
  "https://www.yhflexiblebusbar.com/es/proyectos/1"
  # Contact
  "https://www.yhflexiblebusbar.com/contact"
  "https://www.yhflexiblebusbar.com/es/contacto"
  "https://www.yhflexiblebusbar.com/sitemap.xml"
)

for url in "${urls[@]}"; do
  # 使用自定义UA，降低被限流概率，并增加超时时间
  status=$(curl -Is --max-time 30 -H "User-Agent: SEO-Audit/1.0" "$url" | head -n1 | awk '{print $2}') || status="ERR"
  final=$(curl -Ls -o /dev/null -H "User-Agent: SEO-Audit/1.0" -w "%{url_effective}" "$url" || echo "-")
  echo "$url | ${status:-ERR} | $final" | tee -a "$report_file"
  sleep 0.7
done

echo "\nSaved: $report_file" | tee -a "$report_file"