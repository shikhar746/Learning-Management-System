# PROMPT 2 — NEXT DEVELOPMENT PHASE

Using the existing architecture, we will now implement the first major functional milestone of the application.

This milestone should be designed as production-quality software.

I do NOT want shortcuts, tutorial code, or MVP hacks.

Every decision should be scalable.

---

# Primary Goal

Build a complete Authentication + Assignment Management + Submission Workflow.

This should become the core feature of the LMS.

---

# Authentication

Implement a complete authentication system.

Requirements

* Email & Password authentication
* Google OAuth
* NextAuth
* JWT sessions
* Secure HTTP-only cookies
* bcrypt password hashing
* Session persistence
* Secure logout
* Role Based Access Control
* Protected frontend routes
* Protected backend APIs
* Environment variable management

Roles

* Student
* Admin

---

# Assignment Management

Admins should be able to

* Create assignments
* Edit assignments
* Delete assignments
* Publish assignments
* Set deadlines
* Set maximum marks
* Upload assignment resources
* View assignment details
* View submissions
* Grade submissions
* Publish grades

Assignments contain

* Title
* Description
* Instructions
* Deadline
* Maximum Marks
* Optional attachments
* Created At
* Updated At

---

# Student Workflow

Students should be able to

* Register
* Login
* View dashboard
* View assignments
* View deadlines
* Submit assignments
* Resubmit before deadline (configurable)
* View submission history
* View published grades
* View instructor feedback

---

# Submission Workflow

Each submission may contain

* PDF
* DOC
* DOCX
* ZIP
* GitHub Repository URL
* Live Deployment URL
* Additional comments

Store

* Student
* Assignment
* Status
* Submission Time
* Version
* File URLs
* GitHub URL
* Deployment URL

---

# File Uploads

Use cloud storage.

Preferred

Cloudinary

Alternative

AWS S3

Requirements

* File validation
* File size limits
* MIME validation
* Malicious upload prevention
* Store only URLs inside database

---

# Grading Workflow

Admin creates assignment

↓

Student views assignment

↓

Student uploads submission

↓

Submission marked as Submitted

↓

Admin reviews submission

↓

Admin assigns marks

↓

Admin adds feedback

↓

Admin publishes grades

↓

Student can now view marks

---

# Dashboards

## Admin Dashboard

Display

* Total students
* Total assignments
* Total submissions
* Pending submissions
* Submission percentage
* Missing submissions
* Assignment-wise statistics
* Average marks (future)
* Highest marks (future)
* Lowest marks (future)

---

## Student Dashboard

Display

* Pending assignments
* Submitted assignments
* Upcoming deadlines
* Published marks
* Overall progress

---

# Security

Implement

* RBAC
* Ownership validation
* Protected APIs
* Authentication middleware
* Input validation
* Rate limiting
* Secure cookies
* CSRF considerations
* XSS prevention
* SQL Injection protection through Prisma
* Secure file validation

---

# Database

Design production-ready Prisma models.

Include

Users

Assignments

Submissions

Sessions

Accounts

Verification Tokens (required by NextAuth)

Use proper

* Relations
* Cascades
* Indexes
* Constraints

---

# API Design

Design clean REST-style Route Handlers.

Separate

* Authentication
* Assignments
* Submissions
* Admin actions

Return consistent API responses.

Handle all errors gracefully.

---

# Implementation Strategy

I do NOT want the entire project generated at once.

Break development into logical milestones.

For each milestone:

1. Explain why this milestone comes first.
2. Explain how it integrates into the existing architecture.
3. List every file to create.
4. List every file to modify.
5. List Prisma changes.
6. List API routes.
7. Explain security implications.
8. Explain edge cases.
9. Ask for approval.

Only after I approve should you generate production-quality code for that milestone.

Never skip ahead.

Never modify architecture without justification.

Act as a senior engineer performing a real production implementation, not as a tutorial instructor.
