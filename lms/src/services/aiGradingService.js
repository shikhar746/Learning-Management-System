import { db } from "@/lib/db"

export async function evaluateSubmissionWithByok(submissionId) {
  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: {
          workshop: true,
        },
      },
      user: true,
    },
  })

  if (!submission) {
    throw new Error("Submission not found")
  }

  const assignment = submission.assignment
  const workshop = assignment.workshop
  const maxMarks = assignment.maxMarks

  const provider = workshop?.aiProvider || "DEFAULT"
  const customApiKey = workshop?.aiApiKey || null

  let result = null

  // System Prompt for Evaluation
  const prompt = `You are a Senior Full-Stack Instructor evaluating a student assignment.
Assignment Title: "${assignment.title}"
Max Marks: ${maxMarks}
Instructions: "${assignment.instructions}"

Student Artifacts:
- GitHub Repo URL: "${submission.repoUrl || "None"}"
- Live Demo URL: "${submission.deploymentUrl || "None"}"
- Google Drive / Video Demo URL: "${submission.driveUrl || "None"}"
- Student Comments: "${submission.comments || "None"}"

Evaluate the student's work and return a JSON object with:
{
  "suggestedScore": <number between 0 and ${maxMarks}>,
  "suggestedFeedback": "<2-3 sentence constructive feedback>"
}`

  try {
    if (provider === "CLAUDE" && customApiKey) {
      result = await evaluateWithClaude(customApiKey, prompt, maxMarks)
    } else if (provider === "GEMINI" && customApiKey) {
      result = await evaluateWithGemini(customApiKey, prompt, maxMarks)
    } else if (provider === "KIMI" && customApiKey) {
      result = await evaluateWithKimi(customApiKey, prompt, maxMarks)
    } else if (provider === "OPENAI" && customApiKey) {
      result = await evaluateWithOpenAI(customApiKey, prompt, maxMarks)
    }
  } catch (err) {
    console.warn(`BYOK Provider (${provider}) API call failed, falling back to heuristics:`, err.message)
  }

  // Fallback to pattern heuristic if BYOK call is not configured or fails
  if (!result) {
    result = evaluateWithFallback(submission, maxMarks)
  }

  const updated = await db.submission.update({
    where: { id: submissionId },
    data: {
      aiSuggestedScore: result.suggestedScore,
      aiSuggestedFeedback: result.suggestedFeedback,
    },
  })

  return updated
}

async function evaluateWithClaude(apiKey, prompt, maxMarks) {
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
    throw new Error(`Claude API error ${res.status}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text || ""
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0])
    return {
      suggestedScore: Math.min(maxMarks, Math.max(0, parsed.suggestedScore)),
      suggestedFeedback: `[Claude 3.5 Sonnet BYOK Draft]: ${parsed.suggestedFeedback}`,
    }
  }
  throw new Error("Failed to parse Claude JSON response")
}

async function evaluateWithGemini(apiKey, prompt, maxMarks) {
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
    throw new Error(`Gemini API error ${res.status}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0])
    return {
      suggestedScore: Math.min(maxMarks, Math.max(0, parsed.suggestedScore)),
      suggestedFeedback: `[Gemini 1.5 Pro BYOK Draft]: ${parsed.suggestedFeedback}`,
    }
  }
  throw new Error("Failed to parse Gemini JSON response")
}

async function evaluateWithKimi(apiKey, prompt, maxMarks) {
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
    throw new Error(`Kimi API error ${res.status}`)
  }

  const data = await res.json()
  const contentStr = data.choices?.[0]?.message?.content || ""
  const parsed = JSON.parse(contentStr)
  return {
    suggestedScore: Math.min(maxMarks, Math.max(0, parsed.suggestedScore)),
    suggestedFeedback: `[Kimi K3 BYOK Draft]: ${parsed.suggestedFeedback}`,
  }
}

async function evaluateWithOpenAI(apiKey, prompt, maxMarks) {
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
    throw new Error(`OpenAI API error ${res.status}`)
  }

  const data = await res.json()
  const contentStr = data.choices?.[0]?.message?.content || ""
  const parsed = JSON.parse(contentStr)
  return {
    suggestedScore: Math.min(maxMarks, Math.max(0, parsed.suggestedScore)),
    suggestedFeedback: `[GPT-4o BYOK Draft]: ${parsed.suggestedFeedback}`,
  }
}

function evaluateWithFallback(submission, maxMarks) {
  let score = Math.round(maxMarks * 0.85)
  let notes = []

  if (submission.repoUrl) {
    score += Math.round(maxMarks * 0.1)
    notes.push("GitHub repo submitted.")
  }
  if (submission.deploymentUrl) {
    score += Math.round(maxMarks * 0.05)
    notes.push("Live demo URL provided.")
  }
  if (submission.driveUrl) {
    notes.push("Google Drive video asset attached.")
  }

  score = Math.min(maxMarks, Math.max(0, score))
  return {
    suggestedScore: score,
    suggestedFeedback: `[Pattern Draft Review]: Candidate score suggested as ${score}/${maxMarks}. Summary: ${notes.join(" ")}`,
  }
}
