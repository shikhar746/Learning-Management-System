import { db } from "@/lib/db"

// Expanded Pattern-Based & AI Moderation Scanner
export async function scanContentForModeration(content) {
  if (!content) return "APPROVED"

  const lowerContent = content.toLowerCase()

  // 1. Spam & Scam Keywords
  const spamKeywords = [
    "spam", "buy now", "free money", "scam", "phishing",
    "click here", "crypto bonus", "whatsapp group link", "dm for money",
    "telegram channel", "earn 1000", "hack account"
  ]

  // 2. Abusive / Profane / Hate Speech Patterns
  const abusivePatterns = [
    /\b(hate|idiot|stupid|dumb|fool|abuse|bitch|bastard|trash|useless)\b/i,
    /\b(kill|suicide|attack|threat|harass)\b/i,
  ]

  const isSpam = spamKeywords.some((keyword) => lowerContent.includes(keyword))
  const isAbusive = abusivePatterns.some((pattern) => pattern.test(content))

  if (isSpam || isAbusive) {
    return "FLAGGED"
  }

  // 3. Optional OpenAI Moderation API Call (if OPENAI_API_KEY is configured)
  if (process.env.OPENAI_API_KEY) {
    try {
      const res = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ input: content }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.results?.[0]?.flagged) {
          return "FLAGGED"
        }
      }
    } catch (err) {
      console.warn("AI Moderation API fallback to pattern scanner:", err.message)
    }
  }

  return "APPROVED"
}

export async function createForumTopic({ workshopId, assignmentId, title, description, createdById }) {
  const workshop = await db.workshop.findUnique({
    where: { id: workshopId },
  })

  if (!workshop) {
    throw new Error("Workshop not found")
  }

  const topic = await db.forumTopic.create({
    data: {
      workshopId,
      assignmentId: assignmentId || null,
      title,
      description: description || null,
      createdById,
    },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      _count: { select: { posts: true } },
    },
  })

  return topic
}

export async function getTopicsForWorkshop(workshopId) {
  const topics = await db.forumTopic.findMany({
    where: { workshopId },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      assignment: { select: { id: true, title: true } },
      _count: { select: { posts: true } },
    },
  })

  return topics
}

export async function getTopicWithPosts(topicId) {
  const topic = await db.forumTopic.findUnique({
    where: { id: topicId },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      assignment: { select: { id: true, title: true } },
      posts: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, email: true, image: true, role: true } },
        },
      },
    },
  })

  return topic
}

export async function createForumPost({ topicId, userId, content }) {
  const topic = await db.forumTopic.findUnique({
    where: { id: topicId },
  })

  if (!topic) {
    throw new Error("Forum topic not found")
  }

  const moderationStatus = await scanContentForModeration(content)

  const post = await db.forumPost.create({
    data: {
      topicId,
      userId,
      content,
      moderationStatus,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, role: true } },
    },
  })

  return post
}

export async function moderateForumPost(postId, moderationStatus) {
  return await db.forumPost.update({
    where: { id: postId },
    data: { moderationStatus },
  })
}

export async function deleteForumPost(postId) {
  return await db.forumPost.delete({
    where: { id: postId },
  })
}
