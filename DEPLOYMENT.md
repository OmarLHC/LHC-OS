# LHC OS — Deployment Guide
## From zero to live on app.lhc-eg.com

---

## Overview

This is a full Next.js application with:
- Supabase (database + auth + storage)
- Resend (transactional email)
- Vercel (hosting)

Estimated setup time: 45–60 minutes.

---

## Step 1: Supabase Setup

1. Go to https://supabase.com and create a free account
2. Create a new project — name it "lhc-os"
3. Choose a region closest to Egypt (eu-central-1 or similar)
4. Save your database password somewhere safe

### Run the database schema

1. In your Supabase project, go to **SQL Editor**
2. Open the file `supabase-schema.sql` from this project
3. Paste the entire contents and click **Run**
4. You should see all tables created successfully

### Create your admin account (Omar)

Still in the SQL Editor, run this to create your account directly:

```sql
-- First, go to Authentication > Users > Add User in Supabase dashboard
-- Create a user with email: omar@lighthouseegypt.com
-- Then run this to create your profile (replace USER_ID with the UUID from the auth user):

INSERT INTO public.profiles (id, full_name, email, role, title)
VALUES (
  'YOUR_AUTH_USER_UUID_HERE',
  'Omar El Banna',
  'omar@lighthouseegypt.com',
  'admin',
  'Partner'
);
```

### Get your Supabase credentials

Go to **Settings > API** and copy:
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- Anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Service role key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2: Resend Setup (email sending)

1. Go to https://resend.com and create a free account
2. Add your domain `lhc-eg.com` under **Domains**
3. Add the DNS records they give you to your domain registrar
4. Once verified, go to **API Keys** and create a new key
5. Copy it → `RESEND_API_KEY`

> Note: Resend free tier allows 3,000 emails/month — more than enough.

---

## Step 3: Deploy to Vercel

1. Push this project to a GitHub repository
2. Go to https://vercel.com and import the repository
3. Add all environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=https://app.lhc-eg.com
```

4. Deploy — Vercel will build and host the app automatically

### Add your custom domain

1. In Vercel project settings → **Domains**
2. Add `app.lhc-eg.com`
3. Go to your domain registrar (wherever lhc-eg.com is registered)
4. Add a CNAME record: `app` → `cname.vercel-dns.com`
5. Wait 5–15 minutes for DNS to propagate
6. Your app is live at https://app.lhc-eg.com

---

## Step 4: First Login

1. Go to https://app.lhc-eg.com
2. Sign in with `omar@lighthouseegypt.com` and the password you set in Supabase
3. You're in as Admin

---

## Step 5: Invite Your Team

1. Go to **Admin** in the sidebar
2. Click **Invite Employee**
3. Fill in their name, `@lighthouseegypt.com` email, department, and role
4. They receive an email with a link to set their password
5. Once they click the link, their account is active

---

## Architecture Summary

```
app.lhc-eg.com (Vercel)
    ↓
Next.js App Router
    ↓
Supabase (Postgres DB + Row Level Security + Auth)
    ↓
Resend (transactional email for invites + announcements)
```

### Key files

| File | Purpose |
|------|---------|
| `supabase-schema.sql` | Full database schema — run once in Supabase |
| `app/login/page.tsx` | Login page |
| `app/dashboard/` | All authenticated pages |
| `app/api/invite/` | Invitation email API |
| `app/api/announcements/email/` | Announcement email blast API |
| `app/api/accept-invite/` | Account activation API |
| `middleware.ts` | Auth protection for all routes |
| `lib/supabase/` | Supabase client setup |

---

## Phase 2 Roadmap (future)

Once Phase 1 is live and the team is using it daily, these are the natural next additions:

- **BD Pipeline integration** — connect to your BD tracker data
- **Document vault** — store and version project documents
- **Site daily reports** — digital daily report submission from site
- **Client portal** — read-only view for clients to track project progress
- **Mobile app** — React Native wrapper for site team access
- **Notifications** — in-app + push notifications for task assignments and deadlines
- **Time tracking** — log actual hours against tasks
- **Financial dashboard** — budget vs actual per project

---

## Common Issues

**"Invalid login credentials"**
→ Make sure the profile row exists in the `profiles` table with the correct user UUID.

**Emails not sending**
→ Verify your Resend domain is confirmed and DNS records are active. Check Resend logs.

**Invitation link not working**
→ Check that `NEXT_PUBLIC_APP_URL` is set correctly in Vercel environment variables.

**Row Level Security errors**
→ Make sure you ran the full `supabase-schema.sql` — the RLS policies are at the bottom.
