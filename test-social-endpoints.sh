#!/bin/bash

# Testikutsut social-endpointeille
# HUOM: Tarvitset Authorization tokenin endpointteihin jotka käyttävät withOrganization middlewarea
# Hae token: await supabase.auth.getSession() selaimen konsolista

BASE_URL="http://localhost:3000"
# Vaihda tämä token oikealla tokenilla
AUTH_TOKEN="YOUR_TOKEN_HERE"

echo "=========================================="
echo "Testing Social Endpoints"
echo "=========================================="
echo ""

# 1. Test /api/social/reels/list (GET, ei vaadi auth tokenia)
echo "1. Testing /api/social/reels/list"
echo "----------------------------------------"
echo "GET ${BASE_URL}/api/social/reels/list?companyId=test-company-id"
echo ""
curl -X GET "${BASE_URL}/api/social/reels/list?companyId=test-company-id" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response (not JSON):"
echo ""
echo ""

# 2. Test /api/social/posts (GET, vaatii auth tokenin)
echo "2. Testing /api/social/posts"
echo "----------------------------------------"
echo "GET ${BASE_URL}/api/social/posts"
echo ""
if [ "$AUTH_TOKEN" != "YOUR_TOKEN_HERE" ]; then
  curl -X GET "${BASE_URL}/api/social/posts" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -w "\nHTTP Status: %{http_code}\n" \
    -s | jq '.' 2>/dev/null || echo "Response (not JSON):"
else
  echo "SKIP: AUTH_TOKEN not set. Set AUTH_TOKEN variable to test this endpoint."
fi
echo ""
echo ""

# 3. Test /api/social/posts/update (POST, ei vaadi auth tokenia)
echo "3. Testing /api/social/posts/update"
echo "----------------------------------------"
echo "POST ${BASE_URL}/api/social/posts/update"
echo ""
curl -X POST "${BASE_URL}/api/social/posts/update" \
  -H "Content-Type: application/json" \
  -d '{
    "post_id": "test-post-id",
    "status": "published",
    "updated_at": "2024-01-01T00:00:00Z"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response (not JSON):"
echo ""
echo ""

# 4. Test /api/social/posts/actions (POST, vaatii auth tokenin)
echo "4. Testing /api/social/posts/actions"
echo "----------------------------------------"
echo "POST ${BASE_URL}/api/social/posts/actions"
echo ""
if [ "$AUTH_TOKEN" != "YOUR_TOKEN_HERE" ]; then
  curl -X POST "${BASE_URL}/api/social/posts/actions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -d '{
      "post_id": "test-post-id",
      "action": "publish",
      "content": "Test content",
      "post_type": "post"
    }' \
    -w "\nHTTP Status: %{http_code}\n" \
    -s | jq '.' 2>/dev/null || echo "Response (not JSON):"
else
  echo "SKIP: AUTH_TOKEN not set. Set AUTH_TOKEN variable to test this endpoint."
fi
echo ""
echo ""

echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""
echo "Endpoints that require AUTH_TOKEN:"
echo "  - /api/social/posts (GET)"
echo "  - /api/social/posts/actions (POST)"
echo ""
echo "Endpoints that don't require AUTH_TOKEN:"
echo "  - /api/social/reels/list (GET)"
echo "  - /api/social/posts/update (POST)"
echo ""
echo "To get AUTH_TOKEN:"
echo "  1. Open browser console"
echo "  2. Run: await supabase.auth.getSession()"
echo "  3. Copy the access_token value"
echo "  4. Set AUTH_TOKEN variable: export AUTH_TOKEN='your-token-here'"
echo ""

