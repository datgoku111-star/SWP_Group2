# HSRM Conversion Changelog

**Date:** 2026-06-17  
**Project:** Chisfis → Hotel Operation and Service Management System (HSRM)  
**Scope:** Full conversion of a multi-listing booking template into a hotel management platform.  
**Status:** In Progress — Phase 0 (Foundation Assessment) Complete

---

## Summary

This project converts a Next.js 13.4+ multi-listing booking platform (Chisfis) into a fully-featured hotel management system covering 11 use cases defined in `RDS.md`. The conversion is being built on top of the existing Chisfis template codebase.

---

## Current State — Baseline (Chisfis Template)

The project currently runs the **unmodified Chisfis v0.2.2 template**, a multi-listing travel booking UI built with Next.js 13.4+ App Router. All original template features, components, and pages are intact and serve as the foundation for the HSRM conversion.

### Technology Stack

| Technology           | Version   | Purpose                          |
| -------------------- | --------- | -------------------------------- |
| Next.js              | ^13.4.3   | React framework with App Router  |
| React                | ^18.2.0   | UI library                       |
| TypeScript           | 5.0.4     | Type safety                      |
| Tailwind CSS         | ^3.3.2    | Utility-first styling            |
| Sass                 | ^1.62.1   | SCSS theme variables             |
| Framer Motion        | ^10.12.16 | Animations                       |
| Headless UI          | ^1.7.14   | Accessible UI primitives         |
| Heroicons            | ^2.0.18   | Icon library                     |
| react-datepicker     | ^4.11.0   | Date selection                   |
| rc-slider            | ^10.1.1   | Range slider inputs              |
| next-auth            | ^4.23.1   | Authentication (template stub)   |
| google-map-react     | ^2.2.1    | Map integration                  |
| react-use            | ^17.4.0   | React hooks collection           |
| Tailwind plugins     | —         | typography, forms, aspect-ratio  |

### Project Structure

```
project/
├── next.config.js            # Next.js config — appDir, typedRoutes, remote image patterns
├── tailwind.config.js        # Tailwind config — custom color system via CSS variables
├── package.json              # Dependencies (chisfis-nextjs v0.2.2)
└── src/
    ├── app/
    │   ├── layout.tsx                # Root layout — Poppins font, SiteHeader, Footer
    │   ├── page.tsx                  # Home page — Hero, category sliders, features
    │   ├── globals.css               # Global CSS imports
    │   ├── ClientCommons.tsx          # Client-side commons (theme, global state)
    │   ├── login/page.tsx            # Login page — social login + email/password form
    │   ├── signup/                   # Signup page
    │   ├── about/                    # About page
    │   ├── contact/                  # Contact page
    │   ├── blog/                     # Blog pages
    │   ├── author/                   # Author profile page
    │   ├── checkout/                 # Checkout flow
    │   ├── pay-done/                 # Payment confirmation
    │   ├── add-listing/              # Multi-step listing creation (10 steps)
    │   ├── subscription/             # Subscription plans
    │   ├── api/hello/auth/           # next-auth stub route
    │   ├── (account-pages)/          # Account management (profile, billing, password, savelists)
    │   ├── (home)/                   # Home page variants (home-2, home-3)
    │   ├── (stay-listings)/          # Stay listing pages + map variants
    │   ├── (car-listings)/           # Car listing pages + map variants
    │   ├── (experience-listings)/    # Experience listing pages + map variants
    │   ├── (flight-listings)/        # Flight listing pages
    │   ├── (real-estate-listings)/   # Real estate listing pages + map variants
    │   ├── (listing-detail)/         # Detail pages (stay, car, experience)
    │   ├── (server-components)/      # Server-rendered hero sections (5 variants)
    │   └── (client-components)/      # Client components
    │       ├── (Header)/             # Header system (SiteHeader, MainNav1/2, Header3)
    │       ├── (HeroSearchForm)/     # Desktop hero search forms
    │       ├── (HeroSearchForm2Mobile)/ # Mobile search forms
    │       └── (HeroSearchFormSmall)/   # Compact search forms
    ├── components/                   # 53 reusable components (cards, sections, modals)
    ├── shared/                       # 32 shared UI primitives (Button, Input, Logo, Nav)
    ├── data/                         # Static data (navigation, listings, authors, taxonomies)
    ├── hooks/                        # Custom hooks (useNcId, useOutsideAlerter)
    ├── images/                       # Static image assets
    ├── fonts/                        # Line Awesome icon font
    ├── styles/                       # SCSS theme system (__theme_colors.scss — 14 palettes)
    ├── routers/                      # Route type definitions
    ├── utils/                        # Utility functions
    └── contains/                     # Constants and containers
```

### Existing Features (Chisfis Template)

#### Layout & Navigation
- **Root Layout** (`layout.tsx`) — Poppins font family, global header + footer
- **SiteHeader** (`SiteHeader.tsx`) — Template switcher with Header 1/2/3 + home page selector
- **MainNav2** (`MainNav2.tsx`) — Logo, DropdownTravelers search, TemplatesDropdown, LangDropdown, "List your property" button, NotifyDropdown, AvatarDropdown
- **AvatarDropdown** (`AvatarDropdown.tsx`) — Static user info ("Eden Smith"), nav links (My Account, My bookings, Wishlist), dark mode toggle, Help, Log out
- **Logo** (`Logo.tsx`) — SVG logo with light/dark variants (Chisfis branding)
- **Footer + FooterNav** — Site-wide footer with mobile bottom navigation

#### Home Page (`page.tsx`)
- SectionHero — "Hotel, car & experiences" headline with hero image and search CTA
- SectionSliderNewCategories — City destination carousel (7 cities)
- SectionOurFeatures — Feature highlights
- SectionGridFeaturePlaces — Featured property cards grid
- SectionHowItWork — 3-step flow (Book & relax, Smart checklist, Save more)
- SectionSubscribe2 — Newsletter subscription
- SectionGridAuthorBox — Author/host profiles
- SectionGridCategoryBox — Category browsing
- SectionBecomeAnAuthor — Host recruitment CTA
- SectionSliderNewCategories (card5) — "Explore by types of stays"
- SectionVideos — Video content section
- SectionClientSay — Client testimonials
- BgGlassmorphism — Decorative glassmorphism background

#### Multi-Listing System
- **Stay Listings** — Stay search, map view, detail pages
- **Car Listings** — Car rental search, map view, detail pages
- **Experience Listings** — Activity search, map view, detail pages
- **Flight Listings** — Flight search pages
- **Real Estate Listings** — Property search, map view

#### Authentication (Template Stub)
- **Login Page** (`login/page.tsx`) — Social login buttons (Facebook, Twitter, Google) + email/password form with "Forgot password?" link
- **Signup Page** — Account registration form
- **next-auth** — API route stub at `api/hello/auth/[...nextauth].ts`

#### Account Pages
- **Account Profile** (`account/page.tsx`) — Static form with demo data ("Eden Tuan"), avatar upload, fields: name, gender, username, email, DOB, address, phone, about
- **Account Billing** — Billing management
- **Account Password** — Password change
- **Account Savelists** — Saved/wishlisted items

#### Theming System
- **14 color palettes** defined in `__theme_colors.scss` — CSS custom properties for primary, secondary, and neutral color ramps
- **Default palette** — Indigo primary (`--c-primary-600: 79, 70, 229`), Teal secondary, Cool Grey neutral
- **Tailwind integration** — `customColors()` function bridges CSS variables to Tailwind via `rgba()` with opacity support
- **Dark mode** — Class-based (`darkMode: "class"`) with `SwitchDarkMode` toggle
- **Key convention** — `primary.6000` maps to `--c-primary-600` (project-wide naming)

#### Navigation Data (`navigation.ts`)
- **NAVIGATION_DEMO** — Full mega menu with Home (3 demo pages), Five columns (mega menu), Listing Page (stays, experiences, cars, real estate, flights), Templates (add-listing, checkout, pay-done, author, account, subscription), Other pages (blog, about, contact, login, signup)
- **NAVIGATION_DEMO_2** — Simplified variant for alternate headers

#### Search Forms
- **HeroSearchForm** — Desktop tabbed search (Stays, Experiences, Cars, Flights) with location, date, and guest inputs
- **HeroSearchForm2Mobile** — Mobile-optimized search interface
- **HeroSearchFormSmall** — Compact search bar for listing pages

### Configuration

#### `next.config.js`
- `reactStrictMode: false`
- `experimental.appDir: true`, `experimental.typedRoutes: true`
- Remote image patterns: `images.pexels.com`, `images.unsplash.com`, `a0.muscache.com`, `www.gstatic.com`

#### `tailwind.config.js`
- Custom color system using CSS variable bridge function
- Container centered with responsive padding
- Plugins: `@tailwindcss/typography`, `@tailwindcss/forms`, `@tailwindcss/aspect-ratio`

---

## Planned Conversion — Phase 0: Foundation & Configuration

> **Status:** Not yet implemented

### Dependencies to Install

- `@supabase/supabase-js` — Supabase database client
- `lucide-react` — Icon library (replaces heroicons for new components)
- `zod` — Runtime schema validation
- `react-hook-form` — Form state management
- `@hookform/resolvers` — Zod adapter for react-hook-form
- `jose` — JWT sign/verify (ES module compatible)
- `bcryptjs` + `@types/bcryptjs` — Password hashing

### Files to Create

| File                                              | Purpose                                                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `project/.env.local.example`                      | Template for required environment variables                                                           |
| `project/src/types/hotel.ts`                      | All HSRM TypeScript types (8 union types, 20+ interfaces)                                             |
| `project/supabase/migrations/001_hsrm_schema.sql` | Full database schema — 10 tables, enums, indexes, `is_room_available()` function, seed data, RLS      |
| `project/src/lib/supabase.ts`                     | `supabaseBrowser` (anon/RLS) + `supabaseServer` (service role) clients                                |
| `project/src/lib/auth.ts`                         | JWT helpers: `signToken`, `verifyToken`, `createAuthCookie`, `clearAuthCookie`, `getTokenFromRequest` |
| `project/src/lib/db/index.ts`                     | Barrel re-export for all db modules                                                                   |

### Files to Modify

| File                                     | Change                                                                                                          |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `project/src/styles/__theme_colors.scss` | Replace `--c-primary-*` ramp with `#FF5E1F` orange; keep `--c-primary-6000` key name (project-wide convention)  |
| `project/tailwind.config.js`             | `primary.6000` key updated to reference `--c-primary-6000`                                                      |

---

## Planned Conversion — Phase 1: Authentication System (UC01, UC02)

> **Status:** Not yet implemented

### Files to Create

| File                                       | Purpose                                                                                             |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `project/src/middleware.ts`                | JWT auth middleware — public path bypass, role-based access control, user headers injection         |
| `project/src/lib/auth-context.tsx`         | `AuthProvider` + `useAuth()` hook — fetches `/api/auth/me`, manages logout                          |
| `project/src/app/api/auth/login/route.ts`  | `POST /api/auth/login` — bcrypt password verify, JWT cookie response, timing-safe enumeration guard |
| `project/src/app/api/auth/logout/route.ts` | `POST /api/auth/logout` — clears `auth_token` cookie                                                |
| `project/src/app/api/auth/me/route.ts`     | `GET /api/auth/me` — returns current user; `PATCH /api/auth/me` — updates profile                   |
| `project/src/app/login/layout.tsx`         | Auth route layout (suppresses global nav)                                                           |
| `project/src/app/dashboard/page.tsx`       | Dashboard redirect hub — reads JWT, redirects to role-specific dashboard                            |

### Files to Modify

| File                                               | Change                                                                                                    |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `project/src/app/login/page.tsx`                   | Replace social login UI with hotel staff/customer login form (react-hook-form + zod, show/hide password) |
| `project/src/app/(account-pages)/account/page.tsx` | Replace static demo data with live `useAuth()` data; add `PATCH /api/auth/me` form                        |

---

## Planned Conversion — Phase 2: Layout & Navigation Overhaul

> **Status:** Not yet implemented

### Files to Create

| File                                            | Purpose                                                                                   |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `project/src/components/hotel/HotelSidebar.tsx` | Role-aware collapsible sidebar with spring animation, Lucide icons, active path detection |

### Files to Modify

| File                                                              | Change                                                                                                                                                             |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `project/src/app/layout.tsx`                                      | Add `AuthProvider` wrapper; change body bg to `#fcfaf8` / `#0a0a0a`                                                                                                |
| `project/src/data/navigation.ts`                                  | Replace `NAVIGATION_DEMO` with hotel nav items (Rooms, Services, My Bookings, Dashboard)                                                                           |
| `project/src/app/page.tsx`                                        | Full rewrite — hotel landing page with Hero, stats row, SectionHowItWork; remove all multi-listing demo sections                                                   |
| `project/src/app/(client-components)/(Header)/SiteHeader.tsx`     | Remove template switcher/cog UI; hardcode `MainNav2`; add dashboard/admin routes to border-hide list                                                               |
| `project/src/app/(client-components)/(Header)/MainNav2.tsx`       | Add `useAuth()` — conditional auth state (logged in → AvatarDropdown, else → Sign In link); remove HeroSearchForm tabs, TemplatesDropdown, "List your property"    |
| `project/src/app/(client-components)/(Header)/AvatarDropdown.tsx` | Real user name/email/role from `useAuth()`; update nav links; logout calls `useAuth().logout()`                                                                    |
| `project/src/shared/Logo.tsx`                                     | Hotel brand: "Hotel**OS**" with Lucide `Hotel` icon; orange "OS" suffix                                                                                            |

---

## Planned Conversion — Phase 3: Data Access Layer

> **Status:** Not yet implemented

### Files to Create (all server-side Supabase query helpers)

| File                             | Exports                                                                                                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `project/src/lib/db/rooms.ts`    | `getAvailableRooms`, `getAllRooms`, `getRoomById`, `updateRoomStatus`, `getRoomTypes`                                                                             |
| `project/src/lib/db/bookings.ts` | `createBooking`, `getBookingById`, `getBookingsByGuest`, `getBookingsByUser`, `getTodaysArrivals`, `getTodaysDepartures`, `updateBookingStatus`, `getAllBookings` |
| `project/src/lib/db/services.ts` | `getServices`, `getAllServices`, `createServiceOrder`, `getOrdersByBooking`, `getPendingOrders`, `updateOrderStatus`                                              |
| `project/src/lib/db/users.ts`    | `getUserByEmail`, `getAllUsers`, `updateUser`, `createUser` (bcrypt hashes password), `getStaffList`                                                              |
| `project/src/lib/db/reports.ts`  | `getRevenueByPeriod`, `getOccupancyRate`, `getTopServices`, `getDashboardStats`                                                                                   |

---

## Planned Conversion — Phase 4: Room System (UC03, UC04, UC08)

> **Status:** Not yet implemented

### Hotel UI Components to Create

| File                                               | Purpose                                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `project/src/components/hotel/RoomCard.tsx`        | CardShell pattern (outer mover + inner shell), spring hover, VND price, status badge |
| `project/src/components/hotel/RoomSearchBar.tsx`   | Glass search bar — check-in/out dates, guest count, pushes URL params                |
| `project/src/components/hotel/RoomStatusBadge.tsx` | Color-coded badge for AVAILABLE / IN_USE / DIRTY / MAINTENANCE                       |

### Pages to Create

| File                                     | Purpose                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `project/src/app/rooms/page.tsx`         | Room listing — server component, search params, room type filter chips, available/all rooms grid |
| `project/src/app/rooms/[id]/page.tsx`    | Room detail — image gallery, amenities, sticky booking panel with date inputs                    |
| `project/src/app/book/[roomId]/page.tsx` | Booking form — react-hook-form, price summary, `POST /api/bookings` on submit                    |
| `project/src/app/housekeeping/page.tsx`  | Housekeeping grid — rooms grouped by floor, inline status dropdown, live PATCH updates           |

### API Routes to Create

| File                                             | Methods                                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `project/src/app/api/rooms/route.ts`             | `GET` — list available or all rooms                                                   |
| `project/src/app/api/rooms/[id]/route.ts`        | `GET` — single room detail                                                            |
| `project/src/app/api/bookings/route.ts`          | `GET` all bookings (auth); `POST` create booking (double-check race condition guard)  |
| `project/src/app/api/rooms/[id]/status/route.ts` | `PATCH` — update room status (HOUSEKEEPING/RECEPTIONIST/ADMIN only), writes audit log |

---

## Planned Conversion — Phase 5: Check-in with AI OCR (UC05)

> **Status:** Not yet implemented

### Files to Create

| File                                           | Purpose                                                                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `project/src/components/hotel/OcrUploader.tsx` | Drag-and-drop image upload, MIME/size validation, scan states, `onExtracted` callback                                          |
| `project/src/app/api/ocr/route.ts`             | `POST /api/ocr` — auth guard (RECEPTIONIST/ADMIN), MIME+size validation, mock OCR response with real integration TODO comments |
| `project/src/app/checkin/page.tsx`             | 3-step check-in flow: find booking → OCR scan + guest form → confirm                                                           |
| `project/src/app/api/checkin/route.ts`         | `POST /api/checkin` — upserts guest, updates booking to CHECKED_IN, sets room to IN_USE, writes audit log                      |
| `project/src/app/api/bookings/[id]/route.ts`   | `GET` single booking (customer ownership check)                                                                                |

---

## Planned Conversion — Phase 6: Service Orders (UC06, UC07)

> **Status:** Not yet implemented

### Files to Create

| File                                           | Purpose                                                                          |
| ---------------------------------------------- | -------------------------------------------------------------------------------- |
| `project/src/components/hotel/ServiceCard.tsx` | CardShell card with qty stepper, category badge, add-to-cart button              |
| `project/src/components/hotel/OrderCart.tsx`   | Floating cart button + slide-in drawer, line items, `POST /api/orders` on place  |
| `project/src/app/services/page.tsx`            | Service catalog — category tab filter, skeleton loading, `OrderCart` integrated  |
| `project/src/hooks/useRealtimeOrders.ts`       | Supabase Realtime subscription on `service_orders` (INSERT + UPDATE events)      |
| `project/src/app/orders/page.tsx`              | Kanban queue (Pending / In Progress / Done), live updates, status action buttons |
| `project/src/app/api/services/route.ts`        | `GET` services (public); `POST` create service (ADMIN only)                      |
| `project/src/app/api/orders/route.ts`          | `GET` orders (role-scoped); `POST` create order with items                       |
| `project/src/app/api/orders/[id]/route.ts`     | `PATCH` update order status (staff only), writes audit log                       |

---

## Planned Conversion — Phase 7: Invoices & Payments (UC09, UC10)

> **Status:** Not yet implemented

### Files to Create

| File                                                 | Purpose                                                                                                   |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `project/src/components/hotel/InvoiceTable.tsx`      | Invoice with room charges, service line items, 10% VAT, Print button                                      |
| `project/src/app/bookings/page.tsx`                  | Booking history list — server component, role-scoped (customer sees own, staff sees all)                  |
| `project/src/app/bookings/[id]/page.tsx`             | Booking detail + invoice + service orders timeline                                                        |
| `project/src/app/bookings/[id]/CheckoutButton.tsx`   | Client-side checkout form — payment method, amount, `POST /api/checkin/[id]/checkout`                     |
| `project/src/app/api/bookings/[id]/invoice/route.ts` | `GET` invoice — room charges + completed service totals + 10% VAT                                         |
| `project/src/app/api/checkin/[id]/checkout/route.ts` | `POST` checkout — updates booking to CHECKED_OUT, room to DIRTY, creates payment record, writes audit log |

---

## Planned Conversion — Phase 8: Role-Based Dashboards

> **Status:** Not yet implemented

### Files to Create

| File                                              | Purpose                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| `project/src/components/hotel/StatsCard.tsx`      | Animated metric card with icon, trend badge, spring hover                |
| `project/src/app/dashboard/layout.tsx`            | Dashboard layout — server auth guard, `HotelSidebar` + main content area |
| `project/src/app/dashboard/admin/page.tsx`        | Admin stats grid, occupancy donut, quick action links to all admin pages |
| `project/src/app/dashboard/receptionist/page.tsx` | Today's arrivals + departures lists with Check In / Checkout links       |
| `project/src/app/dashboard/customer/page.tsx`     | Active booking hero card, recent bookings list, quick action links       |
| `project/src/app/dashboard/kitchen/page.tsx`      | Redirect to `/orders`                                                    |
| `project/src/app/dashboard/housekeeping/page.tsx` | Redirect to `/housekeeping`                                              |

---

## Planned Conversion — Phase 9: Admin CRUD & Reports (UC11)

> **Status:** Not yet implemented

### Shared Admin Components to Create

| File                                          | Purpose                                                                 |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| `project/src/components/hotel/DataTable.tsx`  | Generic sortable/searchable/paginated table with edit/delete actions    |
| `project/src/components/hotel/AdminModal.tsx` | Framer Motion CRUD modal with backdrop, scrollable content, footer slot |

### Admin Pages to Create

| File                                        | Purpose                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| `project/src/app/admin/layout.tsx`          | Admin layout — ADMIN role guard, `HotelSidebar`                                |
| `project/src/app/admin/rooms/page.tsx`      | Room CRUD — DataTable + modal form with room type/status selectors             |
| `project/src/app/admin/room-types/page.tsx` | Room Type CRUD — amenities (CSV), images (newline), price/capacity             |
| `project/src/app/admin/users/page.tsx`      | User CRUD — role selector, password on create only, active toggle              |
| `project/src/app/admin/staff/page.tsx`      | Staff management — link user accounts to departments/shifts                    |
| `project/src/app/admin/services/page.tsx`   | Service CRUD — category, price, inline available toggle                        |
| `project/src/app/admin/reports/page.tsx`    | Revenue reports — date range picker, bar chart, top services table, CSV export |

### Admin API Routes to Create

| File                                                 | Methods         |
| ---------------------------------------------------- | --------------- |
| `project/src/app/api/admin/rooms/route.ts`           | `GET`, `POST`   |
| `project/src/app/api/admin/rooms/[id]/route.ts`      | `PUT`, `DELETE` |
| `project/src/app/api/admin/room-types/route.ts`      | `GET`, `POST`   |
| `project/src/app/api/admin/room-types/[id]/route.ts` | `PUT`, `DELETE` |
| `project/src/app/api/admin/users/route.ts`           | `GET`, `POST`   |
| `project/src/app/api/admin/users/[id]/route.ts`      | `PUT`           |
| `project/src/app/api/admin/services/route.ts`        | `GET`, `POST`   |
| `project/src/app/api/admin/services/[id]/route.ts`   | `PUT`, `DELETE` |
| `project/src/app/api/admin/staff/route.ts`           | `GET`, `POST`   |
| `project/src/app/api/admin/reports/route.ts`         | `GET`           |

---

## Database Schema (Planned)

### Tables

| Table                 | Primary Key | Description                                                             |
| --------------------- | ----------- | ----------------------------------------------------------------------- |
| `users`               | `id` UUID   | Staff + customer accounts, role enum, bcrypt password hash              |
| `guests`              | `id` UUID   | Hotel guest profiles with ID card info                                  |
| `room_types`          | `id` UUID   | Room categories with base price, amenities, images                      |
| `rooms`               | `id` UUID   | Physical rooms referencing room_types                                   |
| `bookings`            | `id` UUID   | Reservations lifecycle (PENDING → CONFIRMED → CHECKED_IN → CHECKED_OUT) |
| `services`            | `id` UUID   | Service catalog (FOOD, BEVERAGE, LAUNDRY, AMENITY, OTHER)               |
| `service_orders`      | `id` UUID   | Guest service requests per booking                                      |
| `service_order_items` | `id` UUID   | Line items per service order                                            |
| `payments`            | `id` UUID   | Payment records per booking                                             |
| `staffs`              | `id` UUID   | Staff profiles linked to users                                          |
| `audit_logs`          | `id` UUID   | Critical action audit trail                                             |

### Key Functions

- `is_room_available(room_id, check_in, check_out, exclude_booking_id)` — prevents double booking

---

## Setup Instructions

1. `cd project && npm install`
2. `npm run dev`
3. Open `http://localhost:3000`

### Future Setup (After HSRM Conversion)

1. Copy `.env.local.example` → `.env.local` and fill in Supabase + JWT credentials
2. Run `supabase/migrations/001_hsrm_schema.sql` in Supabase SQL editor
3. `cd project && npm run dev`
4. Login: `admin@hotel.com` / `admin123`

---

## Routes Reference

### Current Routes (Chisfis Template)

| Route                           | Access | Purpose                    |
| ------------------------------- | ------ | -------------------------- |
| `/`                             | Public | Home — travel booking hero |
| `/home-2`                       | Public | Real estate home variant   |
| `/home-3`                       | Public | Booking home variant       |
| `/login`                        | Public | Login (social + email)     |
| `/signup`                       | Public | Registration               |
| `/about`                        | Public | About page                 |
| `/contact`                      | Public | Contact page               |
| `/blog`                         | Public | Blog listing               |
| `/listing-stay`                 | Public | Stay search                |
| `/listing-stay-map`             | Public | Stay search (map)          |
| `/listing-stay-detail`          | Public | Stay detail                |
| `/listing-car`                  | Public | Car rental search          |
| `/listing-car-map`              | Public | Car search (map)           |
| `/listing-car-detail`           | Public | Car detail                 |
| `/listing-experiences`          | Public | Experiences search         |
| `/listing-experiences-map`      | Public | Experiences (map)          |
| `/listing-experiences-detail`   | Public | Experience detail          |
| `/listing-flights`              | Public | Flights search             |
| `/listing-real-estate`          | Public | Real estate search         |
| `/listing-real-estate-map`      | Public | Real estate (map)          |
| `/add-listing/[1-10]`          | Public | Multi-step listing form    |
| `/checkout`                     | Public | Checkout flow              |
| `/pay-done`                     | Public | Payment confirmation       |
| `/author`                       | Public | Author profile             |
| `/account`                      | Public | Account settings           |
| `/account-billing`              | Public | Billing management         |
| `/account-password`             | Public | Password change            |
| `/account-savelists`            | Public | Saved listings             |
| `/subscription`                 | Public | Subscription plans         |

### Planned Routes (After HSRM Conversion)

| Route            | Access             | Purpose                       |
| ---------------- | ------------------ | ----------------------------- |
| `/`              | Public             | Hotel landing page            |
| `/login`         | Public             | Login for all roles           |
| `/rooms`         | Public             | Browse available rooms        |
| `/rooms/[id]`    | Public             | Room detail + booking panel   |
| `/book/[roomId]` | Auth               | Booking form                  |
| `/bookings`      | Auth               | Booking history               |
| `/bookings/[id]` | Auth               | Booking detail + invoice      |
| `/services`      | Auth               | Service catalog + order cart  |
| `/checkin`       | Receptionist/Admin | Check-in with OCR             |
| `/orders`        | Staff              | Real-time service order queue |
| `/housekeeping`  | Housekeeping/Admin | Room status grid              |
| `/dashboard/*`   | Role-specific      | Per-role dashboards           |
| `/admin/*`       | Admin only         | Full CRUD management          |
| `/account`       | Auth               | User profile                  |
