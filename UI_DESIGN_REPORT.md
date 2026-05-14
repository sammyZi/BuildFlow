# AI Architect Hub - Page Functionality Report

## Application Overview
AI Architect Hub is a web application that helps users generate comprehensive software architecture documentation using AI. The app guides users through either a fast or detailed workflow to create requirements, system design, and task breakdowns for their app ideas.

---

## Pages and Their Functions

### 1. **Root Page** (`/`)
**Purpose:** Entry point that redirects users to the login page.

**What it does:**
- Automatically redirects all visitors to `/login`
- No user interaction required
- Acts as the application entry point

---

### 2. **Login Page** (`/login`)
**Purpose:** User authentication - allows users to sign in or create a new account.

**What it does:**
- Allows users to enter email and password
- Supports both sign-in and sign-up modes (toggle between them)
- Validates email format and password length (minimum 6 characters)
- Displays error messages if authentication fails
- Shows loading state during authentication process
- Redirects to dashboard upon successful authentication

**Key behaviors:**
- Form validation before submission
- Toggle between "Sign In" and "Sign Up" modes
- Disabled state while processing authentication

---

### 3. **Dashboard Home** (`/dashboard`)
**Purpose:** Main input page where users describe their app idea and choose how they want to generate documentation.

**What it does:**
- Accepts user's app idea description (minimum 10 characters)
- Offers two generation modes:
  - **Fast Mode:** Quickly generates all documentation automatically
  - **Detailed Mode:** Guides user through a step-by-step questionnaire for more customized output
- Validates input before submission
- Shows loading state while generating
- Displays error messages if generation fails
- Redirects to appropriate page based on selected mode:
  - Fast mode → Results page
  - Detailed mode → Questionnaire page

**Key behaviors:**
- Requires authentication (redirects to login if not authenticated)
- Minimum 10 character validation
- Submit on Enter key (Shift+Enter for new line)
- Auto-focus on text input when page loads

---

### 4. **Questionnaire Page** (`/dashboard/questionnaire`)
**Purpose:** Multi-step detailed workflow that guides users through answering questions and reviewing/refining generated documentation.

**What it does:**
- **Step 1 - Questions:** 
  - Automatically generates discovery questions based on the app idea
  - User answers multiple-choice questions
  - Advances to next step only when all questions are answered

- **Step 2 - Requirements:**
  - Generates requirements document based on answers
  - Displays the document for review
  - Allows user to request changes/refinements
  - User can commit and proceed to design

- **Step 3 - System Design:**
  - Generates system design document based on requirements
  - Displays the document for review
  - Allows user to request changes/refinements
  - User can commit and proceed to tasks

- **Step 4 - Tasks:**
  - Generates task breakdown based on design
  - Displays the document for review
  - Allows user to request changes/refinements
  - User can finalize and save the project

**Key behaviors:**
- Shows progress through 4 steps with visual indicators
- Each step can be refined multiple times before committing
- Loading states during generation and refinement
- Saves complete project at the end
- Redirects to results page when finished

---

### 5. **Architecture Diagram Page** (`/dashboard/architecture`)
**Purpose:** Displays full-page Mermaid architecture diagrams.

**What it does:**
- Renders Mermaid diagrams from URL parameters
- Displays diagram title and optional description
- Shows error message if no diagram is provided
- Allows viewing complex architecture diagrams in full detail

**Key behaviors:**
- Receives diagram data via URL parameters (diagram, title, description)
- Supports interactive diagram features (zoom, pan)
- Shows loading state while rendering

---

### 6. **Results Page** (`/dashboard/results/[projectId]`)
**Purpose:** Displays the three generated documentation artifacts with real-time updates.

**What it does:**
- Shows three documentation files:
  - requirements.md
  - design.md
  - tasks.md
- Displays generation progress (X/3 files ready)
- Updates in real-time as each artifact is generated
- Allows switching between documents
- Renders markdown content with proper formatting
- Supports copying document content to clipboard
- Enables downloading all documents as a ZIP bundle when complete
- Shows connection status and reconnection attempts
- Displays loading states for documents being generated

**Key behaviors:**
- Real-time subscription to new artifacts via WebSocket
- Automatic updates when new content is generated
- Progress bar showing completion status
- Connection monitoring with refresh prompt if disconnected
- Download bundle only available when all 3 artifacts are complete

---

### 7. **Dashboard Layout** (Wrapper for all dashboard pages)
**Purpose:** Provides consistent navigation and layout structure for all dashboard pages.

**What it does:**
- Displays project history sidebar with list of past projects
- Allows navigation between projects
- Shows current active project
- Provides sign-out functionality
- Wraps all dashboard pages with authentication check
- Allows collapsing/expanding the sidebar
- Redirects to login if user is not authenticated

**Key behaviors:**
- Sidebar can be toggled open/closed
- Clicking a project navigates to its results page
- Hidden on mobile/tablet screens
- Maintains authentication state across all dashboard pages

---

## User Workflows

### Fast Generation Workflow
1. User logs in
2. Enters app idea on dashboard home
3. Selects "Fast" mode (default)
4. Submits
5. Redirected to results page
6. Watches real-time generation of 3 documents
7. Downloads bundle when complete

### Detailed Generation Workflow
1. User logs in
2. Enters app idea on dashboard home
3. Selects "Detailed" mode
4. Submits
5. Redirected to questionnaire page
6. Answers discovery questions
7. Reviews and optionally refines requirements document
8. Commits to requirements
9. Reviews and optionally refines system design document
10. Commits to design
11. Reviews and optionally refines tasks document
12. Finalizes and saves project
13. Redirected to results page
14. Views final documents
15. Downloads bundle

### Returning User Workflow
1. User logs in
2. Sees project history in sidebar
3. Clicks on a past project
4. Views that project's results
5. Can start a new project from dashboard home

---

## Summary

The application provides two main paths for generating architecture documentation:

- **Fast path:** Quick, automated generation with minimal user input
- **Detailed path:** Guided, iterative process with multiple review and refinement opportunities

All pages work together to create a seamless experience from idea input to final documentation download, with real-time updates and the ability to revisit past projects.
