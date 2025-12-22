#!/bin/bash

# Yksittäiset curl-komennot social-endpointeille
# Kopioi ja suorita haluamasi komento

BASE_URL="${BASE_URL:-http://localhost:3000}"
AUTH_TOKEN="${AUTH_TOKEN:-}"

echo "=========================================="
echo "Social Endpoints - Curl Commands"
echo "=========================================="
echo ""
echo "BASE_URL: $BASE_URL"
if [ -z "$AUTH_TOKEN" ]; then
  echo "AUTH_TOKEN: NOT SET (set with: export AUTH_TOKEN='your-token')"
else
  echo "AUTH_TOKEN: ${AUTH_TOKEN:0:20}..."
fi
echo ""
echo "=========================================="
echo ""

# 1. /api/social/reels/list
echo "1. GET /api/social/reels/list"
echo "----------------------------------------"
echo "curl -X GET \"${BASE_URL}/api/social/reels/list?companyId=test-company-id\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -v"
echo ""
echo "# Copy and run:"
echo "curl -X GET \"${BASE_URL}/api/social/reels/list?companyId=test-company-id\" -H \"Content-Type: application/json\" -v"
echo ""
echo ""

# 2. /api/social/posts
echo "2. GET /api/social/posts"
echo "----------------------------------------"
if [ -z "$AUTH_TOKEN" ]; then
  echo "# AUTH_TOKEN required - set it first:"
  echo "export AUTH_TOKEN='your-token-here'"
  echo ""
fi
echo "curl -X GET \"${BASE_URL}/api/social/posts\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer \${AUTH_TOKEN}\" \\"
echo "  -v"
echo ""
if [ -n "$AUTH_TOKEN" ]; then
  echo "# Copy and run:"
  echo "curl -X GET \"${BASE_URL}/api/social/posts\" -H \"Content-Type: application/json\" -H \"Authorization: Bearer ${AUTH_TOKEN}\" -v"
fi
echo ""
echo ""

# 3. /api/social/posts/update
echo "3. POST /api/social/posts/update"
echo "----------------------------------------"
echo "curl -X POST \"${BASE_URL}/api/social/posts/update\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{" 
echo "    \"post_id\": \"test-post-id\"," 
echo "    \"status\": \"published\"," 
echo "    \"updated_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\""
echo "  }' \\"
echo "  -v"
echo ""
echo "# Copy and run:"
echo "curl -X POST \"${BASE_URL}/api/social/posts/update\" -H \"Content-Type: application/json\" -d '{\"post_id\":\"test-post-id\",\"status\":\"published\",\"updated_at\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}' -v"
echo ""
echo ""

# 4. /api/social/posts/actions
echo "4. POST /api/social/posts/actions"
echo "----------------------------------------"
if [ -z "$AUTH_TOKEN" ]; then
  echo "# AUTH_TOKEN required - set it first:"
  echo "export AUTH_TOKEN='your-token-here'"
  echo ""
fi
echo "curl -X POST \"${BASE_URL}/api/social/posts/actions\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer \${AUTH_TOKEN}\" \\"
echo "  -d '{"
echo "    \"post_id\": \"test-post-id\","
echo "    \"action\": \"publish\","
echo "    \"content\": \"Test content\","
echo "    \"post_type\": \"post\""
echo "  }' \\"
echo "  -v"
echo ""
if [ -n "$AUTH_TOKEN" ]; then
  echo "# Copy and run:"
  echo "curl -X POST \"${BASE_URL}/api/social/posts/actions\" -H \"Content-Type: application/json\" -H \"Authorization: Bearer ${AUTH_TOKEN}\" -d '{\"post_id\":\"test-post-id\",\"action\":\"publish\",\"content\":\"Test content\",\"post_type\":\"post\"}' -v"
fi
echo ""
echo ""

echo "=========================================="
echo "HMAC Implementation"
echo "=========================================="
echo ""
echo "✅ Endpoints that use sendToN8N() (HMAC):"
echo "   - /api/social/reels/list"
echo "   - /api/social/posts/update"
echo "   - /api/social/posts/actions"
echo ""
echo "ℹ️  Endpoints that don't use N8N:"
echo "   - /api/social/posts (reads from Supabase)"
echo ""
echo "🔒 Security:"
echo "   - All N8N calls use HMAC authentication"
echo "   - Headers sent: x-rascal-timestamp, x-rascal-signature"
echo "   - Header NOT sent: x-api-key"
echo ""

