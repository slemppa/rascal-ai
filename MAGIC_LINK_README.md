# Magic Link -toiminnallisuus

Tämä dokumentti selittää magic link -kirjautumistoiminnallisuuden toteutuksen.

## Yleiskatsaus

Magic link -toiminnallisuus mahdollistaa käyttäjien kirjautumisen ilman salasanaa. Käyttäjä saa sähköpostitse linkin, joka sisältää turvallisen tokenin. Token on voimassa 1 tunnin ajan.

## Komponentit

### 1. MagicLinkHandler (`src/components/MagicLinkHandler.jsx`)

Käsittelee magic link -URL:n ja validoi tokenin.

**Toiminnot:**
- Lukee `magic-token` URL-parametrin
- Dekoodaa base64-muodosta
- Validoi tokenin muodon (`email|timestamp`)
- Tarkistaa että token ei ole vanhentunut (yli 1 tunti vanha)
- Tallentaa tokenin ja emailin localStorageen
- Ohjaa käyttäjän etusivulle

**URL-muoto:**
```
https://sovellus.fi/magic-link?magic-token=dGVzdEBleGFtcGxlLmNvbXwxNzIwMDAwMDAwMDAw
```

### 2. SetPasswordForm (`src/components/SetPasswordForm.jsx`)

Näytetään käyttäjälle magic link -kirjautumisen jälkeen.

**Toiminnot:**
- Näyttää käyttäjän sähköpostin (ei muokattavissa)
- Mahdollistaa salasanan asettamisen
- Validoi salasanan (vähintään 8 merkkiä)
- Lähettää salasanan N8N:ään
- Kirjaa käyttäjän ulos ja ohjaa kirjautumissivulle

### 3. API Endpoint (`api/set-password.js`)

Käsittelee salasanan asettamisen.

**Toiminnot:**
- Validoi syötteet
- Lähettää pyynnön N8N:ään
- Palauttaa vastauksen frontendille

## Token-rakenne

Magic link -token koostuu kahdesta osasta:

```
email|timestamp
```

**Esimerkki:**
```
test@example.com|1720000000000
```

Token enkoodataan base64-muotoon URL:ssa käyttämistä varten.

## Reititys

### Kirjautumattomat käyttäjät:
- `/magic-link` - Magic link -käsittely
- `/set-password` - Salasanan asettaminen
- `/login` - Normaali kirjautuminen
- `/*` - Etusivu (LandingPage)

### Kirjautuneet käyttäjät:
- `/set-password` - Salasanan asettaminen (jos magic link -token on olemassa)
- Muut normaalit reitit...

## Käyttöliittymä

### Magic Link -käsittely
1. **Loading-tila**: Näyttää spinnerin ja "Käsitellään kirjautumista..."
2. **Virhetila**: Näyttää virheilmoituksen ja "Siirry etusivulle" -napin
3. **Onnistumistila**: Näyttää vahvistuksen ja ohjaa automaattisesti

### Salasanan asettaminen
1. **Lomake**: Sähköposti (ei muokattavissa) + salasanakentät
2. **Validointi**: Salasanan pituus ja täsmäys
3. **Onnistumistila**: Vahvistus ja automaattinen uloskirjautuminen

## Tietoturva

### Token-validointi:
- Base64-dekoodaus
- Muodon tarkistus (`email|timestamp`)
- Aikaleiman validointi (max 1 tunti)
- Virheenkäsittely

### Salasanan asettaminen:
- Vähintään 8 merkkiä
- Salasanan vahvistus
- HTTPS-yhteys N8N:ään
- API-avaimen käyttö

## Testaus

Käytä `test-magic-link.html` -tiedostoa testataksesi:

1. Avaa `test-magic-link.html` selaimessa
2. Syötä sähköposti ja luo magic link
3. Kopioi luotu URL
4. Avaa URL uudessa välilehdessä
5. Testaa salasanan asettaminen

## N8N-integraatio

### Tarvittavat webhook-endpointit:

1. **Salasanan asettaminen** (`N8N_SET_PASSWORD_URL`):
   - Vastaanottaa: `{ email, password, action: 'set-password' }`
   - Päivittää Airtableen käyttäjän salasanan
   - Palauttaa: `{ success: true/false, message: '...' }`

### Ympäristömuuttujat:
```env
N8N_SET_PASSWORD_URL=https://your-n8n-instance.com/webhook/set-password
N8N_SECRET_KEY=your-secret-key
```

## Virheenkäsittely

### Magic Link -virheet:
- Token puuttuu
- Virheellinen base64-muoto
- Virheellinen token-rakenne
- Vanhentunut token
- Odottamaton virhe

### Salasanan asettamisen virheet:
- Puuttuvat syötteet
- Liian lyhyt salasana
- Salasanat eivät täsmää
- N8N-yhteysvirhe

## Kehitys

### Lisääminen uusiin projekteihin:
1. Kopioi komponentit `src/components/` -kansioon
2. Lisää API-endpoint `api/` -kansioon
3. Päivitä reititys `App.jsx`:ssä
4. Lisää ympäristömuuttujat
5. Konfiguroi N8N-webhook

### Muokattavat osat:
- Token-voimassaoloaika (tällä hetkellä 1 tunti)
- Salasanan vaatimukset (tällä hetkellä 8 merkkiä)
- UI-tyylit ja värit
- Virheilmoitukset ja tekstit 