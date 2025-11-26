# Google Analytics OAuth 2.0 -asetusohje

## Yleiskuvaus

Tämä dokumentti kuvaa Google Analytics OAuth 2.0 -valtuutusvirran toteutuksen Rascal AI -sovelluksessa.

## Vaatimukset

### 1. Google Cloud Console -asetukset

1. Luo Google Cloud Console -projektissa OAuth 2.0 -asiakastunnus
2. Aseta **Authorized redirect URIs**:
   - `https://app.rascalai.fi/api/auth/google/callback` (tuotanto)
   - `http://localhost:3000/api/auth/google/callback` (kehitys, jos tarvitaan)

3. Lataa Client ID ja Client Secret

### 2. Ympäristömuuttujat

Aseta seuraavat ympäristömuuttujat Vercelissä:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://app.rascalai.fi/api/auth/google/callback
N8N_INTEGRATION_WEBHOOK_URL=https://your-n8n-instance.com/webhook/google-analytics
N8N_SECRET_KEY=your-n8n-secret-key (vapaaehtoinen, jos n8n vaatii autentikoinnin)
USER_SECRETS_ENCRYPTION_KEY=your-encryption-key (vaaditaan tokenin salaamiseen)
```

### 3. Supabase-tietokanta

Luo `oauth_states` -taulu Supabasessa:

```sql
CREATE TABLE IF NOT EXISTS oauth_states (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  state text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  auth_user_id uuid NOT NULL,
  provider text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indeksi nopeampaa hakua varten
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);

-- RLS-politiikat (vapaaehtoinen, jos käytät RLS:ää)
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

-- Salli service role -avaimen käyttö (tarvitaan backendissä)
CREATE POLICY "Service role can manage oauth_states"
  ON oauth_states
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## OAuth-virta

### 1. Käyttäjä klikkaa "Yhdistä Google Analytics" -painiketta

- Frontend kutsuu `/api/auth/google/start` -endpointia
- Backend generoi satunnaisen `state`-arvon
- Backend tallentaa `state`-arvon `oauth_states` -tauluun
- Backend palauttaa Google OAuth URL:n frontendiin
- Frontend avaa OAuth-ikkunan

### 2. Käyttäjä valtuuttaa Googlessa

- Google ohjaa käyttäjän takaisin `/api/auth/google/callback?code=...&state=...`
- Backend vahvistaa `state`-arvon
- Backend vaihtaa `code`-arvon `refresh_token`-arvoksi
- Backend tallentaa `refresh_token`-arvon salattuna `user_secrets` -tauluun
- Backend lähettää webhookin n8n:ään
- Backend ohjaa käyttäjän takaisin `/settings?tab=features&success=...`

### 3. n8n-integraatio

n8n vastaanottaa webhookin seuraavilla tiedoilla:

```json
{
  "action": "google_analytics_connected",
  "integration_type": "google_analytics_credentials",
  "integration_name": "Google Analytics Refresh Token",
  "customer_id": "uuid",
  "user_id": "uuid",
  "auth_user_id": "uuid",
  "refresh_token": "string",
  "client_id": "string",
  "client_secret": "string",
  "metadata": {
    "access_token": "string",
    "expires_in": 3600,
    "connected_at": "ISO timestamp"
  },
  "timestamp": "ISO timestamp",
  "get_secret_url": "https://app.rascalai.fi/api/user-secrets-service",
  "get_secret_params": {
    "secret_type": "google_analytics_credentials",
    "secret_name": "Google Analytics Refresh Token",
    "user_id": "uuid"
  }
}
```

## API-endpointit

### GET /api/auth/google/start

Aloittaa OAuth-virran. Vaaditaan autentikointi.

**Vastaus:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "random-state-value"
}
```

### GET /api/auth/google/callback

Käsittelee Google OAuth -callbackin. Ei vaadi autentikointia (Google kutsuu tätä).

**Parametrit:**
- `code`: Authorization code Googlen palvelimelta
- `state`: State-arvo joka vahvistetaan

**Toiminta:**
1. Vahvistaa `state`-arvon
2. Vaihtaa `code`-arvon tokeniksi
3. Tallentaa `refresh_token`-arvon
4. Lähettää webhookin n8n:ään
5. Ohjaa käyttäjän takaisin asetussivulle

## Turvallisuus

- `state`-arvo vahvistetaan aina callbackissa
- `state`-arvot vanhenevat 10 minuutissa
- `refresh_token`-arvot salataan ennen tallennusta
- Kaikki API-kutsut vaativat autentikoinnin (paitsi callback)
- n8n-webhookit voidaan suojata `x-api-key` -headerilla

## Vianetsintä

### OAuth-ikkuna ei avaudu
- Tarkista että popupit eivät ole estetty selaimessa
- Tarkista konsolista virheet

### "State-arvo on vanhentunut"
- State-arvot vanhenevat 10 minuutissa
- Yritä uudelleen

### "Refresh token ei saatu"
- Varmista että `prompt=consent` on OAuth-URL:ssa
- Tarkista että Google Cloud Console -asetukset ovat oikein

### "OAuth state taulu puuttuu"
- Luo `oauth_states` -taulu Supabasessa (katso yllä)

### Webhook ei mene n8n:ään
- Tarkista että `N8N_INTEGRATION_WEBHOOK_URL` on asetettu
- Tarkista n8n-lokit
- Tarkista että `x-api-key` -header on oikein (jos käytössä)

