#!/usr/bin/env bash
#
# Live smoke test for the basic e-commerce flow:
#   register -> login -> GET /products -> GET /products/:id
#
# Prerequisites:
#   - Backend listening (default http://localhost:3000/api/v1)
#   - Sample data seeded: npm --prefix backend run seed:sample
#   - curl and jq installed
#
# Usage:
#   bash backend/scripts/smoke-basic-flow.sh
#   API_BASE_URL=http://localhost:3000/api/v1 bash backend/scripts/smoke-basic-flow.sh
#
# The script never hardcodes secrets: a throwaway account is generated per run
# (override with SMOKE_EMAIL / SMOKE_PASSWORD if needed).

set -uo pipefail

BASE_URL="${API_BASE_URL:-http://localhost:3000/api/v1}"
RUN_ID="$(date +%s)-$$"
EMAIL="${SMOKE_EMAIL:-smoke-${RUN_ID}@example.com}"
PASSWORD="${SMOKE_PASSWORD:-Smoke-${RUN_ID}-pass}"

failures=0

pass() { printf 'PASS  %s\n' "$1"; }
fail() { printf 'FAIL  %s\n' "$1"; failures=$((failures + 1)); }
skip() { printf 'SKIP  %s\n' "$1"; }

require_tool() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Missing required tool: %s\n' "$1" >&2
    exit 2
  fi
}

# Fires a curl request and prints "<body>\n<http_code>".
request() {
  local method="$1" path="$2" body="${3:-}"
  local args=(-sS --connect-timeout 5 --max-time 30 -w $'\n%{http_code}' -X "$method" "${BASE_URL}${path}" -H 'Accept: application/json')
  if [ -n "$body" ]; then
    args+=(-H 'Content-Type: application/json' -d "$body")
  fi
  curl "${args[@]}"
}

# Splits the "<body>\n<http_code>" payload into HTTP_BODY / HTTP_CODE.
split_response() {
  HTTP_CODE="${1##*$'\n'}"
  HTTP_BODY="${1%$'\n'*}"
}

is_success() {
  printf '%s' "$1" | jq -e '.success == true' >/dev/null 2>&1
}

finish() {
  printf '\n'
  if [ "$failures" -eq 0 ]; then
    printf 'SMOKE RESULT: PASS\n'
    exit 0
  fi
  printf 'SMOKE RESULT: FAIL (%d step(s) failed)\n' "$failures" >&2
  exit 1
}

require_tool curl
require_tool jq

printf 'Smoke base URL: %s\n' "$BASE_URL"

# 1) Register a throwaway customer.
printf '\n1) POST /auth/register\n'
reg_body="$(jq -cn --arg email "$EMAIL" --arg password "$PASSWORD" \
  '{email: $email, password: $password, fullName: "Smoke User"}')"
split_response "$(request POST /auth/register "$reg_body")"
if [ "$HTTP_CODE" != "201" ]; then
  fail "register expected 201, got ${HTTP_CODE}: ${HTTP_BODY}"
  skip 'login, products (register failed)'
  finish
fi
pass 'register -> 201'
if printf '%s' "$HTTP_BODY" | grep -qi 'password'; then
  fail 'register response leaks a password field'
else
  pass 'register response has no password field'
fi

# 2) Login and capture the access token.
printf '\n2) POST /auth/login\n'
login_body="$(jq -cn --arg email "$EMAIL" --arg password "$PASSWORD" \
  '{email: $email, password: $password}')"
split_response "$(request POST /auth/login "$login_body")"
if [ "$HTTP_CODE" != "200" ] || ! is_success "$HTTP_BODY"; then
  fail "login expected 200 success, got ${HTTP_CODE}: ${HTTP_BODY}"
  skip 'products, product detail (login failed)'
  finish
fi
ACCESS_TOKEN="$(printf '%s' "$HTTP_BODY" | jq -r '.data.accessToken // empty')"
if [ -z "$ACCESS_TOKEN" ]; then
  fail 'login response is missing data.accessToken'
  skip 'products, product detail (no token)'
  finish
fi
pass 'login -> 200 with accessToken'

# 3) Browse products (public) and pick the first one.
printf '\n3) GET /products\n'
split_response "$(request GET '/products')"
if [ "$HTTP_CODE" != "200" ] || ! is_success "$HTTP_BODY"; then
  fail "products expected 200 success, got ${HTTP_CODE}: ${HTTP_BODY}"
  skip 'product detail (list failed)'
  finish
fi
PRODUCT_COUNT="$(printf '%s' "$HTTP_BODY" | jq '.data.items | length')"
if [ "$PRODUCT_COUNT" -lt 1 ]; then
  fail "products list is empty — run 'npm --prefix backend run seed:sample'"
  skip 'product detail (no product to fetch)'
  finish
fi
FIRST_ID="$(printf '%s' "$HTTP_BODY" | jq -r '.data.items[0].id')"
pass "products -> 200 (${PRODUCT_COUNT} item(s), first id ${FIRST_ID})"

# 4) Fetch the product detail (public).
printf '\n4) GET /products/%s\n' "$FIRST_ID"
split_response "$(request GET "/products/${FIRST_ID}")"
if [ "$HTTP_CODE" != "200" ] || ! is_success "$HTTP_BODY"; then
  fail "product detail expected 200 success, got ${HTTP_CODE}: ${HTTP_BODY}"
  finish
fi
if [ "$(printf '%s' "$HTTP_BODY" | jq -r '.data.id')" != "$FIRST_ID" ]; then
  fail 'product detail returned a different id than requested'
  finish
fi
pass 'product detail -> 200 with matching id'

finish
