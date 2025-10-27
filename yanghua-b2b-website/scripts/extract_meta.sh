#!/usr/bin/env bash
set -euo pipefail

report_dir="$(dirname "$0")/../reports"
mkdir -p "$report_dir"
report_file="$report_dir/meta_tags_report.txt"
: > "$report_file"

urls=(
  "https://www.yhflexiblebusbar.com/"
  "https://www.yhflexiblebusbar.com/es"
  "https://www.yhflexiblebusbar.com/solutions"
  "https://www.yhflexiblebusbar.com/es/soluciones"
  "https://www.yhflexiblebusbar.com/solutions/new-energy"
  "https://www.yhflexiblebusbar.com/es/soluciones/new-energy"
)

for url in "${urls[@]}"; do
  echo "====================" | tee -a "$report_file"
  echo "URL: $url" | tee -a "$report_file"
  status_line=$(curl -Is --max-time 20 "$url" | head -n1)
  echo "HEAD: $status_line" | tee -a "$report_file"
  html=$(curl -sL --max-time 30 "$url")
  canonical=$(echo "$html" | grep -iE '<link[^>]+rel=["\'']canonical["\'']' | head -n1 | sed -E 's/.*href=["\'']([^"\'']+)["\''].*/\1/i')
  echo "canonical: ${canonical:-N/A}" | tee -a "$report_file"
  for lang in en es x-default; do
    href=$(echo "$html" | grep -iE "<link[^>]+rel=[\"\']alternate[\"\'][^>]+hreflang=[\"\']${lang}[\"\']" | sed -E 's/.*href=[\"\']([^\"\']+)[\"\'].*/\1/i' | head -n1)
    echo "hreflang(${lang}): ${href:-N/A}" | tee -a "$report_file"
  done
  og_url=$(echo "$html" | grep -iE '<meta[^>]+property=["\'']og:url["\'']' | sed -E 's/.*content=["\'']([^"\'']+)["\''].*/\1/i' | head -n1)
  og_locale=$(echo "$html" | grep -iE '<meta[^>]+property=["\'']og:locale["\'']' | sed -E 's/.*content=["\'']([^"\'']+)["\''].*/\1/i' | head -n1)
  echo "og:url: ${og_url:-N/A}" | tee -a "$report_file"
  echo "og:locale: ${og_locale:-N/A}" | tee -a "$report_file"
done

echo "\nSitemap check:" | tee -a "$report_file"
sm_url="https://www.yhflexiblebusbar.com/sitemap.xml"
sm_status=$(curl -Is --max-time 20 "$sm_url" | head -n1)
echo "sitemap HEAD: $sm_status" | tee -a "$report_file"
sm_xml=$(curl -sL --max-time 30 "$sm_url")
en_count=$(echo "$sm_xml" | grep -c "https://www.yhflexiblebusbar.com/en") || en_count=0
root_en_count=$(echo "$sm_xml" | grep -c "https://www.yhflexiblebusbar.com/</loc>") || root_en_count=0
echo "sitemap occurrences with /en: $en_count" | tee -a "$report_file"
echo "sitemap root entries count: $root_en_count" | tee -a "$report_file"
echo "\nSaved: $report_file" | tee -a "$report_file"