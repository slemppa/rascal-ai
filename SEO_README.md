# SEO-optimointi ja Sitemap-hallinta - Rascal AI

Tämä dokumentti selittää miten SEO on toteutettu Rascal AI -projektissa ja miten sitemap-hallinta toimii.

## 📋 Yleiskatsaus

Projekti on optimoitu SEO:lle seuraavilla tavoilla:
- **Meta-tagit** - Kaikilla sivuilla on dynaamiset meta-tagit
- **Open Graph** - Facebook ja sosiaalisen median optimointi
- **Twitter Cards** - Twitter-optimointi
- **Robots.txt** - Hakukoneiden ohjaus
- **Sitemap.xml** - Dynaaminen sitemap sisältäen blogi-artikkelit
- **Google Analytics** - Sivuston seuranta

## 🗂️ Tiedostot

### 1. robots.txt
- **Sijainti**: `public/robots.txt`
- **Tarkoitus**: Ohjaa hakukoneita ja määrittelee sitemapin sijainnin
- **Estetyt sivut**: Admin-sivut, dashboard, API-endpointit
- **Sallitut sivut**: Julkiset sivut, blogi, ominaisuudet

### 2. sitemap.xml (staattinen)
- **Sijainti**: `public/sitemap.xml`
- **Tarkoitus**: Staattinen sitemap fallback-tapauksessa
- **Sisältö**: Kaikki julkiset sivut ilman blogi-artikkeleita

### 3. Dynaaminen sitemap
- **Sijainti**: `api/sitemap.js`
- **Tarkoitus**: Generoi sitemapin dynaamisesti sisältäen blogi-artikkelit
- **URL**: `/api/sitemap`
- **Välimuisti**: 1 tunti

### 4. index.html
- **Sijainti**: `index.html`
- **Tarkoitus**: Pääsivun meta-tagit ja sitemap-linkki
- **Sisältö**: Open Graph, Twitter Cards, Google Analytics

## 🔧 Tekninen toteutus

### Dynaaminen sitemap-generaattori

```javascript
// Haetaan julkaistut blogi-artikkelit Supabase:sta
const { data: articles, error } = await supabase
  .from('blog_posts')
  .select('slug, updated_at')
  .eq('published', true)
  .order('updated_at', { ascending: false })

// Generoidaan sitemap sisältäen artikkelit
articles.forEach(article => {
  sitemap += `
  <url>
    <loc>${baseUrl}/blog/${article.slug}</loc>
    <lastmod>${article.updated_at}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
})
```

### PageMeta-komponentti

```jsx
// Dynaaminen meta-tagien päivitys
<PageMeta 
  title="Artikkelit - RascalAI.fi" 
  description="Lue ajankohtaisia artikkeleita myynnistä ja markkinoinnista" 
  image="/hero-v3.jpg" 
/>
```

## 📊 Prioriteetit ja muutostajuudet

### Prioriteetit
- **1.0**: Etusivu
- **0.8**: Pääsivut (features, pricing, ai-due-diligence)
- **0.7**: Blogi-listaus, contact
- **0.6**: Blogi-artikkelit
- **0.5**: Autentikaatio-sivut
- **0.3**: Juridiset sivut

### Muutostajuudet
- **weekly**: Etusivu, blogi-listaus
- **monthly**: Pääsivut, blogi-artikkelit
- **yearly**: Juridiset sivut, autentikaatio

## 🚀 Käyttöönotto

### 1. Vercel-deploy
- robots.txt ja staattinen sitemap.xml menevät automaattisesti public-kansioon
- Dynaaminen sitemap toimii `/api/sitemap` endpointin kautta

### 2. Google Search Console
1. Lisää sitemap: `https://rascal-ai.vercel.app/api/sitemap`
2. Tarkista robots.txt: `https://rascal-ai.vercel.app/robots.txt`

### 3. Bing Webmaster Tools
1. Lisää sitemap: `https://rascal-ai.vercel.app/api/sitemap`
2. Tarkista robots.txt

## 🔍 Testaus

### Sitemap-testaus
```bash
# Testaa dynaamista sitemapia
curl https://rascal-ai.vercel.app/api/sitemap

# Testaa staattista sitemapia
curl https://rascal-ai.vercel.app/sitemap.xml

# Testaa robots.txt:tä
curl https://rascal-ai.vercel.app/robots.txt
```

### XML-validaatio
- Käytä [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)
- Tarkista että sitemap on valid XML

## 📈 Seuranta ja optimointi

### Google Analytics
- Sivuston kävijämäärät
- Hakukoneista tulevat kävijät
- Sivukohtaiset suorituskyvyt

### Google Search Console
- Sitemap-indeksointi
- Hakukoneongelmat
- Core Web Vitals

### Optimointi
- Päivitä prioriteetit tarpeen mukaan
- Lisää uusia sivuja sitemapiin
- Optimoi meta-tagit hakusanojen mukaan

## 🛠️ Ylläpito

### Sitemap-päivitys
- Dynaaminen sitemap päivittyy automaattisesti
- Staattinen sitemap päivitettävä manuaalisesti uusien sivujen lisäyksen yhteydessä

### Blogi-artikkelit
- Lisätään automaattisesti dynaamiseen sitemapiin
- Prioriteetti: 0.6
- Muutostajuus: monthly

### Uudet sivut
1. Lisää sivu staattiseen sitemapiin
2. Päivitä prioriteetti ja muutostajuus
3. Testaa että sivu on indeksoitavissa

## 📚 Hyödyllisiä linkkejä

- [Google Search Console](https://search.google.com/search-console)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
