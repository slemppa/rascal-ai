# CSS-arkkitehtuuri

## Modal-systeemit

Sovelluksessa on 4 eri modal-systeemiä, jotka ovat eri tarkoituksessa:

### 1. ModalComponents.css - Yhteiset modaalit
**Tiedosto:** `src/components/ModalComponents.css`

**Käyttö:**
- EditCallTypeModal
- AddCallTypeModal  
- Log detail modal (CallPanel)

**Variantit:**
- `modal-overlay--light`: Kevyt harmaa tausta (30% musta)
- `modal-overlay--dark`: Tumma tausta (80% musta)

**CSS Custom Properties:**
```css
:root {
  --modal-overlay-light: rgba(0, 0, 0, 0.3);
  --modal-overlay-dark: rgba(0, 0, 0, 0.8);
  --modal-background: #fff;
  --modal-border-radius: 16px;
  --modal-padding: 32px;
  --modal-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --modal-z-index: 1000;
}
```

### 2. Landing page -modaalit
**Tiedostot:**
- `src/pages/ContactPage.css`
- `src/pages/LandingPage.css`

**Käyttö:** Landing page -modaalit (sama systeemi kaikissa)

### 3. Sisältöstrategia-modaali
**Tiedosto:** `src/pages/ContentStrategyPage.css`

**Käyttö:** Sisältöstrategia-modaali

### 4. Posts-modaali
**Tiedosto:** `src/pages/ManagePostsPage.css`

**Käyttö:** Posts-sivun modaalit

## CSS Custom Properties

Yhteiset arvot on määritelty CSS Custom Properties -muuttujina:

```css
:root {
  --modal-overlay-light: rgba(0, 0, 0, 0.3);
  --modal-overlay-dark: rgba(0, 0, 0, 0.8);
  --modal-background: #fff;
  --modal-border-radius: 16px;
  --modal-padding: 32px;
  --modal-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --modal-z-index: 1000;
}
```

## Käyttöohjeet

### Uuden modaalin lisääminen

1. Käytä ModalComponents.css:n tyylejä jos mahdollista
2. Valitse sopiva variantti: `modal-overlay--light` tai `modal-overlay--dark`
3. Käytä CSS Custom Properties -muuttujia

### Esimerkki:

```jsx
<div className="modal-overlay modal-overlay--light" onClick={handleClose}>
  <div className="modal-container">
    <div className="modal-header">
      <h2 className="modal-title">Otsikko</h2>
      <Button onClick={handleClose} className="modal-close-btn">×</Button>
    </div>
    <div className="modal-content">
      {/* Sisältö */}
    </div>
  </div>
</div>
```

## Huomioitavaa

- Jokainen modal-systeemi on omana systeeminään koska ne ovat eri tarkoituksessa
- ModalComponents.css:n modaalit ovat yhteisiä ja käyttävät variantteja
- CSS Custom Properties mahdollistavat helpon muutokset yhteisille arvoille
- Inline-tyylit on korvattu CSS-luokilla 