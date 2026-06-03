-- Create artifact_versions table
-- Stores version history for each artifact to support undo and diff viewing
CREATE TABLE IF NOT EXISTS artifact_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  change_prompt TEXT,  -- what the user asked for this change
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE artifact_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view versions for their own projects
CREATE POLICY "Users can view own artifact versions"
  ON artifact_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = artifact_versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Policy: Backend can insert versions
CREATE POLICY "Backend can insert artifact versions"
  ON artifact_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = artifact_versions.project_id
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS artifact_versions_artifact_id_idx ON artifact_versions(artifact_id);
CREATE INDEX IF NOT EXISTS artifact_versions_project_id_idx ON artifact_versions(project_id);
CREATE INDEX IF NOT EXISTS artifact_versions_created_at_idx ON artifact_versions(created_at DESC);
