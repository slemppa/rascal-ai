# Rascal AI - Ammattimainen AI-pohjainen markkinointi- ja myyntityökalu

Moderni React-pohjainen sovellus, joka auttaa markkinointi- ja myyntitiimejä automatisoimaan rutiineja ja keskittymään voittaviin asiakaskohtaamisiin.

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

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Keys
VITE_API_KEY=your_api_key

# N8N Webhooks
N8N_LOGIN_URL=https://your-n8n-instance.com/webhook/your-login-webhook-id
N8N_GET_POSTS_URL=https://your-n8n-instance.com/webhook/your-get-posts-webhook-id
N8N_STRATEGY_URL=https://your-n8n-instance.com/webhook/your-strategy-webhook-id
N8N_VECTOR_STORE_FILES_URL=https://your-n8n-instance.com/webhook/your-vector-store-webhook-id
```

### 4. Käynnistä kehityspalvelin
```bash
npm run dev
```

Sovellus on saatavilla osoitteessa `http://localhost:5173`

## 📱 Responsiivinen Design

- **Desktop-first** - Optimoitu työpöydälle
- **Mobile-friendly** - Toimii kaikilla mobiililaitteilla
- **Bentogrid-layout** - Moderni ja ammattimainen asettelu
- **Dark theme** - Tumma teema ammattikäyttöön

## 🔐 Autentikaatio ja turvallisuus

- **Supabase Auth** - Turvallinen kirjautuminen
- **JWT Tokens** - Session hallinta
- **Role-based Access** - Käyttäjäoikeudet
- **Auto-logout** - Automaattinen uloskirjautuminen

## 📊 API Ominaisuudet

### Mass-call API
- **Google Sheets integraatio** - Puhelinnumerot CSV:stä
- **Estettyjen numeroiden filtteri** - Estää 020, 010, 09 alkuiset numerot
- **Automaattinen normalisointi** - Suomalaiset numerot +358 muotoon
- **Call logging** - Kaikki puhelut tallennetaan

### Validate-sheet API
- **CSV validointi** - Tarkistaa Google Sheets tiedoston
- **Estettyjen numeroiden raportti** - Näyttää ongelmat etukäteen
- **Puhelinnumeroiden validointi** - Tarkistaa numeroiden kelvollisuuden

## 🚀 Kehitys

### Skriptit
```bash
npm run dev          # Kehityspalvelin
npm run build        # Tuotantoversio
npm run preview      # Esikatsele tuotantoversio
npm run lint         # Koodin laadun tarkistus
npm run release      # Automaattinen versionhallinta
```

### Commit Standardit
- **Conventional Commits** - Standardoidut commit-viestit
- **Auto-versioning** - Automaattinen versionumero ja changelog
- **Husky Hooks** - Git-hookit ennen committia

## 🌐 Tuotantoversio

### Vercel Deploy
```bash
npm run build
vercel --prod
```

### Docker (vaihtoehto)
```bash
docker build -t rascal-ai .
docker run -p 3000:3000 rascal-ai
```

## 📚 Dokumentaatio

- **TECH_STACK_MYNTI.md** - Teknologiapinon kuvaus
- **CSS_ARCHITECTURE.md** - CSS-arkkitehtuuri
- **VERSIONING.md** - Versionhallinta
- **AUTO_LOGOUT_README.md** - Automaattinen uloskirjautuminen

## 🤝 Contributing

1. Fork projekti
2. Luo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit muutokset (`git commit -m 'Add some AmazingFeature'`)
4. Push branch (`git push origin feature/AmazingFeature`)
5. Avaa Pull Request

## 📄 Lisenssi

MIT License - katso [LICENSE](LICENSE) tiedosto lisätietoja varten.

## 🆘 Tuki

Jos kohtaat ongelmia:
1. Tarkista [Issues](https://github.com/username/rascal-ai/issues)
2. Avaa uusi issue kuvaamalla ongelman
3. Ota yhteyttä kehitystiimiin

---

**Rascal AI** - Vapauta myyjäsi rutiineista ja anna heidän keskittyä voittaviin asiakaskohtaamisiin! 🚀