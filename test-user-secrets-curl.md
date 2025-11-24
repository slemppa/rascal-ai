# Testikutsut user-secrets API:lle

## 1. Tallenna WordPress API-avain

```bash
curl -X POST "http://localhost:5173/api/user-secrets" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
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
```

## 2. Hae salaisuudet (metadata)

```bash
curl -X GET "http://localhost:5173/api/user-secrets" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

## 3. Hae purettu API-avain (service-to-service)

```bash
curl -X GET "http://localhost:5173/api/user-secrets-service?secret_type=wordpress_api_key&secret_name=WordPress%20REST%20API%20Key&user_id=e10f32ee-fe2c-4613-aae9-fdda731fbdc9" \
  -H "x-api-key: YOUR_N8N_SECRET_KEY" \
  -H "Content-Type: application/json"
```

