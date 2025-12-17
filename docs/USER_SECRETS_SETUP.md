# Käyttäjien Salattujen Tietojen Hallinta

## Yleiskuvaus

`user_secrets`-taulu mahdollistaa käyttäjien arkaluontoisen tiedon (esim. API-avaimet, salasanat) turvallisen tallentamisen Supabase-tietokantaan. **Uudet tietueet salataan Node.js-kerroksessa AES-256-GCM -algoritmilla ennen tallennusta tietokantaan.** Vanhat pgcrypto-salatut tietueet tuetaan taaksepäin yhteensopivuuden vuoksi.

## Salausavaimen Asettaminen

**Tärkeää**: Ennen kuin voit käyttää salattujen tietojen tallennusta, sinun täytyy asettaa salausavain Vercel-ympäristömuuttujaksi.

### Vaiheet:

1. **Luo salausavain** (suositus: käytä vahvaa, satunnaista merkkijonoa)
   ```bash
   # Esimerkki: generoi vahva avain
   openssl rand -hex 32
   ```

2. **Aseta ympäristömuuttuja Vercelissä**:
   - Mene Vercel Dashboardiin
   - Valitse projekti
   - Mene Settings → Environment Variables
   - Lisää uusi muuttuja:
     - **Name**: `USER_SECRETS_ENCRYPTION_KEY`
     - **Value**: generoimasi salausavain
     - **Environment**: Production, Preview, Development (valitse tarpeen mukaan)

3. **Redeploy projekti** uuden ympäristömuuttujan voimaantuloa varten

## API-Käyttö

### Tallentaa salaisuus

```javascript
// POST /api/users/secrets
const response = await fetch('/api/users/secrets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    secret_type: 'wordpress_api_key',
    secret_name: 'WordPress REST API Key',
    plaintext_value: 'your-api-key-here',
    metadata: {
      endpoint: 'https://example.com/wp-json/wp/v2',
      description: 'Production WordPress site'
    }
  })
})
```

### Hakea salaisuudet (metadata)

```javascript
// GET /api/users/secrets
const response = await fetch('/api/users/secrets', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
const { secrets } = await response.json()
// Palauttaa listan salaisuuksista (ei purettuja arvoja)
```

### Hakea purettu salaisuus

```javascript
// GET /api/users/secrets?decrypt=true&secret_type=wordpress_api_key&secret_name=WordPress REST API Key
const response = await fetch(
  '/api/users/secrets?decrypt=true&secret_type=wordpress_api_key&secret_name=WordPress REST API Key',
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
)
const { value } = await response.json()
// Palauttaa puretun arvon
```

### Poistaa salaisuus

```javascript
// DELETE /api/users/secrets?secret_type=wordpress_api_key&secret_name=WordPress REST API Key
const response = await fetch(
  '/api/users/secrets?secret_type=wordpress_api_key&secret_name=WordPress REST API Key',
  {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
)
```

## Tietokantarakenne

### `user_secrets` taulu

| Kenttä | Tyyppi | Kuvaus |
|--------|--------|--------|
| `id` | UUID | Uniikki tunniste |
| `user_id` | UUID | Linkki `users`-tauluun |
| `secret_type` | TEXT | Salaisuuden tyyppi (esim. 'wordpress_api_key') |
| `secret_name` | TEXT | Salaisuuden nimi (esim. 'WordPress REST API Key') |
| `secret_value` | TEXT | **Node.js AES-256-GCM salattu arvo** (uusissa tietueissa, muoto: `IV:AUTH_TAG:DATA`) |
| `encrypted_value` | BYTEA | **Vanha pgcrypto-salattu arvo** (vanhoissa tietueissa, taaksepäin yhteensopivuus) |
| `metadata` | JSONB | Lisätiedot (esim. endpoint, description) |
| `is_active` | BOOLEAN | Onko salaisuus aktiivinen |
| `created_at` | TIMESTAMPTZ | Luontiaika |
| `updated_at` | TIMESTAMPTZ | Päivitysaika |
| `created_by` | UUID | Linkki `auth.users`-tauluun |

**Yksilöllisyys**: Yksi salaisuus per `(user_id, secret_type, secret_name)` kombinaatio.

## Turvallisuus

- ✅ **RLS käytössä**: Käyttäjät näkevät vain omat salaisuutensa
- ✅ **Node.js-kerroksen salaus**: Uudet arvot salataan AES-256-GCM:llä Node.js:ssä ennen tallennusta
- ✅ **Salausavain ei kulje tietokantaan**: `USER_SECRETS_ENCRYPTION_KEY` pysyy vain palvelinmuistissa
- ✅ **Puretut arvot vain backendissä**: Frontend ei koskaan näe purettuja arvoja suoraan
- ✅ **Organisaatiotuki**: Salaisuudet linkitetty organisaatioihin (`user_id` = `users.id`)
- ✅ **Taaksepäin yhteensopivuus**: Vanhat pgcrypto-salatut tietueet tuetaan automaattisesti

## Käyttötapaukset

1. **WordPress-integraatio**: Tallenna WordPress REST API -avain
2. **Muu kolmannen osapuolen API**: Tallenna API-avaimet turvallisesti
3. **Sovellussalasanoja**: Tallenna salasanat integraatioihin (HUOM: vältä käyttämästä yleisiin tarkoituksiin)

## Varoitukset

⚠️ **Tärkeää**:
- **Salausavain on kriittinen**: Jos se häviää, et voi purkaa tallennettuja salaisuuksia
- **Varmuuskopioi salausavain turvallisesti**: Älä tallenna sitä missään versionhallintaan
- **Pidä salausavain erillään**: Älä käytä samaa avainta muihin tarkoituksiin
- **Rotaatiosta**: Jos haluat vaihtaa salausavaimen, sinun täytyy purkaa kaikki salaisuudet vanhalla avaimella ja tallentaa ne uudella

## Migraatio-ohjeet

Migraatio luotiin automaattisesti: `create_user_secrets_table_with_encryption_v2`

Tarkista että migraatio onnistui:
```sql
SELECT * FROM pg_tables WHERE tablename = 'user_secrets';
```

## Tulevaisuuden parannukset

- [ ] Avainten rotaation tuki
- [ ] Salausavaimen tallennus Supabase Vaultiin
- [ ] Audit-lokitusta salaisuuksien käytöstä
- [ ] Automattinen salausavaimen rotaatio

