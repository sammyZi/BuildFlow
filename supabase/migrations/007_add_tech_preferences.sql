-- Add tech_preferences column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tech_preferences TEXT;
