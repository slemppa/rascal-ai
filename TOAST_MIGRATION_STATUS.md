# Toast-ilmoitusjärjestelmän käyttöönotto

## Tilanne

Toast-järjestelmä on luotu ja otettu käyttöön. Seuraavat tiedostot on päivitetty käyttämään `useToast()` hookkia `alert()`:n sijasta:

### ✅ Päivitetty
1. **PlacidTemplatesList.jsx** - Käyttää toasteja mallin luonnissa
2. **ManagePostsPage.jsx** - Käyttää toasteja kuva-latauksissa ja validoinneissa
3. **ContentStrategyPage.jsx** - Käyttää toasteja tallennuksissa
4. **OnboardingModal.jsx** - Käyttää toasteja virhetilanteissa
5. **SocialMediaConnect.jsx** - Käyttää toasteja yhdistämisvirheissä

### 🔄 Vielä päivitettävä (14 tiedostoa)

Seuraavat tiedostot käyttävät vielä `alert()`:ia ja ne pitää päivittää:

1. **src/components/PostsCalendar.jsx**
2. **src/contexts/StrategyStatusContext.jsx**
3. **src/pages/CallPanel.jsx**
4. **src/pages/VastaajaPage.jsx**
5. **src/pages/BlogNewsletterPage.jsx**
6. **src/pages/AIChatPage.jsx**
7. **src/pages/TestN8NPage.jsx**
8. **src/pages/TestTokenPage.jsx**
9. **src/pages/ManagePostsPageOptimized.jsx**
10. **src/pages/AdminTestimonialsPage.jsx**
11. **src/pages/AdminBlogPage.jsx**
12. **src/components/TicketModal.jsx**
13. **src/components/EditCallTypeModal.jsx**
14. **src/components/AddCallTypeModal.jsx**
15. **src/components/crm.jsx**

## Päivitysohje

Jokaiseen tiedostoon:

1. Lisää import:
```javascript
import { useToast } from '../contexts/ToastContext'
```

2. Lisää hook komponentin alkuun:
```javascript
const toast = useToast()
```

3. Korvaa `alert()` kutsut:
```javascript
// ENNEN:
alert('Virhe tapahtui!')

// JÄLKEEN:
toast.error('Virhe tapahtui!')

// TAI
toast.success('Onnistui!')
toast.warning('Varoitus!')
toast.info('Tiedoksi')
```

## Muistilista

- [ ] Päivitä loput 14 tiedostoa
- [ ] Testaa että kaikki ilmoitukset toimivat
- [ ] Poista turhat `alert()` kutsut
- [ ] Dokumentoi muutokset

## Huomiot

- TestN8NPage.jsx ja TestTokenPage.jsx ovat testisivuja, niissä `alert()` voi olla OK
- Mutta ne pitää silti päivittää konsistenssin vuoksi

