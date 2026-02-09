#!/usr/bin/env bash
set -euo pipefail

REQUIRED_MAJOR=18
REQUIRED_MINOR=19
TEST_GREP="save project and export static site create zip downloads"

supports_local_playwright() {
  local version
  version="$(node -p "process.versions.node" 2>/dev/null || true)"
  if [ -z "${version}" ]; then
    return 1
  fi
  local major rest minor
  major="${version%%.*}"
  rest="${version#*.}"
  minor="${rest%%.*}"
  if [ "${major}" -gt "${REQUIRED_MAJOR}" ]; then
    return 0
  fi
  if [ "${major}" -eq "${REQUIRED_MAJOR}" ] && [ "${minor}" -ge "${REQUIRED_MINOR}" ]; then
    return 0
  fi
  return 1
}

LOCAL_NODE_SUPPORTED=0
if supports_local_playwright; then
  LOCAL_NODE_SUPPORTED=1
  echo "Running local Playwright export budget check..."
  LOCAL_LOG="$(mktemp)"
  set +e
  npx playwright test --grep "${TEST_GREP}" 2>&1 | tee "${LOCAL_LOG}"
  LOCAL_EXIT=${PIPESTATUS[0]}
  set -e
  if [ "${LOCAL_EXIT}" -eq 0 ]; then
    rm -f "${LOCAL_LOG}"
    exit 0
  fi
  if grep -q "Playwright requires Node.js 18.19 or higher" "${LOCAL_LOG}"; then
    echo "Local Playwright run failed due runtime mismatch. Falling back to containerized check..."
  else
    echo "Local Playwright run failed (exit ${LOCAL_EXIT}). Falling back to containerized check..."
  fi
  rm -f "${LOCAL_LOG}"
fi

CURRENT_NODE="$(node -p "process.versions.node" 2>/dev/null || echo "unknown")"
if [ "${LOCAL_NODE_SUPPORTED}" -eq 0 ]; then
  echo "Local Node.js ${CURRENT_NODE} is below ${REQUIRED_MAJOR}.${REQUIRED_MINOR} for Playwright ESM loading."
else
  echo "Local Node.js ${CURRENT_NODE} is compatible, but local Playwright run failed."
fi
echo "Falling back to containerized perf smoke check..."

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required for fallback execution. Please install Docker or upgrade Node.js." >&2
  exit 1
fi

exec ./scripts/container-smoke.sh
