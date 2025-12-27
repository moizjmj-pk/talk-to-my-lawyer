/*
  Admin Session Hardening & Audit Trail

  - Adds server-verifiable admin sessions with idle + absolute expiry
  - Stores hashed session tokens for revocation and audit
  - Captures admin auth audit events for login/logout/expiration
  - Enforces RLS for admin-only access with service role override
*/

-- Required for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Admin sessions persisted for verification and revocation
CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email text NOT NULL,
    session_token_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_activity timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    ip_address text,
    user_agent text
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_sessions_token_hash_idx
  ON public.admin_sessions(session_token_hash);

CREATE INDEX IF NOT EXISTS admin_sessions_user_idx
  ON public.admin_sessions(user_id);

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage own admin sessions"
  ON public.admin_sessions
  FOR ALL TO authenticated
  USING (
    user_id = (SELECT auth.uid()) AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  )
  WITH CHECK (
    user_id = (SELECT auth.uid()) AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Service role can manage admin sessions"
  ON public.admin_sessions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.admin_sessions IS 'Server-verifiable admin sessions with idle/absolute expiry and revocation capabilities';

-- Admin authentication audit log
CREATE TABLE IF NOT EXISTS public.admin_auth_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid REFERENCES public.admin_sessions(id) ON DELETE SET NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    email text,
    event text NOT NULL CHECK (event IN ('login', 'logout', 'revoked', 'expired', 'invalidated')),
    ip_address text,
    user_agent text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_auth_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view own admin auth audit"
  ON public.admin_auth_audit
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid()) AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Service role can write admin auth audit"
  ON public.admin_auth_audit
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can read admin auth audit"
  ON public.admin_auth_audit
  FOR SELECT TO service_role
  USING (true);

COMMENT ON TABLE public.admin_auth_audit IS 'Audit trail for admin authentication and session lifecycle events';
