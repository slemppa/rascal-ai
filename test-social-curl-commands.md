# Social Endpoints HMAC Test - Curl Commands

Tämä dokumentti sisältää curl-komennot social-endpointtien testaamiseen.

## Yleiset muuttujat

```bash
export BASE_URL="http://localhost:3000"
export AUTH_TOKEN="your-token-here"  # Hae token: await supabase.auth.getSession()
```

## 1. /api/social/reels/list (GET)

Käyttää `sendToN8N()` funktiota → lähettää HMAC-headereita.

```bash
curl -X GET "${BASE_URL}/api/social/reels/list?companyId=test-company-id" \
  -H "Content-Type: application/json" \
  -v
```

**Odotettu vastaus:**
- Status: 200 (tyhjä array jos N8N workflow ei ole aktiivinen)
- Endpoint lähettää N8N:ään: `x-rascal-timestamp` ja `x-rascal-signature` headerit
- Endpoint EI lähetä: `x-api-key` headeria

## 2. /api/social/posts (GET)

Ei käytä N8N:ää, lukee suoraan Supabasesta.

```bash
curl -X GET "${BASE_URL}/api/social/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -v
```

**Odotettu vastaus:**
- Status: 200 (jos on dataa) tai 404/500 (jos ei dataa)
- Ei lähetä N8N:ään mitään

## 3. /api/social/posts/update (POST)

Käyttää `sendToN8N()` funktiota → lähettää HMAC-headereita.

```bash
curl -X POST "${BASE_URL}/api/social/posts/update" \
  -H "Content-Type: application/json" \
  -d '{
    "post_id": "test-post-id",
    "status": "published",
    "updated_at": "2024-01-01T00:00:00Z"
  }' \
  -v
```

**Odotettu vastaus:**
- Status: 200 (jos N8N workflow on aktiivinen) tai 200 (jos workflow ei ole aktiivinen)
- Endpoint lähettää N8N:ään: `x-rascal-timestamp` ja `x-rascal-signature` headerit
- Endpoint EI lähetä: `x-api-key` headeria

## 4. /api/social/posts/actions (POST)

Käyttää `sendToN8N()` funktiota → lähettää HMAC-headereita.

```bash
curl -X POST "${BASE_URL}/api/social/posts/actions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d '{
    "post_id": "test-post-id",
    "action": "publish",
    "content": "Test content",
    "post_type": "post"
  }' \
  -v
```

**Odotettu vastaus:**
- Status: 200 (jos Mixpost config löytyy) tai 400 (jos config puuttuu)
- Endpoint lähettää N8N:ään: `x-rascal-timestamp` ja `x-rascal-signature` headerit
- Endpoint EI lähetä: `x-api-key` headeria

## HMAC Headerit

Kun endpointit käyttävät `sendToN8N()` funktiota, ne lähettävät automaattisesti seuraavat headerit N8N webhookiin:

```
Content-Type: application/json
x-rascal-timestamp: 1234567890
x-rascal-signature: sha256_hmac_signature_here
```

**EI lähetetä:**
- `x-api-key` header (vanha autentikointitapa)

## Testaus skriptillä

Aja kaikki testit kerralla:

```bash
./test-social-curl.sh
```

Tai aseta token ensin:

```bash
export AUTH_TOKEN="your-token-here"
./test-social-curl.sh
```

## Tokenin haku

1. Avaa selaimen konsoli (F12)
2. Suorita: `await supabase.auth.getSession()`
3. Kopioi `access_token` arvo
4. Aseta muuttuja: `export AUTH_TOKEN="your-token-here"`

## Tarkistus: Varmista että HMAC-headereita lähetetään

Voit tarkistaa että endpointit lähettävät oikeat headerit tarkistamalla N8N workflow logit tai käyttämällä proxy-työkalua kuten mitmproxy.

**Huom:** Endpointit lähettävät HMAC-headereita N8N webhookiin, ei takaisin API-vastaukseen. API-vastaus ei sisällä näitä headereita.

