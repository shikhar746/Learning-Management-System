import { z } from "zod"
import { db } from "../lib/db.js"
import { validateAndExtractGithubRepo, safeFetch } from "../lib/urlSafety.js"
import { decrypt } from "../lib/encryption.js"

/**
 * Zod Schema for strict LLM Evaluation Output validation
 */
const evaluationResultSchema = z.object({
  functionalityScore: z.coerce.number().min(0).max(100).optional().default(85),
  qualityScore: z.coerce.number().min(0).max(100).optional().default(85),
  aiDetectionScore: z.coerce.number().min(0).max(100).optional().default(100),
  documentationScore: z.coerce.number().min(0).max(100).optional().nullable(),
  suggestedScore: z.coerce.number().min(0),
  suggestedFeedback: z.string().default("No feedback provided."),
})

/**
 * Heuristic fallback ratio constants
 */
const FALLBACK_SCORE_RATIOS = {
  BASE_SUBMISSION: 0.85,
  REPO_URL_BONUS: 0.10,
  DEPLOYMENT_URL_BONUS: 0.05,
}

/**
 * Helper to fetch GitHub repo structure and code snippets for LLM inspection
 * Enforces strict SSRF protection, IP literal rejection, hostname allowlisting, and manual redirect handling.
 */
async function fetchGithubRepoContent(repoUrl) {
  if (!repoUrl || typeof repoUrl !== "string") return null
  try {
    // 1. Strictly validate repoUrl and extract owner/repo tokens
    const { owner, repo } = validateAndExtractGithubRepo(repoUrl)

    const headers = {
      "User-Agent": "Minnerva-LMS-Grading-Bot",
      Accept: "application/vnd.github.v3+json",
    }

    // 2. Server-side URL construction from validated owner & repo tokens
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`
    const contentsRes = await safeFetch(apiUrl, { headers })
    if (!contentsRes.ok) return null

    const items = await contentsRes.json()
    if (!Array.isArray(items)) return null

    const fileList = items.map((f) => `- ${f.name} (${f.type})`).slice(0, 20).join("\n")
    let codeSnippet = ""

    const readmeFile = items.find((f) => f.name && typeof f.name === "string" && f.name.toLowerCase() === "readme.md")
    if (readmeFile && readmeFile.download_url) {
      // 3. Re-validate download_url against SSRF allowlist using safeFetch
      const readmeRes = await safeFetch(readmeFile.download_url, { headers })
      if (readmeRes.ok) {
        const text = await readmeRes.text()
        codeSnippet += `\n--- README.md ---\n` + text.slice(0, 1500)
      }
    }

    return `Repository File Tree:\n${fileList}${codeSnippet}`
  } catch (err) {
    console.warn("[GitHub Fetch Warning]:", err.message)
    // Throw validation / SSRF errors so caller can handle and reject if necessary
    if (
      err.message.includes("IP address") ||
      err.message.includes("forbidden") ||
      err.message.includes("Invalid hostname") ||
      err.message.includes("Only official github.com") ||
      err.message.includes("Invalid URL")
    ) {
      throw err
    }
    return null
  }
}

/**
 * Main Service Entry Point: Evaluates a student submission using BYOK multi-provider AI models
 */
export async function evaluateSubmissionWithByok(submissionId) {
  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      repoUrl: true,
      deploymentUrl: true,
      driveUrl: true,
      comments: true,
      assignment: {
        select: {
          id: true,
          title: true,
          description: true,
          instructions: true,
          maxMarks: true,
          requireDocumentation: true,
          gradingCriteria: true,
          workshop: {
            select: {
              aiProvider: true,
              aiApiKey: true,
            },
          },
        },
      },
    },
  })

  if (!submission) {
    throw new Error(`Submission with ID ${submissionId} not found`)
  }

  const { assignment } = submission
  const workshop = assignment?.workshop
  const maxMarks = assignment?.maxMarks ?? 100

  const DEFAULT_SYSTEM_AI_PROVIDER = "GROQ"
  const DEFAULT_SYSTEM_AI_API_KEY = process.env.GROQ_API_KEY || ""

  const provider =
    workshop?.aiProvider && workshop.aiProvider !== "DEFAULT"
      ? workshop.aiProvider
      : DEFAULT_SYSTEM_AI_PROVIDER

  const rawKey = workshop?.aiApiKey && workshop.aiApiKey.trim().length > 0 ? decrypt(workshop.aiApiKey) : null
  const apiKey = rawKey && rawKey.trim().length > 0 ? rawKey.trim() : DEFAULT_SYSTEM_AI_API_KEY

  const providerFetcher = PROVIDER_FETCHERS[provider]
  if (!providerFetcher) {
    throw new Error(`Unsupported AI Provider: ${provider}`)
  }

  // Fetch real GitHub repository structure and code snippets for LLM inspection with SSRF protection
  const githubContent = await fetchGithubRepoContent(submission.repoUrl)
  const prompt = buildEvaluationPrompt(assignment, submission, githubContent)

  let result = null
  try {
    const rawText = await providerFetcher(apiKey, prompt)
    result = parseAndValidateLlmOutput(rawText, maxMarks, provider)
  } catch (err) {
    console.error(`[AI Grading Service] Provider (${provider}) API call failed:`, err.message)
    throw new Error(`AI Grading Failed (${provider}): ${err.message}`)
  }

  const updatedSubmission = await db.submission.update({
    where: { id: submissionId },
    data: {
      functionalityScore: result.functionalityScore !== null ? Math.round(result.functionalityScore) : null,
      qualityScore: result.qualityScore !== null ? Math.round(result.qualityScore) : null,
      aiDetectionScore: result.aiDetectionScore !== null ? Math.round(result.aiDetectionScore) : null,
      documentationScore: result.documentationScore !== null ? Math.round(result.documentationScore) : null,
      aiSuggestedScore: result.suggestedScore !== null ? Math.round(result.suggestedScore) : null,
      totalScore: result.suggestedScore !== null ? Math.round(result.suggestedScore) : null,
      aiSuggestedFeedback: result.suggestedFeedback,
    },
  })

  return updatedSubmission
}

/**
 * Provider API Fetcher Strategy Registry
 */
const PROVIDER_FETCHERS = {
  CLAUDE: fetchClaude,
  GEMINI: fetchGemini,
  KIMI: fetchKimi,
  OPENAI: fetchOpenAI,
  GROQ: fetchGroq,
  QWEN: fetchQwen,
}

async function fetchGroq(apiKey, prompt) {
  const modelsToTry = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
  ]

  let lastError = null
  for (const model of modelsToTry) {
    try {
      const res = await safeFetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        return data.choices?.[0]?.message?.content || ""
      }

      const errText = await res.text()
      lastError = new Error(`Groq (${model}) API error: ${res.statusText} - ${errText}`)
    } catch (err) {
      lastError = err
    }
  }

  throw lastError || new Error("Groq API evaluation failed across all model endpoints")
}

async function fetchQwen(apiKey, prompt) {
  const endpointsToTry = [
    { url: "https://api.groq.com/openai/v1/chat/completions", model: "qwen/qwen3.8-27b" },
    { url: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", model: "qwen-max" },
    { url: "https://api.together.xyz/v1/chat/completions", model: "Qwen/Qwen2.5-72B-Instruct-Turbo" },
  ]

  let lastError = null
  for (const endpoint of endpointsToTry) {
    try {
      const res = await safeFetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: endpoint.model,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        return data.choices?.[0]?.message?.content || ""
      }

      const errText = await res.text()
      lastError = new Error(`Qwen (${endpoint.model}) API error: ${res.statusText} - ${errText}`)
    } catch (err) {
      lastError = err
    }
  }

  throw lastError || new Error("Qwen API evaluation failed")
}

async function fetchClaude(apiKey, prompt) {
  const res = await safeFetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  if (!res.ok) {
    throw new Error(`Claude API error ${res.status}: ${res.statusText}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text || ""
}

async function fetchGemini(apiKey, prompt) {
  const res = await safeFetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  )

  if (!res.ok) {
    throw new Error(`Gemini API error ${res.status}: ${res.statusText}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
}

async function fetchKimi(apiKey, prompt) {
  const res = await safeFetch("https://api.moonshot.cn/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "moonshot-v1-8k",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  })

  if (!res.ok) {
    throw new Error(`Kimi API error ${res.status}: ${res.statusText}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ""
}

async function fetchOpenAI(apiKey, prompt) {
  const res = await safeFetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  })

  if (!res.ok) {
    throw new Error(`OpenAI API error ${res.status}: ${res.statusText}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ""
}

/**
 * Isolated Prompt Factory
 */
function buildEvaluationPrompt(assignment, submission, githubContent = null) {
  const hasDocReq =
    assignment.requireDocumentation ||
    (assignment.description && /documentation|readme|doc|report/i.test(assignment.description))

  const criteria = assignment.gradingCriteria || {
    functionalityWeight: hasDocReq ? 40 : 50,
    qualityWeight: hasDocReq ? 30 : 30,
    aiDetectionWeight: hasDocReq ? 15 : 20,
    documentationWeight: hasDocReq ? 15 : 0,
  }

  return `You are a Senior Technical Evaluator grading a student assignment submission.

=== 1. PROBLEM STATEMENT & ASSIGNMENT DETAILS ===
Assignment Title: "${assignment.title}"
Maximum Marks: ${assignment.maxMarks}
Problem Overview: "${assignment.description || "N/A"}"
Problem Requirements & Instructions:
"${assignment.instructions}"

=== 2. MANDATORY GRADING BASIS & WEIGHTS ===
Evaluate the student's submission STRICTLY on the following line-item scores (0-100 scale each):
1. Functionality Score (0-100): Evaluates if code features, logic, endpoints, and deployment work as specified.
2. Code Quality Score (0-100): Evaluates code structure, cleanliness, error handling, and best practices.
3. AI Detection Score (0-100% Originality): Evaluates code originality (100 = 100% human-authored original code, lower = heavy raw AI template reliance).
${hasDocReq ? "4. Documentation Quality Score (0-100): Evaluates README clarity, architecture overview, and setup instructions (Required by Admin)." : "4. Documentation Quality Score: NOT REQUIRED FOR THIS ASSIGNMENT."}

Calculated Weighted Score Basis:
- Functionality Weight: ${criteria.functionalityWeight}%
- Code Quality Weight: ${criteria.qualityWeight}%
- AI Detection / Originality Weight: ${criteria.aiDetectionWeight}%
${hasDocReq ? `- Documentation Weight: ${criteria.documentationWeight}%` : ""}

=== 3. STUDENT SUBMISSION ARTIFACTS ===
- GitHub Repository URL: "${submission.repoUrl || "None provided"}"
- Live Deployment URL: "${submission.deploymentUrl || "None provided"}"
- Google Drive Video / Asset URL: "${submission.driveUrl || "None provided"}"
- Student Comments / Notes: "${submission.comments || "None provided"}"

${githubContent ? `=== 4. FETCHED GITHUB CODEBASE & REPOSITORY CONTENTS ===\n${githubContent}\n` : ""}

=== 5. OUTPUT FORMAT ===
Return ONLY a valid JSON object matching this schema:
{
  "functionalityScore": <number 0-100>,
  "qualityScore": <number 0-100>,
  "aiDetectionScore": <number 0-100>,
  ${hasDocReq ? '"documentationScore": <number 0-100>,' : '"documentationScore": null,'}
  "suggestedScore": <calculated final marks between 0 and ${assignment.maxMarks}>,
  "suggestedFeedback": "<Constructive breakdown covering Functionality, Code Quality, AI Originality${hasDocReq ? ", and Documentation" : ""}>"
}`
}

/**
 * Robust LLM JSON Parser & Schema Validator
 */
function parseAndValidateLlmOutput(rawText, maxMarks, provider) {
  const jsonMatch = rawText.match(/\{[\s\S]*?\}/)
  if (!jsonMatch) {
    throw new Error(`Failed to extract valid JSON payload from ${provider} output`)
  }

  const parsedJson = JSON.parse(jsonMatch[0])
  const validated = evaluationResultSchema.parse(parsedJson)

  const clampedScore = Math.min(maxMarks, Math.max(0, Math.round(validated.suggestedScore)))

  return {
    functionalityScore: validated.functionalityScore !== null && validated.functionalityScore !== undefined ? Math.round(validated.functionalityScore) : null,
    qualityScore: validated.qualityScore !== null && validated.qualityScore !== undefined ? Math.round(validated.qualityScore) : null,
    aiDetectionScore: validated.aiDetectionScore !== null && validated.aiDetectionScore !== undefined ? Math.round(validated.aiDetectionScore) : null,
    documentationScore: validated.documentationScore !== null && validated.documentationScore !== undefined ? Math.round(validated.documentationScore) : null,
    suggestedScore: clampedScore,
    suggestedFeedback: validated.suggestedFeedback,
  }
}
