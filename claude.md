# Project Reference & Development Guide

A detailed reference for building and maintaining this frontend project. Use this document when starting a new feature, onboarding, or aligning with existing standards.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack & Versions](#2-tech-stack--versions)
3. [Project Structure](#3-project-structure)
4. [Configuration](#4-configuration)
5. [Path Aliases](#5-path-aliases)
6. [Development Standards](#6-development-standards)
7. [Naming & File Conventions](#7-naming--file-conventions)
8. [Scripts](#8-scripts)
9. [Security & Headers](#9-security--headers)
10. [Quick Reference Checklist](#10-quick-reference-checklist)

---

## 1. Overview

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **UI:** React 19, Radix UI primitives, Tailwind CSS 4, shadcn-style components
- **State & Data:** TanStack Query (React Query), Zustand, React Hook Form + Zod
- **Styling:** Tailwind CSS with CSS variables (HSL), custom theme, `cn()` utility

---

## 2. Tech Stack & Versions

### Core

| Package        | Version  | Purpose                    |
|----------------|----------|----------------------------|
| next           | ^16.0.10 | React framework, App Router |
| react          | 19.2.3   | UI library                 |
| react-dom      | 19.2.3   | DOM rendering              |
| typescript     | ^5.9.3   | Type safety                |

### UI & Styling

| Package              | Version   | Purpose                          |
|----------------------|-----------|----------------------------------|
| tailwindcss          | ^4        | Utility-first CSS                |
| @tailwindcss/postcss | ^4        | PostCSS integration              |
| tailwindcss-animate  | ^1.0.7    | Animations                       |
| tailwind-merge       | ^3.4.0    | Merge Tailwind classes           |
| clsx                 | ^2.1.1    | Conditional class names          |
| class-variance-authority | ^0.7.1 | Component variants               |
| framer-motion        | ^12.23.24 | Animations                       |
| lucide-react         | ^0.553.0  | Icons                            |
| Radix UI (multiple)   | ^1.x / ^2.x | Accessible primitives (Dialog, Select, etc.) |

### Forms & Validation

| Package              | Version   | Purpose                    |
|----------------------|-----------|----------------------------|
| react-hook-form      | ^7.66.0   | Form state & validation    |
| @hookform/resolvers  | ^5.2.2    | Zod (and other) resolvers  |
| zod                  | ^4.1.12   | Schema validation          |
| validator            | ^13.15.22 | String validation helpers  |
| libphonenumber-js    | ^1.12.26  | Phone validation           |

### Data Fetching & State

| Package                | Version   | Purpose                    |
|------------------------|-----------|----------------------------|
| @tanstack/react-query  | ^5.90.7   | Server state, caching      |
| @tanstack/react-table  | ^8.21.3   | Tables, sorting, pagination |
| zustand                | ^5.0.8    | Client state               |
| axios                  | ^1.13.2   | HTTP client                |

### Other Notable

| Package                    | Version   | Purpose                    |
|----------------------------|-----------|----------------------------|
| date-fns / date-fns-tz     | ^4.1.0 / ^3.2.0 | Dates & timezones    |
| recharts                   | ^3.5.1    | Charts                     |
| sonner                     | ^2.0.7    | Toasts (via Toaster)       |
| jwt-decode                 | ^4.0.0    | JWT parsing                |
| react-dropzone             | ^14.3.8   | File uploads               |
| react-phone-number-input   | ^3.4.13   | Phone input UI             |
| cmdk                       | ^1.1.1    | Command palette            |
| leaflet / react-leaflet    | ^1.9.4 / ^5.0.0 | Maps              |

### Dev & Linting

| Package                  | Version   | Purpose                    |
|--------------------------|-----------|----------------------------|
| eslint                    | ^8.57.0   | Linting                    |
| eslint-config-next        | 15.3.5    | Next.js ESLint rules       |
| @typescript-eslint/*      | ^8.46.3   | TypeScript ESLint          |
| eslint-config-prettier    | ^10.1.8   | Prettier + ESLint          |
| eslint-plugin-prettier    | ^5.5.4    | Prettier as ESLint rule    |
| prettier                  | ^3.3.3    | Formatting                 |
| prettier-plugin-tailwindcss | ^0.7.1  | Tailwind class sorting     |

---

## 3. Project Structure

```
frontend-service/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group (login, register, verify)
│   ├── (private)/                # Authenticated route group
│   │   ├── layout.tsx             # Private layout (sidebar, etc.)
│   │   ├── dashboard/            # Role-based dashboard routes
│   │   ├── organization/         # Org hierarchy (branch, site, area, department)
│   │   ├── access-management/    # Staff, crews, user assignment
│   │   ├── workforce-planning/   # Shifts, tasks, demand, schedule
│   │   ├── leaves-holidays/      # Leave rules, requests, balance
│   │   ├── attendance/
│   │   ├── performance/
│   │   ├── help/                 # Tickets, SLA
│   │   ├── notification/
│   │   ├── profile/
│   │   ├── settings/
│   │   └── ...
│   ├── errors/                   # Error pages (e.g. unauthorized)
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles, CSS variables
│   ├── page.tsx
│   └── not-found.tsx
├── components/
│   ├── ui/                       # Reusable UI primitives (Button, Dialog, Form, etc.)
│   └── common/                   # Shared layout (Sidebar, Navbar, Pagination, etc.)
├── config/
│   ├── axios.ts                  # Axios instance, interceptors
│   └── encryption.ts
├── data/                         # Static data, constants, enums
│   ├── index.ts                  # Re-exports, APP_NAME, role constants
│   ├── navItems.ts
│   ├── pageSize.ts
│   └── ...
├── hooks/                        # Custom React hooks
├── lib/                          # Utilities (auth, time, validators, utils)
├── providers/
│   └── AppProvider.tsx           # QueryClientProvider, Toaster
├── schemas/                      # Zod schemas (forms, API payloads)
├── types/                        # TypeScript type definitions (.d.ts or .ts)
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc.json
└── package.json
```

### Route & Page Patterns

- **Route groups:** `(auth)`, `(private)` — no segment in URL.
- **Dynamic segments:** `[crewUuid]`, `[userUuid]`, `[userId]`.
- **Page components:** `page.tsx` in each route folder.
- **Feature components:** Colocate under `components/` next to the route (e.g. `app/(private)/organization/branch/components/`).

---

## 4. Configuration

### TypeScript (`tsconfig.json`)

- **Strict:** `strict: true`
- **Unused:** `noUnusedLocals`, `noUnusedParameters` enabled
- **Paths:** `@*` → `./*` (e.g. `@components`, `@lib`, `@config`, `@data`, `@schemas`, `@types` via folder names)
- **JSX:** `react-jsx`
- **Module:** `esnext`, `bundler` resolution

### ESLint (`.eslintrc.js`)

- **Extends:** `eslint:recommended`, `next/core-web-vitals`, `next/typescript`, `@typescript-eslint/recommended`, `prettier`
- **Parser:** `@typescript-eslint/parser`
- **Rules:**
  - `@typescript-eslint/no-explicit-any`: error
  - `@typescript-eslint/no-unused-vars`: error, with `argsIgnorePattern: "^_"`

### Prettier (`.prettierrc.json`)

- **Indent:** Tabs
- **Tab width:** 4
- **Quotes:** Double for JS/TS, as-needed for props
- **Semicolons:** true
- **Trailing comma:** es5
- **Line ending:** LF
- **Arrow parens:** avoid when single param (e.g. `x => x`)
- **Print width:** 250
- **Plugins:** `prettier-plugin-tailwindcss` (class sorting)

### Tailwind (`tailwind.config.ts`)

- **Content:** `./pages/**/*`, `./components/**/*`, `./app/**/*` (js, ts, jsx, tsx, mdx)
- **Theme:** Extended with CSS variable-based colors (background, foreground, primary, destructive, muted, accent, card, popover, border, input, ring, chart), custom `brand`, `text`, `org`, and `radius` variables
- **Plugins:** `tailwindcss-animate`

### PostCSS (`postcss.config.mjs`)

- Uses `@tailwindcss/postcss` only (Tailwind v4 style).

### Next.js (`next.config.ts`)

- **Images:** `remotePatterns` for allowed image hostnames (e.g. flagcdn, minio).
- **Logging:** `fetches.fullUrl: true`
- **React:** `reactStrictMode: true`
- **Headers:** Security headers applied (see [Security & Headers](#9-security--headers)).
- **Redirects:** `/` → `/dashboard` (permanent).

---

## 5. Path Aliases

Use the `@` prefix for consistent imports:

| Alias (conceptual) | Path   | Example import                    |
|--------------------|--------|-----------------------------------|
| @components        | ./components | `import { Button } from "@components/ui/button"` |
| @lib               | ./lib       | `import { cn } from "@lib/utils"` |
| @config            | ./config    | `import axios from "@config/axios"` |
| @data              | ./data      | `import { cardPageSizes } from "@data"` |
| @schemas           | ./schemas   | `import { CreateBranchSchema } from "@schemas/branch"` |
| @hooks             | ./hooks     | `import { useNotification } from "@hooks/useNotification"` |
| @providers         | ./providers | `import AppProvider from "@providers/AppProvider"` |
| @types             | ./types     | Types are often global; import when needed |

`tsconfig.json` has `"@*": ["./*"]`, so `@/` also resolves to project root (e.g. `@/components/ui/toaster`).

---

## 6. Development Standards

### 6.1 Components

- **Client components:** Add `"use client";` at the top when using hooks, browser APIs, or client-only libraries.
- **UI building block:** Use `cn()` from `@lib/utils` for conditional Tailwind classes.
- **Composition:** Prefer small, focused components; use `components/ui` for primitives and `components/common` for app-wide layout (sidebar, navbar, pagination).
- **Props:** Prefer explicit TypeScript interfaces for component props; avoid `any`.

Example:

```tsx
"use client";
import { Button } from "@components/ui/button";
import { cn } from "@lib/utils";

interface CardPaginationControlsProps {
	pageIndex: number;
	pageCount: number;
	onPageChange: (pageIndex: number) => void;
	// ...
}

export const CardPaginationControls = ({ pageIndex, pageCount, onPageChange, ... }: CardPaginationControlsProps) => {
	// ...
	return <div className={cn("flex w-full flex-col gap-3", ...)}>...</div>;
};
```

### 6.2 Forms

- **Library:** React Hook Form with Zod via `@hookform/resolvers/zod`.
- **Schema:** Define Zod schemas in `schemas/` (e.g. `schemas/branch.ts`), one file per domain; export create/update schemas as needed.
- **Form component:** Use the shared `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` from `@components/ui/form`.
- **Type inference:** Use `z.infer<typeof YourSchema>` for form type and handlers.

Example:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateBranchSchema } from "@schemas/branch";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@components/ui/form";

const form = useForm<z.infer<typeof CreateBranchSchema>>({
	resolver: zodResolver(CreateBranchSchema),
	defaultValues: { branchName: "", siteUuid: "", /* ... */ },
});
```

- **Validation:** Use Zod with `validator` (e.g. `isEmail`, `isPostalCode`, `isAlpha`, `isAlphanumeric`) and custom helpers in `lib` (e.g. `contactValidator`) where needed.
- **Toasts:** Use `toast` from `@/components/ui/toaster` (or `sonner`) for success/error/loading (e.g. `toast.loading`, `toast.success`, `toast.error`).

### 6.3 Data Fetching

- **HTTP client:** Use the shared Axios instance from `@config/axios` (base URL from `NEXT_PUBLIC_API_URL`, `withCredentials: true`, 401 → redirect to `/auth/login`).
- **Server state:** Use TanStack Query (`useQuery`, `useMutation`, `useQueryClient`). Wrap app with `QueryClientProvider` in `AppProvider`.
- **Query keys:** Use arrays (e.g. `["branches-all", globalFilter, pageIndex, pageSize]`) for cache keys; include filters and pagination for consistency.
- **Query function:** Accept `{ queryKey }` and derive params from `queryKey`; use `initialData: []` or similar where appropriate to avoid undefined.
- **Mutations:** On success, invalidate relevant query keys and optionally show toast; on error, handle via toast or form `setError`.
- **Errors:** Type API errors (e.g. `AxiosError`, project `ErrorData`) and avoid `any`.

Example:

```tsx
import axios from "@config/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

const getAllBranches = async ({ queryKey }: { queryKey: QueryKey }) => {
	const [, branchName, page, size] = queryKey as [string, string, number, number];
	const params = new URLSearchParams({ page: String(page), size: String(size) });
	if (branchName) params.append("branchName", branchName);
	const response = await axios.get(`/hospital-management/api/branch/all?${params}`);
	return response?.data?.content ?? [];
};

const { data, isFetching } = useQuery({
	queryKey: ["branches-all", globalFilter, pagination.pageIndex, pagination.pageSize],
	queryFn: getAllBranches,
	initialData: [],
	retry: 0,
});
```

### 6.4 Tables

- **Library:** `@tanstack/react-table` with column definitions, sorting, filtering, pagination.
- **Pagination UI:** Use `TablePaginationControls` or `CardPaginationControls` from `@components/common` as appropriate.
- **State:** Keep `sorting`, `columnFilters`, `columnVisibility`, `pagination` in component state and pass to `useReactTable` state; use `getCoreRowModel`, `getFilteredRowModel`, `getSortedRowModel`, `getPaginationRowModel` as needed.
- **Columns:** Define in a `columns` file (e.g. `createBranchesColumns`) and memoize with `useMemo` if they depend on props.

### 6.5 Types

- **Location:** `types/*.d.ts` (or `.ts`) for domain and API types (e.g. `Branch`, `AuthSession`, `ErrorData`).
- **Naming:** PascalCase for types/interfaces; match API/domain concepts.
- **Global types:** Some types are used globally (e.g. `AuthSession`, `ErrorData`); ensure they are either in `types/` and imported or declared in a global `.d.ts` if appropriate.
- **No `any`:** Prefer explicit types or `unknown` with type guards; ESLint forbids `any`.

### 6.6 Schemas (Zod)

- **Location:** `schemas/*.ts`; one file per domain (e.g. `branch.ts`, `leaveRequest.ts`).
- **Exports:** Export both create and update schemas when needed (e.g. `CreateBranchSchema`, `UpdateBranchSchema`).
- **Reuse:** Use Zod’s `.refine()` with `validator` or custom helpers for email, phone, postal code, alphanumeric, etc.
- **Infer types:** Use `z.infer<typeof Schema>` for form values and API payload types where it fits.

### 6.7 Styling

- **Utility-first:** Prefer Tailwind classes; use `cn()` for conditional/merged classes.
- **Theme:** Use semantic tokens from `tailwind.config` (e.g. `background`, `foreground`, `primary`, `destructive`, `muted`, `card`, `border`, `ring`); use custom `brand`, `text`, `org` if defined.
- **CSS variables:** Theme colors are defined in `app/globals.css` (`:root` and optional `.dark`); extend in Tailwind theme as needed.
- **Consistency:** Follow existing patterns in `components/ui` and `components/common` for spacing, typography, and breakpoints.

### 6.8 Layout & Routing

- **Root layout:** Wraps with font (e.g. Poppins), `cn()`, and `AppProvider`; imports `globals.css`.
- **Private layout:** Under `app/(private)/layout.tsx`; typically sidebar + main content.
- **Auth layout:** Under `app/(auth)/` for login, register, verify.
- **Redirect:** Root `/` redirects to `/dashboard` in `next.config.ts`.

---

## 7. Naming & File Conventions

- **Components:** PascalCase (e.g. `CardPaginationControls.tsx`, `CreateBranchDialog.tsx`).
- **Hooks:** `use` prefix, camelCase (e.g. `useNotification.tsx`, `usePasswordToggle.tsx`).
- **Utils/lib:** camelCase (e.g. `getToken.ts`, `contactValidator.ts`).
- **Schemas:** camelCase file, PascalCase schema names (e.g. `CreateBranchSchema` in `branch.ts`).
- **Types:** PascalCase (e.g. `Branch`, `AuthSession`); files can be PascalCase or camelCase (e.g. `Branch.d.ts`).
- **Constants/data:** camelCase or UPPER_SNAKE for constants (e.g. `APP_NAME`, `cardPageSizes` in `data/`).
- **Route folders:** kebab-case or lowercase (e.g. `leave-requests`, `access-management`).
- **Component folders:** Prefer `components` next to the route (e.g. `app/(private)/organization/branch/components/`).

---

## 8. Scripts

| Script   | Command    | Purpose           |
|----------|------------|-------------------|
| dev      | `next dev` | Development server |
| build    | `next build` | Production build  |
| start    | `next start` | Run production   |
| lint     | `eslint`   | Run ESLint        |

Run format with Prettier via your editor or CLI (e.g. `npx prettier --write .`).

---

## 9. Security & Headers

Next.js applies these headers (for non-api/static assets):

- **Permissions-Policy:** camera=(), geolocation=(self), microphone=*
- **Referrer-Policy:** strict-origin-when-cross-origin
- **Strict-Transport-Security:** max-age=63072000; includeSubDomains; preload
- **X-Content-Type-Options:** nosniff
- **X-Frame-Options:** DENY
- **X-XSS-Protection:** 1; mode=block
- **X-Permitted-Cross-Domain-Policies:** none
- **Cache-Control:** no-store, max-age=0, no-cache
- **Cross-Origin-Opener-Policy:** same-origin

---

## 10. Quick Reference Checklist

When adding a new feature:

- [ ] Use **path aliases** (`@components`, `@lib`, `@config`, `@data`, `@schemas`, etc.).
- [ ] Add **"use client"** only where needed (hooks, browser APIs, client-only deps).
- [ ] Define **TypeScript types** in `types/` and avoid `any`.
- [ ] Put **Zod schemas** in `schemas/` and use **react-hook-form** + **zodResolver** for forms.
- [ ] Use **Axios** from `@config/axios` and **TanStack Query** for server state; invalidate queries after mutations.
- [ ] Use **Tailwind** and **cn()** for styling; stick to theme tokens and CSS variables.
- [ ] Run **ESLint** (`npm run lint`) and fix errors; keep **Prettier** formatting (tabs, LF, plugin-tailwindcss).
- [ ] Colocate **route-specific components** under the route’s `components/` folder when it keeps the feature self-contained.
- [ ] Use **toast** for user feedback (loading/success/error) and handle **API errors** with typed error handling.

---

*This document is derived from the current project structure, configuration, and patterns. Update it as the project evolves.*
