# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.81.0](https://github.com/slemppa/rascal-ai/compare/v1.80.1...v1.81.0) (2025-10-31)


### ✨ Features

* näytä Kohderyhmä ja Tavoitteet aina ylhäällä ([61184ae](https://github.com/slemppa/rascal-ai/commit/61184ae31017ac6abbcc4585216ca224569b8cb4))

### [1.80.1](https://github.com/slemppa/rascal-ai/compare/v1.80.0...v1.80.1) (2025-10-31)


### 🐛 Bug Fixes

* estä OnboardingModal salasanan asettamisen aikana ([5713430](https://github.com/slemppa/rascal-ai/commit/5713430fe89de907eae4c60fdc774803aed537ff))
* update PublishModal to 50/50 grid with contain scaling ([0fd2f4d](https://github.com/slemppa/rascal-ai/commit/0fd2f4dbe849d25eba22046c716ae1ad4527b696))

## [1.80.0](https://github.com/slemppa/rascal-ai/compare/v1.79.3...v1.80.0) (2025-10-30)


### 📚 Documentation

* Päivitä CHANGELOG v1.79.3 ominaisuuksilla ([1833489](https://github.com/slemppa/rascal-ai/commit/1833489f1b159f4f683332b351b384dc18a7499a))


### 🔧 Chores

* trigger redeploy (local build ok) ([32a0288](https://github.com/slemppa/rascal-ai/commit/32a02883e32f2dda6610d3afe94555e69bdb5102))


### 💄 Styles

* **ui:** unify mass call modal with shared modal styles ([a8cb4ef](https://github.com/slemppa/rascal-ai/commit/a8cb4ef384ce5cd96c88299473c7398b47cf7f00))


### 🐛 Bug Fixes

* **build:** korjaa Vite env-viittaukset ([fe6a245](https://github.com/slemppa/rascal-ai/commit/fe6a245f558c2ccb77a4e0d38ee78db2e1befdf2))
* improve Avatar column display and remove skeleton loading ([329ff29](https://github.com/slemppa/rascal-ai/commit/329ff29d630747def6a00d6cddddda2ebabd8699))
* korjaa ESLint-virheet ja build-ongelmat ([c299ccf](https://github.com/slemppa/rascal-ai/commit/c299ccf1755990539f91481febc1e6c1bf617c34))
* korjaa kuvan vaihto modaaleissa ja lisää media-validointi ([095e14c](https://github.com/slemppa/rascal-ai/commit/095e14ce15f1abb87095f9748fe5a21e764c84f7))
* Korjaa kuvien upload-ongelma posts-sivulla ([1d77d55](https://github.com/slemppa/rascal-ai/commit/1d77d5556d27714eacfd0fc0f5410d20bb16e340))
* Lisää näkyvät virheviestit kuvien upload-ongelmiin ([475e04d](https://github.com/slemppa/rascal-ai/commit/475e04d81c4afbd93695305bc762c81ea8cf9bb2))
* resolve merge conflict in AddCallTypeModal ([28d8b55](https://github.com/slemppa/rascal-ai/commit/28d8b55dd65edbf5758e7d08b5a430142ea774df))
* Restore OnboardingModal component content ([7d557fa](https://github.com/slemppa/rascal-ai/commit/7d557fa00ce824d09cda457546bee43c50cbbfaa))
* Safari notification panel rendering issue ([1b83e1f](https://github.com/slemppa/rascal-ai/commit/1b83e1f951e479e601f98b7f0f4e53e128b548b6))
* Skip button no longer modifies Supabase database ([901a9ef](https://github.com/slemppa/rascal-ai/commit/901a9ef9e97d882cdcd7174cb3d9a00dff195762))


### ✨ Features

* add account manager page for portfolio management ([68301d2](https://github.com/slemppa/rascal-ai/commit/68301d26656bff749a52b349fce555c2e78802d0)), closes [#cea78](https://github.com/slemppa/rascal-ai/issues/cea78) [#1a4a3](https://github.com/slemppa/rascal-ai/issues/1a4a3)
* add language selector to call type modals ([0cd91b3](https://github.com/slemppa/rascal-ai/commit/0cd91b33824248234c21b18da370ad4fd1673b86))
* add optimistic UI updates for post scheduling and status changes ([50a4535](https://github.com/slemppa/rascal-ai/commit/50a4535d5811568a600c6581a378ea7a5e8cb41d))
* **api:** remove service-number blocking from mass calls and validation ([82f50f2](https://github.com/slemppa/rascal-ai/commit/82f50f2db46b7032479094a77783fc2b300e871c))
* **auth:** block ICP onboarding and strategy modals on reset flows ([319d0ef](https://github.com/slemppa/rascal-ai/commit/319d0efc204b54ed13ab84055abdf4da515de9c2))
* **calls:** refine AddCallTypeModal UI and behavior ([8bcd542](https://github.com/slemppa/rascal-ai/commit/8bcd5427bd8bb9867d749f9bc739c9920e1ecab6))
* Complete onboarding modal with ElevenLabs integration ([8674031](https://github.com/slemppa/rascal-ai/commit/867403137cf0b211c987bc907ffd0c65b6392079))
* fix SMS settings in mass call modals and API ([1484831](https://github.com/slemppa/rascal-ai/commit/1484831f8a9d5820238705169e1f08101048570d))
* Lisää tiketöintisysteemi ([071b592](https://github.com/slemppa/rascal-ai/commit/071b592db02f6f08db497433db2499a2528378b2))
* paranna strategiasivun käyttökokemusta ([23ad761](https://github.com/slemppa/rascal-ai/commit/23ad761a2a0465635f21e082beae03e81bc85317))
* **posts:** align current-month quota with next-month logic ([23bac69](https://github.com/slemppa/rascal-ai/commit/23bac69a112773a1fa784849441e6c1893f83342))
* Show onboarding modal to all users (not just admin) ([a1fca91](https://github.com/slemppa/rascal-ai/commit/a1fca91a31d61810510406767bbd850c66507390))
* **ui:** add audio tab to call details modal ([54361cf](https://github.com/slemppa/rascal-ai/commit/54361cf3d3c63c84eb78b8d9a31177ecd2d8e86b))
* update Avatar column with coming soon message ([0942135](https://github.com/slemppa/rascal-ai/commit/094213544d6bba7c695a44790518b2fd7759ff81))
* update Avatar section in settings with modern coming soon design ([83eb4ae](https://github.com/slemppa/rascal-ai/commit/83eb4ae4485bc82f2bfdc1b6337148a50e811d24))

### [1.79.3](https://github.com/slemppa/rascal-ai/compare/v1.79.2...v1.79.3) (2025-10-14)

### ✨ Features

* Lisää latausnappi kuville ja paranna otsikoiden näyttöä ([48ef94d](https://github.com/slemppa/rascal-ai/commit/48ef94d))

### 🔧 Chores

* Päivitä versio 1.79.2 ([b659e41](https://github.com/slemppa/rascal-ai/commit/b659e414f69f696e3d61449b41bd1f891469dda3))
* sync pending changes ([390e425](https://github.com/slemppa/rascal-ai/commit/390e425ef04e5d74ffd13c5a98a380954fd66e99))


### 🐛 Bug Fixes

* Add axios import to DashboardPage and fix Mixpost posts display ([0881009](https://github.com/slemppa/rascal-ai/commit/0881009e4f0f2ab432ec3578c190e1a8191d90d6))
* **calls:** KPI-laatikot päivittyvät filtterien mukaan ([4e86960](https://github.com/slemppa/rascal-ai/commit/4e86960c8ff8599843c46312831ead736c68782e))
* **calls:** lisää transkripti CSV-exporttiin ([cb10cb1](https://github.com/slemppa/rascal-ai/commit/cb10cb14c6c3471bd239ad593a68c5926b5dd1e3))
* **campaigns:** korjaa Jäljellä-luku (vain pending+in progress) ([4b78bd8](https://github.com/slemppa/rascal-ai/commit/4b78bd8196c830ed1a140ad069c493e05e9ca4ed))
* Estä strategia-modal kriittisillä sivuilla (settings, admin, auth) ([33a2a05](https://github.com/slemppa/rascal-ai/commit/33a2a056e2172945448ffa94e36e5e7e7a346a5e))
* Force 24-hour time format across all components ([16508a7](https://github.com/slemppa/rascal-ai/commit/16508a7a67056e4c11a5c1a8dd3e2732d03a7b31))
* Korjaa Button-import ja admin-oikeudet Sidebarissa ([407c08e](https://github.com/slemppa/rascal-ai/commit/407c08e3c4c1f0c52a0efc1568aa75301fb5bce5))
* Korjaa iOS-zoomaus salasanan vaihdossa ja mobiilinavigaatio ([68ed399](https://github.com/slemppa/rascal-ai/commit/68ed399a78b295fba77ba032d46d87e35e2d8c98))
* Korjattu timezone-käsittely kaikissa näkymissä ([28ae3fc](https://github.com/slemppa/rascal-ai/commit/28ae3fc137179660c60ce38cbabbc57cd86715e1))
* lisätty puuttuvat käännökset Tekstiviestit-välilehteä varten ([cde3893](https://github.com/slemppa/rascal-ai/commit/cde3893f1e29dc18035736f20eb65d20ea7021c5))
* Pakota musta tekstiväri strategia-sivun input/textarea-kentissä ([a428268](https://github.com/slemppa/rascal-ai/commit/a42826848fb7df4033b4f86b4d4764114f28172c))
* Poista epärelevantti 'x osaa' tieto tiedostolistasta ([d16e92d](https://github.com/slemppa/rascal-ai/commit/d16e92d008aeeb5a826b1a7ef635a500a30e857b))


### ✨ Features

* add created_at timestamps to posts modals and cards ([8c8a0c6](https://github.com/slemppa/rascal-ai/commit/8c8a0c660ef83a0dba30a98945f12fb148d41d06))
* Fix Mixpost post editing from Aikataulutettu column ([26c2abe](https://github.com/slemppa/rascal-ai/commit/26c2abeccd826d6682493d56250eb3878c74bbe2))
* Improve call type modals with better UX and new fields ([50569f7](https://github.com/slemppa/rascal-ai/commit/50569f78f1af19a2048a4c8a2460e6146cc1cf14))
* Korjattu postauksen muokkaus ja ajastus ([cd082a7](https://github.com/slemppa/rascal-ai/commit/cd082a7f5cd55581635d97e88735bf5a2ec09743))
* Lisää 'Onnistuneet' hakuvaihtoehto ja korjaa haku-logiikka ([5575fb0](https://github.com/slemppa/rascal-ai/commit/5575fb0d149d41dceebd56ca39e11e0b4a703bd5))
* Lisää latausnappi kuville ja paranna otsikoiden näyttöä ([48ef94d](https://github.com/slemppa/rascal-ai/commit/48ef94db1caa0aa5943a3f5aeae399865a3b9bda))
* lisätty kalenterinäkymään kanavan näyttö ja klikkaus ([6389277](https://github.com/slemppa/rascal-ai/commit/6389277c7f79c2416335cfd0d16f126bb5373115))

### [1.79.1](https://github.com/slemppa/rascal-ai/compare/v1.79.0...v1.79.1) (2025-10-01)


### 🐛 Bug Fixes

* korjaa Julkaistu-sarakkeen leveys koko leveydelle ([8908936](https://github.com/slemppa/rascal-ai/commit/89089364d8e40512ce860cc48c66149f81c4c794))

## [1.79.0](https://github.com/slemppa/rascal-ai/compare/v1.78.0...v1.79.0) (2025-10-01)


### ✨ Features

* paranna kalenteria ja korjaa mixpost-integraatio ([f792254](https://github.com/slemppa/rascal-ai/commit/f79225430ab03a8b395d01c23cf678e9318e37ed))

## [1.78.0](https://github.com/slemppa/rascal-ai/compare/v1.77.1...v1.78.0) (2025-10-01)


### ✨ Features

* lisää tilaus-sarake adminiin ja is_generated tuonti ([f6a5b9c](https://github.com/slemppa/rascal-ai/commit/f6a5b9c2c8ad8059cb4b947766d3be582253ff66))

### [1.77.1](https://github.com/slemppa/rascal-ai/compare/v1.77.0...v1.77.1) (2025-10-01)


### 🐛 Bug Fixes

* korjaa strategia vahvistus modalin näyttäminen ([2cf8491](https://github.com/slemppa/rascal-ai/commit/2cf8491096ef423f48182d561687fdce903d90a3))

## [1.77.0](https://github.com/slemppa/rascal-ai/compare/v1.75.0...v1.77.0) (2025-09-30)


### ✨ Features

* add calendar view and post import to ManagePostsPage ([2d3d2c1](https://github.com/slemppa/rascal-ai/commit/2d3d2c101a92f7be80eac3bd0d30fc70359d3cf9))

## [1.76.0](https://github.com/slemppa/rascal-ai/compare/v1.75.0...v1.76.0) (2025-09-30)


### ✨ Features

* add calendar view and post import to ManagePostsPage ([2d3d2c1](https://github.com/slemppa/rascal-ai/commit/2d3d2c101a92f7be80eac3bd0d30fc70359d3cf9))

## [1.75.0](https://github.com/slemppa/rascal-ai/compare/v1.74.1...v1.75.0) (2025-09-30)


### ✨ Features

* **settings:** add email change UI and Supabase update flow ([debb035](https://github.com/slemppa/rascal-ai/commit/debb035ef1394734e52a5bb5d16f73f908a51ad8))

### [1.74.1](https://github.com/slemppa/rascal-ai/compare/v1.74.0...v1.74.1) (2025-09-29)


### ♻️ Code Refactoring

* remove favicon and text from login sidebar ([5cea0ee](https://github.com/slemppa/rascal-ai/commit/5cea0ee120e418341ae7f0f95f3cc1585afeb185))


### ✨ Features

* create fullscreen login page with orange/black theme ([3386c45](https://github.com/slemppa/rascal-ai/commit/3386c4595f96267f273915df46562f5af659ffee)), closes [#ff6b2](https://github.com/slemppa/rascal-ai/issues/ff6b2) [#0a0a0](https://github.com/slemppa/rascal-ai/issues/0a0a0)
* **meeting-notes:** lisää sivu ja näkyvyysrajat ([352d4b1](https://github.com/slemppa/rascal-ai/commit/352d4b1bb0ac4fc44a5dc20239de63cf57fa2d46))

## [1.74.0](https://github.com/slemppa/rascal-ai/compare/v1.73.0...v1.74.0) (2025-09-26)


### ✨ Features

* Add strategy approval system with webhook integration ([10f61dc](https://github.com/slemppa/rascal-ai/commit/10f61dccd08f947f325181e143c556534c83085f))

## [1.73.0](https://github.com/slemppa/rascal-ai/compare/v1.72.0...v1.73.0) (2025-09-26)


### ✨ Features

* sometilien synkronointi ja provider-näyttö ([f35a097](https://github.com/slemppa/rascal-ai/commit/f35a0973bdce1add3529b580506d5966924a9a9a))

## [1.72.0](https://github.com/slemppa/rascal-ai/compare/v1.71.0...v1.72.0) (2025-09-26)


### ✨ Features

* Add TOV visualization to strategy page ([5164f19](https://github.com/slemppa/rascal-ai/commit/5164f1942dab5c3f62eaee8ff8321b6918e5d6a8))

## [1.71.0](https://github.com/slemppa/rascal-ai/compare/v1.70.0...v1.71.0) (2025-09-26)


### 🐛 Bug Fixes

* Käytä placeholder-kuvaa kun mediaa ei ole ([ebd9445](https://github.com/slemppa/rascal-ai/commit/ebd94452de5d4f70f8cdf1cfb71a222f00277fe9))


### 🔧 Chores

* Poista Google Analytics sovelluksesta ([5acda93](https://github.com/slemppa/rascal-ai/commit/5acda934af1a3572d42686c9392a650b5a113367))


### ✨ Features

* strategy-sivu hakee ja tallentaa dataa Supabasesta ([b9680f6](https://github.com/slemppa/rascal-ai/commit/b9680f66ac7dd17b951711c9c96bbc056237704d))

## [1.70.0](https://github.com/slemppa/rascal-ai/compare/v1.69.1...v1.70.0) (2025-09-25)


### ✨ Features

* Näytä kaikki kuvat PostCard-komponentissa ([9431e17](https://github.com/slemppa/rascal-ai/commit/9431e17ce6b268971293a0aeb15a6f6d4babf9d6))

### [1.69.1](https://github.com/slemppa/rascal-ai/compare/v1.69.0...v1.69.1) (2025-09-24)


### 🐛 Bug Fixes

* Korjaa 'Luo sisältöä' modaali blog-newsletter sivulla ([4f2628c](https://github.com/slemppa/rascal-ai/commit/4f2628c23d487cf6eb964cae5e45e1fa9a459524))

## [1.69.0](https://github.com/slemppa/rascal-ai/compare/v1.68.3...v1.69.0) (2025-09-23)


### ✨ Features

* Näytä kaikki slaidit Carousel-postauksissa julkaisumodaalissa ([07f5451](https://github.com/slemppa/rascal-ai/commit/07f5451a8bd669c3fbac27d0faf44b5d18dea502))

### [1.68.3](https://github.com/slemppa/rascal-ai/compare/v1.68.2...v1.68.3) (2025-09-22)


### 🐛 Bug Fixes

* **storage-delete:** use VITE_ env vars like other APIs ([ffbb5f0](https://github.com/slemppa/rascal-ai/commit/ffbb5f07a84375b585c785d4adface2f8ec28871))

### [1.68.2](https://github.com/slemppa/rascal-ai/compare/v1.68.1...v1.68.2) (2025-09-22)


### 🐛 Bug Fixes

* **upload:** send public URLs to webhook and use anon key in ingest ([6994bf9](https://github.com/slemppa/rascal-ai/commit/6994bf9a3de4ceaac7b992d8960ed38cc5cf69cc))

### [1.68.1](https://github.com/slemppa/rascal-ai/compare/v1.68.0...v1.68.1) (2025-09-22)


### 🐛 Bug Fixes

* **api:** use public URLs in vectorsupabase ingest ([cb94f90](https://github.com/slemppa/rascal-ai/commit/cb94f90b9594f22e6cc692e4d0da9b256776c392))


### ✨ Features

* **ai-chat:** upload to supabase temp-ingest and ingest URLs ([874addc](https://github.com/slemppa/rascal-ai/commit/874addcac4917907f47c2e42f1b92b61991604ad))
* **api:** add blob client upload handler ([a211637](https://github.com/slemppa/rascal-ai/commit/a211637941d19ec31ec0208057f20a690d541768))
* **api:** add supabase storage upload/ingest/delete endpoints ([85f1065](https://github.com/slemppa/rascal-ai/commit/85f1065ed14c7bdb39c6c3398d44bc5329d4d367))

## [1.68.0](https://github.com/slemppa/rascal-ai/compare/v1.67.1...v1.68.0) (2025-09-22)


### ✨ Features

* **ai-chat:** use Vercel Blob for database uploads ([478e67c](https://github.com/slemppa/rascal-ai/commit/478e67c1315313bdde1cd9e631b52934f52f4e1e))
* **api:** add blob upload and delete endpoints ([53682be](https://github.com/slemppa/rascal-ai/commit/53682be9e184037568d592af848adaf40ca222e2))


### 🐛 Bug Fixes

* **dashboard:** paginate success stats and respect filters ([bdffeba](https://github.com/slemppa/rascal-ai/commit/bdffeba7f5629a494672f8b00338dfa958146e28))


### 🔧 Chores

* **api:** improve dev-knowledge request parsing ([877dd8c](https://github.com/slemppa/rascal-ai/commit/877dd8c0eaa5a062da6ae7e7e7418b6b344c92c6))
* **i18n:** update upload texts ([0407bd2](https://github.com/slemppa/rascal-ai/commit/0407bd2758ad75c1f57eb07c39269d771d16996a))

### [1.67.1](https://github.com/slemppa/rascal-ai/compare/v1.67.0...v1.67.1) (2025-09-22)


### 🐛 Bug Fixes

* **campaigns:** paginate call_logs and add called_calls; unify success ([ce67710](https://github.com/slemppa/rascal-ai/commit/ce677100d90727df7345120ab486661afadcc8f6))
* **dashboard:** answer rate uses successful answered calls ([bf92ecc](https://github.com/slemppa/rascal-ai/commit/bf92ecc4354cc54b37f672a4f688abaa3afd337e))


### 🔧 Chores

* **ui:** update VersionNotification for latest changes ([a44a7cd](https://github.com/slemppa/rascal-ai/commit/a44a7cd49d50f86e4613366b38d34e57bab44c01))

## [1.67.0](https://github.com/slemppa/rascal-ai/compare/v1.66.2...v1.67.0) (2025-09-21)


### ✨ Features

* **ai-chat:** image/audio upload support; always send filenames ([5ab7424](https://github.com/slemppa/rascal-ai/commit/5ab7424580533db7446e09af51dca7c4d2b57d8b))


### 🐛 Bug Fixes

* **i18n:** use {{count}} in upload texts; update upload desc ([ed7b7b9](https://github.com/slemppa/rascal-ai/commit/ed7b7b9283d276ee488e9428a856ec8b6f22f17b))

### [1.66.2](https://github.com/slemppa/rascal-ai/compare/v1.66.1...v1.66.2) (2025-09-19)


### ✨ Features

* **posts, blog-newsletter:** enforce monthly limit; unify UI ([4b0bff9](https://github.com/slemppa/rascal-ai/commit/4b0bff9302d5c74fae82d1fd6a1e90503d4a09f3))

### [1.66.1](https://github.com/slemppa/rascal-ai/compare/v1.66.0...v1.66.1) (2025-09-17)


### ✨ Features

* **blog-newsletter:** add archive tab and action; add toasts ([1cce4b5](https://github.com/slemppa/rascal-ai/commit/1cce4b5d84ee7b49eaf68cd73ae72984f59322a0))

## [1.66.0](https://github.com/slemppa/rascal-ai/compare/v1.65.0...v1.66.0) (2025-09-17)


### ✨ Features

* Add GDPR consent checkbox to Chatbot modal ([189dd54](https://github.com/slemppa/rascal-ai/commit/189dd54e9f2dcb075e64cb4c0ea54383da1024a6))

## [1.65.0](https://github.com/slemppa/rascal-ai/compare/v1.64.1...v1.65.0) (2025-09-17)


### ✨ Features

* **calls:** redesign and optimize 'Puhelun tiedot' modal ([b7dfdea](https://github.com/slemppa/rascal-ai/commit/b7dfdea48470d5c5d8051244cee8e1e415903481))

### [1.64.1](https://github.com/slemppa/rascal-ai/compare/v1.64.0...v1.64.1) (2025-09-17)


### 🐛 Bug Fixes

* **calls:** korjaa outbound AI-parannus; lisää JWT & estä X-tallennus ([5b8dfc6](https://github.com/slemppa/rascal-ai/commit/5b8dfc6905fef534709c431f9dc758e3a40483c0))

## [1.64.0](https://github.com/slemppa/rascal-ai/compare/v1.63.2...v1.64.0) (2025-09-15)


### ✨ Features

* add auto-close modal after AI enhancement for outbound call types ([b08e285](https://github.com/slemppa/rascal-ai/commit/b08e28575d4dfe4702812ba26f9c13d234e62506))

### [1.63.1](https://github.com/slemppa/rascal-ai/compare/v1.63.0...v1.63.1) (2025-09-15)


### ♻️ Code Refactoring

* poista käyttämättömät sivut ja korjaa Meta Pixel ([950edf7](https://github.com/slemppa/rascal-ai/commit/950edf78b6ddf30b11958b42a9df0462c47fb6b6))

## [1.63.0](https://github.com/slemppa/rascal-ai/compare/v1.62.1...v1.63.0) (2025-09-15)


### ✨ Features

* paranna SEO-optimointia Meta Pixel ja keywords-tuella ([931ebff](https://github.com/slemppa/rascal-ai/commit/931ebff07dff900b3c3d4f657b19c7d759bf9c99))

### [1.62.1](https://github.com/slemppa/rascal-ai/compare/v1.62.0...v1.62.1) (2025-09-15)


### 🐛 Bug Fixes

* korjattu blog-sivun artikkelilaatikoiden layout ja korkeudet ([823b380](https://github.com/slemppa/rascal-ai/commit/823b38097a96f2452a64dbdfb590806abcff3ff9))
* korjattu call type -parannus ID-ongelma ([a243f24](https://github.com/slemppa/rascal-ai/commit/a243f24cbfe1f60e1ea5cd765255248d29f9a009))

## [1.62.0](https://github.com/slemppa/rascal-ai/compare/v1.61.1...v1.62.0) (2025-09-15)


### 🐛 Bug Fixes

* **posts:** hide all actions in Aikataulutettu column ([49277d4](https://github.com/slemppa/rascal-ai/commit/49277d464ad6aa8734881328b0a84146f369cb8f))


### ✨ Features

* Add call logs stats to campaign cards ([3d2a89b](https://github.com/slemppa/rascal-ai/commit/3d2a89b75906c10f7952dec34857df52bd023bfe))

### [1.61.1](https://github.com/slemppa/rascal-ai/compare/v1.61.0...v1.61.1) (2025-09-15)


### 🐛 Bug Fixes

* korjaa dashboard ja campaigns tiedot sekä mass-call kampanja ([f0f0561](https://github.com/slemppa/rascal-ai/commit/f0f0561b39b4ef8c2a5c65e9e8ae924bbe40900a))


### ✨ Features

* **posts:** show Mixpost scheduled posts and provider badge ([c68c73c](https://github.com/slemppa/rascal-ai/commit/c68c73cccac9ecc82cf6f7d6cbd1b208e9284e90))

## [1.61.0](https://github.com/slemppa/rascal-ai/compare/v1.60.2...v1.61.0) (2025-09-13)


### ✨ Features

* add monthly content limit warning system ([d45c0d6](https://github.com/slemppa/rascal-ai/commit/d45c0d6c9a4b929c702485461df43be426d62394))
* improve call logs pagination and filtering ([f375477](https://github.com/slemppa/rascal-ai/commit/f375477559a22eaaf20c7737c5a8650b65c51bb5))

### [1.60.2](https://github.com/slemppa/rascal-ai/compare/v1.60.1...v1.60.2) (2025-09-12)


### 🐛 Bug Fixes

* clear media_urls field properly in image replacement ([92b894d](https://github.com/slemppa/rascal-ai/commit/92b894d09844383f8cf939c4f6646379ffd9c971))

### [1.60.1](https://github.com/slemppa/rascal-ai/compare/v1.60.0...v1.60.1) (2025-09-12)


### 🐛 Bug Fixes

* implement proper image replacement functionality ([73a1c1c](https://github.com/slemppa/rascal-ai/commit/73a1c1ca4a7a6be32c5bf7920ce542bbdcb6f223))

## [1.60.0](https://github.com/slemppa/rascal-ai/compare/v1.59.0...v1.60.0) (2025-09-11)


### ✨ Features

* add text color support to carousel template API ([f09b9a1](https://github.com/slemppa/rascal-ai/commit/f09b9a1c97f3727fd13f9e4559cf93b47f7b767c))

## [1.59.0](https://github.com/slemppa/rascal-ai/compare/v1.58.0...v1.59.0) (2025-09-11)


### ♻️ Code Refactoring

* improve Yritysanalyysi UI and version notification ([f80fb80](https://github.com/slemppa/rascal-ai/commit/f80fb8018ae2bb2316f3244b3b15c1f2956c1251))


### ✨ Features

* improve carousel template preview with proper text positioning ([24ee680](https://github.com/slemppa/rascal-ai/commit/24ee680e6e67a36d0c336727d5351a986037000c))

## [1.58.0](https://github.com/slemppa/rascal-ai/compare/v1.57.0...v1.58.0) (2025-09-11)


### 🐛 Bug Fixes

* korjaa Mixpost API datan käsittely ja vaihda axios-kutsuun ([13b5a9a](https://github.com/slemppa/rascal-ai/commit/13b5a9a6dba2365df445271b4de5e0f59b5752b4))


### ✨ Features

* add Yritysanalyysi card to Strategy page ([bd29ce3](https://github.com/slemppa/rascal-ai/commit/bd29ce3ea49e404085a88fba14f8fdfadf9acfd1))

## [1.57.0](https://github.com/slemppa/rascal-ai/compare/v1.56.0...v1.57.0) (2025-09-10)


### ✨ Features

* add version notification system ([a9e283a](https://github.com/slemppa/rascal-ai/commit/a9e283ae759d67103dfc4ee55768480bd698bf14))

## [1.56.0](https://github.com/slemppa/rascal-ai/compare/v1.55.0...v1.56.0) (2025-09-10)


### ✨ Features

* Korjaa PublishModal ja lisää Mixpost-synkronointi ([602d6ce](https://github.com/slemppa/rascal-ai/commit/602d6ce9ae4e78620947c397642745303cc22c0d))

## [1.55.0](https://github.com/slemppa/rascal-ai/compare/v1.54.1...v1.55.0) (2025-09-10)


### 📚 Documentation

* Update tech stack documentation ([64a85be](https://github.com/slemppa/rascal-ai/commit/64a85befa466025ce85da9648e9fde45dbda08e7))


### 🐛 Bug Fixes

* korjaa chat sivun companyId bugi ([feca228](https://github.com/slemppa/rascal-ai/commit/feca2284f359a7ae56f8131c2eca25b0bb73149b))
* korjaa sidebar oikeudet company_id muutoksen jälkeen ([8afb5b4](https://github.com/slemppa/rascal-ai/commit/8afb5b4f88fcb69354babb7bc166b65a35d5f58e))
* Use correct dev endpoints for file upload/delete in AI chat ([30ea159](https://github.com/slemppa/rascal-ai/commit/30ea15960bfad7ccec6d12e73869aec77fe5569a))
* Use relative API path for carousel template ([4e5a5c6](https://github.com/slemppa/rascal-ai/commit/4e5a5c6c82dcc27f27cb580f2e5d133ddd70975b))


### ✨ Features

* Add drag & drop and replace alerts with toast notifications ([3703ec4](https://github.com/slemppa/rascal-ai/commit/3703ec42fbb16513ebed5908a52cfd3bfaddbf51))
* Add Photoshop-style color picker to carousel settings ([1934bd7](https://github.com/slemppa/rascal-ai/commit/1934bd70749302fd21228451cab16c550730c129))
* Add publish date selection to publish modal ([48d0d27](https://github.com/slemppa/rascal-ai/commit/48d0d27da027374f7a253212c73fcf33ee722b86))
* Add publish date/time selection to publish modal ([0db52d7](https://github.com/slemppa/rascal-ai/commit/0db52d72019a54c108fe0a4d44255f7b42f9160d))
* improve inbound settings modal and calls tab layout ([c166d86](https://github.com/slemppa/rascal-ai/commit/c166d865b266691bad00d34c314d27752efe9d81))
* update AI chat to use userId instead of companyId/assistantId ([95dd2e4](https://github.com/slemppa/rascal-ai/commit/95dd2e4ff2590beb85086c3175f4578280fb0afb))

### [1.54.1](https://github.com/slemppa/rascal-ai/compare/v1.54.0...v1.54.1) (2025-09-05)


### 🐛 Bug Fixes

* korjaa sidebar duplikaatit ja poista admin-tarkistukset ([3b20c83](https://github.com/slemppa/rascal-ai/commit/3b20c83c84a161c3498d27193cd8865945ce0feb))

## [1.54.0](https://github.com/slemppa/rascal-ai/compare/v1.53.1...v1.54.0) (2025-09-05)


### ✨ Features

* yksinkertainen somet-yhdistys settings-sivulla ([5badaef](https://github.com/slemppa/rascal-ai/commit/5badaef50c5391c06908703b3f3b33c7cee71122))

### [1.53.1](https://github.com/slemppa/rascal-ai/compare/v1.53.0...v1.53.1) (2025-09-05)


### 🐛 Bug Fixes

* korjaa LandingPage mobiili-responsiivisuus ([9b0c74e](https://github.com/slemppa/rascal-ai/commit/9b0c74ea244ee6959268d366b1672565e4309ae6))

## [1.53.0](https://github.com/slemppa/rascal-ai/compare/v1.52.0...v1.53.0) (2025-09-04)


### ✨ Features

* add Vercel Speed Insights tracking ([9e50729](https://github.com/slemppa/rascal-ai/commit/9e5072910d0aa5817a5a647cb6989654258b076e))

## [1.52.0](https://github.com/slemppa/rascal-ai/compare/v1.51.0...v1.52.0) (2025-09-04)


### ✨ Features

* add assessment form page with Notion iframe ([3facbf0](https://github.com/slemppa/rascal-ai/commit/3facbf00bbdb1683f72ab8571faaeec19dfcdc20))

## [1.51.0](https://github.com/slemppa/rascal-ai/compare/v1.50.0...v1.51.0) (2025-09-04)


### ✨ Features

* add implementation section and update hero content ([76ba19c](https://github.com/slemppa/rascal-ai/commit/76ba19cdd03973fccf6a8ca113bd0d3d187e5224))

## [1.50.0](https://github.com/slemppa/rascal-ai/compare/v1.49.3...v1.50.0) (2025-09-03)


### ✨ Features

* muuta hero-osion CTA 'Varaa demo' -> 'Tulossa pian' ([d4fc103](https://github.com/slemppa/rascal-ai/commit/d4fc103298804d9b8745a7af627f052956a5103a))

### [1.49.3](https://github.com/slemppa/rascal-ai/compare/v1.49.2...v1.49.3) (2025-09-03)


### 🐛 Bug Fixes

* korjaa dashboard Avainluvut ja Tulevat postaukset -osiot ([05ea1d7](https://github.com/slemppa/rascal-ai/commit/05ea1d7f8caaf9301fcf68adb52f61473d52bc50))

### [1.49.2](https://github.com/slemppa/rascal-ai/compare/v1.49.1...v1.49.2) (2025-09-01)


### ✨ Features

* i18n for Settings page, Assistant, and call-type modals ([debaa94](https://github.com/slemppa/rascal-ai/commit/debaa94f6459c20bb8a18783641e3bc0221a115d))
* lisää henkilöiden kuvaukset LandingPagen team-osioon ([cdbc85e](https://github.com/slemppa/rascal-ai/commit/cdbc85e604b9b2f705bdb0b12d564e5f3df035c8))
* paranna LandingPagen features-grid asettelua 4x2 grid:iin ([7ec0af2](https://github.com/slemppa/rascal-ai/commit/7ec0af201a91d4be7414392ace0fd5530db8288a))

### [1.49.1](https://github.com/slemppa/rascal-ai/compare/v1.49.0...v1.49.1) (2025-08-28)


### ✨ Features

* **dev:** Dev-sivu näkyy admin+moderator; lisää Dev-feature gating ([8779736](https://github.com/slemppa/rascal-ai/commit/8779736494279379d30ce70a570a1bb9f91bc91e))

## [1.49.0](https://github.com/slemppa/rascal-ai/compare/v1.48.0...v1.49.0) (2025-08-27)


### ✨ Features

* implement image management for posts with drag & drop UI ([456829d](https://github.com/slemppa/rascal-ai/commit/456829d398d4d4856cf77a1ee8fc8909d498faba))

## [1.48.0](https://github.com/slemppa/rascal-ai/compare/v1.47.0...v1.48.0) (2025-08-27)


### ✨ Features

* dashboard scatter+heatmap; success=answered; CRM gating ([085daed](https://github.com/slemppa/rascal-ai/commit/085daed0941fd1836388b1b9e893bfe65eb07b87))

## [1.47.0](https://github.com/slemppa/rascal-ai/compare/v1.46.1...v1.47.0) (2025-08-26)


### ✨ Features

* **calls:** single-call 'SMS first' toggle + API support ([4011899](https://github.com/slemppa/rascal-ai/commit/4011899031453c01e0d053429e2390513051b228))

### [1.46.1](https://github.com/slemppa/rascal-ai/compare/v1.46.0...v1.46.1) (2025-08-25)


### 🐛 Bug Fixes

* resolve user access issues and improve file handling ([8ebd775](https://github.com/slemppa/rascal-ai/commit/8ebd7752cc581a1bf10f786f10124ed55ba9f544))

## [1.46.0](https://github.com/slemppa/rascal-ai/compare/v1.45.0...v1.46.0) (2025-08-25)


### ✨ Features

* implement testimonials management and customer page ([9c33c28](https://github.com/slemppa/rascal-ai/commit/9c33c288ffd5f2c44e62f1fc42c119ea281f6a13))

## [1.45.0](https://github.com/slemppa/rascal-ai/compare/v1.44.0...v1.45.0) (2025-08-25)


### ✨ Features

* **admin:** add Testimonials management and Hallinta tabs ([65b0013](https://github.com/slemppa/rascal-ai/commit/65b00133f66eec35f3c766a1fa8865c784643ae4))

## [1.44.0](https://github.com/slemppa/rascal-ai/compare/v1.43.4...v1.44.0) (2025-08-25)


### ✨ Features

* **landing:** add Team section; add header link; nav updates ([c426ee9](https://github.com/slemppa/rascal-ai/commit/c426ee9f40b2115e59eb4c4c58759af7f72ee42e))

### [1.43.4](https://github.com/slemppa/rascal-ai/compare/v1.43.3...v1.43.4) (2025-08-25)


### 🐛 Bug Fixes

* use fit-content for all screen sizes, content-driven height ([33e3749](https://github.com/slemppa/rascal-ai/commit/33e3749b084e0408b7c9f5da02aec9758e2a54cf))

### [1.43.3](https://github.com/slemppa/rascal-ai/compare/v1.43.2...v1.43.3) (2025-08-25)


### 🐛 Bug Fixes

* **mobile:** use 100svh and flex layout for proper stretching ([44dfb1b](https://github.com/slemppa/rascal-ai/commit/44dfb1bf33c8f4580f1f0a2d2f40d5c29f69d503))

### [1.43.2](https://github.com/slemppa/rascal-ai/compare/v1.43.1...v1.43.2) (2025-08-25)


### 🐛 Bug Fixes

* **mobile:** add padding-top for sticky header compensation ([a90e239](https://github.com/slemppa/rascal-ai/commit/a90e23995f4d43bc93bbd1290609ebe6d87583a1))

### [1.43.1](https://github.com/slemppa/rascal-ai/compare/v1.43.0...v1.43.1) (2025-08-25)


### 🔧 Chores

* remove unused image files from public directory ([cd9bd12](https://github.com/slemppa/rascal-ai/commit/cd9bd122b759bc95317a832ec85645470e277955))


### ✨ Features

* add automatic update system and improve Vite dev server ([5c58612](https://github.com/slemppa/rascal-ai/commit/5c58612f0e22089a075fca7c586b949c32f56b7c))
* add blog system, shared header and AI due diligence page ([60e0c9c](https://github.com/slemppa/rascal-ai/commit/60e0c9c28f00356b66e8531d0091439ed60e5845))
* add chatbot widget with contact form and remove unused ContactPage ([9fd3bad](https://github.com/slemppa/rascal-ai/commit/9fd3badada83140bac6136a26d2c0dbe9a62a2b6))
* add published status toggle and improve blog CRUD operations ([4527c46](https://github.com/slemppa/rascal-ai/commit/4527c46d6cb1acb94ca4d77be3a9797dd7ca9438))
* change social media image to favicon.png ([ca6431f](https://github.com/slemppa/rascal-ai/commit/ca6431fd67cd2aac83151ed4ecc6427b8722844c))
* ChatbotWidget vain julkkisilla + korjattu padding ([c60785c](https://github.com/slemppa/rascal-ai/commit/c60785ceb6cb92fb95059643c0de269ccad7c0e9))
* korjaa artikkelikorttien tyylit ja ulkoasu ([09a3ff4](https://github.com/slemppa/rascal-ai/commit/09a3ff4cec24162edc17b07c464402313f105dbd))
* make image upload required for blog articles ([4386db9](https://github.com/slemppa/rascal-ai/commit/4386db93d751779fc36b1679927dfc38608169c8))
* poista Service Worker kokonaan ja korjaa mobiiliongelmat ([4d459f6](https://github.com/slemppa/rascal-ai/commit/4d459f6ef97170c80759baffe31fbf635e1ff2f8))
* update SEO meta tags with marketing and sales focus ([b61263d](https://github.com/slemppa/rascal-ai/commit/b61263de4a8b5815cf0798c54f019af5ce625f16))


### 🐛 Bug Fixes

* add missing error state to AdminBlogPage ([92461ea](https://github.com/slemppa/rascal-ai/commit/92461ead3419ad8f91f6f93a521716871ddfd183))
* BlogArticlePage CSS-ristiriidat ja mobiili-tyylit ([c91cbdb](https://github.com/slemppa/rascal-ai/commit/c91cbdb0e28fde4764815e72cbeca9662bedf25b))
* BlogArticlePage mobiili-ongelmat ja nappien venytys ([12405d1](https://github.com/slemppa/rascal-ai/commit/12405d1760b1877ec7e521ee729e7a71dfa2bb31))
* improve mobile layout and fix demo button ([55eb871](https://github.com/slemppa/rascal-ai/commit/55eb871b6e5b8f7d23a916ad59e129190b28e35d))
* korjaa mobiiliongelmat ja Service Worker MIME type -virhe ([b1ad697](https://github.com/slemppa/rascal-ai/commit/b1ad69778aeb3622923a1c6c4ef5b1faadbaf6de))
* **layout:** allow pages to grow with content; remove root 100% height ([6f69c99](https://github.com/slemppa/rascal-ai/commit/6f69c997d298ed27522fdc94e2d14da48578e319))
* mobiili-skaalaus — poistettu fit-content ja napin 100% leveys ([6fd48fb](https://github.com/slemppa/rascal-ai/commit/6fd48fb5d16bff05901c7e5a3511db15c4a45fdb))
* resolve JavaScript module loading issue and update blog styling ([1e92548](https://github.com/slemppa/rascal-ai/commit/1e92548b9ab00bc582c7a7c99f99444722cd7d36))
* resolve Service Worker causing JS module loading issues ([dbc283a](https://github.com/slemppa/rascal-ai/commit/dbc283a5e9678d36ae0b39e0adc7b52bda36bc43))
* update vercel.json for proper frontend build and SPA routing ([a0ec6aa](https://github.com/slemppa/rascal-ai/commit/a0ec6aa3e2548835098061e19cecf3a896e8834f))

## [1.43.0](https://github.com/slemppa/rascal-ai/compare/v1.42.0...v1.43.0) (2025-08-22)


### ✨ Features

* shared header; AI Due Diligence page & CTA ([9f5df30](https://github.com/slemppa/rascal-ai/commit/9f5df30c57d5b037f16ada5d38dcd1f98da8b098))

## [1.42.0](https://github.com/slemppa/rascal-ai/compare/v1.41.0...v1.42.0) (2025-08-21)


### ✨ Features

* add remaining blog API endpoints and test utilities ([22868f8](https://github.com/slemppa/rascal-ai/commit/22868f8ee5a3b0b8034ecb73483d1fce9eccaa80))
* complete blog system and other feature updates ([da66595](https://github.com/slemppa/rascal-ai/commit/da66595e40671260adfbd678247bd169875eac87))
* migrate blog APIs from N8N to direct Supabase queries ([993eff8](https://github.com/slemppa/rascal-ai/commit/993eff81099f9f5afce5ba6a78e568325f8b08ba))

## [1.41.0](https://github.com/slemppa/rascal-ai/compare/v1.40.1...v1.41.0) (2025-08-21)


### ✨ Features

* **dev:** lisää dev-ympäristön työkalut ja sivut ([2f7fb79](https://github.com/slemppa/rascal-ai/commit/2f7fb79e8f383e61f409719f24c3f16237c36301))

### [1.40.1](https://github.com/slemppa/rascal-ai/compare/v1.40.0...v1.40.1) (2025-08-21)


### 🐛 Bug Fixes

* **auth:** pakota auth-modalin otsikon ja tekstien väri valkoiseksi ([7985400](https://github.com/slemppa/rascal-ai/commit/79854001844228e4a40e91da39404289579ed04f))
* **posts:** korjaa JSX syntaksivirheet ja palauta julkaisu-modaali ([3b56bbd](https://github.com/slemppa/rascal-ai/commit/3b56bbd464e5cab9bd23e924666f8a90386ad6b0))

## [1.40.0](https://github.com/slemppa/rascal-ai/compare/v1.39.1...v1.40.0) (2025-08-20)


### ♻️ Code Refactoring

* update sidebar to VAPI dashboard style ([7d53c68](https://github.com/slemppa/rascal-ai/commit/7d53c6816ab1409005948de72e6b5cb543f0df38))


### ✨ Features

* add blocked number filter to mass-call and validate-sheet APIs ([17a24d4](https://github.com/slemppa/rascal-ai/commit/17a24d4f69c95d5b4c60e86acfee75d979fa0a49))
* add Google Analytics tracking ([3ddd789](https://github.com/slemppa/rascal-ai/commit/3ddd7890fd24d233e2f072910299e29650475477))
* add hamburger menu, Instagram icon and update favicon ([71dcba5](https://github.com/slemppa/rascal-ai/commit/71dcba50d63ddbb67cd00a96099163f6fe6e64b3))
* LandingPage redesign - ammattimainen design ja koko sivun leveys ([769dbe8](https://github.com/slemppa/rascal-ai/commit/769dbe8fa9aea895c67520e33617eeed6caf336e))
* LandingPage redesign - ammattimainen design ja tiivistetty layout ([0f52fa2](https://github.com/slemppa/rascal-ai/commit/0f52fa29b40b677e0b683a63b28c5c6d30daf23e))
* lisää viestien kokonaishinta DashboardPage stats-osioon ([70316cc](https://github.com/slemppa/rascal-ai/commit/70316cc8932ff2cf6525a6ba72d1ec640087d9b9))
* rebrand ContentStrategyPage and add KPI functionality ([0067807](https://github.com/slemppa/rascal-ai/commit/0067807eea66b14b9b336d277082f489c11c8829))


### 💄 Styles

* brändi yhtenäinen /calls, /ai-chat, help ja asetukset ([9fa5978](https://github.com/slemppa/rascal-ai/commit/9fa59787c54c3733d6526095f05cea959be9287d))

### [1.39.1](https://github.com/slemppa/rascal-ai/compare/v1.39.0...v1.39.1) (2025-08-18)


### 🐛 Bug Fixes

* improve mass call modal layout and SMS preview ([c459013](https://github.com/slemppa/rascal-ai/commit/c4590130a4f922c9b3fee90fca1116789242c632))

## [1.39.0](https://github.com/slemppa/rascal-ai/compare/v1.38.0...v1.39.0) (2025-08-18)


### ✨ Features

* improve placeholder image handling in blog-newsletter ([ee1f4d7](https://github.com/slemppa/rascal-ai/commit/ee1f4d7a6544651348051f337f99d475bf6f0e6b))

## [1.38.0](https://github.com/slemppa/rascal-ai/compare/v1.37.0...v1.38.0) (2025-08-18)


### ✨ Features

* update EditCallTypeModal and CallPanel components ([d11efb4](https://github.com/slemppa/rascal-ai/commit/d11efb4222769a5a20c6d437b53ab6acb1a5ec7d))

## [1.37.0](https://github.com/slemppa/rascal-ai/compare/v1.36.0...v1.37.0) (2025-08-17)


### 📚 Documentation

* **help:** update calls section for new modal flows and scheduling ([6a598fb](https://github.com/slemppa/rascal-ai/commit/6a598fbf23a85e81c5e26e077afd11fe2ac1242d))


### ✨ Features

* **calls:** CSV-filtterit, pending-toiminnot ja UI-korjaukset ([7e04a05](https://github.com/slemppa/rascal-ai/commit/7e04a053115250e844f0f68b4595ce5e0a914354))

## [1.36.0](https://github.com/slemppa/rascal-ai/compare/v1.35.0...v1.36.0) (2025-08-15)


### 🐛 Bug Fixes

* **api:** allow anon key with user token; ui: send Authorization ([9cb3cd6](https://github.com/slemppa/rascal-ai/commit/9cb3cd609756a2603a130a8f6c049728d0442caa))
* **api:** create Supabase client lazily with service or anon+token ([1608b43](https://github.com/slemppa/rascal-ai/commit/1608b4376ddbd0dd5793775cb2d3247f4ba84c53))
* **api:** fallback to NEXT_PUBLIC_SUPABASE_URL; env diagnostics ([0353d33](https://github.com/slemppa/rascal-ai/commit/0353d332bda0474c5a14057204d4661da30daaf8))
* **api:** robust CSV fetch for Google Sheets (gid, timeout) ([4058eb2](https://github.com/slemppa/rascal-ai/commit/4058eb21ebf1a2df6ce092e40d251d5694b7a65d))
* **api:** use SUPABASE_URL fallback; send voice_id; round time ([15a64d1](https://github.com/slemppa/rascal-ai/commit/15a64d18424e00754dd050a0600616c6752bd999))


### ✨ Features

* **calls:** single-call modal flow; phone normalization ([6a4dc87](https://github.com/slemppa/rascal-ai/commit/6a4dc8725fee1503711561fe381b7a5bba8dfe07))

## [1.35.0](https://github.com/slemppa/rascal-ai/compare/v1.34.0...v1.35.0) (2025-08-15)


### 🐛 Bug Fixes

* korjaa admin paneelin Viestit-tabin virheenkäsittelyn ([0c16e98](https://github.com/slemppa/rascal-ai/commit/0c16e981ba3b598a00feb21acb612ef4a9330e61))
* korjaa admin-message-logs API sarakkeet ([6bad3b4](https://github.com/slemppa/rascal-ai/commit/6bad3b4746352f61b14e20095eb12a0a1e37ea47))


### ✨ Features

* **calls:** use backend for mass-calls; enforce 00/30 scheduling ([32bc02c](https://github.com/slemppa/rascal-ai/commit/32bc02c8566385a03a6687beda3034d114a32926))

## [1.34.0](https://github.com/slemppa/rascal-ai/compare/v1.33.2...v1.34.0) (2025-08-14)


### ✨ Features

* add first_sms field and Text Messages tab for call types ([e6b7273](https://github.com/slemppa/rascal-ai/commit/e6b727383aab4d2e2a9c863474a07565cf87c554))


### 🐛 Bug Fixes

* korjattu CallPanel padding ja lisätty outbound/inbound tilastot ([0f214d7](https://github.com/slemppa/rascal-ai/commit/0f214d751b2792c61bed286c52ff617a6cae9b15))

### [1.33.2](https://github.com/slemppa/rascal-ai/compare/v1.33.1...v1.33.2) (2025-08-13)


### 🐛 Bug Fixes

* **call-logs:** CSV export uses filters; email + crm_id capture ([d38f527](https://github.com/slemppa/rascal-ai/commit/d38f5274458949535f47835da718e1222e51aa76))

### [1.33.1](https://github.com/slemppa/rascal-ai/compare/v1.33.0...v1.33.1) (2025-08-13)


### ✨ Features

* **calls:** tallenna contact id crm_id-kenttään Mika-mass-calls ([c8580b1](https://github.com/slemppa/rascal-ai/commit/c8580b1479c377d8a03ec59acf3d9b85f8706a3f))

## [1.33.0](https://github.com/slemppa/rascal-ai/compare/v1.32.0...v1.33.0) (2025-08-13)


### ✨ Features

* **admin:** näytä versionumero package.jsonista ([6677ffd](https://github.com/slemppa/rascal-ai/commit/6677ffddafe6d4386fe9cdc0c5fbaef43c0556d9))

## [1.32.0](https://github.com/slemppa/rascal-ai/compare/v1.31.1...v1.32.0) (2025-08-13)


### ✨ Features

* **validate-sheet:** fallback ilman gid ja varalle gid=0 ([cfb69b8](https://github.com/slemppa/rascal-ai/commit/cfb69b86ee003c653edbef12b9536995f2f195b7))

### [1.31.1](https://github.com/slemppa/rascal-ai/compare/v1.31.0...v1.31.1) (2025-08-13)


### 🔧 Chores

* **manage-posts:** paikalliset muutokset ([d5e4a2b](https://github.com/slemppa/rascal-ai/commit/d5e4a2b78a3300413b29fa5d08b357b19b2fd2dc))

## [1.31.0](https://github.com/slemppa/rascal-ai/compare/v1.30.2...v1.31.0) (2025-08-13)


### ✨ Features

* **validate-sheet:** CSV-virhekäsittely, gid-tuki ja 'puhelinnumero' ([07d58a7](https://github.com/slemppa/rascal-ai/commit/07d58a71986757b0bc1bf9e90f6cad73bde6fc8d))

### [1.30.2](https://github.com/slemppa/rascal-ai/compare/v1.30.1...v1.30.2) (2025-08-12)


### ✨ Features

* **mika:** 'Lisää valitut' avaa calltype‑modaalin valituille ([0116d84](https://github.com/slemppa/rascal-ai/commit/0116d84574b661ae40dd40e4fef9cb5420565e12))

### [1.30.1](https://github.com/slemppa/rascal-ai/compare/v1.30.0...v1.30.1) (2025-08-11)


### 🐛 Bug Fixes

* **landing:** testimonial carousel styles and HTML structure ([05b3c3e](https://github.com/slemppa/rascal-ai/commit/05b3c3e3d984ab3570f2ae63f586c9ea94b7e4e3))

## [1.30.0](https://github.com/slemppa/rascal-ai/compare/v1.29.3...v1.30.0) (2025-08-11)


### ✨ Features

* **landing:** v4 visuals ([047292d](https://github.com/slemppa/rascal-ai/commit/047292dd53ac9ea6505bff2de6f945d12430eca0))

### [1.29.3](https://github.com/slemppa/rascal-ai/compare/v1.29.2...v1.29.3) (2025-08-11)


### 🐛 Bug Fixes

* **calls:** Yhteenveto venyy ja modaalin max‑korkeus 30vh ([d23a431](https://github.com/slemppa/rascal-ai/commit/d23a431d17068f6c5385237f2a195cd924be5315))

### [1.29.2](https://github.com/slemppa/rascal-ai/compare/v1.29.1...v1.29.2) (2025-08-10)


### 🔧 Chores

* **calls:** remove Mika Special VIP card from calls tab ([a36b8d2](https://github.com/slemppa/rascal-ai/commit/a36b8d2bf364f613942f82eed7b7911b022760d2))

### [1.29.1](https://github.com/slemppa/rascal-ai/compare/v1.29.0...v1.29.1) (2025-08-10)


### 🐛 Bug Fixes

* **calls:** mass-calls for all; Mika Special only ([957734e](https://github.com/slemppa/rascal-ai/commit/957734eb6659af46ee24316ccb5c058a5d497dd4))

## [1.29.0](https://github.com/slemppa/rascal-ai/compare/v1.28.1...v1.29.0) (2025-08-10)


### ✨ Features

* **posts:** send caption with new post to idea-generation ([675bce5](https://github.com/slemppa/rascal-ai/commit/675bce5aaa4dd9568b6896dc757b1ef73b7be0c1))

### [1.28.1](https://github.com/slemppa/rascal-ai/compare/v1.28.0...v1.28.1) (2025-08-10)


### ✨ Features

* **calls:** add analytics fields and guidance to modals ([63bf2d8](https://github.com/slemppa/rascal-ai/commit/63bf2d8835121c523c1b56fc6aaa1bd1c7bb8869))

## [1.28.0](https://github.com/slemppa/rascal-ai/compare/v1.27.0...v1.28.0) (2025-08-08)


### ✨ Features

* add email support to call logs and Google Sheets validation ([4ccb0ee](https://github.com/slemppa/rascal-ai/commit/4ccb0eeca93d0249a64b44bfc2bc5606b7370b49))
* add Mika special contacts and mass call functionality ([dcf1854](https://github.com/slemppa/rascal-ai/commit/dcf185479582a054f67f72a97c6ee0ea84c0fabb))

## [1.27.0](https://github.com/slemppa/rascal-ai/compare/v1.26.0...v1.27.0) (2025-08-07)


### ✨ Features

* add contact form webhook and update landing page header ([cdf9815](https://github.com/slemppa/rascal-ai/commit/cdf9815de2f1143f1bbcc20996e63104b3ef2fea))


### ♻️ Code Refactoring

* poista debug-logeja kaikista sivuista ([258f3ab](https://github.com/slemppa/rascal-ai/commit/258f3abdbb0e1eb12038ba649ad526a0d56912a1))


### 🐛 Bug Fixes

* implement Vercel Blob file upload for AI chat knowledge base ([33fe4f7](https://github.com/slemppa/rascal-ai/commit/33fe4f7f60212f7f906c4a867f2821735c88bd85))

## [1.26.0](https://github.com/slemppa/rascal-ai/compare/v1.25.1...v1.26.0) (2025-08-06)


### 🐛 Bug Fixes

* aseta selectedVoice käyttäjän oman äänen voice_id:ksi ([6cac287](https://github.com/slemppa/rascal-ai/commit/6cac287b79eeec75f15dbb045518451a6594a347))
* remove voice_id from call_types table and code ([3ac2ce9](https://github.com/slemppa/rascal-ai/commit/3ac2ce99cf4729539aa8dd2b0ac6026c181a57a4))
* voice_id tallennus mass-call ja single-call toiminnallisuudessa ([fb007b7](https://github.com/slemppa/rascal-ai/commit/fb007b70c8a1c4faa54e55787cab9ecad2a8c2c4))
* voiceover display and media handling in posts page ([18cabc5](https://github.com/slemppa/rascal-ai/commit/18cabc5faf5c10812c5e26ec85588ee5bb712160))


### ✨ Features

* automaattinen textarea korkeuden säätö strategy-sivulla ([082c102](https://github.com/slemppa/rascal-ai/commit/082c1024bfa8575ed70a5b8d669bf2d9e2ba2edb))
* implement auto-logout with inactivity detection ([c8e1d99](https://github.com/slemppa/rascal-ai/commit/c8e1d991d300455b6f238b6f0b2baf629c517f69))

### [1.25.1](https://github.com/slemppa/rascal-ai/compare/v1.25.0...v1.25.1) (2025-08-04)


### 🐛 Bug Fixes

* korjattu settings-sivun Mixpost-yhdistys ja avatar-kuvien haku ([032bcd6](https://github.com/slemppa/rascal-ai/commit/032bcd645d206d02fda5bfeaed10362cecdf79e6))

## [1.25.0](https://github.com/slemppa/rascal-ai/compare/v1.24.3...v1.25.0) (2025-08-04)


### 🐛 Bug Fixes

* Avatar-sarake näyttää nyt get-reels.js endpointin dataa ([53d1f30](https://github.com/slemppa/rascal-ai/commit/53d1f30d682143d244487343c6ea54cb8c131674))
* korjaa Avatar-sarake ja palauta ManagePostsPage ([b7515c3](https://github.com/slemppa/rascal-ai/commit/b7515c374a2a8aa726ba442822a55b5a0d8e7dd9))
* korjattu AIChatPage syntaksivirhe ([5b148c1](https://github.com/slemppa/rascal-ai/commit/5b148c1216f3c959c133a16b6ed38eabb265d761))


### ✨ Features

* päivitetty ResetPassword UI ja lisätty viestimaksut ([c48c643](https://github.com/slemppa/rascal-ai/commit/c48c6430a523671a8c681b7e7adbc2cfb6dbfa4e))

### [1.24.3](https://github.com/slemppa/rascal-ai/compare/v1.24.2...v1.24.3) (2025-08-04)


### 🐛 Bug Fixes

* korjattu API-kutsu CallPanel-komponentissa ([a410fd1](https://github.com/slemppa/rascal-ai/commit/a410fd1722c6da48e29bea06251df3cf4e519fcb))
* null reference errors and carousel navigation in posts page ([9832097](https://github.com/slemppa/rascal-ai/commit/9832097183eb3d54ca4edf01f019f0e02f9ef256))

### [1.24.2](https://github.com/slemppa/rascal-ai/compare/v1.24.1...v1.24.2) (2025-08-03)


### 🐛 Bug Fixes

* kriittiset suorituskykyoptimointeja - LCP 25s -> optimoitu ([0d07753](https://github.com/slemppa/rascal-ai/commit/0d077536318aefa01577dbe7bf28a011b231f95f))
* modal visibility and remove Mixpost from posts page ([62ab3e7](https://github.com/slemppa/rascal-ai/commit/62ab3e74a24ca65679a4dbd0d7f8c698ca1cbd55))


### ✨ Features

* add social media channel selection for publishing posts ([32cde15](https://github.com/slemppa/rascal-ai/commit/32cde1508ce99a66400c403ae76e3f95ca3f0092))
* analytics backend & iframe components, dashboard cleanup ([cc33b44](https://github.com/slemppa/rascal-ai/commit/cc33b442406f97a492f1fcf0728273f4abaf8931))

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