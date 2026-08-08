# 🎓 AI-Assisted Multi-Tenant Learning Management System (LMS)

A full-stack, enterprise-ready **Multi-Tenant Learning Management System (LMS)** built with **Next.js 16 App Router**, **React 19**, **Prisma ORM**, **PostgreSQL (Neon DB)**, **NextAuth v5**, and **Tailwind CSS**.

Designed for scalable workshop cohort management, BYOK (Bring Your Own Key) multimodal AI assignment evaluation, asynchronous discussion forums with automated moderation, institutional certificate generation, student academic transcripts, and super-admin tenant control.

---

## 🚀 Tech Stack

* **Framework:** Next.js 16 (App Router with Turbopack) & React 19
* **Styling & UI:** Tailwind CSS v4, shadcn/ui, Lucide React Icons
* **Database & ORM:** PostgreSQL (Neon DB with PgBouncer connection pooling) & Prisma ORM v5
* **Authentication:** NextAuth v5 (Auth.js) with Google OAuth, Credentials Provider (`bcryptjs`), & JWT session strategy
* **Multi-Model AI Engine:** Anthropic Claude 3.5 Sonnet, Google Gemini 1.5 Pro, Moonshot Kimi K3, OpenAI GPT-4o
* **File Storage:** Cloudinary SDK & REST API integration for assignment materials and student attachments
* **Validation & Architecture:** Role-Based Access Control (RBAC) middleware, Zod schema validation, modular service layer

---

## ✨ System Architecture & Feature Overview

### 🏫 1. Multi-Tenant Workshop Cohort System
* **Tenant Isolation**: Every workshop operates inside an isolated tenant boundary (`workshopId`).
* **Flexible Multi-Role Mapping**: Users can be an `ADMIN` in Workshop A and a `STUDENT` in Workshop B via the `UserRole` join table.
* **Auto-Assigned Invite Codes**: Workshops generate unique 6-character access codes (e.g., `WEB2026`) for 1-click student enrollment.
* **Co-Instructor Invitations**: Admins can invite co-instructors by email (`/api/workshops/[id]/invite`).
* **Read-Only Expiry**: Workshop cohorts automatically switch to read-only mode after their ~30-day post-closeout validity window.

### 🤖 2. Bring Your Own Key (BYOK) Multimodal AI Evaluation Engine
Instructors can burn their *own* API tokens in their Workshop Control Room (`/admin/workshops/[id]`), preventing platform owner cloud bill inflation:
* **Anthropic Claude 3.5 Sonnet**: Deep repository AST parsing, architectural code review, and refactoring tips.
* **Google Gemini 1.5 Pro**: Multimodal evaluation of native video recordings (Loom, YouTube, Drive links), audio logs, and multi-page PDFs.
* **Moonshot Kimi K3**: Ultra long-context submission evaluation.
* **OpenAI GPT-4o**: Structured rubric scoring.
* **Batch AI Evaluation**: Click **`✨ Batch AI Draft All`** to process all un-graded student submissions simultaneously in the background.
* **Bulk Grade Publication**: Click **`📢 Bulk Publish All Grades`** to release approved scores to students in 1 click.

### 💬 3. Asynchronous Discussion Forum & Moderation Scanner
* **Topic-Bound Threads**: Workshop-isolated and assignment-linked discussion threads (`ForumTopic`, `ForumPost`).
* **Instant Async Moderation**: Pattern & AI toxicity scanner detects spam/abusive keywords in under 5ms, assigning status as `APPROVED` or `FLAGGED`.
* **Instructor Unflag & Delete Controls**: Admins see red warning badges on flagged posts and can approve/unflag or delete posts in 1 click.

### 📜 4. Institutional Certificate Engine & Workshop Closeout
* **Dynamic Name Ingestion**: Upload institutional certificate image templates (PNG/JPG) and configure participant name coordinates (`nameX`, `nameY`, `fontSize`).
* **1-Click Batch Issuance**: Issue official completion certificates to all cohort enrollees simultaneously.
* **Workshop Closeout View**: Displays *"Workshop is over — Thank you for participation"*, instructor email directory, certificate download links, and read-only status.

### 👑 5. Super-Admin / Owner Control Panel (`/admin/owner`)
* **Master System Metrics**: View total system-wide workshops, active vs completed cohorts, student totals, instructor totals, global submission numbers, and average completion rates.
* **Master Workshop Table**: Search and filter all system workshop tenants by status (`ACTIVE`, `COMPLETED`, `ARCHIVED`) or title.

### 🎓 6. Student Academic Gradebook & Transcript (`/student/workshops/[id]/gradebook`)
* **Transcript View**: Display overall percentage score, earned vs total points, graded task counts, submission version history (`v1`, `v2`), submitted link icons (GitHub, Live Demo, Drive Video), and instructor feedback notes.

### 🌱 7. Interactive Database Seed Script (`npx prisma db seed`)
* Instantly populates demo accounts, sample workshop cohorts, assignments, submissions with video links, forum threads, and certificate templates:
  * **Super-Admin / Owner**: `owner@lms.com` / `password123`
  * **Instructor Admin**: `admin@lms.com` / `password123`
  * **Student**: `student@lms.com` / `password123`
  * **Active Workshop Code**: `WEB2026`

---

## 📁 Repository Structure

```text
Learning Management System/
├── README.md                 # Root project documentation
├── currentwork.md            # Active milestone status & roadmap
└── lms/                      # Core Next.js Application
    ├── prisma/
    │   ├── schema.prisma     # Multi-tenant Prisma schema (Workshop, UserRole, ForumTopic, Certificate, etc.)
    │   └── seed.js           # Interactive database seeder
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/       # Auth pages (login, register)
    │   │   ├── (dashboard)/  # Protected Admin, Owner, & Student layouts and pages
    │   │   ├── api/          # Route handlers (workshops, forum, certificates, submissions, owner, upload)
    │   │   ├── globals.css   # Global styles & Tailwind CSS configuration
    │   │   └── layout.js     # Root layout & NextAuth session provider wrapper
    │   ├── components/
    │   │   ├── admin/        # Admin components (WorkshopForm, AssignmentForm, GradingModal)
    │   │   ├── student/      # Student components (JoinWorkshopModal, SubmissionModal)
    │   │   ├── shared/       # Shared UI (ForumThread, CertificateDownloadCard, WorkshopCloseoutBanner, Sidebar)
    │   │   └── ui/           # Pure shadcn design primitives
    │   ├── services/         # Modular service layer (aiGradingService, workshopService, forumService, certificateService)
    │   ├── lib/              # Central config (auth.js, db.js, utils.js) & Zod validations
    │   └── middleware.js     # RBAC & route protection middleware
    └── package.json          # App dependencies & scripts
```

---

## 🛠️ Setup & Local Installation

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **PostgreSQL**: Neon DB cloud database instance
- **Cloudinary Account**: Cloud name, API Key, and API Secret

### 2. Environment Configuration
Create a `.env` file inside the `lms/` directory:

```env
DATABASE_URL="postgresql://user:password@ep-withered-silence-apm7a6lr-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
AUTH_SECRET="your-nextauth-secret-key"
AUTH_URL="http://localhost:3000"

# Google OAuth Credentials
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Cloudinary Credentials
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
CLOUDINARY_URL="cloudinary://your-api-key:your-api-secret@your-cloud-name"
```

### 3. Database Sync & Seeding
```bash
cd lms
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```
Access the application at [http://localhost:3000](http://localhost:3000).

---

## 📡 Complete API Route Reference

| Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register user account |
| `GET` | `/api/owner/analytics` | Owner | Super-Admin aggregate metrics across all tenants |
| `GET` | `/api/workshops` | Authenticated | List enrolled workshops (or all system workshops for Owner) |
| `POST` | `/api/workshops` | Authenticated | Create workshop cohort with auto-assigned code |
| `GET/PUT/DELETE` | `/api/workshops/[id]` | Admin/Owner | Manage workshop settings, status, & BYOK AI Provider Keys |
| `POST` | `/api/workshops/join` | Student | Enroll in workshop using 6-character invite code |
| `POST` | `/api/workshops/[id]/invite` | Admin/Owner | Invite co-instructor by email |
| `POST` | `/api/admin/submissions/[id]/ai-suggest` | Admin/Owner | Trigger BYOK AI draft grade & feedback suggestion |
| `POST` | `/api/admin/submissions/batch` | Admin/Owner | Batch AI draft generation (`AI_DRAFT_ALL`) or bulk publish (`PUBLISH_ALL`) |
| `GET/POST` | `/api/forum/topics` | Authenticated | List & create workshop discussion topics |
| `GET` | `/api/forum/topics/[id]` | Authenticated | Fetch topic thread & message posts |
| `POST` | `/api/forum/posts` | Authenticated | Submit forum post with automated moderation check |
| `PUT/DELETE` | `/api/forum/posts/[id]` | Admin/Owner | Unflag moderation status or delete forum post |
| `POST` | `/api/certificates/template` | Admin/Owner | Configure certificate template image & name position |
| `POST` | `/api/certificates/issue` | Admin/Owner | Issue certificate for student |
| `GET` | `/api/student/workshops/[id]/gradebook` | Student | Fetch student academic transcript & grade breakdown |

---

## 📜 Available Commands

- `npm run dev` — Starts Next.js development server.
- `npm run build` — Generates Prisma Client and compiles production Next.js build.
- `npm run start` — Runs Next.js production server.
- `npx prisma db seed` — Populates database with demo accounts & workshop data.
- `npx prisma studio` — Opens interactive database GUI at `http://localhost:5555`.

---

## 📄 License
Licensed under the [MIT License](LICENSE).