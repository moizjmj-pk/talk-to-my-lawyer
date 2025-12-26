# Security Policy

## Overview

The security of Talk-To-My-Lawyer is a top priority. This document outlines our security practices, how to report vulnerabilities, and what to expect from our security response process.

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, please report it by emailing:

**security@talk-to-my-lawyer.com**

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### What to Include in Your Report

Please include the following information in your vulnerability report:

- **Type of vulnerability** (e.g., SQL injection, XSS, authentication bypass)
- **Full paths of affected source file(s)**
- **Location of the affected code** (tag/branch/commit or direct URL)
- **Step-by-step instructions to reproduce the issue**
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the issue**, including how an attacker might exploit it
- **Any potential mitigations** you've identified

### What to Expect

1. **Acknowledgment** - We'll acknowledge receipt of your vulnerability report within 48 hours
2. **Assessment** - We'll assess the vulnerability and determine its severity within 5 business days
3. **Resolution** - We'll work on a fix and keep you informed of progress
4. **Disclosure** - Once fixed, we'll coordinate disclosure with you

## Security Measures

### Application Security

#### Authentication & Authorization
- Supabase Auth with secure session management
- Row Level Security (RLS) on all database tables
- Role-based access control (subscriber, employee, admin)
- Multi-admin support with shared portal key
- CSRF protection on all admin actions
- Secure password requirements enforced

#### API Security
- Rate limiting on all API endpoints using Upstash Redis
  - Auth endpoints: 5 requests per 15 minutes
  - Letter generation: 5 requests per hour
  - Admin actions: 10 requests per 15 minutes
  - General API: 100 requests per minute
- Input validation and sanitization on all endpoints
- Parameterized queries to prevent SQL injection
- XSS prevention through input sanitization
- Content Security Policy (CSP) headers
- CORS configuration restricted to known origins

#### Data Protection
- All sensitive data encrypted at rest (Supabase default)
- TLS/SSL encryption in transit
- Secure credential storage (never in code)
- Service role keys never exposed to client
- Audit trails for sensitive operations
- GDPR-compliant data handling
  - Data export capability
  - Data deletion capability
  - Privacy policy compliance

#### AI Security
- OpenAI API calls with retry logic and circuit breaker
- Prompt injection prevention
- Input sanitization before AI processing
- Forbidden pattern detection
- Response validation before storage

### Infrastructure Security

#### Headers & Policies
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: origin-when-cross-origin
- Content-Security-Policy with strict directives
- Permissions-Policy for feature control

#### Environment Security
- Environment variable validation on startup
- Separate credentials for dev/staging/production
- No hardcoded secrets in codebase
- .env files excluded from version control
- Secure environment variable management in production

#### Database Security
- Row Level Security (RLS) enabled on all tables
- Prepared statements for all queries
- Service role key usage strictly controlled
- Regular backup schedule (Supabase managed)
- Audit logging for critical operations

### Third-Party Services

We use the following third-party services, each with their own security measures:

- **Supabase** - Database & Authentication (SOC 2 Type II)
- **Stripe** - Payment processing (PCI DSS Level 1)
- **OpenAI** - AI text generation (SOC 2 Type II)
- **Upstash** - Rate limiting (Redis with encryption)
- **Email Providers** - Resend/Brevo/SendGrid (SOC 2)

### Fraud Detection

- Coupon fraud detection system
- IP reputation tracking
- Usage pattern analysis
- Duplicate account detection
- Anomaly detection for letter generation

## Security Best Practices for Developers

### When Contributing

1. **Never commit sensitive data**
   - No API keys, passwords, or tokens in code
   - Use `.env.local` for local development
   - Review commits before pushing

2. **Follow secure coding practices**
   - Validate all user input
   - Sanitize output to prevent XSS
   - Use parameterized queries
   - Implement proper error handling
   - Don't leak sensitive information in errors

3. **Use security tools**
   - ESLint for code quality
   - TypeScript for type safety
   - Dependency scanning for vulnerabilities
   - Regular security audits

4. **Keep dependencies updated**
   - Review security advisories regularly
   - Update vulnerable dependencies promptly
   - Test updates in staging before production

### When Deploying

1. **Environment validation**
   - Run `pnpm validate-env` before deployment
   - Verify all required environment variables are set
   - Use different credentials for each environment

2. **Database migrations**
   - Review migrations for security implications
   - Test migrations in staging first
   - Backup database before running migrations

3. **Monitoring**
   - Enable health check monitoring
   - Set up error tracking (Sentry)
   - Monitor rate limit violations
   - Track authentication failures

## Incident Response

### In Case of a Security Breach

1. **Immediate Actions**
   - Isolate affected systems
   - Notify security team
   - Preserve evidence and logs
   - Document the incident

2. **Assessment**
   - Determine scope of breach
   - Identify affected data
   - Assess potential impact

3. **Remediation**
   - Apply security patches
   - Rotate compromised credentials
   - Update security measures
   - Verify system integrity

4. **Notification**
   - Notify affected users (if applicable)
   - Report to authorities if required
   - Public disclosure (coordinated)

5. **Post-Incident**
   - Conduct post-mortem analysis
   - Update security procedures
   - Implement preventive measures
   - Document lessons learned

## Compliance

### GDPR Compliance
- Right to access personal data
- Right to data portability (export)
- Right to erasure (deletion)
- Right to rectification
- Breach notification procedures
- Data processing agreements

### Data Retention
- User data: Retained while account is active
- Audit logs: 1 year minimum retention
- Payment records: 7 years (Stripe managed)
- Deleted data: 30-day soft delete period

## Security Contacts

- **Security Email**: security@talk-to-my-lawyer.com
- **General Support**: support@talk-to-my-lawyer.com

## Acknowledgments

We thank the following security researchers for responsibly disclosing vulnerabilities:

_(List will be updated as vulnerabilities are reported and fixed)_

## Version History

- **1.0.0** (2024-12-26) - Initial security policy

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)

---

**Last Updated**: December 26, 2024
