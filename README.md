# Rascal AI Dashboard

Moderni React-pohjainen dashboard-sovellus markkinointitiimille. Sovellus tarjoaa keskitetyn näkymän markkinointitoimintojen seurantaan ja hallintaan.

## Ominaisuudet

- 🎨 Moderni ja responsiivinen käyttöliittymä
- 📊 Dashboard-näkymä keskeisille markkinointitiedoille
- 📝 Sisällönhallinta ja aikataulutus
- 👥 Tilaajien seuranta ja analytiikka
- ⏰ Sisällöntuotannon sykli ja aikataulut
- 🔄 Reaaliaikainen tietojen päivitys
- 📱 Mobiiliystävällinen design
- 🔐 Turvallinen kirjautuminen
- 🤖 AI-pohjainen chat-toiminto
- 📁 Tiedostojen hallinta ja käsittely

## Teknologiat

- **React** – Käyttöliittymä
- **Vite** – Nopea kehitysympäristö
- **CSS (Flexbox & Grid)** – Responsiivinen ulkoasu
- **Lingui** – Monikielisyys

## Asennus ja käyttö

1. Kloonaa projekti:
```bash
git clone <repository-url>
cd rascal-ai
```

2. Asenna riippuvuudet:
```bash
npm install
```

3. Luo ympäristömuuttujatiedosto:
```bash
cp .env.example .env.local
```

4. Muokkaa `.env.local` tiedostoa ja lisää tarvittavat ympäristömuuttujat.

5. Käynnistä kehityspalvelin:
```bash
npm run dev
```

6. Avaa selain osoitteeseen `http://localhost:5173`

## Ympäristömuuttujat

### Frontend (.env.local)

Luo `.env.local` tiedosto projektin juureen ja lisää tarvittavat ympäristömuuttujat:

```env
# API-avain
VITE_API_KEY=your_api_key_here

# Chat-webhook URL (AI-chat-toimintoon)
VITE_CHAT_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-chat-webhook-id
```

### Backend API (.env.local)

Backend API:t tarvitsevat seuraavat ympäristömuuttujat:

```env
# N8N Webhook URL:t
N8N_LOGIN_URL=https://your-n8n-instance.com/webhook/your-login-webhook-id
N8N_GET_POSTS_URL=https://your-n8n-instance.com/webhook/your-get-posts-webhook-id
N8N_UPDATE_POST_URL=https://your-n8n-instance.com/webhook/your-update-post-webhook-id
N8N_STRATEGY_URL=https://your-n8n-instance.com/webhook/your-strategy-webhook-id
N8N_VECTOR_STORE_FILES_URL=https://your-n8n-instance.com/webhook/your-vector-store-webhook-id
N8N_KNOWLEDGE_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-knowledge-upload-webhook-id
```

### Tarvittavat endpointit

Sovellus käyttää seuraavia endpointteja:

- **VITE_API_KEY**: API-avain autentikaatioon
- **VITE_CHAT_WEBHOOK_URL**: Webhook-osoite AI-chat-toimintoon
- **N8N_*_URL**: Backend API:n käyttämät N8N webhook-osoitteet
- **Omat API-reitit**: Sovellus käyttää omia `/api/`-reittejä backend-toiminnoille

Kaikki webhook-osoitteet tulee olla HTTPS-osoitteita ja vastata oikeaa data-formaattia.

## Projektin rakenne

```
src/
├── App.jsx              # Pääkomponentti
├── App.css              # Tyylit
├── pages/               # Sivukomponentit
│   ├── DashboardPage.jsx
│   ├── AIChatPage.jsx
│   ├── ContentStrategyPage.jsx
│   └── ...
├── components/          # Yhteiset komponentit
├── services/            # API-palvelut
├── locales/             # Kielitiedostot
└── assets/              # Kuvat ja muut resurssit
```

## Kehitys

- Sovellus tukee monikielisyyttä (suomi/englanti)
- Responsiivinen design toimii kaikilla laitteilla
- Modulaarinen komponenttirakenne

## Skriptit

- `npm run dev` – Käynnistä kehityspalvelin
- `npm run build` – Rakenna tuotantoversio
- `npm run preview` – Esikatsele tuotantoversio
- `npm run lint` – Tarkista koodin laatu

## Tuotantoversio

Rakenna tuotantoversio:

```bash
npm run build
```

Tuotantoversio luodaan `dist/` kansioon.

## Lisenssi

MIT License
