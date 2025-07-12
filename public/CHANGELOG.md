# Changelog

Tässä dokumentoidaan Rascal AI -sovelluksen uusimmat muutokset ja ominaisuudet.

## [1.19.1] - 2025-07-12

### 🐛 Korjaukset
* **ICP:n muokkaus**: Korjattu ihanneasiakkaan (ICP) muokkaus yksinkertaiseksi tekstikentäksi
* **Tallennusongelmat**: Korjattu ICP:n tallennusongelmat ja käytetään nyt companyId:tä recordId:nä

## [1.19.0] - 2025-07-11

### ✨ Uudet ominaisuudet
* **Puhelulokien järjestelmä**: Lisätty kattava puhelulokien hallinta
  * Taulukkomuotoinen näkymä kaikille puheluille
  * Hakutoiminto puheluiden etsimiseen
  * Filtterit päivämäärän ja tyypin mukaan
  * CSV-export puhelulokien vientiin
  * Pagination suurille datamäärille
* **Dashboard-päivitys**: Lisätty puheluiden kokonaishinnan näyttö dashboardille

## [1.18.0] - 2025-07-11

### ✨ Uudet ominaisuudet
* **Yksittäisten puheluiden parannukset**: 
  * Lisätty nimi-kenttä puheluille
  * Korjattu recordId-käsittely puheluissa
  * Parannettu puhelun luonti -prosessia

## [1.17.1] - 2025-07-10

### 🐛 Korjaukset
* **Turvallisuus**: Poistettu kovakoodatut API-avaimet ja käytetään ympäristömuuttujia

## [1.17.0] - 2025-07-10

### ✨ Uudet ominaisuudet
* **Puhelutyyppien hallinta**: Lisätty modaali-lomakkeet puhelutyyppien hallintaan
* **Koodin siivous**: Poistettu vanhat Airtable-kutsut CallPanel-sivulta

## [1.16.0] - 2025-07-08

### 🐛 Korjaukset
* **Debug-lokit**: Poistettu debug-lokit ja korjattu companyId-haku
* **Dokumentaatio**: Päivitetty changelog

## [1.15.0] - 2025-07-08

### ✨ Uudet ominaisuudet
* **Yksittäisten puheluiden toiminto**: Lisätty N8N-integraatio yksittäisten puheluiden käsittelyyn

## [1.14.1] - 2025-07-08

### 🐛 Korjaukset
* **AIChatPage**: Korjattu tiedostojen lähetys ja lisätty MP3-tiedostot

## [1.14.0] - 2025-07-04

### ✨ Uudet ominaisuudet
* **Sisältöstrategia-sivu**: Parannettu sisältöstrategia-sivun tyylejä ja ICP-käsittelyä

## [1.13.0] - 2025-07-03

### ✨ Uudet ominaisuudet
* **ICP-lomake**: Muunnettu ICP-lomakkeen data tekstiksi ennen Airtableen tallennusta
* **Datan yksinkertaistus**: Yksinkertaistettu ICP-datan muotoilu

## [1.12.0] - 2025-07-03

### ✨ Uudet ominaisuudet
* **ICP-muokkaus**: Muutettu ICP-muokkaus käyttäjäystävälliseksi lomakkeeksi
* **Strategian hallinta**: Lisätty ICP-muokkaus modaaliin ContentStrategyPage:lle
* **Airtable-integraatio**: Lisätty Airtable API -integraatio ICP:n ja strategian päivitykseen

## [1.11.0] - 2025-07-03

### ✨ Uudet ominaisuudet
* **Versionhallinta**: Lisätty VersionUpdateModal-komponentti uusien ominaisuuksien näyttämiseen
* **ICP-tuki**: Lisätty ICP (Ideal Customer Profile) sisältöstrategia-sivulle
* **Strategian muokkaus**: Lisätty strategian muokkausmahdollisuus
* **Bento grid**: Muutettu ContentStrategyPage bento grid -asetteluun

## [1.10.0] - 2025-07-03

### ✨ Uudet ominaisuudet
* **Strategian muokkaus**: Lisätty modaali sisältöstrategian muokkaukseen

## [1.9.0] - 2025-07-03

### ✨ Uudet ominaisuudet
* **API-korjaukset**: Korjattu strategy API ja bento grid ContentStrategyPage

## [1.8.0] - 2025-07-03

### ✨ Uudet ominaisuudet
* **API-korjaukset**: Korjattu strategy API ja bento grid ContentStrategyPage

## [1.7.0] - 2025-07-02

### 🐛 Korjaukset
* **Suodatus**: Korjattu kuukausirajoituksen laskenta ja ManagePostsPage suodatus

### ✨ Uudet ominaisuudet
* **Karuselli**: Lisätty karusellin ulkoasun valinta asetukset-sivulle

## [1.6.1] - 2025-07-01

### 💄 Ulkoasu
* **Karuselli**: Modernisoitu karusellin napit ja pisteet brändin väreillä

## [1.6.0] - 2025-07-01

### ✨ Uudet ominaisuudet
* **Layout**: Lisätty responsiivisuus ja grid dashboardiin & posteihin
* **Julkaisujen hallinta**: Parannettu julkaisujen hallinta modaalia

## [1.5.1] - 2025-07-01

### 🐛 Korjaukset
* **Asetukset**: Korjattu SettingsPage visuaaliset ongelmat

## [1.5.0] - 2025-07-01

### ✨ Uudet ominaisuudet
* **Placeholder-tekstit**: Lisätty placeholder-tekstit ja kehitysvaroitukset

## [1.4.11] - 2025-06-30

### 🐛 Korjaukset
* **Avatar-upload**: Korjattu avatar-upload webhook-ongelmat

## [1.4.10] - 2025-06-30

### 🐛 Korjaukset
* **Avatar-upload**: Korjattu companyId haku FormData:sta ja lisätty webhook payloadiin

## [1.4.9] - 2025-06-30

### ✨ Uudet ominaisuudet
* **Avatar-upload**: Lisätty N8N webhook avatar-uploadin jälkeen

## [1.4.8] - 2025-06-30

### 🐛 Korjaukset
* **Avatar-upload**: Korjattu multipart form parsing

## [1.4.7] - 2025-06-30

### 🐛 Korjaukset
* **Avatar-upload**: Korjattu tiedostojen lähetys FormData:lla

## [1.4.6] - 2025-06-30

### 🐛 Korjaukset
* **Avatar-upload**: Lisätty debug-lokit filename-parametrille

## [1.4.5] - 2025-06-30

### 🐛 Korjaukset
* **Avatar-upload**: Poistettu bodyParser-konfiguraatio server-uploadista

## [1.4.4] - 2025-06-30

### 🐛 Korjaukset
* **Avatar-upload**: Poistettu bodyParser: false client-uploadista

## [1.4.3] - 2025-06-30

### ✨ Uudet ominaisuudet
* **Avatar-upload**: Vaihdettu client-uploadiin avatar-tiedostoille

## [1.4.2] - 2025-06-30

### 🔧 Ylläpito
* **Deploy**: Käynnistetty uudelleen deploy plan-päivityksen jälkeen

## [1.4.1] - 2025-06-30

### 🐛 Korjaukset
* **Avatar-upload**: Korjattu avatar-upload käyttämään @vercel/blob put (ratkaisee 500-virheen)

## [1.4.0] - 2025-06-29

### ✨ Uudet ominaisuudet
* **Bento grid**: Lisätty bento grid -asettelu
* **Modaali**: Lisätty muokattava modaali
* **Media**: Lisätty media-tuki
* **JavaScript**: Lisätty js clamp ja datetime-local

## [1.3.0] - 2025-06-29

### ✨ Uudet ominaisuudet
* **Dashboard**: Dashboard näyttää nyt tulevat postaukset ja visuaalisen listan

## [1.2.1] - 2025-06-29

### 🐛 Korjaukset
* **Dashboard**: Dashboard käyttää nyt /api/get-posts endpointia

## [1.2.0] - 2025-06-29

### 🐛 Korjaukset
* **Tiedostojen poisto**: Lisätty fallback URL delete-files endpointtiin
* **Debug**: Lisätty parempi debuggausta delete-files endpointtiin

### ✨ Uudet ominaisuudet
* **Yläpalkki**: Lisätty yhtenäinen tumma yläpalkki kaikille pääsivuille (PageHeader)

## [1.1.16] - 2025-06-29

### 🐛 Korjaukset
* **Vercel**: Korjattu Vercel-konfiguraatio API-endpointtien toimimiseksi

## [1.1.15] - 2025-06-29

### 🐛 Korjaukset
* **Tiedostojen poisto**: Parannettu delete-files.js virheenkäsittelyä ja lokitusta
* **Husky**: Poistettu deprekoituneet rivit Husky-tiedostoista 