# Auto-Logout -ominaisuus

## Yleiskatsaus

Auto-logout -ominaisuus automaattisesti kirjaa käyttäjän ulos sovelluksesta, jos käyttäjä on ollut inaktiivinen määritellyn ajan. Ominaisuus sisältää varoitusdialogin, joka näkyy 5 minuuttia ennen automaattista logoutia.

## Ominaisuudet

### Perustoiminnot
- **Oletusarvoinen timeout**: 20 minuuttia
- **Varoitusdialogi**: 5 minuuttia ennen logoutia
- **Aktiviteetin tunnistus**: Hiiri, näppäimistö, kosketus, scrollaus
- **Kontekstikohtaiset timeoutit**: Eri sivujen eri timeout-asetukset
- **Käyttäjän asetukset**: Mahdollisuus muokata timeout-asetuksia

### Kontekstikohtaiset timeoutit
- **Dashboard/Analytics**: 20 minuuttia (oletus)
- **Content Creation/Campaign Setup**: 45 minuuttia
- **Settings/Admin**: 15 minuuttia
- **AI Phone Setup**: 15 minuuttia (arkaluontoinen)

### Lisäominaisuudet
- **Välilehtien synkronointi**: BroadcastChannel API:n avulla
- **Välilehtien vaihto**: Visibility API:n tuki
- **Debounced aktiviteetti**: Estää liian useita tapahtumia
- **Graceful logout**: Selkeä viesti käyttäjälle

## Tekninen toteutus

### Tiedostorakenne
```
src/
├── contexts/
│   └── AutoLogoutContext.jsx      # Päälogiikka
├── hooks/
│   └── useAutoLogout.js           # Custom hookit
├── components/
│   ├── InactivityWarningModal.jsx # Varoitusdialogi
│   ├── TimeoutSettings.jsx        # Asetukset
│   └── TimeoutInfo.jsx            # Debug-info
└── utils/
    └── inactivityUtils.js         # Apufunktiot
```

### Pääkomponentit

#### AutoLogoutContext
- Hallinnoi timeout-logiikkaa
- Aktiviteetin tunnistus
- Varoitusdialogin tila
- BroadcastChannel viestit

#### InactivityWarningModal
- Näyttää countdown-timerin
- "Jatka sessiota" -nappi
- "Kirjaudu ulos nyt" -nappi
- Estää sulkemisen klikkaamalla ulkopuolelta

#### TimeoutSettings
- Käyttäjän timeout-asetukset
- Mukautetut timeout-arvot
- Oletusarvojen palautus

### Aktiviteetin tunnistus

Seurataan seuraavia tapahtumia:
- `mousemove` - Hiiren liike
- `mousedown` - Hiiren klikkaus
- `keydown` - Näppäimistön käyttö
- `scroll` - Sivun vieritys
- `touchstart` - Kosketus (mobiili)
- `touchmove` - Kosketusliike (mobiili)
- `click` - Klikkaus
- `focus` - Elementin fokus

### Debouncing
Aktiviteetin tunnistus on debounced 1 sekunnin ajalla, jotta ei triggeröidy jokaisesta hiiren pikseliliikkeestä.

## Käyttö

### Peruskäyttö
Auto-logout toimii automaattisesti kaikilla suojatuilla sivuilla. Käyttäjän ei tarvitse tehdä mitään erityistä.

### Asetuksien muokkaus
1. Mene Settings-sivulle
2. Etsi "Sessio-asetukset" -osio
3. Valitse haluamasi timeout-arvo
4. Tallenna asetukset

### Varoitusdialogi
Kun timeout lähestyy, näkyy varoitusdialogi:
- Näyttää jäljellä olevan ajan
- "Jatka sessiota" -nappi lisää täyden timeout-ajan
- "Kirjaudu ulos nyt" -nappi kirjaa ulos heti
- Dialogia ei voi sulkea klikkaamalla ulkopuolelta

## Konfiguraatio

### Timeout-asetukset
```javascript
// src/utils/inactivityUtils.js
export const CONTEXT_TIMEOUTS = {
  '/dashboard': 20,
  '/posts': 45,
  '/blog-newsletter': 45,
  '/strategy': 45,
  '/ai-chat': 15,
  '/calls': 15,
  '/settings': 15,
  '/admin': 15,
  '/help': 20
}
```

### Käyttäjän asetukset
```javascript
export const TIMEOUT_OPTIONS = [
  { value: 15, label: '15 minuuttia' },
  { value: 20, label: '20 minuuttia' },
  { value: 30, label: '30 minuuttia' },
  { value: 45, label: '45 minuuttia' }
]
```

## LocalStorage

Ominaisuus käyttää localStoragea seuraavien avainten kanssa:
- `rascal_auto_logout_timeout` - Käyttäjän timeout-asetus
- `rascal_last_activity` - Viimeisen aktiviteetin aika

## BroadcastChannel API

Välilehtien välillä synkronoidaan:
- Aktiviteetin tunnistus
- Logout-tapahtumat
- Timeout-reset

## Testaus

### Debug-komponentit
`TimeoutInfo`-komponentti näyttää:
- Nykyisen timeout-asetuksen
- Aktiviteetin tilan
- Kontekstin timeout-asetuksen

`TestAutoLogout`-komponentti (vain kehitystä varten):
- Mahdollisuus asettaa test-timeout
- Inaktiivisuuden simulointi
- Aktiviteetin nollaus
- Logout-testaus

### Testausohjeet
1. Kirjaudu sisään
2. Odota timeout-ajan (tai muuta timeout-asetusta)
3. Varoitusdialogin pitäisi näkyä 5 minuuttia ennen logoutia
4. Testaa "Jatka sessiota" -nappi
5. Testaa "Kirjaudu ulos nyt" -nappi

## Turvallisuus

### Hyödyt
- Estää luvattoman pääsyn sessioihin
- Suojaa arkaluontoista tietoa
- Noudattaa GDPR-vaatimuksia
- Parantaa sovelluksen turvallisuutta

### Huomioitavaa
- Käyttäjän työ voi mennä hukkaan
- Varoitusdialogi on pakollinen
- Timeout-asetukset tallentuvat selaimen localStorageen

## Ongelmanratkaisu

### Yleisiä ongelmia

**Varoitusdialogi ei näy**
- Tarkista että AutoLogoutProvider on lisätty App.jsx:ään
- Tarkista että InactivityWarningModal on lisätty
- Tarkista selaimen console virheiden varalta

**Timeout ei toimi**
- Tarkista että aktiviteetin tunnistus toimii
- Tarkista localStorage-asetukset
- Tarkista että BroadcastChannel API on tuettu

**Välilehtien synkronointi ei toimi**
- BroadcastChannel API ei ole tuettu kaikissa selaimissa
- Tarkista että välilehdet ovat samassa domainissa

### Debug-tiedot
Käytä `TimeoutInfo`-komponenttia debuggaamiseen. Se näyttää:
- Nykyisen timeout-asetuksen
- Aktiviteetin tilan
- Kontekstin timeout-asetuksen

## Tulevat parannukset

- [ ] Server-side session management
- [ ] Edistyneemmät aktiviteetin tunnistus
- [ ] Käyttäjän profiiliin tallennetut asetukset
- [ ] Admin-paneeli timeout-asetuksille
- [ ] Analytics timeout-tapahtumista 