// api/lib/logger.js
// Logger-utility joka wrappaa console-metodit, lisää timestampit ja sanitizee herkät tiedot

const SENSITIVE_KEYS = [
  'authorization',
  'bearer',
  'api_key',
  'secret',
  'password',
  'token',
  'apikey',
  'api-key',
  'x-api-key'
]

/**
 * Tarkistaa sisältääkö avain herkkää tietoa
 */
function isSensitiveKey(key) {
  const lowerKey = String(key).toLowerCase()
  return SENSITIVE_KEYS.some(sensitiveKey => lowerKey.includes(sensitiveKey))
}

/**
 * Sanitizee objektin poistamalla herkät arvot
 */
function sanitize(obj) {
  if (obj === null || obj === undefined) {
    return obj
  }

  // Jos on primitiivi, palauta sellaisenaan
  if (typeof obj !== 'object') {
    return obj
  }

  // Jos on array, sanitizee jokainen elementti
  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item))
  }

  // Jos on objekti, käy läpi avaimet
  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key)) {
      // Korvaa herkkä tieto tähdillä
      sanitized[key] = '***REDACTED***'
    } else if (typeof value === 'object' && value !== null) {
      // Rekursiivisesti sanitizee sisäkkäiset objektit
      sanitized[key] = sanitize(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Muotoilee timestampin ISO-muotoon
 */
function getTimestamp() {
  return new Date().toISOString()
}

/**
 * Sanitizee argumentit ennen loggausta
 */
function sanitizeArgs(args) {
  return args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      return sanitize(arg)
    }
    return arg
  })
}

/**
 * Logger-objekti joka wrappaa console-metodit
 */
const logger = {
  log(...args) {
    const sanitizedArgs = sanitizeArgs(args)
    console.log(`[${getTimestamp()}]`, ...sanitizedArgs)
  },

  error(...args) {
    const sanitizedArgs = sanitizeArgs(args)
    console.error(`[${getTimestamp()}] ERROR:`, ...sanitizedArgs)
  },

  warn(...args) {
    const sanitizedArgs = sanitizeArgs(args)
    console.warn(`[${getTimestamp()}] WARN:`, ...sanitizedArgs)
  },

  info(...args) {
    const sanitizedArgs = sanitizeArgs(args)
    console.info(`[${getTimestamp()}] INFO:`, ...sanitizedArgs)
  },

  debug(...args) {
    const sanitizedArgs = sanitizeArgs(args)
    console.debug(`[${getTimestamp()}] DEBUG:`, ...sanitizedArgs)
  }
}

export default logger
