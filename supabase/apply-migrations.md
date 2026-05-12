# How to Apply Database Migrations

## Quick Start

Follow these steps to set up your database schema:

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project: https://supabase.com/dashboard/project/jliqcgowgamucngqtcsj
2. Click on "SQL Editor" in the left sidebar

### Step 2: Run Migrations in Order

Copy and paste each migration file into the SQL Editor and click "Run":

#### Migration 1: Create Profiles Table
```sql
-- Copy the entire contents of: supabase/migrations/001_create_profiles_table.sql
```

#### Migration 2: Create Projects Table
```sql
-- Copy the entire contents of: supabase/migrations/002_create_projects_table.sql
```

#### Migration 3: Create Artifacts Table
```sql
-- Copy the entire contents of: supabase/migrations/003_create_artifacts_table.sql
```

### Step 3: Verify Setup

After running all migrations, verify the setup:

1. Go to "Table Editor" in Supabase dashboard
2. You should see three tables:
   - `profiles`
   - `projects`
   - `artifacts`

3. Check that RLS is enabled:
   - Click on each table
   - Go to "Policies" tab
   - Verify policies are listed

4. Verify Realtime is enabled for artifacts:
   - Click on `artifacts` table
   - Check that Realtime is enabled

## What Each Migration Does

### 001_create_profiles_table.sql
- Creates `profiles` table linked to Supabase auth
- Sets up RLS policies for user data isolation
- Creates automatic profile creation on user signup
- Adds automatic `updated_at` timestamp updates

### 002_create_projects_table.sql
- Creates `projects` table for storing app ideas
- Sets up RLS policies to ensure users only see their own projects
- Adds indexes for performance
- Adds automatic `updated_at` timestamp updates

### 003_create_artifacts_table.sql
- Creates `artifacts` table for storing generated documents
- Adds CHECK constraint for artifact_type enum
- Sets up RLS policies for data isolation
- Enables Realtime subscriptions for live updates
- Prevents duplicate artifact types per project

## Troubleshooting

### Error: "relation already exists"
If you see this error, the table already exists. You can either:
1. Drop the existing table and re-run the migration
2. Skip this migration if the table structure is correct

### Error: "permission denied"
Make sure you're logged in as the project owner or have sufficient permissions.

### RLS Policies Not Working
1. Verify RLS is enabled on each table
2. Check that policies are created correctly
3. Test with authenticated users (not service role)

## Testing the Setup

After applying migrations, you can test the setup:

1. Sign up a new user through your app
2. Check that a profile was automatically created
3. Create a project and verify it appears in the database
4. Verify that users can only see their own data
