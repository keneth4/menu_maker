#!/usr/bin/env bash
set -euo pipefail

REQUIRED_MAJOR=18
REQUIRED_MINOR=19
TEST_GREP="${TEST_GREP:-performance smoke keeps startup and modal interaction responsive}"

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

run_local_perf_gate() {
  if ! supports_local_playwright; then
    local current
    current="$(node -p "process.versions.node" 2>/dev/null || echo "unknown")"
    echo "Local Node.js ${current} is below ${REQUIRED_MAJOR}.${REQUIRED_MINOR} for Playwright ESM loading."
    return 1
  fi

  echo "Running local Playwright export budget check..."
  npm run test:e2e:local -- --grep "${TEST_GREP}"
}

if command -v docker >/dev/null 2>&1; then
  echo "Running containerized perf gate (container-first)..."
  set +e
  ALLOW_CONTAINER_BUILD="${ALLOW_CONTAINER_BUILD-1}" \
  E2E_GREP="${TEST_GREP}" \
  ./scripts/container-smoke.sh
  CONTAINER_EXIT=$?
  set -e
  if [ "${CONTAINER_EXIT}" -eq 0 ]; then
    exit 0
  fi
  echo "Containerized perf gate failed (exit ${CONTAINER_EXIT}). Falling back to local Playwright..."
fi

run_local_perf_gate
