# Lead Magnet - Pikaopas

## ✅ Mitä on tehty

### 1. API Endpoint
📁 **`/api/leadmagnet/[token].js`**
- Hakee datan Notionista N8N:n kautta
- Luo signed URL:n videolle Supabase Storagesta
- Päivittää katselukerrat

### 2. Frontend-sivu
📁 **`/src/pages/LeadMagnetPage.jsx`** + CSS
- Dynaaminen sivu videon katseluun
- Lataus- ja virhetilanteiden käsittely
- Responsiivinen design
- CTA-painikkeet ja lisäinfot

### 3. Routing
📁 **`/src/App.jsx`**
- Lisätty reitti: `/leadmagnet/:token`
- Julkinen sivu (ei vaadi kirjautumista)

### 4. Dokumentaatio
📁 **`/docs/LEADMAGNET_SETUP.md`**
- Yksityiskohtaiset ohjeet N8N workflowsta
- Notion-databasen rakenne
- Ympäristömuuttujat

---

## 🚀 Seuraavat askeleet

### 1. Luo Notion Database

Tarvittavat kentät:
- `email` (Email)
- `token` (Text, unique)
- `video_path` (Text) - esim. `videos/abc123.mp4`
- `status` (Select: processing / ready / failed)
- `created_at` (Date)
- `view_count` (Number)
- `viewed_at` (Date)
- `metadata` (Text, optional)

### 2. Rakenna N8N Workflow

Katso yksityiskohtaiset ohjeet: `docs/LEADMAGNET_SETUP.md`

**Tarvittavat webhookit:**
- `N8N_LEADMAGNET_GET` - Hakee datan ja päivittää katselukerrat

**Workflowin toiminnot:**
1. Vastaanota token
2. Hae rivi Notionista
3. Palauta JSON-data
4. (Erillinen action: päivitä view_count)

### 3. Lisää Ympäristömuuttujat

```bash
# .env.local
N8N_LEADMAGNET_GET=https://samikiias.app.n8n.cloud/webhook/leadmagnet-get
N8N_SECRET_KEY=your-secret-key
```

### 4. Luo Supabase Storage Bucket

```
Bucket: leadmagnet
Type: Private
Path structure: videos/*.mp4
```

### 5. Testaa

1. Lisää testi-rivi Notioniin:
   - email: test@example.com
   - token: test-123
   - status: ready
   - video_path: videos/test.mp4

2. Lataa video bucketiin: `leadmagnet/videos/test.mp4`

3. Avaa: `http://localhost:5173/leadmagnet/test-123`

---

## 📋 Integraatio Webflow-lomakkeeseen

Webflow-lomakkeen jälkeen:

1. **Webflow webhook** → N8N
2. **N8N:**
   - Luo uniikki token (`crypto.randomUUID()`)
   - Tallenna Notioniin: email, token, status=processing
   - Generoi video
   - Tallenna video Supabaseen
   - Päivitä Notion: status=ready, video_path
   - Lähetä sähköposti linkillä

**Sähköpostin linkki:**
```
https://rascal.fi/leadmagnet/{token}
```

---

## 🔍 Tärkeää

### Supabase-taulu ei ole käytössä
- ⚠️ Migraatio `create_lead_magnets_table` luotiin, mutta **sitä ei tarvita**
- Data tallennetaan **Notioniin**, ei Supabaseen
- Voit jättää taulun huomiotta tai poistaa sen

### Turvallisuus
- Tokenit ovat UUID-muotoisia (vaikea arvata)
- Videot eivät ole julkisia (signed URLs)
- Signed URL:t vanhentuvat 24h kuluttua
- N8N webhook suojattu API keylla

---

## 🆘 Pikaohjeet ongelmatilanteisiin

### "Lead magnet not found"
→ Tarkista että token löytyy Notionista

### "Video is still processing"
→ Notion status-kenttä ei ole "ready"

### Video ei lataudu
→ Tarkista video_path ja että tiedosto löytyy bucketista

### N8N ei vastaa
→ Tarkista että workflow on aktivoitu ja API key on oikein

---

## 📞 Seuraavat kehityskohteet (valinnainen)

- [ ] Email-ilmoitus kun video valmistuu
- [ ] Analytics (milloin videota katsottiin)
- [ ] Videon vanheneminen (poista 30 päivän kuluttua)
- [ ] A/B-testaus eri CTA-teksteille
- [ ] Admin-paneeli lead magnet -tilastoille

---

Lisätietoja: `docs/LEADMAGNET_SETUP.md`

