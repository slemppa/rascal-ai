## Tietoturvadokumentti (Rascal AI)

Päivitetty: 2025-08-13
Ympäristö: Vercel (frontend + serverless API), Supabase (Auth + DB + RLS), N8N-integraatiot

### 1. Soveltamisala
- **Kattaa**: frontendi (`src/*`), palvelinreitit (`api/*`), integraatiot (N8N), tiedostolataukset (Vercel Blob), GDPR-toiminnot ja istunnon hallinta.
- **Tavoite**: kuvata suojausperiaatteet ja -kontrollit sekä antaa julkaisun tarkistuslista.

### 2. Arkkitehtuuriperiaatteet
- **Ei salaisuuksia frontendissä**: kaikki avaimet ja salaisuudet vain palvelinympäristössä.
- **Supabase Auth** frontendissä; sovellusdata haetaan backendin `/api/*`-päätteiden kautta, jolloin Supabasen RLS on voimassa.
- **Integraatiot proxyn läpi**: ulkoiset N8N-kutsut kulkevat oman backendin kautta, joka lisää `x-api-key`-headerin serverillä.

### 3. Autentikointi ja istunnot
- **Supabase Auth** (`src/lib/supabase.js`): kirjautuminen sähköposti/salasana -virrat.
- **Istunnot**: hallitaan Supabasen SDK:lla. Supabasen `sb-*`-avaimet tyhjennetään uloskirjautumisessa (`src/contexts/AuthContext.jsx`).
- **Auth-callback**: OTP-hashin verifiointi ja turvallinen uudelleenohjaus (`src/components/auth/AuthCallback.jsx`).

### 4. Autorisointi ja pääsynhallinta
- **Frontend**: reittisuojaus ja ominaisuuspohjainen tarkistus (`src/components/ProtectedRoute.jsx`).
- **Backend**: Bearer JWT pakollinen; Supabase-asiakas luodaan käyttäjän tokenilla → RLS suojaa rivit (esim. `api/get-posts.js`).
- **Admin-päätteet**: roolitarkistus `users.role` ja/tai `company_id` perusteella (`api/admin-data.js`, `api/admin-call-logs.js`, `api/admin-message-logs.js`).

### 5. Tietojen käsittely ja RLS
- **Kaikki datakyselyt** Supabaseen tehdään backendistä käyttäjän JWT:llä, jolloin RLS rajoittaa näkyvyyden.
- **Service role -avain** (jos käytössä) vain palvelimella ja rajatusti (esim. `api/strategy.js`), ei koskaan frontendissä.

### 6. API-kerros ja integraatiot
- **Proxy-periaate**: Frontend kutsuu vain oman palvelimen `/api/*`-päätteitä; palvelin välittää ulkoiset kutsut (N8N) ja lisää `x-api-key`-headerin `process.env`-arvoista.
- **CORS/Preflight**: reiteillä, joita kutsutaan selaimesta, käsitellään `OPTIONS` ja lisätään `Access-Control-Allow-*` -headerit (esim. `api/post-actions.js`).

### 7. Tiedostolataukset (Vercel Blob)
- **Käsittely serverillä**: `formidable`-pohjainen multipart-parsaus, kokorajoitukset (50–100 MB) ja upload Vercel Blobiin (`api/avatar-upload.js`, `api/upload-knowledge.js`).
- **Tiedostotyypit**: päätteen perusteella suuntaa-antava tunnistus; väliaikaistiedostot poistetaan.
- **Jatkotoiminnot**: webhook N8N:ään vain palvelimelta ja salaisella `x-api-key`:llä.

### 8. GDPR ja tietosuoja
- **Käyttöliittymä**: käyttäjä voi pyytää tietonsa tai poistonsa (`src/pages/PrivacyPolicyPage.jsx`).
- **Tietopyyntö**: `api/gdpr-data-request.js` palauttaa GDPR-yhteensopivan koosteen (Vercel KV).
- **Poistopyyntö**: `api/gdpr-data-deletion.js` anonymisoi henkilötiedot, poistaa sessiot ja lokittaa toimenpiteen (Vercel KV).

### 9. Istunnon aikakatkaisu
- **Inaktiivisuus**: sivukohtaiset timeoutit, varoitusdialogi ja automaattinen uloskirjaus (`src/utils/inactivityUtils.js`, `src/components/InactivityWarningModal.jsx`).

### 10. Ympäristömuuttujat ja salaisuuksien hallinta
- **Frontend**: käyttää vain `VITE_*`-muuttujia (ei salaisuuksia).
- **Backend**: salaisuudet `process.env.*` (esim. `N8N_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `KV_REST_API_*`, `SUPABASE_*`).
- **Service role**: käytössä vain palvelimella; arvoja ei logiteta.

### 11. Selainturva, CORS ja CSRF
- **Authorization-header**: tokenit kulkevat headerissa, ei evästeissä → alhaisempi CSRF-riski.
- **CORS**: kehityksessä sallitaan laajasti; tuotannossa rajataan vain tunnetuille alkuperille.

### 12. Lokitus ja auditointi
- **Serverilogiikka**: virheet ja keskeiset tapahtumat logitetaan; GDPR-toimenpiteet kirjataan KV:hen.
- **Tuotanto**: minimoidaan debug- ja ympäristömuuttujalokit.

### 13. Uhkamalli ja lievennykset (tiivistetty)
- **Väärin käytetty admin-pääte**: JWT-validointi + roolitarkastus + RLS; tarkista `users.role`/`company_id`.
- **RLS-ohitus**: kaikki datakyselyt käyttäjän tokenilla; service role vain erikoistilanteissa.
- **Haitalliset lataukset**: kokorajat, tyypintunnistus, tallennus Blobiin; suositus lisätä MIME-tarkistus ja haittaohjelmaskannaus.
- **API-avaimen vuoto**: avaimet vain palvelimella; rotaatio ja vähiten oikeuksia.
- **CSRF**: ei cookie-pohjaista authia; CORS kontrolloitu.

### 14. Julkaisun tarkistuslista
- **CORS** rajattu tuotantodomaineihin.
- **Ympäristömuuttujat** asetettu: `N8N_SECRET_KEY`, `SUPABASE_*`, `KV_REST_API_*` (Vercel-projektiin).
- **Service role** vain palvelinpuolella; ei logitusta.
- **RLS-politiikat** testattu (oma vs. toisen organisaation data, admin-polut).
- **Upload-rajat** ja MIME-tarkistus käytössä; käyttäjälle näkyvät rajat UI:ssa.
- **Admin-reitit** testattu JWT:llä ja rooleilla; puuttuvat päätyvät `403`.

### 15. Incident management (tiivistetty prosessi)
- **Havaitse**: virhe-/poikkeamalokit ja monitorointi.
- **Rajaa**: rotaoi avaimet, sulje haavoittuneet reitit, ota varmuuskopiot.
- **Tutki**: analysoi lokit, arvioi vaikutus ja leviämisaste.
- **Korjaa**: tee hotfix, lisää testit, päivitä dokumentaatio.
- **Ilmoita**: sisäisesti ja tarvittaessa käyttäjille viranomaislinjausten mukaisesti.

### 16. Muutoksenhallinta ja katselmointi
- Muutokset tehdään PR-käytännöllä; katselmointi tarkistaa auth/autorisaation, RLS-vaikutukset, CORS-asetukset, secrets-hallinnan ja lokitason.

### 17. Turvatestaus (ohje)
- **Auth**: testaa ilman JWT:tä, väärällä JWT:llä.
- **RLS**: testaa pääsy toisen organisaation dataan → odotettu `0` riviä.
- **Admin**: roolirajat, väärä rooli → `403`.
- **CORS/Preflight**: selaimen kutsut eri alkuperistä.
- **Rate limiting**: kuormitustestaus (suositus lisätä palvelinpuolelle).
- **Lataukset**: liiallinen koko, väärä MIME, haitallinen sisältö.

### 18. Liitteet: keskeiset tiedostot
- Auth: `src/lib/supabase.js`, `src/contexts/AuthContext.jsx`, `src/components/auth/*`
- Reitit: `src/components/ProtectedRoute.jsx`
- API: `api/*.js` (mm. `get-posts.js`, `admin-*.js`, `post-actions.js`, `strategy.js`)
- Uploadit: `api/avatar-upload.js`, `api/upload-knowledge.js`, `api/avatar-delete.js`, `api/delete-files.js`
- GDPR: `api/gdpr-data-request.js`, `api/gdpr-data-deletion.js`
- Inaktiivisuus: `src/utils/inactivityUtils.js`, `src/components/InactivityWarningModal.jsx`

### 19. Parannussuositukset
- Lisää palvelinpuolinen MIME-tarkistus ja (tarvittaessa) haittaohjelmaskannaus latauksille.
- Rajaa CORS vain tuotantodomaineihin; poista laajat `*`-originit tuotannosta.
- Lisää rate limiting ja audit-lokit kriittisiin reitteihin (admin, upload).
- Varmista, että Supabasen RLS-politiikat vastaavat admin-logiikkaa (admin-ohitus vain eksplisiittisesti).


