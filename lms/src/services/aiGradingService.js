import { z } from "zod"
import { db } from "@/lib/db"

/**
 * Zod Schema for strict LLM Evaluation Output validation
 */
const evaluationResultSchema = z.object({
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
          title: true,
          instructions: true,
          maxMarks: true,
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

  const provider = workshop?.aiProvider || "DEFAULT"
  const customApiKey = workshop?.aiApiKey || null

  const prompt = buildEvaluationPrompt(assignment, submission)
  let result = null

  const providerFetcher = PROVIDER_FETCHERS[provider]
  if (providerFetcher && customApiKey) {
    try {
      const rawText = await providerFetcher(customApiKey, prompt)
      result = parseAndValidateLlmOutput(rawText, maxMarks, provider)
    } catch (err) {
      console.warn(`[AI Grading Service] BYOK Provider (${provider}) API call failed:`, err.message)
    }
  }

  // Fallback to pattern heuristic if BYOK call is unconfigured or fails
  if (!result) {
    result = evaluateWithFallback(submission, maxMarks)
  }

  const updatedSubmission = await db.submission.update({
    where: { id: submissionId },
    data: {
      aiSuggestedScore: result.suggestedScore,
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
}

async function fetchClaude(apiKey, prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
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
  const res = await fetch(
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
  const res = await fetch("https://api.moonshot.cn/v1/chat/completions", {
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
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
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
function buildEvaluationPrompt(assignment, submission) {
  return `You are a Senior Full-Stack Instructor evaluating a student assignment.
Assignment Title: "${assignment.title}"
Max Marks: ${assignment.maxMarks}
Instructions: "${assignment.instructions}"

Student Artifacts:
- GitHub Repo URL: "${submission.repoUrl || "None"}"
- Live Demo URL: "${submission.deploymentUrl || "None"}"
- Google Drive / Video Demo URL: "${submission.driveUrl || "None"}"
- Student Comments: "${submission.comments || "None"}"

Evaluate the student's work and return a JSON object with:
{
  "suggestedScore": <number between 0 and ${assignment.maxMarks}>,
  "suggestedFeedback": "<2-3 sentence constructive feedback>"
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

  const providerTags = {
    CLAUDE: "Claude 3.5 Sonnet BYOK Draft",
    GEMINI: "Gemini 1.5 Pro BYOK Draft",
    KIMI: "Kimi K3 BYOK Draft",
    OPENAI: "GPT-4o BYOK Draft",
  }

  const tag = providerTags[provider] || `${provider} BYOK Draft`
  const clampedScore = Math.min(maxMarks, Math.max(0, Math.round(validated.suggestedScore)))

  return {
    suggestedScore: clampedScore,
    suggestedFeedback: `[${tag}]: ${validated.suggestedFeedback}`,
  }
}

/**
 * Heuristic Pattern Fallback Evaluator
 */
function evaluateWithFallback(submission, maxMarks) {
  let scoreRatio = FALLBACK_SCORE_RATIOS.BASE_SUBMISSION
  const notes = []

  if (submission.repoUrl) {
    scoreRatio += FALLBACK_SCORE_RATIOS.REPO_URL_BONUS
    notes.push("GitHub repo submitted.")
  }
  if (submission.deploymentUrl) {
    scoreRatio += FALLBACK_SCORE_RATIOS.DEPLOYMENT_URL_BONUS
    notes.push("Live demo URL provided.")
  }
  if (submission.driveUrl) {
    notes.push("Google Drive video asset attached.")
  }

  const finalScore = Math.min(maxMarks, Math.max(0, Math.round(maxMarks * scoreRatio)))
  return {
    suggestedScore: finalScore,
    suggestedFeedback: `[Pattern Draft Review]: Candidate score suggested as ${finalScore}/${maxMarks}. Summary: ${notes.join(" ")}`,
  }
}
