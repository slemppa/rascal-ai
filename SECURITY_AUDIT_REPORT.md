# Turvallisuustarkistusraportti (Security Audit Report)

**Päivämäärä:** 2025-01-27  
**Tarkistettu koodipohja:** Rascal AI  
**Tarkistus:** Automaattinen koodin tarkistus yleisimmät haavoittuvuudet

---

## Yhteenveto

Tämä raportti esittelee löydetyt turvallisuushaavoittuvuudet ja suositukset parannuksille. Suurin osa koodista on turvallisesti toteutettu Supabasen RLS-politiikkojen ja parametrisoitujen kyselyiden avulla, mutta on löydetty muutamia kohtia, jotka tarvitsevat huomiota.

### Riskitasot
- 🔴 **Kriittinen:** Välitön korjaus suositeltava
- 🟠 **Korkea:** Korjaus suositeltava lähiaikoina
- 🟡 **Keskitaso:** Korjaus suositeltava kun aika sallii
- 🟢 **Matala:** Informatiivinen huomio

---

## 1. SQL-injektio (SQL Injection)

### 1.1 🔴 KRIITTINEN: Käyttäjän syötteen yhdistäminen .ilike() -kyselyihin

**Sijainti:**
- `src/pages/CallPanel.jsx` (rivit 1454, 1560)
- `src/pages/VastaajaPage.jsx` (rivi 293)

**Ongelma:**
Käyttäjän syöte yhdistetään suoraan `.ilike()` -kyselyihin merkkijonoyhdistelmänä, mikä voi johtaa SQL-injektioon, jos Supabase-kirjasto ei escapaa syötettä oikein kaikissa tapauksissa.

```javascript
// VULNERABILITEETTI:
query = query.or(`customer_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
```

**Riski:**
Vaikka Supabase PostgREST API yleensä escapaa syötteen, on tämä kuitenkin riskialtista, koska:
1. Merkkijonoyhdistelmä tehdään JavaScript-puolella
2. Jos `searchTerm` sisältää erikoismerkkejä (%, _, \, '), ne voivat muuttaa kyselyn käyttäytymistä
3. Jos tulevaisuudessa käytetään muuta query-builderia, koodi on haavoittuva

**Korjausehdotus:**
Käytä parametrisoituja kyselyitä. Supabasen `.ilike()` tukee parametrisoitua muotoa:

```javascript
// TURVALLINEN VERSIO:
if (searchTerm) {
  // Escapetaan erikoismerkit
  const escapedSearchTerm = searchTerm.replace(/[%_\\]/g, '\\$&')
  query = query.or(
    `customer_name.ilike.%${escapedSearchTerm}%,` +
    `phone_number.ilike.%${escapedSearchTerm}%,` +
    `email.ilike.%${escapedSearchTerm}%`
  )
}

// TAI parempi: käytä useita erillisiä filttereitä:
if (searchTerm) {
  const pattern = `%${searchTerm.replace(/[%_\\]/g, '\\$&')}%`
  query = query.or(
    `customer_name.ilike."${pattern}",phone_number.ilike."${pattern}",email.ilike."${pattern}"`
  )
}
```

**Vaihtoehtoinen ratkaisu (suositeltu):**
Jos mahdollista, käytä useita `.ilike()` -kutsuja `.or()`:n sijaan, tai toteuta haku JavaScript-puolella rajatun määrän tulosten osalta.

---

## 2. Arkaluonteisten tietojen paljastuminen (Sensitive Data Exposure)

### 2.1 🟠 KORKEA: Ympäristömuuttujien osittaista paljastumista virheilmoituksissa

**Sijainti:**
- `api/test/n8n.js` (rivi 30)

**Ongelma:**
Virheilmoituksissa paljastetaan osittain ympäristömuuttujien arvoja, mikä voi antaa hyökkääjälle tietoa järjestelmän rakenteesta.

```javascript
workflowUrl: hasWorkflowUrl ? process.env.N8N_WORKFLOW_URL.substring(0, 50) + '...' : 'missing'
```

**Riski:**
- Paljastaa URL-rakenteita, joita voidaan käyttää hyökkäyksissä
- Antaa tietoa järjestelmän konfiguraatiosta

**Korjausehdotus:**
Älä paljasta ympäristömuuttujien arvoja edes osittain tuotantoympäristössä:

```javascript
config: {
  hasWorkflowUrl,
  hasSecretKey,
  // workflowUrl: poista tämä tuotannosta
}
```

### 2.2 🟡 KESKITASO: Token-preview virheilmoituksissa

**Sijainti:**
- `api/test/auth-debug.js` (rivit 58-59)

**Ongelma:**
Virheilmoituksissa näytetään tokenin alkuosa, mikä voi antaa tietoa tokenin rakenteesta.

```javascript
tokenPreview: token.substring(0, 20) + '...'
```

**Korjausehdotus:**
Poista token-preview tuotantoympäristöstä tai näytä vain development-moodissa.

---

## 3. Syötteen validointi (Input Validation)

### 3.1 🟠 KORKEA: Puutteellinen syötteen validointi useissa API-reiteissä

**Sijainti:**
Useita API-reittejä, esimerkiksi:
- `api/strategy/index.js` (rivit 15-24)
- `api/campaigns/create.js`
- `api/leads/scraping/index.js`

**Ongelma:**
Monissa API-reiteissä käyttäjän syötettä ei validoida riittävästi ennen käsittelyä:
- Query-parametrit otetaan suoraan `req.query` -objektista ilman validointia
- Ei tarkisteta tietotyyppejä (esim. `companyId` ja `userId` pitäisi olla merkkijonoja)
- Ei tarkisteta pituuksia tai muotoa
- Ei sanitoida syötettä

**Esimerkki ongelmakohdasta:**
```javascript
const companyId = req.query.companyId
const userId = req.query.userId

if (!companyId) {
  return res.status(400).json({ error: 'company_id puuttuu' })
}
// Ei validoida että companyId on validi UUID tai muoto
```

**Korjausehdotus:**
Luo yhteinen validointimoduuli tai käytä kirjastoa kuten `zod` tai `joi`:

```javascript
// api/lib/validation.js
export function validateUUID(value, fieldName) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!value || typeof value !== 'string' || !uuidRegex.test(value)) {
    throw new Error(`Invalid ${fieldName}: must be a valid UUID`)
  }
  return value
}

// Käyttö:
try {
  const companyId = validateUUID(req.query.companyId, 'companyId')
  const userId = validateUUID(req.query.userId, 'userId')
} catch (error) {
  return res.status(400).json({ error: error.message })
}
```

### 3.2 🟡 KESKITASO: Salasanan validointi

**Sijainti:**
- `api/auth/set-password.js` (rivi 19)

**Ongelma:**
Salasanan validointi tarkistaa vain pituuden, ei muita kriteerejä (iso kirjain, numero, erikoismerkki).

**Nykyinen koodi:**
```javascript
if (password.length < 8) {
  return res.status(400).json({ 
    success: false, 
    message: 'Salasanan tulee olla vähintään 8 merkkiä pitkä' 
  })
}
```

**Korjausehdotus:**
Lisää vahvempi validointi (vapaaehtoinen, mutta suositeltava):

```javascript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
if (!passwordRegex.test(password)) {
  return res.status(400).json({ 
    success: false, 
    message: 'Salasanan tulee olla vähintään 8 merkkiä pitkä ja sisältää iso kirjain, numero ja erikoismerkki' 
  })
}
```

---

## 4. XSS (Cross-Site Scripting)

### 4.1 🟢 MATALA: React automaattinen escapaus

**Hyvä uutinen:**
Koodista ei löytynyt `dangerouslySetInnerHTML` -käyttöä, mikä on hyvä merkki. React escapaa automaattisesti kaiken tekstisisällön, joten XSS-riski on matala.

**Huomio:**
Jos tulevaisuudessa tarvitaan HTML-sisällön renderöintiä, käytä:
1. `dompurify` -kirjastoa HTML-sanitointiin
2. Tarkista että `dangerouslySetInnerHTML` -käyttöä varten on selkeä syy
3. Dokumentoi miksi escapaus on poistettu

---

## 5. Autentikointi ja autorisointi

### 5.1 🟢 HYVÄ: Token-validointi

**Positiivinen huomio:**
Autentikointi on toteutettu hyvin:
- JWT-tokenit validoidaan Supabasen `getUser()` -metodilla
- Middleware (`withOrganization`) varmistaa autentikoinnin ennen pääsyä suojattuihin reitteihin
- RLS-politiikat tietokannassa rajoittavat datan näkyvyyttä

### 5.2 🟡 KESKITASO: Salasanat logitetussa muodossa

**Sijainti:**
- `api/auth/set-password.js` (rivi 26)

**Ongelma:**
Salasana logitetaan selkokielisessä muodossa:

```javascript
console.log('Lähetetään N8N:ään:', { email, password, action: 'set-password' })
```

**Korjausehdotus:**
Älä koskaan logita salasanoja:

```javascript
console.log('Lähetetään N8N:ään:', { email, action: 'set-password', hasPassword: !!password })
```

---

## 6. Muut turvallisuusongelmat

### 6.1 🟡 KESKITASO: Puutteellinen rate limiting

**Ongelma:**
Koodista ei löytynyt rate limiting -toteutusta API-reiteille. Tämä voi johtaa:
- Brute force -hyökkäyksiin
- DDoS-hyökkäyksiin
- API-kustannusten nousuun

**Korjausehdotus:**
Ota käyttöön rate limiting esimerkiksi:
- Vercel Edge Middleware
- Upstash Redis + serverless funktiot
- Vercel Middleware rate limiting

### 6.2 🟢 MATALA: CORS-konfiguraatio

**Hyvä uutinen:**
CORS-konfiguraatio on toteutettu (`api/lib/cors.js`) ja ympäristömuuttujien mukaan konfiguroitavissa.

### 6.3 🟡 KESKITASO: Error handling paljastaa liikaa tietoa

**Ongelma:**
Useissa API-reiteissä error-viestit paljastavat liikaa teknisestä rakenteesta:

```javascript
return res.status(500).json({ 
  error: 'Internal server error',
  details: error.message  // Voi paljastaa tietokantatauluja, kenttiä jne.
})
```

**Korjausehdotus:**
Tuotannossa näytä vain yleisiä virheilmoituksia:

```javascript
const isDevelopment = process.env.NODE_ENV === 'development'
return res.status(500).json({ 
  error: 'Internal server error',
  ...(isDevelopment && { details: error.message })
})
```

---

## 7. Ympäristömuuttujat ja salaisuudet

### 7.1 🟢 HYVÄ: Salaus käyttäjien salaisuuksille

**Positiivinen huomio:**
Käyttäjien salaisuudet salataan oikein (`api/lib/crypto.js`) käyttäen AES-256-GCM -salausalgoritmia. Tämä on hyvä toteutus.

### 7.2 🟢 HYVÄ: Ympäristömuuttujien käyttö

**Positiivinen huomio:**
Salaisuudet (API-avaimet, tietokanta-avaimet) tallennetaan ympäristömuuttujina, eikä ne ole hardkoodattuja koodiin.

---

## Yhteenveto ja suositukset priorisointijärjestyksessä

### Prioriteetti 1 (Kriittinen - korjaa heti):
1. **Korjaa SQL-injektioriski** `.ilike()` -kyselyissä (CallPanel.jsx, VastaajaPage.jsx)

### Prioriteetti 2 (Korkea - korjaa lähiaikoina):
2. **Poista ympäristömuuttujien osittaista paljastumista** virheilmoituksista
3. **Paranna syötteen validointia** useissa API-reiteissä
4. **Poista salasanojen logitus**

### Prioriteetti 3 (Keskitaso - korjaa kun aika sallii):
5. **Toteuta rate limiting** API-reiteille
6. **Paranna error handlingia** jotta se ei paljasta liikaa tietoa tuotannossa
7. **Paranna salasanan validointia**

### Prioriteetti 4 (Matala - informatiivinen):
8. **Dokumentoi** XSS-suojausstrategiaa jos tulevaisuudessa tarvitaan HTML-renderöintiä

---

## Yleiset parannusehdotukset

1. **Käyttöönotto lint-työkalu** (esim. ESLint security-plugin)
2. **Automaattiset turvallisuustestit** CI/CD-pipelineen
3. **Koodikatselmukset** ennen tuotantoon viemistä
4. **Turvallisuuskoulutus** kehittäjille
5. **Säännölliset turvallisuusauditoinnit** (esim. puolivuosittain)

---

## Positiiviset löydökset

✅ **Hyvä RLS-käyttö:** Supabase RLS-politiikat rajoittavat datan näkyvyyttä oikein  
✅ **Token-validointi:** Autentikointi toteutettu turvallisesti  
✅ **Salaus:** Käyttäjien salaisuudet salataan oikein  
✅ **Ei XSS-riskiä:** React automaattinen escapaus käytössä  
✅ **Ympäristömuuttujat:** Salaisuudet eivät ole hardkoodattuja  

---

**Raportin laatija:** Automaattinen turvallisuustarkistus  
**Seuraava tarkistus:** Suositeltu 6 kuukauden kuluttua