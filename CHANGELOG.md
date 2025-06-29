# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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