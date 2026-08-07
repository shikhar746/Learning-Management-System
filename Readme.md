# 🎓 AI-Assisted Learning Management System (LMS)

A full-stack Learning Management System (LMS) built with **Next.js App Router**, **React 19**, **Prisma ORM**, **PostgreSQL**, **NextAuth v5**, and **Tailwind CSS**. Designed for assignment management, multi-role access control, Cloudinary file uploads, student submissions with version tracking, admin grading, and course analytics.

---

## 🚀 Tech Stack

* **Framework:** Next.js 16 (App Router with Turbopack) & React 19
* **Styling & UI:** Tailwind CSS v4, shadcn/ui, Lucide React Icons
* **Database & ORM:** PostgreSQL (Neon DB) & Prisma ORM
* **Authentication:** NextAuth v5 (Auth.js) with Google OAuth, Credentials Provider (bcryptjs), & JWT session strategy
* **File Storage:** Cloudinary SDK & REST API integration for assignment materials and student attachments
* **Validation & Security:** Role-Based Access Control (RBAC) middleware, Zod schema validation, bcrypt password hashing

---

## ✨ Features & Module Overview

1. **Auth & Signup Module**:
   - Email & password registration (`/api/auth/register`) with `bcryptjs` password hashing.
   - Google OAuth alongside Credentials authentication via NextAuth v5.
   - Secure JWT session persistence and role propagation (`STUDENT`, `ADMIN`, `OWNER`).

2. **Assignment Management (Admin)**:
   - Complete Prisma `Assignment` model support (title, instructions, maxMarks, due dates, attachment URLs, published state, allowResubmission).
   - Full CRUD API handlers and admin UI forms (`/admin/assignments`, `/admin/assignments/new`, `/admin/assignments/[id]/edit`).

3. **File Upload Infrastructure**:
   - Cloudinary integration (`/api/upload`) supporting PDF, DOC, DOCX, ZIP, PNG, JPG, and WEBP files.
   - Reusable `FileUpload.js` drag-and-drop UI component with MIME validation and a 10MB size limit.

4. **Student Submission Workflow**:
   - Multi-format submissions: GitHub repository links, live deployment URLs, and Cloudinary file attachments.
   - Resubmission version tracking (`v1`, `v2`, `v3`, etc.) preserving full submission history without overwriting past work.

5. **Grading & Assessment Engine**:
   - Admin evaluation panel (`/admin/assignments/[id]/submissions`) to inspect student work, assign marks, and write feedback.
   - Score visibility toggles (`isGradePublished`) for releasing grades to students.
   - Schema extension hooks for automated code quality and AI detection scores (`qualityScore`, `aiDetectionScore`, `functionalityScore`).

6. **Analytics & Dashboards**:
   - Course metrics API (`/api/analytics`) computing student counts, assignment totals, pending evaluation queues, submission percentages, and class averages per assignment.
   - Admin and Student dashboard overview pages (`/admin` and `/student`) rendering summary stat cards and deadline trackers.

---

## 📁 Repository Structure

```text
Learning Management System/
├── Readme.md                 # Root project documentation
├── currentwork.md            # Active milestone status & roadmap
├── prompt1.md                # Architecture & foundation spec
├── prompt2.md                # Functional milestone requirements
├── prompt3.md                # Step-by-step implementation workflow
└── lms/                      # Core Next.js Application
    ├── prisma/
    │   └── schema.prisma     # Prisma models (User, Assignment, Submission, Progress, etc.)
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/
    │   │   │   ├── login/    # Login page (Credentials + Google OAuth)
    │   │   │   └── register/ # User registration page
    │   │   ├── (dashboard)/
    │   │   │   ├── admin/    # Admin analytics, assignments CRUD, submissions & grading
    │   │   │   └── student/  # Student dashboard, assignment list, and submission modal
    │   │   ├── api/
    │   │   │   ├── admin/submissions/[id]/grade/ # Grading endpoint
    │   │   │   ├── analytics/# Dashboard metrics aggregation
    │   │   │   ├── assignments/ # Assignment CRUD API
    │   │   │   ├── auth/     # NextAuth route handler & user registration
    │   │   │   ├── submissions/ # Submission & resubmission API
    │   │   │   └── upload/   # Cloudinary upload handler
    │   │   ├── globals.css   # Global styles & Tailwind CSS configuration
    │   │   └── layout.js     # Root layout & NextAuth session provider
    │   ├── components/
    │   │   ├── dashboard/    # AnalyticsCards, AssignmentForm, SubmissionModal, GradingModal
    │   │   └── ui/           # FileUpload, Button, Input, Card, Badge, Label
    │   ├── lib/
    │   │   └── db.js         # Global Prisma Client singleton
    │   └── middleware.js     # RBAC & route protection middleware
    ├── auth.js               # NextAuth v5 configuration
    └── package.json          # App dependencies & scripts
```

---

## 🛠️ Setup & Installation

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **PostgreSQL**: Local or cloud database instance (e.g., Neon DB)
- **Cloudinary Account**: Cloud name, API Key, and API Secret

### 2. Environment Configuration
Create a `.env.local` file in the `lms/` directory:

```env
DATABASE_URL="postgresql://user:password@host:5432/lms_db?sslmode=require"
AUTH_SECRET="your-nextauth-secret-key"
AUTH_URL="http://localhost:3000"

# Google OAuth Credentials
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Cloudinary Credentials
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="dxeuly7xo"
CLOUDINARY_API_KEY="876595632698537"
CLOUDINARY_API_SECRET="7NQndmOVJgl4rwW5LQnX1q-t4pY"
CLOUDINARY_URL="cloudinary://876595632698537:7NQndmOVJgl4rwW5LQnX1q-t4pY@dxeuly7xo"
```

### 3. Database Migration & Client Generation
```bash
cd lms
npx prisma generate
npx prisma db push
```

### 4. Run Application
```bash
npm run dev
```
Access the application at [http://localhost:3000](http://localhost:3000).

---

## 📡 API Endpoints Reference

| Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user with hashed password & role |
| `POST` | `/api/auth/[...nextauth]` | Public | NextAuth authentication handler (Credentials & Google) |
| `POST` | `/api/upload` | Authenticated | Upload file to Cloudinary (PDF, DOCX, ZIP, PNG - max 10MB) |
| `GET` | `/api/assignments` | Authenticated | List assignments (Published for students, all for admins) |
| `POST` | `/api/assignments` | Admin/Owner | Create new assignment |
| `GET` | `/api/assignments/[id]` | Authenticated | Fetch assignment detail and user submission history |
| `PUT` | `/api/assignments/[id]` | Admin/Owner | Update assignment parameters |
| `DELETE` | `/api/assignments/[id]` | Admin/Owner | Soft-delete assignment |
| `GET` | `/api/submissions` | Authenticated | List student submissions |
| `POST` | `/api/submissions` | Student | Submit assignment (repo link, live URL, file) with versioning |
| `GET` | `/api/admin/submissions/[id]` | Admin/Owner | Fetch single submission detail for evaluation |
| `PUT` | `/api/admin/submissions/[id]/grade` | Admin/Owner | Assign scores, feedback, & toggle grade publication |
| `GET` | `/api/analytics` | Authenticated | Retrieve admin or student dashboard aggregate metrics |

---

## 📜 Available Scripts

- `npm run dev` — Starts Next.js development server.
- `npm run build` — Generates Prisma Client and builds Next.js production bundle.
- `npm run start` — Starts Next.js production server.
- `npx prisma studio` — Launches interactive database GUI at `http://localhost:5555`.

---

## 📄 License
Licensed under the [MIT License](LICENSE).