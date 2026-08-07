# 🎓 LMS Web Application

This is the Next.js 16 core web application for the **AI-Assisted Learning Management System (LMS)**.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env.local` in `lms/`:
```env
DATABASE_URL="postgresql://neondb_owner:npg_VgXx6uKwLE2c@ep-withered-silence-apm7a6lr-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
AUTH_SECRET="uI3S/dmhfeO1aHReCFWCAb0t99BycRTRl13+cVcx65I="
AUTH_URL="http://localhost:3000"

AUTH_GOOGLE_ID="539179044033-3gcrafaoeri03s30t4o4fdht9gs5gpjk.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="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"

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="dxeuly7xo"
CLOUDINARY_API_KEY="876595632698537"
CLOUDINARY_API_SECRET="7NQndmOVJgl4rwW5LQnX1q-t4pY"
CLOUDINARY_URL="cloudinary://876595632698537:7NQndmOVJgl4rwW5LQnX1q-t4pY@dxeuly7xo"
```

### 3. Generate Prisma Client & Run Migrations
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📡 API Endpoints Reference

| Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user with hashed password |
| `POST` | `/api/upload` | Authenticated | Upload file to Cloudinary (PDF, DOCX, ZIP, PNG - max 10MB) |
| `GET` / `POST` | `/api/assignments` | Admin / Student | Fetch assignments list or create new assignment |
| `GET` / `PUT` / `DELETE` | `/api/assignments/[id]` | Admin / Student | Fetch detail, update parameters, or delete assignment |
| `GET` / `POST` | `/api/submissions` | Student / Admin | Create assignment submission (versioned) or list submissions |
| `GET` | `/api/admin/submissions/[id]` | Admin/Owner | View submission details for evaluation |
| `PUT` | `/api/admin/submissions/[id]/grade` | Admin/Owner | Evaluate submission, assign marks/feedback, & publish score |
| `GET` | `/api/analytics` | Authenticated | Aggregated metrics for Admin & Student dashboards |

For full project specs and architecture details, see the root [`Readme.md`](file:///c:/Users/vansh/OneDrive/Desktop/vsCode/Learning%20Management%20System/Readme.md).
