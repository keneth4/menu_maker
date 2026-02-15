#!/usr/bin/env bash
set -euo pipefail

cleanup_stale_playwright_artifacts() {
  rm -rf test-results playwright-report
  find . -maxdepth 1 -type d \( -name "ffmpeg*" -o -name "ffmpg*" \) -exec rm -rf {} + 2>/dev/null || true
}

cleanup_stale_playwright_artifacts

if command -v docker >/dev/null 2>&1; then
  echo "Running containerized e2e gate (container-first)..."
  set +e
  ALLOW_CONTAINER_BUILD="${ALLOW_CONTAINER_BUILD-1}" \
  E2E_GREP="${E2E_GREP-}" \
  ./scripts/container-smoke.sh
  CONTAINER_EXIT=$?
  set -e
  if [ "${CONTAINER_EXIT}" -eq 0 ]; then
    exit 0
  fi
  echo "Containerized e2e gate failed (exit ${CONTAINER_EXIT}). Falling back to local Playwright..."
fi

exec npm run test:e2e:local -- ${E2E_ARGS:-}
