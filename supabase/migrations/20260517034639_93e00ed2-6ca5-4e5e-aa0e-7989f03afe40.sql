CREATE TABLE public.tracked_flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration text NOT NULL UNIQUE,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tracked_flights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read tracked_flights"
ON public.tracked_flights FOR SELECT
USING (true);

INSERT INTO public.tracked_flights (registration) VALUES ('N787FZ'), ('VPCZS')
ON CONFLICT (registration) DO NOTHING;

ALTER PUBLICATION supabase_realtime ADD TABLE public.tracked_flights;