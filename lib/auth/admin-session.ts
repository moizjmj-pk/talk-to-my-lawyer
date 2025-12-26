import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const ADMIN_SESSION_COOKIE = 'admin_session'
export const ADMIN_SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000
const ADMIN_SESSION_ABSOLUTE_TIMEOUT_MS = 24 * 60 * 60 * 1000
const ADMIN_SESSION_COOKIE_MAX_AGE = ADMIN_SESSION_IDLE_TIMEOUT_MS / 1000

export interface AdminSession {
  sessionId: string
  userId: string
  email: string
  lastActivity: string
  expiresAt: string
}

interface AdminSessionRow {
  id: string
  user_id: string
  email: string
  last_activity: string
  expires_at: string
  revoked_at: string | null
}

interface SessionContext {
  ipAddress?: string
  userAgent?: string
}

interface SessionCheckResult {
  session: AdminSession | null
  shouldRefreshCookie: boolean
  shouldClearCookie: boolean
  cookieValue?: string
}

const ADMIN_SESSION_SECRET_ENV = 'ADMIN_SESSION_SECRET'
const encoder = new TextEncoder()

function getCrypto() {
  if (!globalThis.crypto || !globalThis.crypto.subtle) {
    throw new Error('Web Crypto not available for admin session security')
  }

  return globalThis.crypto
}

function toHex(input: ArrayBuffer | Uint8Array) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex: string) {
  if (hex.length % 2 !== 0) return null

  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }

  return bytes
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i]
  }

  return result === 0
}

function generateRandomToken(size = 32) {
  const crypto = getCrypto()
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  return toHex(bytes)
}

function getAdminSessionSecret(): string | null {
  const secret = process.env[ADMIN_SESSION_SECRET_ENV]

  if (!secret) {
    console.error('[AdminSession] Missing ADMIN_SESSION_SECRET environment variable')
    return null
  }

  return secret
}

async function hashToken(token: string) {
  const crypto = getCrypto()
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token))
  return toHex(digest)
}

async function createSessionSignature(token: string, secret: string) {
  const crypto = getCrypto()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(token))
  return new Uint8Array(signature)
}

async function signToken(token: string, secret: string) {
  const signature = await createSessionSignature(token, secret)
  return `${token}.${toHex(signature)}`
}

async function parseSignedToken(signedToken: string, secret: string): Promise<string | null> {
  const [token, signature] = signedToken.split('.')

  if (!token || !signature) return null

  const providedSignature = fromHex(signature)
  if (!providedSignature) return null

  try {
    const expected = await createSessionSignature(token, secret)

    if (!constantTimeEqual(expected, providedSignature)) {
      return null
    }
  } catch (error) {
    console.error('[AdminSession] Failed to validate session signature', error)
    return null
  }

  return token
}

function mapRowToSession(row: AdminSessionRow): AdminSession {
  return {
    sessionId: row.id,
    userId: row.user_id,
    email: row.email,
    lastActivity: row.last_activity,
    expiresAt: row.expires_at,
  }
}

function getRequestContext(request?: NextRequest): SessionContext {
  if (!request) return {}

  const forwardedFor = request.headers.get('x-forwarded-for')
  const ipAddress = forwardedFor?.split(',')[0]?.trim() || request.ip || undefined
  const userAgent = request.headers.get('user-agent') || undefined

  return { ipAddress, userAgent }
}

async function recordAdminAudit(
  event: 'login' | 'logout' | 'revoked' | 'expired' | 'invalidated',
  details: {
    sessionId?: string
    userId?: string
    email?: string
    context?: SessionContext
    metadata?: Record<string, unknown>
  }
) {
  try {
    const supabase = createServiceRoleClient()
    await supabase.from('admin_auth_audit').insert({
      session_id: details.sessionId || null,
      user_id: details.userId || null,
      email: details.email || null,
      event,
      ip_address: details.context?.ipAddress || null,
      user_agent: details.context?.userAgent || null,
      metadata: details.metadata || {},
    })
  } catch (error) {
    console.error('[AdminSession] Failed to record admin auth audit', error)
  }
}

async function fetchSessionByToken(rawToken: string) {
  try {
    const supabase = createServiceRoleClient()
    const tokenHash = await hashToken(rawToken)

    const { data } = await supabase
      .from('admin_sessions')
      .select('id, user_id, email, last_activity, expires_at, revoked_at')
      .eq('session_token_hash', tokenHash)
      .limit(1)
      .maybeSingle()

    return data ?? null
  } catch (error) {
    console.error('[AdminSession] Failed to fetch session by token', error)
    return null
  }
}

async function touchSession(sessionId: string, context?: SessionContext) {
  try {
    const supabase = createServiceRoleClient()
    await supabase
      .from('admin_sessions')
      .update({
        last_activity: new Date().toISOString(),
        ip_address: context?.ipAddress,
        user_agent: context?.userAgent,
      })
      .eq('id', sessionId)
  } catch (error) {
    console.error('[AdminSession] Failed to refresh session activity', error)
  }
}

async function revokeSession(
  session: AdminSessionRow,
  event: 'revoked' | 'expired' | 'invalidated' | 'logout',
  context?: SessionContext
) {
  try {
    const supabase = createServiceRoleClient()
    await supabase
      .from('admin_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', session.id)

    await recordAdminAudit(event, {
      sessionId: session.id,
      userId: session.user_id,
      email: session.email,
      context,
    })
  } catch (error) {
    console.error('[AdminSession] Failed to revoke session', error)
  }
}

async function validateSessionCookie(
  cookieValue: string | undefined,
  context?: SessionContext
): Promise<SessionCheckResult> {
  const secret = getAdminSessionSecret()

  if (!cookieValue || !secret) {
    return {
      session: null,
      shouldClearCookie: Boolean(cookieValue && !secret),
      shouldRefreshCookie: false,
    }
  }

  const rawToken = await parseSignedToken(cookieValue, secret)
  if (!rawToken) {
    await recordAdminAudit('invalidated', {
      context,
      metadata: { reason: 'invalid-signature' },
    })
    return { session: null, shouldRefreshCookie: false, shouldClearCookie: true }
  }

  const session = await fetchSessionByToken(rawToken)
  if (!session) {
    await recordAdminAudit('invalidated', {
      context,
      metadata: { reason: 'session-not-found' },
    })
    return { session: null, shouldRefreshCookie: false, shouldClearCookie: true }
  }

  const now = new Date()
  const lastActivity = new Date(session.last_activity)
  const expiresAt = new Date(session.expires_at)

  if (session.revoked_at) {
    await recordAdminAudit('invalidated', {
      sessionId: session.id,
      userId: session.user_id,
      email: session.email,
      context,
      metadata: { reason: 'revoked' },
    })
    return { session: null, shouldRefreshCookie: false, shouldClearCookie: true }
  }

  if (now > expiresAt || now.getTime() - lastActivity.getTime() > ADMIN_SESSION_IDLE_TIMEOUT_MS) {
    await revokeSession(session, 'expired', context)
    return { session: null, shouldRefreshCookie: false, shouldClearCookie: true }
  }

  await touchSession(session.id, context)

  return {
    session: mapRowToSession(session),
    shouldRefreshCookie: true,
    shouldClearCookie: false,
    cookieValue: await signToken(rawToken, secret),
  }
}

function buildSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: ADMIN_SESSION_COOKIE_MAX_AGE,
    path: '/',
  }
}

/**
 * Create an admin session after successful authentication
 */
export async function createAdminSession(userId: string, email: string, request?: NextRequest): Promise<void> {
  const secret = getAdminSessionSecret()
  if (!secret) {
    throw new Error('Admin session secret not configured')
  }

  const token = generateRandomToken()
  const signedToken = await signToken(token, secret)
  const tokenHash = await hashToken(token)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ADMIN_SESSION_ABSOLUTE_TIMEOUT_MS).toISOString()
  const context = getRequestContext(request)

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('admin_sessions')
    .insert({
      user_id: userId,
      email,
      session_token_hash: tokenHash,
      last_activity: now.toISOString(),
      expires_at: expiresAt,
      ip_address: context.ipAddress,
      user_agent: context.userAgent,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('[AdminSession] Failed to persist admin session', error)
    throw new Error('Unable to create admin session')
  }

  await recordAdminAudit('login', { sessionId: data.id, userId, email, context })

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_SESSION_COOKIE, signedToken, buildSessionCookieOptions())
}

/**
 * Verify admin session from cookies in server components or route handlers
 */
export async function verifyAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  const result = await validateSessionCookie(cookieValue)

  if (result.shouldClearCookie) {
    cookieStore.delete(ADMIN_SESSION_COOKIE)
    return null
  }

  if (result.shouldRefreshCookie && result.cookieValue) {
    cookieStore.set(ADMIN_SESSION_COOKIE, result.cookieValue, buildSessionCookieOptions())
  }

  return result.session
}

/**
 * Verify admin session from request (for middleware)
 */
export async function verifyAdminSessionFromRequest(request: NextRequest) {
  const cookieValue = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  const context = getRequestContext(request)
  const result = await validateSessionCookie(cookieValue, context)

  return result
}

/**
 * Destroy admin session (logout)
 */
export async function destroyAdminSession(request?: NextRequest): Promise<void> {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || request?.cookies.get(ADMIN_SESSION_COOKIE)?.value
  const context = getRequestContext(request)
  const secret = getAdminSessionSecret()

  if (cookieValue && secret) {
    const rawToken = await parseSignedToken(cookieValue, secret)
    if (rawToken) {
      const session = await fetchSessionByToken(rawToken)
      if (session) {
        await revokeSession(session, 'logout', context)
      }
    }
  }

  cookieStore.delete(ADMIN_SESSION_COOKIE)
}

/**
 * Verify admin credentials and portal key
 * Supports multiple admins - each admin has their own Supabase Auth account
 */
export async function verifyAdminCredentials(
  email: string,
  password: string,
  portalKey: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  const expectedPortalKey = process.env.ADMIN_PORTAL_KEY
  if (!expectedPortalKey || portalKey !== expectedPortalKey) {
    return { success: false, error: 'Invalid admin portal key' }
  }

  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    console.warn('[AdminAuth] Supabase auth failed:', authError?.message)
    return { success: false, error: 'Invalid email or password' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', authData.user.id)
    .eq('role', 'admin')
    .single()

  if (profileError || !profile) {
    console.warn('[AdminAuth] User does not have admin role:', {
      userId: authData.user.id,
      email,
    })
    return { success: false, error: 'Access denied. Admin privileges required.' }
  }

  return { success: true, userId: profile.id }
}

/**
 * Verify admin role from database
 */
export async function verifyAdminRole(userId: string): Promise<boolean> {
  try {
    const supabase = createServiceRoleClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    return profile?.role === 'admin'
  } catch (error) {
    console.error('[AdminSession] Failed to verify admin role', error)
    return false
  }
}

/**
 * Get admin session info
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  return await verifyAdminSession()
}

/**
 * Check if current user is authenticated admin
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await verifyAdminSession()
  if (!session) {
    return false
  }

  return await verifyAdminRole(session.userId)
}

/**
 * Require admin authentication for API routes (any admin type)
 */
export async function requireAdminAuth(): Promise<NextResponse | undefined> {
  const authenticated = await isAdminAuthenticated()

  if (!authenticated) {
    return NextResponse.json(
      { error: 'Admin authentication required' },
      { status: 401 }
    )
  }

  return undefined
}
