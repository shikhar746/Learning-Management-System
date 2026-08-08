import { db } from "@/lib/db"

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

  // Simple keyword moderation heuristic (async)
  const spamKeywords = ["spam", "buy now", "free money", "scam"]
  const containsSpam = spamKeywords.some((word) => content.toLowerCase().includes(word))
  const moderationStatus = containsSpam ? "FLAGGED" : "APPROVED"

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
