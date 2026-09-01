ALTER TABLE public.detection_settings
  ADD COLUMN IF NOT EXISTS ingest_token text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  ADD COLUMN IF NOT EXISTS auto_save boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_ingest_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS detection_settings_ingest_token_key
  ON public.detection_settings (ingest_token);

ALTER TABLE public.detected_transactions
  ADD COLUMN IF NOT EXISTS merchant text,
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS external_ref text,
  ADD COLUMN IF NOT EXISTS transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS detected_transactions_user_ref_key
  ON public.detected_transactions (user_id, external_ref)
  WHERE external_ref IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.detection_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  auto_confirm boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.detection_rules TO authenticated;
GRANT ALL ON public.detection_rules TO service_role;

ALTER TABLE public.detection_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own detection rules" ON public.detection_rules
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);