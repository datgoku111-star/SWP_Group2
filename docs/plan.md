# HSRM Backend Implementation — Working Around The Existing Front-End

Build the full HSRM (Hotel Operation and Service Management System) backend infrastructure and new hotel-specific pages **on top of** the existing Chisfis template, without modifying any existing front-end components.

## Core Constraint

> [!IMPORTANT]
> **Zero changes to existing front-end files.** All existing `.tsx` components, layouts, pages, styles, and navigation stay exactly as they are. We build new API routes, new pages under new route paths, backend libraries, and database infrastructure alongside the template.

## Strategy: "Shadow Architecture"

The existing Chisfis template continues to work at all its original routes (`/`, `/login`, `/listing-stay`, etc.). The HSRM system lives in **new, non-overlapping routes** and API endpoints:

- Hotel pages: `/rooms`, `/book/*`, `/bookings/*`, `/services`, `/checkin`, `/orders`, `/housekeeping`
- Dashboards: `/dashboard/*`
- Admin: `/admin/*`
- APIs: `/api/auth/*`, `/api/rooms/*`, `/api/bookings/*`, `/api/services/*`, `/api/orders/*`, `/api/checkin/*`, `/api/admin/*`, `/api/ocr`

The existing login page (`/login`) and account page (`/account`) remain functional as template demos. New HSRM authentication works via dedicated API routes and a middleware layer.

---

## User Review Required

> [!WARNING]
> **The existing `/login` and `/signup` pages will NOT be wired to the HSRM auth system** since we cannot modify them. Users will authenticate via API calls (e.g., from dashboard pages or new HSRM-specific login flows embedded in new pages). Is this acceptable, or do you want minimal wiring changes to the existing login form?

> [!IMPORTANT]
> **New HSRM pages** (rooms, bookings, services, dashboards, admin) will be created as **new Next.js pages** reusing the existing shared UI primitives (`Button`, `Input`, `Avatar`, etc.) and Tailwind/SCSS design tokens, but they will be new files — not modifications of existing ones.

---

## Open Questions

1. **Supabase credentials**: Do you have a Supabase project set up, or should I create the `.env.local.example` with placeholder values only?
2. **OCR integration (Phase 5)**: The OCR route will be a mock. Should I use a specific provider placeholder (e.g., Google Vision, Tesseract), or is a generic mock sufficient?

---

## Proposed Changes

### Phase 0 — Foundation & Configuration

#### [MODIFY] [package.json](file:///e:/Projects/Works/Pho/project/package.json)
Add new dependencies only — no removal of existing ones:
- `@supabase/supabase-js`, `lucide-react`, `zod`, `react-hook-form`, `@hookform/resolvers`, `jose`, `bcryptjs`, `@types/bcryptjs`

#### [NEW] `.env.local.example`
Template for Supabase URL, anon key, service role key, JWT secret.

#### [NEW] `src/types/hotel.ts`
All HSRM TypeScript types: role enums, room status, booking status, service categories, 20+ interfaces.

#### [NEW] `supabase/migrations/001_hsrm_schema.sql`
Full database schema: 11 tables, enums, indexes, `is_room_available()` function, seed data, RLS policies.

#### [NEW] `src/lib/supabase.ts`
`supabaseBrowser` (anon/RLS) + `supabaseServer` (service role) clients.

#### [NEW] `src/lib/auth.ts`
JWT helpers: `signToken`, `verifyToken`, `createAuthCookie`, `clearAuthCookie`, `getTokenFromRequest`.

#### [NEW] `src/lib/db/index.ts`
Barrel re-export for all db modules.

---

### Phase 1 — Authentication API Routes (UC01, UC02)

#### [NEW] `src/middleware.ts`
JWT auth middleware — public path whitelist (all existing template routes + new public hotel routes), role-based access control for protected routes, user headers injection.

#### [NEW] `src/lib/auth-context.tsx`
`AuthProvider` + `useAuth()` hook — fetches `/api/auth/me`, manages logout. Available for new pages to import.

#### [NEW] `src/app/api/auth/login/route.ts`
`POST /api/auth/login` — bcrypt password verify, JWT cookie response.

#### [NEW] `src/app/api/auth/logout/route.ts`
`POST /api/auth/logout` — clears `auth_token` cookie.

#### [NEW] `src/app/api/auth/me/route.ts`
`GET /api/auth/me` — returns current user from JWT. `PATCH /api/auth/me` — updates profile.

#### [NEW] `src/app/api/auth/register/route.ts`
`POST /api/auth/register` — creates new customer account.

---

### Phase 2 — Data Access Layer

#### [NEW] `src/lib/db/rooms.ts`
`getAvailableRooms`, `getAllRooms`, `getRoomById`, `updateRoomStatus`, `getRoomTypes`

#### [NEW] `src/lib/db/bookings.ts`
`createBooking`, `getBookingById`, `getBookingsByGuest`, `getBookingsByUser`, `getTodaysArrivals`, `getTodaysDepartures`, `updateBookingStatus`, `getAllBookings`

#### [NEW] `src/lib/db/services.ts`
`getServices`, `getAllServices`, `createServiceOrder`, `getOrdersByBooking`, `getPendingOrders`, `updateOrderStatus`

#### [NEW] `src/lib/db/users.ts`
`getUserByEmail`, `getAllUsers`, `updateUser`, `createUser`, `getStaffList`

#### [NEW] `src/lib/db/reports.ts`
`getRevenueByPeriod`, `getOccupancyRate`, `getTopServices`, `getDashboardStats`

---

### Phase 3 — Room System Pages & APIs (UC03, UC04, UC08)

New pages that reuse existing shared primitives (`Button`, `Input`, `ButtonPrimary`, Tailwind classes).

#### [NEW] `src/app/rooms/page.tsx`
Room listing — server component, search params, room type filter, grid display.

#### [NEW] `src/app/rooms/[id]/page.tsx`
Room detail — amenities, sticky booking panel.

#### [NEW] `src/app/book/[roomId]/page.tsx`
Booking form — react-hook-form, price summary, POST to API.

#### [NEW] `src/app/housekeeping/page.tsx`
Room status grid grouped by floor, inline status updates.

#### [NEW] `src/app/api/rooms/route.ts`
`GET` — list rooms.

#### [NEW] `src/app/api/rooms/[id]/route.ts`
`GET` — single room.

#### [NEW] `src/app/api/rooms/[id]/status/route.ts`
`PATCH` — update room status.

#### [NEW] `src/app/api/bookings/route.ts`
`GET` all bookings; `POST` create booking.

---

### Phase 4 — Check-in with OCR (UC05)

#### [NEW] `src/app/checkin/page.tsx`
3-step check-in flow.

#### [NEW] `src/app/api/ocr/route.ts`
Mock OCR endpoint.

#### [NEW] `src/app/api/checkin/route.ts`
`POST` — process check-in.

#### [NEW] `src/app/api/bookings/[id]/route.ts`
`GET` single booking.

---

### Phase 5 — Service Orders (UC06, UC07)

#### [NEW] `src/app/services/page.tsx`
Service catalog with cart.

#### [NEW] `src/app/orders/page.tsx`
Kanban-style order queue.

#### [NEW] `src/hooks/useRealtimeOrders.ts`
Supabase Realtime subscription.

#### [NEW] `src/app/api/services/route.ts`
`GET`/`POST` services.

#### [NEW] `src/app/api/orders/route.ts`
`GET`/`POST` orders.

#### [NEW] `src/app/api/orders/[id]/route.ts`
`PATCH` order status.

---

### Phase 6 — Invoices & Payments (UC09, UC10)

#### [NEW] `src/app/bookings/page.tsx`
Booking history list.

#### [NEW] `src/app/bookings/[id]/page.tsx`
Booking detail + invoice.

#### [NEW] `src/app/api/bookings/[id]/invoice/route.ts`
`GET` invoice calculation.

#### [NEW] `src/app/api/checkin/[id]/checkout/route.ts`
`POST` checkout process.

---

### Phase 7 — Role-Based Dashboards

#### [NEW] `src/app/dashboard/layout.tsx`
Dashboard layout with sidebar (new component, doesn't touch existing layouts).

#### [NEW] `src/app/dashboard/page.tsx`
Redirect hub based on JWT role.

#### [NEW] `src/app/dashboard/admin/page.tsx`
Admin dashboard with stats.

#### [NEW] `src/app/dashboard/receptionist/page.tsx`
Today's arrivals/departures.

#### [NEW] `src/app/dashboard/customer/page.tsx`
Customer's active bookings.

#### [NEW] `src/app/dashboard/kitchen/page.tsx`
Redirect to `/orders`.

#### [NEW] `src/app/dashboard/housekeeping/page.tsx`
Redirect to `/housekeeping`.

---

### Phase 8 — Admin CRUD & Reports (UC11)

#### [NEW] `src/app/admin/layout.tsx`
Admin layout with role guard + sidebar.

#### [NEW] `src/app/admin/rooms/page.tsx`, `room-types/page.tsx`, `users/page.tsx`, `staff/page.tsx`, `services/page.tsx`, `reports/page.tsx`
Full CRUD pages with modals and data tables.

#### [NEW] API routes under `src/app/api/admin/*`
All admin CRUD endpoints (rooms, room-types, users, services, staff, reports).

---

## File Summary

| Category | Files | Action |
|----------|-------|--------|
| Existing front-end files modified | **0** | None — all untouched |
| `package.json` | 1 | Dependencies added only |
| Types & Config | 3 | `.env.local.example`, `hotel.ts`, SQL migration |
| Library/Backend | 8 | Supabase client, auth, 5 db modules, auth-context |
| Middleware | 1 | `middleware.ts` |
| API Routes | ~25 | All under `/api/*` |
| New Pages | ~20 | Rooms, bookings, services, dashboards, admin |
| New Hooks | 1 | `useRealtimeOrders` |
| **Total new files** | **~58** | |

---

## Verification Plan

### Automated Tests
```bash
cd project && npm run build
```
A successful build confirms all new files compile without breaking existing template code.

### Manual Verification
1. Existing template pages (`/`, `/login`, `/listing-stay`, etc.) render unchanged
2. New API routes respond correctly (`/api/auth/login`, `/api/rooms`, etc.)
3. New pages render with proper styling using existing design tokens
4. Middleware correctly whitelists all existing template routes
