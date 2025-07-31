# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.24.1](https://github.com/slemppa/rascal-ai/compare/v1.24.0...v1.24.1) (2025-07-31)


### ♻️ Code Refactoring

* Remove unused social media dashboard and navigation ([ba3da2b](https://github.com/slemppa/rascal-ai/commit/ba3da2bcb82efad7e65091feb997a206ed4979a0))
* yhtenäiset napit Button.jsx, poistettu vanhat nappityylit ([14748ce](https://github.com/slemppa/rascal-ai/commit/14748ce6a8183fa81438ff9249dfc4d6f8a08908))


### 🐛 Bug Fixes

* CSS-spesifisyysongelmat korjattu, modaalit toimivat oikein ([e197170](https://github.com/slemppa/rascal-ai/commit/e197170a9159000d71652ea9e9a59a2228adb36a))
* korjattu media-data ja mixpost_api_token lähettäminen ([e0826c5](https://github.com/slemppa/rascal-ai/commit/e0826c516343a20eb7980293cecba580a1d62142))
* korjattu media-data lähettäminen webhook:iin kaikille tyypeille ([0f4cb39](https://github.com/slemppa/rascal-ai/commit/0f4cb399bda22e702085645008b97a428bc514a6))
* korjattu Supabase-integraatio julkaisuprosessissa ([3cd7fb2](https://github.com/slemppa/rascal-ai/commit/3cd7fb2d48b75bf0bbbf4d7ff5c5ff629d6ba0a8))
* poista rekisteröitymislinkki SignIn-modalista ([dcbd55e](https://github.com/slemppa/rascal-ai/commit/dcbd55e9857c16971eb5bf1f40fda9fbc4f00330))

## [1.24.0](https://github.com/slemppa/rascal-ai/compare/v1.23.3...v1.24.0) (2025-07-27)


### 🐛 Bug Fixes

* lisätty puuttuvat /terms ja /privacy reitit App.jsx:ään ([e2904f6](https://github.com/slemppa/rascal-ai/commit/e2904f649dd33ae0677297212d23a7ceb0202de8))


### ✨ Features

* Add social media integration with Mixpost API ([3671416](https://github.com/slemppa/rascal-ai/commit/3671416a629329abd22d3ef6325f1cd156c8a094))
* lisätty sosiaalisen median meta-tagit ja PageMeta-komponentti ([f75c64a](https://github.com/slemppa/rascal-ai/commit/f75c64af112e77900a55dcc5bdc9622b64a503db))


### 🔧 Chores

* **release:** 1.10.0 ([d920354](https://github.com/slemppa/rascal-ai/commit/d92035458f383b9765f519094e82a79db80e19b1))
* Update version to 1.23.4 ([ae4fd5a](https://github.com/slemppa/rascal-ai/commit/ae4fd5ae7e72d84598a10d32ac79299adfc27786))

## [1.10.0](https://github.com/slemppa/rascal-ai/compare/v1.23.3...v1.10.0) (2025-07-27)


### 🐛 Bug Fixes

* lisätty puuttuvat /terms ja /privacy reitit App.jsx:ään ([e2904f6](https://github.com/slemppa/rascal-ai/commit/e2904f649dd33ae0677297212d23a7ceb0202de8))


### ✨ Features

* Add social media integration with Mixpost API ([3671416](https://github.com/slemppa/rascal-ai/commit/3671416a629329abd22d3ef6325f1cd156c8a094))
* lisätty sosiaalisen median meta-tagit ja PageMeta-komponentti ([f75c64a](https://github.com/slemppa/rascal-ai/commit/f75c64af112e77900a55dcc5bdc9622b64a503db))

## [1.23.3](https://github.com/slemppa/rascal-ai/compare/v1.23.2...v1.23.3) (2025-01-27)

### 🚀 BREAKING CHANGES

* **database:** Siirrytty Airtablesta Supabaseen - kaikki data on nyt Supabasessa
* **auth:** Kirjautuminen käyttää nyt Supabase Authia Airtable-autentikaation sijaan

### ✨ Features

* **admin:** Admin-paneelin puhelut-tab parannettu - poistettu Yhteenveto ja Tyyppi sarakkeet, lisätty Käyttäjä-sarake
* **admin:** Admin-paneelin viestit-tab lisätty kuukausittainen aggregaatio käyttäjittäin
* **admin:** Admin-paneelin käyttäjät-tab lisätty User ID -sarake (piilotettu oletuksena)
* **routing:** Korjattu reititys - kirjautumattomat käyttäjät ohjataan landing page -sivulle

### 🧹 Chores

* **api:** Poistettu ylimääräiset single-call API endpointit (2 ja 3)
* **database:** Täydellinen Supabase-migraatio valmis - kaikki toiminnallisuus käyttää nyt Supabasea

## [1.9.0](https://github.com/slemppa/rascal-ai/compare/v1.6.1...v1.9.0) (2025-07-26)


### 📚 Documentation

* ohjeet Airtable-Supabase-synkronointiin ([43be6d8](https://github.com/slemppa/rascal-ai/commit/43be6d82bdb5c2cd6e1948f92542baaaeffd0fb6))


### 🔧 Chores

* aloitettu supabase-migraatio omassa branchissa ([4e4b0c2](https://github.com/slemppa/rascal-ai/commit/4e4b0c2a63c0b2e5d100e28abf62c4086b6a15f8))
* **release:** 1.6.2 ([e174b4f](https://github.com/slemppa/rascal-ai/commit/e174b4fb739d368cb2eeabac11dad360f389302d))
* **release:** 1.7.0 ([2cc57cb](https://github.com/slemppa/rascal-ai/commit/2cc57cb6af4c6a47be813db82a6048757e6283c7))
* **release:** 1.8.0 ([facf892](https://github.com/slemppa/rascal-ai/commit/facf892cf35012abcde5b2559d80b3fb6a8d0ffc))


### 🐛 Bug Fixes

* korjaa logout, sessionin tyhjennys ja supabase-import-polku ([5bd56e8](https://github.com/slemppa/rascal-ai/commit/5bd56e87fc08b829a7852b451668cd021a931272))
* korjattu CallPanel.jsx - poistettu callLogsStats state ([a87cd59](https://github.com/slemppa/rascal-ai/commit/a87cd591a620694bd959fc7085ea7bf49c402906))
* rename files to remove spaces for Vercel compatibility ([e0a528a](https://github.com/slemppa/rascal-ai/commit/e0a528a9497e5962a506e670979dc37a2ae6538e))
* supabase env, js-importit ja dev-server debugointi ([ebd4607](https://github.com/slemppa/rascal-ai/commit/ebd4607e7dc40686bdc681ace37485b53349bccc))


### ✨ Features

* add /calls page with full functionality from main branch ([9cdd13c](https://github.com/slemppa/rascal-ai/commit/9cdd13c6edf8e653225fa71ed9c361683dce91e0))
* admin-paneelin parannukset ja reitityksen korjaus ([335aa69](https://github.com/slemppa/rascal-ai/commit/335aa6984271dd4f1bac15f46ec25989245496ce))
* **auth:** lisää käyttäjäprofiilin haku kirjautumisen jälkeen ([e9bdfe2](https://github.com/slemppa/rascal-ai/commit/e9bdfe22fab620a8d0c8f9591a770400a3c2d671))
* complete Supabase migration with new features ([e205a0c](https://github.com/slemppa/rascal-ai/commit/e205a0c00bcb1277d1a28c8ac64cc598a08eacb2))
* implement strategy page with N8N integration and UI improvements ([6ab466a](https://github.com/slemppa/rascal-ai/commit/6ab466aba11e43056885bd65525d7e83b1fb6547))
* supabase-integraatio, feature flagit ja dynaaminen navigaatio ([217b924](https://github.com/slemppa/rascal-ai/commit/217b924e05c176bb1e59807d447438d5dd5e525e))

## [1.8.0](https://github.com/slemppa/rascal-ai/compare/v1.6.1...v1.8.0) (2025-07-26)


### 📚 Documentation

* ohjeet Airtable-Supabase-synkronointiin ([43be6d8](https://github.com/slemppa/rascal-ai/commit/43be6d82bdb5c2cd6e1948f92542baaaeffd0fb6))


### 🐛 Bug Fixes

* korjaa logout, sessionin tyhjennys ja supabase-import-polku ([5bd56e8](https://github.com/slemppa/rascal-ai/commit/5bd56e87fc08b829a7852b451668cd021a931272))
* supabase env, js-importit ja dev-server debugointi ([ebd4607](https://github.com/slemppa/rascal-ai/commit/ebd4607e7dc40686bdc681ace37485b53349bccc))


### ✨ Features

* add /calls page with full functionality from main branch ([9cdd13c](https://github.com/slemppa/rascal-ai/commit/9cdd13c6edf8e653225fa71ed9c361683dce91e0))
* **auth:** lisää käyttäjäprofiilin haku kirjautumisen jälkeen ([e9bdfe2](https://github.com/slemppa/rascal-ai/commit/e9bdfe22fab620a8d0c8f9591a770400a3c2d671))
* implement strategy page with N8N integration and UI improvements ([6ab466a](https://github.com/slemppa/rascal-ai/commit/6ab466aba11e43056885bd65525d7e83b1fb6547))
* supabase-integraatio, feature flagit ja dynaaminen navigaatio ([217b924](https://github.com/slemppa/rascal-ai/commit/217b924e05c176bb1e59807d447438d5dd5e525e))


### 🔧 Chores

* aloitettu supabase-migraatio omassa branchissa ([4e4b0c2](https://github.com/slemppa/rascal-ai/commit/4e4b0c2a63c0b2e5d100e28abf62c4086b6a15f8))
* **release:** 1.6.2 ([e174b4f](https://github.com/slemppa/rascal-ai/commit/e174b4fb739d368cb2eeabac11dad360f389302d))
* **release:** 1.7.0 ([2cc57cb](https://github.com/slemppa/rascal-ai/commit/2cc57cb6af4c6a47be813db82a6048757e6283c7))

## [1.7.0](https://github.com/slemppa/rascal-ai/compare/v1.6.1...v1.7.0) (2025-07-26)


### 🔧 Chores

* aloitettu supabase-migraatio omassa branchissa ([4e4b0c2](https://github.com/slemppa/rascal-ai/commit/4e4b0c2a63c0b2e5d100e28abf62c4086b6a15f8))
* **release:** 1.6.2 ([e174b4f](https://github.com/slemppa/rascal-ai/commit/e174b4fb739d368cb2eeabac11dad360f389302d))


### 📚 Documentation

* ohjeet Airtable-Supabase-synkronointiin ([43be6d8](https://github.com/slemppa/rascal-ai/commit/43be6d82bdb5c2cd6e1948f92542baaaeffd0fb6))


### 🐛 Bug Fixes

* korjaa logout, sessionin tyhjennys ja supabase-import-polku ([5bd56e8](https://github.com/slemppa/rascal-ai/commit/5bd56e87fc08b829a7852b451668cd021a931272))
* supabase env, js-importit ja dev-server debugointi ([ebd4607](https://github.com/slemppa/rascal-ai/commit/ebd4607e7dc40686bdc681ace37485b53349bccc))


### ✨ Features

* add /calls page with full functionality from main branch ([9cdd13c](https://github.com/slemppa/rascal-ai/commit/9cdd13c6edf8e653225fa71ed9c361683dce91e0))
* **auth:** lisää käyttäjäprofiilin haku kirjautumisen jälkeen ([e9bdfe2](https://github.com/slemppa/rascal-ai/commit/e9bdfe22fab620a8d0c8f9591a770400a3c2d671))
* implement strategy page with N8N integration and UI improvements ([6ab466a](https://github.com/slemppa/rascal-ai/commit/6ab466aba11e43056885bd65525d7e83b1fb6547))
* supabase-integraatio, feature flagit ja dynaaminen navigaatio ([217b924](https://github.com/slemppa/rascal-ai/commit/217b924e05c176bb1e59807d447438d5dd5e525e))

### [1.6.2](https://github.com/slemppa/rascal-ai/compare/v1.6.1...v1.6.2) (2025-07-01)


### 🔧 Chores

* aloitettu supabase-migraatio omassa branchissa ([4e4b0c2](https://github.com/slemppa/rascal-ai/commit/4e4b0c2a63c0b2e5d100e28abf62c4086b6a15f8))

### [1.6.1](https://github.com/slemppa/rascal-ai/compare/v1.6.0...v1.6.1) (2025-07-01)


### 💄 Styles

* modernisoi karusellin napit ja pisteet brändin väreillä ([18a4af7](https://github.com/slemppa/rascal-ai/commit/18a4af7e9ca02db2230d3beb4219f55e617a6fcb))

## [1.6.0](https://github.com/slemppa/rascal-ai/compare/v1.5.1...v1.6.0) (2025-07-01)


### ✨ Features

* **layout:** responsiivisuus ja grid dashboardiin & postit ([615dd1b](https://github.com/slemppa/rascal-ai/commit/615dd1b403a977402b0e263161c30549aecb39de))
* parannettu julkaisujen hallinta modaalia ([2d6e088](https://github.com/slemppa/rascal-ai/commit/2d6e088e51d6846afa6769e159fba266594fbf5e))

### [1.5.1](https://github.com/slemppa/rascal-ai/compare/v1.5.0...v1.5.1) (2025-07-01)


### 🐛 Bug Fixes

* korjaa SettingsPage visuaaliset ongelmat ([40bb552](https://github.com/slemppa/rascal-ai/commit/40bb552404b6054259bb2517f85e4bf864e61cec))

## [1.5.0](https://github.com/slemppa/rascal-ai/compare/v1.4.11...v1.5.0) (2025-07-01)


### ✨ Features

* lisää placeholder-tekstit ja kehitysvaroitukset ([4c933b1](https://github.com/slemppa/rascal-ai/commit/4c933b174322a8f3e25e9a29ec0a2f3e67cca6b8))

### [1.4.11](https://github.com/slemppa/rascal-ai/compare/v1.4.10...v1.4.11) (2025-06-30)


### 🐛 Bug Fixes

* korjaa avatar-upload webhook-ongelmat ([8195fda](https://github.com/slemppa/rascal-ai/commit/8195fda7df4b611e1099563645e59fb06bd8a660))

### [1.4.10](https://github.com/slemppa/rascal-ai/compare/v1.4.9...v1.4.10) (2025-06-30)


### 🐛 Bug Fixes

* Get companyId from FormData and include in webhook payload ([bae460c](https://github.com/slemppa/rascal-ai/commit/bae460ca5f91ca9a0e4fc8d444c6bc706438cf40))

### [1.4.9](https://github.com/slemppa/rascal-ai/compare/v1.4.8...v1.4.9) (2025-06-30)


### ✨ Features

* add N8N webhook after avatar upload ([dbf3395](https://github.com/slemppa/rascal-ai/commit/dbf3395b92bd236239a040af573b1d84ebed3683))

### [1.4.8](https://github.com/slemppa/rascal-ai/compare/v1.4.7...v1.4.8) (2025-06-30)


### 🐛 Bug Fixes

* use formidable for multipart form parsing ([988aaad](https://github.com/slemppa/rascal-ai/commit/988aaad4ac96c7b0d77ae2c8d833e34c5e300110))

### [1.4.7](https://github.com/slemppa/rascal-ai/compare/v1.4.6...v1.4.7) (2025-06-30)


### 🐛 Bug Fixes

* use FormData for file uploads ([c5f6e8f](https://github.com/slemppa/rascal-ai/commit/c5f6e8fee0a4f9d5bc46a2eaf4a0be4a10a55691))

### [1.4.6](https://github.com/slemppa/rascal-ai/compare/v1.4.5...v1.4.6) (2025-06-30)


### 🐛 Bug Fixes

* add debug logging for filename parameter ([be2a9c9](https://github.com/slemppa/rascal-ai/commit/be2a9c9dff7749223fae491065332496a237de8c))

### [1.4.5](https://github.com/slemppa/rascal-ai/compare/v1.4.4...v1.4.5) (2025-06-30)


### 🐛 Bug Fixes

* remove bodyParser config for server upload ([b94a275](https://github.com/slemppa/rascal-ai/commit/b94a275569de49300138277fe4c9a4c08f470787))

### [1.4.4](https://github.com/slemppa/rascal-ai/compare/v1.4.3...v1.4.4) (2025-06-30)


### 🐛 Bug Fixes

* remove bodyParser: false for client upload ([d3655b5](https://github.com/slemppa/rascal-ai/commit/d3655b5654e9d9a0eee4451d4913a306b2d708da))

### [1.4.3](https://github.com/slemppa/rascal-ai/compare/v1.4.2...v1.4.3) (2025-06-30)


### ✨ Features

* switch to client upload for avatar files ([8cbc061](https://github.com/slemppa/rascal-ai/commit/8cbc061fe9d7b84561b7bc30175ded850403df7c))

### [1.4.2](https://github.com/slemppa/rascal-ai/compare/v1.4.1...v1.4.2) (2025-06-30)


### 🔧 Chores

* trigger redeploy after plan upgrade ([a0080a7](https://github.com/slemppa/rascal-ai/commit/a0080a706adf8d55f0ae3cc79f42f10b3fce1ee4))

### [1.4.1](https://github.com/slemppa/rascal-ai/compare/v1.4.0...v1.4.1) (2025-06-30)


### 🐛 Bug Fixes

* use @vercel/blob put in avatar-upload route (resolves 500) ([76aabf0](https://github.com/slemppa/rascal-ai/commit/76aabf0d6dd398f52b0b193dc5180a3f6f286bb2))

## [1.4.0](https://github.com/slemppa/rascal-ai/compare/v1.3.0...v1.4.0) (2025-06-29)


### ✨ Features

* bento grid, muokattava modal, media, js clamp, datetime-local ([d6ceb4f](https://github.com/slemppa/rascal-ai/commit/d6ceb4f8cd5c09971a37e79843cfe523596d8aae))

## [1.3.0](https://github.com/slemppa/rascal-ai/compare/v1.2.1...v1.3.0) (2025-06-29)


### ✨ Features

* dashboard näyttää tulevat postaukset ja visuaalisen listan ([ea5e4db](https://github.com/slemppa/rascal-ai/commit/ea5e4db80c21c64ea9f27cc14f332af26d37287e))

### [1.2.1](https://github.com/slemppa/rascal-ai/compare/v1.2.0...v1.2.1) (2025-06-29)


### 🐛 Bug Fixes

* Dashboard käyttää nyt /api/get-posts endpointia ([d86e71a](https://github.com/slemppa/rascal-ai/commit/d86e71a2d8f6441a7c7aa9ee9d3f8342c27c12ef))

## [1.2.0](https://github.com/slemppa/rascal-ai/compare/v1.1.16...v1.2.0) (2025-06-29)


### 🐛 Bug Fixes

* lisää fallback URL delete-files endpointtiin ([654ebbb](https://github.com/slemppa/rascal-ai/commit/654ebbbff4eb5ee11c911f775df0df61cfb7d1dc))
* lisää parempi debuggausta delete-files endpointtiin ([175bf79](https://github.com/slemppa/rascal-ai/commit/175bf79c2907b0eb9f8e72987eb33c11222c1fb5))


### ✨ Features

* yhtenäinen tumma yläpalkki kaikille pääsivuille (PageHeader) ([f8ae6b5](https://github.com/slemppa/rascal-ai/commit/f8ae6b5bd6808f198ab815c69b7a2120f9d6a4fe))

### [1.1.16](https://github.com/slemppa/rascal-ai/compare/v1.1.15...v1.1.16) (2025-06-29)


### 🐛 Bug Fixes

* korjaa Vercel-konfiguraatio API-endpointtien toimimiseksi ([4db76ee](https://github.com/slemppa/rascal-ai/commit/4db76ee6186e6a97886ac114fddca28eaf5ad9d3))

### [1.1.15](https://github.com/slemppa/rascal-ai/compare/v1.1.14...v1.1.15) (2025-06-29)


### 🐛 Bug Fixes

* paranna delete-files.js virheenkäsittelyä ja lokitusta ([3ef944f](https://github.com/slemppa/rascal-ai/commit/3ef944f39de72568aaf8532e154274a3b24ce03c))
* poista deprekoituneet rivit Husky-tiedostoista ([6b3e1c1](https://github.com/slemppa/rascal-ai/commit/6b3e1c162a5b80da81d3ec2e1e6a5704c48bf7a9))

### [1.1.14](https://github.com/slemppa/rascal-ai/compare/v1.1.13...v1.1.14) (2025-06-29)


### 🔧 Chores

* delete-files endpoint käyttää N8N_DELETE_FILES_URL env muuttujaa ([d974e60](https://github.com/slemppa/rascal-ai/commit/d974e600726552669c68d729c7280be90410f01c))

### [1.1.13](https://github.com/slemppa/rascal-ai/compare/v1.1.12...v1.1.13) (2025-06-29)


### 🐛 Bug Fixes

* lisätty duplex: 'half' tiedostojen upload-forwardaukseen ([4f6bf80](https://github.com/slemppa/rascal-ai/commit/4f6bf80c7424b02e17701b795bcb280213c9d303))

### [1.1.12](https://github.com/slemppa/rascal-ai/compare/v1.1.11...v1.1.12) (2025-06-29)


### 🐛 Bug Fixes

* yksinkertaistettu upload-knowledge endpoint ([1369152](https://github.com/slemppa/rascal-ai/commit/136915286d9b7ad637ea457b60da88e827e337b9))

### [1.1.11](https://github.com/slemppa/rascal-ai/compare/v1.1.10...v1.1.11) (2025-06-29)


### 🐛 Bug Fixes

* N8N_SECRET_KEY tarkistus ja header upload-knowledge endpointiin ([459f8dd](https://github.com/slemppa/rascal-ai/commit/459f8dd03f35fb913580e086c9fdc20b655e3533))

### [1.1.10](https://github.com/slemppa/rascal-ai/compare/v1.1.9...v1.1.10) (2025-06-29)


### 🐛 Bug Fixes

* N8N_SECRET_KEY tarkistus ja header ([bc94cf9](https://github.com/slemppa/rascal-ai/commit/bc94cf93c60dc093d333070d068d131b8b85b829))

### [1.1.9](https://github.com/slemppa/rascal-ai/compare/v1.1.8...v1.1.9) (2025-06-29)


### 🐛 Bug Fixes

* lisätty x-api-key header kaikkiin API-kutsuihin ([82203fe](https://github.com/slemppa/rascal-ai/commit/82203fe64a48ecbdb8e338dea137c52c839409e7))

### [1.1.8](https://github.com/slemppa/rascal-ai/compare/v1.1.7...v1.1.8) (2025-06-29)


### 🐛 Bug Fixes

* yksinkertaistettu vector-store-files endpoint ([ff646e3](https://github.com/slemppa/rascal-ai/commit/ff646e3fd89d6cc67bd3040e44df68a3abc75901))

### [1.1.7](https://github.com/slemppa/rascal-ai/compare/v1.1.6...v1.1.7) (2025-06-29)


### 🐛 Bug Fixes

* korjattu tiedostojen API-endpointit ja frontin funktiot ([58402f4](https://github.com/slemppa/rascal-ai/commit/58402f413169b3e4d7561991a23235e8d4c7bc10))

### [1.1.6](https://github.com/slemppa/rascal-ai/compare/v1.1.5...v1.1.6) (2025-06-29)


### 🐛 Bug Fixes

* **api:** GET vector-store-files käyttää taas N8N_VECTOR_STORE_FILES_URL ([013d394](https://github.com/slemppa/rascal-ai/commit/013d394f2bb5db53bbdf167691e38e16bcfcd2df))

### [1.1.5](https://github.com/slemppa/rascal-ai/compare/v1.1.4...v1.1.5) (2025-06-29)


### ✨ Features

* **api:** action feed/delete ja N8N_ASSISTANT_KNOWLEDGE_URL ([8e539c4](https://github.com/slemppa/rascal-ai/commit/8e539c47e5f44b7495c4f5da4363967d72e9196f))

### [1.1.4](https://github.com/slemppa/rascal-ai/compare/v1.1.3...v1.1.4) (2025-06-29)


### ✨ Features

* **ui:** tyhjätila-viesti tiedostolistaan, viimeistelyt ([818c49d](https://github.com/slemppa/rascal-ai/commit/818c49dfbab55e9d6132f0b88483f173679c4df2))

### [1.1.3](https://github.com/slemppa/rascal-ai/compare/v1.1.2...v1.1.3) (2025-06-29)


### ✨ Features

* **ui:** drag & drop tiedostolomake, moderni asettelu ([f202e9c](https://github.com/slemppa/rascal-ai/commit/f202e9cfce94b7576c6eef02af28c4e3ddcea9d7))

### [1.1.2](https://github.com/slemppa/rascal-ai/compare/v1.1.1...v1.1.2) (2025-06-29)


### ✨ Features

* **ui:** moderni tietokanta-näkymä, lomake ja tiedostot vierekkäin ([76c9338](https://github.com/slemppa/rascal-ai/commit/76c93385c86c424caabf7814b1810776c1044da6))

### [1.1.1](https://github.com/slemppa/rascal-ai/compare/v1.1.0...v1.1.1) (2025-06-29)


### 🐛 Bug Fixes

* **api:** GET-tuki vector-store-files endpointiin ([bb53d99](https://github.com/slemppa/rascal-ai/commit/bb53d99573c3de6fb9be96ddadc8035dd4b050b6))

## 1.1.0 (2025-06-29)


### ✨ Features

* implement semantic versioning system ([3314456](https://github.com/slemppa/rascal-ai/commit/3314456ab324ed24dfea2d3409a8e02d40f6bfd3))
* **ui:** parannettu landing page hero, chat-scroll fix, Lingui pois ([0744ad1](https://github.com/slemppa/rascal-ai/commit/0744ad12b2051e554b1fb919b6c5eb4b7da117e8))

## [1.0.0] - 2025-06-29

### ✨ Features
- Initial release of Rascal AI Dashboard
- Complete removal of Lingui internationalization system
- Single-language (Finnish) interface implementation
- Dashboard with post management functionality
- AI chat assistant with file upload capabilities
- Call management system with statistics
- Content strategy management
- User authentication and settings
- Responsive design for mobile and desktop

### 🐛 Bug Fixes
- Fixed build errors caused by Lingui dependencies
- Resolved import issues with @lingui/macro
- Corrected Vite configuration for production builds

### 🔧 Chores
- Removed all Lingui-related dependencies and configurations
- Updated package.json with proper versioning scripts
- Configured Vercel deployment pipeline
- Set up semantic versioning with standard-version 