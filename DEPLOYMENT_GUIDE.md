# PeopleOS SaaS Deployment Guide

This project is ready to be deployed as a small HR SaaS product using:
- Netlify for the static frontend
- Supabase for authentication and data
- SMTP email provider for recovery emails

## 1) Required setup

### A. GitHub repo
Create a public or private GitHub repository and push the project.

### B. Install local dependencies
From the project root, run:

```bash
npm install
```

### C. Run locally
```bash
npm run dev
```

This starts the local Netlify dev environment so the site and functions work like production.

### D. Netlify project
In Netlify:
1. Click Add new site
2. Import from GitHub
3. Select the repository
4. Set build settings:
   - Publish directory: `site`
   - Functions directory: `netlify/functions`
5. Deploy the site

This matches the current configuration in `netlify.toml`.

### E. Deploy from terminal
If you want to deploy directly from your machine after login:

```bash
npm run deploy:prod
```

---

## Terminal commands to run on your machine

```bash
cd your-project-folder
npm install
npm run dev
npm run deploy:prod
```

If Netlify is not logged in yet:

```bash
npx netlify login
npm run deploy:prod
```

### C. Supabase project
Create a Supabase project and complete the SQL setup from `supabase/setup.sql`.

Then configure Auth and SMTP in the Supabase dashboard.

### D. Email provider
Use any working SMTP provider such as Hostinger, Resend, SendGrid, or another transactional email service.

---

## 2) Netlify environment variables

Set these in Netlify > Site settings > Environment variables:

- `RECOVERY_PEPPER` — a long random secret, at least 32 characters
- `SMTP_HOST` — like `smtp.hostinger.com`
- `SMTP_PORT` — `465` or `587`
- `SMTP_USER` — SMTP username
- `SMTP_PASS` — SMTP password
- `AUTH_FROM_EMAIL` — sender email like `noreply@yourdomain.com`

Optional if onboarding uses Supabase config in the frontend:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 3) Supabase configuration

Follow `SUPABASE_SETUP.md`.

Important production steps:
- enable email authentication
- configure sign-up and sign-in flows
- configure reset-password email template
- add site URL and redirect URLs
- configure SMTP in Supabase Auth

The project notes in `OTP_SETUP.md` make clear that the legacy Netlify recovery function is not the preferred production path.

---

## 4) Recommended app architecture for a real SaaS launch

### Frontend
- Netlify static hosting
- served from `site/`

### Backend / auth
- Supabase Auth
- Supabase PostgreSQL for records

### Email
- SMTP transactional mail for password recovery and notifications

### Analytics
- PostHog, GA4, or similar

### Monitoring
- Sentry for frontend/backend errors

### Security
- strong secrets
- limit admin access
- enforce row-level security in Supabase

---

## 5) Launch checklist

Before going live, confirm all of the following:

- [ ] Netlify deployment succeeds
- [ ] site loads with no broken JS
- [ ] Supabase project is connected
- [ ] Auth sign-up works
- [ ] login works
- [ ] reset-password flow works
- [ ] SMTP mail sends correctly
- [ ] custom domain is added
- [ ] SSL certificate is active
- [ ] employee creation flow works
- [ ] search/filter works
- [ ] mobile layout works
- [ ] production env vars are set
- [ ] admin access is restricted properly

---

## 6) Production hardening

Before you start real customers:
- add analytics
- add error tracking
- add backups
- add rate limiting
- add role-based access rules
- add audit logging
- test with real browser sessions

---

## 7) Domain and branding

This app already supports branding updates from the UI. For real SaaS use:
- set the company name
- upload your logo
- use a custom domain
- set app colors and branding in the admin settings

---

## 8) Recommended next command

Once you have GitHub, Netlify, Supabase, and email configured, your production launch flow should be:

1. Push code to GitHub
2. Deploy to Netlify
3. Configure env vars in Netlify
4. Configure Supabase Auth
5. Configure SMTP
6. Test login, signup, reset, and employee workflows
7. Add domain + SSL
8. Go live

---

## 9) Suggested future improvements

As a SaaS product, the next priorities should be:
- real HR data models
- employee directory with CRUD
- attendance tracking with real records
- payroll approval workflows
- company onboarding flow
- role-based permissions
- improved reporting and dashboards

---

This is a strong MVP foundation for a real HR SaaS product. It is not yet a fully commercial-grade platform, but it is deployable and scalable enough for a real launch with the right auth, database, and operational setup.
