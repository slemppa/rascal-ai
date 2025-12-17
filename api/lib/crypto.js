import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

/**
 * Salaa tekstin AES-256-GCM -algoritmilla.
 * Palauttaa merkkijonon muodossa: IV:AUTH_TAG:ENCRYPTED_DATA (hex-enkoodattuna).
 */
export function encrypt(text, masterKey) {
  if (!masterKey) {
    throw new Error('Encryption key is required')
  }

  const iv = crypto.randomBytes(16)

  // Johdetaan 32 tavun avain masterKeystä
  const key = crypto.createHash('sha256').update(String(masterKey)).digest()

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(String(text), 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag().toString('hex')

  // IV:AUTH_TAG:DATA (kaikki hex-muodossa)
  return [iv.toString('hex'), authTag, encrypted].join(':')
}

/**
 * Purkaa AES-256-GCM:llä salatun tekstin, joka on muodossa:
 * IV:AUTH_TAG:ENCRYPTED_DATA (hex-enkoodattuna).
 */
export function decrypt(payload, masterKey) {
  if (!masterKey) {
    throw new Error('Encryption key is required')
  }

  if (!payload || typeof payload !== 'string') {
    throw new Error('Invalid encrypted payload')
  }

  const parts = payload.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format')
  }

  const [ivHex, authTagHex, encryptedHex] = parts

  const key = crypto.createHash('sha256').update(String(masterKey)).digest()
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

