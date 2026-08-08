import test from "node:test"
import assert from "node:assert/strict"
import { encrypt, decrypt } from "../src/lib/encryption.js"
import { sanitizeWorkshop } from "../src/services/workshopService.js"
import { parseScoreToBasisPoints, formatScoreFromBasisPoints } from "../src/services/submissionService.js"

test("Issue 1: AES-256-GCM Encryption & Decryption of aiApiKey at rest", () => {
  const rawKey = "gsk_test_groq_api_key_123456789"

  // 1. Encrypt key
  const encryptedKey = encrypt(rawKey)
  assert.notEqual(encryptedKey, rawKey)
  assert.ok(encryptedKey.includes(":"), "Encrypted string should contain IV and authTag separators")

  // 2. Decrypt key
  const decryptedKey = decrypt(encryptedKey)
  assert.equal(decryptedKey, rawKey)

  // 3. Fallback for unencrypted legacy key
  const legacyKey = "legacy_unencrypted_key_999"
  assert.equal(decrypt(legacyKey), legacyKey)
})

test("Issue 1: Workshop Response Sanitization - Never expose aiApiKey", () => {
  const workshopWithRawKey = {
    id: "ws-101",
    name: "AI Systems Engineering",
    code: "AI101",
    aiProvider: "GROQ",
    aiApiKey: "gsk_secret_key_should_never_be_sent_to_client",
    createdAt: new Date(),
  }

  const sanitized = sanitizeWorkshop(workshopWithRawKey)

  assert.equal(sanitized.hasAiApiKey, true)
  assert.equal(sanitized.aiApiKey, "••••••••")
  assert.notEqual(sanitized.aiApiKey, workshopWithRawKey.aiApiKey)

  // Empty key case
  const workshopWithoutKey = {
    id: "ws-102",
    name: "Intro to Python",
    code: "PY101",
    aiProvider: "DEFAULT",
    aiApiKey: null,
  }

  const sanitizedEmpty = sanitizeWorkshop(workshopWithoutKey)
  assert.equal(sanitizedEmpty.hasAiApiKey, false)
  assert.equal(sanitizedEmpty.aiApiKey, null)
})

test("Issue 3: Integer Basis Points Scale - Eliminates JavaScript Float Drift", () => {
  // Test floating point drift scenario: sum of 0.1 repeatedly in standard JS floats
  let floatSum = 0
  for (let i = 0; i < 10; i++) {
    floatSum += 0.1
  }
  // Standard JS float arithmetic produces float drift: 0.9999999999999999 or 1.0000000000000002
  assert.notEqual(floatSum, 1.0, "Standard JS float math produces float drift")

  // Integer Marks Scale:
  let integerMarksSum = 0
  for (let i = 0; i < 10; i++) {
    integerMarksSum += parseScoreToBasisPoints(10) // 10 marks each
  }

  assert.equal(integerMarksSum, 100) // Exact integer sum (100 marks)
  const displayScore = formatScoreFromBasisPoints(integerMarksSum)
  assert.equal(displayScore, 100) // Exact integer score 100

  // Test realistic grading scores: e.g. 86 functionality + 92 quality
  const scoreA = parseScoreToBasisPoints(86) // 86
  const scoreB = parseScoreToBasisPoints(92) // 92

  const totalMarks = scoreA + scoreB // 178
  const averageMarks = Math.round(totalMarks / 2) // 89 marks

  assert.equal(totalMarks, 178)
  assert.equal(formatScoreFromBasisPoints(totalMarks), 178)
  assert.equal(formatScoreFromBasisPoints(averageMarks), 89)
})
