const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting LMS database seed...")

  // Hashed default password: "password123"
  const hashedPassword = await bcrypt.hash("password123", 10)

  // 1. Create Super-Admin Owner
  const owner = await prisma.user.upsert({
    where: { email: "owner@lms.com" },
    update: { role: "OWNER", password: hashedPassword },
    create: {
      name: "Super-Admin Owner",
      email: "owner@lms.com",
      password: hashedPassword,
      role: "OWNER",
    },
  })
  console.log("👤 Created Owner:", owner.email)

  // 2. Create Instructor Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@lms.com" },
    update: { role: "ADMIN", password: hashedPassword },
    create: {
      name: "Sarah Instructor",
      email: "admin@lms.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  })
  console.log("👤 Created Admin:", admin.email)

  // 3. Create Demo Student
  const student = await prisma.user.upsert({
    where: { email: "student@lms.com" },
    update: { role: "STUDENT", password: hashedPassword },
    create: {
      name: "Alex Student",
      email: "student@lms.com",
      password: hashedPassword,
      role: "STUDENT",
    },
  })
  console.log("👤 Created Student:", student.email)

  // 4. Create Demo Workshop Cohort
  const validUntilDate = new Date()
  validUntilDate.setDate(validUntilDate.getDate() + 30)

  const workshop = await prisma.workshop.upsert({
    where: { code: "WEB2026" },
    update: { status: "ACTIVE", validUntil: validUntilDate },
    create: {
      name: "React & Full-Stack Web Dev Cohort #1",
      code: "WEB2026",
      description: "Comprehensive 4-week workshop covering Next.js App Router, Prisma ORM, and Cloudinary uploads.",
      status: "ACTIVE",
      validUntil: validUntilDate,
      createdById: admin.id,
      userRoles: {
        create: [
          { userId: admin.id, role: "ADMIN" },
          { userId: student.id, role: "STUDENT" },
        ],
      },
    },
  })
  console.log("🏫 Created Workshop:", workshop.name, "(Code: WEB2026)")

  // 5. Create Workshop Assignment
  const assignment = await prisma.assignment.create({
    data: {
      workshopId: workshop.id,
      title: "Project 1 — Full-Stack Next.js LMS Application",
      description: "Build a multi-tenant learning management system with Prisma ORM and NextAuth v5.",
      instructions: "Include GitHub repository URL, live Vercel deployment link, or Google Drive video demo.",
      maxMarks: 100,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      allowResubmission: true,
      enableAiGrading: true,
      published: true,
      createdById: admin.id,
    },
  })
  console.log("📝 Created Assignment:", assignment.title)

  // 6. Create Student Submission with Google Drive link & HITL AI draft
  const submission = await prisma.submission.create({
    data: {
      userId: student.id,
      assignmentId: assignment.id,
      version: 1,
      repoUrl: "https://github.com/shikhar746/Learning-Management-System",
      deploymentUrl: "https://lms-demo.vercel.app",
      driveUrl: "https://drive.google.com/file/d/demo-video-asset/view",
      comments: "Completed all features including multi-tenant workshops and HITL AI grading.",
      status: "SUBMITTED",
      isGradePublished: false,
      aiSuggestedScore: 88,
      aiSuggestedFeedback: "AI Draft Review: Candidate score suggested as 88/100.\nSummary: Verified GitHub repo, live Vercel link, and Google Drive demo video asset attached.",
    },
  })
  console.log("📤 Created Submission for student:", submission.id)

  // 7. Create Discussion Forum Topic & Posts
  const forumTopic = await prisma.forumTopic.create({
    data: {
      workshopId: workshop.id,
      assignmentId: assignment.id,
      title: "Task 1 — Setup Q&A & Discussion",
      description: "Post any questions or troubleshooting steps for Task 1 here.",
      createdById: admin.id,
      posts: {
        create: [
          {
            userId: admin.id,
            content: "Welcome to Task 1! Feel free to ask any questions regarding NextAuth or Prisma schema setup.",
            moderationStatus: "APPROVED",
          },
          {
            userId: student.id,
            content: "Thank you! Everything configured smoothly using Neon DB PostgreSQL.",
            moderationStatus: "APPROVED",
          },
        ],
      },
    },
  })
  console.log("💬 Created Forum Topic:", forumTopic.title)

  // 8. Create Certificate Template Configuration
  const certTemplate = await prisma.certificateTemplate.upsert({
    where: { workshopId: workshop.id },
    update: {},
    create: {
      workshopId: workshop.id,
      templateUrl: "https://res.cloudinary.com/dxeuly7xo/image/upload/v1/certificates/default_template.png",
      nameX: 300,
      nameY: 400,
      fontSize: 36,
    },
  })
  console.log("📜 Created Certificate Template for Workshop:", certTemplate.id)

  console.log("\n✅ Database seeding complete!")
  console.log("----------------------------------------------")
  console.log("Demo Owner Account:   owner@lms.com   / password123")
  console.log("Demo Admin Account:   admin@lms.com   / password123")
  console.log("Demo Student Account: student@lms.com / password123")
  console.log("Demo Workshop Code:   WEB2026")
  console.log("----------------------------------------------")
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
