# Vercel Deployment Guide

This guide covers deploying **Talk-To-My-Lawyer** to Vercel, including environment configuration, monitoring setup, and production best practices.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables Configuration](#environment-variables-configuration)
3. [Deploying to Vercel](#deploying-to-vercel)
4. [Post-Deployment Checklist](#post-deployment-checklist)
5. [Monitoring and Observability](#monitoring-and-observability)
6. [Troubleshooting](#troubleshooting)
7. [Security Considerations](#security-considerations)

---

## Prerequisites

Before deploying to Vercel, ensure you have:

- [ ] A Vercel account ([vercel.com](https://vercel.com))
- [ ] A Supabase project ([supabase.com](https://supabase.com))
- [ ] A Stripe account ([stripe.com](https://stripe.com))
- [ ] An OpenAI API key ([platform.openai.com](https://platform.openai.com))
- [ ] An email service account (Resend recommended)
- [ ] An Upstash Redis account for rate limiting

---

## Environment Variables Configuration

### Step 1: Prepare Your Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

### Step 2: Configure Variables in Vercel

Go to your Vercel project dashboard: **Settings > Environment Variables**

#### Required Variables for ALL Environments

| Variable | Description | Type |
|----------|-------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Public |
| `OPENAI_API_KEY` | OpenAI API key | Secret |
| `NEXT_PUBLIC_SITE_URL` | Production site URL | Public |

#### Production-Only Variables

| Variable | Description | Type |
|----------|-------------|------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | **Secret** |
| `STRIPE_SECRET_KEY` | Stripe secret key | **Secret** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Public |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | **Secret** |
| `ADMIN_EMAIL` | Admin email address | Plain |
| `ADMIN_PORTAL_KEY` | Admin portal authentication | **Secret** |
| `CRON_SECRET` | Cron job authentication | **Secret** |

#### Email Configuration (At Least One Required)

| Variable | Description | Type |
|----------|-------------|------|
| `RESEND_API_KEY` | Resend API key (recommended) | Secret |
| `SENDGRID_API_KEY` | SendGrid API key (alternative) | Secret |
| `BREVO_API_KEY` | Brevo API key (alternative) | Secret |
| `EMAIL_FROM` | From email address | Plain |

#### Rate Limiting (Strongly Recommended)

| Variable | Description | Type |
|----------|-------------|------|
| `KV_REST_API_URL` | Upstash Redis URL | Secret |
| `KV_REST_API_TOKEN` | Upstash Redis token | Secret |

#### Test Mode Configuration

| Variable | Description | Value |
|----------|-------------|-------|
| `ENABLE_TEST_MODE` | Test mode toggle | **MUST be `"false"` in production** |

### Step 3: Environment-Specific Configuration

Vercel supports different values per environment:

1. **Production**: Main deployment domain
2. **Preview**: Pull request deployments
3. **Development**: Branch deployments

Configure test mode appropriately:
- Production: `ENABLE_TEST_MODE=false`
- Preview/Development: `ENABLE_TEST_MODE=true` (optional)

---

## Deploying to Vercel

### Option 1: Connect Git Repository (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `pnpm build`
   - **Install Command**: `pnpm install`
4. Click **Deploy**

### Option 2: Vercel CLI Deployment

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Environment Scopes

When adding environment variables, choose the appropriate scope:

| Scope | Description |
|-------|-------------|
| **Production** | Only applies to production deployments |
| **Preview** | Applies to all preview deployments (PRs) |
| **Development** | Applies to branch deployments |
| **All** | Applies to all environments |

---

## Post-Deployment Checklist

After deployment, verify the following:

### Database Setup

- [ ] Run database migrations: `pnpm db:migrate`
- [ ] Verify Row Level Security (RLS) policies are enabled
- [ ] Test database connections

### Stripe Configuration

- [ ] Configure Stripe webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
- [ ] Test webhook delivery with Stripe CLI
- [ ] Verify products and prices are configured

### Email Delivery

- [ ] Send test email to verify configuration
- [ ] Check spam/junk folder settings
- [ ] Configure email domain authentication (SPF/DKIM)

### Admin Access

- [ ] Create admin account using CLI script
- [ ] Test admin portal login at `/secure-admin-gateway/login`
- [ ] Verify admin dashboard loads correctly

### Critical Functionality

- [ ] Test user registration and login
- [ ] Test subscription creation with Stripe test cards
- [ ] Test letter generation flow
- [ ] Test admin review workflow
- [ ] Verify rate limiting is active

### Security Verification

- [ ] Confirm `ENABLE_TEST_MODE=false` in production
- [ ] Verify security headers are applied
- [ ] Test CSP headers with security scanner
- [ ] Check for exposed environment variables

---

## Monitoring and Observability

### Vercel Built-in Monitoring

Access via Vercel Dashboard > Analytics:

| Metric | Description |
|--------|-------------|
| **Page Views** | Total page views and unique visitors |
| **Core Web Vitals** | LCP, FID, CLS scores |
| **Function Duration** | Serverless function execution time |
| **Error Rate** | Failed requests and errors |
| **Build Status** | Deployment success/failure |

### Log Management

View logs via:
- **Vercel Dashboard**: Your Project > Logs
- **Vercel CLI**: `vercel logs`

### Monitoring Setup

1. **Error Tracking**: Consider integrating Sentry
   ```bash
   pnpm add @sentry/nextjs
   ```

2. **Uptime Monitoring**: Use external services like UptimeRobot

3. **Custom Analytics**: Vercel Analytics is included
   ```typescript
   import { Analytics } from '@vercel/analytics/react'
   ```

---

## Troubleshooting

### Build Failures

**Issue**: TypeScript build errors

```bash
# Run locally to identify issues
pnpm build
```

**Solution**: Fix type errors before deploying. Do not disable `ignoreBuildErrors`.

### Function Timeouts

**Issue**: AI generation timing out

**Solution**: `vercel.json` already configures extended timeouts:
- `/api/generate-letter`: 60 seconds
- `/api/stripe/webhook`: 30 seconds

### Webhook Failures

**Issue**: Stripe webhooks not received

**Solutions**:
1. Verify webhook secret matches Vercel environment variable
2. Check webhook endpoint is reachable: `curl https://yourdomain.com/api/stripe/webhook`
3. Review Stripe webhook delivery logs

### Environment Variables Not Available

**Issue**: `process.env.VARIABLE` is undefined

**Solutions**:
1. Ensure variable is added to Vercel project settings
2. Check variable name matches exactly (case-sensitive)
3. Redeploy after adding new variables

---

## Security Considerations

### Secret Management

1. **Use Vercel Secrets** for sensitive values
2. **Never commit** `.env.local` or actual secrets
3. **Rotate secrets** quarterly (especially for production)
4. **Audit access** to secrets regularly

### Deployment Protection

1. **Enable Vercel Authentication** for preview deployments
2. **Password-protect** staging environments
3. **IP whitelist** admin endpoints if needed

### Security Headers

The application includes comprehensive security headers:
- Content Security Policy (CSP)
- Strict Transport Security (HSTS)
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)

Verify headers are applied:
```bash
curl -I https://yourdomain.com
```

---

## Production Deployment Workflow

### 1. Staging Deployment

```bash
# Deploy to staging branch
git checkout -b staging
git push origin staging
vercel --env=staging
```

### 2. Production Promotion

```bash
# Merge staging to main
git checkout main
git merge staging
git push origin main
# Vercel auto-deploys main branch
```

### 3. Rollback Procedure

If issues occur:

1. Via Vercel Dashboard:
   - Go to Deployments > Find previous successful deployment
   - Click "Promote to Production"

2. Via CLI:
   ```bash
   vercel rollback
   ```

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

---

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Review error messages in browser console
3. Verify environment variables are correctly set
4. Test locally with production environment variables
