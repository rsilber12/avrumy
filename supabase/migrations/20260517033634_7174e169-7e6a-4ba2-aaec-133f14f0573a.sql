
CREATE TABLE public.aircraft_state (
  registration TEXT PRIMARY KEY,
  hex TEXT,
  flight TEXT,
  on_ground BOOLEAN,
  altitude INTEGER,
  ground_speed NUMERIC,
  lat NUMERIC,
  lon NUMERIC,
  last_seen TIMESTAMPTZ,
  last_checked TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw JSONB
);

CREATE TABLE public.alert_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration TEXT NOT NULL,
  kind TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_alert_log_created ON public.alert_log (created_at DESC);

CREATE TABLE public.alert_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('telegram','email')),
  value TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kind, value)
);

ALTER TABLE public.aircraft_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read aircraft_state" ON public.aircraft_state FOR SELECT USING (true);
CREATE POLICY "public read alert_log" ON public.alert_log FOR SELECT USING (true);
CREATE POLICY "public read alert_recipients" ON public.alert_recipients FOR SELECT USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.aircraft_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_recipients;
ALTER TABLE public.aircraft_state REPLICA IDENTITY FULL;
ALTER TABLE public.alert_log REPLICA IDENTITY FULL;
ALTER TABLE public.alert_recipients REPLICA IDENTITY FULL;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
