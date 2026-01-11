/**
 * Helper-funktiot strategian etsimiseen ja kuukausi-vertailuun
 */

export const ENGLISH_MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
]

export const FINNISH_MONTH_NAMES = [
  'tammikuu', 'helmikuu', 'maaliskuu', 'huhtikuu', 'toukokuu', 'kesäkuu',
  'heinäkuu', 'elokuu', 'syyskuu', 'lokakuu', 'marraskuu', 'joulukuu'
]

/**
 * Etsii strategian joka vastaa annettua kuukautta ja vuotta
 * @param {Array} strategies - Kaikki käyttäjän strategiat
 * @param {number} targetMonth - Kuukauden indeksi (0-11)
 * @param {number} targetYear - Vuosi
 * @returns {Object|null} Löydetty strategia tai null
 */
export function findStrategyByMonthAndYear(strategies, targetMonth, targetYear) {
  if (!strategies || strategies.length === 0) {
    return null
  }

  const targetMonthName = ENGLISH_MONTH_NAMES[targetMonth]
  const targetMonthNameFi = FINNISH_MONTH_NAMES[targetMonth]
  
  // Laske kuukauden alku ja loppu vertailua varten
  const monthStart = new Date(targetYear, targetMonth, 1)
  const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999)
  
  return strategies.find(strategy => {
    // Jos target_month on saatavilla, käytetään sitä (tarkempi)
    if (strategy.target_month) {
      const targetDate = new Date(strategy.target_month)
      return targetDate >= monthStart && targetDate <= monthEnd
    }
    
    // Muuten käytetään month-kenttää (kuukauden nimi)
    if (!strategy.month) return false
    
    const monthLower = strategy.month.toLowerCase()
    const hasMonth = monthLower.includes(targetMonthName) ||
                     monthLower.includes(targetMonthNameFi)
    
    // Jos month-kentässä ei ole vuotta, hyväksytään jos kuukausi täsmää
    // (vanhat strategiat voivat olla ilman vuotta)
    return hasMonth
  }) || null
}

/**
 * Etsii strategian joka vastaa seuraavaa kuukautta ja vuotta
 * @param {Array} strategies - Kaikki käyttäjän strategiat
 * @param {number} nextMonth - Seuraavan kuukauden indeksi (0-11)
 * @param {number} nextYear - Seuraavan vuoden vuosi
 * @returns {Object|null} Löydetty strategia tai null
 */
export function findNextMonthStrategy(strategies, nextMonth, nextYear) {
  if (!strategies || strategies.length === 0) {
    return null
  }

  const nextMonthName = ENGLISH_MONTH_NAMES[nextMonth]
  const nextMonthNameFi = FINNISH_MONTH_NAMES[nextMonth]

  return strategies.find(strategy => {
    if (!strategy.month) return false
    
    const monthLower = strategy.month.toLowerCase()
    const hasMonth = monthLower.includes(nextMonthName) ||
                     monthLower.includes(nextMonthNameFi)
    const hasYear = monthLower.includes(String(nextYear))
    
    return hasMonth && hasYear
  }) || null
}

/**
 * Laskee kuukausirajan tilauksen perusteella
 * @param {string} subscriptionStatus - Tilauksen tila ('free', 'pro', 'enterprise')
 * @returns {number} Kuukausiraja
 */
export function calculateMonthlyLimit(subscriptionStatus) {
  const status = String(subscriptionStatus || 'free').toLowerCase()
  
  switch (status) {
    case 'pro':
      return 100
    case 'enterprise':
      return 999999
    default:
      return 30
  }
}

