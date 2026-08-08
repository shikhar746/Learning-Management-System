import nodemailer from "nodemailer"

const createTransport = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return null
}

export async function sendAssignmentNotification(assignment, studentEmails = []) {
  if (!assignment || studentEmails.length === 0) return

  const subject = `📢 New Assignment Published: ${assignment.title}`
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #111827;">
      <h2 style="color: #2563eb;">New Assignment Alert</h2>
      <p>A new assignment has been published in your workshop cohort!</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h3 style="margin-top: 0;">${assignment.title}</h3>
        <p style="font-size: 14px; color: #4b5563;">${assignment.description || ""}</p>
        <p><strong>Max Marks:</strong> ${assignment.maxMarks} points</p>
        <p><strong>Due Date:</strong> ${assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : "No deadline"}</p>
      </div>
      <p>Log in to your student dashboard to view detailed instructions and submit your work.</p>
    </div>
  `

  const transport = createTransport()
  if (transport) {
    try {
      await transport.sendMail({
        from: process.env.SMTP_FROM || '"LMS Platform" <noreply@lms.com>',
        to: studentEmails.join(", "),
        subject,
        html,
      })
      console.log(`✉️ Email notification sent to ${studentEmails.length} students for assignment "${assignment.title}"`)
    } catch (err) {
      console.error("Failed to send assignment email via SMTP:", err.message)
    }
  } else {
    console.log(`[Email Simulation - Assignment Notification]: To: ${studentEmails.join(", ")} | Subject: ${subject}`)
  }
}

export async function sendGradeNotification(submission, studentEmail) {
  if (!submission || !studentEmail) return

  const assignmentTitle = submission.assignment?.title || "Assignment"
  const score = submission.totalScore
  const maxMarks = submission.assignment?.maxMarks || 100
  const feedback = submission.feedback || "Good work!"

  const subject = `🎓 Grade Released: ${assignmentTitle}`
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #111827;">
      <h2 style="color: #16a34a;">Grade & Feedback Published</h2>
      <p>Your instructor has published your grade for <strong>"${assignmentTitle}"</strong>.</p>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h3 style="margin-top: 0; color: #15803d;">Score: ${score} / ${maxMarks} points</h3>
        <p style="font-size: 14px; color: #374151;"><strong>Instructor Feedback:</strong> "${feedback}"</p>
      </div>
      <p>Log in to your student gradebook to view your complete academic transcript.</p>
    </div>
  `

  const transport = createTransport()
  if (transport) {
    try {
      await transport.sendMail({
        from: process.env.SMTP_FROM || '"LMS Platform" <noreply@lms.com>',
        to: studentEmail,
        subject,
        html,
      })
      console.log(`✉️ Grade release notification sent to ${studentEmail} for "${assignmentTitle}"`)
    } catch (err) {
      console.error("Failed to send grade email via SMTP:", err.message)
    }
  } else {
    console.log(`[Email Simulation - Grade Notification]: To: ${studentEmail} | Subject: ${subject} | Score: ${score}/${maxMarks}`)
  }
}
