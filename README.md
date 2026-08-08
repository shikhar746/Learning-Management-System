# 🎓 Minnerva — AI-Assisted Multi-Tenant Learning Management System

**Minnerva** is a production-grade, multi-tenant learning management platform built with Next.js 16 App Router. It combines workshop-scoped cohort isolation, a BYOK (Bring Your Own Key) AI grading engine supporting 6 model providers, an automated forum content moderation pipeline, dynamic certificate generation, and a comprehensive role-based access control system — all under one unified codebase.

---

## Badges

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_DB-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-v5_Beta-7C3AED?style=for-the-badge&logo=auth0&logoColor=white)](https://authjs.dev/)
[![Upstash Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://upstash.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16.2.6 (App Router) |
| **UI** | React 19.2.4, Tailwind CSS v4, shadcn/ui, Radix UI, Lucide React |
| **Data Fetching** | SWR 2.5 |
| **ORM** | Prisma v5.22.0 + `@auth/prisma-adapter` |
| **Database** | PostgreSQL (Neon Serverless + PgBouncer connection pooling) |
| **Auth** | NextAuth.js v5 (JWT strategy, Google OAuth 2.0, Credentials + `bcryptjs`) |
| **Caching** | Upstash Redis (`@upstash/redis`) |
| **Realtime** | WebSockets (`ws`) |
| **File Storage** | Cloudinary v2 (client-side signed uploads + server asset management) |
| **AI Engine** | BYOK: Claude 3.5 Sonnet · Gemini 1.5 Pro · GPT-4o · Groq Llama-3.3 · Qwen 2.5 · Kimi K3 |
| **Encryption** | AES-256-GCM (Node.js `crypto`) for BYOK API key storage |
| **Validation** | Zod v4 |
| **Email** | Nodemailer (SMTP) |
| **Testing** | Native Node.js test runner (`node --test`) |

---

## Features

### 🏢 Multi-Tenant Workshop Cohorts
Each workshop is a fully isolated tenant boundary. Students self-enroll using a unique 6-character uppercase access code. All data — assignments, submissions, forum threads, and certificates — is scoped to `workshopId`. Workshops have lifecycle states (`ACTIVE` → `COMPLETED` → `ARCHIVED`), and archived workshops reject new submissions.

### 🤖 BYOK AI Evaluation Engine (Human-in-the-Loop)
Instructors bring their own API keys for any of the supported providers. Keys are stored AES-256-GCM encrypted (never in plaintext). The grading engine:
- Builds a structured prompt from the assignment `title`, `instructions`, and `gradingCriteria` (JSON rubric) along with the student's submitted files, repo URL, and deployment URL.
- Returns structured scores: `functionalityScore`, `qualityScore`, `aiDetectionScore`, `documentationScore`, `totalScore` (0–100 integer scale), and a `feedback` string.
- Supports **single-submission evaluation** (synchronous, per submission) and **batch evaluation** (async in-memory queue with Redis-backed status polling).
- Instructor reviews AI suggestions and manually overrides before publishing grades to students.

### 💬 Discussion Forums & Automated Content Moderation
Each workshop and individual assignment can have forum threads. Every post is scanned in real-time (<5ms, pure JavaScript) by a rule-based content scanner checking for profanity, spam patterns (excessive URLs, repeated characters), and toxicity indicators before storage. Posts are tagged `APPROVED`, `FLAGGED`, or `PENDING`. Instructors can moderate and delete flagged posts.

### 📜 Dynamic Certificate Engine
Instructors upload a base certificate template image to Cloudinary. The system overlays the recipient's name at configurable canvas coordinates (X, Y offset and font size). Certificates can be bulk-generated for an entire cohort and are publicly verifiable via a unique verification URL endpoint.

### 📊 Role-Scoped Analytics
- **Instructors** get per-workshop analytics: submission counts, average scores, and completion rates.
- **Owners** get platform-wide aggregates across all tenants: total users, workshops, submissions, and average grades, accessible at `/admin/owner`.

### 🔒 Security Hardening
- **SSRF protection** in the AI grading service blocks requests to `127.0.0.1`, `localhost`, `0.0.0.0`, all private IPv4 ranges (`10.x`, `172.16.x`, `192.168.x`), and IPv6 loopback (`::1`).
- **RBAC** is enforced at the API route handler level using workshop-scoped `UserRole` lookups (not just JWT role claims).
- **Cloudinary uploads** use server-generated SHA-1 HMAC signed upload parameters — clients never hold the API secret.
- Automated tests cover encryption round-trips, score boundary clamping, password hashing correctness, SSRF bypass attempts, and RBAC boundary checks.

---

## Architecture Overview

```mermaid
graph TD
    Client["React 19 / Next.js 16 (App Router)"]
    MW["NextAuth v5 Middleware (Route Auth Guard)"]

    subgraph "API Layer (Route Handlers)"
        AuthAPI["Auth API\n/api/auth"]
        WorkshopAPI["Workshop API\n/api/workshops"]
        AssignAPI["Assignment API\n/api/assignments"]
        SubAPI["Submission API\n/api/submissions"]
        AdminAPI["Admin API\n/api/admin"]
        ForumAPI["Forum API\n/api/forum"]
        CertAPI["Certificate API\n/api/certificates"]
        OwnerAPI["Owner API\n/api/owner"]
        UploadAPI["Upload API\n/api/upload"]
    end

    subgraph "Service Layer"
        AIGrader["aiGrading.js\n(BYOK Engine + SSRF Guard)"]
        BatchQueue["batchQueue.js\n(In-memory Queue + Redis Status)"]
        ForumMod["forumModeration.js\n(Rule-based Content Scanner)"]
        CertGen["certificateGenerator.js\n(Canvas + Cloudinary)"]
    end

    subgraph "Infrastructure (lib/)"
        AuthConf["auth.js (NextAuth Config)"]
        DB["db.js (Prisma Singleton)"]
        Enc["encryption.js (AES-256-GCM)"]
        RBAC["rbac.js (Role Guards)"]
    end

    subgraph "Data & Storage"
        Prisma["Prisma ORM v5"]
        Neon[("Neon PostgreSQL")]
        Redis[("Upstash Redis")]
        Cloudinary[("Cloudinary CDN")]
    end

    subgraph "BYOK AI Providers"
        Claude["Claude 3.5 Sonnet"]
        Gemini["Gemini 1.5 Pro"]
        GPT4o["OpenAI GPT-4o"]
        Groq["Groq Llama-3.3"]
        Qwen["Qwen 2.5"]
        Kimi["Kimi K3"]
    end

    Client --> MW
    MW --> AuthAPI & WorkshopAPI & AssignAPI & SubAPI & AdminAPI & ForumAPI & CertAPI & OwnerAPI & UploadAPI

    AdminAPI --> AIGrader & BatchQueue
    ForumAPI --> ForumMod
    CertAPI --> CertGen
    UploadAPI --> Cloudinary

    AIGrader --> Enc
    Enc -->|"Decrypt stored key"| Claude & Gemini & GPT4o & Groq & Qwen & Kimi
    BatchQueue --> Redis

    AuthAPI & WorkshopAPI & AssignAPI & SubAPI & AdminAPI & ForumAPI & CertAPI & OwnerAPI --> RBAC --> DB
    DB --> Prisma --> Neon
    CertGen --> Cloudinary
```

**Isolation Model**: Users have a single `User` record globally. Their access to any workshop's data is gated by the `UserRole` junction model (`userId` + `workshopId` + `role`). Every API route handler resolves the caller's workshop-scoped role independently — a user who is `ADMIN` in workshop A is `STUDENT` in workshop B.

---

## Prerequisites

| Requirement | Version |
| :--- | :--- |
| Node.js | `^18.0.0` or `>=20.0.0` |
| npm | `>=9.0.0` |
| PostgreSQL | Neon Cloud instance **or** local PostgreSQL 15+ |
| Upstash Redis | Any Upstash Redis instance (free tier works) |
| Cloudinary | Account with cloud name, API key & API secret |

---

## Installation / Setup

```bash
# 1. Clone the repository
git clone https://github.com/shikhar746/Learning-Management-System.git
cd "Learning Management System/Minnerva"

# 2. Install all dependencies (Prisma Client is auto-generated via postinstall)
npm install

# 3. Set up environment variables
cp .env.example .env
# Open .env and fill in DATABASE_URL, AUTH_SECRET, ENCRYPTION_SECRET, and any provider keys

# 4. Push the Prisma schema to your database
npx prisma db push

# 5. Seed test accounts and a sample workshop
npx prisma db seed

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use the seeded accounts to log in (see [Database → Seed Accounts](#prisma-migration--seed-commands)).

---

## Environment Variables

| Variable | Description | Required |
| :--- | :--- | :---: |
| `DATABASE_URL` | PostgreSQL connection string with `sslmode=require` | ✅ |
| `AUTH_SECRET` | NextAuth v5 JWT signing secret (min 32 chars). Generate: `openssl rand -base64 32` | ✅ |
| `AUTH_URL` | Base URL of the application | ✅ |
| `ENCRYPTION_SECRET` | Exactly 32-byte hex string for AES-256-GCM BYOK key encryption | ✅ |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | ⚪ |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret | ⚪ |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (public, safe to expose) | ⚪ |
| `CLOUDINARY_API_KEY` | Cloudinary API Key (used server-side for signing) | ⚪ |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret (never sent to client) | ⚪ |
| `CLOUDINARY_URL` | Full `cloudinary://key:secret@cloudname` URI | ⚪ |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint | ⚪ |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST authentication token | ⚪ |
| `SMTP_HOST` | SMTP server hostname for email notifications | ⚪ |
| `SMTP_PORT` | SMTP server port (typically `587`) | ⚪ |
| `SMTP_USER` | Sender email address | ⚪ |
| `SMTP_PASS` | SMTP password or Google App Password | ⚪ |
| `SMTP_FROM` | Formatted from address e.g. `"Minnerva" <noreply@minnerva.com>` | ⚪ |

> ✅ = Required to run · ⚪ = Optional / feature-gated

---

## Running Locally

### Development (`npm run dev`)
```bash
cd Minnerva
npm run dev
# → http://localhost:3000 with Turbopack hot-reload
```

### Production Build & Start
The `build` script runs `prisma generate` before `next build` — no manual client regeneration needed.
```bash
cd Minnerva
npm run build   # prisma generate && next build
npm run start   # next start (standalone Node server)
```

### Test Suite (`npm test`)
Runs the native Node.js test runner across three test files:
```bash
cd Minnerva
npm test
# Covers: RBAC enforcement · AES-256-GCM round-trip · score clamping
#         bcrypt correctness · SSRF bypass attempts · workshop lifecycle guards
```

---

## Database

### ORM & Connection
- **ORM**: Prisma v5.22.0 with a global singleton (`lib/db.js`) preventing client duplication in dev hot-reload.
- **Database**: Neon Serverless PostgreSQL with PgBouncer connection pooling (`?pgbouncer=true` on the pooled connection URL).

### Data Models

```
User ──< UserRole >── Workshop ──< Assignment ──< Submission
                              ──< ForumTopic ──< ForumPost
                              ──  CertificateTemplate
                              ──< Certificate >── User
```

| Model | Purpose |
| :--- | :--- |
| `User` | Global user (email, hashed password, OAuth links, global role) |
| `UserRole` | Junction: maps a User to a Workshop with a scoped `Role` |
| `Account` / `Session` | NextAuth OAuth account and session records |
| `VerificationToken` | NextAuth email verification tokens |
| `Workshop` | Tenant unit — access code, BYOK config, status, expiry |
| `Assignment` | Task definition — title, instructions, rubric JSON, due date, max marks |
| `Submission` | Versioned student submission — file URLs, repo/deployment links, scores, feedback |
| `ForumTopic` | Thread container, scoped to workshop ± assignment |
| `ForumPost` | Individual post with `moderationStatus` |
| `CertificateTemplate` | Base image URL + name coordinate and font config |
| `Certificate` | Issued certificate URL, unique per workshop+user |

### Enums

| Enum | Values |
| :--- | :--- |
| `Role` | `OWNER` · `ADMIN` · `STUDENT` |
| `WorkshopStatus` | `ACTIVE` · `COMPLETED` · `ARCHIVED` |
| `SubmissionStatus` | `SUBMITTED` · `GRADED` · `RESUBMITTED` |
| `ModerationStatus` | `APPROVED` · `FLAGGED` · `PENDING` |
| `AiProvider` | `CLAUDE` · `GEMINI` · `KIMI` · `OPENAI` · `GROQ` · `QWEN` · `DEFAULT` |

### Prisma Migration & Seed Commands

```bash
npx prisma generate          # Regenerate Prisma Client (runs automatically on npm install)
npx prisma db push           # Sync schema to database (dev — no migration history)
npx prisma migrate dev       # Create a named migration (production-grade change tracking)
npx prisma db seed           # Run prisma/seed.js — create test users and sample workshop
npx prisma studio            # Open GUI database explorer at http://localhost:5555
```

### Seed Accounts (`prisma/seed.js`)

| Email | Password | Global Role |
| :--- | :--- | :--- |
| `owner@minnerva.com` | `owner123` | `OWNER` |
| `admin@minnerva.com` | `admin123` | `ADMIN` |
| `student@minnerva.com` | `student123` | `STUDENT` |

> A sample workshop **"Web Development Bootcamp"** (code: `WEB001`) with two rubric-equipped assignments is created. The admin and student accounts are pre-enrolled.

---

## Folder Structure

```text
Minnerva/
│
├── prisma/
│   ├── schema.prisma              # All models, enums, relations & DB config
│   └── seed.js                    # Test users, workshop, assignments seeder
│
├── src/
│   ├── middleware.js              # NextAuth route guard — redirects unauthenticated to /auth/login
│   │
│   ├── lib/
│   │   ├── auth.js                # NextAuth v5 config (providers, JWT/session callbacks)
│   │   ├── db.js                  # Prisma Client singleton (dev hot-reload safe)
│   │   ├── encryption.js          # AES-256-GCM encrypt() / decrypt() for BYOK keys
│   │   └── rbac.js                # requireRole() guard + getCurrentUser() helper
│   │
│   ├── services/
│   │   ├── aiGrading.js           # BYOK AI engine — routes to 6 providers, SSRF guard
│   │   ├── batchQueue.js          # In-memory batch eval queue with Redis status tracking
│   │   ├── forumModeration.js     # Rule-based content scanner (<5ms, no external API)
│   │   └── certificateGenerator.js # Canvas name overlay + Cloudinary upload
│   │
│   ├── app/
│   │   ├── layout.js              # Root layout (ThemeProvider, fonts)
│   │   ├── page.js                # Landing/home page
│   │   ├── globals.css            # Global Tailwind v4 base styles
│   │   │
│   │   ├── (auth)/
│   │   │   ├── auth/login/        # Sign-in page (email/password + Google OAuth)
│   │   │   └── auth/register/     # Registration page
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.js          # Dashboard shell (Navbar, Sidebar, auth guard)
│   │   │   ├── admin/             # Instructor & Owner views
│   │   │   │   ├── page.js        # Main instructor dashboard (submissions, batch AI)
│   │   │   │   ├── assignments/   # Assignment CRUD + rubric builder
│   │   │   │   ├── users/         # Student roster + co-instructor invites
│   │   │   │   ├── workshops/     # Workshop management + BYOK AI config
│   │   │   │   └── owner/         # Platform-wide super-admin analytics
│   │   │   └── student/
│   │   │       ├── page.js        # Student home (workshops, upcoming deadlines)
│   │   │       ├── assignments/   # Assignment list + submission form + gradebook
│   │   │       └── workshops/     # Workshop list + join-by-code form
│   │   │
│   │   └── api/
│   │       ├── auth/              # NextAuth [...nextauth] handler + /register
│   │       ├── workshops/         # CRUD, join by code, AI config per workshop
│   │       ├── assignments/       # Assignment CRUD
│   │       ├── submissions/       # Versioned submission CRUD + grade publishing
│   │       ├── admin/submissions/ # Single AI eval + batch queue management
│   │       ├── forum/             # Topics + posts (auto-moderated on create)
│   │       ├── certificates/      # Generate + list + public verify endpoint
│   │       ├── upload/            # Cloudinary signed upload parameter generator
│   │       ├── analytics/         # Per-workshop instructor analytics
│   │       ├── owner/analytics/   # Platform-wide OWNER-only metrics
│   │       └── student/gradebook/ # Student's own full gradebook
│   │
│   └── components/
│       ├── ui/                    # shadcn/Radix primitives (Button, Dialog, Table, …)
│       ├── admin/                 # AdminDashboard, SubmissionTable, BatchEvalPanel,
│       │                          # RubricBuilder, AIConfigModal, WorkshopSettings
│       ├── student/               # StudentDashboard, SubmissionForm, GradebookTable
│       └── shared/                # Navbar, Sidebar, RoleGuard, LoadingSpinner, ErrorBoundary
│
└── test/
    ├── architectureHardening.test.js   # RBAC enforcement + workshop lifecycle guards
    ├── precisionAndSecurity.test.js    # AES round-trip, score clamping, bcrypt
    └── ssrf.test.js                    # SSRF protection: loopback + private IP blocking
```

---

## API Routes Overview

### Auth
| Method | Route | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth v5 catch-all handler | — |
| `POST` | `/api/auth/register` | Create new user account (hashed with bcrypt) | None |

### Workshops
| Method | Route | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/workshops` | List workshops the current user is enrolled in | Any |
| `POST` | `/api/workshops` | Create a new workshop (generates unique 6-char code) | ADMIN · OWNER |
| `GET` | `/api/workshops/:id` | Get single workshop with members & assignments | Member |
| `PATCH` | `/api/workshops/:id` | Update workshop metadata | ADMIN · OWNER |
| `DELETE` | `/api/workshops/:id` | Archive/delete workshop | OWNER |
| `POST` | `/api/workshops/join` | Join workshop by 6-char code (enrolls as STUDENT) | Any |
| `GET` | `/api/workshops/:id/ai-config` | Get provider info (key existence only, never raw key) | ADMIN · OWNER |
| `POST` | `/api/workshops/:id/ai-config` | Store encrypted BYOK API key + provider selection | ADMIN · OWNER |

### Assignments
| Method | Route | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/assignments?workshopId=` | List assignments (students see published only) | Member |
| `POST` | `/api/assignments` | Create assignment with rubric criteria | ADMIN · OWNER |
| `GET` | `/api/assignments/:id` | Get single assignment | Member |
| `PATCH` | `/api/assignments/:id` | Edit assignment fields | ADMIN · OWNER |
| `DELETE` | `/api/assignments/:id` | Soft-delete (sets `deletedAt`) | ADMIN · OWNER |

### Submissions
| Method | Route | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/submissions?assignmentId=` | Get submission history (versioned) | Member |
| `POST` | `/api/submissions` | Create new submission (auto-increments version) | STUDENT |
| `GET` | `/api/submissions/:id` | Get single submission with assignment details | Member |
| `PATCH` | `/api/submissions/:id` | Update scores, feedback, and `isGradePublished` | ADMIN · OWNER |

### AI Grading & Batch Evaluation
| Method | Route | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/submissions/:id/ai-grade` | Synchronous single-submission AI evaluation | ADMIN · OWNER |
| `POST` | `/api/admin/submissions/batch` | Enqueue batch AI evaluation job for multiple submissions | ADMIN · OWNER |
| `GET` | `/api/admin/submissions/batch?workshopId=` | Poll batch job status `{ pending, processing, completed, failed }` | ADMIN · OWNER |

### Forum
| Method | Route | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/forum/topics?workshopId=` | List forum topics with post counts | Member |
| `POST` | `/api/forum/topics` | Create a new forum topic | Member |
| `GET` | `/api/forum/topics/:id/posts` | Get posts for a topic | Member |
| `POST` | `/api/forum/topics/:id/posts` | Submit post — auto-moderated before storage | Member |
| `PATCH` | `/api/forum/posts/:id` | Update moderation status | ADMIN · OWNER |
| `DELETE` | `/api/forum/posts/:id` | Delete a post | ADMIN · OWNER |

### Certificates
| Method | Route | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/certificates` | Generate & issue certificates for one or more users | ADMIN · OWNER |
| `GET` | `/api/certificates?workshopId=` | List issued certificates for a workshop | ADMIN · OWNER |
| `GET` | `/api/certificates/:id/verify` | Public certificate verification endpoint | **None** |

### Utilities & Analytics
| Method | Route | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/upload` | Get signed Cloudinary upload parameters (HMAC SHA-1) | Any |
| `GET` | `/api/analytics?workshopId=` | Per-workshop metrics (submissions, avg scores, completion %) | ADMIN · OWNER |
| `GET` | `/api/owner/analytics` | Platform-wide aggregate metrics across all tenants | OWNER |
| `GET` | `/api/student/gradebook` | Calling student's complete gradebook with all scores | STUDENT |

---

## Roles & Permissions

Roles are workshop-scoped. A user can be `ADMIN` in one workshop and `STUDENT` in another. The `OWNER` role provides platform-wide access across all tenants.

| Permission | STUDENT | ADMIN | OWNER |
| :--- | :---: | :---: | :---: |
| View platform-wide analytics (`/admin/owner`) | ❌ | ❌ | ✅ |
| Create / delete workshops | ❌ | ✅ | ✅ |
| Configure BYOK AI key & provider | ❌ | ✅ | ✅ |
| Create, edit, delete assignments | ❌ | ✅ | ✅ |
| Run single AI evaluation | ❌ | ✅ | ✅ |
| Run batch AI evaluation queue | ❌ | ✅ | ✅ |
| Override and publish grades | ❌ | ✅ | ✅ |
| Invite co-instructors | ❌ | ✅ | ✅ |
| Generate & issue certificates | ❌ | ✅ | ✅ |
| Moderate forum posts | ❌ | ✅ | ✅ |
| Submit assignments (versioned) | ✅ | ❌ | ❌ |
| View own gradebook & feedback | ✅ | ❌ | ❌ |
| Join workshop via access code | ✅ | ✅ | ✅ |
| Post in discussion forums | ✅ | ✅ | ✅ |

---

## Known Limitations / Roadmap

### Current Limitations

- **Batch Queue Persistence**: The batch AI evaluation queue is in-memory (Node.js `Map`). A server restart clears all pending jobs. Redis is used for status polling only. A persistent worker queue (e.g., BullMQ + Redis) is planned for high-throughput deployments.
- **SCORM / LTI**: Workshop content is native to Minnerva; there is no current support for importing SCORM packages or LTI 1.3 tool integration.
- **File Execution**: Submitted files are stored on Cloudinary for review only — no sandboxed code execution environment exists yet.
- **Email Notifications**: Nodemailer configuration is present but email triggers (submission received, grade published, certificate issued) are not yet wired to all events.

### Roadmap

- [ ] **Persistent Job Queue** — Replace in-memory queue with BullMQ + Redis for distributed, restartable batch AI evaluation.
- [ ] **Real-time WebSocket Chat** — Live cohort discussion channels alongside async forum threads.
- [ ] **AI Plagiarism & Similarity Detection** — Cross-submission code and text vector similarity scoring.
- [ ] **LTI 1.3 Integration** — Canvas and Blackboard interoperability.
- [ ] **SCORM Export** — Package workshop modules as SCORM-compliant bundles.
- [ ] **Code Sandbox** — Sandboxed execution environment for evaluating submitted code automatically.

---

## Contributing

Contributions are welcome. Please follow this workflow:

1. **Fork** the repository and create a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. **Make changes** with clear, focused commits using semantic prefixes:
   - `feat:` — new feature
   - `fix:` — bug fix
   - `refactor:` — code restructuring without behaviour change
   - `test:` — new or updated tests
3. **Ensure the test suite passes** before submitting:
   ```bash
   npm test
   ```
4. **Open a Pull Request** targeting `main`. Include a clear description of what changed and why.

> Please do not commit `.env` files or any API keys. The `.gitignore` already excludes `.env`, `.env.local`, and `.next/`.

---

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for full terms.