/**
 * Rate Limiting utility using Upstash Redis
 * 
 * Tämä moduuli tarjoaa rate limiting -toiminnallisuuden API-endpointeille
 * estääkseen väsytyshyökkäykset ja kontrolloidakseen API-kustannuksia.
 * 
 * Käyttö:
 * import { rateLimit } from '../_lib/rate-limit.js'
 * 
 * export default async function handler(req, res) {
 *   const identifier = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
 *   const { success, limit, remaining, reset } = await rateLimit(identifier, {
 *     limit: 10,      // Pyyntöjä
 *     window: '1 m'  // Aikajakso
 *   })
 *   
 *   if (!success) {
 *     return res.status(429).json({ 
 *       error: 'Too many requests',
 *       retryAfter: reset 
 *     })
 *   }
 *   
 *   // Jatka normaalisti...
 * }
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Alusta Redis-yhteys Upstashista
// Ympäristömuuttujat: UPSTASH_REDIS_REST_URL ja UPSTASH_REDIS_REST_TOKEN
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

/**
 * Oletusarvoinen rate limiter (10 pyyntöä minuutissa)
 */
const defaultRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: '@rascal-ai/rate-limit',
})

/**
 * Rate limit -funktio
 * 
 * @param {string} identifier - Yksilöllinen tunniste (esim. IP-osoite, user ID)
 * @param {Object} options - Rate limit -asetukset
 * @param {number} options.limit - Pyyntöjen määrä
 * @param {string} options.window - Aikajakso ('1 s', '1 m', '1 h', '1 d')
 * @param {string} options.prefix - Redis-avaimen etuliite (valinnainen)
 * @returns {Promise<Object>} { success, limit, remaining, reset }
 */
export async function rateLimit(identifier, options = {}) {
  const {
    limit = 10,
    window = '1 m',
    prefix = '@rascal-ai/rate-limit',
  } = options

  // Jos Upstash-asetukset puuttuvat, palautetaan success (ei rate limitingia)
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('Rate limiting disabled: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set')
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Date.now() + 60000, // 1 minuutti
    }
  }

  // Käytä oletusarvoista tai luo uusi limiter
  const limiter = options.limit === 10 && options.window === '1 m'
    ? defaultRateLimiter
    : new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, window),
        analytics: true,
        prefix: prefix,
      })

  try {
    const result = await limiter.limit(identifier)
    return result
  } catch (error) {
    console.error('Rate limiting error:', error)
    // Jos rate limiting epäonnistuu, sallitaan pyyntö (fail open)
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Date.now() + 60000,
    }
  }
}

/**
 * Rate limit middleware Vercel API-reiteille
 * 
 * @param {Object} options - Rate limit -asetukset
 * @returns {Function} Middleware-funktio
 */
export function rateLimitMiddleware(options = {}) {
  return async (req, res, next) => {
    // Hae identifier (IP-osoite tai user ID)
    const identifier = 
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      'unknown'

    const result = await rateLimit(identifier, options)

    // Aseta rate limit -headerit vastaukseen
    res.setHeader('X-RateLimit-Limit', result.limit)
    res.setHeader('X-RateLimit-Remaining', result.remaining)
    res.setHeader('X-RateLimit-Reset', new Date(result.reset).toISOString())

    if (!result.success) {
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again after ${new Date(result.reset).toISOString()}`,
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000), // sekunteina
      })
    }

    // Jatka seuraavaan middlewareen tai handleriin
    if (next) {
      next()
    }
  }
}

/**
 * Eri endpoint-tyypeille suunnitellut rate limit -asetukset
 */
export const rateLimitPresets = {
  // Kirjautuminen ja autentikointi
  auth: {
    limit: 5,
    window: '15 m',
    prefix: '@rascal-ai/auth',
  },
  
  // AI-chat ja raskaat AI-toiminnot
  ai: {
    limit: 20,
    window: '1 m',
    prefix: '@rascal-ai/ai',
  },
  
  // Yleiset API-kutsut
  api: {
    limit: 100,
    window: '1 m',
    prefix: '@rascal-ai/api',
  },
  
  // Tiedostojen lataus/upload
  upload: {
    limit: 10,
    window: '1 m',
    prefix: '@rascal-ai/upload',
  },
  
  // Webhookit
  webhook: {
    limit: 50,
    window: '1 m',
    prefix: '@rascal-ai/webhook',
  },
}

