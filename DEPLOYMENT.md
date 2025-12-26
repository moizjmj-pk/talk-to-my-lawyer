# Deployment Guide - Talk-To-My-Lawyer

This guide covers deploying Talk-To-My-Lawyer to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Vercel Deployment](#vercel-deployment)
- [Docker Deployment](#docker-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Post-Deployment](#post-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- [ ] Node.js 18+ installed
- [ ] pnpm 10.25.0+ installed
- [ ] Supabase project created
- [ ] Stripe account configured
- [ ] OpenAI API key
- [ ] Domain name (for production)
- [ ] SSL certificate (automated with Vercel)
- [ ] Email service configured (Resend/Brevo/SendGrid)

## Deployment Options

### Option 1: Vercel (Recommended)

Best for:
- Quick deployment
- Automatic scaling
- Built-in CDN
- Serverless functions

### Option 2: Docker

Best for:
- Self-hosted infrastructure
- Full control over environment
- On-premise deployments
- Custom scaling needs

### Option 3: Traditional Hosting

Best for:
- Existing infrastructure
- Specific compliance requirements
- Custom networking needs

## Vercel Deployment

### Step 1: Prepare Your Repository

```bash
# Ensure you're on the main branch
git checkout main
git pull origin main

# Verify the build works locally
pnpm install
CI=1 pnpm build
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Select "talk-to-my-lawyer"

### Step 3: Configure Build Settings

Vercel should auto-detect Next.js. Verify:

- **Framework Preset**: Next.js
- **Build Command**: `pnpm build`
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `pnpm install --frozen-lockfile`
- **Node Version**: 18.x or 20.x

### Step 4: Environment Variables

Add all environment variables from `.env.example`:

#### Critical Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
ADMIN_PORTAL_KEY=your-secure-key-here
CRON_SECRET=your-cron-secret-here
```

#### Email Configuration
```
EMAIL_PROVIDER=resend
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Talk-To-My-Lawyer
RESEND_API_KEY=re_...
```

#### Rate Limiting (Optional but Recommended)
```
KV_REST_API_URL=https://...upstash.io
KV_REST_API_TOKEN=...
```

#### Application URLs
```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
ENABLE_TEST_MODE=false
```

### Step 5: Configure Cron Jobs

Vercel will read `vercel.json` for cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-email-queue",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

### Step 6: Deploy

Click "Deploy" and wait for the build to complete.

### Step 7: Configure Custom Domain

1. Go to Project Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning

### Step 8: Set Up Stripe Webhooks

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret
5. Update `STRIPE_WEBHOOK_SECRET` in Vercel environment variables
6. Redeploy

## Docker Deployment

### Step 1: Create Dockerfile

```dockerfile
# See detailed Dockerfile in repository
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
RUN corepack enable pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

### Step 2: Create docker-compose.yml

See `docker-compose.yml` in repository for full configuration.

### Step 3: Deploy with Docker

```bash
# Build the image
docker build -t talk-to-my-lawyer .

# Run with docker-compose
docker-compose up -d

# Or run standalone
docker run -d \
  --name talk-to-my-lawyer \
  -p 3000:3000 \
  --env-file .env.production \
  talk-to-my-lawyer
```

## Environment Configuration

### Production Environment Variables

Create `.env.production`:

```bash
# Copy from .env.example and fill in production values
cp .env.example .env.production

# Validate environment
pnpm validate-env
```

### Security Checklist

- [ ] Use production API keys (no test keys)
- [ ] Set `NODE_ENV=production`
- [ ] Set `ENABLE_TEST_MODE=false`
- [ ] Use strong `ADMIN_PORTAL_KEY` (32+ characters)
- [ ] Enable rate limiting with Redis
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Enable security headers
- [ ] Configure CSP properly

## Database Setup

### Step 1: Run Migrations

```bash
# Option 1: Using Supabase CLI
supabase db push

# Option 2: Run SQL files manually in Supabase SQL Editor
# Execute scripts in order from /scripts/*.sql
```

### Step 2: Create Admin User

```bash
# Create the first admin user
pnpm tsx scripts/create-admin-user.ts admin@yourdomain.com SecurePassword123!

# Create additional admins
pnpm tsx scripts/create-additional-admin.ts admin2@yourdomain.com SecurePassword456!
```

### Step 3: Verify Database

```bash
# Run health check
pnpm health-check

# Or access health endpoint
curl https://yourdomain.com/api/health
```

## Post-Deployment

### Step 1: Verify All Services

```bash
# Health check
curl https://yourdomain.com/api/health/detailed

# Should return:
# {
#   "status": "healthy",
#   "services": {
#     "database": { "status": "healthy" },
#     "auth": { "status": "healthy" },
#     "stripe": { "status": "healthy" },
#     "openai": { "status": "healthy" },
#     "redis": { "status": "healthy" }
#   }
# }
```

### Step 2: Test Critical Flows

1. **User Registration**
   - Sign up new user
   - Verify email confirmation
   - Check profile creation

2. **Subscription Flow**
   - Test Stripe checkout
   - Verify webhook handling
   - Check subscription activation

3. **Letter Generation**
   - Create a test letter
   - Verify AI generation
   - Check allowance deduction

4. **Admin Portal**
   - Login to admin portal
   - Review pending letters
   - Test approve/reject workflow

5. **Email Delivery**
   - Trigger welcome email
   - Check letter notifications
   - Verify email queue processing

### Step 3: Configure Monitoring

See [MONITORING.md](./MONITORING.md) for detailed setup.

```bash
# Set up error tracking (Sentry)
# Add to environment variables:
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...

# Set up uptime monitoring
# - Pingdom
# - UptimeRobot
# - Better Uptime

# Set up performance monitoring
# - Vercel Analytics
# - New Relic
# - DataDog
```

### Step 4: Set Up Backups

```bash
# Supabase automatic backups
# - Enable daily backups in Supabase dashboard
# - Set retention period (7-30 days)

# Optional: Additional backup strategy
# - Export database regularly
# - Store in S3/GCS bucket
# - Test restore procedures
```

## Monitoring & Maintenance

### Daily Checks

- [ ] Check error logs
- [ ] Monitor rate limit violations
- [ ] Review failed payments
- [ ] Check email queue status

### Weekly Tasks

- [ ] Review user analytics
- [ ] Check system performance
- [ ] Review security logs
- [ ] Update dependencies (security patches)

### Monthly Tasks

- [ ] Full system health audit
- [ ] Performance optimization review
- [ ] Cost analysis and optimization
- [ ] Security audit
- [ ] Backup restore test

### Recommended Tools

**Error Tracking**
- Sentry
- LogRocket
- Rollbar

**Uptime Monitoring**
- Pingdom
- UptimeRobot
- Better Uptime

**Performance**
- Vercel Analytics
- Google PageSpeed Insights
- WebPageTest

**Logs**
- Datadog
- Logtail
- Better Stack

## Troubleshooting

### Build Failures

```bash
# Clear cache and rebuild
pnpm clean
pnpm install --frozen-lockfile
CI=1 pnpm build

# Check for TypeScript errors
pnpm tsc --noEmit

# Check for linting errors
pnpm lint
```

### Database Connection Issues

```bash
# Verify environment variables
pnpm validate-env

# Test database connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
client.from('profiles').select('id').limit(1).then(console.log);
"
```

### Rate Limiting Issues

```bash
# Check Redis connection
curl -X GET https://yourdomain.com/api/health/detailed

# If Redis is down, app will fallback to in-memory rate limiting
# Check logs for warnings
```

### Email Delivery Issues

```bash
# Check email provider configuration
node check-email-provider.js

# Test email sending
node test-email-send.js

# Check email queue
curl https://yourdomain.com/api/admin/email-queue \
  -H "Cookie: admin_session=..."
```

### Stripe Webhook Issues

```bash
# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Verify webhook secret matches
echo $STRIPE_WEBHOOK_SECRET

# Check Stripe dashboard for failed webhooks
# https://dashboard.stripe.com/webhooks
```

### Performance Issues

```bash
# Enable production profiling
# Add to environment:
# NEXT_PUBLIC_ENABLE_PROFILING=true

# Check bundle size
pnpm build
# Look for large bundles in build output

# Analyze with webpack-bundle-analyzer
npx @next/bundle-analyzer
```

## Rollback Procedure

### Vercel Rollback

1. Go to Vercel Dashboard
2. Click "Deployments"
3. Find the last working deployment
4. Click "..." menu
5. Select "Promote to Production"

### Docker Rollback

```bash
# Tag current version before deploying
docker tag talk-to-my-lawyer:latest talk-to-my-lawyer:v1.0.0

# If rollback needed
docker-compose down
docker-compose up -d talk-to-my-lawyer:v1.0.0
```

## Security Considerations

- Always use HTTPS in production
- Keep dependencies updated
- Rotate API keys regularly
- Monitor for security vulnerabilities
- Enable rate limiting
- Use strong passwords for admin accounts
- Enable 2FA where possible
- Review audit logs regularly
- Keep backups encrypted
- Follow principle of least privilege

## Support & Resources

- **Documentation**: [README.md](./README.md)
- **Architecture**: [ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md)
- **Security**: [SECURITY.md](./SECURITY.md)
- **API Reference**: [API.md](./API.md)

---

**Last Updated**: December 26, 2024
