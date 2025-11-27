# Rascal AI - Ammattimainen AI-pohjainen markkinointi- ja myyntityökalu

Rascal AI on täyden stackin myynnin ja markkinoinnin sovellus, joka yhdistää kampanjoiden ja segmenttien hallinnan, massapuhelut Google Sheets ‑datasta, CRM‑kontaktien haun sekä reaaliaikaisen analytiikan yhdeksi saumattomaksi kokonaisuudeksi. Frontend on rakennettu Reactilla (Vite, React Router) ja julkaisu toteutetaan Vercelin serverless‑/api‑reittien kautta. Kaikki kolmansien osapuolien HTTP‑kutsut kulkevat omien `/api/`‑endpointtien läpi, ja tiedot sekä autentikointi hoidetaan Supabasella (RLS käytössä).

Käyttöoikeudet ja näkyvät toiminnot määräytyvät käyttäjäkohtaisilla feature‑lipuilla (`public.users.features`, `text[]`) sekä adminin hallitsemalla “CRM yhdistetty” ‑kytkimellä (`public.users.crm_connected`). Featuret haetaan backendista endpointilla `/api/user-features` ja hyödynnetään frontissa `useFeatures().has(name)`‑kutsulla (esim. `Sidebar.jsx`, `CallPanel.jsx`). CRM‑tabi on näkyvissä vain, jos käyttäjällä on “CRM”‑feature ja `crm_connected = true`; kytkin on muokattavissa `/admin` → “Käyttäjät” näkymässä visuaalisella vivulla.

Tietovirta on suojattu JWT:llä: frontend välittää Bearer‑tokenin omille `/api/`‑reiteille, joissa luodaan käyttäjän tokenilla Supabase‑client, jolloin RLS rajoittaa näkyvyyden. API‑reiteissä mapataan `auth.users.id → public.users.id` ennen hakuja/inserttejä (kampanjat ja segmentit). Kampanja‑ ja segmenttien yksityiskohdat avataan modaaleihin sivunvaihdon sijasta. Massapuheluissa valitaan olemassa oleva kampanja (pakollinen) ja segmentti (valinnainen); tiedot kirjataan `call_logs`‑tauluun viittauksilla `new_campaign_id` ja `contact_segment_id`. Dashboard hakee onnistumismetriikat `/api/dashboard-success`‑endpointilta sekä kampanjakohtaiset tilastot `/api/campaigns`‑reitiltä.

## 🚀 Pääominaisuudet

### 🤖 AI-pohjaiset toiminnot
- **Älykkäät soitot** - Outbound- ja inbound-soitot soittoskriptin mukaisesti
- **Sisältöstrategia** - Rakentaa sisältöstrategian ihanneasiakasprofiilin mukaisesti
- **Sisällöntuotanto** - Luo sisältöaihiot moneen eri kanavaan yrityksen tiedon pohjalta
- **Automaattinen raportointi** - Raportoi kaikki puhelut, keskustelut ja jatkotoimenpiteet
- **AI Chat** - Älykäs chat-toiminto markkinointi- ja myyntikysymyksiin

### 📊 Analytics ja seuranta
- **Dashboard** - Keskitetty näkymä markkinointitoimintojen seurantaan
- **Call Analytics** - Puheluiden analyysi ja raportointi
- **Social Media Analytics** - Sosiaalisen median seuranta ja analyysi
- **Content Performance** - Sisällön suorituskyvyn seuranta
- **Google Analytics Integration** - Sivuston kävijätiedot dashboardissa (OAuth 2.0)

### 🔧 Hallinta ja automatisointi
- **Mass-call Management** - Suurten puhelukampanjoiden hallinta
- **Content Management** - Sisällön hallinta ja aikataulutus
- **User Management** - Käyttäjien ja oikeuksien hallinta
- **Integration Hub** - Yhteydet muihin järjestelmiin (Google Analytics, WordPress, jne.)

## 🛠️ Teknologiat

### Frontend
- **React 19** - Moderni käyttöliittymä
- **Vite** - Nopea kehitysympäristö
- **CSS Grid & Flexbox** - Responsiivinen ja ammattimainen design
- **React Router** - Sivunavigaatio

### Backend & API
- **Supabase** - Tietokanta ja autentikaatio
- **Vercel Functions** - Serverless API:t
- **N8N Integration** - Workflow-automatisointi
- **JWT Authentication** - Turvallinen kirjautuminen

### Työkalut
- **Husky** - Git hooks
- **Standard Version** - Automaattinen versionhallinta
- **ESLint** - Koodin laadun tarkistus
- **Commitlint** - Commit-viestien standardointi

## 📁 Projektin rakenne

```
rascal-ai/
├── src/
│   ├── pages/           # Sivukomponentit
│   │   ├── LandingPage.jsx      # Etusivu (ammattimainen design)
│   │   ├── DashboardPage.jsx    # Dashboard
│   │   ├── AIChatPage.jsx       # AI Chat
│   │   ├── CallPanel.jsx        # Puheluiden hallinta
│   │   └── ...
│   ├── components/      # Yhteiset komponentit
│   │   ├── auth/        # Autentikaatiokomponentit
│   │   ├── Sidebar.jsx  # Sivupalkki
│   │   └── ...
│   ├── contexts/        # React Contextit
│   ├── services/        # API-palvelut
│   └── lib/            # Apukirjastot
├── api/                 # Backend API:t
│   ├── mass-call.js     # Mass-call hallinta
│   ├── validate-sheet.js # Google Sheets validointi
│   ├── analytics.js     # Analytics API
│   ├── google-analytics-visitors.js # Google Analytics kävijätiedot
│   ├── auth/google/     # Google OAuth 2.0 integraatio
│   └── ...
├── public/              # Julkiset tiedostot
└── docs/                # Dokumentaatio
```

## 🚀 Asennus ja käyttö

### 1. Kloonaa projekti
```bash
git clone <repository-url>
cd rascal-ai
```

### 2. Asenna riippuvuudet
```bash
npm install
```

### 3. Ympäristömuuttujat
Luo `.env.local` tiedosto projektin juureen:

```bash
# Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Analytics OAuth (vapaaehtoinen)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://app.rascalai.fi/api/auth/google/callback

# N8N Integration
N8N_SECRET_KEY=your-n8n-secret-key
N8N_INTEGRATION_WEBHOOK_URL=https://your-n8n-instance.com/webhook/google-analytics
N8N_GOOGLE_ANALYTICS_VISITORS_URL=https://your-n8n-instance.com/webhook/google-analytics-visitors

# User Secrets Encryption (pakollinen salattujen tietojen tallennukseen)
USER_SECRETS_ENCRYPTION_KEY=your-encryption-key

# Muut N8N webhookit (vapaaehtoisia)
N8N_LEADMAGNET_GET=https://your-n8n-instance.com/webhook/leadmagnet-get
# ... lisää muita webhookeja tarpeen mukaan
```

**Huom:** Tarkemmat ohjeet integraatioiden asettamiseen löytyvät `docs/`-kansiosta:
- `docs/GOOGLE_ANALYTICS_OAUTH_SETUP.md` - Google Analytics OAuth 2.0
- `docs/INTEGRATION_WEBHOOKS.md` - Integraatioiden webhookit
- `docs/USER_SECRETS_SETUP.md` - Salattujen tietojen hallinta

### 4. Käynnistä kehityspalvelin
```bash
npm run dev
```

Sovellus on nyt saatavilla osoitteessa `http://localhost:5173`

## 📚 Dokumentaatio

Projektissa on laaja dokumentaatio `docs/`-kansiossa:

- **GOOGLE_ANALYTICS_OAUTH_SETUP.md** - Google Analytics OAuth 2.0 -integraation asettaminen
- **INTEGRATION_WEBHOOKS.md** - Integraatioiden webhookit ja automaatiot
- **USER_SECRETS_SETUP.md** - Käyttäjien salattujen tietojen hallinta
- **LEADMAGNET_SETUP.md** - Lead Magnet -toiminnallisuuden asettaminen
- **CSS_ARCHITECTURE.md** - CSS-arkkitehtuuri ja tyylit
- **VERSIONING.md** - Versionhallinta ja changelog

## 🔗 API Endpointit

### Analytics
- `GET /api/google-analytics-visitors` - Hakee Google Analytics -kävijätiedot N8N:stä
- `GET /api/analytics` - Yleinen analytics API
- `GET /api/dashboard-success` - Dashboardin onnistumismetriikat

### Autentikointi
- `GET /api/auth/google/start` - Aloittaa Google OAuth 2.0 -virran
- `GET /api/auth/google/callback` - Käsittelee Google OAuth -callbackin

### Integraatiot
- `GET /api/user-secrets` - Hakee käyttäjän integraatiot (metadata)
- `POST /api/user-secrets` - Tallentaa uuden integraation
- `GET /api/user-secrets-service` - Service-to-service endpoint salattujen tietojen hakemiseen

Katso tarkemmat API-dokumentaatiot `docs/`-kansiosta.

## 🚀 Julkaisu

Projekti julkaistaan Vercelissä. Muista asettaa kaikki ympäristömuuttujat Vercel Dashboardissa ennen julkaisua.

## 📝 Lisenssi

Proprietary - Kaikki oikeudet pidätetään.
```