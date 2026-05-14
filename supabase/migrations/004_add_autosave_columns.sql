-- Add status and state_data columns to projects table to support auto-saving progress
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS current_step TEXT DEFAULT 'questions',
ADD COLUMN IF NOT EXISTS state_data JSONB DEFAULT '{}'::jsonb;

-- Ensure RLS is enabled and verify existing policies cover the new columns
-- Existing policies in 002_create_projects_table.sql already allow owners 
-- to SELECT and UPDATE all columns in their projects.
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
