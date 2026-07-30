# Production Deployment & Environment Guide — DB Market (Vision V2)

## Overview
This guide details the Vercel deployment configuration, new Supabase project setup, Cloudinary CDN reuse, OpenAI integration, and SendGrid mail configuration for DB Market.

---

## 1. Vercel Project Setup

1. Import repository in Vercel.
2. Set **Framework Preset** to `TanStack Start` (or `Other`).
3. Set **Install Command**: `npm install --legacy-peer-deps`.
4. Set **Build Command**: `npm run build`.
5. Set **Output Directory**: `.output`.

---

## 2. Complete Environment Variables Checklist

```env
# -----------------------------------------------------------------------------
# 1. NEW SUPABASE PROJECT CREDENTIALS (DO NOT USE OLD CLIENT PROJECT CREDS)
# -----------------------------------------------------------------------------
SUPABASE_URL="https://your-new-db-market-project.supabase.co"
SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_PROJECT_ID="your-new-project-ref"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Client-Side Exposed Supabase Variables (Build-time Vite replacement)
VITE_SUPABASE_URL="https://your-new-db-market-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_PROJECT_ID="your-new-project-ref"

# -----------------------------------------------------------------------------
# 2. CLOUDINARY CDN CREDENTIALS (REUSED OR NEW ACCOUNT)
# -----------------------------------------------------------------------------
CLOUDINARY_CLOUD_NAME="your-cloud-name"
VITE_CLOUDINARY_CLOUD_NAME="your-cloud-name"
VITE_CLOUDINARY_UPLOAD_PRESET="products"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# -----------------------------------------------------------------------------
# 3. OPENAI AI ENGINE (PRIMARY PROVIDER - NO GEMINI / IMAGEN)
# -----------------------------------------------------------------------------
OPENAI_API_KEY="sk-proj-your-openai-api-key"
OPENAI_LLM_MODEL="gpt-4o-mini"

# -----------------------------------------------------------------------------
# 4. SENDGRID MAIL ENGINE (REPLACED RESEND)
# -----------------------------------------------------------------------------
SENDGRID_API_KEY="SG.your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="orders@dbmarket.ng"
```

---

## 3. External Services Setup Instructions

### Supabase Setup (New Project)
1. Create a brand new project on [Supabase Console](https://database.new) named `DB Market Production`.
2. Retrieve `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from `Project Settings -> API`.
3. Apply schema migrations using Supabase CLI (`supabase db push`).

### Cloudinary CDN Setup
1. Log into Cloudinary.
2. Under `Settings -> Upload`, create an **Unsigned Upload Preset** named `products`. Target folder: `products`.
3. Retrieve `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` for signed deletions.

### OpenAI API Setup
1. Create an API Key in OpenAI Platform Dashboard.
2. Ensure model access is enabled for `gpt-4o` and `gpt-4o-mini`.

### SendGrid Setup
1. Create a SendGrid account and verify sender identity domain (`dbmarket.ng`).
2. Generate API Key with `Mail Send` permissions.
