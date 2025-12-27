import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_IDLE_TIMEOUT_MS,
  verifyAdminRole,
  verifyAdminSessionFromRequest,
} from '@/lib/auth/admin-session'

const PUBLIC_PATHS = new Set([
  '/',
  '/landing-page-new',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/site.webmanifest',
])

const PUBLIC_PREFIXES = ['/auth', '/api/health', '/api/health/detailed', '/_next', '/public']

function isPublicPath(pathname: string, adminPortalRoute: string) {
  if (PUBLIC_PATHS.has(pathname)) {
    return true
  }

  if (pathname.startsWith(`/${adminPortalRoute}/login`)) {
    return true
  }

  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function handleMissingSupabaseEnv(request: NextRequest, isPublic: boolean) {
  if (isPublic) {
    return NextResponse.next()
  }

  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.json(
      {
        error: 'Supabase environment not configured',
      },
      { status: 503 }
    )
  }

  const url = request.nextUrl.clone()
  url.pathname = '/'
  url.searchParams.set('error', 'supabase-missing')
  return NextResponse.redirect(url)
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const adminPortalRoute = process.env.ADMIN_PORTAL_ROUTE || 'secure-admin-gateway'
  const pathname = request.nextUrl.pathname
  const isPublic = isPublicPath(pathname, adminPortalRoute)

  if (!supabaseUrl || !supabaseAnonKey) {
    return handleMissingSupabaseEnv(request, isPublic)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userRole: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    userRole = profile?.role ?? null
  }

  const isAdminPortalRoute = pathname.startsWith(`/${adminPortalRoute}`)
  const isDashboardRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin')

  const adminSessionResult = isAdminPortalRoute
    ? await verifyAdminSessionFromRequest(request)
    : { session: null, shouldClearCookie: false, shouldRefreshCookie: false }

  if (adminSessionResult.shouldClearCookie) {
    supabaseResponse.cookies.delete(ADMIN_SESSION_COOKIE)
  } else if (adminSessionResult.shouldRefreshCookie && adminSessionResult.cookieValue) {
    supabaseResponse.cookies.set(ADMIN_SESSION_COOKIE, adminSessionResult.cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ADMIN_SESSION_IDLE_TIMEOUT_MS / 1000,
      path: '/',
    })
  }

  if (isAdminPortalRoute) {
    const loginPath = `/${adminPortalRoute}/login`

    if (pathname === loginPath) {
      return supabaseResponse
    }

    if (!adminSessionResult.session) {
      const url = request.nextUrl.clone()
      url.pathname = loginPath
      return NextResponse.redirect(url)
    }

    const hasAdminRole = await verifyAdminRole(adminSessionResult.session.userId)
    if (!hasAdminRole) {
      supabaseResponse.cookies.delete(ADMIN_SESSION_COOKIE)
      const url = request.nextUrl.clone()
      url.pathname = loginPath
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  if (pathname.startsWith('/dashboard/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (isDashboardRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (!isPublic && pathname.startsWith('/secure-admin-gateway')) {
    const url = request.nextUrl.clone()
    url.pathname = `/${adminPortalRoute}/login`
    return NextResponse.redirect(url)
  }

  if (user && userRole) {
    if (
      userRole === 'employee' &&
      (pathname.startsWith('/dashboard/letters') || pathname.startsWith('/dashboard/subscription'))
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/commissions'
      return NextResponse.redirect(url)
    }

    if (
      (pathname.startsWith('/dashboard/commissions') || pathname.startsWith('/dashboard/coupons')) &&
      userRole === 'subscriber'
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/letters'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
