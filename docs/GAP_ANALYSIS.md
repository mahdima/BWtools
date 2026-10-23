# BW Tools Dashboard — Gap Analysis

As of 2026-10-22 · reviewed at commit `9343a11` (local `master`)

## Summary

BW Tools Dashboard is a Next.js 16 + Supabase admin panel for the BW Tools mobile store. It manages products, brands, categories, orders (status, notes, timeline, invoices), customers, the admin team and notifications. Core create/edit screens work and the UI is fairly complete. **Access control, however, is broken: any account in the Supabase project can sign in and make itself super admin.**

Top risks:

1. **Self-promotion to `super_admin`** through the profile form (critical).
2. **Any Supabase user can log in**, including mobile-app customers, and every action runs with the service-role key (critical).
3. **Roles and `is_active` are never enforced** outside the Team page (high).
4. **Broken day-to-day features:** order search fails, CSV export covers one page only, and notifications are never generated.
5. **No safety net:** there are no tests, no linter, no CI and no versioned database schema, so every change is checked by hand on production.

The fix order is in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

## Security and access control

Anyone who can sign in to the Supabase project can take full control of the dashboard today. Access control has to be fixed before any new feature ships.

| Severity | Issue | Where | Fix |
| --- | --- | --- | --- |
| Critical | Any signed-in user can promote themselves to `super_admin`. The profile form sends `role` and the action upserts it into `admins`. | `app/(dashboard)/profile/update-actions.ts:30`, `components/profile-edit-dialog.tsx:111` | Remove `role` from the self-service form and action. Only `updateAdminRole` (super admin only) should change roles. |
| Critical | Login is not limited to admins. Login and middleware only check for a Supabase session, so any account in the project, including mobile-app customers, gets in with service-role access to every action. | `app/login/actions.ts`, `utils/supabase/middleware.ts` | After sign-in, require an active row in `admins`, otherwise sign out and reject. Check again in the dashboard layout and in every action. |
| High | Roles are never enforced outside Team. A `viewer` can create, edit and delete products, brands, categories, orders and customers. | Every `actions.ts` except `team/actions.ts` | Add one shared `requireRole()` guard and call it first in every mutating action. |
| High | Deactivated admins keep full access. `is_active` is written and displayed but never checked. | `team/actions.ts` (`deactivateAdmin`) | Check `is_active` in the guard, and ban the auth user on deactivate. |
| Critical | **Confirmed 2026-10-22:** the public anon key, which ships inside the mobile app, can read every row of `profiles_with_email` (16 customers' emails and phones) and of `profiles`. The dashboard depended on this access. A query on `admins` with the anon key returns HTTP 500, which suggests a broken RLS policy. | `app/(dashboard)/customers/page.tsx:8`, Supabase grants and RLS | The code no longer uses the anon key (P1-07). Revoke anon access to the view and fix the `profiles` policy: see `docs/sql/P1-07-restrict-anon-access.sql`. |
| Medium | The service-role client has no `server-only` guard. One accidental import into a client component would ship the key to browsers. | `lib/supabaseAdmin.ts` | Add `import "server-only"`. |
| Medium | Server actions trust form input: no schema validation, unchecked `parseInt`, any string accepted as an order status or role, and no server-side type or size check on uploads. | `addproduct/actions.ts`, `order/actions.ts`, `team/actions.ts` | Validate with zod, whitelist statuses and roles, and check MIME type and size before uploading. |
| High | Vulnerable dependencies. `npm audit` (2026-10-22) reports 11 vulnerabilities: a critical denial-of-service in `next@16.1.1`, and high-severity issues in the editor stack (`prosemirror-view` XSS on paste, `@tiptap/core`, `markdown-it`), `postcss`, `sharp` and `ws`. | `package.json` | Update to patched versions; every fix is within the current major version. |
| Low | Any admin can mark anyone's notification as read. Login logs the email address to the server console. Password rules differ: 6 characters in Settings, 8 for new admins. | `notifications/actions.ts` (`markNotificationAsRead`), `login/actions.ts`, `settings/actions.ts` | Filter by `admin_id`, remove personal data from logs, and use one password policy of at least 8 characters. |

## Bugs in the current code

The review found 14 defects, two of them confirmed later from the generated schema types. Order search and adding team members are broken outright, and several bugs lose or misreport data. Rows marked "verify" depend on table columns that only the Supabase project can confirm.

| Severity | Bug | Where | Fix |
| --- | --- | --- | --- |
| High | Order search never works. `textSearch("id", …)` runs a full-text query on the numeric `id` column, so the query errors and the table shows "No results". | `app/(dashboard)/actions.ts` (`getOrders`) | Use `.eq("id", Number(search))` when the input is numeric, or search by customer instead. |
| High | Product and brand delete buttons act on the first click with no confirmation, and failures are thrown away without telling the user. | `product/columns.tsx`, `brand/columns.tsx` | Add a confirm dialog and a toast for success or error. |
| Medium | Export CSV only exports the 20 orders on the current page, and values containing quotes or line breaks corrupt the file. | `order/page.tsx`, `components/csv-exporter.tsx` | Add a server action that exports every order matching the filter, with proper CSV escaping. |
| Medium | Invoices are wrong (**confirmed from the schema**). `order_items` has only `unit_price`, so the invoice's `item.price` falls back to the product's *current* price. `orders` has no customer or address columns, so "Bill To" always reads "Guest Customer". | `app/invoice/[id]/page.tsx`, `components/invoice-printable.tsx` | Share one loader between the two pages and use `unit_price`; take the customer from `profiles_with_email` and the address from `addresses`. |
| Medium | **The shipping address is never shown.** It is stored in `addresses` (via `orders.address_id`), but the order page reads `profile.address` / `profile.city`, which don't exist. | `order/[id]/page.tsx` | Join `addresses` in the order loader (P3-05). |
| Medium | **Adding a team member fails, and the Team page shows no emails.** `createAdmin` inserts `email` into `admins`, which has no such column; the team cards read the same missing field. | `team/actions.ts` | Drop `email` from the insert, and load emails from the auth users (P3-09). |
| Medium | The order status filter resets on reload or Back. The table starts with no filter and then deletes `status` from the URL. | `components/data-table.tsx:161` | Initialise column filters from the URL. |
| Medium | New-order and low-stock notifications are never created. `notifyNewOrder` and `createNotification` are not called anywhere, so the bell only shows rows inserted from outside this repo. | `notifications/actions.ts` | Create them from a Supabase database trigger or webhook when an order is inserted or stock drops. |
| Low | The revenue chart groups by "Mon D" with no year, so for Last year and All time the same day in different years is added together. | `app/(dashboard)/actions.ts` (`getRevenueData`) | Group by ISO date, and by week or month for long ranges. |
| Low | Deleting a category or brand that still has products fails silently: the error is returned or thrown and never shown. | `categories/columns.tsx`, `brand/columns.tsx` | Show the error, or block the delete when products still reference it. |
| Low | The product form shows a blank Price or Quantity when the value is 0 (`value \|\| ""`), so an out-of-stock product cannot be saved without retyping 0. | `components/ProductForm.tsx:99`, `:118` | Use `??` instead of `\|\|`. |
| Low | Brand IDs are computed in app code as max + 1, so two admins adding brands at the same moment collide. | `brand/actions.ts:15` | Use an identity column in the database. |
| Low | The order page crashes when `total` is null, and a missing order renders plain text instead of a 404. | `order/[id]/page.tsx:221`, `:115` | Guard the total and call `notFound()`. |
| Low | Settings always shows the role "Admin" (hard-coded), and the profile dialog offers an `editor` role that nothing else recognises. | `settings/page.tsx:53`, `components/profile-edit-dialog.tsx:117` | Read the real role and keep one list of roles in shared code. |

## Missing features

The catalogue and order screens work, but day-to-day operations are missing: account recovery, useful search, alerts, and customer history. Each item below is based on something seen in the code. The access-control fixes are listed under Security and are not repeated here.

| Priority | Feature | Gap today |
| --- | --- | --- |
| Must have | Forgot-password and reset-password flow | The login page has none, and its "Contact Support" link points to `#`. A locked-out admin needs database access to get back in. |
| Must have | Permission-aware UI | Viewers see every Add, Edit and Delete button. Only the Team page hides actions by role. |
| Must have | Error and not-found pages | There is no `error.tsx` or `not-found.tsx` anywhere. A thrown action error shows Next.js's default crash screen. |
| Must have | Confirmations and feedback on every change | Only category delete asks for confirmation. Feedback is a mix of toasts, inline messages and `alert()`. |
| Must have | Real order search and filters | Orders cannot be found by customer name, phone or date range, and ID search is broken. |
| Should have | Working notifications (new order, low stock) | The bell, table and helpers exist, but nothing creates notifications. |
| Should have | Low-stock alerts on the dashboard | The `LowStock` widget and its query exist but are commented out, and the threshold is hard-coded at 10. |
| Should have | Customer detail page | The customer list has no order history, total spent or last order date, and loads every customer at once with no paging. |
| Should have | Stock movement on orders | No code in this repo lowers stock on a sale or restores it when an order is cancelled (verify whether the mobile app or a database trigger does). |
| Should have | Category images in the live screen | The legacy page uploaded category images to `StaticAssests`, but the current category modal only edits the name. |
| Should have | Store settings | Store name, contact email and invoice header are hard-coded ("BW Tools", `contact@bwtools.com`). |
| Nice to have | Audit log of admin actions | Only order status changes are recorded. Product, price, stock and role changes leave no trace. **Code ready (P7-01):** every dashboard change and order export is logged and shown at `/audit` once the owner applies `docs/sql/P7-01-audit-log.sql`. |
| Nice to have | Reports | There is no comparison with the previous period, no best sellers and no revenue by category or brand. The stat cards show totals with no trend. **Done (P7-02):** the stat cards show the change against the previous period, and `/reports` adds best sellers and sales by category and brand. **Found:** order totals are 500 DA above their lines on 14 of 17 orders (probably delivery), so sales by product add up to 7,000 DA less than revenue. |
| Nice to have | Bulk actions and import | There is no bulk delete, bulk status update or CSV import of products. **Done (P7-03):** row selection with bulk delete / restore for products and bulk status change for orders, plus CSV import of products with a checked preview (`/product/import`). |
| Nice to have | Arabic and French interface | Prices are formatted for Algeria (`fr-DZ`, DZD) but the interface is English only, with no right-to-left support. |

## Code quality, tooling and maintainability

The project has no safety net. With no tests, no linter, no CI and no versioned database schema, every change is checked by hand on the live site.

| Area | Today | What to add |
| --- | --- | --- |
| Tests | None. There is no test runner or test file. | Vitest for server actions and helpers; Playwright for login, product add/edit and order status. |
| Lint and format | No ESLint config or lint script (Next 16 removed `next lint`). | ESLint flat config with `eslint-config-next`, Prettier, and `npm run lint` / `typecheck` scripts. |
| CI | No `.github/workflows`. Vercel deploys whatever is pushed to `master`. | A GitHub Action that runs typecheck, lint, tests and build on every pull request. |
| Database schema | Tables, views, row-level security and buckets exist only in the Supabase project. No migrations are in the repo. | Run `supabase init` and pull the schema into `supabase/migrations`, so changes are reviewed like code. |
| Types | Queries are untyped, with 28 uses of `any`. Typos such as `in_stock_vailable` spread unchecked. | Generate types with `supabase gen types` and pass them to `createClient<Database>()`. |
| Validation | Form data is cast with `as string` and `parseInt` with no checks. | Shared zod schemas per entity, used by both forms and actions. |
| Dead code | About 850 lines: legacy add/edit pages and `addcategory/actions.ts`, `AuthProvider`, `ProtectedRoute`, `Navbar`, `CategoryImageUpload`, `utils/supabase/client.ts`. (Resolved in P2-01, P3-10 and P4-02. `item.tsx` was listed by mistake: the sidebar uses it.) | Delete them after moving anything still needed (category image upload). |
| Duplication | Two category action modules with different clients and error styles; date-range logic copied twice in `actions.ts`; three hand-rolled modal patterns (`Modal`, `CategoryForm` portal, `ProfileEditDialog`). | One data-access layer per entity, one date-range helper, one dialog component (shadcn `Dialog`). |
| Logging | 76 `console.*` calls, including debug output in production (bucket listings, raw category rows, login email). | Remove debug logs and keep structured error logging, or add Sentry. |
| Styling | The brand colour `#0B1DFF` is hard-coded 83 times, alongside raw `bg-white` and `text-gray-*`. | Define brand tokens in `globals.css` and use `bg-primary`, `text-foreground` and similar. |
| Dependencies | `dotenv`, `@types/dotenv` and `@tiptap/extension-image` are installed but never imported. | Remove them. |
| Docs | The README has only a title, a one-line description and the authors. | Add setup, environment variables and Supabase notes (partly covered by `CLAUDE.md`). |

## UX, performance and data integrity

Performance is fine at today's volume, but two things will break as orders grow: totals are summed in JavaScript, and every page makes repeated sequential database calls. On the UX side, dark mode is half-applied for anyone whose OS uses it.

| Type | Issue | Fix |
| --- | --- | --- |
| UX | The theme follows the OS (`defaultTheme="system"`) with no toggle. Only 18 `dark:` classes exist against 85 hard-coded `bg-white` / `text-gray-900`, so dark-mode users see a mixed screen. | Force light mode now; do a proper token-based dark theme later. **Done (P7-05):** every surface uses tokens, with a Light / Dark / System picker. |
| UX | Loading states are missing. There is one root `loading.tsx`, and the `Suspense` fallbacks wrap data that is already fetched, so they never show. The `Skeleton` component is unused. | Add a `loading.tsx` with skeletons per route. |
| UX | Four hand-made modals with no focus trap. Icon-only edit and delete buttons have no accessible label, and form labels are not linked to inputs. | One shadcn `Dialog`, `aria-label` on icon buttons, and `htmlFor` on labels. |
| Performance / correctness | Dashboard stats and the revenue chart download every order's total and sum it in JavaScript. Cost grows with the size of the `orders` table, and **Supabase returns at most 1000 rows per request**, so above 1000 orders in a period the revenue figures are silently too low. | A Postgres function or view that returns the aggregates (P6-06). |
| Performance | Pages await their data one call at a time: the dashboard 3, the order page 4, the layout 2. Each helper calls `auth.getUser()` again, so a dashboard load makes about 4 auth round-trips. | `Promise.all`, plus one cached `getCurrentAdmin()` per request (React `cache`). |
| Performance | Customers and brands load every row and page in the browser. | Server-side paging, as Products and Orders already do. |
| Data | Replaced or deleted product images are never removed from storage. Files get random names and upload with no size or type limit beyond the 10 MB request limit. **Confirmed 2026-10-22:** 120 of the 247 files in the `products` bucket are used by no row. In `StaticAssests`, 18 of 23 are used by no row, but that bucket may also hold the mobile app's own files. | Delete the old file on replace or delete (P6-07); validate on upload (P3-01). Clearing the existing orphans is for the owner to decide. |
| Data | Order status change is three separate calls (read, update, insert history), and a failed history insert is ignored. | One Postgres function (RPC) that runs the whole change in a single transaction. |
| Data | What happens on product, brand or category delete depends on foreign keys that are not visible in the repo. Deletes may fail or cascade into order lines. **Confirmed 2026-10-22:** 44 order lines, 9 favorites and 1 saved order reference products, so deleting those products fails. | Use soft delete (`is_archived`) for anything referenced by orders. The code is ready (P6-08); the owner must apply `docs/sql/P6-08-soft-delete.sql` and make the mobile app hide archived rows. |

## Recommendations and next steps

Fix access control first, then build the safety net, then fix bugs and add features. Every phase below maps to tasks in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

1. **Phase 1: Lock down access.** Do this immediately, because the hole is live on production.
2. **Phase 2: Safety net.** Add lint, typecheck, tests, CI, a versioned schema, generated types and zod validation.
3. **Phase 3: Fix the bugs** listed above.
4. **Phase 4: Clean up.** Delete dead code, consolidate data access, use one dialog component, apply design tokens.
5. **Phase 5: Must-have features.** Password reset, permission-aware UI, error pages, order filters, loading states.
6. **Phase 6: Should-have features.** Notifications, low stock, customer detail, stock movement, category images, store settings, performance work.
7. **Phase 7: Nice-to-have features.** Audit log, reports, bulk actions, Arabic and French, full dark mode.

Open questions for the project owner:

- Does the mobile app or a database trigger already adjust stock and create notifications when an order is placed?
- What are the exact columns of `orders` and `order_items`? This is needed for the invoice fix and the customer search.
- Who controls the Supabase project? Several tasks need its CLI or dashboard: migrations, type generation, revoking `anon` access, and redirect URLs for password reset.
