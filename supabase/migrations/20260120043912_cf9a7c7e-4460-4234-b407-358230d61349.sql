-- Create goals table for tracking 500 goals
CREATE TABLE public.goals (
    id INTEGER PRIMARY KEY CHECK (id >= 1 AND id <= 500),
    checked BOOLEAN NOT NULL DEFAULT false,
    target_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notes table for personal notes
CREATE TABLE public.notes (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    content TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for goals - public access
CREATE POLICY "Anyone can view goals"
ON public.goals FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert goals"
ON public.goals FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update goals"
ON public.goals FOR UPDATE
USING (true);

-- RLS policies for notes - public access
CREATE POLICY "Anyone can view notes"
ON public.notes FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert notes"
ON public.notes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update notes"
ON public.notes FOR UPDATE
USING (true);

-- Insert initial data for all 500 goals
INSERT INTO public.goals (id, checked)
SELECT generate_series(1, 500), false;

-- Insert initial notes row
INSERT INTO public.notes (id, content) VALUES (1, '');

-- Add trigger for updated_at on goals
CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on notes
CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();