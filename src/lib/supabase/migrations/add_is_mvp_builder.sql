-- Apply this to add MVP builder toggle to Vibecoder profiles
ALTER TABLE public.vibecoder_profiles ADD COLUMN IF NOT EXISTS is_mvp_builder BOOLEAN DEFAULT false;
