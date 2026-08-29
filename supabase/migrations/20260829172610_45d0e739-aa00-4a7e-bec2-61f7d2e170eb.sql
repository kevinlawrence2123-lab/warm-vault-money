
CREATE TABLE public.detection_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  permission_granted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.detection_settings TO authenticated;
GRANT ALL ON public.detection_settings TO service_role;
ALTER TABLE public.detection_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own detection settings" ON public.detection_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.detection_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.detection_sources TO authenticated;
GRANT ALL ON public.detection_sources TO service_role;
ALTER TABLE public.detection_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own detection sources" ON public.detection_sources FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.detected_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_key text NOT NULL DEFAULT 'bank',
  app_name text NOT NULL DEFAULT 'Bank app',
  amount numeric NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'expense',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  raw_text text,
  detected_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.detected_transactions TO authenticated;
GRANT ALL ON public.detected_transactions TO service_role;
ALTER TABLE public.detected_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own detected transactions" ON public.detected_transactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.detection_muted_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_key text NOT NULL,
  pattern text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.detection_muted_patterns TO authenticated;
GRANT ALL ON public.detection_muted_patterns TO service_role;
ALTER TABLE public.detection_muted_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own muted patterns" ON public.detection_muted_patterns FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
