# Monitoring & Observability Guide

This guide covers monitoring, logging, and observability for Talk-To-My-Lawyer in production.

## Table of Contents

- [Overview](#overview)
- [Health Checks](#health-checks)
- [Error Tracking](#error-tracking)
- [Performance Monitoring](#performance-monitoring)
- [Log Management](#log-management)
- [Uptime Monitoring](#uptime-monitoring)
- [Alerting](#alerting)
- [Metrics & Dashboards](#metrics--dashboards)

## Overview

Production monitoring ensures:
- System availability
- Early problem detection
- Performance optimization
- Security incident response
- Compliance and audit trails

## Health Checks

### Built-in Health Endpoint

The application includes comprehensive health checks at `/api/health`:

```bash
# Basic health check
curl https://yourdomain.com/api/health

# Detailed health check
curl https://yourdomain.com/api/health/detailed
```

**Response Example:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-26T23:00:00.000Z",
  "version": "1.0.0",
  "uptime": 86400,
  "environment": "production",
  "services": {
    "database": {
      "status": "healthy",
      "latency": 45
    },
    "auth": {
      "status": "healthy",
      "latency": 23
    },
    "stripe": {
      "status": "healthy"
    },
    "openai": {
      "status": "healthy"
    },
    "redis": {
      "status": "healthy"
    }
  },
  "metrics": {
    "memoryUsage": {
      "heapUsed": 123456789,
      "heapTotal": 234567890
    },
    "activeConnections": 42
  }
}
```

### Health Check Script

Use the built-in health check script:

```bash
# Run health check
pnpm health-check

# Expected output:
# === Health Check Results ===
# Status: healthy
# [OK] database: healthy (45ms)
# [OK] auth: healthy (23ms)
# [OK] stripe: healthy
# [OK] openai: healthy
# [OK] redis: healthy
# [HEALTHY] Application is running correctly
```

## Error Tracking

### Recommended: Sentry

#### Setup

```bash
# Install Sentry
pnpm add @sentry/nextjs
```

**sentry.client.config.ts:**
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
})
```

**sentry.server.config.ts:**
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

**Environment Variables:**
```bash
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...
```

#### Usage in Code

```typescript
import * as Sentry from '@sentry/nextjs'

try {
  await generateLetter(data)
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      component: 'letter-generation',
      userId: user.id,
    },
    extra: {
      letterType: data.letterType,
    },
  })
  throw error
}
```

### Alternative: LogRocket

```typescript
import LogRocket from 'logrocket'

LogRocket.init('your-app-id')

// Identify users
LogRocket.identify(user.id, {
  name: user.name,
  email: user.email,
})
```

## Performance Monitoring

### Vercel Analytics (Built-in)

Enable in Vercel dashboard:
1. Go to Analytics tab
2. Enable Web Vitals
3. View metrics in dashboard

### Custom Performance Tracking

```typescript
import { PerformanceTimer } from '@/lib/logging/structured-logger'

const logger = createLogger('API:GenerateLetter')
const timer = new PerformanceTimer(logger, 'Letter generation')

try {
  // Your operation
  await generateLetter(data)
  
  // Log duration
  const duration = timer.end({ userId, letterType })
} catch (error) {
  timer.end({ error: true, userId }, 'error')
  throw error
}
```

### Database Query Performance

Monitor slow queries in Supabase dashboard:
1. Go to Database > Logs
2. Filter by slow queries
3. Analyze and optimize

### API Route Performance

```typescript
// Middleware for timing all API routes
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const start = Date.now()
  
  const response = NextResponse.next()
  
  const duration = Date.now() - start
  response.headers.set('X-Response-Time', `${duration}ms`)
  
  // Log slow requests
  if (duration > 1000) {
    console.warn('Slow request:', {
      path: request.nextUrl.pathname,
      duration,
    })
  }
  
  return response
}
```

## Log Management

### Structured Logging

The app uses built-in structured logging:

```typescript
import { createLogger } from '@/lib/logging/structured-logger'

const logger = createLogger('API:GenerateLetter', 'info')

// Different log levels
logger.debug('Processing request', { userId })
logger.info('Letter generated', { letterId, userId })
logger.warn('Rate limit approaching', { userId, remaining: 1 })
logger.error('Generation failed', error, { userId })
logger.fatal('Critical system error', error)
```

### Log Aggregation Services

#### Option 1: Datadog

```bash
# Install
pnpm add dd-trace

# Configure in instrumentation.ts
require('dd-trace').init({
  env: process.env.NODE_ENV,
  service: 'talk-to-my-lawyer',
  version: '1.0.0',
})
```

#### Option 2: Better Stack (Logtail)

```typescript
import { Logtail } from '@logtail/node'

const logtail = new Logtail(process.env.LOGTAIL_TOKEN)

// Log to Logtail
logtail.info('User signed up', {
  userId: user.id,
  email: user.email,
})
```

#### Option 3: Vercel Logs

Access via Vercel CLI:
```bash
vercel logs [deployment-url] --follow
```

### Log Retention

Configure retention policies:
- **Development**: 7 days
- **Staging**: 30 days
- **Production**: 90 days (compliance requirement)
- **Security logs**: 1 year

## Uptime Monitoring

### Option 1: UptimeRobot (Free)

1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add monitor:
   - Type: HTTPS
   - URL: `https://yourdomain.com/api/health`
   - Interval: 5 minutes
3. Configure alerts:
   - Email
   - Slack
   - SMS (premium)

### Option 2: Pingdom

```bash
# Monitor endpoints
- https://yourdomain.com/api/health
- https://yourdomain.com/
- https://yourdomain.com/dashboard
```

### Option 3: Better Uptime

1. Create account
2. Add monitors for:
   - Main application
   - API health endpoint
   - Admin portal
   - Email service

## Alerting

### Alert Configuration

#### Critical Alerts (Immediate)

```yaml
- Service down (>1 min)
- Database connection lost
- Payment processing failed
- Authentication service down
- API error rate >5%
```

#### Warning Alerts (15 min)

```yaml
- High memory usage (>80%)
- Slow response times (>3s)
- Rate limit violations spike
- Failed email deliveries
- Disk space low
```

#### Info Alerts (1 hour)

```yaml
- Unusual traffic patterns
- New error types
- Performance degradation
```

### Alert Channels

1. **Email**: Primary for all alerts
2. **Slack**: For team collaboration
3. **PagerDuty**: For on-call rotation (optional)
4. **SMS**: Critical production issues only

### Slack Integration

```typescript
// lib/monitoring/slack-alerts.ts
export async function sendSlackAlert(message: string, severity: 'info' | 'warning' | 'critical') {
  const webhook = process.env.SLACK_WEBHOOK_URL
  if (!webhook) return
  
  const color = {
    info: '#36a64f',
    warning: '#ff9900',
    critical: '#ff0000',
  }[severity]
  
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{
        color,
        title: `[${severity.toUpperCase()}] Talk-To-My-Lawyer`,
        text: message,
        ts: Math.floor(Date.now() / 1000),
      }],
    }),
  })
}
```

## Metrics & Dashboards

### Key Metrics to Track

#### Application Metrics

```typescript
// User metrics
- Active users (DAU, MAU)
- New signups per day
- User retention rate
- Churn rate

// Letter metrics
- Letters generated per day
- Average generation time
- Success/failure rate
- Letters under review
- Average review time

// Financial metrics
- Revenue per day
- Subscription conversions
- Coupon usage
- Refund rate
- MRR (Monthly Recurring Revenue)

// Performance metrics
- API response times (p50, p95, p99)
- Database query times
- Cache hit rate
- Error rates by endpoint

// System metrics
- CPU usage
- Memory usage
- Disk I/O
- Network throughput
```

### Creating Dashboards

#### Vercel Dashboard

Built-in metrics available:
- Web Vitals (LCP, FID, CLS)
- Function executions
- Bandwidth usage
- Build times

#### Custom Grafana Dashboard

```yaml
Panels:
  - Request Rate (requests/sec)
  - Error Rate (%)
  - Response Time (ms) - p50, p95, p99
  - Active Users
  - Letters Generated (per hour)
  - Database Connections
  - Memory Usage
  - CPU Usage
```

### Monitoring Checklist

Daily:
- [ ] Check error rates
- [ ] Review slow queries
- [ ] Monitor uptime
- [ ] Check email delivery rate

Weekly:
- [ ] Review performance trends
- [ ] Analyze user behavior
- [ ] Check cost optimization opportunities
- [ ] Review security logs

Monthly:
- [ ] Full system audit
- [ ] Capacity planning
- [ ] Cost analysis
- [ ] Security review

## Incident Response

### Incident Severity Levels

**P0 - Critical**
- Service completely down
- Data breach
- Payment processing broken
- Response time: Immediate

**P1 - High**
- Major feature broken
- Degraded performance
- Security vulnerability
- Response time: 1 hour

**P2 - Medium**
- Minor feature broken
- Slow performance
- Non-critical errors
- Response time: 4 hours

**P3 - Low**
- Cosmetic issues
- Enhancement requests
- Response time: Next business day

### Incident Response Process

1. **Detection**: Monitoring alerts or user reports
2. **Acknowledgment**: Confirm receipt and assign owner
3. **Investigation**: Analyze logs, metrics, and traces
4. **Mitigation**: Apply temporary fix if needed
5. **Resolution**: Deploy permanent fix
6. **Verification**: Confirm issue is resolved
7. **Post-mortem**: Document and learn

### Runbook Examples

#### Database Connection Issues

```bash
1. Check health endpoint: curl /api/health
2. Verify database status in Supabase dashboard
3. Check connection pool settings
4. Review recent migrations
5. Check for long-running queries
6. If needed, restart application
7. Monitor for recurrence
```

#### High Error Rate

```bash
1. Check Sentry for error details
2. Identify affected endpoints
3. Review recent deployments
4. Check external service status
5. Rollback if recent deployment
6. Apply fix and deploy
7. Monitor error rate return to normal
```

## Cost Optimization

### Monitoring Costs

Track spending on:
- Supabase (database, auth, storage)
- Vercel (hosting, bandwidth)
- Upstash (Redis)
- OpenAI (API calls)
- Email service
- Monitoring tools

### Budget Alerts

Set up alerts for:
- Daily spend exceeds $X
- Monthly projection over budget
- Unusual API usage spikes

### Optimization Tips

1. **Caching**: Cache frequently accessed data
2. **Image optimization**: Use Next.js Image component
3. **API calls**: Batch requests, use caching
4. **Database**: Optimize queries, use indexes
5. **Email**: Queue and batch emails
6. **Monitoring**: Use free tiers wisely

## Resources

- **Vercel Analytics**: https://vercel.com/analytics
- **Sentry**: https://sentry.io
- **Datadog**: https://datadoghq.com
- **Better Stack**: https://betterstack.com
- **UptimeRobot**: https://uptimerobot.com

---

**Last Updated**: December 26, 2024
