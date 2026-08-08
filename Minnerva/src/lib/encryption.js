import crypto from "node:crypto"

const ALGORITHM = "aes-256-gcm"

/**
 * Returns encryption secret key.
 * Throws immediate error in production/staging if secret is unconfigured.
 */
export function getSecret() {
  const envSecret = process.env.ENCRYPTION_SECRET || process.env.AUTH_SECRET
  if (envSecret && envSecret.trim().length > 0) {
    return envSecret.trim()
  }

  const isProdOrStaging = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging"
  if (isProdOrStaging) {
    throw new Error(
      "CRITICAL CONFIGURATION ERROR: ENCRYPTION_SECRET (or AUTH_SECRET) must be explicitly defined in production or staging environments. Fallback keys are prohibited."
    )
  }

  console.warn(
    "[SECURITY WARNING]: ENCRYPTION_SECRET is not set. Using local development fallback key. DO NOT USE IN PRODUCTION."
  )
  return "minnerva_default_secret_key_32_bytes!!"
}

function getKey() {
  return crypto.createHash("sha256").update(getSecret()).digest()
}

/**
 * Encrypts plaintext string using AES-256-GCM.
 * Returns payload string in format `iv:authTag:encryptedHex`
 */
export function encrypt(text) {
  if (!text || typeof text !== "string" || text.trim().length === 0) return null
  const trimmed = text.trim()
  if (trimmed.includes(":") && trimmed.length > 50 && /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i.test(trimmed)) {
    // Already encrypted
    return trimmed
  }

  const iv = crypto.randomBytes(12)
  const key = getKey()
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(trimmed, "utf8", "hex")
  encrypted += cipher.final("hex")
  const authTag = cipher.getAuthTag().toString("hex")

  return `${iv.toString("hex")}:${authTag}:${encrypted}`
}

/**
 * Decrypts ciphertext in format `iv:authTag:encryptedHex`.
 * Returns plaintext string. Returns original string if not encrypted (smooth migration fallback).
 */
export function decrypt(cipherText) {
  if (!cipherText || typeof cipherText !== "string" || cipherText.trim().length === 0) return null

  const parts = cipherText.trim().split(":")
  if (parts.length !== 3) {
    // Plaintext fallback for legacy unencrypted keys
    return cipherText.trim()
  }

  try {
    const [ivHex, authTagHex, encryptedHex] = parts
    const iv = Buffer.from(ivHex, "hex")
    const authTag = Buffer.from(authTagHex, "hex")
    const key = getKey()

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedHex, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
  } catch (err) {
    console.error("[Encryption Error]: Failed to decrypt ciphertext:", err.message)
    return null
  }
}
