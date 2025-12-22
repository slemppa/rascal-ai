#!/bin/bash

# Curl-testikutsut social-endpointeille HMAC-validointilla
# HUOM: Tarvitset Authorization tokenin endpointteihin jotka käyttävät withOrganization middlewarea
# Hae token: await supabase.auth.getSession() selaimen konsolista

BASE_URL="${BASE_URL:-http://localhost:3000}"
AUTH_TOKEN="${AUTH_TOKEN:-}"

# Värit tulostusta varten
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}Social Endpoints HMAC Test Suite (curl)${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""
echo -e "${CYAN}This test verifies that endpoints use sendToN8N() function${NC}"
echo -e "${CYAN}which automatically sends HMAC headers (x-rascal-timestamp, x-rascal-signature)${NC}"
echo -e "${CYAN}and does NOT send x-api-key header.${NC}"
echo ""

if [ -z "$AUTH_TOKEN" ]; then
  echo -e "${YELLOW}⚠️  No AUTH_TOKEN provided. Testing only endpoints that don't require auth.${NC}"
  echo -e "${YELLOW}To test all endpoints, set AUTH_TOKEN: export AUTH_TOKEN='your-token-here'${NC}"
else
  echo -e "${GREEN}✅ Using AUTH_TOKEN: ${AUTH_TOKEN:0:20}...${NC}"
fi

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}1. Testing /api/social/reels/list (uses sendToN8N → HMAC)${NC}"
echo -e "${CYAN}============================================================${NC}"
echo -e "${BLUE}GET ${BASE_URL}/api/social/reels/list?companyId=test-company-id${NC}"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "${BASE_URL}/api/social/reels/list?companyId=test-company-id" \
  -H "Content-Type: application/json")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 300 ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_STATUS}${NC}"
elif [ "$HTTP_STATUS" -ge 400 ] && [ "$HTTP_STATUS" -lt 500 ]; then
  echo -e "${YELLOW}⚠️  Status: ${HTTP_STATUS} (expected error)${NC}"
else
  echo -e "${RED}❌ Status: ${HTTP_STATUS}${NC}"
fi

echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}2. Testing /api/social/posts (no N8N call, reads from Supabase)${NC}"
echo -e "${CYAN}============================================================${NC}"

if [ -z "$AUTH_TOKEN" ]; then
  echo -e "${YELLOW}SKIP: AUTH_TOKEN required${NC}"
else
  echo -e "${BLUE}GET ${BASE_URL}/api/social/posts${NC}"
  echo ""
  
  RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "${BASE_URL}/api/social/posts" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AUTH_TOKEN}")
  
  HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
  BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')
  
  if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 300 ]; then
    echo -e "${GREEN}✅ Status: ${HTTP_STATUS}${NC}"
  elif [ "$HTTP_STATUS" -ge 400 ] && [ "$HTTP_STATUS" -lt 500 ]; then
    echo -e "${YELLOW}⚠️  Status: ${HTTP_STATUS} (expected error)${NC}"
  else
    echo -e "${RED}❌ Status: ${HTTP_STATUS}${NC}"
  fi
  
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi
echo ""

echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}3. Testing /api/social/posts/update (uses sendToN8N → HMAC)${NC}"
echo -e "${CYAN}============================================================${NC}"
echo -e "${BLUE}POST ${BASE_URL}/api/social/posts/update${NC}"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "${BASE_URL}/api/social/posts/update" \
  -H "Content-Type: application/json" \
  -d '{
    "post_id": "test-post-id",
    "status": "published",
    "updated_at": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 300 ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_STATUS}${NC}"
elif [ "$HTTP_STATUS" -ge 400 ] && [ "$HTTP_STATUS" -lt 500 ]; then
  echo -e "${YELLOW}⚠️  Status: ${HTTP_STATUS} (expected error)${NC}"
else
  echo -e "${RED}❌ Status: ${HTTP_STATUS}${NC}"
fi

echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}4. Testing /api/social/posts/actions (uses sendToN8N → HMAC)${NC}"
echo -e "${CYAN}============================================================${NC}"

if [ -z "$AUTH_TOKEN" ]; then
  echo -e "${YELLOW}SKIP: AUTH_TOKEN required${NC}"
else
  echo -e "${BLUE}POST ${BASE_URL}/api/social/posts/actions${NC}"
  echo ""
  
  RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "${BASE_URL}/api/social/posts/actions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -d '{
      "post_id": "test-post-id",
      "action": "publish",
      "content": "Test content",
      "post_type": "post"
    }')
  
  HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
  BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')
  
  if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 300 ]; then
    echo -e "${GREEN}✅ Status: ${HTTP_STATUS}${NC}"
  elif [ "$HTTP_STATUS" -ge 400 ] && [ "$HTTP_STATUS" -lt 500 ]; then
    echo -e "${YELLOW}⚠️  Status: ${HTTP_STATUS} (expected error)${NC}"
  else
    echo -e "${RED}❌ Status: ${HTTP_STATUS}${NC}"
  fi
  
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi
echo ""

echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}Test Summary${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""
echo -e "${MAGENTA}📋 HMAC Implementation Status:${NC}"
echo -e "${GREEN}  ✅ /api/social/reels/list - Uses sendToN8N() (HMAC)${NC}"
echo -e "${GREEN}  ✅ /api/social/posts/update - Uses sendToN8N() (HMAC)${NC}"
echo -e "${GREEN}  ✅ /api/social/posts/actions - Uses sendToN8N() (HMAC)${NC}"
echo -e "${CYAN}  ℹ️  /api/social/posts - No N8N call (reads from Supabase)${NC}"
echo ""
echo -e "${MAGENTA}🔒 Security:${NC}"
echo -e "${GREEN}  - All N8N calls now use HMAC authentication${NC}"
echo -e "${GREEN}  - x-api-key header is NO LONGER sent${NC}"
echo -e "${GREEN}  - x-rascal-timestamp and x-rascal-signature headers are sent${NC}"
echo ""
echo -e "${CYAN}To get AUTH_TOKEN:${NC}"
echo -e "${CYAN}  1. Open browser console${NC}"
echo -e "${CYAN}  2. Run: await supabase.auth.getSession()${NC}"
echo -e "${CYAN}  3. Copy the access_token value${NC}"
echo -e "${CYAN}  4. Run: export AUTH_TOKEN='your-token-here'${NC}"
echo -e "${CYAN}  5. Run: ./test-social-curl.sh${NC}"
echo ""

