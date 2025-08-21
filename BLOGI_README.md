# Blogi-järjestelmä - Rascal AI

Tämä dokumentti selittää miten käyttää uutta blogi-järjestelmää Rascal AI -projektissa.

## Yleiskatsaus

Blogi-järjestelmä koostuu seuraavista osista:
- **Julkinen blogi-sivu** (`/blog`) - näyttää kaikki artikkelit
- **Yksittäinen artikkelisivu** (`/blog/[slug]`) - näyttää yksittäisen artikkelin
- **Admin-hallintasivu** (`/admin-blog`) - sisällön hallintaan
- **API-endpointit** - artikkelien CRUD-toiminnot

## Ominaisuudet

### Julkinen blogi
- Artikkelien listaus bentogrid-asettelulla
- Responsiivinen suunnittelu (desktop + mobiili)
- Kuvat, kategoriat ja julkaisupäivät
- Hakukoneoptimointi (SEO)

### Admin-hallinta
- Artikkelien lisääminen, muokkaaminen ja poistaminen
- Yksinkertainen lomake sisällön hallintaan
- Automaattinen slug-generointi otsikosta
- HTML-sisällön tuki

### Tekniset ominaisuudet
- Supabase-tietokanta
- Row Level Security (RLS)
- API-endpointit backendin kautta
- TypeScript-tuki

## Käyttöönotto

### 1. Supabase-taulun käyttö

Käytämme olemassa olevaa `blog_posts`-taulua, joka on siivottu ja optimoitu:

```sql
-- Taulu on siivottu ja optimoitu seuraavasti:
-- Lisätty kentät: excerpt, category, published_at, updated_at, image_url, content
-- Poistettu vanhat kentät: media_url, mainbody, meta_description
-- Luotu indeksit nopeaa hakua varten

-- Indeksit:
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_published ON blog_posts(published);
```

### 2. Blog-covers bucketin luominen

Luo Supabase Storage:en uusi bucket nimeltä `blog-covers`:

1. Mene Supabase Dashboardiin → Storage
2. Klikkaa "New bucket"
3. Anna nimeksi: `blog-covers`
4. Valitse "Public bucket" (julkinen pääsy)
5. Klikkaa "Create bucket"

Tämän jälkeen voit ladata kuvia bucketiin ja käyttää niitä blogi-artikkeleissa.

### 3. Ympäristömuuttujat

Varmista että `.env.local` tiedostossa on:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Sovelluksen käynnistys

```bash
npm run dev
```

## Käyttö

### Julkisen blogin käyttö

1. Mene `/blog` sivulle
2. Selaa artikkeleita
3. Klikkaa artikkelia lukeaksesi sen kokonaan

### Admin-hallinta

1. Kirjaudu sisään
2. Mene `/admin-blog` sivulle
3. Käytä "Lisää uusi artikkeli" -painiketta
3. Täytä lomake:
   - **Otsikko**: Artikkelin otsikko (pakollinen)
   - **URL-slug**: Automaattisesti generoitu, mutta voit muokata
   - **Kategoria**: Valinnainen kategoria (esim. "Myynti", "Markkinointi")
   - **Julkaisupäivä**: Milloin artikkeli julkaistaan
   - **Kuvan URL**: Kuvan URL blog-covers bucketista (esim. `https://your-project.supabase.co/storage/v1/object/public/blog-covers/kuva.jpg`)
   - **Lyhyt kuvaus**: Lyhyt kuvaus listauksessa näkyväksi
   - **Sisältö**: Artikkelin sisältö Markdown-muodossa

**Huomio kuvista**: 
- Lataa kuvat ensin Supabase Storage:en `blog-covers` bucketiin
- Käytä kuvan URL:ää `image_url` kentässä
- Kuvat ovat julkisia ja näkyvät blogi-artikkeleissa

**Markdown-syntaksi**:
- **lihavointi**: `**teksti**`
- *kursiivi*: `*teksti*`
- ## Otsikko: `## Otsikko`
- Lista: `- kohde` tai `1. kohde`
- [Linkki](url): `[teksti](url)`
- `koodi`: `` `koodi` ``
- Lainaus: `> lainaus`

### Markdown-sisällön kirjoittaminen

Voit käyttää seuraavia Markdown-syntaksia artikkelissa:

```markdown
## Otsikko

Kappale tekstiä.

- Lista kohde 1
- Lista kohde 2

**Lihavoitu teksti**
*Kursivoitu teksti*
[Linkki](https://example.com)

> Tämä on lainaus

`koodi` tai koodiblokki:

```javascript
function example() {
  return "Hello World!";
}
```
```

## API-endpointit

### GET /api/get-articles
Hakee kaikki artikkelit julkaisupäivän mukaan järjestettynä.

### GET /api/get-article/[slug]
Hakee yksittäisen artikkelin slugin perusteella.

### POST /api/create-article
Luo uuden artikkelin.

### PUT /api/update-article/[id]
Päivittää olemassa olevan artikkelin.

### DELETE /api/delete-article/[id]
Poistaa artikkelin.

## Tietokantarakenne

```sql
blog_posts
├── id (BIGINT, Primary Key, Auto-increment)
├── created_at (TIMESTAMP WITH TIME ZONE)
├── title (TEXT)
├── slug (TEXT)
├── published (BOOLEAN)
├── excerpt (TEXT)
├── category (TEXT)
├── published_at (TIMESTAMP WITH TIME ZONE)
├── updated_at (TIMESTAMP WITH TIME ZONE)
├── image_url (TEXT) - kuva blog-covers bucketista
└── content (TEXT)
```

### Kuvien tallennus

Blogi-artikkelien kuvat tallennetaan Supabase Storage:en `blog-covers` bucketissa. Kuvan URL muodossa:
```
https://your-project.supabase.co/storage/v1/object/public/blog-covers/kuvan-nimi.jpg
```

## Kustomointi

### Tyylien muokkaaminen

- `BlogPage.css` - Julkisen blogi-sivun tyylit
- `BlogArticlePage.css` - Yksittäisen artikkelin tyylit
- `AdminBlogPage.css` - Admin-hallintasivun tyylit

### Komponenttien muokkaaminen

- `BlogPage.jsx` - Julkisen blogi-sivun komponentti
- `BlogArticlePage.jsx` - Yksittäisen artikkelin komponentti
- `AdminBlogPage.jsx` - Admin-hallintasivun komponentti

## Vianmääritys

### Yleisiä ongelmia

1. **Artikkeleita ei näy**
   - Tarkista että Supabase-taulut on luotu
   - Tarkista ympäristömuuttujat
   - Tarkista API-endpointit

2. **Admin-lomake ei toimi**
   - Varmista että olet kirjautunut sisään
   - Tarkista että olet admin-käyttäjä

3. **Kuvat eivät näy**
   - Tarkista että image_url on oikein
   - Varmista että kuva on julkisesti saatavilla

### Logit

Tarkista selaimen Developer Tools -konsoli virheiden varalta.

## Tulevaisuuden kehitys

Mahdollisia parannuksia:
- Kuvien upload-tuki
- Rich text editor
- Kategorioiden hallinta
- Hakutoiminto
- Kommentit
- Sosiaalisen median jakaminen
- Analytics ja tilastot

## Tuki

Jos kohtaat ongelmia, tarkista:
1. Supabase Dashboard - tietokanta ja RLS-politiikat
2. API-endpointit - Network-välilehti selaimessa
3. Console - JavaScript-virheet
4. Ympäristömuuttujat - .env.local tiedosto
