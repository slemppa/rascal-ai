/**
 * CORS helper utility
 * Rajaa CORS-asetukset tuotannossa omalle domainille, kehityksessä vain localhost
 */

/**
 * Palauttaa sallitun origin-arvon ympäristön mukaan
 * @returns {string} Sallittu origin
 */
export function getAllowedOrigin(req = null) {
  // Tuotannossa rajaa omalle domainille
  if (process.env.NODE_ENV === 'production') {
    return process.env.APP_URL || process.env.ALLOWED_ORIGIN || 'https://app.rascalai.fi'
  }
  
  // Kehityksessä sallitaan vain localhost eri porteilla
  const origin = req?.headers?.origin || req?.headers?.referer || ''
  
  // Sallitaan localhost eri porteilla (esim. http://localhost:3000, http://localhost:5173)
  if (origin && (
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:') ||
    origin.startsWith('http://[::1]:')
  )) {
    return origin
  }
  
  // Jos origin ei ole localhost, palautetaan oletus localhost:3000
  // Tämä on turvallisempi kuin '*' koska estää ulkoiset pyynnöt
  return 'http://localhost:3000'
}

/**
 * Asettaa CORS-headerit response-objektiin
 * @param {Object} res - Express/Vercel response-objekti
 * @param {string[]} methods - Sallitut HTTP-metodit (default: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
 * @param {string[]} headers - Sallitut headerit (default: ['Content-Type', 'Authorization'])
 */
export function setCorsHeaders(res, methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], headers = ['Content-Type', 'Authorization'], req = null) {
  const origin = getAllowedOrigin(req)
  
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', methods.join(', '))
  res.setHeader('Access-Control-Allow-Headers', headers.join(', '))
  
  // Credentials aina sallittu kun origin on määritelty (ei '*')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
}

/**
 * Käsittelee OPTIONS preflight-pyynnön
 * @param {Object} req - Request-objekti
 * @param {Object} res - Response-objekti
 * @returns {boolean} True jos preflight käsiteltiin, false muuten
 */
export function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res, undefined, undefined, req)
    res.status(200).end()
    return true
  }
  return false
}