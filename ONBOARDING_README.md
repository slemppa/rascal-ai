# Onboarding Modal - ICP Haastattelu

## Yleiskatsaus

Uusi onboarding-ominaisuus mahdollistaa asiakkaille itsenäisen ICP (Ideal Customer Profile) haastattelun ensimmäisen kirjautumisen yhteydessä. Tämä tarjoaa vaihtoehdon perinteiselle puhelupohjaiselle onboarding-prosessille.

## Workflow-vertailu

### Perinteinen polku (Polku A)
1. Airtable form täytetään
2. Tili luodaan automaattisesti Supabaseen
3. **Puhelu lähtee heti** → ICP-haastattelu puhelun aikana
4. ICP summary tallennetaan
5. Mixpost tilit aktivoidaan

### Uusi itsenäinen polku (Polku B)
1. Airtable form täytetään
2. Tili luodaan automaattisesti Supabaseen
3. **EI puhelua** 
4. Asiakas kirjautuu sisään ensimmäisen kerran
5. **OnboardingModal aukeaa automaattisesti**
6. ICP-haastattelu tapahtuu itsenäisesti ElevenLabs Agents -keskusteluna
7. ICP summary tallennetaan
8. Mixpost tilit aktivoidaan

## Tekniset tiedot

### Komponentit
- **OnboardingModal.jsx** - Pääkomponentti
- **OnboardingModal.css** - Tyylitiedosto
- **VoiceOrb.jsx** - Elävä visuaalinen pallo
- **VoiceOrb.css** - Pallon animaatiot ja tyylit

### API Endpoints
- **`/api/elevenlabs-config`** - Palauttaa ElevenLabs Agent ID:n turvallisesti
- **`/api/onboarding-completed`** - Webhook-endpoint joka lähettää conversation datan N8N:ään

### Teknologiat
- **React** - Frontend framework
- **@elevenlabs/react** - ElevenLabs Agents Platform SDK
- **Supabase** - Tietokanta ja autentikaatio

### Tietokantakentät (users-taulu)

#### onboarding_completed (boolean)
- Oletusarvo: `false`
- Käyttö: Määrittää näytetäänkö onboarding-modaali
- Asetetaan `true` kun käyttäjä on suorittanut haastattelun

#### role (text)
- Käyttö: Ei vaikuta modaalin näyttämiseen (modaali näkyy kaikille)
- Säilytetty tietokantakenttänä muihin tarkoituksiin

#### icp_summary (text)
- Käyttö: Tallennetaan ICP-haastattelun tulokset JSON-muodossa
- Päivitetään kun haastattelu valmistuu
- Sisältää kaikki `saveICPData` client toolille lähetetyt parametrit (JSON string)

## Ympäristömuuttujat

Lisää `.env` tiedostoon:

```env
# ElevenLabs Agents Platform
ELEVENLABS_AGENT_ID=your_agent_id_here

# N8N Webhook (olemassa oleva)
N8N_11LABS_ICP_INTERVIEW_URL=https://samikiias.app.n8n.cloud/webhook/end-of-icp
N8N_SECRET_KEY=your_secret_key_here
```

### Agent ID:n hankkiminen
1. Kirjaudu [ElevenLabs Console](https://elevenlabs.io/app/agents)
2. Luo uusi agent tai valitse olemassa oleva
3. Kopioi Agent ID konsolin yläpalkista
4. Lisää se `.env` tiedostoon

**Huom:** Agent ID haetaan API-endpointista `/api/elevenlabs-config`, joka lukee sen turvallisesti backend-puolella. Näin Agent ID ei näy selaimessa.

## ElevenLabs Agent -konfiguraatio

### Suositeltu Agent Setup

#### 1. Agent Identity
```
You are an ICP (Ideal Customer Profile) interviewer for Rascal.fi. 
Your goal is to understand the customer's business and their ideal customer profile.
Be friendly, professional, and thorough.
```

#### 2. Questions (Suositeltavat kysymykset)
- "Kerro lyhyesti yrityksestäsi ja toimialastasi"
- "Kuvaile ihanteellinen asiakkaasi - kuka on heidän kohderyhmänsä?"
- "Millaisia haasteita tai kipupisteitä asiakkailla on?"
- "Mitä tavoitteita haluatte saavuttaa Rascal.fi:n avulla?"
- "Millainen sisältö resonoi parhaiten kohderyhmänne kanssa?"

#### 3. Client Tools Setup

Luo ElevenLabs konsolissa client tool nimeltä `saveICPData`:

**Tool Name:** `saveICPData`

**Description:** 
```
Save the collected ICP (Ideal Customer Profile) data. Call this when the interview is complete.
```

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "company_type": {
      "type": "string",
      "description": "B2B or B2C"
    },
    "industry": {
      "type": "string",
      "description": "Customer's industry"
    },
    "target_audience": {
      "type": "string",
      "description": "Description of ideal customer"
    },
    "pain_points": {
      "type": "string",
      "description": "Customer pain points and challenges"
    },
    "goals": {
      "type": "string",
      "description": "Goals for using Rascal.fi"
    },
    "content_preferences": {
      "type": "string",
      "description": "What type of content works best"
    }
  },
  "required": ["company_type", "target_audience", "goals"]
}
```

**Blocking:** ☑️ Enabled (agent odottaa vastauksen)

## 🔄 Prosessin kulku

1. **Sivun lataus**: `OnboardingModal` tarkistaa Supabasesta:
   - `onboarding_completed === false`
   
2. **Modaali näkyy**: Käyttäjä aloittaa haastattelun ElevenLabs AI:n kanssa

3. **Haastattelu**: AI kerää ICP (Ideal Customer Profile) tiedot

4. **Tallennus**: Kun AI kutsuu `saveICPData` client toolin:
   - Webhook lähetetään N8N:ään
   - **N8N päivittää Supabasen:**
     - `users.icp_summary` ← JSON-muotoinen ICP data
     - `onboarding_completed` → `true`
   - Modaali sulkeutuu välittömästi

5. **Valmis**: Käyttäjä voi jatkaa Dashboardille, modaali ei enää näy

**Huom:** OnboardingModal EI päivitä Supabasea suoraan. N8N hoitaa kaikki tietokantapäivitykset.

## Käyttö

### Käyttäjän näkökulma

1. **Ensimmäinen kirjautuminen**
   - Modaali aukeaa automaattisesti
   - Näytetään selkeä ohjeistus

2. **Haastattelun aloitus**
   - Käyttäjä klikkaa "🎤 Aloita haastattelu" -nappia
   - Selain kysyy mikrofonin käyttöoikeutta
   - Yhteys ElevenLabs agentiin muodostetaan

3. **Haastattelu**
   - Agentti tervehtii ja aloittaa kysymykset
   - Käyttäjä vastaa puhumalla
   - Visuaalinen palaute: 🔊 kun agentti puhuu, 🎤 kun kuuntelee

4. **Päättäminen**
   - Kun haastattelu on valmis, agentti kutsuu `saveICPData` client toolia
   - Data tallennetaan automaattisesti
   - Käyttäjä klikkaa "⏹️ Lopeta haastattelu"
   - Modaali sulkeutuu eikä enää avaudu
   - **Vaihtoehto:** Käyttäjä voi klikata "Ohita toistaiseksi" - sulkee modaalin tilapäisesti

### Testaus

1. **Testikäyttäjän luonti**
   - Luo uusi käyttäjä Supabasessa
   - Aseta `onboarding_completed = false`

2. **Testaus**
   - Kirjaudu sisään
   - Modaali aukeaa automaattisesti
   - Testaa haastattelu

3. **Uudelleentestaus**
   - Aseta `onboarding_completed = false` käyttäjälle
   - Kirjaudu uudelleen sisään
   - Modaali aukeaa taas

## Ominaisuudet

### ✅ Toteutettu
- Automaattinen modaalin näyttäminen ensimmäisellä kirjautumisella
- Näkyy kaikille käyttäjille joiden onboarding ei ole valmis
- ElevenLabs Agents Platform integraatio
- **VoiceOrb** - Elävä pallo joka reagoi puheeseen
  - 🔵 Sininen + pulssointi = AI puhuu
  - 🟢 Vihreä = Käyttäjä kuuntelee/puhuu
  - Skaalautuu audio-volumin mukaan reaaliajassa
- ICP-datan tallennus Supabaseen
- **Webhook-integraatio** - Lähettää conversation ID:n N8N:ään kun keskustelu päättyy
- Conversation ID:n tallennus ja seuranta
- Responsiivinen design
- Mikrofonin käyttöoikeuden hallinta

### 🔜 Mahdolliset laajennukset
- Text-only mode (kirjoittamalla vastaaminen)
- Välitallennus (keskustelun pausetus)
- Edistymispalkki
- Keskustelun transkriptio UI:hin
- Useiden kielten tuki
- Analytics/seuranta

## Tuki ja ylläpito

### Debuggaus

Avaa selaimen konsoli ja tarkista:
- `console.log` viestit keskustelun tilasta
- Verkkoliikenne (WebRTC/WebSocket yhteydet)
- Mikrofonin käyttöoikeudet

### Yleiset ongelmat

**"Agent ID puuttuu"**
- Tarkista että `ELEVENLABS_AGENT_ID` on asetettu `.env` tiedostossa
- Käynnistä dev-serveri uudelleen muutosten jälkeen
- Varmista että ympäristömuuttuja on määritelty Vite-konfiguraatiossa (ks. vite.config.js)

**"Mikrofoni ei toimi"**
- Tarkista selaimen mikrofonin käyttöoikeudet
- Kokeile HTTPS-yhteydellä (vaaditaan tuotannossa)

**"Keskustelu ei yhdistä"**
- Tarkista ElevenLabs API status
- Varmista että Agent ID on oikein
- Tarkista verkkoliikenne DevToolsissa

**"ICP data ei tallennu"**
- Tarkista että `saveICPData` client tool on konfigurattu oikein ElevenLabs konsolissa
- Varmista että tool kutsutaan haastattelun lopussa
- Tarkista Supabase-yhteys

**"Webhook ei lähetä"**
- Varmista että `N8N_11LABS_ICP_INTERVIEW_URL` on asetettu `.env` tiedostossa
- Tarkista että N8N webhook (`https://samikiias.app.n8n.cloud/webhook/end-of-icp`) on käynnissä
- Katso API-serverin logit: `/api/onboarding-completed` endpoint
- Webhook on **optionaalinen** - järjestelmä toimii ilman sitäkin

## Lisenssit

- **@elevenlabs/react**: MIT License
- Katso package.json muut lisenssitiedot

## Yhteystiedot

Kehittäjä: [Tiimisi nimi]
Projekti: Rascal.fi
Versio: 1.0.0
Päivitetty: 2025-10-07

