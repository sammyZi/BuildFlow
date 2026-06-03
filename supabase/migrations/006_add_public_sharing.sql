-- Add is_public column to projects table for public sharing
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false NOT NULL;

-- Policy: Anyone can view a project if it is public
CREATE POLICY "Anyone can view public projects"
  ON projects FOR SELECT
  USING (is_public = true);

-- Policy: Anyone can view artifacts if their parent project is public
CREATE POLICY "Anyone can view public artifacts"
  ON artifacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = artifacts.project_id
      AND projects.is_public = true
    )
  );
