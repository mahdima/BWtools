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
- [ ] Done

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

### P3-06 · Revenue chart grouping and shared date ranges
- [ ] Done

**Files:** new `lib/dates.ts` (+ test), `app/(dashboard)/actions.ts`
**Steps:**
1. Add `getPeriodStart(period)` to replace the two copies of the date-range logic.
2. Group revenue by `YYYY-MM-DD` for ranges up to 90 days, and by month beyond that. Labels must include the year where needed.

**Done when:** "All time" no longer adds together the same calendar day from different years.

### P3-07 · Small fixes
- [ ] Done

**Files:** `components/ProductForm.tsx`, `order/[id]/page.tsx`, `settings/page.tsx`
**Steps:**
1. Use `??` instead of `||` for the price and quantity default values.
2. On the order page, use `notFound()` for a missing order and guard against a null `total`.
3. Show the real role on the Settings page using `getCurrentAdmin()`.

**Done when:** All three behave correctly, as checked manually.

### P3-08 · Database-generated brand IDs (needs owner)
- [ ] Done

**Depends on:** P2-03
**Files:** a new migration, `brand/actions.ts`
**Steps:**
1. Write a migration that makes `brands.brand_id` an identity column starting at the current max + 1. Ask the owner to apply it.
2. Remove the max + 1 calculation from `addBrand`.

**Done when:** Adding a brand no longer computes the ID in app code.

### P3-09 · Adding a team member fails
- [ ] Done

**Why:** Bug, also on `master`: `createAdmin` inserts `email` into `admins`, but the table has no such column (`id, full_name, role, is_active, created_at, updated_at`). The insert fails with `42703: column "email" of relation "admins" does not exist`, and the new auth user is rolled back. Found on 2026-10-22 while granting access by hand.
**Depends on:** —
**Files:** `app/(dashboard)/team/actions.ts`
**Steps:**
1. Remove `email` from the `admins` insert in `createAdmin`. The email stays on the auth user, where `getCurrentAdmin()` already reads it.

**Done when:** A super admin can add a member from `/team/new`, and the new member can sign in.

**Notes (2026-10-22, from P2-03):** For the same reason, the Team page shows **no email** on any member card: `getTeamMembers` reads `admins.*`, which has no email. Consider loading emails from the auth users (for example `supabaseAdmin.auth.admin.listUsers()`, mapped by id) in `getTeamMembers`. The card's `email` prop is optional for now.

### P3-10 · Show validation errors on add/edit forms
- [ ] Done

**Why:** Split from P3-01. Since P2-04, the product, brand, new-admin and order-note actions validate input, but they report problems by throwing. In production, Next.js replaces a thrown message with a generic error screen, so users never see "Price must be greater than 0."
**Depends on:** P3-01
**Files:** `addproduct/actions.ts` (`addProduct`, `updateProduct`), `brand/actions.ts` (`addBrand`, `updateBrand`), `team/actions.ts` (`createAdmin`), `order/actions.ts` (`addOrderNote`), `components/ProductForm.tsx`, `components/BrandForm.tsx`, `app/(dashboard)/team/new/page.tsx` (form moves to a client component), `components/order-notes.tsx`
**Steps:**
1. Make these actions return an `ActionResult` for validation and database errors. Keep `redirect()` on success, which `useActionState` follows.
2. Wrap each form's action in `useActionState`, show the message inline above the submit button, keep the user's input, and disable the button while pending.
3. In `OrderNotes`, use `runWithToast` instead of `console.error`.

**Done when:** Submitting each form with bad input shows the specific message, and the form keeps what was typed.

---

## Phase 4 — Clean up

### P4-01 · Category image upload in the live modal
- [ ] Done

**Why:** The legacy page could upload category images; the modal cannot. This must be done before the legacy code is deleted.
**Files:** `components/CategoryForm.tsx`, `categories/actions.ts`, `categories/columns.tsx`
**Steps:**
1. Port the `StaticAssests` upload from `addcategory/actions.ts` into `categories/actions.ts`, using `supabaseAdmin`, the role guard and upload validation.
2. Add an image picker to the modal, and an image thumbnail column to the table.

**Done when:** You can add and change category images from the Categories page.

**Notes (2026-10-22, from P2-03):** `brands` also has a `brand_image_url` column that the dashboard never sets. Consider the same picker for brands.

### P4-02 · Delete legacy and dead code
- [ ] Done

**Depends on:** P4-01, P1-07
**Files to delete:** `app/(dashboard)/addproduct/page.tsx`, `editproduct/[id]/page.tsx`, `addcategory/page.tsx`, `addcategory/actions.ts`, `editcategory/[id]/page.tsx`, `Navbar.tsx`, `item.tsx`, `CategoryImageUpload.tsx` (if no longer used), `utils/supabase/client.ts`. (`AuthProvider.tsx` and `ProtectedRoute.tsx` were already deleted in P2-01.)
**Steps:**
1. Move the product actions from `addproduct/actions.ts` to `product/actions.ts` and update the imports.
2. Delete the files listed above.
3. Uninstall `dotenv`, `@types/dotenv` and `@tiptap/extension-image`.
4. Update CLAUDE.md, which still mentions the legacy routes.

**Done when:** The build passes and none of the deleted paths are referenced anywhere.

### P4-03 · Data-access layer
- [ ] Done

**Files:** new `lib/data/{products,brands,categories,orders,customers,admins,dashboard}.ts`, the pages, `app/(dashboard)/actions.ts`
**Steps:**
1. Move all read queries into `lib/data/*`, using `server-only` and typed clients.
2. Leave only mutations in the `actions.ts` files.
3. Use `Promise.all` for independent fetches on the dashboard, order and team pages.
4. Update the Architecture section of CLAUDE.md.

**Done when:** No page imports `supabaseAdmin` directly, and the build passes.

### P4-04 · One dialog component and accessibility basics
- [ ] Done

**Files:** `components/Modal.tsx`, `CategoryForm.tsx`, `CustomerForm.tsx`, `profile-edit-dialog.tsx`, the column files
**Steps:**
1. Run `npx shadcn@latest add dialog` and migrate all four modal patterns to it.
2. Add an `aria-label` to every icon-only button, and `htmlFor`/`id` pairs to form labels and inputs.

**Done when:** Every dialog traps focus and closes with Escape, and icon buttons have accessible names.

### P4-05 · Design tokens and forced light theme
- [ ] Done

**Files:** `app/globals.css`, `app/layout.tsx`, every component that uses `#0B1DFF` / `#0b1dff`
**Steps:**
1. Map the brand blue onto `--primary` (and a `--brand` token if needed) in `globals.css`.
2. Replace the 83 hard-coded hex usages with `bg-primary`, `text-primary` and similar.
3. Set `defaultTheme="light"` and `enableSystem={false}` until P7-05.

**Done when:** `grep -ri "#0b1dff" app components` returns nothing, and the UI looks the same.

### P4-06 · Logging cleanup and Next 16 conventions
- [ ] Done

**Steps:**
1. Remove debug `console.log` calls and keep `console.error` calls that give context.
2. If `next build` warns that `middleware.ts` is deprecated, rename it to `proxy.ts` as the Next 16 docs describe.
3. Let `/robots.txt` (and `/icon.png`, if needed) through the middleware without a session. Today crawlers are redirected to `/login` and never see the robots file.

**Done when:** There are no debug logs and no build warnings.

---

## Phase 5 — Must-have features

### P5-01 · Forgot and reset password
- [ ] Done

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

### P5-02 · Permission-aware UI
- [ ] Done

**Depends on:** P1-05
**Files:** new `components/admin-provider.tsx` (client context), `app/(dashboard)/layout.tsx`, the column files, page headers
**Steps:**
1. The layout passes `{ role }` to an `AdminProvider`. Add a `useAdmin()` hook and a `<Can minRole="admin">` wrapper.
2. Hide the Add, Edit, Delete and status buttons for viewers. Server checks from P1-05 stay as the real protection.

**Done when:** A viewer sees a read-only dashboard.

### P5-03 · Error and not-found pages
- [ ] Done

**Files:** new `app/error.tsx`, `app/(dashboard)/error.tsx`, `app/not-found.tsx`, `app/global-error.tsx`
**Steps:**
1. Build branded error pages with a "Try again" button (calling `reset()`) and a link to the dashboard.
2. Make pages with unknown IDs (order, product edit, brand edit) call `notFound()`.

**Done when:** A thrown error or a bad URL shows the branded page instead of the Next.js default.

### P5-04 · Order search by customer and date range
- [ ] Done

**Depends on:** P2-03, P3-02
**Files:** a migration (view `orders_with_customer` joining `profiles` and the auth email), `getOrders`, `order/page.tsx`, `components/data-table.tsx`
**Steps:**
1. **Needs owner:** apply the view migration, granted to `service_role` only.
2. Search by order number, customer name, phone or email, and add `from`/`to` date inputs stored in the URL.

**Done when:** You can find an order by customer phone, and filter by date range combined with status.

### P5-05 · Loading skeletons
- [ ] Done

**Files:** a `loading.tsx` in each dashboard route
**Steps:**
1. Add skeletons shaped like each page (table rows, stat cards, order detail) using `components/ui/skeleton.tsx`.

**Done when:** Navigating between pages shows a skeleton instead of a frozen screen.

---

## Phase 6 — Should-have features

### P6-01 · Store settings
- [ ] Done

**Depends on:** P2-03
**Files:** migration (`store_settings` single-row table: name, email, phone, address, `low_stock_threshold`, invoice footer), `settings/page.tsx` + action, `invoice-printable.tsx`
**Steps:**
1. A super admin edits the settings under Settings > General.
2. The invoice header and footer read from the table.

**Done when:** Nothing store-specific is hard-coded anymore.

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

### P6-03 · Low-stock widget
- [ ] Done

**Depends on:** P6-01
**Files:** `app/(dashboard)/page.tsx`, `components/low-stock.tsx`, `getLowStockProducts`, `product/page.tsx`
**Steps:**
1. Re-enable the widget using the threshold from settings.
2. Add a "Low stock" filter to the products list, and link the widget to it.

**Done when:** The dashboard lists products below the threshold.

### P6-04 · Customer detail page and server-side paging
- [ ] Done

**Files:** new `app/(dashboard)/customers/[id]/page.tsx`, `customers/page.tsx`, `lib/data/customers.ts`
**Steps:**
1. The detail page shows the profile, an order list, total spent and the last order date.
2. The customer list gets server-side paging and search, the same as Products. Do the same for Brands.

**Done when:** Clicking a customer opens their history, and the lists page on the server.

### P6-05 · Transactional status change and stock movement
- [ ] Done

**Depends on:** P2-03. **First:** ask the owner whether the mobile app or a trigger already changes stock.
**Files:** migration (`set_order_status(order_id, new_status, admin_id)` RPC), `order/actions.ts`
**Steps:**
1. The function updates the status and inserts history in one transaction. It restores stock on `Cancelled`, and lowers it on confirm if nothing else does.
2. `updateOrderStatus` calls the RPC.

**Done when:** A status change is atomic, and stock is correct after a cancel.

### P6-06 · Dashboard aggregates in SQL
- [ ] Done

**Depends on:** P3-06
**Files:** migration (`dashboard_stats(start_date)`, `revenue_series(start_date, bucket)`), `lib/data/dashboard.ts`
**Steps:**
1. Replace the in-JavaScript sums with these functions.

**Done when:** Dashboard queries return aggregates, not every order row.

### P6-07 · Image lifecycle
- [ ] Done

**Files:** product and category actions
**Steps:**
1. When an image is replaced or removed, or its product or category is deleted, delete the old object from storage (parse the object path from the public URL).
2. Optional: resize images in the browser before upload.

**Done when:** Replacing an image leaves no orphaned file in the bucket.

### P6-08 · Soft delete for referenced records
- [ ] Done

**Depends on:** P2-03
**Files:** migration (`is_archived` on products, brands, categories), list queries, delete actions
**Steps:**
1. Delete becomes archive. Archived records are hidden from lists and pickers but kept for old orders.
2. Confirm with the owner that the mobile app filters out archived products.

**Done when:** Deleting a product that appears in past orders no longer fails, and doesn't break those orders.

---

## Phase 7 — Nice-to-have

### P7-01 · Audit log
- [ ] Done

**Steps:**
1. Create an `audit_log` table.
2. Call `logAudit(action, entity, id, changes)` from every mutating action.
3. Add a page that only super admins can see.

### P7-02 · Reports
- [ ] Done

**Steps:**
1. Show the change against the previous period on the stat cards.
2. Add a best-sellers report.
3. Add revenue by category and by brand.

### P7-03 · Bulk actions and product import
- [ ] Done

**Steps:**
1. Add row selection in the data table.
2. Add bulk delete or archive, and bulk status update.
3. Add CSV import of products, with a preview step before saving.

### P7-04 · Arabic and French interface
- [ ] Done

**Steps:**
1. Add `next-intl` with English, French and Arabic.
2. Add right-to-left layout for Arabic.
3. Add a language picker in the profile.

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
