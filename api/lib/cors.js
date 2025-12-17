/**
 * CORS helper utility
 * Rajaa CORS-asetukset tuotannossa omalle domainille, kehityksessä sallii kaikki
 */

/**
 * Palauttaa sallitun origin-arvon ympäristön mukaan
 * @returns {string} Sallittu origin
 */
export function getAllowedOrigin() {
  // Tuotannossa rajaa omalle domainille
  if (process.env.NODE_ENV === 'production') {
    return process.env.APP_URL || process.env.ALLOWED_ORIGIN || 'https://app.rascalai.fi'
  }
  // Kehityksessä sallitaan kaikki
  return '*'
}

/**
 * Asettaa CORS-headerit response-objektiin
 * @param {Object} res - Express/Vercel response-objekti
 * @param {string[]} methods - Sallitut HTTP-metodit (default: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
 * @param {string[]} headers - Sallitut headerit (default: ['Content-Type', 'Authorization'])
 */
export function setCorsHeaders(res, methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], headers = ['Content-Type', 'Authorization']) {
  const origin = getAllowedOrigin()
  
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', methods.join(', '))
  res.setHeader('Access-Control-Allow-Headers', headers.join(', '))
  
  // Credentials vain jos origin ei ole '*'
  if (origin !== '*') {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
}

/**
 * Käsittelee OPTIONS preflight-pyynnön
 * @param {Object} req - Request-objekti
 * @param {Object} res - Response-objekti
 * @returns {boolean} True jos preflight käsiteltiin, false muuten
 */
export function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res)
    res.status(200).end()
    return true
  }
  return false
}