#!/bin/sh
set -eu

USER_AGENT='Mozilla/5.0 Local API Check'
PROJECT_ROOT=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
DEV_LOG_PATH="${DEV_LOG_PATH:-$PROJECT_ROOT/dev.log}"
START_PORT="${START_PORT:-3010}"
PORT_CANDIDATES="${PORT:-} 3000 3001 3002 3003 3010"
BASE_URL="${BASE_URL:-}"
TEMP_SERVER_PID=""

cleanup() {
  if [ -n "$TEMP_SERVER_PID" ]; then
    kill "$TEMP_SERVER_PID" >/dev/null 2>&1 || true
    wait "$TEMP_SERVER_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

extract_base_url_from_log() {
  [ -f "$DEV_LOG_PATH" ] || return 1
  LC_ALL=C tr -d '\000' <"$DEV_LOG_PATH" \
    | sed -n 's/.*- Local:[[:space:]]*\(http:\/\/localhost:[0-9][0-9]*\).*/\1/p' \
    | tail -n 1
}

can_reach() {
  url="$1"
  curl -sSI -A "$USER_AGENT" "$url/api/health" >/dev/null 2>&1
}

wait_for_server() {
  url="$1"
  retries="${2:-60}"

  i=0
  while [ "$i" -lt "$retries" ]; do
    if can_reach "$url"; then
      return 0
    fi
    i=$((i + 1))
    sleep 1
  done

  return 1
}

resolve_base_url() {
  if [ -n "$BASE_URL" ]; then
    printf '%s\n' "$BASE_URL"
    return 0
  fi

  if [ -n "${PORT:-}" ]; then
    printf 'http://127.0.0.1:%s\n' "$PORT"
    return 0
  fi

  for port in $PORT_CANDIDATES; do
    [ -n "$port" ] || continue
    candidate="http://127.0.0.1:${port}"
    if can_reach "$candidate"; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  logged_base_url="$(extract_base_url_from_log || true)"
  if [ -n "$logged_base_url" ] && can_reach "$logged_base_url"; then
    printf '%s\n' "$logged_base_url"
    return 0
  fi

  return 1
}

start_temp_server() {
  temp_log="${TMPDIR:-/tmp}/yanghua-local-api-check.log"
  (
    cd "$PROJECT_ROOT"
    npx next dev -p "$START_PORT"
  ) >"$temp_log" 2>&1 &
  TEMP_SERVER_PID=$!
  BASE_URL="http://127.0.0.1:${START_PORT}"

  if wait_for_server "$BASE_URL" 90; then
    printf '%s\n' "$BASE_URL"
    return 0
  fi

  if grep -q 'listen EPERM' "$temp_log" 2>/dev/null; then
    echo "Temporary dev server could not bind to port ${START_PORT}. In restricted environments, start 'npm run dev' manually and rerun this check." >&2
  fi
  echo "Temporary dev server failed to start. See: $temp_log" >&2
  return 1
}

ACTIVE_BASE_URL="$(resolve_base_url || true)"
if [ -z "$ACTIVE_BASE_URL" ]; then
  echo "No running dev server detected. Starting a temporary Next dev server on port ${START_PORT}..." >&2
  ACTIVE_BASE_URL="$(start_temp_server)"
fi

echo "Using dev server on ${ACTIVE_BASE_URL}"

curl -sf -A "$USER_AGENT" "${ACTIVE_BASE_URL}/api/articles?locale=en" | node -e '
let s="";
process.stdin.on("data",d=>s+=d);
process.stdin.on("end",()=>{
  const j=JSON.parse(s);
  if(!Array.isArray(j?.data) || j.data.length < 60) {
    console.error(`articles=en invalid count: ${j?.data?.length ?? "n/a"}`);
    process.exit(1);
  }
  console.log(`articles=en count=${j.data.length} first=${j.data[0]?.slug ?? "n/a"}`);
});
'

curl -sf -A "$USER_AGENT" "${ACTIVE_BASE_URL}/api/articles?locale=es" | node -e '
let s="";
process.stdin.on("data",d=>s+=d);
process.stdin.on("end",()=>{
  const j=JSON.parse(s);
  if(!Array.isArray(j?.data) || j.data.length < 40) {
    console.error(`articles=es invalid count: ${j?.data?.length ?? "n/a"}`);
    process.exit(1);
  }
  console.log(`articles=es count=${j.data.length} first=${j.data[0]?.slug ?? "n/a"}`);
});
'

curl -sS -A "$USER_AGENT" "${ACTIVE_BASE_URL}/api/health" | node -e '
let s="";
process.stdin.on("data",d=>s+=d);
process.stdin.on("end",()=>{
  const j=JSON.parse(s);
  if(!j?.status) {
    console.error("health invalid payload");
    process.exit(1);
  }
  console.log(`health status=${j.status}`);
});
'
