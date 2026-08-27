# Agri-Aqua Network

> **Tagline:** *Connect. Trade. Grow.*  
> **Positioning:** A high-trust B2B digital business network and marketplace connecting the Agriculture and Aquaculture ecosystem across Farmers, Buyers, Agents, Service Providers, and Administrators.

---

## 📌 Project Overview

**Agri-Aqua Network** bridges the fragmented agricultural and aquacultural supply chains. It combines:
1. **B2B Multi-Vendor Marketplace:** Dual specialized channels for Agriculture (crops, seeds, fertilizers) and Aquaculture (shrimp, fish, hatcheries, feed).
2. **Business Network:** Verified enterprise directory, connection requests, and professional inquiries.
3. **Services Ecosystem:** On-demand machinery rental, cold storage, soil/water testing, and logistics.
4. **Contextual Communication & Operations:** In-app messaging with pinned listing/order cards, multi-channel notification hub, and a dedicated field agent CRM.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5.x (Strict Mode) |
| **Styling & Tokens** | Tailwind CSS v3 (Google Stitch Design Tokens) |
| **Icons & Primitives** | Lucide React + Radix UI Primitives |
| **Database** | PostgreSQL 16 |
| **ORM & Migrations** | Prisma ORM |
| **Validation** | Zod |
| **Authentication** | NextAuth.js / Auth.js (JWT + Database Session) |
| **Storage** | S3-Compatible Object Storage (Cloudflare R2 / AWS S3 / MinIO) |
| **Testing** | Vitest + React Testing Library + Playwright |

---

## 🎨 Google Stitch Design System Baseline

The application visual foundation directly replicates the approved Google Stitch design system ([Project 7099992242572219234](https://stitch.withgoogle.com/projects/7099992242572219234)):

- **Primary (`#064e3b`):** Deep Forest / Emerald Green (Brand anchor, primary CTAs, sidebar headers).
- **Secondary (`#0891b2` / `#006780`):** Aquatic Teal / Cyan (Interactive highlights, tabs, category tags).
- **Surface (`#f8f9ff`):** Clean slate-tinted background with layered containers (`#eff4ff`, `#e6eeff`, `#dde9ff`, `#d5e3fd`).
- **Typography:** `Plus Jakarta Sans` for Headlines/Display; `Inter` for Body/Functional Data.
- **Grid:** 12-column desktop (1280px max-width, 40px outer margin, 24px gutter); 4-column Android mobile (16px margin, 16px gutter).

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js `v20.x` or `v22.x`
- npm `v10.x` or pnpm / yarn
- PostgreSQL `16.x` (or local Docker container)

### 1. Installation
```bash
git clone <repo-url>
cd Aqua-Agri
npm install
```

### 2. Environment Configuration
Copy the template and fill in local connection values:
```bash
cp .env.example .env
```

### 3. Database Initialization (Prisma)
```bash
# Validate schema
npm run prisma:validate

# Generate Prisma Client
npm run prisma:generate
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the foundation shell.

---

## 🧪 Testing & Verification Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server |
| `npm run build` | Compiles production Next.js bundle |
| `npm run start` | Starts compiled production server |
| `npm run lint` | Executes ESLint validation |
| `npm run type-check` | Runs TypeScript type checking with zero emits |
| `npm test` | Runs unit & component tests with Vitest |
| `npm run test:e2e` | Executes Playwright end-to-end test suite |
| `npm run prisma:generate` | Generates typed Prisma Client |
| `npm run prisma:validate` | Validates Prisma schema syntax |

---

## 🌿 Git Workflow

- **`main`**: Production-ready releases.
- **`development`**: Active integration branch.
- **`feature/*`**: Feature branches (`feature/auth`, `feature/marketplace`, `feature/orders`, etc.).

---

## 📍 Current Status & V1 Scope

**CURRENT PHASE:**  
`Phase 1 — Project Foundation & Next.js Baseline` (Complete & Verified)

**NEXT PHASE (Pending Approval):**  
`Phase 2 — Authentication, Sessions & Multi-Role RBAC`
