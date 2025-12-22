# Rate Limiting - Dokumentaatio

## Yleistä

Projekti käyttää [Upstash Redis](https://upstash.com/) -palvelua rate limiting -toiminnallisuuteen. Tämä estää väsytyshyökkäykset ja kontrolloi API-kustannuksia.

## Asennus ja Konfigurointi

### 1. Asenna riippuvuudet

```bash
npm install @upstash/ratelimit @upstash/redis
```

### 2. Luo Upstash Redis -instanssi

1. Mene [Upstash Console](https://console.upstash.com/)
2. Luo uusi Redis database
3. Kopioi `UPSTASH_REDIS_REST_URL` ja `UPSTASH_REDIS_REST_TOKEN`

### 3. Aseta ympäristömuuttujat

Lisää `.env.local` tai Vercel-ympäristömuuttujiin:

```bash
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

## Käyttö

### Peruskäyttö

```javascript
import { rateLimit } from '../lib/rate-limit.js'

export default async function handler(req, res) {
  // Hae identifier (IP-osoite)
  const identifier = 
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    'unknown'

  // Tarkista rate limit
  const result = await rateLimit(identifier, {
    limit: 10,      // 10 pyyntöä
    window: '1 m'   // minuutissa
  })

  if (!result.success) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((result.reset - Date.now()) / 1000)
    })
  }

  // Jatka normaalisti...
  res.status(200).json({ success: true })
}
```

### Käyttö preset-asetuksilla

```javascript
import { rateLimit, rateLimitPresets } from '../lib/rate-limit.js'

export default async function handler(req, res) {
  const identifier = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown'
  
  // Käytä AI-presettiä (20 pyyntöä minuutissa)
  const result = await rateLimit(identifier, rateLimitPresets.ai)
  
  if (!result.success) {
    return res.status(429).json({ error: 'Too many requests' })
  }
  
  // Jatka...
}
```

### Käyttö middlewarenä

```javascript
import { rateLimitMiddleware, rateLimitPresets } from '../lib/rate-limit.js'

export default async function handler(req, res) {
  // Tarkista rate limit ensin
  const middleware = rateLimitMiddleware(rateLimitPresets.auth)
  await middleware(req, res, () => {
    // Jatka handler-logiikkaa
    res.status(200).json({ success: true })
  })
}
```

## Preset-asetukset

### `rateLimitPresets.auth`
- **Limit:** 5 pyyntöä
- **Window:** 15 minuuttia
- **Käyttö:** Kirjautuminen, salasanan resetointi

### `rateLimitPresets.ai`
- **Limit:** 20 pyyntöä
- **Window:** 1 minuutti
- **Käyttö:** AI-chat, idea-generointi, muut AI-toiminnot

### `rateLimitPresets.api`
- **Limit:** 100 pyyntöä
- **Window:** 1 minuutti
- **Käyttö:** Yleiset API-kutsut

### `rateLimitPresets.upload`
- **Limit:** 10 pyyntöä
- **Window:** 1 minuutti
- **Käyttö:** Tiedostojen lataus/upload

### `rateLimitPresets.webhook`
- **Limit:** 50 pyyntöä
- **Window:** 1 minuutti
- **Käyttö:** Webhook-endpointit

## Response Headerit

Rate limiting lisää seuraavat headerit kaikkiin vastauksiin:

- `X-RateLimit-Limit`: Maksimimäärä pyyntöjä
- `X-RateLimit-Remaining`: Jäljellä olevat pyynnöt
- `X-RateLimit-Reset`: Aikaleima milloin raja nollautuu

## Error Handling

Jos rate limiting epäonnistuu (esim. Redis-yhteys katkeaa), järjestelmä toimii "fail open" -periaatteella:
- Pyyntö sallitaan
- Virhe logitetaan konsoliin
- Käyttäjä ei näe virhettä

## Suositukset

1. **Kirjautuminen:** Käytä `rateLimitPresets.auth` (5 pyyntöä / 15 min)
2. **AI-toiminnot:** Käytä `rateLimitPresets.ai` (20 pyyntöä / min)
3. **Yleiset API-kutsut:** Käytä `rateLimitPresets.api` (100 pyyntöä / min)
4. **Tiedostojen upload:** Käytä `rateLimitPresets.upload` (10 pyyntöä / min)

## Testaus

Testaa rate limitingia:

```bash
# Testaa 11 pyyntöä peräkkäin (raja: 10)
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/your-endpoint \
    -H "Content-Type: application/json"
done

# 11. pyyntö pitäisi palauttaa 429 Too Many Requests
```

## Huomioita

- Rate limiting vaatii Upstash Redis -instanssin
- Ilman ympäristömuuttujia rate limiting on poissa käytöstä (fail open)
- Identifier käyttää IP-osoitetta, mutta voit käyttää myös user ID:tä
- Rate limiting toimii Vercel Edge Functions -ympäristössä

