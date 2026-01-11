# HMAC Migration Status

Tämä dokumentti listaa kaikki endpointit ja niiden HMAC-toteutuksen tilan.

## ✅ Päivitetyt endpointit (käyttävät sendToN8N → HMAC)

### Priority 1 (Valmis)
- ✅ `api/support/ticket.js` - Käyttää sendToN8N()
- ✅ `api/calls/single.js` - Käyttää sendToN8N()
- ✅ `api/calls/inbound-settings.js` - Käyttää sendToN8N()
- ✅ `api/users/secrets.js` - Käyttää sendToN8N()

### Priority 2 (Valmis)
- ✅ `api/strategy/approve.js` - Käyttää sendToN8N()
- ✅ `api/organization/onboarding-completed.js` - Käyttää sendToN8N()
- ✅ `api/webhooks/voiceover-ready.js` - Käyttää sendToN8N()
- ✅ `api/avatars/status.js` - Käyttää sendToN8N()
- ✅ `api/avatars/upload.js` - Käyttää sendToN8N()
- ✅ `api/avatars/delete.js` - Käyttää sendToN8N()
- ✅ `api/social/reels/list.js` - Käyttää sendToN8N()
- ✅ `api/social/posts/update.js` - Käyttää sendToN8N()
- ✅ `api/social/posts/actions.js` - Käyttää sendToN8N()

### Muut (Valmis)
- ✅ `api/ai/chat.js` - Käyttää sendToN8N()
- ✅ `api/content/blog/publish.js` - Käyttää sendToN8N()
- ✅ `api/storage/ingest.js` - Käyttää sendToN8N()
- ✅ `api/storage/knowledge/index.js` - Käyttää sendToN8N()

## ❌ Endpointit jotka käyttävät vielä x-api-key headeria

### Webhooks (vastaanottavat x-api-key, ei lähetä)
- ⚠️ `api/webhooks/lead-scraping-callback.js` - **Vastaanottaa** x-api-key headeria (N8N lähettää)
- ⚠️ `api/webhooks/inbound-call.js` - **Vastaanottaa** x-api-key headeria (N8N lähettää)
- ⚠️ `api/webhooks/send.js` - **Lähettää** x-api-key headeria (generinen webhook-endpoint)

### Storage endpoints
- ❌ `api/storage/knowledge/upload.js` - Lähettää x-api-key
- ❌ `api/storage/delete-files.js` - Lähettää x-api-key
- ❌ `api/storage/blob-ingest.js` - Lähettää x-api-key
- ❌ `api/storage/blob-delete.js` - Vastaanottaa x-api-key (mutta myös lähettää?)

### Leads endpoints
- ❌ `api/leads/scraping/index.js` - Lähettää x-api-key
- ❌ `api/leads/magnet/index.js` - Lähettää x-api-key

### Integrations endpoints
- ❌ `api/integrations/airtable/carousels.js` - Lähettää x-api-key

### Content endpoints
- ❌ `api/content/ugc-video.js` - Lähettää x-api-key
- ❌ `api/content/testimonials/manage.js` - Lähettää x-api-key
- ❌ `api/content/carousel-template.js` - Lähettää x-api-key
- ❌ `api/content/blog/article-management.js` - Lähettää x-api-key

### Calls endpoints
- ❌ `api/calls/type-improvement.js` - Lähettää x-api-key

### Auth endpoints
- ❌ `api/auth/google/callback.js` - Lähettää x-api-key

### Analytics endpoints
- ❌ `api/analytics/visitors.js` - Lähettää x-api-key

### AI endpoints
- ❌ `api/ai/generate-ideas.js` - Lähettää x-api-key
- ❌ `api/ai/analyze-tone.js` - Lähettää x-api-key

### Users endpoints
- ⚠️ `api/users/secrets-service.js` - **Vastaanottaa** x-api-key headeria (service-to-service)
- ⚠️ `api/users/secrets.js` - Sisältää dokumentaation x-api-key:sta mutta käyttää sendToN8N()

## 📋 Yhteenveto

**Päivitetty:** 19 endpointtia käyttää nyt HMAC:ia (sendToN8N)

**Ei vielä päivitetty:** ~20 endpointtia käyttää vielä x-api-key headeria

**Erityistapaukset:**
- `api/webhooks/lead-scraping-callback.js` ja `api/webhooks/inbound-call.js` **vastaanottavat** x-api-key headeria N8N:stä (ei lähetä)
- `api/webhooks/send.js` on generinen webhook-endpoint joka lähettää x-api-key headeria
- `api/users/secrets-service.js` on service-to-service endpoint joka vastaanottaa x-api-key headeria

## 🔄 Seuraavat vaiheet

1. **Päivitä storage-endpointit:**
   - `api/storage/knowledge/upload.js`
   - `api/storage/delete-files.js`
   - `api/storage/blob-ingest.js`
   - `api/storage/blob-delete.js`

2. **Päivitä leads-endpointit:**
   - `api/leads/scraping/index.js`
   - `api/leads/magnet/index.js`

3. **Päivitä content-endpointit:**
   - `api/content/ugc-video.js`
   - `api/content/testimonials/manage.js`
   - `api/content/carousel-template.js`
   - `api/content/blog/article-management.js`

4. **Päivitä muut endpointit:**
   - `api/integrations/airtable/carousels.js`
   - `api/calls/type-improvement.js`
   - `api/auth/google/callback.js`
   - `api/analytics/visitors.js`
   - `api/ai/generate-ideas.js`
   - `api/ai/analyze-tone.js`

5. **Tarkista erityistapaukset:**
   - `api/webhooks/send.js` - generinen webhook-endpoint (ehkä pitää olla joustava?)
   - `api/webhooks/lead-scraping-callback.js` - vastaanottaa x-api-key (N8N lähettää)
   - `api/webhooks/inbound-call.js` - vastaanottaa x-api-key (N8N lähettää)
   - `api/users/secrets-service.js` - service-to-service endpoint









