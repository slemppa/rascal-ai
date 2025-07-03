// Versionhallinta-utility
const CURRENT_VERSION = '1.9.0' // Tämä päivittyy automaattisesti package.json:sta

// Testausta varten - poista tämä tuotannossa
const FORCE_SHOW_UPDATE = true // Aseta true:ksi testataksesi popupia

// Parsii changelog-tiedoston ja palauttaa käyttäjälle relevantit muutokset
export const parseChangelog = async () => {
  try {
    const response = await fetch('/CHANGELOG.md')
    const changelogText = await response.text()
    
    // Etsitään uusimman version muutokset
    const versionMatch = changelogText.match(/## \[([^\]]+)\].*?\n(.*?)(?=\n## \[|$)/s)
    if (!versionMatch) return { version: CURRENT_VERSION, changes: [] }
    
    const version = versionMatch[1]
    const versionContent = versionMatch[2]
    
    // Parsitaan muutokset
    const changes = []
    const lines = versionContent.split('\n')
    let currentType = null
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Tarkistetaan onko kyseessä muutostyyppi
      if (trimmedLine.startsWith('### ✨ Features')) {
        currentType = 'feat'
      } else if (trimmedLine.startsWith('### 🐛 Bug Fixes')) {
        currentType = 'fix'
      } else if (trimmedLine.startsWith('### 💄 Styles')) {
        currentType = 'style'
      } else if (trimmedLine.startsWith('### ')) {
        currentType = null // Muut tyypit ohitetaan
      } else if (trimmedLine.startsWith('* ') && currentType) {
        // Parsitaan muutos
        const description = trimmedLine
          .replace(/^\* /, '') // Poistetaan bullet point
          .replace(/\[([^\]]+)\]\([^)]+\)/, '$1') // Poistetaan linkit
          .replace(/\([^)]+\)/, '') // Poistetaan sulkeet ja niiden sisältö
        
        changes.push({
          type: currentType,
          description: description.trim()
        })
      }
    }
    
    return { version, changes }
  } catch (error) {
    console.warn('Changelog parsing failed:', error)
    return { version: CURRENT_VERSION, changes: [] }
  }
}

// Tarkistaa onko käyttäjälle näytetty uusin versio
export const shouldShowVersionUpdate = () => {
  if (FORCE_SHOW_UPDATE) return true // Testausta varten
  const lastShownVersion = localStorage.getItem('lastShownVersion')
  return lastShownVersion !== CURRENT_VERSION
}

// Merkitsee version näytetyksi
export const markVersionAsShown = () => {
  localStorage.setItem('lastShownVersion', CURRENT_VERSION)
}

// Palauttaa nykyisen version
export const getCurrentVersion = () => CURRENT_VERSION 