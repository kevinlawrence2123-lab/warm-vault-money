ALTER TABLE public.profiles ALTER COLUMN currency SET DEFAULT 'XOF';
UPDATE public.profiles SET currency = 'XOF' WHERE currency = 'USD' AND onboarded = false;