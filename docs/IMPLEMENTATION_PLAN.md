# BW Tools Dashboard — Implementation Plan

Created 2026-10-22 from [GAP_ANALYSIS.md](GAP_ANALYSIS.md). Follow the workflow in [CLAUDE.md](../CLAUDE.md#workflow-plan-first-one-task-at-a-time).

## How to use this file

- Tasks run in file order. **The next task is the first unchecked `- [ ]` box.** Respect each task's **Depends on** line.
- Implement one task at a time: plan it, implement it, verify it, tick the box, then report.
- Add any new feature or fix to the right phase as a new task block (template at the end) **before** implementing it.
- **Needs owner** marks tasks that require someone with Supabase project access (dashboard, SQL editor or CLI). Write the SQL into `supabase/migrations/`, then ask the user to apply it. Never run it against production yourself.
- Suggested prompt: `Implement the next task in docs/IMPLEMENTATION_PLAN.md`.

---

## Phase 0 — Baseline

### P0-01 · Sync and baseline build
- [x] Done

**Why:** As of 2026-10-22, local `master` is 2 commits behind `origin/master`. A clean baseline is needed before making changes.
**Steps:**
1. `git pull` on `master`.
2. `npm install`, then `npm run build` and `npx tsc --noEmit`. Record any existing errors in this task as notes; don't fix them here.

**Done when:** The build result is known and written down.

**Notes (2026-10-22):**
- `master` and `dashboard/general-improvement` were fast-forwarded to `5f6447d`, a README-only change.
- `tsc --noEmit` passes with 0 errors. `npm run build` passes and builds 16 routes.
- Build warning: the `middleware` file convention is deprecated in favour of `proxy` (covered by P4-06).
- The build output prints `Raw category data from DB` from `categories/page.tsx` (covered by P4-06). The log shows `categories.cat_image_url` exists, which confirms P4-01.
- `npm audit` reports 11 vulnerabilities (1 critical in `next@16.1.1`, 9 high, 1 moderate). Added as P1-09.

---

## Phase 1 — Lock down access (critical: the hole is live on production)

### P1-01 · Protect the service-role client
- [x] Done

**Why:** Gap analysis, Security: no `server-only` guard.
**Files:** `lib/supabaseAdmin.ts`, `package.json`
**Steps:**
1. `npm i server-only`.
2. Add `import "server-only";` as the first line of `lib/supabaseAdmin.ts`.

**Done when:** The build passes, and importing `supabaseAdmin` from a `"use client"` file fails the build (try it, then revert).

**Notes (2026-10-22):** Verified. `tsc` and `build` pass. A temporary client component importing `supabaseAdmin` failed the build with "You're importing a component that needs 'server-only'". When repeating this test, don't put the test page in a `_`-prefixed folder: App Router skips those folders, so the page is never built.

### P1-02 · Shared roles and admin guard
- [x] Done

**Why:** Security: roles and `is_active` are never enforced, and every helper calls `auth.getUser()` again.
**Files:** new `lib/roles.ts`, new `lib/auth.ts`
**Steps:**
1. `lib/roles.ts`: `ROLES = ["super_admin", "admin", "viewer"] as const`, `type Role`, a rank map, and `hasRole(role, minRole)`. Remove the stray `editor` role everywhere.
2. `lib/auth.ts` (starts with `import "server-only"`):
   - `getCurrentAdmin = cache(async () => …)` using React `cache`. It reads the user from the cookie client (`utils/supabase/server.ts`), then the `admins` row through `supabaseAdmin`. It returns `{ id, email, full_name, role, is_active }`, or `null` when there is no user, no row, or the row is inactive.
   - `requireAdmin(minRole = "viewer")`: for server actions. Throws `Error("Not authorized")`.
   - `requireAdminPage(minRole = "viewer")`: for pages and layouts. Redirects to `/login?error=unauthorized`.

**Done when:** `tsc` passes. `hasRole` is a pure function (it gets tests in P2-02).

**Notes (2026-10-22):** Verified with `tsc`, `build`, and 12 ad-hoc `hasRole`/`isRole` assertions run through Node's built-in TypeScript support. `getCurrentAdmin()` treats `is_active = null` as active and an unknown or null `role` as `viewer`, because older rows may have been created by hand in SQL. Nothing calls these helpers yet; P1-03 to P1-05 wire them in.

### P1-03 · Only active admins can sign in
- [ ] Done

**Depends on:** P1-02
**Why:** Security: any Supabase user, including mobile-app customers, can log in.
**Files:** `app/login/actions.ts`, `app/login/page.tsx`, `app/(dashboard)/layout.tsx`, `app/invoice/[id]/page.tsx`
**Steps:**
1. In `login`, after `signInWithPassword` succeeds, load the `admins` row. If it is missing or inactive, call `signOut()` and return `{ error: "This account does not have dashboard access." }`.
2. Remove the `console.log` calls that print the email address or environment presence.
3. In `(dashboard)/layout.tsx`, call `requireAdminPage()` and use its result instead of `getAdminProfile()`.
4. In `app/invoice/[id]/page.tsx`, which sits outside the dashboard layout, call `requireAdminPage()`.
5. Make the login page show a message for `?error=unauthorized`.
6. Also check for an active admin in the middleware (`utils/supabase/middleware.ts`). Layouts don't re-run on client-side navigation, and server actions skip layouts entirely; the middleware runs on every request.

**Done when:** A non-admin user cannot open any dashboard page or invoice, an inactive admin sees the error, and an active admin logs in normally.

**Notes (2026-10-22):** Implemented. The admin-row lookup is shared as `findActiveAdmin()` in `lib/auth.ts` and used by login, middleware and `getCurrentAdmin()`. Checked so far: `tsc` and `build` pass. Against a local `next start` with no session, `/`, `/order`, `/product` and `/invoice/1` redirect to `/login`, and `/login?error=unauthorized` shows the message. **Still to check by hand (needs real accounts):** an admin can log in, and a non-admin account is rejected. Tick the box once confirmed.

**Before deploying (needs owner):** run `select id, email, role, is_active from admins;` in Supabase. Every person who should keep access needs a row with `is_active` not false. Without one, this task locks them out.

### P1-04 · Stop self-promotion through the profile form
- [x] Done

**Depends on:** P1-02
**Why:** Security, critical: any user can set their own role to `super_admin`.
**Files:** `app/(dashboard)/profile/update-actions.ts`, `components/profile-edit-dialog.tsx`, `app/(dashboard)/profile/actions.ts`, `app/(dashboard)/profile/page.tsx`
**Steps:**
1. Remove the `role` field from the dialog and from the action payload.
2. Replace `upsert` with `update` on the current user's row. The row is guaranteed to exist after P1-03.
3. Delete the fake "viewer" fallback in `getAdminProfile`, or replace the function with `getCurrentAdmin()`.
4. Replace `alert()` with a sonner toast.

**Done when:** Posting a hand-crafted form with `role=super_admin` leaves the role unchanged.

**Notes (2026-10-22):** Verified in code with `tsc` and `build` passing. `updateAdminProfile` reads only `fullName` and `email` from the form, takes the admin id from the session through `getCurrentAdmin()` (the hidden `id` input is gone), and updates only `full_name`. Deleted `app/(dashboard)/profile/actions.ts` (`getAdminProfile` and its fake "viewer" fallback); the profile page now uses `requireAdminPage()`. Removed the `editor` role option and replaced `alert()` with a toast. Manual check once logged in: edit your name on /profile and confirm the toast and the sidebar update.

### P1-05 · Enforce roles in every mutating action
- [x] Done

**Depends on:** P1-02
**Why:** Security: viewers can change everything.
**Files:** every `actions.ts` / `update-actions.ts` under `app/`, and new `lib/orders.ts`
**Permission matrix:**

| Action | Minimum role |
| --- | --- |
| Product, brand and category create / update / delete | `admin` |
| Order status change, order notes | `admin` |
| Customer update | `admin` |
| Team create, change role, deactivate, reactivate | `super_admin` |
| Own profile, own password, own notifications | `viewer` |

**Steps:**
1. Make `await requireAdmin("<role>")` the first statement of each mutating action.
2. In `team/actions.ts`, replace `isSuperAdmin()` checks with `requireAdmin("super_admin")`. Validate `role` against `ROLES`, and block changing your own role.
3. Create `lib/orders.ts` with `ORDER_STATUSES = ["New", "processing", "Delivering", "Delivered", "Cancelled"]`. Reject any other value in `updateOrderStatus`.

**Done when:** Signed in as a viewer, every mutation fails with "Not authorized". An admin can manage the catalogue and orders but not the team.

**Before deploying (needs owner):** make sure every row in `admins` has `role` set to `super_admin`, `admin` or `viewer`, and that at least one active `super_admin` exists. A missing role becomes read-only `viewer` after this task.

**Notes (2026-10-22):**
- **Verified:** `tsc` and `build` pass. An audit script found 24 exported server functions that write data, and all 24 check the role before their first write. The role levels match the matrix.
- **Guard style:** throwing actions use `requireAdmin()`. Actions that return `{ success, message }` (categories, customers, settings) use the new `getAuthorizedAdmin()` and return "Not authorized".
- **Other changes:**
  - Order status is validated against `ORDER_STATUSES` in `lib/orders.ts`. Order history and notes record `admin.id` from the guard.
  - Team actions validate roles with `isRole()`, and a super admin can't change their own role.
  - `getTeamMembers()` now shows a missing role as `viewer`, which is what is enforced; before, it showed `admin`.
  - The unused `createNotification` and `notifyNewOrder` are guarded as `admin`.
- **Known limitation until P3-01, P5-02 and P5-03:** viewers still see the edit buttons. A blocked throwing action shows Next.js's default error screen instead of a toast.

### P1-06 · Make deactivation real
- [x] Done

**Depends on:** P1-05
**Why:** Security: deactivated admins keep access.
**Files:** `app/(dashboard)/team/actions.ts`
**Steps:**
1. In `deactivateAdmin`, also call `supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: "876000h" })`.
2. In `reactivateAdmin`, call `updateUserById(id, { ban_duration: "none" })`.

**Done when:** A deactivated admin is rejected on their next request and cannot sign in again until reactivated.

**Notes (2026-10-22):**
- **Verified:** `tsc` and `build` pass, and the guard audit is still 24/24.
- **Deactivate:** sets `is_active = false` first, then bans the login. If the ban fails, the admin stays blocked by the middleware and the action reports the error.
- **Reactivate:** lifts the ban first, so a failure leaves the account fully deactivated.
- **Side effect:** the ban blocks that auth account everywhere, including the mobile app if the same login is used there.
- **Manual check:** use a throwaway admin. Deactivate them, confirm they're logged out and can't sign in; reactivate them, confirm they can.

### P1-07 · Stop reading data with the anon key
- [ ] Done

**Depends on:** P1-03
**Why:** Security: `profiles_with_email` is read with the public anon key.
**Files:** `app/(dashboard)/customers/page.tsx`, `product/page.tsx`, `brand/page.tsx`, `categories/page.tsx`, legacy add/edit pages, `lib/supabaseClient.ts`
**Steps:**
1. Replace every `lib/supabaseClient` import in server code with `supabaseAdmin`. These pages are already guarded by the layout from P1-03.
2. Delete `lib/supabaseClient.ts` once nothing imports it.
3. **Needs owner:** in the Supabase SQL editor, run `revoke select on public.profiles_with_email from anon;`. Then review row-level security on `profiles`, `orders`, `order_items`, `admins` and `notifications` for the `anon` and `authenticated` roles. Record what you find in GAP_ANALYSIS.md.

**Done when:** No import of `lib/supabaseClient` remains, and a request to the view using the anon key returns nothing or an error.

**Notes (2026-10-22):**
- **Code: done.** The 7 server pages (`product`, `brand`, `categories`, `customers`, and the legacy `addproduct`, `editproduct`, `editcategory`) use `supabaseAdmin`. `lib/supabaseClient.ts` is deleted. `tsc` and `build` pass.
- **Database: pending (needs owner).** Count-only HEAD requests with the anon key show:
  - `profiles_with_email` and `profiles`: all 16 rows readable (a live leak of customer emails and phones).
  - `admins`: HTTP 500.
  - Order tables and `notifications`: 0 rows.
  - Catalogue tables: readable, as expected.
- The SQL to apply, with diagnostics and the `profiles` policy fix (confirm with the mobile app owner first), is in `docs/sql/P1-07-restrict-anon-access.sql`.
- Tick the box once the re-check at the end of that file shows the view is no longer readable.

### P1-08 · Small hardening
- [x] Done

**Depends on:** P1-02
**Why:** Security, low-severity findings.
**Files:** `notifications/actions.ts`, `settings/actions.ts`, `components/SecurityForm.tsx`
**Steps:**
1. In `markNotificationAsRead`, also filter by `admin_id` = the current admin.
2. Raise the password minimum to 8 characters in the Settings action and form, so it matches new-admin creation.

**Done when:** `tsc` passes, and marking someone else's notification as read does nothing.

**Notes (2026-10-22):**
- **Verified:** `tsc` and `build` pass, and the guard audit is 24/24.
- **Notifications:** `markNotificationAsRead` now also filters on `admin_id`, so another admin's notification id matches no row.
- **Passwords:** the minimum is 8 in `settings/actions.ts` and `SecurityForm`. It was already 8 in the `team/new` form.
- **Remaining gaps:** `createAdmin` checks the length only in the form (server-side check comes in P2-04 with zod). The Supabase Auth password minimum (Auth settings, default 6) could also be raised to 8 by the owner.
- The login logs that printed email addresses were already removed in P1-03.

### P1-09 · Patch vulnerable dependencies
- [ ] Done

**Why:** Found during P0-01. `npm audit` reports 11 vulnerabilities: a critical one in `next@16.1.1` (a denial-of-service through React Server Components deserialization, and one through the Image Optimizer), and high ones in the editor stack (`@tiptap/core`, `prosemirror-view` XSS on paste, `markdown-it`, `linkify-it`), `postcss`, `sharp`, `ws`, `nanoid` and `source-map-js`. Every fix is available without a major version bump.
**Files:** `package.json`, `package-lock.json`
**Steps:**
1. Update `next` to the latest 16.x patch release. Update `react` and `react-dom` together, keeping them on the same version.
2. Run `npm audit fix` for the transitive dependencies. Never use `--force`.
3. Run `npx tsc --noEmit` and `npm run build`. Smoke-test login, the product modal with the rich-text editor, and an order page in `npm run dev`.

**Done when:** `npm audit` reports 0 critical and 0 high, and the build and smoke test pass.

**Notes (2026-10-22):**
- **Versions:** `next` 16.1.1 → 16.4.2; `react` and `react-dom` 19.2.3 → 19.3.1; `@tiptap/*` 3.15.3 → 3.32.0, all aligned with `@tiptap/core`, which `audit fix` had raised alone. `npm audit fix` also changed 12 transitive packages. No `--force` and no major bumps.
- **Result:** `npm audit` reports 0 vulnerabilities. `tsc` and `build` pass, and there is one ProseMirror copy of each package.
- **Browser smoke test** (headless Chrome against `next start`): 11/11 checks passed with 0 console errors. Covered: no-session redirects for 7 routes, the login form, the unauthorized message, and the error for wrong credentials.
- **Still to run (needs test credentials):** the logged-in pages and typing in the product editor. Tick the box after that run.

---

## Phase 2 — Safety net

### P2-01 · Lint and typecheck scripts
- [x] Done

**Files:** `eslint.config.mjs`, `package.json`
**Steps:**
1. Install `eslint` and `eslint-config-next`. Create a flat config with the core-web-vitals and TypeScript presets.
2. Add the scripts `"lint": "eslint ."` and `"typecheck": "tsc --noEmit"`.
3. Fix errors. Set `@typescript-eslint/no-explicit-any` to `warn` for now.

**Done when:** `npm run lint` and `npm run typecheck` both exit 0.

**Notes (2026-10-22):**
- **Setup:** `eslint` 9.39.5 and `eslint-config-next` 16.4.2, using the flat config from the bundled Next docs (core-web-vitals and TypeScript presets).
- **Result:** lint exits 0 with 0 errors and 58 warnings, mostly `any` (P2-03) and unused imports. `typecheck` and `build` pass, and the browser smoke test is still 11/11.
- **The 8 errors fixed:**
  - Two unescaped apostrophes.
  - Empty `InputProps` interface turned into a type alias.
  - `CategoryForm`/`CustomerForm`: removed the `mounted` flag set in an effect, since their portals only open after a click.
  - `ProductImageUpload` and `mobile-sidebar-wrapper`: replaced setState-in-effect with React's "adjust state during render" pattern.
  - Deleted the dead `AuthProvider.tsx` and `ProtectedRoute.tsx` (part of P4-02).
- **Audit:** the ESLint toolchain brings in 5 high advisories, all from `braces` ≤ 3.0.3 (GHSA-vfj7-8cjw-p6xm), which has no patched release yet. They are dev-only: `npm audit --omit=dev` reports 0. Re-check when `braces` publishes a fix.

### P2-02 · Unit test runner
- [x] Done

**Files:** `vitest.config.ts`, `package.json`, `lib/**/*.test.ts`
**Steps:**
1. Install `vitest` and `vite-tsconfig-paths` so the `@/` alias works. Add `"test": "vitest run"`.
2. Write the first tests: `hasRole` in `lib/roles.ts`, and the `ORDER_STATUSES` validation.

**Done when:** `npm test` passes. Later tasks add tests for any pure helper they create.

**Notes (2026-10-22):**
- **Setup:** Vitest 5.0.5 with `vitest.config.mts`. The `.mts` extension is needed because the package is CommonJS. It uses Vite's native `resolve.tsconfigPaths` instead of `vite-tsconfig-paths`, which Vite reported as redundant and which I uninstalled.
- **Node types:** Vitest 5 needs `@types/node` ≥ 22, so the project moved from `^20` to `^22`. Runtime Node is 24 locally; check the Vercel project's Node version and keep CI (P2-05) on the same major.
- **Tests:** `lib/roles.test.ts` and `lib/orders.test.ts`, 25 tests, all passing. Deliberately breaking the role ranking made a test fail, so the tests do catch regressions.
- **Other checks:** lint (0 errors), `typecheck` and `build` pass, and the production audit is 0.

### P2-03 · Generated types and typed clients (needs owner)
- [x] Done

**Why:** Code quality: the schema lives only in Supabase, and queries are untyped.
**Steps:**
1. **Needs owner:** run `npx supabase login` and `npx supabase link --project-ref <ref>`, then `npx supabase init`.
2. Run `npx supabase gen types typescript --linked > types/supabase.ts`, and add an `npm run db:types` script for it.
3. Type the clients with `createClient<Database>()` / `createServerClient<Database>()`.
4. Fix the resulting type errors. If this grows large, split the work into follow-up tasks per folder.
5. Update the "Database naming quirks" section of CLAUDE.md with any confirmed column names (for example `order_items.unit_price` vs `price`).

**Done when:** Types are generated and `tsc` passes. (Pulling the schema into migrations moved to P2-06.)

**Notes (2026-10-22):**
- **Setup:** the owner logged in and linked the project. `supabase init` created `supabase/config.toml`; `supabase/.temp` is gitignored.
- **Types:** `types/supabase.ts` (603 lines: 13 tables and 1 view, no functions or enums). `npm run db:types` regenerates it using the Supabase CLI, pinned as a dev dependency at 2.121.0. I checked that the output is plain UTF-8 on Windows.
- **Typed clients:** `supabaseAdmin`, `utils/supabase/server.ts` and the middleware client all use `Database`. This surfaced **22 type errors in 8 files**, now fixed with no behaviour change:
  - String IDs against numeric columns: order page, actions and invoice now parse with `Number()`, use `notFound()` for invalid IDs, and order actions take `number` and check `Number.isInteger`. Category actions use `Number(id)`.
  - Nullable columns: component prop types in notifications, timeline, notes and recent orders now allow `null`.
  - `admins` has no `email`: the team card's `email` is now optional. Real emails come in P3-09.
- **Other changes:** `getTeamMembers` now shows `is_active = null` as active, matching the guard.
- **Checks:** `tsc` has 0 errors, lint 0 errors, tests 25/25, `build` passes, and the production audit is 0.
- **Schema facts that change other tasks:** see the notes on P3-05 (invoice and order page), P3-09 (team emails) and P4-01 (brand images). The confirmed columns are now in CLAUDE.md under "Database schema".

### P2-04 · Input validation with zod
- [x] Done

**Depends on:** P1-05
**Files:** new `lib/validation/*.ts`, all mutating actions
**Steps:**
1. Install `zod`. Write one schema per entity: product, brand, category, order status, admin, customer.
2. Parse `FormData` through the schema in each action. On failure return `{ success: false, message }`.
3. Validate uploads: only `image/jpeg`, `image/png` or `image/webp`, at most 5 MB, with the file extension taken from the MIME type.
4. Add tests for the schemas.

**Done when:** Bad input returns a readable error instead of a database error or a crash.

**Notes (2026-10-22):**
- **Library:** `zod` 4.6.7, a production dependency; the production audit is still 0.
- **Helpers in `lib/validation/form.ts`:**
  - `parseForm(schema, formData)` returns the data, or the first problem as a sentence.
  - `optionalImage` accepts JPEG, PNG or WebP up to 5 MB, and treats an empty file input as no image.
  - `imageExtension()` names uploads by MIME type instead of the client's file name.
- **Schemas:** `product`, `brand`, `category`, `customer`, `admin` (new member, profile, password change) and `order` (note).
- **Wired into every action that reads form input:**
  - Products: add/update. The duplicated upload code became `uploadProductImage`, which also sets `contentType`.
  - Brands, live categories, legacy categories (including the image check), customer update, profile, password change, order note and `createAdmin` (password checked on the server now, closing the P1-08 gap).
  - Each action keeps its error style: throwing actions throw the message, result-style actions return it.
  - The only raw `formData.get` left: login (Supabase checks the credentials) and the legacy category `existingImageUrl` (P4-02).
- **Checks:** 30 new tests (55 total), `typecheck` clean, lint 0 errors (warnings down from 58 to 55), `build` passes, guard audit 24/24.
- **Limitation:** in production, Next.js hides the message of an error thrown from a server action. For the throwing actions (product, brand, note, new admin), users only see the readable message once P3-10 switches them to `{ success, message }` results with a toast. The browser's `required` attributes still catch most mistakes before submit.

### P2-05 · Continuous integration
- [ ] Done

**Depends on:** P2-01, P2-02
**Files:** `.github/workflows/ci.yml`
**Steps:**
1. Use Node 24 and run `npm ci`, `typecheck`, `lint`, `test` and `build` on every push and pull request. Add `npm audit --omit=dev --audit-level=high`, since dev-only tooling advisories are tracked separately (see P2-01 notes).
2. Set placeholder `NEXT_PUBLIC_SUPABASE_*` / `SUPABASE_SERVICE_ROLE_KEY` values so the build does not fail on missing environment variables.

**Done when:** The workflow is green on a pull request.

**Notes (2026-10-22):**
- **Workflow:** `.github/workflows/ci.yml` runs on every push and pull request with `actions/checkout@v7` and `actions/setup-node@v7` (Node 24, npm cache). Steps: `npm ci`, `typecheck`, `lint`, `test`, `build`, and `npm audit --omit=dev --audit-level=high`. It uses placeholder Supabase variables, read-only `contents` permission, and concurrency that cancels superseded runs.
- **Simulated locally** in a clean `git worktree` (no `.env.local`, no `node_modules`), with every step passing. The simulation caught one real issue: `tsc` fails on image imports in a fresh checkout because `next-env.d.ts` is gitignored and only generated by `next dev`/`next build`. Fixed by making `typecheck` run `next typegen && tsc --noEmit`, as the bundled Next docs recommend.
- **Pending:** tick the box once the workflow is green on GitHub, which needs the branch pushed. · Pull the schema into migrations (needs Docker)
- [ ] Done

**Why:** Split from P2-03. Tables, row-level security, grants and buckets should be versioned in the repo and reviewed like code.
**Depends on:** P2-03
**Files:** `supabase/migrations/<timestamp>_remote_schema.sql`
**Steps:**
1. Start Docker Desktop. The Supabase CLI runs `pg_dump` in a container; without the daemon it fails with `DockerRunError`.
2. Run `npx supabase db pull`. It is read-only against the remote database, and creates its own temporary login role, so no database password is needed. Review the generated migration, especially the RLS policies on `profiles` and `admins` (see P1-07).
3. From then on, new SQL goes into `supabase/migrations/` instead of `docs/sql/`. Update the workflow rule in CLAUDE.md to match.

**Done when:** `supabase/migrations/` holds the remote schema and is committed.

---

## Phase 3 — Fix the bugs

### P3-01 · Confirm dialog and toast feedback for destructive actions
- [x] Done

**Why:** Bugs: deletes happen on one click and errors are swallowed.
**Files:** `components/ui/alert-dialog.tsx` (shadcn), new `components/confirm-button.tsx`, `product/columns.tsx`, `brand/columns.tsx`, `categories/columns.tsx`, `components/team-member-card.tsx`, the order page's "Mark as Cancelled" button
**Steps:**
1. Run `npx shadcn@latest add alert-dialog`. Build `ConfirmButton`, which takes an action, a title and a description, and shows a toast for the result.
2. Make delete and deactivate actions return `{ success, message }` instead of throwing for expected errors, such as a delete blocked by existing products.

**Done when:** Every destructive action asks for confirmation and shows a success or error toast.

**Notes (2026-10-22):**
- **Dialog:** `components/ui/alert-dialog.tsx` is hand-written in the project's shadcn style using `@radix-ui/react-alert-dialog` 1.2.1. The current shadcn CLI generates for the combined `radix-ui` package instead.
- **New shared pieces:**
  - `lib/action-result.ts`: `ActionResult`, `NOT_AUTHORIZED`, `isForeignKeyViolation`.
  - `lib/toast-action.ts`: `runWithToast()` turns a thrown error into a generic toast, because Next hides the message in production.
  - `components/confirm-dialog.tsx`: works with a trigger or controlled. It stays open with a spinner until the action finishes.
- **Actions converted to `{ success, message }`:**
  - `deleteProduct`, `deleteBrand`, `deleteCategory`: friendly text for foreign-key errors ("still has products"). They now request the deleted rows back, so a delete that RLS silently blocks reports "not found" instead of a false success.
  - `updateAdminRole`, `deactivateAdmin`, `reactivateAdmin`, `updateOrderStatus`.
- **UI:**
  - Product, brand and category delete buttons use `ConfirmDialog` and gained `aria-label`s. The category one replaced the native `confirm()`, whose result was ignored.
  - Team card: role changes and reactivate show toasts, and deactivate asks first. That dialog is controlled and opened from the dropdown, which is `modal={false}`.
  - Order page: the five status forms became the `OrderStatusActions` client component, with toasts and a confirmation before cancelling.
- **Verified:** `typecheck`, lint (0 errors), 59 tests (4 new for `runWithToast` and `isForeignKeyViolation`), `build`, and the guard audit (24/24).
- **Browser check:** a temporary public page drove the real `ConfirmDialog` in headless Chrome, and every check passed with 0 page errors. Covered: open, staying open while pending, the success toast, closing, the error toast, cancel, opening from a dropdown item, and the page staying clickable afterwards. The page was deleted afterwards. The real screens (products, brands, team, orders) still need a logged-in check.
- **Out of scope:** the legacy `addcategory/actions.ts` `deleteCategory` still throws; no UI uses it (P4-02). Showing errors on the add/edit forms moved to P3-10.

### P3-02 · Order search by ID
- [x] Done

**Files:** `app/(dashboard)/actions.ts` (`getOrders`), `order/page.tsx`
**Steps:**
1. If the search text is numeric, use `.eq("id", Number(search))`; otherwise ignore it. Customer search comes in P5-04.
2. Change the search placeholder to "Search by order #".

**Done when:** Typing an existing order number shows that order.

**Notes (2026-10-22):**
- **Parser:** `parseOrderNumber()` in `lib/orders.ts` accepts `123`, `#123` and surrounding spaces, and rejects everything else (letters, decimals, negatives, 0, numbers beyond the safe-integer limit). 15 new test cases; 74 tests total.
- **`getOrders`:** uses `.eq("id", …)` instead of the full-text search that always errored. Text that isn't an order number returns no results instead of silently showing every order. This deliberately differs from the step's "ignore it", so a bad search isn't mistaken for "all orders".
- **UI:** `DataTable` gained a `searchPlaceholder` prop (default "Filter..."); the order page uses "Search by order #".
- **Checks:** `typecheck`, lint (0 errors) and `build` pass. Logged-in check still to do: search an existing order number on /order.

### P3-03 · Status filter survives reload and Back
- [x] Done

**Files:** `components/data-table.tsx`
**Steps:**
1. Initialise `columnFilters` from the URL for each `filterTabs` group.

**Done when:** `/order?status=Delivered` still shows the Delivered tab and rows after a reload.

**Notes (2026-10-22):**
- **Root cause:** two bugs. Filter state always started empty, and an effect then deleted `status` from the URL. The same effect also fought the Back button by pushing the stale filter again.
- **Fix:** for server-side tables, the filter tabs are now derived from the URL on every render, and `onColumnFiltersChange` writes straight to the URL, resetting to page 1. The sync effect is gone. Client-side tables keep local state.
- **Browser check:** a temporary public page rendered `DataTable` with the status tabs in headless Chrome, and 7/7 checks passed. Covered: the initial `?status=` is kept and selected, clicking a tab updates the URL, reload keeps it, Back restores the previous filter without being overridden, and "All" clears it. Against the old `DataTable` the same check failed 4 ways (status wiped on load, lost on reload, Back broken), so the test does detect the bug. The page was deleted afterwards.
- **Checks:** `typecheck`, 74 tests, lint (0 errors) and `build` pass.

### P3-04 · Full CSV export
- [x] Done

**Files:** new `lib/csv.ts` (+ test), new export server action, `components/csv-exporter.tsx`, `order/page.tsx`
**Steps:**
1. `lib/csv.ts`: RFC 4180 escaping (quote fields containing `,`, `"` or newlines, and double any quotes), with a UTF-8 byte-order mark so Excel opens it correctly.
2. Add a server action `exportOrders({ search, status })` with role `viewer` or higher. It fetches every matching row in pages of 1000.
3. Have the exporter call that action instead of using the page's rows.

**Done when:** The export contains every order for the current filter, and a value with a comma or quote survives a round trip through Excel.

**Notes (2026-10-22):**
- **`lib/csv.ts`:** `csvField` applies RFC 4180 quoting. It also neutralises CSV formula injection: text starting with `= + - @` is prefixed with `'`, numbers are left alone. `toCsv` adds a UTF-8 BOM and CRLF line endings. The `CsvExportResult` type is here too. 8 tests (82 total).
- **`exportOrders({ search, status })`** in `order/actions.ts`, any active admin:
  - Same filtering as the list: order-number search via `parseOrderNumber`, and status only when it is a real status.
  - Fetches in batches of 1000, ordered by `created_at` then `id` so batches don't overlap, capped at 50,000 rows.
  - Columns: Order #, Created at (UTC, `YYYY-MM-DD HH:mm:ss`), Status, Total (DZD). Filename `orders[-status]-YYYY-MM-DD.csv`.
- **`CsvExporter`:** takes a bound server action instead of the page's 20 rows. It shows a spinner while exporting, toasts the row count or the error, and revokes the object URL, which the old code leaked.
- **Browser check:** a temporary page with a fake action in headless Chrome, 7/7 checks and 0 page errors. Covered: the button is disabled while exporting, the filename, the BOM, the exact CSV bytes (escaping, CRLF, formula prefix), the success toast, and the error path with no download. The page was deleted afterwards.
- **Checks:** `typecheck`, lint (0 errors), `build` and the guard audit pass.
- **Still to check when logged in:** export real orders and open the file in Excel. Customer columns can be added once the order loader joins customers (P3-05, P5-04).

### P3-05 · Invoice matches the order page
- [x] Done

**Depends on:** P2-03 (to confirm column names)
**Files:** new `lib/data/orders.ts`, `order/[id]/page.tsx`, `app/invoice/[id]/page.tsx`, `components/invoice-printable.tsx`
**Steps:**
1. Write `getOrderWithDetails(id)`, which returns the order, its line items and the customer. Both pages use it.
2. Take the price from the order line's stored price (confirm the real column name), and fill "Bill To" from the customer profile.

**Done when:** The invoice and the order page show the same customer, lines and prices for any order.

**Notes (2026-10-22, schema confirmed in P2-03):**
- `order_items` has `unit_price` and no `price`, so the invoice currently shows each product's current price.
- `orders` has no `customer_name`, `customer_email` or `shipping_address`, so the invoice always says "Guest Customer".
- The shipping address lives in `addresses` (`full_name, phone_number, street, city, state, zip_code, country`) via `orders.address_id`. The order page reads `profile.address` / `profile.city`, which don't exist, so **the shipping address is shown nowhere today**.
- `getOrderWithDetails` should join `addresses`, and both pages should show it.

**Notes (2026-10-22, implementation):**
- **Loader `lib/data/orders.ts`** (server-only, the first `lib/data` module): `getOrderWithDetails(id)` returns `OrderDetails`, with the order and its items fetched in parallel.
  - The order is joined to `addresses` through the `orders_address_id_fkey` FK.
  - Items join `products`, with `unitPrice` taken from `order_items.unit_price` and a `lineTotal`. A missing product shows as "Deleted product".
  - `itemsTotal` is computed, so other charges become visible.
  - The customer comes from `profiles` (name) plus the auth user (email, and phone with the existing metadata fallbacks).
- **`lib/address.ts`:** `ShippingAddress` and `formatAddressLines()`, which drops blanks and a region that repeats the city. 3 tests (85 total).
- **Order page:**
  - Uses the loader, with the timeline and notes fetched in parallel.
  - **Now shows the shipping address and the delivery phone.** "Call Customer" falls back to the delivery phone.
  - Shows "Items X + other charges Y" when they differ.
  - A missing order is a real 404 (part of P3-07).
- **Invoice:** uses the same loader, with columns Bill To (customer) and Ship To (address and phone). Lines use the price paid, and an "Other charges" row appears when the items don't add up to `orders.total`.
- **Browser check:** the invoice rendered on a temporary page with a realistic fake order, 7/7 checks with 0 page errors, and the screenshot was reviewed. The page was deleted afterwards.
- **Checks:** `typecheck`, lint (0 errors, warnings down from 54 to 48) and `build` pass.
- **Still to check when logged in:** open a real order and its invoice.

### P3-06 · Revenue chart grouping and shared date ranges
- [x] Done

**Files:** new `lib/dates.ts` (+ test), `app/(dashboard)/actions.ts`
**Steps:**
1. Add `getPeriodStart(period)` to replace the two copies of the date-range logic.
2. Group revenue by `YYYY-MM-DD` for ranges up to 90 days, and by month beyond that. Labels must include the year where needed.

**Done when:** "All time" no longer adds together the same calendar day from different years.

**Notes (2026-10-22):**
- **`lib/dates.ts`** (pure, 9 tests, 94 total):
  - `getPeriodStart(period, now)` uses UTC setters so it's deterministic; the tests also pass with `TZ` set to Paris and New York.
  - `localDateKey()` buckets days in `Africa/Algiers` time, since the server runs in UTC.
  - `groupRevenue(orders, period, now)` buckets by full date. **Deviation from the steps:** daily up to 31 days, **weekly (Monday-based) up to 120 days**, monthly beyond; a strict day/month split would make "last 3 months" only 3 bars. Every bucket from the period start is present, with 0 for quiet periods, instead of squeezing gaps out. With no orders it returns `[]`, so the chart keeps its empty state.
- **`app/(dashboard)/actions.ts`:** `getDashboardStats` and `getRevenueData` use these; the two copies of the date-range code are gone.
- **`RevenueChart`:** `barSize={40}` became `maxBarSize={40}`, so 31 daily bars fit.
- **Browser check:** the real `RevenueChart` was rendered with `groupRevenue` output for all four periods on a temporary page. Bar counts were 8, 31, 14 and 25, with 0 page errors, and the screenshot was reviewed: labels are readable and monthly labels include the year. The page was deleted afterwards.
- **Checks:** `typecheck`, lint (0 errors) and `build` pass.
- **Found:** the revenue figures are capped at 1000 orders per period by Supabase's row limit; noted on P6-06.

### P3-07 · Small fixes
- [x] Done

**Files:** `components/ProductForm.tsx`, `order/[id]/page.tsx`, `settings/page.tsx`
**Steps:**
1. Use `??` instead of `||` for the price and quantity default values.
2. On the order page, use `notFound()` for a missing order and guard against a null `total`.
3. Show the real role on the Settings page using `getCurrentAdmin()`.

**Done when:** All three behave correctly, as checked manually.

**Notes (2026-10-22):**
- **Step 2:** done in P3-05. The order page calls `notFound()`, and `orders.total` is `NOT NULL`, so no guard is needed.
- **Step 1:** `ProductForm` uses `??` for `unite_price` and `in_stock_vailable`, so 0 shows as 0.
- **Step 3:** the Settings page uses `requireAdminPage()`, which replaces its own `getUser()` call, and shows the real email and role. The new shared `ROLE_LABELS` in `lib/roles.ts` (with a test, 95 total) is also used by the Profile page, which showed the raw role ("Super_admin").
- **Checks:** `typecheck`, lint (0 errors) and `build` pass.
- **Not browser-checked:** all three screens are behind the login. Logged-in check: edit an out-of-stock product (Quantity shows 0), and look at the role on Settings and Profile.

### P3-08 · Database-generated brand IDs (needs owner)
- [ ] Done

**Depends on:** P2-03
**Files:** a new migration, `brand/actions.ts`
**Steps:**
1. Write a migration that makes `brands.brand_id` an identity column starting at the current max + 1. Ask the owner to apply it.
2. Remove the max + 1 calculation from `addBrand`.

**Done when:** Adding a brand no longer computes the ID in app code.

**Notes (2026-10-22):** **Blocked on the owner.** The SQL is ready in `docs/sql/P3-08-brand-id-identity.sql`: inspect, then convert to an identity column that continues after the current max id, then verify. The code change (removing max + 1 from `addBrand`) must only be deployed after the SQL is applied, so it is not done yet.

### P3-09 · Adding a team member fails
- [x] Done

**Why:** Bug, also on `master`: `createAdmin` inserts `email` into `admins`, but the table has no such column (`id, full_name, role, is_active, created_at, updated_at`). The insert fails with `42703: column "email" of relation "admins" does not exist`, and the new auth user is rolled back. Found on 2026-10-22 while granting access by hand.
**Depends on:** —
**Files:** `app/(dashboard)/team/actions.ts`
**Steps:**
1. Remove `email` from the `admins` insert in `createAdmin`. The email stays on the auth user, where `getCurrentAdmin()` already reads it.

**Done when:** A super admin can add a member from `/team/new`, and the new member can sign in.

**Notes (2026-10-22, from P2-03):** For the same reason, the Team page shows **no email** on any member card: `getTeamMembers` reads `admins.*`, which has no email. Consider loading emails from the auth users (for example `supabaseAdmin.auth.admin.listUsers()`, mapped by id) in `getTeamMembers`. The card's `email` prop is optional for now.

**Notes (2026-10-22, implementation):**
- **`createAdmin`:** no longer inserts `email` into `admins`.
- **`getTeamMembers`:** loads each member's email from their auth user (`auth.admin.getUserById`, run in parallel), so the Team cards show emails again. Because it now returns emails and is an exported server function, it also checks the caller (`getAuthorizedAdmin('viewer')`), which the guard audit flagged (25/25 guarded).
- **Checks:** `typecheck`, 95 tests, lint (0 errors) and `build` pass.
- **Still to check when logged in (super admin):** add a member from /team/new, confirm the card shows their email, and that they can sign in.

### P3-10 · Show validation errors on add/edit forms
- [x] Done

**Why:** Split from P3-01. Since P2-04, the product, brand, new-admin and order-note actions validate input, but they report problems by throwing. In production, Next.js replaces a thrown message with a generic error screen, so users never see "Price must be greater than 0."
**Depends on:** P3-01
**Files:** `addproduct/actions.ts` (`addProduct`, `updateProduct`), `brand/actions.ts` (`addBrand`, `updateBrand`), `team/actions.ts` (`createAdmin`), `order/actions.ts` (`addOrderNote`), `components/ProductForm.tsx`, `components/BrandForm.tsx`, `app/(dashboard)/team/new/page.tsx` (form moves to a client component), `components/order-notes.tsx`
**Steps:**
1. Make these actions return an `ActionResult` for validation and database errors. Keep `redirect()` on success, which `useActionState` follows.
2. Wrap each form's action in `useActionState`, show the message inline above the submit button, keep the user's input, and disable the button while pending.
3. In `OrderNotes`, use `runWithToast` instead of `console.error`.

**Done when:** Submitting each form with bad input shows the specific message, and the form keeps what was typed.

**Notes (2026-10-22):**
- **`lib/use-form-action.ts`:** `useFormAction(action)` wraps `useActionState` but submits from `onSubmit` + `startTransition`. React 19 resets a `<form action>`'s fields after the action runs, which would wipe the input on a validation error.
- **Actions with the `(prevState, formData) => Promise<ActionResult>` signature:** `addProduct`, `updateProduct(id, …)`, `addBrand`, `updateBrand(id, …)` and `createAdmin`. They return errors for not-authorized, validation, upload and database failures, and still `redirect()` on success.
- **`addOrderNote`:** returns an `ActionResult`.
- **UI:**
  - `ProductForm` and `BrandForm` show the message inline (`role="alert"`), with a spinner and a disabled submit while pending.
  - The `/team/new` form moved to the client component `components/new-admin-form.tsx`.
  - `OrderNotes` uses `runWithToast` and only clears the text on success.
- **Removed** the dead legacy product pages `/addproduct` and `/editproduct/[id]` (part of P4-02). They used the old action signatures and nothing linked to them.
- **Browser check:** the real `BrandForm` and `ProductForm` were driven with fake failing-then-succeeding actions on a temporary page, 7/7 checks with 0 page errors. Covered: pending state, the inline error, every field kept after an error (including selects and the rich-text description), and the corrected resubmit sending the kept values. The screenshot was reviewed and the page deleted afterwards.
- **Checks:** `typecheck`, 95 tests, lint (0 errors, 44 warnings), `build` and the guard audit (25/25) pass.

---

## Phase 4 — Clean up

### P4-01 · Category image upload in the live modal
- [x] Done

**Why:** The legacy page could upload category images; the modal cannot. This must be done before the legacy code is deleted.
**Files:** `components/CategoryForm.tsx`, `categories/actions.ts`, `categories/columns.tsx`
**Steps:**
1. Port the `StaticAssests` upload from `addcategory/actions.ts` into `categories/actions.ts`, using `supabaseAdmin`, the role guard and upload validation.
2. Add an image picker to the modal, and an image thumbnail column to the table.

**Done when:** You can add and change category images from the Categories page.

**Notes (2026-10-22, from P2-03):** `brands` also has a `brand_image_url` column that the dashboard never sets. Consider the same picker for brands.

**Notes (2026-10-22, implementation):**
- **Category actions:** `addCategory` and `updateCategory` upload to the `StaticAssests` bucket (named by MIME type, with `contentType`), and keep or clear `existingImageUrl` on update. All three actions now use `supabaseAdmin` behind the role guard, like every other action; they used the cookie client, where RLS could silently no-op.
- **Validation:** `existingImageUrl` is a shared field in `lib/validation/form.ts`, used by the product and category schemas.
- **Image picker:** `ProductImageUpload` gained `label` and `previewClassName` and is reused for categories. The legacy `CategoryImageUpload` had a bug: Remove still posted the old URL, so an image could never be removed. It stays only for the legacy pages, which P4-02 deletes.
- **`CategoryForm`:** the dialog body is its own component, mounted on open, so there is no stale error. It uses `useFormAction`: the error is shown inline, input and image are kept, and success toasts and closes. Labels are linked with `htmlFor`, and the close button has an `aria-label`.
- **Table:** a thumbnail column (`next/image`, unoptimized). The categories page no longer logs raw rows.
- **Browser check:** the real `CategoryForm` with its real server action on a temporary page, 6/6 checks with 0 page errors. Covered: the picker, the PNG preview, the action refusing without a session ("Not authorized", inline), the name and image kept, and a fresh dialog on reopen. The page was deleted afterwards.
- **Checks:** `typecheck`, 95 tests, lint (0 errors) and `build` pass, and the guard audit is 25/25.
- **Still to check when logged in:** add a category with an image, change it, and remove it.

### P4-02 · Delete legacy and dead code
- [x] Done

**Depends on:** P4-01, P1-07
**Files to delete:** ~~`app/(dashboard)/addproduct/page.tsx`, `editproduct/[id]/page.tsx`~~ (already deleted in P3-10), `addcategory/page.tsx`, `addcategory/actions.ts`, `editcategory/[id]/page.tsx`, `Navbar.tsx`, `item.tsx`, `CategoryImageUpload.tsx` (if no longer used), `utils/supabase/client.ts`. (`AuthProvider.tsx` and `ProtectedRoute.tsx` were already deleted in P2-01.)
**Steps:**
1. Move the product actions from `addproduct/actions.ts` to `product/actions.ts` and update the imports.
2. Delete the files listed above.
3. Uninstall `dotenv`, `@types/dotenv` and `@tiptap/extension-image`.
4. Update CLAUDE.md, which still mentions the legacy routes.

**Done when:** The build passes and none of the deleted paths are referenced anywhere.

**Notes (2026-10-22):**
- **Deleted:** the legacy category pages (`addcategory/page.tsx`, `editcategory/[id]/page.tsx`), `addcategory/actions.ts`, `components/Navbar.tsx`, `components/CategoryImageUpload.tsx` and `utils/supabase/client.ts`. The legacy product pages went in P3-10, and `AuthProvider`/`ProtectedRoute` in P2-01.
- **Correction:** `components/item.tsx` is **not** dead. `Sidebar` imports it as `./item`, which the original search missed, so it stays.
- **Moved:** `addproduct/actions.ts` to `product/actions.ts`, with imports updated.
- **Uninstalled:** `dotenv`, `@types/dotenv` and `@tiptap/extension-image`.
- **Docs:** CLAUDE.md now describes where mutations live instead of the legacy routes.

### P4-03 · Data-access layer
- [x] Done

**Files:** new `lib/data/{products,brands,categories,orders,customers,admins,dashboard}.ts`, the pages, `app/(dashboard)/actions.ts`
**Steps:**
1. Move all read queries into `lib/data/*`, using `server-only` and typed clients.
2. Leave only mutations in the `actions.ts` files.
3. Use `Promise.all` for independent fetches on the dashboard, order and team pages.
4. Update the Architecture section of CLAUDE.md.

**Done when:** No page imports `supabaseAdmin` directly, and the build passes.

**Notes (2026-10-22):**
- **New modules:** `lib/data/{dashboard,products,orders,brands,categories,customers,admins,notifications}.ts`, all `server-only` and typed. `app/(dashboard)/actions.ts` was split by script, so the code moved verbatim minus the `any` casts, then deleted.
- **Moved out of `'use server'` files:** `getTeamMembers`, `isSuperAdmin`, `getCurrentUserRole`, `getOrderTimeline`, `getOrderNotes` and `getNotifications`. **These were public endpoints and now are not.** No `'use server'` file exports a read any more.
- **Pages:**
  - None imports `supabaseAdmin`; the inline queries in the product, brand, category and customer pages moved to `lib/data`.
  - `Promise.all` on the dashboard, product, brand and team pages.
  - The layout passes `admin.id` to `getNotifications`, saving one `auth.getUser()` round-trip per page.
  - The team pages use `requireAdminPage()` and `admin.role`.
- **Types:** the row types `Brand`, `Category`, `Product` and `Order` now match the data: numeric ids, nullable status and stock. Their `any` had hidden the mismatch. `getCustomers` skips view rows with a null id.
- **Checks:** `typecheck`, lint (0 errors, warnings down from 37 to 30), 95 tests, `build`, the guard audit (21/21) and the smoke test (11/11) pass.

### P4-04 · One dialog component and accessibility basics
- [x] Done

**Files:** `components/Modal.tsx`, `CategoryForm.tsx`, `CustomerForm.tsx`, `profile-edit-dialog.tsx`, the column files
**Steps:**
1. Run `npx shadcn@latest add dialog` and migrate all four modal patterns to it.
2. Add an `aria-label` to every icon-only button, and `htmlFor`/`id` pairs to form labels and inputs.

**Done when:** Every dialog traps focus and closes with Escape, and icon buttons have accessible names.

**Notes (2026-10-22):**
- **Dialog:** `components/ui/dialog.tsx` is hand-written in the project's shadcn style using `@radix-ui/react-dialog` 1.3.1, the same version alert-dialog already used, so there is one copy.
- **Migrated:**
  - `Modal` (URL-driven, now needs a `title` for screen readers).
  - `CategoryForm` and `CustomerForm` (were `createPortal` with z-[9999]).
  - `ProfileEditDialog` (a hand-made overlay with no Escape).
  - Radix mounts content on open, so each open is fresh. `CustomerForm` and `ProfileEditDialog` also moved to `useFormAction`: they used `<form action>`, which wiped input on errors.
- **Accessibility:**
  - `aria-label` on the product, brand, category and customer edit buttons, the notifications bell (with the unread count), and the mobile menu toggle (plus `aria-expanded`).
  - `htmlFor`/`id` on the customer and profile form labels.
- **Browser check:** the real dialogs, `Modal` and the product table on a temporary page, 13/13 checks with 0 page or console errors. Covered: accessible names, focus moving in, the Tab focus trap, Escape, focus returning to the trigger, the built-in Close button, real actions refusing without a session (inline, input kept), linked labels, Escape on the URL modal navigating to `returnUrl`, and the edit/delete accessible names. The page was deleted afterwards.
- **Checks:** `typecheck`, lint (0 errors, 29 warnings), 95 tests and `build` pass.

### P4-05 · Design tokens and forced light theme
- [x] Done

**Files:** `app/globals.css`, `app/layout.tsx`, every component that uses `#0B1DFF` / `#0b1dff`
**Steps:**
1. Map the brand blue onto `--primary` (and a `--brand` token if needed) in `globals.css`.
2. Replace the 83 hard-coded hex usages with `bg-primary`, `text-primary` and similar.
3. Set `defaultTheme="light"` and `enableSystem={false}` until P7-05.

**Done when:** `grep -ri "#0b1dff" app components` returns nothing, and the UI looks the same.

**Notes (2026-10-22):**
- **Tokens:** `--primary`, `--ring` and `--sidebar-primary` are now the exact brand blue (`oklch(0.466 0.303 264.9)` = #0B1DFF; they were a slightly different indigo). The new `--primary-strong` (#000ECC) is exposed as the `primary-strong` utility for hover states.
- **Replacements:** the 41 remaining hard-coded usages became `bg-primary`, `text-primary`, `focus:ring-primary`, `focus:border-primary` and `hover:*-primary-strong`. The 8 brand buttons that hovered to Tailwind's `blue-700` now use `hover:bg-primary-strong`. The only hex left is in two CSS comments.
- **Theme:** `ThemeProvider` uses `defaultTheme="light"` with `enableSystem={false}`. With the browser emulating a dark OS, `<html>` keeps class `light`.
- **Visual check:** a login screenshot matches the earlier one.
- **Checks:** `typecheck`, lint (0 errors), 95 tests and `build` pass.

### P4-06 · Logging cleanup and Next 16 conventions
- [x] Done

**Steps:**
1. Remove debug `console.log` calls and keep `console.error` calls that give context.
2. If `next build` warns that `middleware.ts` is deprecated, rename it to `proxy.ts` as the Next 16 docs describe.
3. Let `/robots.txt` (and `/icon.png`, if needed) through the middleware without a session. Today crawlers are redirected to `/login` and never see the robots file.

**Done when:** There are no debug logs and no build warnings.

**Notes (2026-10-22):**
- **Logs:** no `console.log` is left; earlier tasks removed them while rewriting each file. The remaining `console.error`/`console.warn` calls carry context.
- **Proxy:** `middleware.ts` was renamed to `proxy.ts`, with the function renamed to `proxy`, as the `middleware-to-proxy` codemod would do. Next 16 runs proxy on the Node.js runtime by default, which the service-role admin check needs. The build no longer prints the deprecation warning.
- **`robots.txt`:** added to the matcher's exclusions, so it returns 200 `Disallow: /` instead of a 307 to /login. `/icon.png` was already excluded by the image rule.
- **Checks:** the smoke test is 11/11 and protected routes still redirect.

---

## Phase 5 — Must-have features

### P5-01 · Forgot and reset password
- [x] Done

**Depends on:** P1-03
**Files:** new `app/forgot-password/page.tsx` + action, new `app/auth/confirm/route.ts`, new `app/reset-password/page.tsx` + action, `utils/supabase/middleware.ts`, `app/login/page.tsx`
**Steps:**
1. On the forgot-password page, call `resetPasswordForEmail(email, { redirectTo: <origin>/auth/confirm?next=/reset-password })`. Always show "If the account exists, an email was sent."
2. The `auth/confirm` route reads `token_hash` and `type`, calls `verifyOtp`, then redirects to `next`.
3. The reset-password page requires a session and the active-admin check, calls `updateUser({ password })` with at least 8 characters, then redirects to `/`.
4. Allow `/forgot-password` through the middleware.
5. Replace the "Contact Support" `#` link with "Forgot password?".
6. **Needs owner:** in Supabase Auth, add the site and redirect URLs for localhost and `https://b-wtools.vercel.app`, and edit the "Reset password" email template to link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`.

**Done when:** An admin can reset a forgotten password from the login page, on localhost and on production.

**Notes (2026-10-22):**
- **`/forgot-password`** (public, client form via `useFormAction`): `requestPasswordReset` validates the email (`passwordResetRequestSchema`), calls `resetPasswordForEmail` with `redirectTo = <origin>/auth/confirm?next=/reset-password`, and always returns the same neutral message; errors are only logged. The origin comes from `NEXT_PUBLIC_SITE_URL` if set, otherwise from the request host.
- **`/auth/confirm`** (route handler) accepts both link styles: `?code=` (PKCE, from the default email template, same browser) via `exchangeCodeForSession`, and `?token_hash=&type=` via `verifyOtp`. `next` goes through `safeRedirectPath` (`lib/redirect.ts`, 11 tests), which blocks off-site and `//` redirects. Failures go to `/login?error=reset_link`.
- **`/reset-password`:** `requireAdminPage()` (only active admins), then `ResetPasswordForm` reusing `updatePassword` (same 8–72 rule). On success it toasts and goes to the dashboard.
- **Login page:** the dead "Contact Support" `#` link became "Forgot your password?"; a new message covers `?error=reset_link`. `/forgot-password` was added to the proxy's public paths.
- **Browser check:** 8/8 with 0 page errors. Covered: the login link, the public page, the neutral confirmation (for a reserved `@example.com` address, so no real email was sent), four bad-link variants including an off-site `next` all landing on the login error, and `/reset-password` requiring a session. Smoke test 11/11.
- **Still needed, by the owner (Supabase dashboard > Authentication > URL Configuration):**
  1. **Site URL:** `https://b-wtools.vercel.app`.
  2. **Redirect URLs:** add `https://b-wtools.vercel.app/auth/confirm` and `http://localhost:3000/auth/confirm`; without them Supabase ignores `redirectTo` and links go to the Site URL root.
  3. Optional: set `NEXT_PUBLIC_SITE_URL=https://b-wtools.vercel.app` in Vercel.
  4. Optional: to make links work from any browser (not just the one that asked), change the "Reset password" email template to link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`.
- **Logged-in check:** request a reset for your admin email and follow the link.

### P5-02 · Permission-aware UI
- [x] Done

**Depends on:** P1-05
**Files:** new `components/admin-provider.tsx` (client context), `app/(dashboard)/layout.tsx`, the column files, page headers
**Steps:**
1. The layout passes `{ role }` to an `AdminProvider`. Add a `useAdmin()` hook and a `<Can minRole="admin">` wrapper.
2. Hide the Add, Edit, Delete and status buttons for viewers. Server checks from P1-05 stay as the real protection.

**Done when:** A viewer sees a read-only dashboard.

**Notes (2026-10-22):**
- **`components/admin-provider.tsx`:** `AdminProvider` (the dashboard layout passes `admin.role`), `useAdmin()`, and `<Can minRole fallback>`. It only hides controls; the server actions check the role again.
- **Hidden for viewers:**
  - The Add buttons for products, brands and categories.
  - The Edit and Delete cells in the product, brand, category and customer tables.
  - The order "Update Status" card and the note form; notes stay readable.
  - The product and brand pages also ignore `?add=`/`?edit=` for viewers, so the modal never opens and its data is not loaded.
- **Kept for viewers** (read-only features): CSV export, invoices, their own profile and password, and notifications.
- **Browser check:** the real product table, `OrderNotes` and a `<Can>` under a `viewer` and an `admin` provider side by side on a temporary page, 7/7 with 0 page errors. The page was deleted afterwards.
- **Checks:** `typecheck`, lint (0 errors), 106 tests and `build` pass.
- **Logged-in check:** sign in as a viewer and confirm the screens are read-only.

### P5-03 · Error and not-found pages
- [x] Done

**Files:** new `app/error.tsx`, `app/(dashboard)/error.tsx`, `app/not-found.tsx`, `app/global-error.tsx`
**Steps:**
1. Build branded error pages with a "Try again" button (calling `reset()`) and a link to the dashboard.
2. Make pages with unknown IDs (order, product edit, brand edit) call `notFound()`.

**Done when:** A thrown error or a bad URL shows the branded page instead of the Next.js default.

**Notes (2026-10-22):**
- **Files:**
  - `components/error-state.tsx` is the shared body. It shows the error `digest` as "Error reference" (production hides the message) and offers Try again (`retry()`, stable since Next 16.3; it re-fetches) and Go to dashboard.
  - `app/(dashboard)/error.tsx` (inside the layout, sidebar kept) and `app/error.tsx`.
  - `app/not-found.tsx`: a branded 404.
  - `app/global-error.tsx`: its own `<html>`/`<body>` with inline styles, since global CSS isn't loaded there.
- **Unknown ids:** the order page and invoice already call `notFound()` (P3-05). For the product and brand pages, an unknown `?edit=` id just doesn't open the modal, which is kinder than 404-ing the whole list, so they were left as is.
- **Browser check:** temporary pages that throw or call `notFound()`, 6/7 checks. The error page shows a digest and no internal message, and Try again works; the 404 renders with its dashboard link. The 7th "failure" is the HTTP status: `notFound()` responded 200, not 404 (fixed in P5-05 by removing the root loading.tsx), because the root `app/loading.tsx` makes the response stream before `notFound()` runs (standard Next.js behaviour; Next marks the page `noindex`). It's harmless here because the dashboard is never indexed. Screenshots reviewed; the test pages were deleted, and `/auth/confirm` was kept.
- **Checks:** `typecheck`, lint (0 errors) and `build` pass.

### P5-04 · Order search by customer and date range
- [x] Done

**Depends on:** P2-03, P3-02
**Files:** a migration (view `orders_with_customer` joining `profiles` and the auth email), `getOrders`, `order/page.tsx`, `components/data-table.tsx`
**Steps:**
1. **Needs owner:** apply the view migration, granted to `service_role` only.
2. Search by order number, customer name, phone or email, and add `from`/`to` date inputs stored in the URL.

**Done when:** You can find an order by customer phone, and filter by date range combined with status.

**Notes (2026-10-22):**
- **No migration needed (deviation from step 1):** customer search is done in two steps.
  1. `profiles_with_email` is searched by username, email or phone with `ilike` (capped at 200 ids).
  2. Orders are filtered with `user_id.in.(...)`.
  - A numeric search matches the order number **or** a phone (`id.eq.N,user_id.in.(...)`), since phone numbers are numeric too.
- **Shared resolver:** `resolveOrderFilters()` in `lib/data/orders.ts` returns the search clause, status, date bounds and `matchesNothing`. Both `getOrders` and `exportOrders` use it, so the CSV always matches the screen.
- **Helpers:**
  - `customerSearchPattern` in `lib/orders.ts` strips the characters that break PostgREST's `or()` syntax and escapes LIKE wildcards.
  - `parseDateKey`, `localDayStartUtc` and `nextDateKey` in `lib/dates.ts` bound whole days in Algiers time.
  - 19 new tests, 114 total.
- **UI:** `components/order-date-filter.tsx` keeps from/to in the URL; `min` is set so "to" can't come before "from"; it has a Clear button and resets to page 1. The search placeholder now reads "Order #, customer, email or phone".
- **Verified:**
  - **Filter syntax:** count-only HEAD requests to Supabase (no rows read) accepted every filter string, including awkward input like `50%_off, (x)`. The date check also showed 4 orders so far in 2026.
  - **Date picker:** 5/5 in the browser on a temporary page (deleted afterwards).
  - **Checks:** `typecheck`, lint (0 errors) and `build` pass.
- **Still to check when logged in:** search a real customer's name or phone on /order and combine it with dates and a status.

### P5-05 · Loading skeletons
- [x] Done

**Files:** a `loading.tsx` in each dashboard route
**Steps:**
1. Add skeletons shaped like each page (table rows, stat cards, order detail) using `components/ui/skeleton.tsx`.

**Done when:** Navigating between pages shows a skeleton instead of a frozen screen.

**Notes (2026-10-22):**
- **`components/page-skeletons.tsx`:** `DashboardSkeleton`, `TablePageSkeleton`, `OrderDetailSkeleton`, `CardGridSkeleton` and `FormPageSkeleton`. Each is shaped like its page, with the same padding, and wrapped in `role="status" aria-label="Loading"`.
- **Routes:** a `loading.tsx` for the dashboard, product, order, `order/[id]`, customers, brand, categories, team, profile and settings.
- **Root `app/loading.tsx` removed:** it showed a dashboard skeleton on every route (login, invoice), and it made `notFound()` stream a 200. A `notFound()` outside the dashboard now returns a real **404**, which was re-tested.
- **Visual check:** a screenshot of the skeletons on a temporary page (deleted afterwards).
- **Checks:** `typecheck`, lint (0 errors), 114 tests and `build` pass.

---

## Phase 6 — Should-have features

### P6-01 · Store settings
- [x] Done

**Depends on:** P2-03
**Files:** migration (`store_settings` single-row table: name, email, phone, address, `low_stock_threshold`, invoice footer), `settings/page.tsx` + action, `invoice-printable.tsx`
**Steps:**
1. A super admin edits the settings under Settings > General.
2. The invoice header and footer read from the table.

**Done when:** Nothing store-specific is hard-coded anymore.

**Notes (2026-10-22):**
- **Built to work before and after the SQL** (`docs/sql/P6-01-store-settings.sql`: a single-row table, CHECK `id = 1`, RLS on with no policies so only the service role can access it).
- **Reading:** `getStoreSettings()` in `lib/data/settings.ts` returns the defaults when the table is missing (`PGRST205`/`42P01`, quietly) and flags `isDefault`. The table isn't in the generated types yet, so rows are read through an untyped client and validated with `storeSettingsSchema` (`lib/store-settings.ts`, 4 tests). After the SQL, run `npm run db:types`.
- **Saving:** `updateStoreSettings` (super admin only) validates and upserts `id=1`. While the table is missing it explains that the SQL must be run first.
- **Settings > General:** an "Your account" card plus a "Store" card. Super admins get `StoreSettingsForm` (`useFormAction`); others see read-only values; super admins also see a notice while the defaults are in use.
- **Invoice:** the header (name, address, email, phone) and footer come from the settings. Nothing store-specific is hard-coded.
- **Verified against the real project, where the table is still missing:** a temporary page showed the fallback to the defaults (no error logged), the prefilled form, and the real action refusing without a session with the edit kept, 4/4. The page was deleted afterwards.
- **Checks:** `typecheck`, lint (0 errors), 118 tests, `build` and the guard audit (22/22) pass.
- **Owner:** run the SQL, then `npm run db:types`.

### P6-02 · Notifications pipeline (needs owner)
- [ ] Done

**Depends on:** P6-01
**Files:** migration with triggers, `notifications/actions.ts`
**Steps:**
1. Add a trigger on `orders` insert that inserts a `new_order` notification for each active admin.
2. Add a trigger on `products` update for when stock crosses below `low_stock_threshold`, inserting `low_stock` notifications.
3. Remove `notifyNewOrder` and `createNotification` if they are unused.
4. Optional: subscribe the bell to Supabase Realtime.

**Done when:** A new order from the mobile app shows up in the bell.

**Notes (2026-10-22):**
- **Blocked on the owner.** The SQL is ready in `docs/sql/P6-02-notification-triggers.sql`; apply it after P6-01's SQL.
  - **New order:** `orders_notify_new_order`, AFTER INSERT on `orders`, inserts a `new_order` notification for every active admin, linking to `/order/<id>`.
  - **Low stock:** `products_notify_low_stock`, AFTER UPDATE OF `in_stock_vailable` on `products`, fires only when stock crosses down to `store_settings.low_stock_threshold` (default 10). It links to `/product?edit=<id>`.
  - Both functions are `security definer` with a fixed `search_path`. The file ends with an optional dry run inside `begin … rollback`.
- **Code: done.** Deleted the unused `createNotification` and `notifyNewOrder` from `notifications/actions.ts`. They were public endpoints (guarded since P1-05) and nothing called them. The guard audit is 21/21.
- The SQL itself hasn't been executed, since DDL against production is the owner's call. Tick the box once a new mobile order shows up in the bell.

### P6-03 · Low-stock widget
- [x] Done

**Depends on:** P6-01
**Files:** `app/(dashboard)/page.tsx`, `components/low-stock.tsx`, `getLowStockProducts`, `product/page.tsx`
**Steps:**
1. Re-enable the widget using the threshold from settings.
2. Add a "Low stock" filter to the products list, and link the widget to it.

**Done when:** The dashboard lists products below the threshold.

**Notes (2026-10-22):**
- **Query:** `getLowStockProducts(threshold)` uses `lte` (at or below), the same rule as the P6-02 trigger and the Settings help text. It returns the first 5 plus the total count, and the threshold comes from `store_settings` (default 10 until P6-01's SQL runs).
- **Dashboard:** the `LowStock` widget is back in a third column on wide screens (wrapping to two columns below `xl`). Its badge shows the total, rows link to `/product?edit=<id>`, and "View all" goes to `/product?stock=low`.
- **Products page:** `?stock=low` filters to products at or below the threshold. A "Low stock only" / "Show all products" toggle is visible to viewers too.
- **Verified:**
  - The real catalogue query works: a count-only request shows **0 of 128** products at or below 10 today.
  - The widget was rendered with sample data on a temporary page and the screenshot reviewed (page deleted afterwards).
  - `typecheck`, lint (0 errors, warnings down to 28), 118 tests and `build` pass.

### P6-04 · Customer detail page and server-side paging
- [x] Done

**Files:** new `app/(dashboard)/customers/[id]/page.tsx`, `customers/page.tsx`, `lib/data/customers.ts`
**Steps:**
1. The detail page shows the profile, an order list, total spent and the last order date.
2. The customer list gets server-side paging and search, the same as Products. Do the same for Brands.

**Done when:** Clicking a customer opens their history, and the lists page on the server.

**Notes (2026-10-22):**
- **`/customers/[id]`:** `getCustomerDetails` in `lib/data/customers.ts` loads the profile, full name, orders and addresses in parallel. The page shows the order count, total spent (excluding cancelled orders), last order, contact details, saved addresses (default first, via `formatAddressLines`) and the order history linking to `/order/<id>`. A non-UUID or unknown id gives a 404. It has a loading skeleton.
- **Customers list:** server-side paging and search by username, email or phone, using `customerSearchPattern` as in the P5-04 order search. The username cell links to the detail page. I deliberately did not make the whole row clickable, because the edit button in the same row would then also navigate.
- **Brands list:** server-side paging and search by name, with LIKE wildcards escaped.
- **Verified:** count-only requests to Supabase accepted all 6 new queries (there are 16 customers). `typecheck`, lint (0 errors) and `build` pass.
- **Still to check when logged in:** open a customer, search customers, and page through brands.

### P6-05 · Transactional status change and stock movement
- [ ] Done

**Depends on:** P2-03. **First:** ask the owner whether the mobile app or a trigger already changes stock.
**Files:** migration (`set_order_status(order_id, new_status, admin_id)` RPC), `order/actions.ts`
**Steps:**
1. The function updates the status and inserts history in one transaction. It restores stock on `Cancelled`, and lowers it on confirm if nothing else does.
2. `updateOrderStatus` calls the RPC.

**Done when:** A status change is atomic, and stock is correct after a cancel.

**Notes (2026-10-22):**
- **Blocked on the owner** (SQL + one decision).
  - `docs/sql/P6-05-set-order-status.sql` creates `set_order_status(order, status, admin)`. It locks the order row (`FOR UPDATE`), updates the status, inserts the history row in **one transaction**, and validates the status. EXECUTE is granted to `service_role` only.
  - **Stock movement** (restore on cancel, subtract on un-cancel) is written but **commented out**. Nothing in this repo changes stock, and the mobile app or an existing trigger might, so doing it twice would corrupt inventory. The owner should confirm, then uncomment.
- **Code: done.** `updateOrderStatus` calls the function. While it's missing (`PGRST202`, confirmed on the real project today) it falls back to the previous three queries, now logging a failed history insert instead of ignoring it. `P0002` maps to "Order not found." Safe to deploy before the SQL.
- **Checks:** `typecheck`, lint (0 errors), `build` and the guard audit (21/21) pass.
- **Tick when:** the SQL is applied (and the stock decision taken), then a status change on a real order writes its history.

### P6-06 · Dashboard aggregates in SQL
- [ ] Done

**Depends on:** P3-06
**Files:** migration (`dashboard_stats(start_date)`, `revenue_series(start_date, bucket)`), `lib/data/dashboard.ts`
**Steps:**
1. Replace the in-JavaScript sums with these functions.

**Done when:** Dashboard queries return aggregates, not every order row.

**Notes (2026-10-22, from P3-06):** This is a **correctness** fix, not just performance. Supabase returns at most 1000 rows per request, so once there are more than 1000 non-cancelled orders in a period, `getDashboardStats` (total revenue) and `getRevenueData` (chart) silently sum only the first 1000. Consider doing this task early. The SQL function should bucket in `Africa/Algiers` time, like `lib/dates.ts`, and return the same day/week/month buckets so `groupRevenue`'s labels and zero-filling can stay.

**Notes (2026-10-22):**
- **Blocked on the owner (SQL only).** `docs/sql/P6-06-dashboard-aggregates.sql` creates:
  - `dashboard_stats(p_start)`: product, brand and order counts plus non-cancelled revenue.
  - `revenue_series(p_start, p_bucket, p_time_zone)`: one row per day, week (Monday) or month, bucketed in `Africa/Algiers` time and returning `bucket_start date`.
  - EXECUTE is granted to `service_role` only.
- **Code: done, safe to deploy before the SQL.** `lib/data/dashboard.ts` calls both functions through an untyped client.
  - **While they're missing** (`PGRST202`, confirmed on the real project today), it falls back to summing order rows. Those rows are now **fetched in pages of 1000**, so the 1000-row cap is fixed even without the SQL.
  - **Any other RPC error** is logged and also falls back.
- **One revenue rule everywhere:** "not cancelled" includes a NULL status (`status.is.null,status.neq.Cancelled` in the client, `is distinct from 'Cancelled'` in SQL). The real data has no NULL statuses (17 of 21 orders match either rule), so today's totals don't change.
- **`lib/dates.ts`:** `chooseRevenueBucket` and `fillRevenueBuckets` were split out of `groupRevenue`. The chart gets the same labels and zero-filled gaps whichever path ran. For "all time", the range starts at the first non-cancelled order.
  - New tests, including "matches groupRevenue for the same orders" (16 in `lib/dates.test.ts`, 121 in total).
- **Checks:** `typecheck`, lint (0 errors), tests and `build` pass.
- **Tick when:** the SQL is applied, then the dashboard totals and chart match the fallback's for each period.

### P6-07 · Image lifecycle
- [x] Done

**Files:** product and category actions
**Steps:**
1. When an image is replaced or removed, or its product or category is deleted, delete the old object from storage (parse the object path from the public URL).
2. Optional: resize images in the browser before upload.

**Done when:** Replacing an image leaves no orphaned file in the bucket.

**Notes (2026-10-22):**
- **Real buckets** (read-only check, counts only):
  - All 127 product images and all 5 category images point at this project, and no URL is used by two rows.
  - `products` holds 247 files, so **120 are already orphaned**.
  - `StaticAssests` holds 23 files, 18 of them used by no row. That bucket probably also holds the mobile app's own assets, so it needs a stricter rule.
- **New helpers:**
  - `lib/storage-path.ts` (pure) holds the targets: `PRODUCT_IMAGES` is the whole `products` bucket; `CATEGORY_IMAGES` is `StaticAssests/categories/`, a new folder for category uploads. `deletableImagePath` turns a public URL into an object path only for this project, this bucket and the target's folder. It undoes getPublicUrl's `encodeURI`, and rejects queries, empty segments and dot segments.
  - `lib/image-storage.ts` (server-only) holds `uploadImage`, which replaces the two copied upload functions and uses UUID names, and `removeUnusedImage`. Before deleting, `removeUnusedImage` counts uses in `products.product_link`, `categories.cat_image_url` and `brands.brand_image_url`. It keeps the file if any row uses it or if the check fails. It never throws.
- **Actions** (product and category):
  - The old image is deleted after a successful replace, remove or delete. A fresh upload is deleted if its insert or update fails.
  - Cleanup runs in `after()`, so it never delays or fails the save.
  - `updateProduct` and `updateCategory` now read the current URL from the database, and return "not found" for a missing record instead of reporting success. `existingImageUrl` from the form is only a keep/remove flag, so a tampered form can no longer point a record at an arbitrary URL.
- **Not done:**
  - Category images uploaded to the bucket root before this task are kept when replaced, by design.
  - The 120 existing product orphans are left alone; deleting them is the owner's call.
  - Browser-side resizing (optional step 2) is not done.
  - Brands have no image upload in the dashboard.
- **Verified:**
  - 14 new tests: URL parsing, plus the delete rules against a mocked client (in use, check failed, outside the folder, delete failed).
  - On the real data, all 127 product URLs are deletable once unused, 0 of the 5 root category URLs are, and the reference query sees a product image as used (1/0/0).
  - `typecheck`, lint (0 errors), 135 tests and `build` pass.
- **Still to check when logged in:** replace and remove a product image and a category image, then confirm the old file is gone from the bucket.

### P6-08 · Soft delete for referenced records
- [ ] Done

**Depends on:** P2-03
**Files:** migration (`is_archived` on products, brands, categories), list queries, delete actions
**Steps:**
1. Delete becomes archive. Archived records are hidden from lists and pickers but kept for old orders.
2. Confirm with the owner that the mobile app filters out archived products.

**Done when:** Deleting a product that appears in past orders no longer fails, and doesn't break those orders.

**Notes (2026-10-22):**
- **Blocked on the owner (SQL plus one decision).** `docs/sql/P6-08-soft-delete.sql` runs in one transaction. It:
  - adds `is_archived boolean not null default false` to products, brands and categories;
  - adds a partial index for active products;
  - replaces P6-06's `dashboard_stats` so archived products and brands aren't counted. So run it after P6-06.
- **Mobile app decision (step 2):** the app reads these tables directly, so it keeps showing archived rows until it filters `is_archived = false`. The SQL file explains both options: change the app's queries (recommended), or an RLS policy (commented out, because order-history joins would then return NULL).
- **Why it's needed** (real data): 44 order lines, 9 favorites and 1 saved order reference products, which is why deleting those products fails today.
- **Code: done, safe to deploy before the SQL.** `lib/archive.ts`:
  - `queryByArchived(archived, run)` runs a list query with the `is_archived` filter. If that fails with `42703` (column missing), it re-runs active lists without the filter and returns no archived list. It also reports `archiving`, so the UI shows the Archived link only once the column exists.
  - `setArchived` (untyped update) returns done / not_found / unavailable (`PGRST204`/`42703`) / failed.
  - `archiveResult` maps that to an `ActionResult`, and `hasActiveProducts` checks a brand or category.
  - Don't use `head: true` with the filter: a failed HEAD request has no error code (checked), so the dashboard counts now use `count: "exact"` with `limit(1)`.
- **Behaviour once the SQL is applied:**
  - **Deleting a product** that hits a foreign-key error archives it instead ("used by orders or favorites, so it was archived instead of deleted"). Deleting a **brand or category** archives it only when every product using it is archived; with active products the old "move or delete them first" message stays. Before the SQL, every message is unchanged.
  - **`?view=archived`** on Products, Brands and Categories lists archived rows (title "Archived …", the Add button hidden), each with a `RestoreButton` for admins. `restoreProduct`, `restoreBrand` and `restoreCategory` guard with `getAuthorizedAdmin("admin")`. The header link (`ArchiveViewLink`) appears only when `archiving` is true.
  - **Hidden when archived:** product list (including the low-stock filter), brand and category lists, the product form's pickers (an edited product's own archived category or brand still shows, via `or(is_archived.eq.false,<id>.eq.<current>)`), the dashboard's low-stock widget, and the product and brand counts in the fallback.
  - **Kept:** order pages still join archived products, so past orders show them.
  - The delete confirmations now say a referenced record is archived instead.
- **Verified:**
  - 10 unit tests for `lib/archive.ts` with a mocked client, covering both fallbacks.
  - Every loader against the real project **before** the SQL (read-only, counts only): 128 products, 10 brands, 5 categories, 0 archived, `archiving: false`, pickers 5/10, dashboard fallback 128 / 21 / 10.
  - The stricter guard check: all 28 exported server actions guard first, except login, logout and forgot-password.
  - `typecheck`, lint (0 errors, back to 27 warnings), 145 tests and `build` pass.
- **Not verified:** the path after the SQL is applied (there's no local database, see P2-06), and the archived view in a logged-in browser.
- **Tick when:** the SQL is applied and `npm run db:types` run; then deleting a product that's in an order archives it, it shows under Products → Archived, Restore brings it back, and its order still shows it.

---

## Phase 7 — Nice-to-have

### P7-01 · Audit log
- [ ] Done

**Steps:**
1. Create an `audit_log` table.
2. Call `logAudit(action, entity, id, changes)` from every mutating action.
3. Add a page that only super admins can see.

**Notes (2026-10-22):**
- **Blocked on the owner (SQL only).** `docs/sql/P7-01-audit-log.sql` creates `audit_log`:
  - columns `id`, `created_at`, `admin_id` (→ `admins`, `on delete set null`), `action`, `entity`, `entity_id` (text, since admin and customer ids are UUIDs) and `changes` (jsonb);
  - indexes on time and on (entity, id);
  - RLS on, with anon and authenticated revoked;
  - an **append-only** trigger that rejects UPDATE and DELETE.
  The real project answers `PGRST205` today.
- **Code: done, safe to deploy before the SQL.**
  - `lib/audit-changes.ts` (pure) holds the action and entity types and their labels. `diffChanges(before, after)` returns `{ field: { from, to } }` for changed fields only and shortens long text. `formatChanges` turns entries into lines like "Price: 1200 → 1500" or "Image: replaced", using readable names for the misspelled columns.
  - `lib/audit.ts`: `logAudit(adminId, action, entity, id, changes)` inserts through an untyped client inside `after()`, so it never delays or fails an action. It is silent while the table is missing (reuses `isMissingTableError`) and logs any other failure.
- **What is logged** (25 actions):
  - **Products, brands and categories:** create (key fields), update (diff of the row before and after), delete (name), archive, restore.
  - **Orders:** status change (new status), note (shortened), and **CSV export**: row count, status and dates, and whether a search was used, but not the search text, which can be a customer's name.
  - **Customer update:** which fields were saved, never their values.
  - **Own profile** (name or email diff) and **password change** (no data).
  - **Store settings** (diff), plus the team actions: create, role change (from → to), deactivate, reactivate.
  - **Not logged:** reading notifications (personal state), and login, logout and password reset (Supabase Auth already records those).
- **Side fixes:**
  - `updateBrand` and `updateAdminRole` read the record first, so a missing id now returns "not found" instead of reporting success.
  - `addProduct` and `addCategory` select the new id.
- **Page `/audit`** (`requireAdminPage("super_admin")`, plus an "Audit log" link in the Sidebar that only super admins see, via a new `minRole` on sidebar items):
  - filter chips by record type, server-side paging (50 per page), and times in Algiers time;
  - each record links to its page; numeric ids are shown, UUIDs aren't;
  - a "not set up yet" notice while the table is missing, and a skeleton `loading.tsx`.
  - The table lives in `components/audit-log-table.tsx`.
- **Verified:**
  - 10 new tests: 7 for diffing and formatting, and 3 for `logAudit` with `after()` and the client mocked.
  - A temporary preview page (deleted) rendered the audit table and the P6-08 archived-products view with sample data. The screenshots were reviewed at 1280 px and 390 px: 6 rows with readable change lines, 2 Restore buttons, no Delete in the archived view, and the "Back to active" link going to `/product`. There were 0 page errors once hydrated; an earlier hydration warning came from screenshotting before hydration.
  - The guard check passes (28 actions, only login, logout and forgot-password unguarded). `typecheck`, lint (0 errors, 27 warnings), 155 tests and `build` pass.
- **Tick when:** the SQL is applied (then `npm run db:types`). Then a product edit, a role change and an export appear at `/audit` with the right admin, and an UPDATE on `audit_log` is rejected.

### P7-02 · Reports
- [x] Done

**Steps:**
1. Show the change against the previous period on the stat cards.
2. Add a best-sellers report.
3. Add revenue by category and by brand.

**Notes (2026-10-22):**
- **Done, with optional SQL for the owner.** `docs/sql/P7-02-reports.sql` adds two functions, both service_role only:
  - `period_totals(start, end)`: orders and non-cancelled revenue in a window;
  - `sales_by(group, start, end)`: units and sales per product, category or brand.

  Until they exist (`PGRST202`), the code computes the same figures from rows in pages of 1000, so the SQL is only a performance step and doesn't block the feature.
- **Previous period** (`lib/reports.ts`):
  - `previousPeriod` is the window of the same length just before the period, calendar-aware: `getPeriodStart(period, getPeriodStart(period, now))`. `percentChange` returns null when the previous value is 0, and `formatPercentChange` gives "+12%", "−4%" or "+3.3%".
  - On the dashboard, `getPreviousPeriodTotals` feeds `StatsCards`. Revenue and orders show the change "vs previous 7 days / month / 3 months / year"; "All time" keeps the old descriptions.
  - The arrow and sign carry the direction, with green and red only on the white cards (the blue card stays white). "No earlier data to compare" appears when the previous window is empty.
  - The old card always showed a decorative TrendingUp arrow; it was removed because it suggested a trend that wasn't measured.
- **`/reports`** (all roles, period filter shared with the dashboard; `DashboardFilter` now keeps the current path):
  - a best-sellers table (top 10 by sales, with units; the name searches the product list);
  - "Sales by category" and "Sales by brand" as ranked horizontal bar lists (`SalesBarList`). Following the dataviz guidance: one series in one colour (primary, validated against the light surface: all checks pass); 8 px bars from a square baseline with a 4 px rounded end; a track in a light step of the same hue; values as text on every row (so the list is its own table view); a hover title; and the tail folded into "Other (n)" after 8 rows.
  - Also: a Sidebar link, `loading.tsx`, and a shared `formatDA` (`lib/money.ts`).
- **Definitions** (shown on the page):
  - **Sales** = order lines (quantity × `unit_price`) from orders that weren't cancelled.
  - **Real data:** sales total **92,132 DA against 99,132 DA of revenue**, because 14 of the 17 orders have a total 500 DA above their lines, probably delivery. The two are labelled differently so nobody expects them to match.
- **Verified:**
  - 8 tests for `lib/reports.ts`.
  - The loaders against the real project (read-only, aggregates): for every period, product, category and brand sales each sum to 92,132 DA and 316 units. The previous windows are correct: last 3 months → the window before had 1 order / 9,294 DA, so −100%; last year → nothing before, so no comparison.
  - A temporary preview page (deleted) with real report data and sample changes. Screenshots at 1440 px and 390 px were reviewed: deltas, bars, the empty state and long product names wrap without overflow, with 0 page errors.
  - `typecheck`, lint (0 errors, 26 warnings), 163 tests and `build` pass.

### P7-03 · Bulk actions and product import
- [x] Done

**Steps:**
1. Add row selection in the data table.
2. Add bulk delete or archive, and bulk status update.
3. Add CSV import of products, with a preview step before saving.

**Notes (2026-10-22):**
- **Row selection** (`components/data-table.tsx`, `components/table-selection.tsx`):
  - A new `bulkActions` prop adds a checkbox column. The header checkbox selects the page and shows a dash when part of it is selected.
  - Row ids come from `id`, and a bar shows "N selected", the page's buttons and "Clear selection".
  - The buttons are a client element that reads the ids with `useTableSelection()`, because a server page can't pass a render function.
  - The selection resets whenever `data` changes (paging, filters, or the refresh after an action). Checkbox clicks don't reach rows that are links (orders).
  - Pages pass `bulkActions` only to admins, so viewers get no checkboxes.
- **Bulk actions:**
  - **Products:** delete, which archives products still used by orders or favorites, the same as the row action. In the Archived view, restore.
  - **Orders:** "Set status" with a confirmation.
  - The server actions (`deleteProducts`, `restoreProducts`, `updateOrdersStatus`) guard first, accept 1–100 ids (`parseBulkIds`), and run each item through the same helper as the row action. That helper is `removeProduct` or `changeOrderStatus`, both split out of the single actions, so status history, image cleanup and audit entries stay per item.
  - The result is summarised by `bulkResult`, e.g. "Deleted 2 products and archived 1 …" or "… 1 failed: #9: Order not found.", and fails if anything failed.
- **CSV import** (`/product/import`, admins; an "Import" button next to "Add Product"):
  - `parseCsv` (in `lib/csv.ts`) handles RFC 4180 quoting and auto-detects `;`, which French Excel uses.
  - `lib/product-import.ts` maps English or French headers, resolves categories and brands by name (ignoring case and accents) or id, and parses "1 200,50"-style numbers. Each row is validated with the product form's own `productSchema`.
  - Rows are rejected for a name already in the catalogue or repeated in the file. Descriptions become escaped `<p>` paragraphs. Limits: 500 rows, 1 MB.
  - `previewProductImport` returns every row with its problems. `importProducts` **re-reads and re-checks the file on the server**, inserts the valid rows in one insert, and logs one audit entry (`import`, rows/skipped).
  - The template download uses the store's own first category and brand: "Bosch" from an earlier draft isn't a brand here, which the live check caught.
- **Verified:**
  - 24 new tests: 5 `parseCsv` (including reading back what `toCsv` writes), 6 import, and 5 bulk helpers. The rest are earlier test files that grew.
  - The import check against the real catalogue (read-only): 5 categories, 10 brands, 128 names; a ready row, an existing name, and an unknown brand were each reported correctly.
  - A temporary preview page (deleted), driven with Playwright, passed 11 checks with 0 page errors: the bar appears and counts, the indeterminate header, select all, the confirmation text, clear, ticking an order row doesn't navigate, Apply is disabled until a status is chosen, the template's content, and **the preview action answers "Not authorized" without a session**. Screenshots were reviewed.
  - The guard check passes (33 actions). `typecheck`, lint (0 errors, 26 warnings), 179 tests and `build` pass.
- **Still to check when logged in:** run a real bulk delete and status change, and import a small file.

### P7-04 · Arabic and French interface
- [ ] Done

**Steps:**
1. Add `next-intl` with English, French and Arabic.
2. Add right-to-left layout for Arabic.
3. Add a language picker in the profile.

**Split into sub-tasks (2026-10-22)**, one commit each. There are several hundred strings, and every screen should keep working between commits:
- [x] **P7-04a · Foundation and shell.**
  - `next-intl` 4 without locale URLs: the locale comes from a `NEXT_LOCALE` cookie, then `Accept-Language`, then English.
  - `messages/{en,fr,ar}.json`, with typed keys (`AppConfig`) and a test that all three files have the same keys and placeholders.
  - `<html lang dir>`, and an Arabic font fallback (Outfit has no Arabic glyphs).
  - A language picker in the sidebar's profile menu and on the login page.
  - **RTL:** physical Tailwind classes (`pl-`, `ml-`, `left-`, `text-left`, `border-r` …) become logical ones (`ps-`, `ms-`, `start-`, `text-start`, `border-e` …) across the app, and direction arrows flip.
  - **Translated:** sidebar and mobile menu, `DataTable` chrome (filter, pagination, selection bar), confirm dialog, login, forgot and reset password, and the error and not-found pages.
- [x] **P7-04b · Dashboard and admin screens:** dashboard widgets, reports, settings (password and store forms), profile dialog, team, audit log, notifications panel.
- [x] **P7-04c · Catalogue and orders:** products (columns, form, import, bulk), brands, categories, orders (list, detail, notes, timeline, status, bulk) and customers.
- [ ] **P7-04d · Messages from the server:** server-action results (toasts) and validation messages through `getTranslations`.

The printed invoice stays as it is: its language is a store decision, not an admin preference.

**P7-04a notes (2026-10-22):**
- **Built as planned.** One deliberate English change: the sidebar's "Branding" is now "Brands", and "Order" is now "Orders", matching the page titles.
- **RTL sweep:** a token-aware script converted 37 files to logical utilities. It left alone dialog centring and the printed invoice, which is `dir="ltr"`, as is the revenue chart.
  - The mobile drawer gets `rtl:max-lg:translate-x-full`.
  - Back arrows, pagination and submenu chevrons, and the timeline arrow get `rtl:rotate-180`.
  - `global-error.tsx` stays English: it renders outside the layout, without translations.
- **Verified:**
  - Tests for `lib/i18n.ts`, and `lib/messages.test.ts`: same keys, same placeholders, every message formats in its language. A deliberately broken message was confirmed to fail the check.
  - Playwright against the real `/login` (15 checks, 0 page errors besides the intentional 404 request):
    - lang, dir and the heading in en, fr and ar;
    - Accept-Language picks Arabic when there's no cookie;
    - the picker switches to French without a reload, stores the cookie, and keeps it after a reload;
    - an unknown cookie value falls back to English;
    - the 404 page in French.
  - A temporary preview (deleted) of the sidebar and table in Arabic: the sidebar on the right, the Arabic plural "عنصر واحد محدد", the mobile button and drawer on the right, and the pagination chevrons rotated with "first page" on the right. Screenshots were reviewed.
  - `typecheck`, lint (0 errors, 26 warnings), 187 tests, `build` and `npm audit --omit=dev` (0) pass.
- **For P7-04c:** in RTL, an amount like "12500,00 DA" is reordered by the bidi algorithm to "DA 12500,00". Wrap amounts and other mixed number-and-Latin values in `dir="ltr"` when those columns are translated.

**P7-04b notes (2026-10-22):**
- **Translated:** dashboard (cards, period filter, chart, recent orders, low stock), reports, settings (both forms), profile and its dialog, team (page, card, new-admin form), audit log, and the notifications panel. New namespaces: `roles`, `orderStatus`, `dashboard`, `reports`, `settings`, `profile`, `team`, `audit`, `notifications`.
- **English label maps in `lib` replaced by message keys:**
  - `ROLE_LABELS`, `AUDIT_*_LABELS` and `COMPARISON_LABELS` are gone. `lib/audit-changes.ts` now has `AUDIT_ACTIONS`, `AUDIT_ENTITIES` and `FIELD_KEYS`.
  - `formatChanges(changes, labels)` takes the translated words, including the "{field}: {value}" line and the "{from} → {to}" arrow. The arrow is reversed in Arabic, and French puts a non-breaking space before the colon.
  - Report rows mark `missing` and `other` instead of English labels.
- **Numbers and dates:**
  - `intlLocale` maps en, fr and ar to en-US, fr-DZ and ar-DZ (Latin digits).
  - Chart labels, audit times, join dates and notification times follow the language.
  - `formatDA` wraps amounts in left-to-right isolates, so "12 500 DA" keeps its order in Arabic.
  - Order statuses are now shown translated: "processing" is displayed as "Processing" / "En traitement" / "قيد المعالجة".
- **Verified:**
  - A temporary preview page (deleted) rendered every translated component in Arabic and French, and the screenshots were reviewed. A scan of each found none of the old English strings left, with 0 page errors.
  - The preview caught the Arabic arrow pointing the wrong way, which is fixed.
  - `typecheck`, lint (0 errors, 26 warnings), 189 tests and `build` pass.


**P7-04c notes (2026-10-23):**
- **Translated:**
  - **Products:** list, columns, form, image upload, bulk bar, and the import page and its preview.
  - **Brands and categories.**
  - **Orders:** list, status tabs, date filter, CSV button, bulk bar, row menu, detail page, notes, timeline and status buttons.
  - **Customers:** list, columns, detail page and edit form.
  - **Shared pieces:** the archive link and restore button, the editor toolbar (new aria-labels), and the dialog's hidden "Close" label.

  New namespaces: `archive`, `image`, `editor`, `products`, `brands`, `categories`, `orders`, `customers`.
- **Column headers** are small components (`ColumnLabel`), because the column arrays are module constants. TanStack renders header and cell functions as components, so they can call `useTranslations`. The action cells moved into components too (`ProductActions`, `BrandActions` and so on).
- **Money and dates:**
  - `formatPrice` (with centimes, isolated left to right) replaces the four inline `Intl.NumberFormat` / `toLocaleString() DZD` formats. This fixes the "DA 12500,00" reordering in Arabic noted in P7-04a.
  - `formatDate(value, locale, withTime)` in `lib/i18n.ts` (tested) shows dates in Algiers time, in the admin's language.
  - Phone numbers are `dir="ltr"`.
- **Not translated yet (P7-04d):** text that comes from the server: action toasts, validation errors, and the import preview's row errors and summary.
- **Verified:**
  - A temporary preview page (deleted) rendered all the translated tables, forms, notes, timeline and status buttons in Arabic and French, with 0 page errors. Screenshots were reviewed.
  - A scan of the page text and labels found no English left. The French "Description" and "Action" hits are the same words in French.
  - `typecheck`, lint (0 errors, 25 warnings), 190 tests and `build` pass.

### P7-05 · Full dark mode
- [ ] Done

**Depends on:** P4-05
**Steps:**
1. Make every surface use tokens.
2. Add a theme toggle in the sidebar menu.
3. Re-enable system theme detection.

---

## Template for new work

Copy this block into the right phase, numbering after the last task in that phase:

```md
### P<phase>-<nn> · <short title>
- [ ] Done

**Why:** <user need or gap-analysis finding>
**Depends on:** <task IDs or "—">
**Files:** <files to create or change>
**Steps:**
1. <small, concrete step>
2. <…>

**Done when:** <observable result that proves it works>
```
