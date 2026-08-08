import net from "node:net"

/**
 * Checks if a hostname string is an IP address or internal/loopback/cloud metadata host.
 */
export function isIpOrInternalHost(hostname) {
  if (!hostname || typeof hostname !== "string") return true
  let raw = hostname.toLowerCase().trim()

  // 1. If full URL, parse using new URL()
  if (/^https?:\/\//i.test(raw)) {
    try {
      raw = new URL(raw).hostname
    } catch {
      raw = raw.replace(/^https?:\/\//i, "").split("/")[0]
    }
  } else {
    raw = raw.split("/")[0]
  }

  // Handle IPv6 enclosed in brackets like [::1]:8080 or [::1]
  if (raw.startsWith("[")) {
    const end = raw.indexOf("]")
    if (end !== -1) {
      raw = raw.slice(1, end)
    }
  } else if (!net.isIP(raw) && raw.includes(":") && !raw.includes("::")) {
    // IPv4 host:port -> split by port
    raw = raw.split(":")[0]
  }

  const lowerHost = raw.trim()
  if (!lowerHost) return true

  // Check if lowerHost is localhost or internal domain
  if (
    lowerHost === "localhost" ||
    lowerHost.endsWith(".localhost") ||
    lowerHost.endsWith(".local") ||
    lowerHost.endsWith(".internal")
  ) {
    return true
  }

  // Check if net.isIP recognizes it as IPv4 or IPv6 (reject ALL IP literals)
  if (net.isIP(lowerHost) !== 0) {
    return true
  }

  // Additional regex checks for hex/octal/decimal IP formats (e.g. 0x7f000001, 2852039166, 0177.0.0.1)
  if (/^(0x[0-9a-f]+|\d+)$/i.test(lowerHost)) {
    return true
  }
  if (/^0[0-7]+\./.test(lowerHost) || /^0x[0-9a-f]+\./i.test(lowerHost)) {
    return true
  }
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(lowerHost)) {
    return true
  }

  return false
}

/**
 * Validates a GitHub repository URL and extracts owner and repo.
 * Enforces HTTPS scheme, exact hostname allowlist ("github.com" or "www.github.com"),
 * rejects IP literals/internal hosts, and returns structured { owner, repo }.
 */
export function validateAndExtractGithubRepo(repoUrl) {
  if (!repoUrl || typeof repoUrl !== "string") {
    throw new Error("Repository URL must be a non-empty string")
  }

  const trimmed = repoUrl.trim()

  // Pre-check for IP literals in input string
  if (isIpOrInternalHost(trimmed)) {
    throw new Error("Repository URL cannot be an IP address or internal host")
  }

  let parsedUrl
  try {
    // If user provided owner/repo without scheme, prepending https:// for parsing
    const rawString = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    parsedUrl = new URL(rawString)
  } catch (err) {
    throw new Error(`Invalid URL format: ${err.message}`)
  }

  // 1. Enforce HTTPS scheme only
  if (parsedUrl.protocol !== "https:") {
    throw new Error("Invalid URL scheme: Only HTTPS is allowed")
  }

  // 2. Reject IP literals or internal hosts in hostname
  const hostname = parsedUrl.hostname.toLowerCase()
  if (isIpOrInternalHost(hostname)) {
    throw new Error("Access to IP addresses, loopback, or private networks is strictly forbidden")
  }

  // 3. Enforce exact hostname allowlist (no wildcard, no subdomain matching)
  const ALLOWED_HOSTNAMES = ["github.com", "www.github.com"]
  if (!ALLOWED_HOSTNAMES.includes(hostname)) {
    throw new Error(`Invalid hostname "${hostname}": Only official github.com repositories are allowed`)
  }

  // 4. Extract owner and repo from pathname using strict regex
  // Expected path format: /owner/repo or /owner/repo.git or /owner/repo/
  const match = parsedUrl.pathname.match(/^\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)(\.git|\/|$)/)
  if (!match) {
    throw new Error("Invalid GitHub repository path. Expected format: https://github.com/owner/repository")
  }

  const owner = match[1]
  const repo = match[2].replace(/\.git$/, "")

  // Validate owner and repo tokens
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(owner) || !/^[a-zA-Z0-9_-]{1,100}$/.test(repo)) {
    throw new Error("Invalid GitHub owner or repository name tokens")
  }

  return { owner, repo }
}

/**
 * Safe fetch wrapper that enforces redirect safety with manual redirect inspection.
 */
export async function safeFetch(url, options = {}) {
  let targetUrl
  try {
    targetUrl = new URL(url)
  } catch (err) {
    throw new Error(`Invalid fetch URL: ${err.message}`)
  }

  // Validate target URL scheme and hostname
  if (targetUrl.protocol !== "https:") {
    throw new Error("Outbound requests must use HTTPS protocol")
  }

  const hostname = targetUrl.hostname.toLowerCase()
  const ALLOWED_FETCH_HOSTNAMES = [
    "api.github.com",
    "raw.githubusercontent.com",
    "api.groq.com",
    "api.openai.com",
    "api.anthropic.com",
    "generativelanguage.googleapis.com",
    "api.moonshot.cn",
    "dashscope.aliyuncs.com",
    "api.together.xyz",
  ]

  if (isIpOrInternalHost(hostname) || !ALLOWED_FETCH_HOSTNAMES.includes(hostname)) {
    throw new Error(`Outbound fetch blocked for host "${hostname}": Target host is not on SSRF allowlist`)
  }

  // Perform fetch with manual redirect handling to prevent SSRF redirect bypasses
  const response = await fetch(targetUrl.toString(), {
    ...options,
    redirect: "manual",
  })

  // Handle redirects manually if returned (301, 302, 307, 308)
  if ([301, 302, 307, 308].includes(response.status)) {
    const location = response.headers.get("location")
    if (!location) {
      throw new Error(`Redirect response from ${hostname} missing Location header`)
    }

    const redirectUrl = new URL(location, targetUrl)
    const redirectHost = redirectUrl.hostname.toLowerCase()

    if (redirectUrl.protocol !== "https:" || isIpOrInternalHost(redirectHost) || !ALLOWED_FETCH_HOSTNAMES.includes(redirectHost)) {
      throw new Error(`SSRF Blocked: Redirect target "${redirectHost}" is not allowed`)
    }

    return await fetch(redirectUrl.toString(), {
      ...options,
      redirect: "manual",
    })
  }

  return response
}
