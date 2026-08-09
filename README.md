# 🎓 Minnerva — AI-Assisted Multi-Tenant Learning Management System

🚀 **Live Deployment**: [https://learning-management-system-kappa-one.vercel.app](https://learning-management-system-kappa-one.vercel.app)

**Minnerva** is a production-grade, multi-tenant Learning Management System built on Next.js 16 App Router. It delivers workshop-scoped cohort isolation, a **BYOK (Bring Your Own Key) AI grading engine** routing across 6 model providers, an automated forum content moderation pipeline (with optional OpenAI Moderation API integration), dynamic certificate generation, and a comprehensive two-level RBAC system — all in a unified, type-safe full-stack TypeScript/JS codebase.

---

## Badges

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://learning-management-system-kappa-one.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Cloud-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-v5_Beta-7C3AED?style=for-the-badge&logo=auth0&logoColor=white)](https://authjs.dev/)
[![Upstash Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://upstash.com/)
[![Zod](https://img.shields.io/badge/Zod-v4-3068B7?style=for-the-badge)](https://zod.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16.2.6 (App Router, React Server Components) |
| **UI Library** | React 19.2.4, Tailwind CSS v4, shadcn/ui, Radix UI v1.4, Lucide React |
| **Client Data** | SWR 2.5 (cache-key factory pattern, deduped fetching) |
| **ORM** | Prisma v5.22 + `@auth/prisma-adapter` (with global soft-delete `$extends`) |
| **Database** | PostgreSQL — Neon Serverless with PgBouncer connection pooling |
| **Auth** | NextAuth.js v5 Beta (JWT strategy; edge-compatible `auth.config.js` split) |
| **Auth Providers** | Google OAuth 2.0, Credentials (`bcryptjs` — 10 salt rounds) |
| **Caching** | Upstash Redis via REST (`@upstash/redis`), in-memory `Map` fallback in dev |
| **File Storage** | Cloudinary v2 (server-generated SHA-1 HMAC signed uploads; 10 MB limit) |
| **AI Engine** | BYOK: Groq · OpenAI · Claude · Gemini · Kimi (Moonshot) · Qwen (DashScope) |
| **Encryption** | AES-256-GCM (Node.js `crypto`) for BYOK API key storage at rest |
| **Validation** | Zod v4 (full schema coverage: auth, workshops, assignments, submissions, certs, forum) |
| **Email** | Nodemailer (SMTP; gracefully logs to console when SMTP is unconfigured) |
| **Security** | Custom SSRF guard (`urlSafety.js`) with domain allowlist + IP literal detection |
| **Testing** | Native Node.js `node:test` runner (no Jest/Vitest) |
| **Styling Utils** | `clsx` + `tailwind-merge` via `cn()` helper; `next-themes` for dark/light mode |

---

## Features

### 🏢 Multi-Tenant Workshop Cohorts
Each **workshop** is a fully isolated tenant boundary keyed by `workshopId`. Students self-enroll using a unique 6-character uppercase alphanumeric access code. All data — assignments, submissions, forum threads, and certificates — is strictly scoped to that workshop. Workshops follow a lifecycle (`ACTIVE` → `COMPLETED` → `ARCHIVED`); archived workshops reject new submissions and display a read-only "Workshop Concluded" closeout banner to students.

### 🤖 BYOK AI Evaluation Engine (Human-in-the-Loop)
Instructors bring their own API keys for any of the 6 supported providers. Keys are stored **AES-256-GCM encrypted** in the database and are never returned to clients in plaintext (the `sanitizeWorkshop()` helper replaces them with `"••••••••"`). The grading engine:
- Builds a structured evaluation prompt from the assignment `title`, `instructions`, `gradingCriteria` (JSON rubric), and full student submission artifacts (repo URL, deployment URL, Drive URL, comments).
- **Optionally fetches GitHub repo content** via the GitHub API (SSRF-protected; reads up to 20 files + `README.md` first 1500 chars) to give the AI actual code context.
- Produces structured JSON scores: `functionalityScore`, `qualityScore`, `aiDetectionScore`, `documentationScore`, `suggestedScore` (clamped to [0, maxMarks] integer), and `suggestedFeedback`.
- Supports **single AI evaluation** (synchronous, immediate) and **batch evaluation** (`AI_DRAFT_ALL` action — async in-memory queue, returns a `batchId` for polling).
- The instructor always reviews AI suggestions and can override any field before publishing grades.
- A separate **`PUBLISH_ALL`** batch action bulk-publishes all graded submissions to student gradebooks at once.

**Provider fallback chains** (Groq tries 4 models sequentially; Qwen tries 3 endpoints including Groq-hosted, DashScope, and Together.xyz).

### 💬 Discussion Forums & Two-Stage Content Moderation
Each workshop (and optionally each assignment) supports threaded discussion forums. Every submitted post passes through a two-stage moderation pipeline:
1. **Local rule-based scanner** (<5ms, no external API): 12 spam keyword patterns + 2 regex patterns for abusive/threatening language.
2. **Optional OpenAI Moderation API**: If `OPENAI_API_KEY` is set in the environment, posts are also checked against the OpenAI moderation endpoint.

Posts are stored with `moderationStatus`: `APPROVED`, `FLAGGED`, or `PENDING`. Instructors can manually update any post's status or hard-delete it from the moderation panel.

### 📊 Two-Level Analytics (Redis-Cached)
Analytics data is cached in Upstash Redis with a 30-second TTL, automatically invalidated on: new submission, grade update, new workshop enrollment. Role determines what you see:
- **OWNER**: Platform-wide aggregates — total students, assignments, submissions, graded count, pending count, per-assignment class averages across all workshops, top 5 upcoming deadlines platform-wide.
- **ADMIN**: Per-workshop breakdown — registered vs. unregistered student counts, instructor list, assignment/submission/pending counts, average score, upcoming deadlines. Each workshop is reported independently (no cross-tenant data mixing — RULE 4/5 isolation in `analyticsService.js`).
- **STUDENT**: Their own submitted count, pending assignment count, overall progress %, published grades with feedback, and next 5 deadlines.

### 📜 Dynamic Certificate Generation
Instructors upload a base certificate template image to Cloudinary and configure: template URL, name X/Y coordinate offsets, and font size. The system appends the participant's name as a URL query parameter on the template URL for rendering. Certificates are idempotent (re-issuing to the same user returns the existing record). A public, no-auth verification endpoint confirms certificate authenticity.

### 🔒 Multi-Layer Security
- **SSRF protection** (`urlSafety.js`): `isIpOrInternalHost()` blocks IP literals in standard, hex (`0x7f000001`), octal (`0177.`), and decimal (`2852039166`) formats, IPv6 literals, `.local`/`.internal` domains, and loopback. `safeFetch()` enforces HTTPS and an explicit domain allowlist: `api.github.com`, `raw.githubusercontent.com`, `api.groq.com`, `api.openai.com`, `api.anthropic.com`, `generativelanguage.googleapis.com`, `api.moonshot.cn`, `dashscope.aliyuncs.com`, `api.together.xyz`. Open redirect attacks are blocked by inspecting redirect `Location` headers before following.
- **Zod submission validation**: `repoUrl` is validated through `validateAndExtractGithubRepo()` — only `github.com` and `www.github.com` (exact allowlist, no wildcard subdomain), HTTPS only, strict path regex. Cloud metadata IP `169.254.169.254` rejected at schema parse time.
- **Two-level RBAC**: Middleware handles coarse-grained page-level gating (`/admin/*` vs `/student/*`). Every API route handler independently resolves the caller's **workshop-scoped** `UserRole` via `authorizeWorkshopAccess()` — a user's global `ADMIN` role is irrelevant if they don't have a `UserRole` in the target workshop.
- **Stale JWT prevention**: `getFreshUserGlobalRole()` queries the DB on sensitive operations to avoid acting on role claims from outdated JWT tokens (e.g. after a role upgrade without re-login).
- **Soft-delete transparency**: The Prisma client is extended via `$extends` to automatically inject `deletedAt: null` into `findMany`, `findFirst`, and `count` queries on `Assignment` and `Submission`, so soft-deleted records are invisible to all standard reads without requiring manual `where` clauses.
- **Score integer precision**: Scores are stored and computed as integers via `parseScoreToBasisPoints()` to eliminate JavaScript float drift (documented in test suite: `0.1 * 10 ≠ 1.0` in standard JS).

---

## Architecture Overview

```mermaid
graph TD
    Client["React 19 / Next.js 16 App Router"]
    MW["NextAuth v5 Middleware\n(matcher: /student/* and /admin/*)"]

    subgraph "API Layer — Route Handlers"
        AuthAPI["/api/auth\n(NextAuth + register)"]
        WorkshopAPI["/api/workshops\n(CRUD, join, invite, ai-config, analytics)"]
        AssignAPI["/api/assignments\n(CRUD, soft-delete)"]
        SubAPI["/api/submissions\n(versioned, SSRF-validated)"]
        AdminAPI["/api/admin/submissions\n(single AI-grade, batch, grade publish)"]
        AdminUserAPI["/api/admin/users\n(directory, role updates)"]
        ForumAPI["/api/forum\n(topics, posts, moderation)"]
        CertAPI["/api/certificates\n(issue, template, verify public)"]
        OwnerAPI["/api/owner/analytics\n(platform-wide, OWNER only)"]
        AnalyticsAPI["/api/analytics\n(role-filtered, Redis 30s TTL)"]
        UploadAPI["/api/upload\n(Cloudinary signed params)"]
        GradebookAPI["/api/student/workshops/id/gradebook"]
    end

    subgraph "Service Layer"
        AIGrader["aiGradingService.js\n(BYOK, 6 providers, GitHub fetch, SSRF)"]
        BatchQueue["batchGradingQueue.js\n(in-memory Map, async setTimeout)"]
        ForumSvc["forumService.js\n(local scan + optional OpenAI Moderation)"]
        Analytics["analyticsService.js\n(OWNER vs ADMIN vs STUDENT paths, Redis)"]
        Assignment["assignmentService.js\n(role-filtered visibility)"]
        Submission["submissionService.js\n(versioning, score integers, email trigger)"]
        Workshop["workshopService.js\n(code gen, key sanitize, invite, cascade delete)"]
        Certificate["certificateService.js\n(template config, idempotent issue, closeout)"]
        Notify["notificationService.js\n(Nodemailer SMTP, console-log fallback)"]
    end

    subgraph "Infrastructure — lib/"
        AuthConf["auth.config.js\n(edge-compatible JWT config, /login redirect)"]
        AuthFull["auth.js\n(PrismaAdapter + Google + Credentials)"]
        DB["db.js\n(Prisma singleton + soft-delete $extends)"]
        Enc["encryption.js\n(AES-256-GCM encrypt / decrypt)"]
        RBAC["rbac.js\n(authorizeWorkshopAccess + getFreshUserGlobalRole)"]
        Redis["redis.js\n(Upstash REST + in-memory Map fallback)"]
        SSRF["urlSafety.js\n(isIpOrInternalHost + validateGithubRepo + safeFetch)"]
        SWR["swr.js\n(fetcher + cacheKeys factory + swrDefaults)"]
        Zod["lib/validations/\n(auth, workshop, assignment, submission, cert, forum)"]
    end

    subgraph "Data & Storage"
        Neon[("Neon PostgreSQL\n(PgBouncer pooling)")]
        RedisStore[("Upstash Redis\n(30s analytics TTL)")]
        Cloudinary[("Cloudinary CDN\n(uploads, templates)")]
    end

    subgraph "BYOK AI Providers"
        Groq["Groq\n(llama-3.3-70b + 3 fallbacks)"]
        OpenAI["OpenAI GPT-4o"]
        Claude["Anthropic Claude 3.5 Sonnet"]
        Gemini["Google Gemini 1.5 Pro"]
        Kimi["Moonshot Kimi K3\n(api.moonshot.cn)"]
        Qwen["Alibaba Qwen 2.5\n(DashScope + Together.xyz fallback)"]
    end

    Client --> MW
    MW -->|"Coarse-grained page gate\n(/admin/* requires ADMIN|OWNER)"| AuthAPI & WorkshopAPI & AssignAPI & SubAPI & AdminAPI & AdminUserAPI & ForumAPI & CertAPI & OwnerAPI & AnalyticsAPI & UploadAPI & GradebookAPI

    AdminAPI --> AIGrader & BatchQueue
    ForumAPI --> ForumSvc
    AnalyticsAPI & OwnerAPI --> Analytics
    AssignAPI --> Assignment
    SubAPI & AdminAPI --> Submission
    WorkshopAPI --> Workshop
    CertAPI --> Certificate
    Submission --> Notify

    AIGrader --> SSRF
    AIGrader --> Enc
    Enc -->|"decrypt stored key"| Groq & OpenAI & Claude & Gemini & Kimi & Qwen

    Analytics & BatchQueue --> Redis --> RedisStore
    Workshop & Assignment & Submission & Certificate & ForumSvc --> DB --> Neon
    RBAC --> DB
    UploadAPI --> Cloudinary
    Certificate --> Cloudinary
```

**Isolation model**: Users have a single global `User` record. Access to any workshop's data is gated by the `UserRole` junction model (`userId` + `workshopId` + `role`). A user who is `ADMIN` in workshop A is treated as `STUDENT` in workshop B. The `OWNER` role short-circuits this check at the `rbac.js` level, granting cross-tenant access.

---

## Prerequisites

| Requirement | Version / Notes |
| :--- | :--- |
| Node.js | `^18.0.0` or `>=20.0.0` |
| npm | `>=9.0.0` |
| PostgreSQL | Neon Serverless Cloud **or** local PostgreSQL 15+ |
| Upstash Redis | Any Upstash Redis instance — free tier is sufficient. Without it, the app falls back to an in-memory `Map` with TTL tracking. |
| Cloudinary | Account with cloud name, API key, and API secret |

> **No Redis? No problem.** `redis.js` detects missing `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` and automatically uses an in-memory fallback store. Analytics will still work — cache just won't survive server restarts.

---

## Installation / Setup

```bash
# 1. Clone the repository
git clone https://github.com/shikhar746/Learning-Management-System.git
cd "Learning Management System/Minnerva"

# 2. Install dependencies — Prisma Client is auto-generated via postinstall
npm install

# 3. Configure environment variables
cp .env.example .env
# Open .env — fill in DATABASE_URL, AUTH_SECRET, ENCRYPTION_SECRET at minimum

# 4. Push the Prisma schema to your database
npx prisma db push

# 5. Seed test users, a sample workshop, assignments, and a forum thread
npx prisma db seed

# 6. Launch the development server
npm run dev
# → http://localhost:3000
```

> **`ENCRYPTION_SECRET` in dev**: If `ENCRYPTION_SECRET` and `AUTH_SECRET` are both absent, `encryption.js` falls back to a hardcoded 32-byte dev secret with a console warning. In `NODE_ENV=production` or `staging`, the absence of these secrets throws a `CRITICAL CONFIGURATION ERROR` at startup and prevents the server from running. Set them.

---

## Environment Variables

| Variable | Description | Required |
| :--- | :--- | :---: |
| `DATABASE_URL` | PostgreSQL connection string. Add `?pgbouncer=true&connection_limit=1` for Neon pooled connections. | ✅ |
| `AUTH_SECRET` | NextAuth v5 JWT signing secret — minimum 32 characters. Generate: `openssl rand -base64 32` | ✅ |
| `AUTH_URL` | Canonical base URL of the app (e.g. `http://localhost:3000`). Required for NextAuth redirect URLs. | ✅ |
| `ENCRYPTION_SECRET` | Exactly 32-byte string for AES-256-GCM BYOK API key encryption. **Do not reuse `AUTH_SECRET`.** | ✅ |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID. Create at [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Redirect URI: `{AUTH_URL}/api/auth/callback/google` | ⚪ |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret. | ⚪ |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name — public, safe to expose to the browser. | ⚪ |
| `CLOUDINARY_API_KEY` | Cloudinary API Key — server-side only, used to sign upload requests. | ⚪ |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret — **never sent to the client**. | ⚪ |
| `CLOUDINARY_URL` | Full `cloudinary://key:secret@cloudname` URI (used by Cloudinary SDK internally). | ⚪ |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint URL. Omit to use the in-memory fallback. | ⚪ |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST authentication token. | ⚪ |
| `OPENAI_API_KEY` | If set, forum posts are additionally checked via the [OpenAI Moderation API](https://platform.openai.com/docs/guides/moderation). | ⚪ |
| `SMTP_HOST` | SMTP server hostname for grade and assignment notification emails. | ⚪ |
| `SMTP_PORT` | SMTP port. `587` = STARTTLS (default); `465` = TLS (`secure: true` auto-set). | ⚪ |
| `SMTP_USER` | Sender email address / SMTP username. | ⚪ |
| `SMTP_PASS` | SMTP password or Google App Password. | ⚪ |
| `SMTP_FROM` | Formatted from address, e.g. `"Minnerva LMS" <noreply@minnerva.com>` | ⚪ |

> ✅ Required to start the server · ⚪ Optional / feature-gated (graceful degradation when absent)

---

## Running Locally

### Development (`npm run dev`)
```bash
cd Minnerva
npm run dev
# Starts Next.js dev server with Turbopack hot-reload
# → http://localhost:3000
```

### Production Build & Start
The `build` script runs `prisma generate` before `next build` — no manual Prisma client step needed.

```bash
cd Minnerva
npm run build   # prisma generate && next build
npm run start   # next start (standalone Node.js server)
```

### Test Suite
```bash
cd Minnerva
npm test        # node --test test/*.test.js
```

The test suite uses the **native Node.js `node:test` runner** — no Jest, no Vitest, no extra dependencies. See the [Testing section](#testing) for full coverage details.

---

## Database

### ORM & Architecture
- **ORM**: Prisma v5.22 with a **global singleton** (`lib/db.js`) that survives Next.js dev hot-reloads via `globalThis.__prismaGlobal`.
- **Soft-delete transparency**: The Prisma client is extended via `.$extends()` to automatically inject `{ deletedAt: null }` into all `findMany`, `findFirst`, and `count` calls on `Assignment` and `Submission`. No route handler needs to remember to filter soft-deleted records manually.
- **Database**: Neon Serverless PostgreSQL. Use the **pooled connection string** (with PgBouncer) for the API server, and the direct non-pooled connection string for Prisma migrations.

### Data Model Map

```
User ──< UserRole >── Workshop ──< Assignment ──< Submission
  │                      │
  │                      ├──< ForumTopic ──< ForumPost
  │                      ├──  CertificateTemplate
  │                      └──< Certificate >── User
  │
  └── Account / Session / VerificationToken  (NextAuth OAuth)
```

| Model | Key Fields | Purpose |
| :--- | :--- | :--- |
| `User` | `id`, `email` (unique), `password` (bcrypt), `role` (global enum), `githubUsername` | Global user entity. Soft-delete not applied — hard relations. |
| `UserRole` | `userId`, `workshopId`, `role` — `@@unique([userId, workshopId])` | **The isolation boundary.** Scopes a User's role to a specific Workshop. |
| `Workshop` | `code` (unique 6-char), `status`, `validUntil`, `aiProvider`, `aiApiKey` (AES-encrypted) | Tenant unit. `aiApiKey` stored encrypted. Raw key never returned from API. |
| `Assignment` | `workshopId`, `gradingCriteria` (JSON rubric), `maxMarks`, `published`, `deletedAt` | Task definition with rubric. Soft-deleted via `deletedAt`. |
| `Submission` | `userId`, `assignmentId`, `version`, `repoUrl`, `fileUrls[]`, `status`, `isGradePublished`, `aiSuggestedScore`, `deletedAt` | Versioned student work. Stores both AI suggestion and final instructor grades separately. |
| `ForumTopic` | `workshopId`, `assignmentId?`, `title` | Thread container, optionally linked to an assignment. |
| `ForumPost` | `topicId`, `content`, `moderationStatus` | Individual post with moderation state. |
| `CertificateTemplate` | `workshopId` (unique), `templateUrl`, `nameX`, `nameY`, `fontSize` | Canvas coordinate config for participant name overlay. |
| `Certificate` | `workshopId`, `userId` — `@@unique([workshopId, userId])` | Issued certificate. Idempotent — one per student per workshop. |

### Enums

| Enum | Values |
| :--- | :--- |
| `Role` | `OWNER` · `ADMIN` · `STUDENT` |
| `WorkshopStatus` | `ACTIVE` · `COMPLETED` · `ARCHIVED` |
| `SubmissionStatus` | `SUBMITTED` · `GRADED` · `RESUBMITTED` |
| `ModerationStatus` | `APPROVED` · `FLAGGED` · `PENDING` |
| `AiProvider` | `CLAUDE` · `GEMINI` · `KIMI` · `OPENAI` · `GROQ` · `QWEN` · `DEFAULT` |

### Prisma Commands

```bash
# After schema changes in development:
npx prisma db push           # Sync schema to DB (no migration history — dev only)

# For production-grade tracked migrations:
npx prisma migrate dev       # Create and apply a named migration

# Client generation (runs automatically via postinstall):
npx prisma generate

# Seed test users, workshop, assignments, forum, certificate template:
npx prisma db seed

# GUI database browser at http://localhost:5555:
npx prisma studio
```

### Seed Accounts (`prisma/seed.js`)

| Email | Password | Role |
| :--- | :--- | :--- |
| `owner@lms.com` | `password123` | `OWNER` |
| `admin@lms.com` | `password123` | `ADMIN` |
| `student@lms.com` | `password123` | `STUDENT` |

A sample workshop **"React & Full-Stack Web Dev Cohort #1"** (code: **`WEB2026`**, valid for 30 days from seed date) is created with the admin and student pre-enrolled. One published assignment with AI grading enabled, a pre-seeded student submission (with AI suggested score of 88), a forum topic with two approved posts, and a default certificate template are also created.

---

## Folder Structure

```text
Minnerva/
│
├── prisma/
│   ├── schema.prisma              # All models, enums, relations, indices
│   └── seed.js                    # Test users, workshop, assignment, submission, forum, cert template
│
└── src/
    ├── middleware.js              # NextAuth edge middleware
    │                              # matcher: ["/student/:path*", "/admin/:path*"]
    │                              # → unauthenticated → /login?callbackUrl=...
    │                              # → authenticated non-admin on /admin/* → /student
    │
    ├── lib/
    │   ├── auth.config.js         # Edge-compatible NextAuth config (JWT strategy, /login page)
    │   ├── auth.js                # Full NextAuth init — PrismaAdapter + Google + Credentials providers
    │   ├── db.js                  # Prisma singleton + soft-delete $extends for Assignment & Submission
    │   ├── encryption.js          # AES-256-GCM encrypt() / decrypt() — BYOK key storage
    │   ├── rbac.js                # authorizeWorkshopAccess() + getFreshUserGlobalRole()
    │   ├── redis.js               # Upstash Redis client + in-memory Map fallback + getOrSetCache()
    │   ├── swr.js                 # fetcher() + cacheKeys factory + swrDefaults
    │   ├── urlSafety.js           # SSRF: isIpOrInternalHost() + validateGithubRepo() + safeFetch()
    │   ├── utils.js               # cn() — clsx + tailwind-merge helper
    │   └── validations/           # Zod schemas
    │       ├── auth.js            # registerSchema (name, email, password, role)
    │       ├── workshop.js        # create / update / join / inviteAdmin schemas
    │       ├── assignment.js      # create / update schemas (rubric JSON, attachments)
    │       ├── submission.js      # create (SSRF-validated repoUrl) / grade / aiSuggest schemas
    │       ├── certificate.js     # configureTemplate / issueCertificate schemas
    │       └── forum.js           # createTopic / createPost / moderatePost schemas
    │
    ├── services/
    │   ├── aiGradingService.js    # BYOK engine — 6 provider fetchers, GitHub code fetch, prompt build
    │   ├── batchGradingQueue.js   # In-memory Map queue — enqueueBatch / getBatchJobStatus / processAsync
    │   ├── forumService.js        # Forum CRUD + 2-stage moderation (local rules + optional OpenAI API)
    │   ├── analyticsService.js    # OWNER / ADMIN / STUDENT analytics — Redis-cached, role-isolated
    │   ├── assignmentService.js   # Role-filtered assignment CRUD + soft-delete
    │   ├── submissionService.js   # Versioning, integer scores, grade publish, email trigger
    │   ├── workshopService.js     # Code gen, key sanitize, invite, lifecycle, cascade delete
    │   ├── certificateService.js  # Template config, idempotent issuance, closeout details
    │   └── notificationService.js # Nodemailer SMTP — assignment + grade emails (console fallback)
    │
    ├── app/
    │   ├── layout.js              # Root layout — Providers (SessionProvider + ThemeProvider)
    │   ├── page.js                # Landing page / root redirect
    │   ├── globals.css            # Global Tailwind v4 base styles + CSS variables
    │   │
    │   ├── (auth)/
    │   │   ├── login/page.js      # Credentials + Google OAuth sign-in; reads ?error params
    │   │   └── register/page.js   # Name / email / password / role form → POST /api/auth/register
    │   │
    │   ├── (dashboard)/
    │   │   ├── layout.js          # Dashboard shell — Sidebar + Navbar + auth session guard
    │   │   ├── error.js           # Dashboard-level error boundary
    │   │   ├── loading.js         # Dashboard-level loading skeleton
    │   │   │
    │   │   ├── admin/
    │   │   │   ├── page.js                          # Analytics overview (OWNER aggregate / ADMIN per-workshop)
    │   │   │   ├── assignments/page.js               # Assignment management — search, filter, CRUD
    │   │   │   ├── assignments/new/                  # New assignment form (AssignmentForm.js)
    │   │   │   ├── assignments/[id]/edit/            # Edit assignment (AssignmentForm.js)
    │   │   │   ├── assignments/[id]/submissions/     # Submission list + GradingModal (24 KB component)
    │   │   │   ├── users/page.js                     # User directory + role management
    │   │   │   ├── workshops/page.js                 # Workshop grid — create, manage, code copy
    │   │   │   ├── workshops/new/                    # New workshop form (WorkshopForm.js)
    │   │   │   ├── workshops/[id]/page.js            # Workshop control room — invite, BYOK, delete (381 lines)
    │   │   │   ├── workshops/[id]/analytics/         # Per-workshop leaderboard + assignment stats
    │   │   │   ├── workshops/[id]/certificate/       # Certificate template config + batch issue
    │   │   │   ├── workshops/[id]/forum/             # Forum topic/post management panel
    │   │   │   └── owner/page.js                     # Super-admin control panel (OWNER only)
    │   │   │
    │   │   └── student/
    │   │       ├── page.js                           # Student dashboard — progress, grades, deadlines
    │   │       ├── assignments/page.js               # Assignments across all enrolled workshops
    │   │       ├── assignments/[id]/                 # Assignment detail + SubmissionModal + history
    │   │       ├── workshops/page.js                 # Enrolled workshops + JoinWorkshopModal
    │   │       ├── workshops/[id]/gradebook/         # Per-workshop gradebook — scores, progress, cert
    │   │       ├── workshops/[id]/certificate/       # Certificate download page
    │   │       └── workshops/[id]/forum/             # Forum — thread list, post, view moderation status
    │   │
    │   └── api/
    │       ├── auth/[...nextauth]/route.js            # NextAuth catch-all handler (GET, POST)
    │       ├── auth/register/route.js                 # POST — create user (bcrypt, duplicate check)
    │       ├── workshops/route.js                     # GET (role-filtered list) · POST (create)
    │       ├── workshops/[id]/route.js                # GET · PUT (update) · DELETE (cascade)
    │       ├── workshops/join/route.js                # POST — join by 6-char code
    │       ├── workshops/[id]/invite/route.js         # POST — invite user as admin by email
    │       ├── workshops/[id]/analytics/route.js      # GET — per-workshop leaderboard (no cache)
    │       ├── assignments/route.js                   # GET (role-filtered) · POST (create)
    │       ├── assignments/[id]/route.js              # GET · PUT · DELETE (soft)
    │       ├── submissions/route.js                   # GET (role-filtered) · POST (versioned create)
    │       ├── admin/submissions/[id]/route.js        # GET — admin submission detail
    │       ├── admin/submissions/[id]/ai-suggest/     # POST — single AI evaluation (synchronous)
    │       ├── admin/submissions/[id]/grade/          # PUT — grade submission + email trigger
    │       ├── admin/submissions/batch/route.js       # GET (poll batchId) · POST (AI_DRAFT_ALL | PUBLISH_ALL)
    │       ├── admin/users/route.js                   # GET — user directory (role-scoped)
    │       ├── admin/users/role/route.js              # POST — update user global role
    │       ├── analytics/route.js                     # GET — unified analytics (Redis 30s TTL)
    │       ├── owner/analytics/route.js               # GET — platform-wide stats (OWNER only)
    │       ├── certificates/route.js                  # GET — fetch certificate
    │       ├── certificates/issue/route.js            # POST — issue certificate (idempotent)
    │       ├── certificates/template/route.js         # GET · POST — template config
    │       ├── forum/topics/route.js                  # GET · POST — forum topics
    │       ├── forum/topics/[id]/route.js             # GET — topic with all posts
    │       ├── forum/posts/route.js                   # POST — create post (auto-moderated)
    │       ├── forum/posts/[id]/route.js              # PUT (moderate) · DELETE
    │       ├── student/workshops/[id]/gradebook/      # GET — student's per-workshop gradebook
    │       └── upload/route.js                        # POST — Cloudinary signed upload params
    │
    └── components/
        ├── admin/
        │   ├── AssignmentForm.js        # Create/edit form — workshop dropdown, rubric, toggles, file upload
        │   ├── GradingModal.js          # Full HITL grading UI — AI draft, override, publish (24 KB)
        │   └── WorkshopForm.js          # Create workshop — code, validUntil, BYOK config
        ├── student/
        │   ├── JoinWorkshopModal.js     # Inline join-by-code modal (auto-uppercase input)
        │   └── SubmissionModal.js       # Assignment submission form — GitHub URL, files, artifacts
        ├── shared/
        │   ├── AnalyticsCards.js        # Dual-mode analytics cards (admin 4-stat / student 3-stat)
        │   ├── CertificateDownloadCard.js # Certificate preview + download/view buttons
        │   ├── FileUpload.js            # Drag-and-drop Cloudinary uploader (MIME allowlist, 10MB)
        │   ├── ForumThread.js           # Full thread view — posts, moderation badges, admin controls
        │   ├── Sidebar.js               # Role-conditional navigation (STUDENT / ADMIN / OWNER links)
        │   ├── ThemeToggle.js           # Dark/light mode toggle (next-themes, hydration-safe)
        │   └── WorkshopCloseoutBanner.js # Read-only warning for concluded workshops
        ├── dashboard/
        │   ├── AssignmentList.js        # Compact assignment list component
        │   └── CreateAssignmentForm.js  # Quick-create assignment form
        ├── providers/
        │   └── Providers.js             # Client root: SessionProvider + ThemeProvider
        └── ui/                          # shadcn/Radix primitives
            ├── button.jsx               # Button with CVA variants (default, destructive, outline, …)
            ├── input.jsx, label.jsx     # Form primitives
            ├── badge.jsx                # Status badges
            ├── card.jsx                 # Card + sub-components
            └── ConfirmDeleteModal.js    # Reusable destructive-action confirmation dialog
```

---

## API Routes Overview

### Authentication
| Method | Route | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET/POST` | `/api/auth/[...nextauth]` | — | NextAuth v5 catch-all (OAuth flow, session, sign-out) |
| `POST` | `/api/auth/register` | None | Create user. Validates with `registerSchema`. bcrypt hash (10 rounds). 409 on duplicate email. |

### Workshops
| Method | Route | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/workshops` | Session | Role-filtered workshop list (OWNER sees all, others see enrolled only) |
| `POST` | `/api/workshops` | ADMIN · OWNER | Create workshop. Generates unique 6-char code. Encrypts BYOK key. Auto-enrolls creator as ADMIN. |
| `GET` | `/api/workshops/:id` | Member | Full detail: members, assignments, current user role |
| `PUT` | `/api/workshops/:id` | ADMIN · OWNER | Update metadata. Masked key (`"••••"`) skips re-encryption. |
| `DELETE` | `/api/workshops/:id` | ADMIN · OWNER or creator | Hard delete (cascades to all related records) |
| `POST` | `/api/workshops/join` | Session | Join by 6-char code. Returns `{ workshop, alreadyJoined, role }`. Rejects non-ACTIVE/expired workshops. |
| `POST` | `/api/workshops/:id/invite` | ADMIN · OWNER | Invite user as ADMIN by email. Upgrades STUDENT → ADMIN if already enrolled. |
| `GET` | `/api/workshops/:id/analytics` | ADMIN · OWNER | Per-workshop leaderboard, student stats, class averages, inactive count (not cached) |

### Assignments
| Method | Route | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/assignments` | Optional session | STUDENT: published only; ADMIN: draft + published in their workshops; OWNER: everything |
| `POST` | `/api/assignments` | ADMIN · OWNER | Create with rubric JSON, attachments, toggles. Returns 201. |
| `GET` | `/api/assignments/:id` | Optional session | Workshop-gated. Attaches `userSubmissions` for non-admin callers. |
| `PUT` | `/api/assignments/:id` | ADMIN · OWNER | Full update |
| `DELETE` | `/api/assignments/:id` | ADMIN · OWNER | Soft-delete (`deletedAt = now()`) — invisible to all reads via `$extends` |

### Submissions
| Method | Route | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/submissions` | Session | With `?assignmentId`: admins see all, students see own. Without: student's full history. |
| `POST` | `/api/submissions` | Session + enrolled | Create versioned submission. Zod validates `repoUrl` as GitHub-only SSRF-safe URL. Requires ≥1 artifact. Auto-increments `version`. |

### AI Grading & Batch Evaluation
| Method | Route | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/submissions/:id/ai-suggest` | ADMIN · OWNER | **Synchronous** single-submission AI evaluation. Returns updated submission with AI scores and feedback. |
| `POST` | `/api/admin/submissions/batch` | ADMIN · OWNER | **`AI_DRAFT_ALL`**: enqueues batch job → returns 202 with `batchId`. **`PUBLISH_ALL`**: bulk-publishes all GRADED submissions. |
| `GET` | `/api/admin/submissions/batch?batchId=` | Session | Poll in-memory batch job: `{ pending, processing, completed, failed, total, status }` |
| `PUT` | `/api/admin/submissions/:id/grade` | ADMIN · OWNER | Manual grade. Triggers grade email to student if `isGradePublished: true`. |

### Admin Utilities
| Method | Route | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/users` | ADMIN · OWNER | User directory. OWNER sees all; ADMIN sees self + enrolled students. |
| `POST` | `/api/admin/users/role` | ADMIN · OWNER | Update user's global role. Only OWNER can assign/demote OWNER. Cannot demote another OWNER. |

### Forum
| Method | Route | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/forum/topics?workshopId=` | Member | Topics with post counts, ordered by `createdAt desc` |
| `POST` | `/api/forum/topics` | Member | Create topic (workshop or assignment-scoped) |
| `GET` | `/api/forum/topics/:id` | Member | Topic + all posts (asc order) with user details |
| `POST` | `/api/forum/posts` | Member | Submit post. Runs 2-stage moderation before saving. |
| `PUT` | `/api/forum/posts/:id` | ADMIN · OWNER | Set `moderationStatus` (APPROVED / FLAGGED / PENDING) |
| `DELETE` | `/api/forum/posts/:id` | ADMIN · OWNER | Hard delete post |

### Certificates
| Method | Route | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET/POST` | `/api/certificates/template` | ADMIN · OWNER (POST) | Get or configure certificate template (templateUrl, nameX, nameY, fontSize) |
| `POST` | `/api/certificates/issue` | ADMIN · OWNER | Issue certificate to a user. Idempotent — returns existing if already issued. |
| `GET` | `/api/certificates?workshopId=` | Session + member | Fetch certificate for self (or `?userId=` for admin) |

### Analytics & Upload
| Method | Route | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics` | Session | Unified analytics — routes to OWNER / ADMIN / STUDENT service path. Redis TTL 30s. |
| `GET` | `/api/owner/analytics` | OWNER | Platform-wide super-admin metrics. DB role re-verified (not JWT-only). |
| `GET` | `/api/student/workshops/:id/gradebook` | Session + enrolled | Per-workshop gradebook: scores (only where `isGradePublished: true`), progress %, certificate status |
| `POST` | `/api/upload` | Session | Cloudinary upload. Enforces MIME allowlist (PDF, DOC, DOCX, ZIP, PNG, JPG, WEBP, TXT). Max 10 MB. Returns `{ url, publicId, name, size }`. |

---

## Roles & Permissions

Roles are **workshop-scoped** via `UserRole`. The `OWNER` role provides cross-tenant super-admin access, enforced at the `rbac.js` layer. API route handlers call `authorizeWorkshopAccess()` independently — JWT role claims alone do not grant access.

| Permission | STUDENT | ADMIN | OWNER |
| :--- | :---: | :---: | :---: |
| View platform-wide analytics (`/admin/owner`) | ❌ | ❌ | ✅ |
| Create / delete workshops | ❌ | ✅ | ✅ |
| Configure BYOK AI key & provider per workshop | ❌ | ✅ | ✅ |
| Create, edit, delete assignments | ❌ | ✅ | ✅ |
| Run single AI evaluation (synchronous) | ❌ | ✅ | ✅ |
| Run batch AI evaluation (`AI_DRAFT_ALL`) | ❌ | ✅ | ✅ |
| Bulk-publish grades (`PUBLISH_ALL`) | ❌ | ✅ | ✅ |
| Override AI suggestions and grade manually | ❌ | ✅ | ✅ |
| Invite co-instructors by email | ❌ | ✅ | ✅ |
| Configure certificate template | ❌ | ✅ | ✅ |
| Issue certificates to students | ❌ | ✅ | ✅ |
| Moderate / delete forum posts | ❌ | ✅ | ✅ |
| Update any user's global role | ❌ | ✅ (limited) | ✅ (full) |
| View per-workshop analytics (non-aggregate) | ❌ | ✅ | ✅ |
| Submit assignments (versioned) | ✅ | ❌ | ❌ |
| View own published grades & feedback | ✅ | ❌ | ❌ |
| Download own certificate | ✅ | ❌ | ❌ |
| Join workshop via 6-char access code | ✅ | ✅ | ✅ |
| Post in discussion forums | ✅ | ✅ | ✅ |

---

## Testing

Tests use the **Node.js built-in `node:test` runner** and import real service/utility modules directly — no mocking framework, no test database.

```bash
npm test   # node --test test/*.test.js
```

### `test/architectureHardening.test.js`
1. **Prisma soft-delete extension**: Asserts the `$extends` model override is present on `db.assignment` and `db.submission`.
2. **Environment secret enforcement**: Verifies `encryption.js` throws `CRITICAL CONFIGURATION ERROR` in `production`/`staging` when `ENCRYPTION_SECRET` and `AUTH_SECRET` are absent; falls back to the hardcoded dev secret in `development`.
3. **Batch queue lifecycle**: Creates a 2-submission batch job, verifies immediate return with `status: "PROCESSING"`, waits 50ms for async worker to finish, asserts `status: "COMPLETED"` and `processed: 2`.
4. **Soft-delete partial unique index simulation**: Verifies the DB-level constraint logic — a soft-deleted `version: 1` can be re-used, but a live `version: 1` blocks a duplicate insert.

### `test/precisionAndSecurity.test.js`
1. **AES-256-GCM round-trip**: `encrypt(key)` produces a 3-part colon-separated ciphertext; `decrypt(ciphertext)` restores original; legacy plaintext (no `:`) is returned as-is (migration safety).
2. **Workshop key sanitization**: `sanitizeWorkshop()` replaces `aiApiKey` with `"••••••••"` and adds `hasAiApiKey: true` — the raw key is never present in the return value.
3. **Integer score precision**: Documents JS float drift (`0.1 * 10 ≠ 1.0`) and proves `parseScoreToBasisPoints()` avoids it — `(86 + 92) / 2` yields exactly `89` as an integer.

### `test/ssrf.test.js`
1. **IP literal detection**: 10 inputs (cloud metadata `169.254.169.254`, loopback, private ranges, IPv6, hex/octal/decimal IP formats) all return `true` from `isIpOrInternalHost()`.
2. **GitHub URL rejection**: 10 malicious inputs (internal IPs, non-HTTPS, subdomain spoofing like `github.com.attacker.com`) each throw when passed to `validateAndExtractGithubRepo()`.
3. **Valid GitHub URL extraction**: 4 valid inputs correctly extract `{ owner, repo }`, including `.git` suffix stripping and auto-HTTPS scheme prefixing.
4. **Zod schema SSRF guard**: A submission body with `repoUrl: "169.254.169.254"` fails `createSubmissionSchema.safeParse()` with `"IP addresses and non-GitHub hosts are forbidden"`.

---

## Known Limitations / Roadmap

### Current Limitations

- **Batch queue is in-memory**: `batchGradingQueue.js` uses a Node.js `Map`. Restarting the server clears all in-flight job state and `batchId` references. Redis is only used for status TTL — not for job persistence or worker distribution.
- **Certificate rendering**: Certificates are generated by appending `?participantName=...` to the Cloudinary template URL. This is URL-parameter based, not server-side canvas compositing. Presentation depends on the template image design.
- **`ws` (WebSockets) installed but unused**: The `ws` package is a declared dependency but no WebSocket server is currently wired up in the codebase.
- **Email coverage**: Grade publish and new assignment emails are wired. Not all events (certificate issuance, forum replies, workshop enrollment) send emails yet.
- **SCORM / LTI**: No support for importing SCORM packages or LTI 1.3 tool interoperability.

### Roadmap

- [ ] **Persistent batch queue** — Replace `Map`-based in-process queue with BullMQ + Redis for distributed, crash-safe AI evaluation jobs
- [ ] **Real-time WebSocket notifications** — Leverage the installed `ws` package for live grade-published alerts and forum reply notifications
- [ ] **AI plagiarism / similarity detection** — Cross-submission vector similarity scoring using embeddings
- [ ] **Server-side certificate compositing** — Node.js `canvas` or Sharp for pixel-accurate name overlay instead of URL-param delegation
- [ ] **LTI 1.3 integration** — Canvas / Blackboard / Moodle interoperability
- [ ] **Sandboxed code execution** — Evaluate submitted code in an isolated container for automated test-case scoring
- [ ] **SCORM export** — Package workshop modules as SCORM 1.2/2004 bundles

---

## Contributing

Contributions are welcome. Please follow this workflow:

1. **Fork** the repository and create a descriptive feature branch:
   ```bash
   git checkout -b feat/persistent-batch-queue
   ```
2. **Commit with semantic prefixes**:
   - `feat:` new feature · `fix:` bug fix · `refactor:` internal restructure · `test:` test coverage · `docs:` documentation
3. **Run the test suite before opening a PR**:
   ```bash
   npm test
   ```
4. **Open a Pull Request** targeting `main`. Describe what changed, why, and any migration steps if schema or env vars changed.

> The `.gitignore` already excludes `.env`, `.env.local`, and `.next/`. Never commit secrets.

---

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for full terms.