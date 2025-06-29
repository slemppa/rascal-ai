# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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