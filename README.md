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

### 🔧 Hallinta ja automatisointi
- **Mass-call Management** - Suurten puhelukampanjoiden hallinta
- **Content Management** - Sisällön hallinta ja aikataulutus
- **User Management** - Käyttäjien ja oikeuksien hallinta
- **Integration Hub** - Yhteydet muihin järjestelmiin

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

```
```