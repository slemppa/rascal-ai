# Versio 2.0.0 - Kriteerit ja Esimerkit

Tämä dokumentti listaa konkreettiset esimerkit, milloin projektissa olisi syytä siirtyä versioon 2.0.0 (major version).

## 📋 Yleiset kriteerit

Major-version (2.0.0) päivitys on perusteltu, kun:
1. **Taaksepäin yhteensopimattomat muutokset** - Vanhat integraatiot eivät toimi enää
2. **API-muutokset** - Endpointit poistetaan tai muuttuvat merkittävästi
3. **Tietokanta-muutokset** - Taulut/sarakkeet poistetaan tai muuttuvat
4. **Autentikointi-muutokset** - Kirjautumistapa muuttuu
5. **Konfiguraatio-muutokset** - Ympäristömuuttujat tai asetukset muuttuvat

---

## 🎯 Konkreettiset esimerkit projektissa

### 1. ✅ **HMAC-migraation valmistuminen** (Breaking Change)

**Tilanne nyt:**
- ~20 endpointtia käyttää vielä `x-api-key` headeria
- 19 endpointtia on päivitetty käyttämään HMAC:ia (`sendToN8N()`)

**Versio 2.0.0 olisi perusteltu, jos:**
- Poistetaan `x-api-key` autentikointi kokonaan
- Kaikki endpointit vaativat HMAC-autentikaation
- Vanhat integraatiot (jotka käyttävät `x-api-key`:tä) eivät toimi enää

**Commit-viesti:**
```bash
feat!: poista x-api-key autentikointi, vaadi HMAC kaikissa endpointeissa

BREAKING CHANGE: Kaikki API-endpointit vaativat nyt HMAC-autentikaation.
Vanhat integraatiot jotka käyttävät x-api-key headeria eivät toimi enää.
Päivitä integraatiosi käyttämään HMAC-autentikaatiota.
```

---

### 2. ✅ **Airtable-integraation poistaminen** (Breaking Change)

**Tilanne nyt:**
- Supabase-migraatio on tehty (versio 1.23.3)
- Airtable-integraatio on vielä olemassa: `api/integrations/airtable/carousels.js`
- Dokumentaatiossa mainitaan Airtable-synkronointi

**Versio 2.0.0 olisi perusteltu, jos:**
- Poistetaan kaikki Airtable-integraatiot kokonaan
- Poistetaan Airtable-ympäristömuuttujat
- Poistetaan Airtable-dokumentaatio

**Commit-viesti:**
```bash
feat!: poista Airtable-integraatio kokonaan

BREAKING CHANGE: Airtable-integraatio on poistettu. Kaikki data on nyt Supabasessa.
Poistetut endpointit:
- /api/integrations/airtable/carousels
- Kaikki Airtable-ympäristömuuttujat (N8N_AIRTABLE_*)
```

---

### 3. ✅ **API-endpointtien poistaminen** (Breaking Change)

**Esimerkkejä endpointeista jotka voisi poistaa:**

**a) Vanhat storage-endpointit:**
- `api/storage/blob-ingest.js` (ei käytössä frontendissä)
- `api/storage/blob-delete.js` (ei käytössä frontendissä)

**b) Vanhat webhook-endpointit:**
- `api/webhooks/send.js` (generinen webhook, ei käytössä)

**Versio 2.0.0 olisi perusteltu, jos:**
- Poistetaan endpointit ilman deprecation-aikaa
- Vanhat integraatiot rikkoontuvat

**Commit-viesti:**
```bash
feat!: poista vanhat storage ja webhook endpointit

BREAKING CHANGE: Seuraavat endpointit on poistettu:
- /api/storage/blob-ingest
- /api/storage/blob-delete
- /api/webhooks/send

Käytä uusia endpointteja:
- /api/storage/knowledge/upload
- /api/storage/delete-files
```

---

### 4. ✅ **Autentikointi-muutokset** (Breaking Change)

**Esimerkki:**
- Muutetaan Supabase Auth → uusi autentikointijärjestelmä
- Muutetaan token-muoto (JWT → OAuth2)
- Poistetaan Google OAuth -integraatio

**Versio 2.0.0 olisi perusteltu, jos:**
- Vanhat tokenit eivät toimi enää
- Kirjautumisprosessi muuttuu merkittävästi

**Commit-viesti:**
```bash
feat!: uusi autentikointijärjestelmä, poista Supabase Auth

BREAKING CHANGE: Autentikointi on siirretty Supabase Authista uuteen järjestelmään.
Vanhat JWT-tokenit eivät toimi enää. Käyttäjien täytyy kirjautua uudelleen.
```

---

### 5. ✅ **Tietokanta-skeeman muutokset** (Breaking Change)

**Esimerkki:**
- Poistetaan sarakkeita `user_social_accounts` taulusta
- Muutetaan tietotyyppejä (esim. `string` → `integer`)
- Poistetaan tauluja kokonaan

**Versio 2.0.0 olisi perusteltu, jos:**
- Vanhat kyselyt eivät toimi enää
- Tietokanta-migraatio rikkoo olemassa olevat kyselyt

**Commit-viesti:**
```bash
feat!: uudelleen suunniteltu tietokanta-skeema

BREAKING CHANGE: Tietokanta-skeema on uudelleen suunniteltu.
Poistetut sarakkeet:
- user_social_accounts.account_data (korvattu account_metadata:lla)
- user_social_accounts.visibility (korvattu is_public:lla)

Päivitä kyselysi käyttämään uusia kenttiä.
```

---

### 6. ✅ **Ympäristömuuttujien muutokset** (Breaking Change)

**Esimerkki:**
- Poistetaan `N8N_*` ympäristömuuttujat
- Muutetaan ympäristömuuttujien nimet
- Muutetaan ympäristömuuttujien muotoa

**Versio 2.0.0 olisi perusteltu, jos:**
- Vanhat ympäristömuuttujat eivät toimi enää
- Deploy-asetukset rikkoontuvat

**Commit-viesti:**
```bash
feat!: uudelleen nimetty ympäristömuuttujat

BREAKING CHANGE: Ympäristömuuttujien nimet on muutettu:
- N8N_SECRET_KEY → N8N_HMAC_SECRET
- N8N_HOST → N8N_BASE_URL
- N8N_* → MIXPOST_* (sometilit)

Päivitä .env.local tiedostosi uusilla nimillä.
```

---

### 7. ✅ **UI/UX-muutokset** (Breaking Change)

**Esimerkki:**
- Poistetaan kokonaan toiminnallisuuksia
- Muutetaan merkittävästi käyttöliittymää
- Poistetaan reittejä

**Versio 2.0.0 olisi perusteltu, jos:**
- Vanhat bookmarkit eivät toimi enää
- Käyttäjien täytyy oppia uusi käyttöliittymä

**Commit-viesti:**
```bash
feat!: uudelleen suunniteltu käyttöliittymä

BREAKING CHANGE: Käyttöliittymä on uudelleen suunniteltu.
Poistetut reitit:
- /old-dashboard → /dashboard (uusi)
- /old-settings → /settings (uusi)

Vanhat bookmarkit eivät toimi enää.
```

---

## 📊 Yhteenveto: Milloin versio 2.0.0?

### ✅ **Kyllä, versio 2.0.0 on perusteltu, jos:**

1. **Poistetaan vanhoja API-endpointteja** ilman deprecation-aikaa
2. **Muutetaan autentikointia** merkittävästi
3. **Poistetaan tietokanta-sarakkeita/tauluja** ilman migraatiota
4. **Muutetaan ympäristömuuttujia** niin että vanhat eivät toimi
5. **Poistetaan toiminnallisuuksia** kokonaan
6. **Tehdään breaking change -commitit** (`feat!:` tai `BREAKING CHANGE:`)

### ❌ **Ei, versio 2.0.0 ei ole perusteltu, jos:**

1. **Lisätään uusia ominaisuuksia** taaksepäin yhteensopivasti → **MINOR** (1.108.0)
2. **Korjataan bugeja** → **PATCH** (1.107.6)
3. **Refaktoroidaan koodia** ilman API-muutoksia → **MINOR** tai **PATCH**
4. **Päivitetään dokumentaatiota** → **PATCH**

---

## 🚀 Suositeltu lähestymistapa

Jos aiot tehdä breaking change -muutoksia:

1. **Deprecation-vaihe (MINOR):**
   ```bash
   feat: deprecate x-api-key autentikointi, siirry HMAC:iin
   ```
   - Lisää varoitukset vanhoihin endpointeihin
   - Dokumentoi uudet endpointit
   - Anna käyttäjille aikaa päivittää

2. **Breaking Change (MAJOR):**
   ```bash
   feat!: poista x-api-key autentikointi
   
   BREAKING CHANGE: x-api-key autentikointi on poistettu.
   ```
   - Poista vanhat endpointit
   - Päivitä dokumentaatio
   - Ilmoita käyttäjille etukäteen

---

## 📝 Esimerkki: HMAC-migraation valmistuminen

**Vaihe 1: Deprecation (versio 1.108.0)**
```bash
feat: deprecate x-api-key autentikointi, siirry HMAC:iin

Lisätty varoitukset endpointeihin jotka käyttävät vielä x-api-key:tä.
Kaikki endpointit siirtyvät HMAC-autentikaatioon versiossa 2.0.0.
```

**Vaihe 2: Breaking Change (versio 2.0.0)**
```bash
feat!: poista x-api-key autentikointi, vaadi HMAC kaikissa endpointeissa

BREAKING CHANGE: Kaikki API-endpointit vaativat nyt HMAC-autentikaation.
Vanhat integraatiot jotka käyttävät x-api-key headeria eivät toimi enää.

Poistetut endpointit:
- /api/storage/blob-ingest (käytä /api/storage/knowledge/upload)
- /api/webhooks/send (käytä suoraa N8N webhookia)

Päivitä integraatiosi käyttämään HMAC-autentikaatiota.
```

---

## 🔗 Aiheeseen liittyvät dokumentit

- `VERSIONING.md` - Yleiset versionhallinta-ohjeet
- `HMAC_MIGRATION_STATUS.md` - HMAC-migraation tila
- `CHANGELOG.md` - Kaikki versiohistoria







