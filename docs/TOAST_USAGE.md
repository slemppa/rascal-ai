# Toast-ilmoitusjärjestelmä

Globaali toast-ilmoitusjärjestelmä on nyt käytössä koko sovelluksessa.

## Käyttö

### 1. Tuo `useToast` hook komponenttiin

```javascript
import { useToast } from '../contexts/ToastContext'

function MyComponent() {
  const toast = useToast()
  
  // ...
}
```

### 2. Näytä ilmoituksia

```javascript
// Success-ilmoitus (vihreä)
toast.success('Toiminto onnistui!')

// Error-ilmoitus (punainen)
toast.error('Jotain meni pieleen!')

// Warning-ilmoitus (oranssi - Rascal AI väri)
toast.warning('Huomio: Tarkista tiedot!')

// Info-ilmoitus (sininen)
toast.info('Tässä on tietoa sinulle')
```

### 3. Kustomoi kestoa (oletuksena 5000ms = 5s)

```javascript
// Näytä 3 sekuntia
toast.success('Nopea ilmoitus', 3000)

// Näytä 10 sekuntia
toast.error('Tärkeä virheviesti', 10000)

// Näytä loputtomasti (kunnes käyttäjä sulkee)
toast.info('Tämä ei poistu automaattisesti', 0)
```

## Esimerkkejä käytöstä

### Axios-pyyntö

```javascript
const handleSubmit = async () => {
  try {
    const response = await axios.post('/api/data', data)
    toast.success('Tallennus onnistui!')
  } catch (error) {
    toast.error('Tallennus epäonnistui: ' + error.message)
  }
}
```

### Form-validointi

```javascript
const handleSubmit = (e) => {
  e.preventDefault()
  
  if (!formData.email) {
    toast.warning('Sähköpostiosoite on pakollinen')
    return
  }
  
  if (!isValidEmail(formData.email)) {
    toast.error('Virheellinen sähköpostiosoite')
    return
  }
  
  // Lähetä data...
  toast.success('Lomake lähetetty!')
}
```

### Info-viestit

```javascript
const handleCopy = () => {
  navigator.clipboard.writeText(text)
  toast.info('Kopioitu leikepöydälle')
}
```

## Toast-tyypit ja värit

| Tyyppi | Väri | Käyttötarkoitus |
|--------|------|-----------------|
| `success` | Vihreä | Onnistuneet toiminnot |
| `error` | Punainen | Virheet ja epäonnistumiset |
| `warning` | Oranssi (Rascal AI) | Varoitukset ja huomiot |
| `info` | Sininen | Yleiset tiedotteet |

## Tekninen toteutus

- **Context**: `ToastContext.jsx` - Hallitsee toast-tilaa
- **Container**: `ToastContainer.jsx` - Renderöi kaikki toastit
- **Toast**: `Toast.jsx` - Yksittäinen toast-komponentti
- **Sijainti**: Oikeassa yläkulmassa (mobiilissa keskitetty)
- **Animaatiot**: Slide in/out oikealta
- **Z-index**: 9999 (näkyy kaiken päällä)

## Huomioitavaa

- Toastit häviävät automaattisesti 5 sekunnin jälkeen (jos ei määritetty toisin)
- Käyttäjä voi sulkea toastin milloin tahansa painamalla X-nappia
- Useita toasteja voi näkyä kerralla (ne pinotaan päällekkäin)
- Mobiilissa toastit ovat keskitetty ja sopeutuvat näytön leveyteen

