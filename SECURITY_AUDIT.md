# Security Audit

Branch: `security/audit-auth-secrets`

Date: 2026-05-31

## Summary

No hardcoded private secrets, service role keys, database URLs, JWT secrets, GitHub tokens, OpenAI keys, SMTP secrets, or private API keys were found in the reviewed source code, environment examples, Supabase SQL, or production client bundle.

The project uses `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_KEY` in the browser. This is expected for Supabase client usage as long as `PUBLIC_SUPABASE_KEY` is the anon/public key and Row Level Security remains enabled.

Admin data mutations depend on authenticated Supabase sessions and RLS policies. Public portfolio queries are restricted to `published = true` and were tightened to request only the fields required by the UI.

## Files Reviewed

- `.gitignore`
- `.env.example`
- `sample/.env.example`
- `.env.local` variable names only, without printing values
- `astro.config.mjs`
- `package.json`
- `bun.lock`
- `src/lib/supabase.ts`
- `src/lib/admin.ts`
- `src/layouts/AdminLayout.astro`
- `src/layouts/BaseLayout.astro`
- `src/pages/admin/login.astro`
- `src/pages/admin/dashboard.astro`
- `src/pages/admin/projects/index.astro`
- `src/pages/admin/projects/new.astro`
- `src/pages/admin/projects/edit/[id].astro`
- `src/pages/admin/credentials/index.astro`
- `src/pages/admin/credentials/new.astro`
- `src/pages/admin/credentials/edit/[id].astro`
- `src/components/sections/ProjectsSection.astro`
- `src/components/sections/CoursesSection.astro`
- `src/components/ProjectCard.astro`
- `src/components/CourseCard.astro`
- `supabase/schema.sql`
- `README.md`
- Production bundle generated in `dist/client`

## Findings

### No Private Secrets Found

No real private tokens or secrets were found in source or generated client bundle.

Checked for indicators including:

- `service_role`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `GITHUB_TOKEN`
- `private_key`
- common token prefixes such as `sk-`, `ghp_`, `github_pat_`

Matches found in the production bundle for words like `access_token`, `token`, `password`, and `secret` came from the Supabase client library and the login form flow. No private secret value was found.

### Environment Variables

`.env.local` was not printed. Only variable names were checked.

Detected local variable names:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_KEY`

Tracked env files are examples only:

- `.env.example`
- `sample/.env.example`

Ignored sensitive env files confirmed through `.gitignore`:

- `.env`
- `.env.local`
- `.env.*.local`
- `.env.production`

### Supabase Client Usage

The frontend uses only:

- `import.meta.env.PUBLIC_SUPABASE_URL`
- `import.meta.env.PUBLIC_SUPABASE_KEY`

No `service_role` key or private Supabase key usage was found in frontend code.

### Supabase RLS And Admin Actions

`supabase/schema.sql` enables RLS on:

- `projects`
- `credentials`

Public visitors can only read rows where `published = true`.

Authenticated users can read, create, update, and delete content. This is acceptable for the current setup only if Supabase Auth registration remains disabled and only the manually created admin user exists.

### Public Data Minimization

Public sections previously used `select("*")`. This did not expose secrets, but it returned unnecessary columns.

This was corrected so the public site only requests fields required for rendering:

- `ProjectsSection.astro`: title, description, image, project URL, GitHub URL, and tools.
- `CoursesSection.astro`: type, title, issuer, date, description, image, credential URL, and tags.

### Admin Route Visibility

Admin routes are protected client-side using Supabase Auth session checks. Content mutations are protected by RLS.

One issue was found: protected admin page content could be rendered before the client-side session check redirected unauthenticated users.

This was hardened by hiding protected admin content by default and revealing it only after a valid session is detected.

### Console Logging

No `console.log` statements exposing sessions, tokens, users, Supabase responses, or private data were found.

### Browser Storage

The app stores non-sensitive UI preferences in `localStorage`:

- theme
- language
- admin inactivity timestamp

Supabase Auth also stores its normal browser session data. This is expected for the current Supabase browser client setup.

### Network Tab

Static code review shows network calls are limited to Supabase Auth, database, and Storage operations required by the site and admin panel.

Full Network tab behavior requires manual verification in the browser after deployment.

## Changes Made

- Hardened `src/layouts/AdminLayout.astro` so protected admin content is hidden until a valid Supabase session is confirmed.
- Reduced public Supabase selects in `src/components/sections/ProjectsSection.astro` to only required fields.
- Reduced public Supabase selects in `src/components/sections/CoursesSection.astro` to only required fields.
- Added this audit report in `SECURITY_AUDIT.md`.

## Verification Commands

- `bun install`
- `bun run build`

Build completed successfully.

## Exposure Confirmation

- Code source: no private secrets found.
- Variables públicas: only expected Supabase public variables found.
- Console browser: no sensitive logging found in source.
- Network tab: requires manual verification after deployment.
- Production bundle: no private secrets found; Supabase library contains expected auth-related strings.
- Repository: `.env.local` is ignored; only example env files are tracked.

## Remaining Risks

- Admin route protection is primarily client-side because Supabase Auth is currently used through the browser client. RLS protects the data layer, but for strict server-side route protection, migrate auth session handling to secure cookies and Astro middleware.
- RLS policies allow any authenticated user to administer content. This is acceptable only while public signup stays disabled and only the admin user exists. If more users are added, introduce role-based authorization or an allowlist table.
- Supabase browser sessions are accessible to JavaScript by design in the current setup. Continue avoiding third-party scripts in admin pages and keep dependencies reviewed.

## Recommendations

- Keep Supabase Auth signup disabled.
- Keep using only the anon/public key in frontend code.
- Never add `SUPABASE_SERVICE_ROLE_KEY` to frontend env files.
- Rotate Supabase keys only if a private key is ever exposed; no such exposure was found in this audit.
- Consider server-side auth middleware with cookie-based sessions if the admin area needs strict server-render protection.
- Manually verify the deployed Network tab to confirm only expected Supabase requests occur during login and CRUD flows.
