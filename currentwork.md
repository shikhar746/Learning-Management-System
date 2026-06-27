Got it. I'll follow this workflow exactly for every feature request going forward — understand, plan, wait for approval, then code. No skipping ahead.
Since this is the start of the build, let me propose the milestone breakdown first, so you can confirm the sequence before we open Milestone 1.
Proposed Milestone Sequence
Milestone 1 — Database Foundation

Prisma schema for User, Account, Session, VerificationToken, Assignment, Submission, plus enums (Role, SubmissionStatus) and relations/indexes. Nothing works without this existing first — auth and assignments both depend on these models.
Milestone 2 — Authentication Core

Credentials provider (bcrypt) + Google OAuth wired into the existing NextAuth config, JWT session strategy, role injection into session/token, middleware-based route protection (admin vs student), register API route with validation.
Milestone 3 — RBAC + Protected Layouts

Server-side role checks in (dashboard)/admin and (dashboard)/student layouts, redirect logic, session-based UI rendering in Sidebar.
Milestone 4 — Assignment Management (Admin)

CRUD API routes for assignments, publish/unpublish, deadline + max marks, admin UI (create/edit forms, list, detail view).
Milestone 5 — File Upload Infrastructure

Cloudinary integration, signed upload strategy, MIME/size validation, reusable upload utility — built before submissions need it.
Milestone 6 — Student Assignment View + Submission Workflow

Student-facing assignment list/detail, submission form (file/GitHub URL/deployment URL/comments), resubmission logic, submission status.
Milestone 7 — Grading Workflow

Admin submission review UI, marks + feedback entry, publish-grades action, student-facing grade/feedback view.
Milestone 8 — Dashboard Aggregation

Admin stats (totals, pending, percentage, per-assignment breakdown) and student stats (pending, submitted, upcoming deadlines, progress) replacing placeholder data.
Milestone 9 — Security Hardening Pass

Rate limiting, input validation audit (zod schemas across all routes), ownership checks audit, CSRF/XSS review.