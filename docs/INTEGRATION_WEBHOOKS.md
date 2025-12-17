# Integraatioiden Webhookit ja Automaatiot

## Yleiskuvaus

Kun käyttäjä tallentaa integraation API-avaimen (esim. WordPress), järjestelmä:
1. **Tallentaa avaimen salattuna** Supabase-tietokantaan
2. **Lähettää webhook-ilmoituksen** Maken/N8N automaatiolle
3. **Automaatio voi hakea puretun avaimen** service-to-service endpointista

## Webhook-ilmoitus

### Milloin lähetetään?

Webhook lähetetään automaattisesti, kun:
- Käyttäjä tallentaa uuden API-avaimen `/settings` → "Ominaisuudet" -välilehdellä
- Käyttäjä päivittää olemassa olevan API-avaimen

### Webhook URL

Aseta ympäristömuuttuja Verceliin:
- **Name**: `MAKE_INTEGRATION_WEBHOOK_URL` tai `N8N_INTEGRATION_WEBHOOK_URL`
- **Value**: Maken/N8N webhook URL (esim. `https://hook.eu1.make.com/xxxxx`)

### Webhook Payload

```json
{
  "action": "integration_created",
  "integration_type": "wordpress_api_key",
  "integration_name": "WordPress REST API Key",
  "user_id": "e10f32ee-fe2c-4613-aae9-fdda731fbdc9",
  "auth_user_id": "uuid-from-auth.users",
  "metadata": {
    "endpoint": "https://example.com",
    "description": "WordPress integraatio"
  },
  "secret_id": "uuid-of-stored-secret",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "get_secret_url": "https://your-api-domain.com/api/user-secrets-service",
  "instructions": "Hae purettu API-avain GET-pyynnöllä: ..."
}
```

**HUOM**: Webhookissa **EI** lähetetä purettua API-avainta turvallisuussyistä!

## API-avaimen hakeminen Maken automaatiosta

### Endpoint

```
GET /api/user-secrets-service (tai /api/users/secrets-service)
```

### Query Parametrit

- `secret_type` (pakollinen): esim. `wordpress_api_key`
- `secret_name` (pakollinen): esim. `WordPress REST API Key`
- `user_id` (pakollinen): käyttäjän/organisaation ID (public.users.id)

### Headerit

- `x-api-key` (pakollinen): `N8N_SECRET_KEY` tai `MAKE_WEBHOOK_SECRET` -arvo

### Esimerkki-kutsu

```bash
curl -X GET "https://your-api-domain.com/api/user-secrets-service?secret_type=wordpress_api_key&secret_name=WordPress%20REST%20API%20Key&user_id=e10f32ee-fe2c-4613-aae9-fdda731fbdc9" \
  -H "x-api-key: YOUR_N8N_SECRET_KEY"
```

### Vastaus

```json
{
  "success": true,
  "secret_type": "wordpress_api_key",
  "secret_name": "WordPress REST API Key",
  "user_id": "e10f32ee-fe2c-4613-aae9-fdda731fbdc9",
  "value": "wp_xxxxxxxxxxxxxxxxxxxx",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## Maken Automaation Workflow

### 1. Webhook Trigger

Kun API-avain tallennetaan, Maken webhook vastaanottaa:

```json
{
  "action": "integration_created",
  "integration_type": "wordpress_api_key",
  "user_id": "e10f32ee-fe2c-4613-aae9-fdda731fbdc9",
  "metadata": {
    "endpoint": "https://example.com"
  }
}
```

### 2. Hae purettu API-avain

Maken HTTP-moduulissa:

- **Method**: GET
- **URL**: `{{webhook.body.get_secret_url}}?secret_type={{webhook.body.integration_type}}&secret_name={{webhook.body.integration_name}}&user_id={{webhook.body.user_id}}`
- **Headers**:
  - `x-api-key`: `YOUR_N8N_SECRET_KEY` (tallennettu Maken Credentials-osiossa)

### 3. Käytä API-avainta

Purettu API-avain on vastauksessa:
```json
{
  "value": "wp_xxxxxxxxxxxxxxxxxxxx"
}
```

Voit käyttää tätä arvoa WordPress REST API -kutsuissa.

### 4. Esimerkki: Testaa WordPress-yhteys

```javascript
// Maken Code-moduuli
const wpApiKey = steps.http_response.body.value;
const wpEndpoint = steps.webhook.body.metadata.endpoint;

const response = await fetch(`${wpEndpoint}/wp-json/wp/v2/posts`, {
  headers: {
    'Authorization': `Basic ${btoa(wpApiKey + ':')}`,
    'Content-Type': 'application/json'
  }
});

return { success: response.ok, data: await response.json() };
```

## Turvallisuus

- ✅ **API-avain salataan Node.js-kerroksessa** AES-256-GCM:llä ennen tallennusta
- ✅ **Salausavain ei kulje tietokantaan** - `USER_SECRETS_ENCRYPTION_KEY` pysyy vain palvelinmuistissa
- ✅ **Webhookissa ei lähetetä purettua avainta**
- ✅ **Service-to-service endpoint** suojattu `N8N_SECRET_KEY`:llä
- ✅ **RLS-policyt** estävät käyttäjiä näkemästä toistensa avaimia
- ✅ **Taaksepäin yhteensopivuus** - vanhat pgcrypto-salatut tietueet tuetaan automaattisesti

## Ympäristömuuttujat

Aseta Verceliin:

1. **`USER_SECRETS_ENCRYPTION_KEY`** - Salausavain (pakollinen)
2. **`MAKE_INTEGRATION_WEBHOOK_URL`** - Maken webhook URL (vapaaehtoinen)
3. **`N8N_INTEGRATION_WEBHOOK_URL`** - N8N webhook URL (vapaaehtoinen)
4. **`N8N_SECRET_KEY`** - Service key automaatioiden käyttöön (pakollinen service-endpointille)
5. **`MAKE_WEBHOOK_SECRET`** - Vaihtoehtoinen service key (vapaaehtoinen)

## Vianetsintä

### Webhook ei mene läpi?

1. Tarkista että `MAKE_INTEGRATION_WEBHOOK_URL` on asetettu
2. Tarkista että `N8N_SECRET_KEY` on oikein (jos käytät `x-api-key` headeria)
3. Tarkista Maken/N8N workflowin lokit

### API-avainta ei voi hakea?

1. Tarkista että `x-api-key` header on oikein
2. Tarkista että `secret_type`, `secret_name` ja `user_id` ovat oikein
3. Tarkista että salaisuus on aktiivinen (`is_active = true`)
4. Tarkista että `USER_SECRETS_ENCRYPTION_KEY` on asetettu

## Tulevaisuudessa

- [ ] Audit-lokitusta API-avaimien käytöstä
- [ ] Webhook retry-logiikka
- [ ] API-avaimen rotaation tuki
- [ ] Automaattinen automaation luominen Maken/N8N:ssä

