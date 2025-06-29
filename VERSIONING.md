# Versionhallinta - Ohjeet

## Semanttinen versionointi (SemVer)

Käytämme semanttista versionointia muodossa `MAJOR.MINOR.PATCH`:

- **MAJOR** (1.0.0): Taaksepäin yhteensopimattomat muutokset
- **MINOR** (1.1.0): Uusia ominaisuuksia taaksepäin yhteensopivasti
- **PATCH** (1.0.1): Bugfixit taaksepäin yhteensopivasti

## Commit-viestien muoto

Käytä conventional commits -muotoa:

```
type(scope): description

[optional body]

[optional footer]
```

### Tyypit:
- `feat`: Uusi ominaisuus
- `fix`: Bugfix
- `docs`: Dokumentaation muutokset
- `style`: Koodin muotoilun muutokset
- `refactor`: Koodin refaktorointi
- `perf`: Suorituskyvyn parannukset
- `test`: Testien muutokset
- `build`: Build-järjestelmän muutokset
- `ci`: CI/CD muutokset
- `chore`: Muut muutokset

### Esimerkkejä:
```bash
git commit -m "feat: add user authentication system"
git commit -m "fix: resolve login form validation error"
git commit -m "docs: update API documentation"
git commit -m "refactor: simplify dashboard component"
```

## Version päivitys

### Automaattinen version päivitys:
```bash
# Päivitä versio automaattisesti commit-viestien perusteella
npm run release

# Tietty versio
npm run release:patch  # 1.0.0 -> 1.0.1
npm run release:minor  # 1.0.0 -> 1.1.0
npm run release:major  # 1.0.0 -> 2.0.0

# Pre-release versiot
npm run release:alpha  # 1.0.0 -> 1.0.0-alpha.0
npm run release:beta   # 1.0.0 -> 1.0.0-beta.0
npm run release:rc     # 1.0.0 -> 1.0.0-rc.0
```

### Manuaalinen version päivitys:
```bash
# Päivitä package.json versio
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# Luo tag
git tag v1.0.1
git push origin v1.0.1
```

## Hotfix-prosessi

Jos tuotannossa on kriittinen bugi:

1. **Luo hotfix-branch:**
```bash
git checkout -b hotfix/critical-bug-fix
```

2. **Korjaa bugi ja committaa:**
```bash
git add .
git commit -m "fix: resolve critical production bug"
```

3. **Päivitä versio:**
```bash
npm run release:patch
```

4. **Merge ja deploy:**
```bash
git checkout main
git merge hotfix/critical-bug-fix
git push origin main
git push --tags
```

5. **Poista hotfix-branch:**
```bash
git branch -d hotfix/critical-bug-fix
```

## Changelog

CHANGELOG.md päivittyy automaattisesti `npm run release` komennolla. Se sisältää:
- Kaikki commitit viimeisestä releasesta
- Kategorisoidut muutokset (Features, Bug Fixes, jne.)
- Päivämäärät ja versionumero

## Version näkyvyys sovelluksessa

Version näkyy Settings-sivulla `VersionInfo`-komponentin kautta. Se hakee versionin `package.json` tiedostosta.

## Hyödyllisiä komentoja

```bash
# Näytä nykyinen versio
npm version

# Näytä kaikki tagit
git tag -l

# Näytä viimeisin tag
git describe --tags --abbrev=0

# Näytä commitit viimeisestä tagista
git log $(git describe --tags --abbrev=0)..HEAD --oneline
``` 