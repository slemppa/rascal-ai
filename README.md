# MAK8D Dashboard

Moderni React-pohjainen dashboard-sovellus, joka näyttää tietoja tulevista julkaisuista, sähköposteista, tilaajista ja seuraavasta sukupolven ajasta. Tiedot haetaan Airtable-tietokannasta n8n:n kautta HTTP-kutsuilla.

## Ominaisuudet

- 🎨 Moderni ja responsiivinen käyttöliittymä
- 📊 Dashboard-näkymä keskeisille tiedoille
- 📝 Tulevien julkaisujen seuranta
- 📧 Sähköpostien tilastot ja analyysi
- 👥 Tilaajien hallinta ja seuranta
- ⏰ Seuraavan sukupolven ajan laskenta
- 🔄 Reaaliaikainen tietojen päivitys
- 📱 Mobiiliystävällinen design

## Teknologiat

- **React 19** - Moderni käyttöliittymä
- **Vite** - Nopea kehitysympäristö
- **Axios** - HTTP-kutsut
- **CSS Grid & Flexbox** - Responsiivinen layout
- **n8n** - Workflow-automaatio
- **Airtable** - Tietokanta

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

### n8n Webhook URL

Muokkaa `src/services/api.js` tiedostoa ja aseta oikea n8n webhook URL:

```javascript
const N8N_WEBHOOK_URL = 'https://your-n8n-instance.com/webhook/dashboard'
```

### Airtable Integraatio

n8n-workflow tulee konfiguroida hakemaan tietoja Airtable-tietokannasta ja palauttamaan ne seuraavassa muodossa:

```json
{
  "upcomingPosts": [
    {
      "id": 1,
      "title": "Julkaisun otsikko",
      "date": "2024-01-15",
      "status": "draft",
      "excerpt": "Julkaisun esikatselu..."
    }
  ],
  "emails": [
    {
      "id": 1,
      "subject": "Sähköpostin otsikko",
      "sent": "2024-01-10",
      "opens": 150,
      "clicks": 45,
      "unsubscribes": 2
    }
  ],
  "subscribers": [
    {
      "id": 1,
      "email": "user@example.com",
      "joined": "2024-01-01",
      "status": "active",
      "lastActivity": "2024-01-14"
    }
  ],
  "nextGenerationTime": "2024-01-25T10:00:00Z",
  "stats": {
    "totalSubscribers": 1250,
    "activeSubscribers": 1180,
    "averageOpenRate": 0.75,
    "averageClickRate": 0.25
  }
}
```

## Projektin rakenne

```
src/
├── App.jsx              # Pääkomponentti
├── App.css              # Tyylit
├── services/
│   └── api.js           # API-kutsut ja mock-data
└── assets/              # Kuvat ja muut resurssit
```

## Kehitys

### Mock-data

Sovellus käyttää tällä hetkellä mock-dataa testausta varten. Oikean n8n-integraation lisäämiseksi:

1. Kommentoi pois mock-data käyttö `App.jsx`:ssä
2. Poista kommentit API-kutsuista `api.js`:ssä
3. Aseta oikea n8n webhook URL

### Uusien ominaisuuksien lisääminen

1. Lisää uusi API-funktio `api.js`:ssä
2. Päivitä `App.jsx` käyttämään uutta dataa
3. Lisää tarvittavat CSS-tyylit `App.css`:ssä

## Skriptit

- `npm run dev` - Käynnistä kehityspalvelin
- `npm run build` - Rakenna tuotantoversio
- `npm run preview` - Esikatsele tuotantoversio
- `npm run lint` - Tarkista koodin laatu

## Lisenssi

MIT License
