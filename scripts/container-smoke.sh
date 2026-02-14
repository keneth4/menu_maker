#!/usr/bin/env bash
set -euo pipefail

APP_PORT="${APP_PORT:-5173}"
SMOKE_PROJECT="${SMOKE_PROJECT:-container-smoke}"
BASE_URL="http://127.0.0.1:${APP_PORT}"
COMPOSE_BIN="${COMPOSE_BIN:-docker compose}"
# Empty E2E_GREP means "run full suite".
E2E_GREP="${E2E_GREP-}"
APP_IMAGE="${APP_IMAGE:-newproject-app}"
ALLOW_CONTAINER_BUILD="${ALLOW_CONTAINER_BUILD:-0}"
PLAYWRIGHT_VERSION="$(
  node -p "require('./node_modules/@playwright/test/package.json').version" 2>/dev/null || true
)"
if [ -z "${PLAYWRIGHT_VERSION}" ]; then
  PLAYWRIGHT_VERSION="1.58.1"
fi
PLAYWRIGHT_DOCKER_TAG="${PLAYWRIGHT_DOCKER_TAG:-v${PLAYWRIGHT_VERSION}-jammy}"
PLAYWRIGHT_IMAGE="mcr.microsoft.com/playwright:${PLAYWRIGHT_DOCKER_TAG}"

cleanup() {
  ${COMPOSE_BIN} down >/dev/null 2>&1 || true
}
trap cleanup EXIT

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required for containerized smoke checks."
  exit 1
fi

if [ "${ALLOW_CONTAINER_BUILD}" != "1" ] && ! docker image inspect "${APP_IMAGE}" >/dev/null 2>&1; then
  echo "Container image '${APP_IMAGE}' is not available locally."
  echo "Set ALLOW_CONTAINER_BUILD=1 to allow build/pull during smoke checks."
  exit 1
fi
if [ "${ALLOW_CONTAINER_BUILD}" != "1" ] && ! docker image inspect "${PLAYWRIGHT_IMAGE}" >/dev/null 2>&1; then
  echo "Playwright image '${PLAYWRIGHT_IMAGE}' is not available locally."
  echo "Set ALLOW_CONTAINER_BUILD=1 to allow image pull during smoke checks."
  exit 1
fi

echo "Starting containerized dev app..."
if [ "${ALLOW_CONTAINER_BUILD}" = "1" ]; then
  ${COMPOSE_BIN} up -d --build app
else
  ${COMPOSE_BIN} up -d --no-build app
fi

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

if [ -n "${E2E_GREP}" ]; then
  echo "Running Playwright container gate with grep: ${E2E_GREP}"
else
  echo "Running full Playwright container gate..."
fi
PLAYWRIGHT_DOCKER_TAG="${PLAYWRIGHT_DOCKER_TAG}" E2E_GREP="${E2E_GREP}" \
${COMPOSE_BIN} --profile e2e run --rm e2e

echo "Container smoke checks passed."
