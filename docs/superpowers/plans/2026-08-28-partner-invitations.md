# Partner Invitations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an administrator email a secure, one-time partner-registration invitation through Resend.

**Architecture:** An admin-only endpoint persists a random invitation token linked to the recipient and selected partner group, then sends the `/register?invite=<token>` URL through the existing Resend email service. Registration validates and consumes the token transactionally before creating the affiliate in that partner group. The existing dialog calls the endpoint and displays delivery results.

**Tech Stack:** Next.js route handlers, Prisma/PostgreSQL, Resend, React, Node test runner.

**Spec:** In-chat design approved by the user on 2026-08-28.

## Global Constraints

- Invitation tokens are random, one-time, and expire after 7 days.
- Only an authenticated `ADMIN` may create invitations.
- Only `AFFILIATE` accounts are created by accepted invitations.
- Do not send mail if the address already belongs to a user or has an unexpired invitation.
- Send mail through `RESEND_API_KEY` and `RESEND_FROM_EMAIL` only.

---

### Task 1: Persist invitation state

**Files:**
- Modify: `prisma/schema.prisma`
- Test: `tests/partner-invitation-flow.test.mjs`

- [ ] Write a failing schema assertion for a token, email, partner group, expiry, and acceptance timestamp.
- [ ] Add `PartnerInvitation` with a unique token and its optional partner-group relation.
- [ ] Run the assertion and Prisma schema validation.

### Task 2: Create and deliver invitations

**Files:**
- Modify: `src/lib/email.ts`
- Create: `src/app/api/admin/partner-invitations/route.ts`
- Test: `tests/partner-invitation-flow.test.mjs`

- [ ] Write failing assertions that require admin authorization, email/group validation, secure token persistence, and `sendPartnerInvitationEmail`.
- [ ] Add the email template and protected route with duplicate checks, a 7-day expiry, and a JSON result.
- [ ] Run the test and route type check.

### Task 3: Consume invitation during registration

**Files:**
- Modify: `src/app/api/auth/register/route.ts`, `src/lib/auth.ts`, `src/app/register/page.tsx`
- Test: `tests/partner-invitation-flow.test.mjs`

- [ ] Write failing assertions that registration passes the invite token and consumes it only after account creation.
- [ ] Validate the token server-side, require its email to match, attach its partner group to the new affiliate, and mark it accepted in one transaction.
- [ ] Prefill and lock the invited email in the registration form.
- [ ] Run the test and route type check.

### Task 4: Connect the admin dialog

**Files:**
- Modify: `src/app/admin/partners/page.tsx`
- Test: `tests/partner-invitation-flow.test.mjs`

- [ ] Write a failing assertion that the dialog sends a POST to the invitation endpoint instead of showing the placeholder alert.
- [ ] Add request loading, success/error feedback, close/reset on success, and partner-list refresh.
- [ ] Run the test.

### Task 5: Deep verification and delivery

**Files:**
- Test: `tests/partner-invitation-flow.test.mjs`

- [ ] Verify blank/malformed email, unknown group, duplicate user, duplicate active invitation, expired token, used token, email mismatch, missing Resend configuration, and unauthenticated callers.
- [ ] Run `node --test tests/*.test.mjs`, `npx prisma validate`, `npm run build`, and `git diff --check`.
- [ ] Commit and push the verified change.
