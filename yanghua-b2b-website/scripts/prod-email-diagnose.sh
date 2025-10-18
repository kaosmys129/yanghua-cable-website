#!/usr/bin/env bash
#
# prod-email-diagnose.sh
# 用于生产域名（默认 https://www.yhflexiblebusbar.com）上定位 /api/email/send 的 500 错误来源，
# 并通过正负向用例验证 CSRF、防止 500 的错误分类是否生效（期望返回 200 或 503 带明确 code）。
#
# 使用：
#   bash scripts/prod-email-diagnose.sh [生产域名]
# 例如：
#   bash scripts/prod-email-diagnose.sh https://www.yhflexiblebusbar.com
#
set -euo pipefail

DOMAIN=${1:-"https://www.yhflexiblebusbar.com"}
BASE_PATH="$(cd "$(dirname "$0")" && pwd)"
WORK_DIR="$BASE_PATH/diagnostics"
mkdir -p "$WORK_DIR"
TS="$(date '+%Y-%m-%d_%H-%M-%S')"
HEADERS_FILE="$WORK_DIR/headers_$TS.txt"
COOKIE_JAR="$WORK_DIR/jar_$TS.txt"
REPORT_FILE="$WORK_DIR/prod-email-diagnose_$TS.md"

log() {
  echo "[prod-email-diagnose] $*" | tee -a "$REPORT_FILE"
}

section() {
  echo "\n=== $* ===" | tee -a "$REPORT_FILE"
}

json_pretty() {
  local FILE="$1";
  # 如果文件首字符是 { 或 [，再尝试 jq
  local FIRST_CHAR
  FIRST_CHAR=$(head -c 1 "$FILE" 2>/dev/null || echo "")
  if [[ "$FIRST_CHAR" == "{" || "$FIRST_CHAR" == "[" ]]; then
    if command -v jq >/dev/null 2>&1; then
      jq . "$FILE" || cat "$FILE"
    else
      cat "$FILE"
    fi
  else
    cat "$FILE"
  fi
}

fetch_csrf() {
  section "获取 CSRF cookie（尝试多个页面路径）"
  local paths=("/" "/en" "/es" "/zh" "/contact" "/products")
  local TOKEN=""
  : > "$HEADERS_FILE"; : > "$COOKIE_JAR"

  local UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
  local ACCEPT="text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  local LANG="en-US,en;q=0.9"

  for p in "${paths[@]}"; do
    log "尝试路径: $DOMAIN$p"
    curl -s -L -D "$HEADERS_FILE" -c "$COOKIE_JAR" \
      -H "User-Agent: $UA" -H "Accept: $ACCEPT" -H "Accept-Language: $LANG" \
      "$DOMAIN$p" >/dev/null || true
    TOKEN="$(awk '$6=="csrf-token"{print $7}' "$COOKIE_JAR" | head -n 1)"
    if [[ -z "$TOKEN" ]]; then
      TOKEN=$(grep -i "Set-Cookie: csrf-token=" "$HEADERS_FILE" | sed -E 's/.*csrf-token=([^;]+).*/\1/' | head -n 1 || true)
    fi
    if [[ -n "$TOKEN" ]]; then
      break
    fi
  done

  if [[ -z "$TOKEN" ]]; then
    log "未能从 $DOMAIN 获取到 CSRF token。请检查："
    log "- 访问使用的是 https（Secure Cookie 只在 https 下发）"
    log "- 尝试在浏览器访问首页与联系页，确认是否设置了 csrf-token cookie"
    log "- 如站点仅在特定页面下发 CSRF，请把该路径加入脚本 paths 数组"
    exit 1
  fi
  echo "$TOKEN" > "$WORK_DIR/csrf_token_$TS.txt"
  log "CSRF_TOKEN=$TOKEN"
}

post_with_opts() {
  # 参数：名称 文件名 JSON字符串 是否携带CSRF(Y/N)
  local NAME="$1"; shift
  local OUT_FILE="$1"; shift
  local PAYLOAD="$1"; shift
  local WITH_CSRF="$1"; shift

  section "$NAME"
  log "请求: $DOMAIN/api/email/send"
  log "载荷: $PAYLOAD"

  local HTTP_CODE=""
  local ORIGIN="$DOMAIN"
  local REFERER="$DOMAIN/en"
  if [[ "$WITH_CSRF" == "Y" ]]; then
    # 从 cookie jar 直接读取最新 csrf-token，确保与 Cookie 中一致
    local CSRF_HDR
    CSRF_HDR=$(awk '$6=="csrf-token"{print $7}' "$COOKIE_JAR" | tail -n 1)
    # URL 解码 CSRF token（处理 %3D 等编码字符）
    if command -v python3 >/dev/null 2>&1; then
      CSRF_HDR=$(python3 -c "import urllib.parse; print(urllib.parse.unquote('$CSRF_HDR'))")
    fi
    HTTP_CODE=$(curl -s -o "$OUT_FILE" -w "%{http_code}" -b "$COOKIE_JAR" \
      -H "X-CSRF-Token: $CSRF_HDR" \
      -H "Origin: $ORIGIN" -H "Referer: $REFERER" \
      -H "Content-Type: application/json" \
      -d "$PAYLOAD" \
      "$DOMAIN/api/email/send")
  else
    HTTP_CODE=$(curl -s -o "$OUT_FILE" -w "%{http_code}" \
      -H "Origin: $ORIGIN" -H "Referer: $REFERER" \
      -H "Content-Type: application/json" \
      -d "$PAYLOAD" \
      "$DOMAIN/api/email/send")
  fi

  log "HTTP_CODE=$HTTP_CODE"
  log "响应体："
  json_pretty "$OUT_FILE" | tee -a "$REPORT_FILE"

  # 简单提取 key 信息（优先 jq）
  local SUCCESS="" ERROR="" CODE="" MESSAGE_ID=""
  if command -v jq >/dev/null 2>&1; then
    SUCCESS=$(jq -r '.success // empty' "$OUT_FILE" 2>/dev/null || echo "")
    ERROR=$(jq -r '.error // empty' "$OUT_FILE" 2>/dev/null || echo "")
    CODE=$(jq -r '.code // empty' "$OUT_FILE" 2>/dev/null || echo "")
    MESSAGE_ID=$(jq -r '.messageId // empty' "$OUT_FILE" 2>/dev/null || echo "")
  else
    SUCCESS=$(grep -o '"success":[^,}]\+' "$OUT_FILE" | head -n 1 | sed -E 's/.*:(.*)/\1/' | tr -d '"')
    ERROR=$(grep -o '"error":"[^"]*"' "$OUT_FILE" | head -n 1 | sed -E 's/"error":"(.*)"/\1/')
    CODE=$(grep -o '"code":"[^"]*"' "$OUT_FILE" | head -n 1 | sed -E 's/"code":"(.*)"/\1/')
    MESSAGE_ID=$(grep -o '"messageId":"[^"]*"' "$OUT_FILE" | head -n 1 | sed -E 's/"messageId":"(.*)"/\1/')
  fi

  log "解析：success=$SUCCESS, code=$CODE, error=$ERROR, messageId=$MESSAGE_ID"

  # 结果判定与建议
  if [[ "$HTTP_CODE" == "200" ]]; then
    log "结论：成功（200）。邮件已发送或记录成功。"
  elif [[ "$HTTP_CODE" == "403" ]]; then
    log "结论：403。可能未携带 CSRF 或 CSRF 校验失败。"
  elif [[ "$HTTP_CODE" == "503" ]]; then
    log "结论：503。邮件服务不可用。分类码：$CODE。建议："
    log "- 若 code=SMTP_CONNECTION_FAILED：检查 SMTP_HOST、端口与 secure 是否匹配（587/false 或 465/true），以及服务商是否限制云平台出口。"
    log "- 若 code=SMTP_AUTH_FAILED：检查 SMTP_USER/SMTP_PASS，是否需要应用专用密码，用户名是否为完整邮箱地址。"
    log "- 若 code=SMTP_CONFIG_ERROR：检查 EMAIL_FROM/CONTACT_EMAIL/INQUIRY_EMAIL 的合法性与域配置（SPF/DKIM/DMARC）。"
  elif [[ "$HTTP_CODE" == "500" ]]; then
    log "结论：500。仍为内部错误（INTERNAL_ERROR）。建议："
    log "- 重新部署最新版（我们已在路由增强错误分类以避免 500）并清空 CDN 缓存。"
    log "- 查看 Vercel Logs 中对应时间点 /api/email/send 的错误堆栈，关注 ENOTFOUND/ECONNREFUSED/Invalid login/SQLITE_READONLY 等。"
    log "- 若持续 500，考虑临时启用诊断开关（?diagnose=1）或接入事务型邮件服务（Resend/SendGrid）以绕过 SMTP 限制。"
  else
    log "结论：HTTP_CODE=$HTTP_CODE。请根据 error/code 进一步排查。"
  fi
}

main() {
  section "目标域名"
  log "$DOMAIN"

  fetch_csrf

  # 用例 1：负向（不带 CSRF，预期 403）
  local NEG_PAYLOAD='{"type":"contact","name":"Prod Test","email":"sender@yourdomain.com","company":"Test Co","country":"China","subject":"General","message":"Negative CSRF test","locale":"en"}'
  post_with_opts "用例1：不带 CSRF 的联系表单（预期 403）" "$WORK_DIR/resp_neg_$TS.json" "$NEG_PAYLOAD" "N"

  # 用例 2：正向（带 CSRF，联系表单）
  local POS_CONTACT_PAYLOAD='{"type":"contact","name":"Prod Test","email":"sender@yourdomain.com","company":"Test Co","country":"China","subject":"General","message":"Positive contact test for SMTP diagnostics","locale":"en"}'
  post_with_opts "用例2：带 CSRF 的联系表单（预期 200 或 503）" "$WORK_DIR/resp_contact_$TS.json" "$POS_CONTACT_PAYLOAD" "Y"

  # 用例 3：正向（带 CSRF，询盘表单，高优先级）
  local POS_INQUIRY_PAYLOAD='{"type":"inquiry","name":"Prod Test","email":"sender@yourdomain.com","company":"Test Co","productInterest":"Flexible Busbar","message":"Positive inquiry test for SMTP diagnostics","locale":"en"}'
  post_with_opts "用例3：带 CSRF 的询盘表单（预期 200 或 503）" "$WORK_DIR/resp_inquiry_$TS.json" "$POS_INQUIRY_PAYLOAD" "Y"

  section "报告位置"
  log "$REPORT_FILE"

  section "后续建议"
  log "1) 若任一正向用例返回 503，请据 code 精确定位并修复 SMTP 配置。"
  log "2) 若仍返回 500，请在 Vercel 控制台按路径 /api/email/send 与时间过滤日志，将错误堆栈与 x-vercel-id 片段发我，我会给出针对性修复方案。"
  log "3) 若生产环境对 SMTP 出口受限，建议切换到事务型邮件服务（Resend/SendGrid），我可以提供接入补丁。"
}

main "$@"