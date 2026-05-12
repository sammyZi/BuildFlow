# Implementation Plan: AI Architect Hub

## Overview

This implementation plan breaks down the AI Architect Hub into granular, executable tasks. The system is a full-stack SaaS application with Next.js frontend, Express backend API, Supabase for data/auth, and MiniMax LLM integration. Tasks are ordered to build incrementally, with early validation through automated tests.

## Tasks

- [x] 1. Initialize project structure and dependencies
  - Create Next.js 14+ project with TypeScript and App Router
  - Install core dependencies: @supabase/supabase-js, express, tailwindcss, jszip
  - Install MiniMax SDK for opencode zen integration
  - Configure TypeScript with strict mode enabled
  - Set up Tailwind CSS configuration with glassmorphism utilities
  - Create folder structure: /app, /components, /lib, /api, /types
  - _Requirements: 16.1, 16.4, 17.5_

- [x] 2. Define TypeScript interfaces and types
  - [x] 2.1 Create shared type definitions file
    - Define Profile, Project, Artifact interfaces
    - Define ArtifactType union type ('requirements' | 'design' | 'tasks')
    - Define GenerateRequest and GenerateResponse interfaces
    - Define GenerationContext and LLMResponse interfaces
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [x] 3. Set up Supabase configuration and database schema
  - [x] 3.1 Configure Supabase client
    - Create Supabase client utility with environment variables
    - Configure authentication helpers
    - Set up server-side and client-side client instances
    - _Requirements: 16.2, 1.1, 1.2_
  
  - [x] 3.2 Create database migration scripts
    - Write SQL migration for profiles table
    - Write SQL migration for projects table with RLS policies
    - Write SQL migration for artifacts table with RLS policies
    - Include CHECK constraint for artifact_type enum
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 4. Implement authentication components
  - [x] 4.1 Create LoginPage component
    - Build email/password input form with Tailwind styling
    - Implement Supabase signUp method integration
    - Implement Supabase signIn method integration
    - Add error message display for auth failures
    - Add loading state during authentication
    - _Requirements: 1.1, 1.2, 15.1_
  
  - [x] 4.2 Create AuthGuard component
    - Check authentication state using Supabase auth.getSession()
    - Redirect unauthenticated users to /login
    - Maintain session state across page refreshes
    - Grant dashboard access when authenticated
    - _Requirements: 1.3, 1.4, 1.5_
  
  - [ ]* 4.3 Write unit tests for authentication flow
    - Test successful login redirects to dashboard
    - Test failed login shows error message
    - Test unauthenticated access redirects to login
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 5. Build UI component library with glassmorphism
  - [x] 5.1 Create GlassmorphismCard component
    - Implement translucent background with light theme colors
    - Apply backdrop-blur-md filter
    - Add subtle glowing border with box-shadow
    - Make component reusable with children prop
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 11.4, 11.5_
  
  - [x] 5.2 Configure Tailwind for light theme
    - Define light color palette in tailwind.config.js
    - Create custom glassmorphism utility classes
    - Set up responsive breakpoints (mobile: 768px, desktop: 1024px)
    - _Requirements: 3.1, 3.5, 18.2_

- [ ] 6. Implement dashboard layout components
  - [ ] 6.1 Create DashboardLayout component
    - Build split-screen layout with CSS Grid (desktop)
    - Implement responsive stacking for mobile (<768px)
    - Left panel: 40% width on desktop, full width on mobile
    - Right panel: 60% width on desktop, full width on mobile
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 18.3_
  
  - [ ] 6.2 Create InputPanel component
    - Add textarea for app idea input with light theme styling
    - Add submit button with loading state (disabled during generation)
    - Display character count indicator
    - Show error messages below textarea
    - _Requirements: 5.1, 5.2, 5.5, 5.6_
  
  - [ ] 6.3 Create ResultsGrid component
    - Display artifact cards in vertical stack
    - Show loading skeleton while generation in progress
    - Render "Download Bundle" button when all 3 artifacts complete
    - _Requirements: 10.4, 11.1, 12.1_

- [ ] 7. Checkpoint - Verify UI components render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement Supabase service layer
  - [ ] 8.1 Create SupabaseService class
    - Implement createProject(userId, prompt) method
    - Implement saveArtifact(projectId, type, content) method
    - Implement getProjectsByUser(userId) method
    - Implement getArtifactsByProject(projectId) method
    - Add error handling for database operations
    - _Requirements: 2.1, 2.2, 2.3, 5.4_
  
  - [ ]* 8.2 Write unit tests for SupabaseService
    - Test createProject inserts record correctly
    - Test saveArtifact stores content with correct type
    - Test getProjectsByUser filters by user_id
    - Test RLS policies enforce user isolation
    - _Requirements: 2.4, 2.5, 2.6, 2.7_

- [ ] 9. Implement real-time artifact subscription
  - [ ] 9.1 Add subscribeToArtifacts method to SupabaseService
    - Set up Supabase realtime channel for artifacts table
    - Filter subscription by project_id
    - Return subscription object for cleanup
    - _Requirements: 10.1_
  
  - [ ] 9.2 Integrate realtime updates in ResultsGrid
    - Establish subscription when component mounts
    - Update state when INSERT event received
    - Render new ArtifactCard when artifact arrives
    - Clean up subscription on component unmount
    - _Requirements: 10.2, 10.3, 10.4_
  
  - [ ] 9.3 Add reconnection logic for realtime subscription
    - Detect subscription disconnect events
    - Attempt automatic reconnection up to 5 times
    - Display manual refresh prompt after 5 failed attempts
    - _Requirements: 15.4, 15.5_

- [ ] 10. Create ArtifactCard component
  - [ ] 10.1 Build ArtifactCard with glassmorphism styling
    - Use GlassmorphismCard as base component
    - Display artifact_type as heading (Requirements, Design, Tasks)
    - Render markdown content with proper formatting using markdown parser
    - Apply light theme colors consistently
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 11. Implement MiniMax LLM client
  - [ ] 11.1 Create MiniMaxClient class
    - Configure MiniMax M2.5 Free API with credentials from env
    - Implement generateRequirements(appIdea) method
    - Implement generateDesign(appIdea, requirements) method
    - Implement generateTasks(appIdea, requirements, design) method
    - _Requirements: 13.1, 13.2, 13.3_
  
  - [ ] 11.2 Add retry logic with exponential backoff
    - Retry failed API calls up to 3 times
    - Use exponential backoff: 1s, 2s, 4s
    - Handle rate limit errors gracefully
    - Return error after 3 failed attempts
    - _Requirements: 13.4, 13.5_
  
  - [ ] 11.3 Configure system prompts for each generation type
    - Requirements prompt: "You are an expert Product Manager. Given the following app idea, generate a requirements.md file detailing the target audience, core user stories, and strict feature scope."
    - Design prompt: "You are an expert Software Architect. Using the attached requirements, create a design.md file specifying the ideal tech stack, database schema, and exact folder structure."
    - Tasks prompt: "You are a Lead Developer. Break down the attached requirements and design into a tasks.md file. Format this as a highly granular checklist where each item is small enough to be independently executed by an AI IDE without additional context."
    - _Requirements: 7.1, 7.2, 8.1, 8.2, 9.1, 9.2_
  
  - [ ]* 11.4 Write unit tests for MiniMaxClient
    - Test successful generation returns markdown content
    - Test retry logic triggers on API failure
    - Test exponential backoff timing
    - Mock MiniMax API responses
    - _Requirements: 13.1, 13.5_

- [ ] 12. Build generation orchestration pipeline
  - [ ] 12.1 Create GenerationOrchestrator class
    - Implement sequential pipeline: requirements → design → tasks
    - Pass accumulated context to each generation step
    - Save each artifact to database immediately after generation
    - Return project ID on completion
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_
  
  - [ ] 12.2 Add error handling to pipeline
    - Catch generation failures at each step
    - Return descriptive error messages
    - Stop pipeline on first failure
    - _Requirements: 6.9, 15.2_
  
  - [ ]* 12.3 Write integration tests for pipeline
    - Test full pipeline generates all 3 artifacts
    - Test pipeline stops on requirements generation failure
    - Test pipeline stops on design generation failure
    - Test artifacts are saved to database in correct order
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [ ] 13. Checkpoint - Verify generation pipeline works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Implement Express API endpoint
  - [ ] 14.1 Create POST /api/generate endpoint
    - Set up Express router with TypeScript
    - Parse GenerateRequest from request body
    - Validate appIdea is non-empty string
    - Authenticate request using Supabase JWT from Authorization header
    - _Requirements: 6.1, 6.2_
  
  - [ ] 14.2 Wire endpoint to generation pipeline
    - Call SupabaseService.createProject() with userId and appIdea
    - Invoke GenerationOrchestrator with project ID
    - Return GenerateResponse with success and projectId
    - Return error response if pipeline fails
    - _Requirements: 5.3, 5.4, 6.9_
  
  - [ ]* 14.3 Write API endpoint tests
    - Test authenticated request succeeds
    - Test unauthenticated request returns 401
    - Test invalid appIdea returns 400
    - Test successful generation returns projectId
    - _Requirements: 6.1, 6.2, 6.9_

- [ ] 15. Implement app idea submission flow
  - [ ] 15.1 Connect InputPanel submit to API
    - Call POST /api/generate with appIdea and userId
    - Include Supabase session token in Authorization header
    - Disable submit button while request in progress
    - Display error message if API call fails
    - _Requirements: 5.3, 5.5, 5.6_
  
  - [ ] 15.2 Handle submission errors
    - Show authentication errors from API
    - Show network connectivity errors
    - Show generation pipeline errors
    - _Requirements: 15.1, 15.2, 15.3_

- [ ] 16. Implement download bundle feature
  - [ ] 16.1 Create download bundle function
    - Use jszip to create zip file
    - Add requirements.md to zip with artifact content
    - Add design.md to zip with artifact content
    - Add tasks.md to zip with artifact content
    - Generate filename: `project-{projectId}-{timestamp}.zip`
    - Trigger browser download using Blob and URL.createObjectURL
    - _Requirements: 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_
  
  - [ ] 16.2 Show download button when all artifacts ready
    - Check if all 3 artifact types exist for project
    - Display "Download Bundle" button in ResultsGrid
    - Call download function on button click
    - _Requirements: 12.1_

- [ ] 17. Implement project history feature
  - [ ] 17.1 Create ProjectHistory component
    - Fetch user's projects using SupabaseService.getProjectsByUser()
    - Sort projects by created_at descending
    - Display project list with creation timestamp
    - Show app idea preview (first 100 characters)
    - _Requirements: 14.1, 14.3, 14.4, 14.5_
  
  - [ ] 17.2 Add project selection functionality
    - Handle click event on project list item
    - Fetch artifacts using SupabaseService.getArtifactsByProject()
    - Display artifacts in ResultsGrid
    - _Requirements: 14.2_
  
  - [ ]* 17.3 Write unit tests for ProjectHistory
    - Test projects are sorted by date descending
    - Test selecting project loads artifacts
    - Test empty state when user has no projects
    - _Requirements: 14.1, 14.2, 14.5_

- [ ] 18. Configure Vercel deployment
  - [ ] 18.1 Create vercel.json configuration
    - Configure Express API as serverless functions
    - Set up environment variable mappings
    - Configure build settings for Next.js
    - _Requirements: 16.1, 16.4_
  
  - [ ] 18.2 Set up environment variables
    - Add NEXT_PUBLIC_SUPABASE_URL
    - Add NEXT_PUBLIC_SUPABASE_ANON_KEY
    - Add SUPABASE_SERVICE_ROLE_KEY (server-side only)
    - Add MINIMAX_API_KEY
    - _Requirements: 16.2, 16.3_

- [ ] 19. Implement responsive design refinements
  - [ ] 19.1 Test and fix mobile layout
    - Verify split-screen stacks vertically on <768px viewports
    - Ensure touch-friendly button sizes (min 44x44px)
    - Test GlassmorphismCards remain readable on small screens
    - Verify functionality on 320px viewport width
    - _Requirements: 18.1, 18.3, 18.4, 18.5_
  
  - [ ] 19.2 Add mobile-specific optimizations
    - Adjust textarea height for mobile keyboards
    - Optimize markdown rendering for narrow viewports
    - Test project history list on mobile
    - _Requirements: 18.1, 18.3_

- [ ] 20. Final integration and polish
  - [ ] 20.1 Test complete user flow end-to-end
    - Sign up new user
    - Submit app idea
    - Verify real-time artifact updates
    - Download bundle
    - View project history
    - _Requirements: All_
  
  - [ ] 20.2 Add loading states and feedback
    - Show spinner during generation
    - Display progress indicator (1/3, 2/3, 3/3 artifacts)
    - Add success message when generation completes
    - _Requirements: 5.6, 10.4_
  
  - [ ] 20.3 Verify error handling across all flows
    - Test auth failure scenarios
    - Test network disconnection scenarios
    - Test API error scenarios
    - Test realtime subscription failures
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 21. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- The implementation follows a bottom-up approach: infrastructure → services → components → integration
- Real-time updates are critical for user experience and should be tested thoroughly
- Security is enforced through Supabase RLS policies and JWT authentication
