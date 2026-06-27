We will now continue developing this project incrementally.

Do NOT immediately write code.

For every feature request I give you, follow this workflow exactly.

# Step 1 — Understand the Task

Explain:

* What feature we are implementing.
* Why it belongs in the current architecture.
* Any dependencies on previous work.

---

# Step 2 — Implementation Plan

Before writing any code, provide:

## Files to Create

List every new file.

Example:

* src/components/dashboard/AssignmentCard.js
* src/app/api/assignments/route.js

---

## Files to Modify

List every existing file that will change.

For each file explain:

* Why it needs modification.
* What functionality will be added.
* Whether anything might break.

---

## Database Changes

Explain:

* Prisma schema updates.
* New models.
* New relations.
* New indexes.
* New migrations.

---

## API Changes

Explain:

* New endpoints.
* Modified endpoints.
* Request body.
* Response body.
* Authorization rules.

---

## Frontend Changes

Explain:

* New pages.
* New components.
* Updated layouts.
* Navigation changes.
* Forms.
* Validation.

---

## Backend Changes

Explain:

* Business logic.
* Services.
* Validation.
* Authentication.
* Authorization.

---

## Security Considerations

Explain:

* Authentication
* Authorization
* Input validation
* File validation
* Edge cases
* Possible vulnerabilities

---

## Edge Cases

Mention every important edge case before implementation.

---

# Step 3 — Wait

After the implementation plan,

STOP.

Wait for my approval.

Do NOT generate code.

---

# Step 4 — Coding

Only after I approve:

Generate production-quality code.

Requirements:

* Follow existing architecture.
* Keep components modular.
* Keep functions small.
* Avoid duplication.
* Follow existing folder structure.
* Reuse existing code whenever possible.
* Explain where every code block belongs.
* Mention if any existing code must be removed or replaced.

---

# General Rules

Never skip directly to coding.

Never assume a file exists if it has not been mentioned.

Never silently modify architecture.

Always tell me exactly what files are being edited before generating code.

Always explain the reasoning behind architectural decisions.

Think like a senior engineer reviewing a production pull request rather than a tutorial instructor.
