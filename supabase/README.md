# Supabase Database Migrations

This directory contains SQL migration scripts for the AI Architect Hub database schema.

## Migration Files

1. **001_create_profiles_table.sql** - Creates the profiles table with RLS policies
2. **002_create_projects_table.sql** - Creates the projects table with RLS policies
3. **003_create_artifacts_table.sql** - Creates the artifacts table with RLS policies and CHECK constraint

## Running Migrations

### Option 1: Using Supabase CLI (Recommended)

If you have the Supabase CLI installed:

```bash
# Initialize Supabase (if not already done)
supabase init

# Link to your Supabase project
supabase link --project-ref jliqcgowgamucngqtcsj

# Run migrations
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/jliqcgowgamucngqtcsj
2. Navigate to the SQL Editor
3. Copy and paste each migration file in order (001, 002, 003)
4. Execute each migration

### Option 3: Using the SQL Editor Directly

1. Open the Supabase SQL Editor
2. Run each migration file in order:
   - First: `001_create_profiles_table.sql`
   - Second: `002_create_projects_table.sql`
   - Third: `003_create_artifacts_table.sql`

## Database Schema Overview

### Tables

#### profiles
- Stores user profile information
- Linked to Supabase auth.users
- Automatically created on user signup
- RLS: Users can only view/update their own profile

#### projects
- Stores user project records with app idea prompts
- Foreign key to profiles(id)
- RLS: Users can only view/manage their own projects

#### artifacts
- Stores generated artifacts (requirements, design, tasks)
- Foreign key to projects(id)
- CHECK constraint ensures artifact_type is one of: 'requirements', 'design', 'tasks'
- RLS: Users can only view artifacts for their own projects
- Realtime enabled for live updates

## Row Level Security (RLS)

All tables have RLS enabled to ensure data isolation:
- Users can only access their own data
- Backend service role can insert artifacts for any project
- All policies enforce user_id matching for data access

## Realtime Subscriptions

The artifacts table has realtime enabled, allowing clients to subscribe to:
- New artifact insertions
- Artifact updates
- Artifact deletions

This enables the real-time UI updates as artifacts are generated.
