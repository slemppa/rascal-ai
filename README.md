# Rascal AI Dashboard

Moderni React-pohjainen dashboard-sovellus, joka kokoaa markkinoinnin olennaiset tiedot yhteen näkymään: julkaisut, uutiskirjeet, tilaajat ja sisällöntuotannon aikataulut. Tiedot haetaan ulkoisista API-rajapinnoista (esim. n8n-workflow, webhookit).

## Ominaisuudet

- 🎨 Moderni ja responsiivinen käyttöliittymä
- 📊 Dashboard-näkymä keskeisille markkinointitiedoille
- 📝 Tulevien julkaisujen ja sähköpostien seuranta
- 👥 Tilaajien kasvu ja analytiikka
- ⏰ Sisällöntuotannon sykli ja seuraavan julkaisun aikataulu
- 🔄 Reaaliaikainen tietojen päivitys
- 📱 Mobiiliystävällinen design
- 🔐 Kirjautuminen modaalina etusivulla
- 🖼️ Oma favicon ja brändi-ilme

## Teknologiat

- **React** – Käyttöliittymä
- **Vite** – Nopea kehitysympäristö
- **Axios** – HTTP-kutsut
- **CSS (Flexbox & Grid)** – Responsiivinen ulkoasu
- **n8n** – Workflow-automaatio ja API-rajapinnat
- **Ulkoiset backendit/webhookit** – Datan haku

## Asennus ja käyttö

1. Kloonaa projekti:
```bash
git clone <repository-url>
cd mak8d
```

2. Asenna riippuvuudet:
```bash
npm install
```

3. Käynnistä kehityspalvelin:
```bash
npm run dev
```

4. Avaa selain osoitteeseen `http://localhost:5173`

## Konfiguraatio

### API/Webhook URL

Muokkaa `src/services/api.js` tiedostoa ja aseta oikeat API- tai webhook-osoitteet:

```javascript
const API_URL = 'https://your-backend-or-n8n-instance.com/webhook/...' 
```

### Datan rakenne

API:n palauttaman datan tulee olla muodossa:

```json
{
  "upcomingPosts": [ ... ],
  "emails": [ ... ],
  "subscribers": [ ... ],
  "nextGenerationTime": "...",
  "stats": { ... }
}
```

## Projektin rakenne

```
src/
├── App.jsx              # Pääkomponentti
├── App.css              # Tyylit
├── pages/               # Sivukomponentit (mm. LandingPage, DashboardPage)
├── services/
│   └── api.js           # API-kutsut ja mock-data
└── assets/              # Kuvat ja muut resurssit
public/
└── favicon.png          # Favicon ja muut julkiset resurssit
```

## Kehitys

- Sovellus käyttää mock-dataa, jos ulkoista APIa ei ole määritelty.
- Kirjautuminen avautuu modaalina etusivulla (ei erillistä kirjautumissivua).
- Ulkoasu ja brändi noudattavat Rascal AI -ilmettä.

## Skriptit

- `npm run dev` – Käynnistä kehityspalvelin
- `npm run build` – Rakenna tuotantoversio
- `npm run preview` – Esikatsele tuotantoversio
- `npm run lint` – Tarkista koodin laatu

## Lisenssi

MIT License
