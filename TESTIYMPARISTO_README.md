 &# Testiympäristö - Tiimi Testing

## Yleiskuvaus

Tämä on Rascal AI:n testiympäristö, jossa tiimi voi turvallisesti kokeilla uusia ominaisuuksia ennen varsinaista releasea. Testiympäristö on erillinen `test/tiimi-testing` branch, joka ei vaikuta tuotantoversioon.

## Branch-rakenne

- **`main`** - Tuotantoversio (vakaa, testattu)
- **`test/tiimi-testing`** - Testiympäristö (uudet ominaisuudet, kokeilut)
- **`feature/supabase`** - Supabase-migraatio (erillinen kehitys)

## Testiympäristön käyttö

### Kehittäjälle (sinä)

1. **Uusien ominaisuuksien kehitys:**
   ```bash
   git checkout test/tiimi-testing
   # Tee muutokset
   git add .
   git commit -m "feat: uusi ominaisuus testiympäristöön"
   git push origin test/tiimi-testing
   ```

2. **Merge tuotantoon kun valmis:**
   ```bash
   git checkout main
   git merge test/tiimi-testing
   git push origin main
   ```

### Tiimille

1. **Testiympäristön käyttö:**
   - Testiympäristö on saatavilla osoitteessa: `https://rascal-ai-test.vercel.app` (tai vastaava)
   - Voit testata uusia ominaisuuksia turvallisesti
   - Tuotantodata ei vaarannu

2. **Palautteen antaminen:**
   - Käytä GitHub Issues -järjestelmää
   - Merkitse issue: `testiympäristö` labelilla
   - Kerro mitä testasit ja mitä havaitsit

## Testausprosessi

### 1. Uuden ominaisuuden testaus
- Kehittäjä puskaa muutoksen `test/tiimi-testing` branchiin
- Tiimi testaa ominaisuutta testiympäristössä
- Palautetta kerätään GitHub Issues -kautta

### 2. Hyväksyntä tuotantoon
- Kun ominaisuus on testattu ja hyväksytty
- Kehittäjä mergaa muutoksen `main` branchiin
- Automaattinen deploy tuotantoon

### 3. Rollback-mahdollisuus
- Jos ongelmia ilmenee, voidaan palata edelliseen versioon
- Testiympäristö mahdollistaa turvallisen testaamisen

## Ympäristömuuttujat

Testiympäristö käyttää erillisiä ympäristömuuttujia:
- Testi-tietokanta (ei tuotantodataa)
- Testi-API-avaimet
- Eri domain/URL

## Tärkeät muistutukset

- ⚠️ **ÄLÄ KOSKAAN** testaa tuotantodataa
- ✅ Käytä aina testiympäristöä uusien ominaisuuksien testaamiseen
- 📝 Anna aina palautetta testatuista ominaisuuksista
- 🔄 Pidä testiympäristö ajan tasalla

## Yhteystiedot

- Kehittäjä: [sinun yhteystietosi]
- GitHub Issues: [projektin issues-sivu]
- Testiympäristö: [testiympäristön URL]

---

*Tämä dokumentaatio päivittyy tarpeen mukaan. Pidä se ajan tasalla!*
