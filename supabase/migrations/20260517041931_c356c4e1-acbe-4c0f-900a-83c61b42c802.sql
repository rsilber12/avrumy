
CREATE TABLE public.flight_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  ip TEXT,
  country TEXT,
  city TEXT,
  region TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);
CREATE INDEX flight_sessions_token_idx ON public.flight_sessions(token);
ALTER TABLE public.flight_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role manages flight sessions"
ON public.flight_sessions FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE TABLE public.flight_site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  password_hash TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.flight_site_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
ALTER TABLE public.flight_site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role manages flight site settings"
ON public.flight_site_settings FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
