#!/bin/bash

# Testikutsut user-secrets API:lle
# Tämä testaa tallennuksen ja hakemisen

echo "🧪 Testataan user-secrets API:a..."
echo ""

# HUOM: Vaihda nämä oikeiksi arvoiksi:
TOKEN="YOUR_TOKEN_HERE"
USER_ID="e10f32ee-fe2c-4613-aae9-fdda731fbdc9"
SERVICE_KEY="YOUR_SERVICE_KEY_HERE"

API_BASE="http://localhost:5173"

echo "1️⃣ Hakee salaisuudet (metadata)..."
curl -v -X GET "${API_BASE}/api/user-secrets" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "2️⃣ Tallentaa WordPress API-avain..."
curl -v -X POST "${API_BASE}/api/user-secrets" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "secret_type": "wordpress_api_key",
    "secret_name": "WordPress REST API Key",
    "plaintext_value": "wp_test1234567890abcdef",
    "metadata": {
      "endpoint": "https://example.com",
      "description": "Test WordPress integraatio"
    }
  }'

echo ""
echo ""
echo "3️⃣ Hakee puretun API-avaimen service-endpointista..."
curl -v -X GET "${API_BASE}/api/user-secrets-service?secret_type=wordpress_api_key&secret_name=WordPress%20REST%20API%20Key&user_id=${USER_ID}" \
  -H "x-api-key: ${SERVICE_KEY}" \
  -H "Content-Type: application/json"

echo ""
echo "✅ Testit valmiit!"
