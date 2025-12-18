import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const PBKDF2_ITERATIONS = 100000
const PBKDF2_KEYLEN = 32 // 256 bit
const SALT_LENGTH = 16

/**
 * Salaa tekstin AES-256-GCM -algoritmilla käyttäen PBKDF2:ta avaimen johtamiseen.
 * Palauttaa merkkijonon muodossa: SALT:IV:AUTH_TAG:ENCRYPTED_DATA (hex-enkoodattuna).
 */
export function encrypt(text, masterKey) {
  if (!masterKey) {
    throw new Error('Encryption key is required')
  }

  // 1. Generoi salt
  const salt = crypto.randomBytes(SALT_LENGTH)

  // 2. Johda avain PBKDF2:lla
  const key = crypto.pbkdf2Sync(
    String(masterKey),
    salt,
    PBKDF2_ITERATIONS,
    PBKDF2_KEYLEN,
    'sha256'
  )

  // 3. Generoi IV
  const iv = crypto.randomBytes(16)

  // 4. Salaa
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(String(text), 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag().toString('hex')

  // 5. Palauta: SALT:IV:AUTH_TAG:DATA (kaikki hex-muodossa)
  return [salt.toString('hex'), iv.toString('hex'), authTag, encrypted].join(':')
}

/**
 * Purkaa AES-256-GCM:llä salatun tekstin, joka on muodossa:
 * SALT:IV:AUTH_TAG:ENCRYPTED_DATA (hex-enkoodattuna) - uusi muoto
 * TAI
 * IV:AUTH_TAG:ENCRYPTED_DATA (hex-enkoodattuna) - vanha muoto (taaksepäin yhteensopivuus)
 */
export function decrypt(payload, masterKey) {
  if (!masterKey) {
    throw new Error('Encryption key is required')
  }

  if (!payload || typeof payload !== 'string') {
    throw new Error('Invalid encrypted payload')
  }

  const parts = payload.split(':')
  
  // Vanha muoto: IV:AUTH_TAG:DATA (3 osaa) - taaksepäin yhteensopivuus
  if (parts.length === 3) {
    return decryptLegacy(payload, masterKey)
  }
  
  // Uusi muoto: SALT:IV:AUTH_TAG:DATA (4 osaa)
  if (parts.length === 4) {
    return decryptNew(payload, masterKey)
  }
  
  throw new Error('Invalid encrypted text format')
}

/**
 * Vanha salausmuoto (SHA-256) - taaksepäin yhteensopivuus
 */
function decryptLegacy(payload, masterKey) {
  const parts = payload.split(':')
  const [ivHex, authTagHex, encryptedHex] = parts

  // Vanha tapa: SHA-256
  const key = crypto.createHash('sha256').update(String(masterKey)).digest()
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Uusi salausmuoto (PBKDF2)
 */
function decryptNew(payload, masterKey) {
  const parts = payload.split(':')
  const [saltHex, ivHex, authTagHex, encryptedHex] = parts

  // 1. Lue salt
  const salt = Buffer.from(saltHex, 'hex')
  
  // 2. Johda avain PBKDF2:lla
  const key = crypto.pbkdf2Sync(
    String(masterKey),
    salt,
    PBKDF2_ITERATIONS,
    PBKDF2_KEYLEN,
    'sha256'
  )
  
  // 3. Lue IV ja authTag
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  // 4. Pura
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Luo HMAC-SHA256 allekirjoituksen payloadille.
 * Käytetään webhookien varmentamiseen.
 */
export function generateHmacSignature(content, secret, timestamp) {
  if (!secret) {
    throw new Error('HMAC secret is required')
  }

  // Yhdistetään aikaleima ja sisältö pisteellä (yleinen käytäntö, esim. Stripe)
  // Tämä varmistaa, että allekirjoitus sitoo sekä datan että ajan.
  const dataToSign = `${timestamp}.${content}`

  return crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('hex')
}

