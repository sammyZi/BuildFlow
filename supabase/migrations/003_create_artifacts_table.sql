-- Create artifacts table
-- This table stores generated artifacts (requirements, design, tasks) for each project
CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL CHECK (artifact_type IN ('requirements', 'design', 'tasks')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view artifacts for their own projects
CREATE POLICY "Users can view own artifacts"
  ON artifacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = artifacts.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Policy: Backend can insert artifacts for any project
-- This allows the server-side service role to insert artifacts
CREATE POLICY "Backend can insert artifacts"
  ON artifacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = artifacts.project_id
    )
  );

-- Policy: Users can update artifacts for their own projects
CREATE POLICY "Users can update own artifacts"
  ON artifacts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = artifacts.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = artifacts.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Policy: Users can delete artifacts for their own projects
CREATE POLICY "Users can delete own artifacts"
  ON artifacts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = artifacts.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create index on project_id for faster queries
CREATE INDEX IF NOT EXISTS artifacts_project_id_idx ON artifacts(project_id);

-- Create index on artifact_type for filtering
CREATE INDEX IF NOT EXISTS artifacts_type_idx ON artifacts(artifact_type);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS artifacts_created_at_idx ON artifacts(created_at);

-- Create unique constraint to prevent duplicate artifact types per project
CREATE UNIQUE INDEX IF NOT EXISTS artifacts_project_type_unique 
  ON artifacts(project_id, artifact_type);

-- Create trigger to automatically update updated_at on artifact updates
CREATE TRIGGER update_artifacts_updated_at
  BEFORE UPDATE ON artifacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime for artifacts table
-- This allows clients to subscribe to real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE artifacts;
