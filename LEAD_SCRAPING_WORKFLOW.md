# Lead Scraping - Työnkulun Kaavio

## Yleiskuvaus

Tämä dokumentti kuvaa lead scraping -toiminnallisuuden työnkulun, endpointit ja datan virtauksen.

## Työnkulun Kaavio

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (LeadScrapingPage.jsx)              │
│                                                                 │
│  1. Käyttäjä täyttää filtterit ja klikkaa "Aloita"             │
│     - filters: { emailStatus, jobTitlesIncludes, ... }          │
│     - apifyJson: JSON.stringify(filters)                       │
│     - leadLimit: number (max 50000)                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ POST /api/lead-scraping
                            │ Headers: Authorization: Bearer <token>
                            │ Body: { filters, apifyJson, leadLimit }
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND API: /api/lead-scraping                     │
│                                                                 │
│  1. Validoi käyttäjä (token)                                    │
│  2. Hae user_id Supabasesta                                     │
│  3. Validoi request body                                        │
│  4. Lähetä data N8N:ään                                         │
│     - user_id (public.users.id)                                 │
│     - auth_user_id (auth.users.id)                              │
│     - filters                                                   │
│     - apifyJson                                                 │
│     - leadLimit                                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ POST N8N Webhook
                            │ Headers: x-api-key: <N8N_SECRET_KEY>
                            │ URL: N8N_LEAD_SCRAPING_URL
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    N8N WORKFLOW                                 │
│                                                                 │
│  1. Vastaanota webhook data                                     │
│  2. Käsittele filtterit                                         │
│  3. Scrapaa liidit Apify/Pipeline Labs:sta                     │
│  4. Muotoile data payload-muotoon                               │
│  5. Tallenna suoraan Supabaseen                                 │
│     - Käytä SERVICE ROLE KEY                                    │
│     - Taulu: scraped_leads                                      │
│     - Kentät: camelCase (firstName, lastName, orgName, ...)    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ INSERT INTO scraped_leads
                            │ (user_id, firstName, lastName, ...)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                            │
│                                                                 │
│  Taulu: scraped_leads                                           │
│  - id (uuid)                                                    │
│  - user_id (uuid) - FK users.id                                 │
│  - firstName, lastName, fullName (text)                         │
│  - email, phone, position (text)                                 │
│  - city, state, country (text)                                   │
│  - linkedinUrl (text)                                           │
│  - seniority (text)                                              │
│  - functional (text[])                                           │
│  - orgName, orgWebsite (text)                                   │
│  - orgLinkedinUrl (text[])                                      │
│  - orgFoundedYear (integer)                                     │
│  - orgIndustry (text[])                                         │
│  - orgSize, orgDescription (text)                               │
│  - orgCity, orgState, orgCountry (text)                         │
│  - ppeIndex, ppeBatchIndex (integer)                           │
│  - status, source, raw_data, created_at, updated_at             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ (Data tallennettu)
                            │
                            │ Frontend hakee datan
                            │ GET /api/leads?page=1&perPage=20
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND API: /api/leads                             │
│                                                                 │
│  1. Validoi käyttäjä (token)                                    │
│  2. Hae user_id Supabasesta                                     │
│  3. Hae liidit Supabasesta                                     │
│     - Käytä USER CLIENT (anon key + token)                     │
│     - WHERE user_id = publicUserId                              │
│     - ORDER BY created_at DESC                                  │
│     - Pagination: range(...)                                    │
│  4. Palauta JSON: { success, leads, total, page, ... }         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ Response: { leads: [...], total: N }
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (LeadScrapingPage.jsx)              │
│                                                                 │
│  1. Vastaanota leads data                                      │
│  2. Päivitä state: setLeads(leads)                              │
│  3. Näytä taulukossa                                            │
│     - Käytä camelCase-kenttien nimiä                           │
│     - lead.fullName, lead.orgName, lead.linkedinUrl, ...        │
│     - lead.score (jos pisteytetty)                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              OPTIONAL: Lead Scoring (Manuaalinen)               │
│                                                                 │
│  Frontend/API → POST /api/lead-scoring                          │
│  Body: { leadIds?: [...], scoringCriteria?: {...} }             │
│                                                                 │
│  1. Validoi käyttäjä                                            │
│  2. Hae liidit (status='scraped')                               │
│  3. Laske pisteet (0-100)                                       │
│  4. UPDATE Supabase: score, score_criteria, status='scored'     │
└─────────────────────────────────────────────────────────────────┘
```

## Endpointit

### 1. POST /api/lead-scraping
**Tarkoitus:** Aloittaa lead scraping -prosessi

**Input:**
- `filters` (object): Hakufiltterit
- `apifyJson` (string): JSON-stringified filters
- `leadLimit` (number): Maksimimäärä liidejä (max 50000)

**Prosessi:**
1. Validoi käyttäjä tokenilla
2. Hae `user_id` Supabasesta
3. Lähetä data N8N webhookiin

**Output:**
- `{ success: true, message: 'Lead scraping started', ... }`

---

### 2. GET /api/leads
**Tarkoitus:** Hakea scrapattuja liidejä

**Query Parameters:**
- `page` (number, default: 1): Sivunumero
- `perPage` (number, default: 20): Rivien määrä per sivu

**Prosessi:**
1. Validoi käyttäjä tokenilla
2. Hae `user_id` Supabasesta
3. Hae liidit `scraped_leads` taulusta
4. Palauta paginoitu data

**Output:**
```json
{
  "success": true,
  "leads": [...],
  "total": 100,
  "page": 1,
  "perPage": 20,
  "totalPages": 5
}
```

---

### 3. POST /api/lead-scraping-callback (EI KÄYTÖSSÄ)
**Huomio:** Tätä endpointia EI käytetä, koska N8N tallentaa suoraan Supabaseen.

Jos tätä käytettäisiin, se vastaanottaisi:
- `user_id`: Käyttäjän ID
- `leads`: Array liideistä
- `search_query`: Hakukriteerit
- `source`: Lähde

---

### 4. POST /api/lead-scoring
**Tarkoitus:** Pisteyttää scrapattuja liidejä

**Input:**
- `leadIds` (array, optional): Tiettyjen liidien ID:t
  - Jos puuttuu, pisteytetään kaikki `status='scraped'` liidit
- `scoringCriteria` (object, optional): Mukautetut kriteerit

**Prosessi:**
1. Validoi käyttäjä
2. Hae liidit Supabasesta (`status='scraped'`)
3. Laske pisteet (0-100) perustuen:
   - Email: +20
   - Phone: +20
   - LinkedIn: +15
   - Company: +15
   - Position: +10
   - Location: +10
   - Bonus (kaikki): +10
4. Päivitä Supabase: `score`, `score_criteria`, `status='scored'`

**Output:**
- `{ success: true, count: N, leads: [...] }`

**Huomio:** Tätä **ei kutsuta automaattisesti**. Se täytyy kutsua erikseen.

---

## Tietokantarakenteen Muutokset

### Kenttien Nimet: camelCase
Kaikki payload-kentät käyttävät nyt camelCase-nimiä:

**Henkilön tiedot:**
- `firstName`, `lastName`, `fullName`
- `email`, `phone`, `position`
- `city`, `state`, `country`
- `linkedinUrl`, `seniority`
- `functional` (array)

**Organisaation tiedot:**
- `orgName`, `orgWebsite`
- `orgLinkedinUrl` (array)
- `orgFoundedYear` (integer)
- `orgIndustry` (array)
- `orgSize`, `orgDescription`
- `orgCity`, `orgState`, `orgCountry`

**Muut:**
- `ppeIndex`, `ppeBatchIndex` (integer)

### Array-kentät
Seuraavat kentät ovat array-tyyppiä:
- `functional` (TEXT[])
- `orgIndustry` (TEXT[])
- `orgLinkedinUrl` (TEXT[])

**Huomio:** N8N:ssä nämä voivat tulla stringeinä muodossa `"['value1', 'value2']"`. 
N8N:n pitää parsia nämä oikeiksi arrayeiksi ennen tallennusta.

---

## Autentikointi

### Frontend → Backend
- Käyttää Supabase auth tokenia
- Header: `Authorization: Bearer <token>`
- Token haetaan: `supabase.auth.getSession()`

### Backend → Supabase
- **Käyttäjän data-haku:** Anon key + käyttäjän token
- **N8N → Supabase:** Service role key (ohittaa RLS)

### Backend → N8N
- Header: `x-api-key: <N8N_SECRET_KEY>`
- Ympäristömuuttuja: `N8N_SECRET_KEY`

---

## Lead Scoring

Lead scoring on **erillinen, manuaalinen vaihe**, joka tapahtuu **scrapingin jälkeen**.

### POST /api/lead-scoring
**Tarkoitus:** Pisteyttää scrapattuja liidejä

**Kun kutsutaan:**
- **Manuaalisesti** frontendistä tai API:sta
- **Ei automaattisesti** scrapingin jälkeen

**Input:**
- `leadIds` (array, optional): Tiettyjen liidien ID:t pisteytettäväksi
  - Jos ei anneta, pisteytetään **kaikki** `status='scraped'` liidit
- `scoringCriteria` (object, optional): Mukautetut pisteytyskriteerit

**Prosessi:**
1. Validoi käyttäjä tokenilla
2. Hae liidit Supabasesta (`status='scraped'`)
3. Laske pisteet jokaiselle liidille:
   - Email: +20 pistettä
   - Phone: +20 pistettä
   - LinkedIn: +15 pistettä
   - Company (orgName): +15 pistettä
   - Position: +10 pistettä
   - Location (city/country): +10 pistettä
   - Bonus (kaikki yhteystiedot): +10 pistettä
   - **Maksimi: 100 pistettä**
4. Päivitä pisteet Supabaseen:
   - `score` (integer 0-100)
   - `score_criteria` (jsonb)
   - `status` → 'scored'

**Output:**
```json
{
  "success": true,
  "message": "Scored N leads successfully",
  "count": N,
  "failed": 0,
  "leads": [...]
}
```

**Huomio:** Lead scoring **ei tapahdu automaattisesti**. Se täytyy kutsua erikseen.

---

## Data Flow Yhteenveto

1. **Frontend** → Filtterit → **POST /api/lead-scraping**
2. **Backend** → Validoi → **POST N8N Webhook**
3. **N8N** → Scrapaa → **INSERT Supabase** (service role key, `status='scraped'`)
4. **Frontend** → **GET /api/leads** → Näytä data
5. **Backend** → Validoi → **SELECT Supabase** (user client)
6. **Manuaalinen:** **POST /api/lead-scoring** → Pisteytä liidit → **UPDATE Supabase** (`status='scored'`)

---

## Tärkeät Huomiot

1. **N8N tallentaa suoraan Supabaseen** - callback-endpointia ei käytetä
2. **Kenttien nimet ovat camelCase** - ei snake_case
3. **Array-kentät** parsitaan N8N:ssä ennen tallennusta
4. **RLS-politiikat** - käyttäjä näkee vain omat liidinsä
5. **Service role key** käytetään vain N8N:ssä, ei backend-endpointeissa

