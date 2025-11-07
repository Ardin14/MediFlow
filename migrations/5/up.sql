-- Add compatibility column for older clients that expect `display_name`
ALTER TABLE IF EXISTS public.clinic_users
  ADD COLUMN IF NOT EXISTS display_name text;

-- Backfill from full_name if available
UPDATE public.clinic_users
SET display_name = full_name
WHERE display_name IS NULL AND full_name IS NOT NULL;

-- Create index to support quick lookups if needed
CREATE INDEX IF NOT EXISTS idx_clinic_users_display_name ON public.clinic_users(display_name);
