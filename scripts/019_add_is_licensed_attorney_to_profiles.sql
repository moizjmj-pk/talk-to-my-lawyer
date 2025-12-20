-- Add is_licensed_attorney column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_licensed_attorney BOOLEAN DEFAULT FALSE;

-- Grant access to authenticated users to read this column (if needed, usually profiles are public)
-- RLS policies usually handle this, but ensuring new column is accessible if RLS is stricter
-- Assuming existing RLS on profiles allows reading public columns.

-- Comment on column
COMMENT ON COLUMN profiles.is_licensed_attorney IS 'Indicates if the user is a licensed attorney maintained by admin';
