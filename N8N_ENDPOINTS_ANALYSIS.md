# N8N Endpoints Analysis

## Päivittämättömät endpointit N8N_ ympäristömuuttujilla

### ✅ Kaikki 17 endpointtia käyttävät N8N_ ympäristömuuttujia

**Käytössä frontendissä:** 13 endpointtia  
**Ei käytössä frontendissä:** 4 endpointtia

#### Storage (4 endpointtia)
1. **api/storage/knowledge/upload.js** ✅ **Käytössä** ⚠️ **Osittain päivitetty**
   - `N8N_SECRET_KEY`
   - Käytetään: `/ai-chat`, `/dev-chat`
   - Status: Käyttää HMAC:ia FormData-lähetyksessä, mutta ei sendToN8N() funktiota

2. **api/storage/delete-files.js** ✅ **Käytössä** ✅ **Päivitetty**
   - `N8N_DELETE_FILES_URL`
   - `N8N_SECRET_KEY`
   - Käytetään: `/ai-chat`
   - Status: Käyttää sendToN8N() ✅

3. **api/storage/blob-ingest.js** ❌ **Ei käytössä frontendissä** ❌ **Ei päivitetty**
   - `N8N_SECRET_KEY`
   - Status: Käyttää x-api-key headeria

4. **api/storage/blob-delete.js** ❌ **Ei käytössä frontendissä** ⚠️ **Webhook vastaanottaja**
   - `N8N_SECRET_KEY`
   - Status: Vastaanottaa x-api-key headeria (N8N lähettää)

#### Leads (2 endpointtia)
5. **api/leads/scraping/index.js** ✅ **Käytössä** ✅ **Päivitetty**
   - `N8N_LEAD_SCRAPING_URL`
   - `N8N_SECRET_KEY`
   - Käytetään: `/leads-scraping`
   - Status: Käyttää sendToN8N() ✅

6. **api/leads/magnet/index.js** ✅ **Käytössä** ✅ **Päivitetty**
   - `N8N_LEADMAGNET_GET`
   - `N8N_SECRET_KEY`
   - Käytetään: `/leadmagnet/:token`
   - Status: Käyttää sendToN8N() ✅

#### Integrations (1 endpointti)
7. **api/integrations/airtable/carousels.js** ✅ **Käytössä** ✅ **Päivitetty**
   - `N8N_AIRTABLE_CAROUSEL`
   - `N8N_SECRET_KEY`
   - Käytetään: `/posts` (CarouselsTab komponentti)
   - Status: Käyttää sendToN8N() ✅

#### Content (4 endpointtia)
8. **api/content/ugc-video.js** ✅ **Käytössä** ✅ **Päivitetty**
   - `N8N_UGC_VIDEO_URL`
   - `N8N_SECRET_KEY`
   - Käytetään: `/posts` (UgcTab komponentti)
   - Status: Käyttää sendToN8N() ✅

9. **api/content/testimonials/manage.js** ✅ **Käytössä** ✅ **Päivitetty**
   - `N8N_TESTIMONIALS_URL`
   - `N8N_SECRET_KEY`
   - Käytetään: `/admin-testimonials`
   - Status: Käyttää sendToN8N() ✅

10. **api/content/carousel-template.js** ✅ **Käytössä** ✅ **Päivitetty**
    - `N8N_CAROUSEL_UPDATE`
    - `N8N_SECRET_KEY`
    - Käytetään: `/settings` (CarouselTemplateSelector komponentti)
    - Status: Käyttää sendToN8N() ✅

11. **api/content/blog/article-management.js** ✅ **Käytössä** ✅ **Päivitetty**
    - `N8N_CMS_URL`
    - `N8N_CMS_UPDATE`
    - `N8N_SECRET_KEY`
    - Käytetään: `/admin-blog`
    - Status: Käyttää sendToN8N() ✅

#### Calls (1 endpointti)
12. **api/calls/type-improvement.js** ✅ **Käytössä** ✅ **Päivitetty**
    - `N8N_CALL_TYPE_ENHANCEMENT`
    - `N8N_SECRET_KEY`
    - Käytetään: `/calls` (CallPanel, AddCallTypeModal, EditCallTypeModal)
    - Status: Käyttää sendToN8N() ✅

#### Auth (1 endpointti)
13. **api/auth/google/callback.js** ❌ **Ei käytössä frontendissä** ❌ **Ei päivitetty**
    - `N8N_INTEGRATION_WEBHOOK_URL`
    - `N8N_SECRET_KEY`
    - Huom: Callback endpoint, ei kutsuta suoraan frontendistä
    - Status: Käyttää x-api-key headeria (axios.post)

#### Analytics (1 endpointti)
14. **api/analytics/visitors.js** ✅ **Käytössä** ✅ **Päivitetty**
    - `N8N_GOOGLE_ANALYTICS_VISITORS_URL`
    - `N8N_SECRET_KEY`
    - Käytetään: `/dashboard`
    - Status: Käyttää sendToN8N() ✅

#### AI (2 endpointtia)
15. **api/ai/generate-ideas.js** ✅ **Käytössä** ✅ **Päivitetty**
    - `N8N_IDEA_GENERATION`
    - `N8N_SECRET_KEY`
    - Käytetään: `/posts`, `/blog-newsletter`
    - Status: Käyttää sendToN8N() ✅

16. **api/ai/analyze-tone.js** ✅ **Käytössä** ✅ **Päivitetty**
    - `N8N_TOV_SCRAPE`
    - `N8N_SECRET_KEY`
    - Käytetään: `/strategy`
    - Status: Käyttää sendToN8N() ✅

#### Webhooks (1 endpointti)
17. **api/webhooks/send.js** ❌ **Ei käytössä frontendissä** ❌ **Ei päivitetty**
    - `N8N_HOST`
    - `N8N_SECRET_KEY`
    - Status: Käyttää x-api-key headeria (generinen webhook-endpoint)

## Yhteenveto

**Kaikki 17 päivittämätöntä endpointtia käyttävät N8N_ ympäristömuuttujia.**

**Käytössä frontendissä:** 13 endpointtia  
**Ei käytössä frontendissä:** 4 endpointtia

### Frontendissä käytetyt endpointit (13 kpl):
1. `/api/storage/knowledge/upload` → `/ai-chat`, `/dev-chat`
2. `/api/storage/delete-files` → `/ai-chat`
3. `/api/leads/scraping` → `/leads-scraping`
4. `/api/leads/magnet` → `/leadmagnet/:token`
5. `/api/integrations/airtable/carousels` → `/posts` (CarouselsTab)
6. `/api/content/ugc-video` → `/posts` (UgcTab)
7. `/api/content/testimonials/manage` → `/admin-testimonials`
8. `/api/content/carousel-template` → `/settings`
9. `/api/content/blog/article-management` → `/admin-blog`
10. `/api/calls/type-improvement` → `/calls`
11. `/api/analytics/visitors` → `/dashboard`
12. `/api/ai/generate-ideas` → `/posts`, `/blog-newsletter`
13. `/api/ai/analyze-tone` → `/strategy`

### Ei käytössä frontendissä (4 kpl):
1. `/api/storage/blob-ingest` - Backend-only
2. `/api/storage/blob-delete` - Backend-only
3. `/api/auth/google/callback` - Callback endpoint
4. `/api/webhooks/send` - Generinen webhook-endpoint

**Ympäristömuuttujat:**
- `N8N_SECRET_KEY` - käytetään kaikissa 17 endpointissa
- `N8N_DELETE_FILES_URL` - 1 endpointti
- `N8N_LEAD_SCRAPING_URL` - 1 endpointti
- `N8N_LEADMAGNET_GET` - 1 endpointti
- `N8N_AIRTABLE_CAROUSEL` - 1 endpointti
- `N8N_UGC_VIDEO_URL` - 1 endpointti
- `N8N_TESTIMONIALS_URL` - 1 endpointti
- `N8N_CAROUSEL_UPDATE` - 1 endpointti
- `N8N_CMS_URL` - 1 endpointti
- `N8N_CMS_UPDATE` - 1 endpointti
- `N8N_CALL_TYPE_ENHANCEMENT` - 1 endpointti
- `N8N_INTEGRATION_WEBHOOK_URL` - 1 endpointti
- `N8N_GOOGLE_ANALYTICS_VISITORS_URL` - 1 endpointti
- `N8N_IDEA_GENERATION` - 1 endpointti
- `N8N_TOV_SCRAPE` - 1 endpointti
- `N8N_HOST` - 1 endpointti

## 📊 Päivitystilanne

**✅ Päivitetty (käyttävät sendToN8N()):** 13 endpointtia
- api/storage/delete-files.js
- api/leads/scraping/index.js
- api/leads/magnet/index.js
- api/integrations/airtable/carousels.js
- api/content/ugc-video.js
- api/content/testimonials/manage.js
- api/content/carousel-template.js
- api/content/blog/article-management.js
- api/calls/type-improvement.js
- api/analytics/visitors.js
- api/ai/generate-ideas.js
- api/ai/analyze-tone.js

**⚠️ Osittain päivitetty:** 2 endpointtia
- api/storage/knowledge/upload.js (HMAC käytössä, mutta ei sendToN8N())
- api/storage/knowledge/index.js (JSON OK, multipart käyttää x-api-key)

**❌ Ei vielä päivitetty:** 3 endpointtia
- api/storage/blob-ingest.js (käyttää x-api-key)
- api/auth/google/callback.js (käyttää x-api-key axios.post:lla)
- api/webhooks/send.js (generinen webhook-endpoint, käyttää x-api-key)

**⚠️ Webhook vastaanottajat (ei tarvitse päivitystä):** 1 endpointti
- api/storage/blob-delete.js (vastaanottaa x-api-key N8N:stä)

## Tarkempi analyysi: Endpointit jotka lähettävät N8N:ään

### ✅ Osittain päivitetyt (käyttävät jo HMAC:ia osassa koodia)

1. **api/storage/knowledge/upload.js** ⚠️ **Osittain päivitetty**
   - Käyttää HMAC-allekirjoitusta FormData-lähetyksessä (rivi 75)
   - Ei käytä sendToN8N() funktiota (erityiskohtelu FormData:lle)
   - Status: Käyttää HMAC:ia, mutta ei sendToN8N() funktiota

2. **api/storage/knowledge/index.js** ⚠️ **Osittain päivitetty**
   - Käyttää sendToN8N() JSON-lähetyksessä (rivi 169) ✅
   - Käyttää x-api-key multipart-uploadissa (rivit 84, 129) ❌
   - Status: JSON-lähetys OK, multipart-upload tarvitsee päivityksen

3. **api/storage/delete-files.js** ✅ **Päivitetty**
   - Käyttää sendToN8N() (rivi 26)
   - Status: Valmis

### ❌ Ei vielä päivitetty (käyttävät x-api-key headeria)

4. **api/storage/blob-ingest.js**
   - Käyttää x-api-key headeria (rivi 21)
   - Lähettää JSON-payloadin

5. **api/storage/blob-delete.js**
   - Vastaanottaa x-api-key headeria (webhook vastaanottaja)
   - Ei lähetä N8N:ään, vaan vastaanottaa N8N:stä

6. **api/auth/google/callback.js**
   - Käyttää x-api-key headeria (rivi 167)
   - Lähettää axios.post:lla N8N:ään

7. **api/webhooks/send.js**
   - Käyttää x-api-key headeria (rivi 41)
   - Generinen webhook-endpoint

### 📊 Yhteenveto päivityksistä

**Täysin päivitetty:** 1 endpointti
- api/storage/delete-files.js

**Osittain päivitetty:** 2 endpointtia
- api/storage/knowledge/upload.js (HMAC käytössä, mutta ei sendToN8N())
- api/storage/knowledge/index.js (JSON OK, multipart tarvitsee päivityksen)

**Ei vielä päivitetty:** 4 endpointtia
- api/storage/blob-ingest.js
- api/auth/google/callback.js
- api/webhooks/send.js
- api/storage/blob-delete.js (vastaanottaja, ei lähettäjä)

**Huomioitavaa:**
- FormData-lähetykset vaativat erityiskohtelua HMAC:in kanssa (metadata erikseen)
- Multipart-uploadit eivät voi käyttää suoraan sendToN8N() funktiota
- Webhook-vastaanottajat (blob-delete, lead-scraping-callback, inbound-call) eivät tarvitse päivitystä

