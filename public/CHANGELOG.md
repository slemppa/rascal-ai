# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.15.0](https://github.com/slemppa/rascal-ai/compare/v1.14.1...v1.15.0) (2025-07-08)

### ✨ Features
* implement single call functionality with N8N integration

### 🐛 Bug Fixes
* poista debug-lokit ja korjaa companyId haku

## [1.14.1](https://github.com/slemppa/rascal-ai/compare/v1.14.0...v1.14.1) (2025-07-08)

### 🐛 Bug Fixes
* korjaa AIChatPage tiedostojen lähetys ja lisää MP3-tiedostot

## [1.14.0](https://github.com/slemppa/rascal-ai/compare/v1.13.0...v1.14.0) (2025-07-04)

### 📚 Documentation
* päivitä public changelog versioon 1.13.0

### ✨ Features
* improve content strategy page styling and ICP handling

## [1.13.0](https://github.com/slemppa/rascal-ai/compare/v1.10.0...v1.13.0) (2025-07-03)


### ✨ Features

* muunna ICP-lomakkeen data tekstiksi ennen Airtableen tallennusta ([089ea3f](https://github.com/slemppa/rascal-ai/commit/089ea3f91cd5e4db2da854a8f9cbf3854dc1ff49))
* täydennetty changelog kaikilla puuttuvilla versioilla ([293c340](https://github.com/slemppa/rascal-ai/commit/293c34094f1914e6f76be22c89979f36b304cdb4))


### 🐛 Bug Fixes

* yksinkertaista ICP-datan muotoilu yhdeksi stringiksi ([4d9388e](https://github.com/slemppa/rascal-ai/commit/4d9388e9dc6c3fccb1b699ea484ee820e59e1bb4))

## [1.12.0] - 2025-07-03

### ✨ Features
* muutettu ICP-muokkaus käyttäjäystävälliseksi lomakkeeksi
* lisätty ICP-muokkaus modaaliin ContentStrategyPage:lle
* lisätty Airtable API -integraatio ICP:n ja strategian päivitykseen
* lisätty airtable-update.js API-endpoint

### 🔧 Chores
* siivottu versionhallinta ja poistettu automaattiset hookit
* päivitetty changelog ja versionhallinta

## [1.11.0] - 2025-07-03

### ✨ Features
* lisätty VersionUpdateModal-komponentti uusien ominaisuuksien näyttämiseen
* lisätty versionhallinta ja changelog public-kansioon
* lisätty ICP (Ideal Customer Profile) sisältöstrategia-sivulle
* lisätty strategian muokkausmahdollisuus JSON-muodossa
* muutettu ContentStrategyPage bento grid -asetteluun

### 🔧 Chores
* päivitetty Asetukset-sivun bento grid -asettelu
* siirretty versiotiedot sidebarin footeriin
* päivitetty strategy.js API-endpoint käyttämään proxy-kutsuja

## [1.10.0] - 2025-07-03

### ✨ Features
* lisätty modaali sisältöstrategian muokkaukseen

## [1.9.0] - 2025-07-03

### ✨ Features
* korjattu strategy API ja bento grid ContentStrategyPage

## [1.8.0] - 2025-07-03

### ✨ Features
* korjattu strategy API ja bento grid ContentStrategyPage

## [1.7.0] - 2025-07-02

### 🐛 Bug Fixes
* korjattu kuukausirajoituksen laskenta ja ManagePostsPage suodatus

### ✨ Features
* lisätty karusellin ulkoasun valinta asetukset-sivulle

## [1.6.1] - 2025-07-01

### 💄 Styles
* modernisoi karusellin napit ja pisteet brändin väreillä

## [1.6.0] - 2025-07-01

### ✨ Features
* layout: responsiivisuus ja grid dashboardiin & postit
* parannettu julkaisujen hallinta modaalia

## [1.5.1] - 2025-07-01

### 🐛 Bug Fixes
* korjaa SettingsPage visuaaliset ongelmat

## [1.5.0] - 2025-07-01

### ✨ Features
* lisää placeholder-tekstit ja kehitysvaroitukset

## [1.4.11] - 2025-06-30

### 🐛 Bug Fixes
* korjaa avatar-upload webhook-ongelmat

## [1.4.10] - 2025-06-30

### 🐛 Bug Fixes
* get companyId from FormData and include in webhook payload

## [1.4.9] - 2025-06-30

### ✨ Features
* add N8N webhook after avatar upload

## [1.4.8] - 2025-06-30

### 🐛 Bug Fixes
* use formidable for multipart form parsing

## [1.4.7] - 2025-06-30

### 🐛 Bug Fixes
* use FormData for file uploads

## [1.4.6] - 2025-06-30

### 🐛 Bug Fixes
* add debug logging for filename parameter

## [1.4.5] - 2025-06-30

### 🐛 Bug Fixes
* remove bodyParser config for server upload

## [1.4.4] - 2025-06-30

### 🐛 Bug Fixes
* remove bodyParser: false for client upload

## [1.4.3] - 2025-06-30

### ✨ Features
* switch to client upload for avatar files

## [1.4.2] - 2025-06-30

### 🔧 Chores
* trigger redeploy after plan upgrade

## [1.4.1] - 2025-06-30

### 🐛 Bug Fixes
* use @vercel/blob put in avatar-upload route (resolves 500)

## [1.4.0] - 2025-06-29

### ✨ Features
* bento grid, muokattava modal, media, js clamp, datetime-local

## [1.3.0] - 2025-06-29

### ✨ Features
* dashboard näyttää tulevat postaukset ja visuaalisen listan

## [1.2.1] - 2025-06-29

### 🐛 Bug Fixes
* Dashboard käyttää nyt /api/get-posts endpointia

## [1.2.0] - 2025-06-29

### 🐛 Bug Fixes
* lisää fallback URL delete-files endpointtiin
* lisää parempi debuggausta delete-files endpointtiin

### ✨ Features
* yhtenäinen tumma yläpalkki kaikille pääsivuille (PageHeader)

## [1.1.16] - 2025-06-29

### 🐛 Bug Fixes
* korjaa Vercel-konfiguraatio API-endpointtien toimimiseksi

## [1.1.15] - 2025-06-29

### 🐛 Bug Fixes
* paranna delete-files.js virheenkäsittelyä ja lokitusta
* poista deprekoituneet rivit Husky-tiedostoista

## [1.1.14] - 2025-06-29

### 🔧 Chores
* delete-files endpoint käyttää N8N_DELETE_FILES_URL env muuttujaa

## [1.1.13] - 2025-06-29

### 🐛 Bug Fixes
* lisätty duplex: 'half' tiedostojen upload-forwardaukseen

## [1.1.12] - 2025-06-29

### 🐛 Bug Fixes
* yksinkertaistettu upload-knowledge endpoint

## [1.1.11] - 2025-06-29

### 🐛 Bug Fixes
* N8N_SECRET_KEY tarkistus ja header upload-knowledge endpointiin

## [1.1.10] - 2025-06-29

### 🐛 Bug Fixes
* N8N_SECRET_KEY tarkistus ja header

## [1.1.9] - 2025-06-29

### 🐛 Bug Fixes
* lisätty x-api-key header kaikkiin API-kutsuihin

## [1.1.8] - 2025-06-29

### 🐛 Bug Fixes
* yksinkertaistettu vector-store-files endpoint

## [1.1.7] - 2025-06-29

### 🐛 Bug Fixes
* korjattu tiedostojen API-endpointit ja frontin funktiot

## [1.1.6] - 2025-06-29

### 🐛 Bug Fixes
* api: GET vector-store-files käyttää taas N8N_VECTOR_STORE_FILES_URL

## [1.1.5] - 2025-06-29

### ✨ Features
* api: action feed/delete ja N8N_ASSISTANT_KNOWLEDGE_URL

## [1.1.4] - 2025-06-29

### ✨ Features
* ui: tyhjätila-viesti tiedostolistaan, viimeistelyt

## [1.1.3] - 2025-06-29

### ✨ Features
* ui: drag & drop tiedostolomake, moderni asettelu

## [1.1.2] - 2025-06-29

### ✨ Features
* ui: moderni tietokanta-näkymä, lomake ja tiedostot vierekkäin

## [1.1.1] - 2025-06-29

### 🐛 Bug Fixes
* api: GET-tuki vector-store-files endpointiin

## [1.1.0] - 2025-06-29

### ✨ Features
* implement semantic versioning system
* ui: parannettu landing page hero, chat-scroll fix, Lingui pois

## [1.0.0] - 2025-06-29

### ✨ Features
* Initial release of Rascal AI Dashboard
* Complete removal of Lingui internationalization system
* Single-language (Finnish) interface implementation
* Dashboard with post management functionality
* AI chat assistant with file upload capabilities
* Call management system with statistics
* Content strategy management
* User authentication and settings
* Responsive design for mobile and desktop

### 🐛 Bug Fixes
* Fixed build errors caused by Lingui dependencies
* Resolved import issues with @lingui/macro
* Corrected Vite configuration for production builds

### 🔧 Chores
* Removed all Lingui-related dependencies and configurations
* Updated package.json with proper versioning scripts
* Configured Vercel deployment pipeline
* Set up semantic versioning with standard-version 