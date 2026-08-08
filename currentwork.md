# 🎯 LMS Platform Milestone Progress

- [x] **Milestone 1 — Database Foundation**
  Prisma schema for User, Account, Session, VerificationToken, Assignment, Submission, Progress, enums (Role, SubmissionStatus), relations, and indexes.

- [x] **Milestone 2 — Authentication Core**
  Credentials provider (bcryptjs) + Google OAuth in NextAuth v5, JWT session strategy, role injection, middleware-based route protection, register API route with Zod validation.

- [x] **Milestone 3 — RBAC + Protected Layouts**
  Server-side role checks in `(dashboard)` layout, middleware route protection, session-based UI rendering in Sidebar.

- [x] **Milestone 4 — Assignment Management (Admin)**
  CRUD API routes for assignments (`/api/assignments`), publish/unpublish toggle, deadline + maxMarks configuration, admin UI (create/edit forms, list, detail views).

- [x] **Milestone 5 — File Upload Infrastructure**
  Cloudinary SDK integration (`/api/upload`), MIME/size validation (max 10MB), reusable `FileUpload.js` component for admin materials and student attachments.

- [x] **Milestone 6 — Student Assignment View + Submission Workflow**
  Student-facing assignment list/detail, submission modal (file/GitHub URL/deployment URL/comments), resubmission versioning (`v1`, `v2`, `v3`), submission status tracking.

- [x] **Milestone 7 — Grading Workflow**
  Admin submission review panel, marks + feedback entry, publish-grades action (`isGradePublished`), student-facing grade and feedback view.

- [x] **Milestone 8 — Dashboard Aggregation**
  Admin stats (totals, pending, percentage, per-assignment class averages) and student stats (pending, submitted, upcoming deadlines, course progress).

- [x] **Milestone 9 — Security & Architectural Hardening Pass**
  Centralized Zod schemas across all endpoints, extracted service layer (`src/services/`), RBAC middleware audit, input validation, and App Router fallback boundaries (`loading.js`, `error.js`).