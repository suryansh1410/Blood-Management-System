# 🚀 Production Deployment Handbook — LifePulse BMS

This document is the complete guide to deploying the **LifePulse Blood Management System** to a public, shareable URL on the web with a persistent cloud database.

---

## 🔑 Demo Login Credentials (Safe Sample Accounts)

The database seed includes safe, fictional demo accounts across all three system roles:

| Role | Email | Password | What You Can Test |
|---|---|---|---|
| **Admin** | `admin@bloodbank.org` | `Admin@123` | Stats, inventory overview, adjust stock, verify/reject donations, approve/fulfill/reject blood requests, view audit reports. |
| **Donor** | `rahul.donor@example.com` | `Donor@123` | View eligibility & donation stats, schedule/submit new donation, toggle donation availability, edit profile. |
| **Patient / Hospital** | `sarah.patient@example.com` | `Patient@123` | Search live blood stock, submit urgent/emergency blood request, view request history, cancel pending request. |

---

## 🗄️ Step 1: Set Up Free Cloud PostgreSQL Database (Takes ~1 Minute)

On serverless platforms like Vercel, local SQLite (`dev.db`) is read-only. For a public website where donors submit donations and patients submit blood requests, use **Neon** (100% free serverless PostgreSQL):

1. Go to [https://neon.tech](https://neon.tech) and click **Sign Up** (or continue with GitHub/Google).
2. Click **Create Project**, name it `lifepulse-bms`, and select the region closest to you.
3. Once created, copy the **Connection string** (Direct or Pooled). It looks like:
   ```text
   postgresql://username:password@ep-xyz-pooler.region.neon.tech/neondb?sslmode=require
   ```
4. In this repository, switch the Prisma datasource to PostgreSQL:
   ```bash
   npm run db:use-postgres
   ```
5. Push the schema and seed the initial data to your cloud database:
   ```bash
   npx cross-env DATABASE_URL="YOUR_NEON_POSTGRES_URL" npx prisma db push
   npx cross-env DATABASE_URL="YOUR_NEON_POSTGRES_URL" npm run seed
   ```

*(Alternatively, you can use **Supabase** at [supabase.com](https://supabase.com) — also 100% free PostgreSQL).*

---

## 🌐 Step 2: Deploy to Vercel (Fastest & Free)

### Method A: Deploy via GitHub (Recommended)

1. Create a new repository on GitHub (e.g. `blood-management-system`).
2. Push this project to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/blood-management-system.git
   git branch -M main
   git push -u origin main
   ```
3. Go to [https://vercel.com](https://vercel.com), log in, and click **Add New... > Project**.
4. Import your `blood-management-system` repository.
5. In **Environment Variables**, add the following 3 variables:
   - `DATABASE_URL`: `postgresql://username:password@ep-xyz.region.neon.tech/neondb?sslmode=require`
   - `NEXTAUTH_SECRET`: `bms-super-secret-jwt-key-for-blood-bank-system-2026` *(or your generated secret)*
   - `NEXTAUTH_URL`: `https://your-project-name.vercel.app` *(or leave blank for automatic Vercel domain detection)*
6. Click **Deploy**. In under 2 minutes, your website is live with a shareable URL!

### Method B: Deploy via Vercel CLI Directly

1. Run:
   ```bash
   npx vercel login
   ```
   Authenticate using GitHub, GitLab, or Email.
2. Deploy to production:
   ```bash
   npx vercel --prod
   ```
3. Add environment variables when prompted or in the Vercel project dashboard.

---

## 📋 Required Environment Variables Summary

| Variable Name | Required? | Example Value | Description |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | `postgresql://user:pass@ep-xyz.region.neon.tech/neondb?sslmode=require` | The PostgreSQL connection string to your cloud database. |
| `NEXTAUTH_SECRET` | **Yes** | `bms-super-secret-jwt-key-for-blood-bank-system-2026` | Random 32+ char string used to sign session JWTs. |
| `NEXTAUTH_URL` | **Yes** | `https://lifepulse-bms.vercel.app` | The public URL where the site is hosted. |

---

## 🧪 Post-Deployment Verification Checklist

Once your URL is active, test the full workflow:
1. Open the URL in an **Incognito Window** on your phone or computer.
2. Check the public homepage `/` and `/blood-availability` table.
3. Login as Patient (`sarah.patient@example.com` / `Patient@123`) and submit a blood request.
4. Login as Donor (`rahul.donor@example.com` / `Donor@123`) and record a donation.
5. Login as Admin (`admin@bloodbank.org` / `Admin@123`), navigate to **Donations** to verify the donation, and check the updated stock in **Inventory**.
6. Open **Blood Requests** as Admin and approve & fulfill the patient's request.
