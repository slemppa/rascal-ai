# Onboarding Modal - Näkyvyyslogiikka

Tämä dokumentti selittää milloin Onboarding Modal tulee näkyviin käyttäjälle.

## Yleiskuvaus

Onboarding Modal näytetään uusille käyttäjille ensimmäisen kirjautumisen yhteydessä, jotta he voivat suorittaa ICP (Ideal Customer Profile) haastattelun itsenäisesti ElevenLabs AI-agentin kanssa.

## Modal näytetään KUN:

### 1. Käyttäjä on kirjautunut sisään
- `user?.id` on olemassa (käyttäjä on autentikoitu)

### 2. Käyttäjän sähköposti on vahvistettu
- `authUser.email_confirmed_at` tai `authUser.confirmed_at` on olemassa
- Tämä varmistaa että käyttäjä on vahvistanut sähköpostinsa ennen kuin modal näytetään

### 3. Käyttäjä on owner (ei kutsuttu käyttäjä)
- Käyttäjä löytyy `org_members` taulusta JA `role === 'owner'`
- Vain owner-käyttäjät (jotka luovat oman organisaationsa) näkevät onboardingin
- Kutsutut käyttäjät (`role === 'member'` tai `role === 'admin'`) ohitetaan, koska heidän onboarding-prosessinsa on erilainen

### 4. Käyttäjän onboarding ei ole valmis
- `users.onboarding_completed === false` Supabase tietokannassa
- Tämä on pääehto: modal näytetään vain jos onboarding ei ole vielä suoritettu

### 5. Käyttäjä EI ole estetyillä reiteillä
- Käyttäjä ei ole seuraavilla sivuilla:
  - `/signin` - Kirjautumissivu
  - `/signup` - Rekisteröitymissivu
  - `/reset-password` - Salasanan resetointi
  - `/forgot-password` - Salasanan palautus
  - `/auth/callback` - Autentikaation callback
  - `/terms` - Käyttöehdot
  - `/privacy` - Tietosuojakäytäntö
  - `/settings` - Asetukset

## Modal EI näytetä KUN:

### 1. Käyttäjä ei ole kirjautunut sisään
- `user?.id` puuttuu
- Modal ei näy kirjautumattomille käyttäjille

### 2. Käyttäjän sähköposti ei ole vahvistettu
- `email_confirmed_at` ja `confirmed_at` puuttuvat
- Modal odottaa sähköpostin vahvistusta ennen näyttämistä
- Tämä estää modaalin näkymisen salasanan asettamisen aikana

### 3. Käyttäjä on kutsuttu käyttäjä (ei owner)
- Käyttäjä löytyy `org_members` taulusta JA `role !== 'owner'` (eli `role === 'member'` tai `role === 'admin'`)
- Kutsutut käyttäjät ohitetaan kokonaan
- Heidän onboarding-prosessinsa on erilainen kuin itsenäisesti rekisteröityneillä käyttäjillä (owner)

### 4. Käyttäjän onboarding on valmis
- `users.onboarding_completed === true` Supabase tietokannassa
- Kun onboarding on suoritettu, modal ei enää näy

### 5. Käyttäjä on estetyillä reiteillä
- Modal piilotetaan seuraavilla sivuilla:
  - `/signin` - Kirjautumissivu
  - `/signup` - Rekisteröitymissivu
  - `/reset-password` - Salasanan resetointi
  - `/forgot-password` - Salasanan palautus
  - `/auth/callback` - Autentikaation callback
  - `/terms` - Käyttöehdot
  - `/privacy` - Tietosuojakäytäntö
  - `/settings` - Asetukset

## Tarkistusjärjestys

Modal tarkistaa näkyvyyden seuraavassa järjestyksessä:

1. **Reittitarkistus** (nopein, estää muut tarkistukset)
   - Jos käyttäjä on estetyllä reitillä → Modal EI näy
   
2. **Käyttäjän autentikaatio**
   - Jos käyttäjä ei ole kirjautunut sisään → Modal EI näy
   
3. **Sähköpostin vahvistus**
   - Jos sähköposti ei ole vahvistettu → Modal EI näy
   
4. **Organisaation rooli**
   - Jos käyttäjä on kutsuttu käyttäjä (`role !== 'owner'` eli `member` tai `admin`) → Modal EI näy
   - Jos käyttäjä on owner → Jatketaan onboarding-tarkistukseen
   
5. **Onboarding-status**
   - Jos `onboarding_completed === false` → Modal NÄY
   - Jos `onboarding_completed === true` → Modal EI näy

## Tekninen toteutus

Modal käyttää `useEffect` hookia joka tarkistaa näkyvyyden aina kun:
- Käyttäjän autentikaatiotila muuttuu (`user` muuttuu)
- Sijainti muuttuu (`location.pathname` muuttuu)

```64:138:src/components/OnboardingModal.jsx
  // Tarkista pitääkö modaali näyttää
  useEffect(() => {
    // Estä näyttö tietyillä julkisilla/kriittisillä reiteillä
    const BLOCKED_ROUTES = [
      '/signin',
      '/signup',
      '/reset-password',
      '/forgot-password',
      '/auth/callback',
      '/terms',
      '/privacy',
      '/settings'
    ]

    const isBlocked = BLOCKED_ROUTES.some((path) => location.pathname.includes(path))
    if (isBlocked) {
      setShouldShow(false)
      setLoading(false)
      return
    }

    const checkOnboardingStatus = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        // Tarkista onko käyttäjällä vahva salasana asetettu
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        // Jos käyttäjällä on recovery tai invite token aktiivisena, älä näytä modaalia
        // Tämä estää modaalin näkymisen salasanan asettamisen aikana
        if (!authUser?.email_confirmed_at && !authUser?.confirmed_at) {
          console.log('⏸️ OnboardingModal: Käyttäjä ei ole vahvistanut sähköpostia, odotetaan...')
          setLoading(false)
          setShouldShow(false)
          return
        }

        // Tarkista onko käyttäjä kutsuttu käyttäjä (on organisaatiossa)
        // Jos on, ei näytetä onboardingia koska hän on kutsuttu käyttäjä
        const { data: orgMember, error: orgError } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (!orgError && orgMember) {
          console.log('⏸️ OnboardingModal: Käyttäjä on kutsuttu käyttäjä (organisaatiossa), ei näytetä onboardingia')
          setLoading(false)
          setShouldShow(false)
          return
        }

        const { data, error } = await supabase
          .from('users')
          .select('onboarding_completed, role')
          .eq('auth_user_id', user.id)
          .single()

        if (error) throw error

        // Näytä vain jos onboarding ei ole valmis
        const show = data?.onboarding_completed === false
        setShouldShow(show)
      } catch (error) {
        console.error('❌ Error checking onboarding status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkOnboardingStatus()
  }, [user, location.pathname])
```

## Esimerkkitilanteet

### Esimerkki 1: Uusi käyttäjä ensimmäisellä kirjautumisella
- ✅ Käyttäjä kirjautuu sisään
- ✅ Sähköposti vahvistettu
- ✅ Ei ole kutsuttu käyttäjä
- ✅ `onboarding_completed === false`
- ✅ Ei ole estetyllä reitillä
- **Tulos:** Modal NÄY

### Esimerkki 2: Käyttäjä joka on jo suorittanut onboardingin
- ✅ Käyttäjä kirjautuu sisään
- ✅ Sähköposti vahvistettu
- ✅ Ei ole kutsuttu käyttäjä
- ❌ `onboarding_completed === true`
- **Tulos:** Modal EI näy

### Esimerkki 3: Kutsuttu käyttäjä (organisaation jäsen, ei owner)
- ✅ Käyttäjä kirjautuu sisään
- ✅ Sähköposti vahvistettu
- ❌ Löytyy `org_members` taulusta JA `role === 'member'` (tai `'admin'`)
- **Tulos:** Modal EI näy (ohitetaan koska ei ole owner)

### Esimerkki 4: Käyttäjä salasanan resetointi -sivulla
- ✅ Käyttäjä kirjautuu sisään
- ✅ Sähköposti vahvistettu
- ✅ Ei ole kutsuttu käyttäjä
- ✅ `onboarding_completed === false`
- ❌ Osoite on `/reset-password`
- **Tulos:** Modal EI näy (estetty reitti)

### Esimerkki 5: Käyttäjä joka ei ole vielä vahvistanut sähköpostia
- ✅ Käyttäjä kirjautuu sisään
- ❌ Sähköposti EI ole vahvistettu
- **Tulos:** Modal EI näy (odotetaan sähköpostin vahvistusta)

## Debuggaus

Jos modal ei näy odotetusti, tarkista konsolista seuraavat viestit:

- `⏸️ OnboardingModal: Käyttäjä ei ole vahvistanut sähköpostia, odotetaan...`
  - Sähköposti ei ole vahvistettu
  
- `⏸️ OnboardingModal: Käyttäjä on kutsuttu käyttäjä (organisaatiossa), ei näytetä onboardingia`
  - Käyttäjä on organisaation jäsen

- `❌ Error checking onboarding status:`
  - Tietokantavirhe tai muut ongelmat

## Yhteenveto

**Modal näytetään vain kun KAIKKI seuraavat ehdot täyttyvät:**
1. ✅ Käyttäjä on kirjautunut sisään
2. ✅ Sähköposti on vahvistettu
3. ✅ Käyttäjä on owner (`role === 'owner'` org_members taulussa) TAI ei ole org_members taulussa
4. ✅ `onboarding_completed === false`
5. ✅ Käyttäjä EI ole estetyllä reitillä

Jos jokin näistä ehdoista ei täyty, modal ei näy.

