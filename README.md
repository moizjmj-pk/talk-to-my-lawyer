# Talk-To-My-Lawyer

AI-powered legal letter generation platform with mandatory attorney review.

**Production Status:** ✅ Ready for deployment  
**Current Version:** 1.0.0  
**Readiness Score:** 85/100

## 🎯 Quick Links

- 📖 [Production Readiness Report](./PRODUCTION_READINESS.md) - Complete deployment guide
- 🚀 [Deployment Guide](./DEPLOYMENT.md) - Step-by-step deployment
- 📊 [API Documentation](./API.md) - Complete API reference
- 🔒 [Security Policy](./SECURITY.md) - Security and vulnerability reporting
- 🏗️ [Architecture](./ARCHITECTURE_PLAN.md) - Technical architecture
- 👥 [Contributing](./CONTRIBUTING.md) - Developer guidelines

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **AI**: OpenAI GPT-4 Turbo via Vercel AI Gateway
- **Email**: Resend (primary), Brevo, SendGrid, or SMTP (configurable via EMAIL_PROVIDER)
- **Rate Limiting**: Upstash Redis
- **Deployment**: Vercel / Docker

## ✨ Features

- ✅ AI-generated legal letters with attorney review workflow
- ✅ Subscription-based access with Stripe integration
- ✅ Employee referral system with commission tracking
- ✅ **Multi-admin portal** - Multiple admins can share letter review duties
- ✅ Email queue system for reliable delivery
- ✅ GDPR compliance (data export/deletion)
- ✅ Rate limiting and fraud detection
- ✅ Comprehensive audit logging
- ✅ Docker support for self-hosting
- ✅ CI/CD pipeline with GitHub Actions

## 🚀 Quick Start

### For Production Deployment

See the **[Production Readiness Report](./PRODUCTION_READINESS.md)** for complete deployment checklist and guide.

```bash
# 1. Run pre-deployment checks
pnpm pre-deploy

# 2. Deploy to Vercel or Docker
# See DEPLOYMENT.md for detailed instructions
```

### For Local Development

#### Prerequisites

- Node.js 18+
- pnpm 10.25.0+
- Supabase account
- Stripe account (test mode)
- OpenAI API key

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# OpenAI via Vercel AI Gateway
OPENAI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Admin Portal (for multi-admin access)
ADMIN_PORTAL_KEY=

# Email Service (choose provider)
EMAIL_PROVIDER=resend  # Options: resend, brevo, sendgrid, smtp, console
EMAIL_FROM=noreply@talk-to-my-lawyer.com
EMAIL_FROM_NAME=Talk-To-My-Lawyer

# Resend (recommended)
RESEND_API_KEY=

# Or Brevo
BREVO_API_KEY=

# Or SendGrid
SENDGRID_API_KEY=

# Or SMTP
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Rate Limiting (Upstash Redis)
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Application
NEXT_PUBLIC_SITE_URL=
```

### Development

```bash
pnpm install
pnpm dev
```

### Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## Database Setup

Run the SQL migrations in order:

1. **Scripts**: Run `/scripts/*.sql` files in order (001-023) in Supabase SQL Editor
2. **Migrations**: Run `/supabase/migrations/*.sql` files in order

## Creating Admin Users

The platform supports **multiple admin users** who share the same admin dashboard.

### Create an Admin User

```bash
npx dotenv-cli -e .env.local -- npx tsx scripts/create-additional-admin.ts <email> <password>
```

**Example:**
```bash
npx dotenv-cli -e .env.local -- npx tsx scripts/create-additional-admin.ts admin@company.com SecurePass123!
```

### Admin Login

1. Go to `/secure-admin-gateway/login`
2. Enter email & password (their own credentials)
3. Enter the Admin Portal Key (from `ADMIN_PORTAL_KEY` env var)

### How Multi-Admin Works

- Each admin has their own Supabase Auth account
- All admins share the same dashboard at `/secure-admin-gateway`
- Admin access is controlled by `role = 'admin'` in the `profiles` table
- All admins can review, approve, and reject letters

## 📚 Documentation

- **[PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md)** - Complete production readiness assessment
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide (Vercel & Docker)
- **[API.md](./API.md)** - Complete API reference
- **[ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md)** - System architecture
- **[SECURITY.md](./SECURITY.md)** - Security policy
- **[PRIVACY.md](./PRIVACY.md)** - Privacy policy template
- **[TERMS.md](./TERMS.md)** - Terms of service template
- **[MONITORING.md](./MONITORING.md)** - Monitoring and observability
- **[BACKUP.md](./BACKUP.md)** - Backup and disaster recovery
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Developer contribution guide

## 🔒 Security

We take security seriously. See [SECURITY.md](./SECURITY.md) for:
- Vulnerability reporting process
- Security features and measures
- Compliance information (GDPR, CCPA)
- Best practices

**Report security vulnerabilities to:** security@talk-to-my-lawyer.com

## 🐳 Docker Support

```bash
# Build Docker image
pnpm docker:build

# Run with Docker Compose
pnpm docker:compose

# See DEPLOYMENT.md for more options
```

## 🧪 Testing & Quality

```bash
# Lint code
pnpm lint

# Type check
npx tsc --noEmit

# Build for production
CI=1 pnpm build

# Run pre-deployment checks
pnpm pre-deploy
```

## 📊 Production Readiness

**Current Status:** 85/100 - Production Ready

✅ **Complete:**
- Security architecture (RLS, CSRF, rate limiting)
- Deployment infrastructure (Docker, Vercel, CI/CD)
- Complete documentation
- Health monitoring endpoints
- Audit logging
- GDPR compliance features

⚠️ **Before Production:**
- Legal review of privacy policy and terms of service
- Set up production monitoring (Sentry, uptime monitoring)
- Configure all environment variables
- Test critical user flows

See [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) for complete checklist.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Development setup
- Code style guidelines
- Pull request process
- Testing requirements

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details
