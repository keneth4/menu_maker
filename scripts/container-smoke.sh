#!/usr/bin/env bash
set -euo pipefail

APP_PORT="${APP_PORT:-5173}"
SMOKE_PROJECT="${SMOKE_PROJECT:-container-smoke}"
BASE_URL="http://127.0.0.1:${APP_PORT}"
COMPOSE_BIN="${COMPOSE_BIN:-docker compose}"
PLAYWRIGHT_VERSION="$(
  node -p "require('./node_modules/@playwright/test/package.json').version" 2>/dev/null || true
)"
if [ -z "${PLAYWRIGHT_VERSION}" ]; then
  PLAYWRIGHT_VERSION="1.58.1"
fi
PLAYWRIGHT_DOCKER_TAG="${PLAYWRIGHT_DOCKER_TAG:-v${PLAYWRIGHT_VERSION}-jammy}"

cleanup() {
  ${COMPOSE_BIN} down >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Starting containerized dev app..."
${COMPOSE_BIN} up -d --build app

echo "Waiting for bridge endpoint..."
ready=0
for _ in $(seq 1 90); do
  if curl -fsS "${BASE_URL}/api/assets/ping?project=${SMOKE_PROJECT}" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
if [ "${ready}" -ne 1 ]; then
  echo "Bridge endpoint did not become ready in time."
  ${COMPOSE_BIN} logs --tail=100 app || true
  exit 1
fi
curl -fsS "${BASE_URL}/api/assets/ping?project=${SMOKE_PROJECT}" | grep -q '"ok":true'

echo "Running bridge smoke checks..."
curl -fsS \
  -X POST \
  -H "Content-Type: application/json" \
  "${BASE_URL}/api/assets/upload?project=${SMOKE_PROJECT}" \
  -d '{"path":"smoke","name":"ping.txt","data":"data:text/plain;base64,cGluZw=="}' >/dev/null

curl -fsS "${BASE_URL}/api/assets/list?project=${SMOKE_PROJECT}" | grep -q "smoke/ping.txt"
curl -fsS "${BASE_URL}/api/assets/file?project=${SMOKE_PROJECT}&path=smoke/ping.txt" | grep -q "^ping$"

echo "Running export flow smoke check in Playwright container..."
PLAYWRIGHT_DOCKER_TAG="${PLAYWRIGHT_DOCKER_TAG}" \
${COMPOSE_BIN} --profile e2e run --rm e2e

echo "Container smoke checks passed."
