# API Documentation - Talk-To-My-Lawyer

Complete API reference for Talk-To-My-Lawyer platform.

## Base URL

```
Production: https://yourdomain.com/api
Development: http://localhost:3000/api
```

## Authentication

Most endpoints require authentication via Supabase session cookie.

```typescript
// Client-side authentication
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()
```

## Rate Limiting

All endpoints are rate-limited to prevent abuse:

| Endpoint Category | Limit |
|------------------|-------|
| Authentication | 5 requests / 15 minutes |
| Letter Generation | 5 requests / hour |
| Subscription | 3 requests / hour |
| Admin Actions | 10 requests / 15 minutes |
| General API | 100 requests / minute |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1640995200
Retry-After: 900
```

## Error Responses

```typescript
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {} // Optional additional details
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## Authentication Endpoints

### Create Profile

Create user profile after Supabase Auth signup.

```http
POST /api/create-profile
```

**Request Body:**
```typescript
{
  "userId": "uuid",        // Supabase user ID
  "email": "string",       // User email
  "fullName": "string",    // Display name
  "role": "subscriber" | "employee" | "admin",
  "couponCode": "string"   // Optional employee coupon
}
```

**Response (200):**
```typescript
{
  "success": true,
  "profile": {
    "id": "uuid",
    "email": "string",
    "full_name": "string",
    "role": "string",
    "created_at": "timestamp"
  }
}
```

### Reset Password

Request password reset email.

```http
POST /api/auth/reset-password
```

**Request Body:**
```typescript
{
  "email": "string"
}
```

**Response (200):**
```typescript
{
  "success": true,
  "message": "Password reset email sent"
}
```

### Update Password

Update user password with reset token.

```http
POST /api/auth/update-password
```

**Request Body:**
```typescript
{
  "password": "string",      // New password
  "token": "string"          // Reset token from email
}
```

**Response (200):**
```typescript
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

## Letter Endpoints

### Generate Letter

Generate a new AI-powered legal letter.

```http
POST /api/generate-letter
```

**Authentication:** Required (subscriber role)  
**Rate Limit:** 5 requests / hour

**Request Body:**
```typescript
{
  "letterType": "demand_letter" | "cease_desist" | "settlement_offer" | "breach_of_contract" | "debt_collection",
  "intakeData": {
    "senderName": "string",
    "senderAddress": "string",
    "senderEmail": "string",          // Optional
    "senderPhone": "string",          // Optional
    "recipientName": "string",
    "recipientAddress": "string",
    "recipientEmail": "string",       // Optional
    "recipientPhone": "string",       // Optional
    "issueDescription": "string",     // Max 2000 chars
    "desiredOutcome": "string",       // Max 1000 chars
    "amountDemanded": "number",       // Optional, for demand letters
    "deadlineDate": "string",         // Optional
    "incidentDate": "string",         // Optional
    "additionalDetails": "string"     // Optional, max 3000 chars
  }
}
```

**Response (200):**
```typescript
{
  "success": true,
  "letterId": "uuid",
  "status": "pending_review",
  "aiDraft": "string",              // AI-generated content
  "isFreeTrial": boolean
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not subscriber or insufficient credits
- `429` - Rate limit exceeded
- `400` - Invalid input

### Get Letter

Retrieve a specific letter.

```http
GET /api/letters/{id}
```

**Response (200):**
```typescript
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "string",
  "letter_type": "string",
  "status": "draft" | "generating" | "pending_review" | "under_review" | "approved" | "rejected" | "completed" | "failed",
  "ai_draft_content": "string",
  "final_content": "string",
  "review_notes": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Submit Letter for Review

Submit letter to attorney review queue.

```http
POST /api/letters/{id}/submit
```

**Response (200):**
```typescript
{
  "success": true,
  "letterId": "uuid",
  "status": "pending_review"
}
```

### Get Letter PDF

Download letter as PDF.

```http
GET /api/letters/{id}/pdf
```

**Response:** PDF file download

### Delete Letter

Delete a draft letter.

```http
DELETE /api/letters/{id}/delete
```

**Response (200):**
```typescript
{
  "success": true,
  "message": "Letter deleted successfully"
}
```

### Get Audit Trail

Get letter audit history.

```http
GET /api/letters/{id}/audit
```

**Response (200):**
```typescript
{
  "audit": [
    {
      "id": "uuid",
      "letter_id": "uuid",
      "performed_by": "uuid",
      "action": "string",
      "old_status": "string",
      "new_status": "string",
      "notes": "string",
      "created_at": "timestamp"
    }
  ]
}
```

---

## Subscription Endpoints

### Create Checkout Session

Create Stripe checkout session for subscription purchase.

```http
POST /api/create-checkout
```

**Request Body:**
```typescript
{
  "planType": "single" | "monthly" | "yearly",
  "couponCode": "string"  // Optional employee coupon
}
```

**Response (200):**
```typescript
{
  "success": true,
  "checkoutUrl": "string",           // Stripe checkout URL
  "sessionId": "string",
  "discountApplied": boolean,
  "discount": number
}
```

### Verify Payment

Verify payment completion after Stripe checkout.

```http
POST /api/verify-payment
```

**Request Body:**
```typescript
{
  "sessionId": "string"  // Stripe session ID from URL
}
```

**Response (200):**
```typescript
{
  "success": true,
  "subscription": {
    "id": "uuid",
    "plan": "string",
    "status": "active",
    "credits_remaining": number
  }
}
```

### Check Letter Allowance

Check remaining letter credits.

```http
GET /api/subscriptions/check-allowance
```

**Response (200):**
```typescript
{
  "has_access": boolean,
  "letters_remaining": number,
  "plan_type": "string",
  "is_active": boolean
}
```

### Get Billing History

Retrieve payment history.

```http
GET /api/subscriptions/billing-history
```

**Response (200):**
```typescript
{
  "payments": [
    {
      "id": "uuid",
      "amount": number,
      "plan": "string",
      "status": "string",
      "created_at": "timestamp"
    }
  ]
}
```

---

## Admin Endpoints

All admin endpoints require admin role and CSRF token for POST requests.

### Admin Login

Authenticate admin user.

```http
POST /api/admin-auth/login
```

**Request Body:**
```typescript
{
  "email": "string",
  "password": "string",
  "portalKey": "string"  // ADMIN_PORTAL_KEY from env
}
```

**Response (200):**
```typescript
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "string",
    "role": "admin"
  }
}
```

### Get All Letters

List all letters for admin review.

```http
GET /api/admin/letters?status=pending_review&page=1&limit=20
```

**Query Parameters:**
- `status` - Filter by status (optional)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20, max: 100)

**Response (200):**
```typescript
{
  "letters": Array<Letter>,
  "total": number,
  "page": number,
  "totalPages": number
}
```

### Start Letter Review

Begin reviewing a letter.

```http
POST /api/letters/{id}/start-review
```

**Response (200):**
```typescript
{
  "success": true,
  "letterId": "uuid",
  "status": "under_review"
}
```

### Approve Letter

Approve letter with final content.

```http
POST /api/letters/{id}/approve
```

**Request Headers:**
```
X-CSRF-Token: {token}
Cookie: admin_session={session}
```

**Request Body:**
```typescript
{
  "finalContent": "string",
  "reviewNotes": "string"  // Optional
}
```

**Response (200):**
```typescript
{
  "success": true,
  "letterId": "uuid",
  "status": "approved"
}
```

### Reject Letter

Reject letter with reason.

```http
POST /api/letters/{id}/reject
```

**Request Headers:**
```
X-CSRF-Token: {token}
```

**Request Body:**
```typescript
{
  "rejectionReason": "string"
}
```

**Response (200):**
```typescript
{
  "success": true,
  "letterId": "uuid",
  "status": "rejected"
}
```

### Get Analytics

Get platform analytics.

```http
GET /api/admin/analytics?period=7d
```

**Query Parameters:**
- `period` - Time period: `24h`, `7d`, `30d`, `90d` (default: `7d`)

**Response (200):**
```typescript
{
  "users": {
    "total": number,
    "new": number,
    "active": number
  },
  "letters": {
    "total": number,
    "pending": number,
    "approved": number,
    "rejected": number
  },
  "revenue": {
    "total": number,
    "thisMonth": number,
    "lastMonth": number
  }
}
```

---

## Employee Endpoints

### Get Referral Link

Get employee referral link and coupon code.

```http
GET /api/employee/referral-link
```

**Authentication:** Required (employee role)

**Response (200):**
```typescript
{
  "success": true,
  "couponCode": "string",
  "referralLink": "string",
  "discountPercent": number,
  "usageCount": number,
  "isActive": boolean
}
```

### Request Payout

Request commission payout.

```http
POST /api/employee/payouts
```

**Request Body:**
```typescript
{
  "amount": number,
  "paymentMethod": "string"  // PayPal, bank transfer, etc.
}
```

**Response (200):**
```typescript
{
  "success": true,
  "payoutId": "uuid",
  "amount": number,
  "status": "pending"
}
```

---

## GDPR Endpoints

### Export User Data

Export all user data for GDPR compliance.

```http
POST /api/gdpr/export-data
```

**Response (200):**
```typescript
{
  "profile": Object,
  "letters": Array<Letter>,
  "subscriptions": Array<Subscription>,
  "payments": Array<Payment>
}
```

### Delete Account

Permanently delete user account and data.

```http
POST /api/gdpr/delete-account
```

**Request Body:**
```typescript
{
  "confirmation": "DELETE MY ACCOUNT"
}
```

**Response (200):**
```typescript
{
  "success": true,
  "message": "Account scheduled for deletion"
}
```

---

## Health & System Endpoints

### Health Check

Basic health check.

```http
GET /api/health
```

**Response (200):**
```typescript
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "string",
  "version": "string",
  "uptime": number
}
```

### Detailed Health Check

Comprehensive health check with service status.

```http
GET /api/health/detailed
```

**Response (200):**
```typescript
{
  "status": "healthy",
  "services": {
    "database": { "status": "healthy", "latency": 45 },
    "auth": { "status": "healthy", "latency": 23 },
    "stripe": { "status": "healthy" },
    "openai": { "status": "healthy" },
    "redis": { "status": "healthy" }
  },
  "metrics": {
    "memoryUsage": Object,
    "activeConnections": number
  }
}
```

---

## Webhook Endpoints

### Stripe Webhook

Receive Stripe webhook events.

```http
POST /api/stripe/webhook
```

**Headers:**
```
Stripe-Signature: {signature}
```

**Events Handled:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Response (200):**
```typescript
{
  "received": true
}
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// Generate letter
const response = await fetch('/api/generate-letter', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    letterType: 'demand_letter',
    intakeData: {
      senderName: 'John Doe',
      // ... other fields
    }
  })
})

const data = await response.json()
```

### cURL

```bash
# Generate letter
curl -X POST https://yourdomain.com/api/generate-letter \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-session=..." \
  -d '{
    "letterType": "demand_letter",
    "intakeData": {...}
  }'
```

---

## Changelog

### v1.0.0 (2024-12-26)
- Initial API release
- Letter generation endpoints
- Subscription management
- Admin review system
- Employee referrals
- GDPR compliance

---

**Last Updated**: December 26, 2024
