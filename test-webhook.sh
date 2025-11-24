#!/bin/bash

# Testi: Tallentaa API-avaimen ja laukaisee Make webhookin
# HUOM: Vaihda TOKEN oikeaksi arvoksi (hae selaimen Developer Tools -> Network -> Authorization headerista)

API_BASE="http://localhost:5173"
TOKEN="YOUR_TOKEN_HERE"  # Vaihda tämä oikeaksi!

echo "🧪 Testataan API-avaimen tallennusta ja Make webhookia..."
echo ""

curl -X POST "${API_BASE}/api/user-secrets" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "secret_type": "wordpress_api_key",
    "secret_name": "WordPress REST API Key",
    "plaintext_value": "wp_test_curl_123456789",
    "metadata": {
      "endpoint": "https://test.example.com",
      "description": "Test WordPress integraatio curl-kutsusta"
    }
  }' \
  -w "\n\nHTTP Status: %{http_code}\n"

echo ""
echo "✅ Jos webhook lähetettiin, näet sen Make-scenariossa!"
