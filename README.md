# Talk-To-My-Lawyer

AI-powered legal letter generation platform with mandatory attorney review.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **AI**: OpenAI GPT-4 Turbo
- **Email**: SendGrid (with fallback providers)
- **Rate Limiting**: Upstash Redis

## Features

- AI-generated legal letters with attorney review workflow
- Subscription-based access with Stripe integration
- Employee referral system with commission tracking
- Admin portal for letter review and management
- Email queue system for reliable delivery
- GDPR compliance (data export/deletion)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase account
- Stripe account
- OpenAI API key

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_PORTAL_KEY=
SENDGRID_API_KEY=
KV_REST_API_URL=
KV_REST_API_TOKEN=
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

Run the SQL migrations in `/scripts` folder in order (001-023) in your Supabase SQL editor, then run migrations in `/supabase/migrations`.

## License

Private - All rights reserved
