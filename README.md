# LifePulse — Blood Bank Management System (BMS)

> **A Certified Regional Blood Bank & Healthcare Facility Inventory Network**  
> Built with Next.js 16 (App Router), TypeScript, Prisma ORM (Cloud PostgreSQL / SQLite), NextAuth.js, Tailwind CSS v4, Recharts, and Vitest.

---

## 1. Project Overview

The **LifePulse Blood Management System (BMS)** models the real-world operational lifecycle of a certified regional blood bank connecting donors, healthcare facilities, and patients:

$$\text{Donor} \longrightarrow \text{Blood Donation} \longrightarrow \text{Blood Inventory} \longrightarrow \text{Blood Request} \longrightarrow \text{Approval} \longrightarrow \text{Fulfillment}$$

### Key System Guarantees:
- **Provable Inventory Correctness**: Blood stock increments strictly upon clinical verification of a donation record, and decrements only upon physical fulfillment and handover of units.
- **Atomic State Machines**: Transactions wrapped in Prisma `$transaction` prevent double-deduction, double-verification, and negative inventory states.
- **Strict Role-Based Access Control (RBAC)**: Distinct permissions for Donors, Patients/Hospitals, and Administrators, enforced at both the edge middleware and server-side API route guards.
- **Multi-Center Network & Finder**: Universal real-time search across certified partner blood banks and hospitals with emergency triage filters.

---

## 2. Comprehensive Documentation

Detailed technical documentation is available in the [`docs/`](./docs) directory:

- 📐 [**System Architecture Documentation** (`docs/ARCHITECTURE.md`)](./docs/ARCHITECTURE.md)  
  *Detailed architectural diagrams, layer responsibilities, state machines, and concurrency safeguards.*
- 📡 [**REST API Reference** (`docs/API_REFERENCE.md`)](./docs/API_REFERENCE.md)  
  *Complete specification of all 32+ backend HTTP endpoints with parameters and response payloads.*
- 🚀 [**Production Deployment Handbook** (`docs/DEPLOYMENT.md`)](./docs/DEPLOYMENT.md)  
  *Step-by-step guide for deploying to Vercel with Neon Serverless Cloud PostgreSQL.*

---

## 3. Technology Stack

| Layer | Technology | Purpose & Rationale |
|---|---|---|
| **Framework** | **Next.js 16 (App Router) + TypeScript** | Unified full-stack React framework; co-locates presentation pages and backend HTTP route handlers without CORS complexity. |
| **Database & ORM** | **Prisma ORM + PostgreSQL / SQLite** | Type-safe queries, relational schema definitions, migrations, and ACID-compliant atomic transactions. |
| **Authentication** | **NextAuth.js v4 (JWT + Credentials)** | Encrypted session cookies, bcrypt password hashing (cost factor 10), and server-side RBAC guards. |
| **Styling** | **Tailwind CSS v4** | Clean healthcare design tokens (slate, teal, and rose accents) with fully responsive layouts. |
| **Visualizations** | **Recharts** | Real-time stock distribution bar charts and request status volume charts. |
| **Validation** | **Zod** | Shared input validation schemas across client forms and server endpoints. |
| **Testing** | **Vitest** | Fast unit test suite proving inventory state transitions and business invariants. |

---

## 4. Role Permissions Matrix

| Capability | Public | Donor | Patient/Hospital | Admin |
|---|:---:|:---:|:---:|:---:|
| View Live Blood Stock & Aggregate Levels | ✅ | ✅ | ✅ | ✅ |
| Search Partner Centers & Hospitals | ✅ | ✅ | ✅ | ✅ |
| Public Self-Registration | ✅ | ✅ | ✅ | ❌ (Seeded Only) |
| Record Own Donation | ❌ | ✅ | ❌ | ❌ |
| Verify / Reject Donation | ❌ | ❌ | ❌ | ✅ |
| Toggle Availability Status | ❌ | ✅ | ❌ | ❌ |
| Submit Blood Requisition | ❌ | ❌ | ✅ | ❌ |
| Cancel Own Requisition | ❌ | ❌ | ✅ (Pending/Approved) | ❌ |
| Approve / Reject / Fulfill Requisition | ❌ | ❌ | ❌ | ✅ |
| Direct Inventory Adjustments | ❌ | ❌ | ❌ | ✅ |
| Manage Partner Centers & Stock | ❌ | ❌ | ❌ | ✅ |
| Manage User Accounts & Soft-Deactivation | ❌ | ❌ | ❌ | ✅ |
| View System Reports & Audit Trail | ❌ | ❌ | ❌ | ✅ |

---

## 5. Clean Codebase & Project Structure

The project adheres to a clean, idiomatic Next.js App Router architecture:

```text
blood-management-system/
│
├── app/                                  # FRONTEND PAGES & BACKEND API CONTROLLERS
│   ├── (public)/                         # Public routes: /, /about, /contact, /how-it-works, /login, /register, /403
│   ├── blood-availability/page.tsx       # Live Blood & Hospital Finder
│   ├── centers/[id]/page.tsx             # Dynamic Blood Center Detail Page
│   ├── donor/                            # Donor Portal: /dashboard, /donations, /availability, /profile, /notifications
│   ├── patient/                          # Patient Portal: /dashboard, /search, /requests, /profile, /notifications
│   ├── admin/                            # Admin Portal: /dashboard, /inventory, /donations, /requests, /donors, /patients, /reports
│   │
│   ├── api/                              # BACKEND REST API ROUTE HANDLERS
│   │   ├── auth/                         # Authentication & registration endpoints
│   │   ├── blood-stock/                  # Public multi-center aggregated stock
│   │   ├── centers/                      # Center search, detail, city aggregation, and stock adjustments
│   │   ├── donor/                        # Donor profile, donations, and availability endpoints
│   │   ├── patient/                      # Patient profile and blood request endpoints
│   │   ├── admin/                        # Admin KPIs, stock adjustments, donations verify/reject, request approve/fulfill
│   │   └── notifications/                # User & admin notification endpoints
│   │
│   ├── layout.tsx                        # Global Root Layout (Navbar, ToastProvider, Providers, Footer)
│   ├── globals.css                       # Tailwind CSS v4 Theme & Custom Scrollbars
│   ├── not-found.tsx                     # 404 Not Found Page
│   └── error.tsx                         # Client Error Boundary Page
│
├── components/                           # REUSABLE FRONTEND UI COMPONENTS
│   ├── ui/                               # Atomic Components: Button, Badge, Card, Modal, States, Toast
│   ├── layout/                           # Structural Components: Navbar, Footer
│   ├── blood/                            # Blood Finder Components: BloodFinder, CenterDetailClient, PatientBloodFinder
│   ├── admin/                            # Admin Components: CentersAdminPanel, Charts
│   ├── providers/                        # Application Providers: Providers (NextAuth SessionProvider)
│   ├── BloodFinder.tsx                   # Backward-compatibility re-export
│   └── Providers.tsx                     # Backward-compatibility re-export
│
├── lib/                                  # BACKEND SERVICES, UTILS & SHARED LOGIC
│   ├── business-logic.ts                 # Domain Service: State Machine, Atomic Transactions, Audit Logs
│   ├── auth.ts                           # NextAuth Credentials Configuration & JWT Callbacks
│   ├── api-auth.ts                       # Backend Route Guards (requireAuth, requireRole)
│   ├── validations.ts                    # Zod Schemas (Register, Request, Donation, Stock, Center)
│   ├── constants.ts                      # Blood Group Enums, Display Mappings, Stock Thresholds
│   └── prisma.ts                         # Prisma Client Singleton
│
├── prisma/                               # DATABASE LAYER
│   ├── schema.prisma                     # Definitive Schema (PostgreSQL / SQLite)
│   ├── seed.ts                           # Comprehensive Multi-Role Demo Seed
│   └── dev.db                            # Local SQLite Database (fallback)
│
├── tests/                                # AUTOMATED TESTS
│   └── unit/                             # Unit tests for state machine and inventory logic
│       └── business-logic.test.ts
│
├── scripts/                              # VERIFICATION & OPERATIONAL TOOLING
│   ├── e2e-verify.ts                     # 14-Step End-to-End Simulation Script
│   ├── verify-finder-features.ts         # Multi-Center & Privacy Verification Script
│   └── switch-db.ts                      # PostgreSQL / SQLite Datasource Switcher
│
├── docs/                                 # DOCUMENTATION
│   ├── ARCHITECTURE.md                   # System Architecture & Technical Specifications
│   ├── API_REFERENCE.md                  # REST API Documentation
│   └── DEPLOYMENT.md                     # Production Deployment Handbook
│
├── .env.example                          # Environment Variables Template
├── middleware.ts                         # Edge RBAC Routing Middleware
├── next.config.ts                        # Next.js Configuration
├── package.json                          # Dependencies & NPM Scripts
├── tsconfig.json                         # TypeScript Configuration
└── vitest.config.ts                      # Vitest Configuration
```

---

## 6. Getting Started Locally

### Prerequisites
- **Node.js**: `v20` or higher
- **npm**: `v10` or higher

### Installation & Setup

1. **Clone and install dependencies**:
   ```bash
   git clone https://github.com/your-username/blood-management-system.git
   cd blood-management-system
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *The default configuration connects to the cloud Neon PostgreSQL database or local SQLite.*

3. **Initialize Database & Seed Data**:
   ```bash
   npx prisma db push
   npm run seed
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Demo Login Credentials

The seed script creates ready-to-use sample accounts across all three roles:

| Role | Email | Password | Primary Capabilities |
|---|---|---|---|
| **Admin** | `admin@bloodbank.org` | `Admin@123` | Multi-center inventory, verify donations, approve & fulfill blood requests, audit reports. |
| **Donor** | `rahul.donor@example.com` | `Donor@123` | View eligibility & donation stats, schedule donations, toggle availability status. |
| **Patient / Hospital** | `sarah.patient@example.com` | `Patient@123` | Search live blood stock, submit urgent/emergency blood requests, track requisition status. |

---

## 8. Verification & Testing

### Run Automated Build & Lint Check
```bash
npm run build
```
*Compiles all 49 routes with zero TypeScript errors and zero warnings.*

### Run State Machine Unit Tests
```bash
npm test
```
*Executes unit tests covering donation verification, request fulfillment, stock adjustment, and conflict detection.*

### Run End-to-End Simulation Script
```bash
npx tsx scripts/e2e-verify.ts
```
*Simulates the full 14-step operational lifecycle from donation to fulfillment.*

### Run Blood Finder Capabilities Script
```bash
npx tsx scripts/verify-finder-features.ts
```
*Validates multi-center inventories, city aggregation queries, search filters, and donor/patient privacy guards.*

---

## 9. Switching Database Datasource (Cloud Postgres vs Local SQLite)

LifePulse supports both cloud PostgreSQL (recommended for production/Vercel) and local SQLite (for offline development):

- **Switch to PostgreSQL**:
  ```bash
  npm run db:use-postgres
  ```
- **Switch to SQLite**:
  ```bash
  npm run db:use-sqlite
  ```

---

## 10. Deployment

See [**Production Deployment Handbook** (`docs/DEPLOYMENT.md`)](./docs/DEPLOYMENT.md) for full instructions on deploying to **Vercel** with **Neon Serverless PostgreSQL**.

---

## 11. License

Created for academic demonstration and certified blood management operations. Open for educational adaptation.
