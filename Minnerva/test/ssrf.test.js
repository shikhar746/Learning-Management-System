import test from "node:test"
import assert from "node:assert/strict"
import { validateAndExtractGithubRepo, isIpOrInternalHost } from "../src/lib/urlSafety.js"
import { createSubmissionSchema } from "../src/lib/validations/submission.js"

test("SSRF Protection - IP Literals & Internal Host Detection", () => {
  // Cloud Metadata IP (AWS / GCP / Azure)
  assert.equal(isIpOrInternalHost("169.254.169.254"), true)
  assert.equal(isIpOrInternalHost("http://169.254.169.254"), true)
  assert.equal(isIpOrInternalHost("https://169.254.169.254/latest/meta-data/"), true)

  // Loopback / Localhost
  assert.equal(isIpOrInternalHost("127.0.0.1"), true)
  assert.equal(isIpOrInternalHost("localhost"), true)
  assert.equal(isIpOrInternalHost("http://localhost:8080"), true)

  // Private IPv4 ranges
  assert.equal(isIpOrInternalHost("10.0.0.1"), true)
  assert.equal(isIpOrInternalHost("172.16.0.1"), true)
  assert.equal(isIpOrInternalHost("192.168.1.1"), true)
  assert.equal(isIpOrInternalHost("0.0.0.0"), true)

  // IPv6
  assert.equal(isIpOrInternalHost("::1"), true)
  assert.equal(isIpOrInternalHost("fd00::1"), true)

  // Hex / Octal IP representations
  assert.equal(isIpOrInternalHost("0x7f000001"), true)
  assert.equal(isIpOrInternalHost("2852039166"), true)

  // Official GitHub hostname should pass internal host check
  assert.equal(isIpOrInternalHost("github.com"), false)
})

test("SSRF Protection - validateAndExtractGithubRepo Rejection", () => {
  const maliciousInputs = [
    "169.254.169.254",
    "http://169.254.169.254",
    "https://169.254.169.254/latest/meta-data/",
    "http://localhost:3000",
    "http://127.0.0.1/admin",
    "https://10.0.0.1/repo",
    "https://evil-site.com/owner/repo",
    "http://github.com/owner/repo", // HTTP disallowed
    "https://raw.githubusercontent.com.attacker.com/owner/repo",
    "https://github.com.attacker.com/owner/repo",
  ]

  for (const input of maliciousInputs) {
    assert.throws(
      () => validateAndExtractGithubRepo(input),
      (err) => {
        assert.ok(err instanceof Error)
        return true
      },
      `Expected input "${input}" to be rejected`
    )
  }
})

test("SSRF Protection - Valid GitHub Repository Extraction", () => {
  const validInputs = [
    { input: "https://github.com/owner/repository", expected: { owner: "owner", repo: "repository" } },
    { input: "https://github.com/owner/repository.git", expected: { owner: "owner", repo: "repository" } },
    { input: "github.com/owner/my-repo", expected: { owner: "owner", repo: "my-repo" } },
    { input: "https://www.github.com/my-org/project_name/", expected: { owner: "my-org", repo: "project_name" } },
  ]

  for (const { input, expected } of validInputs) {
    const result = validateAndExtractGithubRepo(input)
    assert.deepEqual(result, expected)
  }
})

test("SSRF Protection - Submission Zod Schema Rejection for 169.254.169.254", () => {
  const badSubmission = {
    assignmentId: "assign-123",
    repoUrl: "169.254.169.254",
  }

  const result = createSubmissionSchema.safeParse(badSubmission)
  assert.equal(result.success, false)
  if (!result.success) {
    const issues = result.error.issues || result.error.errors
    assert.ok(issues[0].message.includes("IP addresses and non-GitHub hosts are forbidden"))
  }
})
