# Lead Magnet - Setup & Dokumentaatio

## 📋 Yleiskuvaus

Lead Magnet -järjestelmä mahdollistaa käyttäjille henkilökohtaisen videon katselun turvallisesti tokenin avulla. Data tallennetaan Notioniin ja videot Supabase Storage bucketiin.

## 🏗️ Arkkitehtuuri

```
┌─────────────┐
│  Webflow    │ ← Käyttäjä täyttää lomakkeen
│   Form      │
└─────┬───────┘
      │
      ↓ (webhook)
┌─────────────┐
│   Notion    │ ← Sähköposti + token tallennetaan
│  Database   │
└─────┬───────┘
      │
      ↓ (webhook/workflow)
┌─────────────┐
│     N8N     │ ← Generoi video
│  Workflow   │
└─────┬───────┘
      │
      ↓ (tallenna)
┌─────────────┐
│  Supabase   │ ← Video tallennetaan bucketiin
│   Storage   │
└─────────────┘
      │
      ↓ (sähköposti)
┌─────────────┐
│  Käyttäjä   │ ← Saa linkin: /leadmagnet/{token}
└─────┬───────┘
      │
      ↓ (avaa linkki)
┌─────────────┐
│  Rascal AI  │ ← Hakee datan Notionista (N8N)
│    Web App  │ ← Hakee videon Supabasesta
└─────────────┘
```

## 🗄️ Notion Database Rakenne

Notion-taulussa pitää olla seuraavat kentät:

### Tarvittavat kentät:

| Kenttä | Tyyppi | Kuvaus | Esimerkki |
|--------|--------|--------|-----------|
| `email` | Email | Käyttäjän sähköposti | user@example.com |
| `token` | Text | Uniikki token (UUID) | abc123-def456-ghi789 |
| `video_path` | Text | Polku Supabase bucketissa | `videos/abc123.mp4` |
| `status` | Select | Videon tila | processing / ready / failed |
| `created_at` | Date | Luontiaika | 2025-01-10 |
| `view_count` | Number | Katselukerrat | 0, 1, 2... |
| `viewed_at` | Date | Viimeisin katselu | 2025-01-11 |
| `metadata` | Text/JSON | Lisätiedot (vapaaehtoinen) | {} |

### Status-vaihtoehtojen selitykset:

- **processing**: Video generoidaan parhaillaan
- **ready**: Video on valmis ja katsottavissa
- **failed**: Video-generointi epäonnistui

## 🔧 N8N Workflow

### Webhook 1: `leadmagnet-get` (GET)

**Webhook URL:** `https://samikiias.app.n8n.cloud/webhook/leadmagnet-get`

**Toiminto:** Hakee lead magnet -datan Notionista tokenin perusteella

**Input (POST body):**
```json
{
  "token": "abc123-def456",
  "action": "get_leadmagnet"
}
```

**Workflowin vaiheet:**
1. **Webhook Trigger** - Vastaanottaa token
2. **Notion - Search Database** 
   - Suodata: `token` = `{{$json.token}}`
3. **Function/Code** - Muotoile vastaus:
```javascript
return {
  email: items[0].json.properties.email.email,
  token: items[0].json.properties.token.rich_text[0].plain_text,
  video_path: items[0].json.properties.video_path.rich_text[0].plain_text,
  status: items[0].json.properties.status.select.name,
  created_at: items[0].json.properties.created_at.date.start,
  metadata: items[0].json.properties.metadata.rich_text[0]?.plain_text || '{}'
}
```
4. **Respond to Webhook** - Palauta JSON

**Output:**
```json
{
  "email": "user@example.com",
  "token": "abc123-def456",
  "video_path": "videos/abc123.mp4",
  "status": "ready",
  "created_at": "2025-01-10T12:00:00Z",
  "metadata": {}
}
```

---

### Webhook 2: `leadmagnet-get` (UPDATE)

**Sama webhook URL, eri action**

**Input (POST body):**
```json
{
  "token": "abc123-def456",
  "action": "increment_view_count"
}
```

**Workflowin vaiheet:**
1. **Webhook Trigger**
2. **Notion - Search Database** (hae rivi tokenilla)
3. **Notion - Get Database Item** (hae nykyinen view_count)
4. **Function** - Kasvata lukumäärää:
```javascript
return {
  view_count: items[0].json.properties.view_count.number + 1,
  viewed_at: new Date().toISOString()
}
```
5. **Notion - Update Database Item**
   - Päivitä `view_count` ja `viewed_at`

---

### Workflow 3: Video-generointi (vapaaehtoinen)

Tämä workflow käynnistyy kun Webflow-lomake lähettää datan:

1. **Webhook Trigger** - Webflow lähettää sähköpostin
2. **Function** - Luo uniikki token:
```javascript
const crypto = require('crypto');
return {
  token: crypto.randomUUID(),
  email: items[0].json.email
}
```
3. **Notion - Create Database Item**
   - Tallenna: email, token, status=processing
4. **Video Generation** (oma logiikkasi)
5. **Supabase Storage** - Tallenna video bucketiin
6. **Notion - Update** - Päivitä status=ready, video_path
7. **Send Email** - Lähetä linkki: `https://rascal.fi/leadmagnet/{token}`

## 🔐 Ympäristömuuttujat

Lisää `.env.local` tiedostoon:

```bash
# N8N Webhook URL lead magnet -datalle
N8N_LEADMAGNET_GET=https://samikiias.app.n8n.cloud/webhook/leadmagnet-get

# N8N API Key
N8N_SECRET_KEY=your-secret-key-here

# Supabase (jo olemassa)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 📁 Supabase Storage Bucket

### Bucket: `leadmagnet`

- **Nimi:** `leadmagnet`
- **Public:** Ei (käytetään signed URLs:ia)
- **File size limit:** 100 MB
- **Allowed MIME types:** `video/mp4`, `video/webm`, `video/quicktime`

### Tiedostorakenne:

```
leadmagnet/
├── videos/
│   ├── abc123-def456.mp4
│   ├── ghi789-jkl012.mp4
│   └── ...
```

**Huom:** Tiedostonimi voi olla esim. token tai UUID.

## 🚀 Käyttöönotto

### 1. Luo Notion Database

1. Avaa Notion
2. Luo uusi Database (Table)
3. Lisää kentät yllä olevan taulukon mukaan
4. Kopioi Database ID URL:sta

### 2. Konfiguroi N8N

1. Luo uusi workflow N8N:ssä
2. Lisää **Notion credentials** (API token)
3. Rakenna workflow yllä olevien ohjeiden mukaan
4. Aktivoi workflow
5. Kopioi webhook URL

### 3. Konfiguroi Supabase

1. Mene Supabase Dashboard → Storage
2. Luo uusi bucket: `leadmagnet`
3. Aseta bucket **private**
4. Kopioi bucket URL ja Service Role Key

### 4. Päivitä .env.local

Lisää yllä mainitut ympäristömuuttujat.

### 5. Testaa

Testaa systeemiä:

```bash
# Testaa API endpoint
curl https://your-domain.com/api/leadmagnet/test-token-123
```

## 🧪 Testaus

### Notion-testi

1. Luo manuaalinen rivi Notionissa:
   - email: test@example.com
   - token: test-token-123
   - status: ready
   - video_path: videos/test.mp4
   - created_at: nyt

2. Lataa testi-video Supabase bucketiin: `videos/test.mp4`

3. Avaa selaimessa: `http://localhost:5173/leadmagnet/test-token-123`

### Odotetut tulokset:

- ✅ Sivu latautuu
- ✅ Video näkyy ja toistuu
- ✅ Notionissa `view_count` kasvaa
- ✅ `viewed_at` päivittyy

## 📊 Datan kulku

1. **Käyttäjä avaa linkin:** `/leadmagnet/{token}`
2. **Frontend:** `LeadMagnetPage.jsx` kutsuu API:a
3. **API:** `/api/leadmagnet/[token].js` kutsuu N8N webhookia
4. **N8N:** Hakee datan Notionista
5. **API:** Luo signed URL Supabase Storagesta
6. **Frontend:** Näyttää videon käyttäjälle
7. **API:** Päivittää katselukerrat N8N:n kautta

## 🔒 Turvallisuus

- **Token:** Uniikki UUID, vaikea arvata
- **Signed URLs:** Videot eivät ole julkisia, URL vanhenee 24h
- **N8N API Key:** Suojaa webhookit
- **RLS:** Supabase Row Level Security (ei käytössä Notionissa)

## 📧 Sähköpostimalli

Lähetä käyttäjälle sähköposti kun video on valmis:

**Aihe:** Videosi on valmis! 🎉

**Sisältö:**

```
Hei!

Henkilökohtainen videosi on nyt valmis katsottavaksi.

Katso video täältä:
👉 https://rascal.fi/leadmagnet/{token}

Videosi säilyy palvelussamme 30 päivää.

Terveisin,
Rascal AI Team
```

## 🆘 Ongelmanratkaisu

### Video ei lataudu

1. Tarkista että token on oikein
2. Tarkista Notionista että status = "ready"
3. Tarkista että `video_path` on oikein
4. Varmista että video löytyy Supabase bucketista

### N8N webhook ei vastaa

1. Tarkista että workflow on aktivoitu
2. Tarkista API key
3. Katso N8N execution history

### Signed URL ei toimi

1. Tarkista Supabase credentials
2. Varmista että bucket on olemassa
3. Tarkista että tiedosto löytyy

## 📝 Lisätietoja

- Rascal AI projekti käyttää **N8N webhookeja** kaikkiin ulkoisiin integrointeihin
- **Notion** toimii tietokantana lead magnet -käyttäjille
- **Supabase Storage** tallentaa videot turvallisesti
- Frontend on rakennettu **React + Vite** -stackilla

