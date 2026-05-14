# Development Plan — As-Built State
**Platform:** Participatory Territorial Digital Governance — Algeria (gov_djihane)
**Last updated:** 2026-05-14

---

## 1. Tech Stack (Exact Versions)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.6 |
| UI library | React | 19.2.4 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS v4 | `@import "tailwindcss"` syntax |
| ORM | Prisma + `@prisma/adapter-pg` | 7.8.0 |
| Database | PostgreSQL + PostGIS | 15 / 3.3 (Docker) |
| Auth | `jose` (JWT) + bcryptjs | — |
| Mapping | Leaflet + OpenStreetMap | — |
| Charts | Recharts | — |
| File uploads | Local filesystem (`public/uploads/`) | — |

---

## 2. Repository Layout

```
src/
├── app/
│   ├── page.tsx                   Citizen home (full-screen map + navbar)
│   ├── connexion/                 Citizen login page
│   ├── admin/
│   │   ├── connexion/             Admin login page
│   │   ├── layout.tsx             Admin shell (sidebar + auth guard)
│   │   ├── dashboard/             KPI overview + recent signalements
│   │   ├── signalements/          Signalement list + inline status update
│   │   ├── projets/               Project list + create form
│   │   └── analytics/             Charts page (stub — charts served from dashboard)
│   ├── actions/
│   │   ├── auth.ts                login / logout server actions
│   │   ├── signalements.ts        updateSignalementStatus server action
│   │   └── projets.ts             createProjet / updateProjetStatus server actions
│   └── api/
│       ├── signalements/route.ts  GET (map markers) + POST (create)
│       ├── projets/route.ts       GET (map markers)
│       ├── notifications/route.ts GET (list + count) + PATCH (mark read)
│       ├── upload/route.ts        POST (local file upload → public/uploads/)
│       └── admin/analytics/route.ts GET (aggregated KPIs)
├── components/
│   ├── admin/
│   │   ├── SignalementTable.tsx   Tabular list, inline update form, detail modal trigger
│   │   ├── SignalementDetailModal.tsx Full detail modal (description + photos)
│   │   ├── DashboardCharts.tsx    Recharts bar + horizontal-bar
│   │   ├── ProjetForm.tsx         Create/edit form with LocationPicker
│   │   ├── LocationPicker.tsx     Standalone Leaflet click-to-place marker
│   │   ├── StatusBadge.tsx        Signalement status colour chip
│   │   └── ProjetStatusBadge.tsx  Project status colour chip
│   ├── citizen/
│   │   ├── ImageUploader.tsx      Multi-file upload with previews (→ /api/upload)
│   │   ├── NotificationBell.tsx   Bell icon, dropdown, 30-second polling
│   │   └── LoginForm.tsx          Citizen credential form
│   └── maps/
│       ├── CitizenMap.tsx         Client wrapper; layer toggles; fetches markers
│       ├── LeafletMap.tsx         Leaflet core; circle + diamond SVG markers
│       └── SignalementPanel.tsx   Slide-in panel; form + ImageUploader
├── lib/
│   ├── prisma.ts                  Singleton PrismaClient with pg adapter
│   ├── session.ts                 JWT encrypt/decrypt via jose; cookies() API
│   ├── dal.ts                     requireAdmin / requireCitizen / requireRole
│   ├── auth.ts                    ROLE_HIERARCHY map; login/logout logic
│   ├── constants.ts               Labels for categories, statuses, roles, wilayas
│   └── uploadthing.ts             (deprecated — kept for reference only)
├── types/index.ts                 Re-exports from Prisma + GeoPoint / SessionUser
├── proxy.ts                       Route protection logic (Next.js 16 convention)
└── generated/prisma/              Prisma client output (do not edit manually)

prisma/
├── schema.prisma                  Source of truth for all models
├── migrations/20260513190529_init/ Initial migration (no PostGIS — shadow DB issue)
├── add_notifications.sql          Manual migration: Notification table + enum
├── enable_postgis.sql             Ensures PostGIS extension exists
└── seed.ts                        6 test users + 10 seeded projects
```

---

## 3. Database Setup

### Docker
```yaml
# docker-compose.yml (excerpt)
image: postgis/postgis:15-3.3
ports:
  - "5433:5432"   # host 5433 avoids conflict with local PostgreSQL on 5432
```

### Connection string
```
DATABASE_URL=postgresql://gov_user:gov_secure_pass@localhost:5433/governance_db
```

### PostGIS migration pattern

**Problem:** `prisma migrate dev` spins up a shadow database that never has the PostGIS extension installed. Any migration touching `geometry(Point, 4326)` columns fails.

**Established pattern:**
1. Write SQL manually (e.g., `prisma/add_notifications.sql`)
2. Execute directly: `PGPASSWORD=gov_secure_pass psql -h localhost -p 5433 -U gov_user -d governance_db -f file.sql`
3. Run `npx prisma generate` to re-generate the client
4. Never run `prisma migrate dev` or `prisma migrate reset` — they will break PostGIS migrations

### CREATE TYPE guard
PostgreSQL does not support `CREATE TYPE IF NOT EXISTS`. Use:
```sql
DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('SIGNALEMENT_STATUS', 'PROJECT_UPDATE', 'GENERAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

---

## 4. Authentication & Session

- **Library:** `jose` (ECDSA/HMAC JWT, not Next-Auth)
- **Cookie:** `gov_session` — HttpOnly, SameSite=lax, 7-day TTL
- **Session payload:** `{ userId, role, name, wilaya?, ministere?, expiresAt }`
- **Server reads:** `getSession()` in `src/lib/session.ts` — calls `await cookies()` (async in Next.js 16)
- **DAL guards:** `requireAdmin()` / `requireCitizen()` in `src/lib/dal.ts` — use React `cache()` to deduplicate within a render tree; redirect on failure

### ROLE_HIERARCHY (numeric levels for comparison)

| Role | Level |
|------|-------|
| `CITOYEN` | 0 |
| `AGENT_TECHNIQUE` | 1 |
| `GESTIONNAIRE_TERRITORIAL` | 2 |
| `ADMIN_WILAYA` | 3 |
| `ADMIN_MINISTERE` | 4 |
| `SUPER_ADMIN` | 5 |

`ADMIN_ROLES` = all roles except CITOYEN (used as the admin route guard set).

`WILAYA_ROLES` = `['ADMIN_WILAYA', 'GESTIONNAIRE_TERRITORIAL', 'AGENT_TECHNIQUE']` — these roles are scoped to `session.wilaya` and cannot see other wilayas' data.

---

## 5. Route Protection (Next.js 16 Proxy Convention)

**File:** `src/proxy.ts` — exports `async function proxy(request)` and `export const config { matcher }`.

This is the Next.js 16 replacement for `middleware.ts`. It gates:
- `/admin/**` except `/admin/connexion` — requires an ADMIN_ROLES session
- `/admin/connexion` — redirects to dashboard if already authenticated
- `/signalements/nouveau`, `/consultations`, `/profil` — requires CITOYEN session
- `/connexion` — redirects home if already a CITOYEN

Secondary guard: server components call `requireAdmin()` / `requireCitizen()` from `dal.ts`, providing defence-in-depth if the proxy is bypassed.

---

## 6. PostGIS Raw Query Patterns

### Problem with Prisma 7 + `@prisma/adapter-pg`
`$queryRaw` tagged template literals with nested `Prisma.Sql` fragments (e.g., `Prisma.join`) do not compose correctly with the pg adapter, producing `syntax error at or near $1`. The safe pattern is `$queryRawUnsafe`.

### Read pattern (map markers)
```typescript
const params: unknown[] = []
let p = 1
let whereSql = `WHERE s.location IS NOT NULL`

// User-supplied strings → positional params
if (wilaya) { whereSql += ` AND s.wilaya = $${p++}`; params.push(wilaya) }
// Zod-validated enum values → inline SQL literal (safe after validation)
if (category) { whereSql += ` AND s.category = '${category}'::"SignalementCategory"` }
// Integer literals embedded directly
const sql = `SELECT ... ST_X(s.location::geometry) AS lng,
                         ST_Y(s.location::geometry) AS lat
             FROM "Signalement" s ${whereSql}
             ORDER BY s."createdAt" DESC LIMIT ${limit}`

const rows = await prisma.$queryRawUnsafe<Row[]>(sql, ...params)
```

### Write pattern (geo insert — two-step)
```typescript
// Step 1 — insert with ORM (no geometry field)
const record = await prisma.signalement.create({ data: { ... } })

// Step 2 — set geometry with raw SQL
await prisma.$executeRawUnsafe(
  `UPDATE "Signalement" SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
  lng, lat, record.id
)
```

This two-step approach avoids embedding mediaUrls or other arrays in raw SQL strings.

### Signalement POST — inline insert with RETURNING
For the citizen create endpoint, a single `$queryRaw` tagged template is used because all interpolated values are either bound params or constant literals:
```typescript
const result = await prisma.$queryRaw<{ id: string }[]>`
  INSERT INTO "Signalement" (...) VALUES (
    gen_random_uuid(), ${title}, ${description},
    ${category}::"SignalementCategory",   -- $n cast is valid PostgreSQL
    'RECU'::"SignalementStatus",
    ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
    ...
  ) RETURNING id
`
```

---

## 7. File Upload Strategy

**Environment:** Local development only.
**Storage:** `public/uploads/` directory — served by Next.js static file server at `/uploads/<filename>`.
**Route:** `POST /api/upload` — accepts `multipart/form-data` with field `files[]`.
**Constraints:** max 3 files, max 4 MB each, JPEG/PNG/WebP/GIF only.
**Filename:** `${Date.now()}-${randomHex}.ext` — collision-resistant without a UUID dependency.
**Production note:** Replace with object storage (S3, Cloudflare R2, Supabase Storage) before deploying. The `ImageUploader` component only needs the fetch URL changed.

---

## 8. Priorities Implemented

### Priority 1 — Persistent Data Layer
- PostgreSQL 15 + PostGIS 3.3 via Docker on port 5433
- Full Prisma schema: User, Signalement, SignalementHistory, Project, ProjectDocument, Consultation, ConsultationQuestion, QuestionAnswer, Vote, Comment, Notification
- Manual SQL migration workflow (see §3)
- Seed: 6 test users + 10 geographically distributed projects

### Priority 2 — RBAC & Authentication
- 6-role hierarchy (CITOYEN through SUPER_ADMIN)
- Dual-entry: `/connexion` for citizens, `/admin/connexion` for staff
- JWT sessions via `jose`, 7-day TTL
- Route protection via `proxy.ts` + DAL guards
- Wilaya-scoped data access for WILAYA_ROLES

### Priority 3 — GIS & Mapping Engine
- Full-screen citizen map (`CitizenMap` → `LeafletMap`, SSR-disabled)
- Layer toggles: Signalements (circle markers, colour-coded by category) + Projects PAW (diamond markers)
- Spatial filtering: wilaya, category, status via query params
- Click-to-place: captures GPS coordinates → opens `SignalementPanel` slide-in
- Lazy project layer load (fetched only on first toggle)

### Priority 4 — Institutional Dashboard & Project Management
- Admin sidebar shell with role label and wilaya context
- Signalement list: paginated (30/page), filtered by status + category, inline status update with comment, optimistic `revalidatePath`
- Project CRUD: create form with `LocationPicker`, budget/dates/sector/advancement
- Analytics dashboard: KPI cards (citizens, signalements, projects), bar chart by category, horizontal bar by status, donut for avg advancement rate (all via `recharts`, SSR-disabled)
- Role-scoped queries: WILAYA_ROLES see only their wilaya

### Priority 5 — Media Evidence & Real-time Loop
- `ImageUploader` component: multi-file selection, local blob preview, progress overlay, remove
- Local upload API: `POST /api/upload` → saves to `public/uploads/`
- Admin `SignalementDetailModal`: click title row → modal with description, citizen info, photo gallery
- `Notification` model with `NotificationType` enum
- Status update server action creates `Notification` row inside the same `$transaction`
- `GET /api/notifications` returns 20 most recent + unread count
- `PATCH /api/notifications` marks all as read
- `NotificationBell` in citizen navbar: badge, dropdown, 30-second polling, marks read on open

---

## 9. Key Environment Variables

```env
DATABASE_URL=postgresql://gov_user:gov_secure_pass@localhost:5433/governance_db
SESSION_SECRET=<32+ char random string>
UPLOADTHING_TOKEN=<not used — local upload replaces UploadThing>
```

---

## 10. Test Credentials (post-seed)

| Role | Email | Password |
|------|-------|----------|
| Citoyen | citoyen@test.dz | Citoyen1234! |
| Super Admin | superadmin@gov.dz | Admin1234! |
| Admin Ministère | ministere@gov.dz | Admin1234! |
| Admin Wilaya (Alger) | wilaya16@gov.dz | Admin1234! |
| Gestionnaire | gestionnaire@gov.dz | Admin1234! |
| Agent Technique | agent@gov.dz | Admin1234! |

---

## 11. Known Limitations & Technical Debt

| Item | Impact | Mitigation |
|------|--------|-----------|
| `public/uploads/` not persistent on Vercel/serverless | Production blocker | Replace with object storage |
| `prisma migrate dev` unusable for PostGIS tables | Dev workflow friction | Manual SQL + `prisma generate` |
| `$queryRawUnsafe` with inline enum literals | SQL injection risk if enum not Zod-validated | All callers validate with Zod before use |
| `uploadthing.ts` still present | Dead import risk | Remove once confirmed unused |
| No HTTPS / no rate limiting on API routes | Security gap in production | Add middleware / WAF before deploy |
| No email notifications (only in-app) | UX gap | Integrate SMTP (Resend, Nodemailer) |

---

## 12. Participatory Features (Gap 1 + Gap 5 — Resolved)

### Gap 5 — Project Comments ✅
Citizens can comment on any PAW project from the project detail page (`/projets/[id]`).
- `addComment` server action — validates content, creates `Comment` row, revalidates path
- `CommentSection` client component — comment list + textarea form with `useActionState`
- Any authenticated user (any role) can comment; unauthenticated users see a "connect to comment" prompt
- Project markers on the citizen map now include a **"Voir le projet →"** link in their popup

### Gap 1 — Consultation Module ✅

**Admin side:**
- `/admin/consultations` — list with status badges, participant counts, Publier / Clôturer buttons
- `/admin/consultations/nouveau` — creation form (`ConsultationForm` client component)
  - Dynamic question builder (up to 10 questions, add/remove)
  - Status selector: BROUILLON (draft) or PUBLIEE (immediately live)
- `publishConsultation` / `closeConsultation` server actions (form-based)
- **Consultations** added to the admin sidebar nav

**Citizen side:**
- `/consultations` — list of all PUBLIEE consultations with participant count and "Participer" CTA
- `/consultations/[id]` — full detail: description, linked project link, vote section + questionnaire
  - `ConsultationVoteForm` client component — 3-way vote (Pour / Neutre / Contre) + per-question textareas
  - One-time participation: once voted, shows a read-only summary of the citizen's answers
  - Closed consultations display a clôturée banner
- `submitParticipation` server action — creates `Vote` + `QuestionAnswer` rows in a `$transaction`
- **Consultations** link added to the citizen navbar

---

## 13. Remaining Gaps

Still not implemented relative to the MASTER_BRIEF:
1. **PDF report generation**
2. **CSV / Excel export**
3. **Heatmap layer** on citizen map
4. **User management interface** (`/admin/utilisateurs`) ✅
5. **Admin GIS spatial analysis tools** (add custom data layers)

---

## 14. Visual Polishing & Advanced Admin (2026-05-14)

### Font fix
Replaced `font-family: Arial, Helvetica, sans-serif` in `src/app/globals.css` with `var(--font-geist-sans)` so the Geist font configured in `layout.tsx` is actually applied. Also updated `--foreground` to `#0f172a` (slate-900) and removed the `@media (prefers-color-scheme: dark)` block to keep a single light theme.

### Edit project (`/admin/projets/[id]/modifier`)
- Added `updateProjet` server action to `src/app/actions/projets.ts` — same validation/wilaya-scoping as `createProjet`, using `prisma.project.update` + optional PostGIS `$executeRawUnsafe` for location.
- Refactored `src/components/admin/ProjetForm.tsx` to accept `serverAction`, `initialData`, and `initialLocation` props. In edit mode all fields are pre-populated via `defaultValue` (uncontrolled). Button label switches between "Créer le projet" and "Enregistrer les modifications".
- New page `src/app/admin/projets/[id]/modifier/page.tsx` — Server Component, fetches project + location, binds `updateProjet.bind(null, id)`, enforces wilaya-scoped access.
- Projets list (`/admin/projets`) gains a "Modifier →" inline link in the title cell and a dedicated "Actions" column with an edit button.

### Analytics page (`/admin/analytics`)
- `src/components/admin/AnalyticsCharts.tsx` — `'use client'` Recharts component with three charts: monthly signalements line chart, sector advancement horizontal bar chart, and a donut chart for consultation vote breakdown.
- `src/components/admin/AnalyticsChartsClient.tsx` — `'use client'` wrapper using `dynamic(..., { ssr: false })` so Recharts (which requires the browser DOM) is not rendered on the server. Shows animated skeleton loading state.
- `src/app/admin/analytics/page.tsx` — Server Component with WILAYA_ROLES scoping, raw SQL for monthly aggregation, Prisma `groupBy` for sectors and votes, and two KPI cards (total signalements + total projets).

### User management (`/admin/utilisateurs`)
- `src/app/actions/users.ts` — three server actions: `updateUserRole` (inline optimistic), `createUser`, `updateUser`. All SUPER_ADMIN-only. `createUser` hashes passwords with bcrypt, enforces unique email. `updateUser` accepts optional password (omit to leave unchanged), updates `isActive` toggle.
- `src/components/admin/UserRoleSelect.tsx` — `'use client'` select with optimistic update via `useTransition`; reverts on error; shows read-only badge for the current user's own row.
- `src/components/admin/UserFormModal.tsx` — `'use client'` modal for both create and edit. Uses `useActionState` with `updateUser.bind(null, userId)` in edit mode and `createUser` in create mode. Conditional wilaya field (shown only for WILAYA_ROLES). Controlled `isActive` toggle with hidden input. Escape key + backdrop click close the modal.
- `src/components/admin/UsersTable.tsx` — `'use client'` component managing `ModalState`. Renders the user table rows (with `UserRoleSelect` + edit button per row) and the "Nouvel utilisateur" button. Mounts `<UserFormModal>` keyed by `userId | 'new'` so `useActionState` resets on switch.
- `src/app/admin/utilisateurs/page.tsx` — Server Component delegates table + modal management to `<UsersTable>`. Retains server-side search/wilaya filter form and pagination.

### Reactive filtering (`/admin/signalements` + `/admin/projets`)
- `src/components/admin/SignalementsFilter.tsx` — `'use client'` component. Reads `status` and `category` from `useSearchParams`, updates URL via `router.push()` inside `startTransition` on `onChange`. Applies `opacity-50 pointer-events-none` while pending. Shows "Réinitialiser" button when any filter is active.
- `src/components/admin/ProjetsFilter.tsx` — same pattern, status filter only.
- Both pages replace the old `<form method="GET">` filter block with `<Suspense fallback={skeleton}><Filter /></Suspense>` (required because `useSearchParams` needs a Suspense boundary in Next.js 16 App Router).
