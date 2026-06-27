You are joining an existing project. Everything below is the CURRENT STATE of the repository. Treat this as the source of truth.

# Project

A full-stack Learning Management System (LMS) built with Next.js App Router.

Current stack:

* Next.js (App Router)
* React
* JavaScript
* Tailwind CSS
* shadcn/ui
* Prisma ORM
* PostgreSQL
* NextAuth

The project follows a modular architecture and should remain scalable and production-ready.

---

# Current Folder Structure

```text
prisma/
└── schema.prisma

src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   │
│   ├── (dashboard)/
│   │   ├── admin/
│   │   │   ├── tutorials/
│   │   │   └── users/
│   │   │
│   │   ├── student/
│   │   │   ├── assignments/
│   │   │   └── tutorials/
│   │   │
│   │   ├── layout.js
│   │   └── Sidebar.js
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   └── tutorials/
│   │
│   ├── globals.css
│   ├── layout.js
│   └── page.js
│
├── components/
│   ├── dashboard/
│   └── ui/
│
├── lib/
│   ├── auth.js
│   ├── db.js
│   └── utils.js
│
└── middleware.js
```

---

# What Already Exists

## Database

* Prisma is installed.
* PostgreSQL is connected.
* Prisma schema exists.
* Global Prisma singleton exists in `lib/db.js`.

---

## Authentication Foundation

Already implemented:

* NextAuth installed
* Authentication configuration
* Catch-all auth route
* Login page
* Register page
* Middleware

Authentication is only scaffolded.

Business logic is still incomplete.

---

## UI

Completed:

* Tailwind configured
* shadcn installed
* Reusable UI components available

---

## Dashboard

Existing architecture:

Student Dashboard

Admin Dashboard

Shared Dashboard Layout

Shared Sidebar

Current pages use placeholder data only.

---

## Backend

Next.js Route Handlers are already configured.

Tutorial routes already exist.

Project follows App Router conventions.

---

# Folder Responsibilities

app/

Pages, layouts and route handlers.

components/ui/

Reusable UI components only.

components/dashboard/

Business-specific reusable components.

lib/

Shared utilities.

Prisma client.

Authentication configuration.

Utility helpers.

middleware.js

Authentication.

Route protection.

RBAC.

---

# Important Rules

Do NOT redesign the architecture.

Do NOT move folders.

Do NOT rename files.

Do NOT introduce a different architecture.

Reuse existing components whenever possible.

Keep business logic modular.

Keep route handlers thin.

Assume this project will continue growing.

Always build on top of the current codebase instead of replacing it.

This concludes the current project state.
