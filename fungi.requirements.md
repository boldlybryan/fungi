# PoC Requirements: v0-Powered Prototype Builder (Self-Modifying)

## Overview
A standalone proof-of-concept application that enables non-technical users to create working prototypes by describing changes in natural language. The system integrates v0 Platform API, GitHub, Neon database branching, and Vercel preview deployments to create an end-to-end prototype development workflow. Supports multiple users managing multiple prototypes simultaneously.

**Key Architecture Decision:** This application modifies itself. Users prototype changes to this application, not a separate target repository. This significantly simplifies the architecture while enabling powerful dogfooding capabilities.

## Goals
1. Prove the technical integration between v0 Platform API, GitHub, Neon, and Vercel works end-to-end
2. Validate that v0 can effectively work with an existing codebase (not just generate new code)
3. Demonstrate isolated preview environments with separate database branches
4. Show that multiple users can work on different prototypes simultaneously without conflicts
5. Validate that users can manage multiple prototypes over time
6. Demonstrate self-modifying application pattern where users improve the tool they're using

## Non-Goals (Out of Scope for PoC)
- Granular permissions/roles (admin vs. user)
- Team/organization features
- Automated cleanup/garbage collection
- Advanced error recovery and retry logic
- Production-grade monitoring and analytics
- Cost allocation per user
- Audit logging beyond basic activity tracking
- Collaborative editing (multiple users on same prototype)
- Enterprise SSO/SAML authentication

---

## System Architecture

### Components
1. **PoC Web Application** - Next.js app that serves as both:
   - The tool for creating prototypes (dashboard, auth, workspace UI)
   - The application being prototyped (users modify THIS app)
2. **v0 Platform API** - Provides AI-powered code generation with existing codebase context
3. **GitHub** - Version control and branch management (this repo)
4. **Neon** - PostgreSQL with database branching capabilities
5. **Vercel** - Hosting and preview deployments (watching this repo)
6. **Authentication Provider** - User authentication and session management (NextAuth.js)

### Data Flow
```
User authenticates
  → User creates new prototype
  → System creates GitHub branch in THIS repo
  → System creates Neon database branch
  → System sends THIS app's code to v0 Platform API (excluding protected paths)
  → System sets Vercel environment variables for branch
  → User chats with v0 to iterate on prototype
  → v0 changes are committed to GitHub branch in THIS repo
  → Vercel auto-deploys preview of modified app
  → User can view all their prototypes
  → User submits specific prototype for review (creates PR)
```

### Protected vs Modifiable Code

**Protected Paths (Cannot be modified by prototypes):**
```
/app/api/prototype/          # Core prototype management APIs
/app/dashboard/              # User's prototype list
/app/(auth)/                 # Login, signup, password reset
/app/prototype/[id]/         # Workspace UI
/lib/github.ts               # GitHub API integration
/lib/neon.ts                 # Neon API integration
/lib/vercel.ts               # Vercel API integration
/lib/v0.ts                   # v0 Platform API integration
/middleware.ts               # Auth middleware
/prisma/                     # Database schema (for PoC's own data)
```

**Modifiable Paths (Safe to experiment with):**
```
/app/page.tsx                # Landing page
/app/examples/               # Example pages/features for prototyping
/components/ui/              # UI components
/components/examples/        # Example components
/public/**/*                 # Static assets
```

---

## Functional Requirements

### FR-1: User Authentication

#### FR-1.1: Sign Up
**Description:** New users can create an account.

**Acceptance Criteria:**
- [ ] User can sign up with email and password
- [ ] Email must be valid format (RFC 5322)
- [ ] Password must be minimum 8 characters
- [ ] Password must contain at least one letter and one number
- [ ] System prevents duplicate email registrations
- [ ] After successful signup, user is automatically logged in
- [ ] After signup, user is redirected to prototype dashboard
- [ ] System stores user record with: id, email, name (optional), createdAt, updatedAt
- [ ] Password is hashed with bcrypt (cost factor 12 minimum)

#### FR-1.2: Sign In
**Description:** Existing users can log into their account.

**Acceptance Criteria:**
- [ ] User can sign in with email and password
- [ ] Invalid credentials show error message: "Invalid email or password"
- [ ] Successful login redirects to prototype dashboard
- [ ] Session persists across browser tabs
- [ ] Session persists after browser close/reopen (remember me functionality)
- [ ] Maximum session duration: 30 days
- [ ] Rate limiting: max 5 login attempts per minute per IP

#### FR-1.3: Sign Out
**Description:** Users can log out of their account.

**Acceptance Criteria:**
- [ ] Sign out button visible in navigation on all authenticated pages
- [ ] Clicking sign out clears session
- [ ] After sign out, user is redirected to login page
- [ ] Attempting to access authenticated pages after sign out redirects to login

#### FR-1.4: Password Reset
**Description:** Users can reset forgotten passwords.

**Acceptance Criteria:**
- [ ] "Forgot password?" link visible on login page
- [ ] User enters email to request reset
- [ ] System sends reset email if account exists
- [ ] System shows same success message whether email exists or not (security best practice)
- [ ] Reset link valid for 1 hour
- [ ] User can set new password via reset link
- [ ] Old passwords become invalid after reset
- [ ] After password reset, user is logged in and redirected to dashboard
- [ ] Reset tokens are single-use only

#### FR-1.5: Session Management
**Description:** System manages user sessions securely.

**Acceptance Criteria:**
- [ ] All authenticated API routes verify valid session
- [ ] Invalid/expired session returns 401 and redirects to login
- [ ] Session includes user ID for database queries
- [ ] Session data is server-side (not exposed in client)
- [ ] Concurrent sessions allowed (user can be logged in on multiple devices)
- [ ] Session tokens are cryptographically secure random values

### FR-2: Prototype Dashboard

#### FR-2.1: Prototype List View
**Description:** Users can view all their prototypes in a dashboard.

**Acceptance Criteria:**
- [ ] Dashboard displays all prototypes created by the logged-in user
- [ ] Each prototype shows: description (truncated to 100 chars), status, preview URL (if available), created date, last updated date
- [ ] Prototypes sorted by last updated (most recent first)
- [ ] Status badge shows: IN_PROGRESS (blue), SUBMITTED (yellow), MERGED (green), ARCHIVED (gray), ERROR (red)
- [ ] "Create New Prototype" button prominently displayed at top
- [ ] Empty state shown when user has no prototypes: "No prototypes yet. Create your first one!"
- [ ] Empty state includes suggested prototype ideas (e.g., "Try: 'Add a contact form to the landing page'")
- [ ] Each prototype has "Open" button to go to workspace
- [ ] Each prototype has "Delete" button (with confirmation modal)
- [ ] Dashboard shows total count: "You have X prototypes"
- [ ] Dashboard is responsive (card grid on desktop, stacked list on mobile)

#### FR-2.2: Prototype Filtering
**Description:** Users can filter their prototype list.

**Acceptance Criteria:**
- [ ] Filter by status: All, In Progress, Submitted, Merged, Archived
- [ ] Filter persists when navigating away and back
- [ ] Filter count shows in badge: "In Progress (3)"
- [ ] Default filter: "All"
- [ ] ERROR status included in "In Progress" filter

#### FR-2.3: Prototype Search
**Description:** Users can search their prototypes by description.

**Acceptance Criteria:**
- [ ] Search box at top of dashboard
- [ ] Searches against prototype description (case-insensitive, partial match)
- [ ] Results update as user types (debounced by 300ms)
- [ ] Shows "No prototypes found" if search returns no results
- [ ] Clear search button (X icon) to reset
- [ ] Search works in combination with status filter

### FR-3: Prototype Creation
**Description:** Authenticated user can initiate a new prototype that modifies this application.

**Acceptance Criteria:**
- [ ] User must be authenticated to create prototype
- [ ] User can enter a text description (minimum 10 characters, maximum 500 characters)
- [ ] System creates a unique Git branch in THIS repository with naming pattern `prototype-{userId}-{timestamp}`
- [ ] System creates a Neon database branch with the same name as the Git branch
- [ ] System creates a v0 Platform API project initialized with THIS repository's codebase (excluding protected paths)
- [ ] System sends the user's description as the initial prompt to v0
- [ ] System sets `DATABASE_URL` environment variable in Vercel scoped to the new Git branch
- [ ] System runs Prisma migrations against the new Neon branch
- [ ] System stores prototype metadata in PoC database including `createdById` (user ID)
- [ ] System redirects user to prototype workspace within 60 seconds of submission
- [ ] User sees progress indicator showing: "Creating branch...", "Setting up database...", "Initializing v0...", "Deploying preview..."
- [ ] If any step fails, system displays specific error message (e.g., "Failed to create branch") and does not create partial artifacts
- [ ] Failed creation does not leave orphaned branches/resources
- [ ] System provides helpful first-time user guidance in the creation modal

**Database Schema:**
- Prototype table must include: id, description, branchName, v0ProjectId, previewUrl (nullable), prNumber (nullable), status, createdById (foreign key to User), submittedAt (nullable), timestamps
- PreviewDatabase table must include: id, branchName, neonBranchId, connectionString, prototypeId (foreign key), timestamps
- User table must include: id, email, passwordHash, name (nullable), timestamps

### FR-4: Prototype Workspace
**Description:** User can interact with v0 chat interface and see live preview of their modified application.

**Acceptance Criteria:**
- [ ] User must be authenticated to access workspace
- [ ] User can only access their own prototypes (attempting to access another user's prototype returns 403)
- [ ] Page displays split-screen layout (50/50 width on desktop)
- [ ] Left panel embeds v0 chat interface for the prototype's v0 project
- [ ] Right panel displays iframe of Vercel preview URL (when available)
- [ ] Top bar displays: prototype description (truncated), current preview URL or "Deploying..." status, "Back to Dashboard" link, "Submit for Review" button
- [ ] "Submit for Review" button enabled only when preview is live and status is IN_PROGRESS
- [ ] Preview iframe auto-refreshes when new deployment completes (polling every 10 seconds, max 5 minutes)
- [ ] If preview URL is not yet available, right panel shows loading state with estimated wait time (1-2 minutes)
- [ ] Chat interface maintains conversation history during session
- [ ] User can leave and return to workspace without losing chat history or progress
- [ ] Workspace shows deployment status indicator: "Deploying..." (yellow spinner), "Live" (green checkmark), "Failed" (red X)

### FR-5: Code Synchronization
**Description:** Changes made in v0 are automatically committed to GitHub branch in this repository.

**Acceptance Criteria:**
- [ ] System provides webhook endpoint for v0 to notify of code changes
- [ ] Webhook verifies request authenticity (signature/token validation)
- [ ] When v0 makes changes, system validates all files are not in protected paths
- [ ] If v0 attempts to modify protected path, system rejects changes and logs security event
- [ ] System commits all valid modified files to the prototype's Git branch in THIS repository
- [ ] Commit message includes timestamp, reference to v0 project, and user who owns the prototype
- [ ] If `prisma/schema.prisma` in example content is modified, system runs migrations (but NOT the PoC's own schema)
- [ ] System handles binary files (images, etc.) correctly if v0 generates them
- [ ] Commits are authored by a designated bot user/email
- [ ] System does not commit if v0 changes result in no actual file modifications
- [ ] Multiple rapid changes from v0 are batched (max 1 commit per 30 seconds)

### FR-6: Protected Path Enforcement
**Description:** System prevents modification of core PoC functionality to maintain security and stability.

**Acceptance Criteria:**
- [ ] When initializing v0 project, system only sends modifiable paths (excludes protected paths)
- [ ] System maintains whitelist of modifiable paths and blacklist of protected paths
- [ ] Webhook handler validates every file change is not in protected path before committing
- [ ] If v0 attempts to modify protected path, system:
  - [ ] Rejects the entire change batch
  - [ ] Returns error to v0 explaining which file is protected
  - [ ] Logs security event with user ID, prototype ID, and attempted path
  - [ ] Shows error message in workspace UI
- [ ] Error message format: "Cannot modify {path}: This is a protected system file"
- [ ] System includes helpful message: "You can modify: landing page, example components, example pages"
- [ ] Protected paths include: `/app/api/prototype/`, `/app/dashboard/`, `/app/(auth)/`, `/app/prototype/`, `/lib/*.ts` (integration files), `/middleware.ts`, `/prisma/` (PoC's database schema)
- [ ] Modifiable paths include: `/app/page.tsx`, `/app/examples/`, `/components/ui/`, `/components/examples/`, `/public/`

### FR-7: Database Migration Handling
**Description:** Schema changes in example content are automatically applied to preview database.

**Acceptance Criteria:**
- [ ] System detects when example Prisma schema is modified (e.g., `/app/examples/prisma/schema.prisma`)
- [ ] System does NOT allow modification of PoC's own Prisma schema (`/prisma/schema.prisma` is protected)
- [ ] System executes Prisma migrations against the preview database connection string
- [ ] Migration runs complete before Vercel deployment finishes
- [ ] If migration fails, system logs error, notifies user in workspace UI, and marks prototype status as ERROR
- [ ] Generated migration files are committed to the Git branch
- [ ] System does not attempt to migrate if only non-schema files changed
- [ ] Migration logs are stored and accessible to user for debugging
- [ ] Clear separation between PoC database schema (protected) and example database schema (modifiable)

### FR-8: Preview Deployment
**Description:** Changes trigger automatic Vercel preview deployments of the modified application.

**Acceptance Criteria:**
- [ ] Vercel automatically deploys when commits are pushed to prototype branch (standard Vercel behavior)
- [ ] Preview deployment uses the `DATABASE_URL` environment variable set for that specific branch
- [ ] System polls Vercel API to detect when deployment is complete (every 10 seconds, max 5 minutes, timeout after)
- [ ] System updates `previewUrl` field in database when deployment URL is available
- [ ] Preview URL follows Vercel's pattern: `prototype-{userId}-{timestamp}-{project}.vercel.app`
- [ ] Multiple sequential commits batch into single deployment (standard Vercel behavior)
- [ ] Deployment status visible in workspace UI (deploying/success/failed)
- [ ] If deployment fails, system shows error with link to Vercel deployment logs
- [ ] Preview includes the full modified application (dashboard, workspace, landing page, etc.)

### FR-9: Pull Request Submission
**Description:** User can submit completed prototype for review to merge into main application.

**Acceptance Criteria:**
- [ ] User must be authenticated and must own the prototype to submit
- [ ] "Submit for Review" button creates GitHub Pull Request in THIS repository
- [ ] PR title is "Prototype by {userName}: {description}"
- [ ] PR body includes:
  - [ ] Full description
  - [ ] Preview URL (clickable link)
  - [ ] Link to v0 project
  - [ ] Created by (user email)
  - [ ] List of files modified
  - [ ] Confirmation that no protected paths were modified
- [ ] PR base branch is `main`
- [ ] PR head branch is the prototype branch
- [ ] System updates prototype status to "SUBMITTED"
- [ ] System stores PR number in database
- [ ] System stores submitted timestamp
- [ ] After submission, system displays PR URL to user with success message
- [ ] User cannot submit the same prototype twice (button becomes disabled, shows "Already Submitted")
- [ ] Submitted prototypes become read-only:
  - [ ] v0 chat interface replaced with message: "This prototype has been submitted. No further changes allowed."
  - [ ] Message includes link to GitHub PR
  - [ ] Preview iframe remains visible (read-only)

### FR-10: Prototype Deletion
**Description:** User can delete their prototypes and associated resources.

**Acceptance Criteria:**
- [ ] User can only delete their own prototypes
- [ ] Deletion requires confirmation modal: "Are you sure? This will delete the branch, database, and all changes."
- [ ] User must type prototype description (or "DELETE") to confirm deletion
- [ ] Deletion updates prototype status to "ARCHIVED" (soft delete)
- [ ] Deletion marks resources for cleanup: Git branch, Neon branch, Vercel env vars
- [ ] Actual resource cleanup can be deferred (allows for background cleanup job)
- [ ] Archived prototypes don't show in default dashboard view (but can be seen with "Archived" filter)
- [ ] Cannot delete prototypes with status SUBMITTED or MERGED (show error: "Cannot delete submitted/merged prototypes")
- [ ] Deletion success shows toast notification: "Prototype archived successfully"
- [ ] Delete button has destructive styling (red) and icon

### FR-11: Prototype Ownership
**Description:** System enforces strict prototype ownership and data isolation between users.

**Acceptance Criteria:**
- [ ] All prototype queries filtered by `createdById = currentUser.id`
- [ ] Attempting to access another user's prototype returns 403 Forbidden
- [ ] Attempting to modify another user's prototype returns 403 Forbidden
- [ ] API routes verify ownership before any mutation operations
- [ ] Dashboard only shows prototypes owned by logged-in user
- [ ] No way for users to list or discover other users' prototypes
- [ ] Workspace URL validation: even if user guesses prototype ID, they cannot access if not owner
- [ ] Error message for unauthorized access: "You don't have permission to access this prototype"

### FR-12: Example Content Provision
**Description:** Application includes safe, example content for users to prototype against.

**Acceptance Criteria:**
- [ ] Landing page (`/app/page.tsx`) includes clear content that can be modified safely
- [ ] Application includes example features in `/app/examples/`:
  - [ ] Blog feature with list and detail pages
  - [ ] Contact form page
  - [ ] About page
  - [ ] Dashboard example (different from PoC dashboard)
- [ ] Example UI components in `/components/examples/`:
  - [ ] Card component variations
  - [ ] Button component variations
  - [ ] Form component examples
  - [ ] Navigation component examples
- [ ] Each example includes comments explaining it's safe to modify
- [ ] README section explains what users can/cannot modify
- [ ] Dashboard empty state suggests first prototype ideas:
  - "Try: 'Add a contact form to the landing page'"
  - "Try: 'Change the blog layout to a grid'"
  - "Try: 'Add a dark mode toggle'"
- [ ] Example content uses separate database schema (not the PoC's user/prototype tables)

---

## Technical Requirements

### TR-1: Authentication Implementation
**Description:** Secure authentication system for multi-user support using NextAuth.js.

**Acceptance Criteria:**
- [ ] Use NextAuth.js (Auth.js) v5 with Credentials provider
- [ ] Passwords hashed with bcrypt (cost factor 12)
- [ ] Session stored in database (not JWT) for better security and revocation capability
- [ ] CSRF protection enabled
- [ ] Rate limiting on auth endpoints (max 5 login attempts per minute per IP)
- [ ] Email validation prevents SQL injection and XSS
- [ ] Password reset tokens are cryptographically random (32 bytes minimum)
- [ ] All auth routes are server-side (API routes or Server Actions)
- [ ] Account lockout after 10 failed login attempts within 1 hour (unlock after 1 hour or admin intervention)

### TR-2: Authorization Middleware
**Description:** Protect routes and API endpoints with authentication checks.

**Acceptance Criteria:**
- [ ] Middleware checks authentication on all `/dashboard/*` routes
- [ ] Middleware checks authentication on all `/prototype/*` routes
- [ ] Middleware checks authentication on all `/api/prototype/*` endpoints
- [ ] Unauthenticated requests redirect to `/login` with return URL parameter
- [ ] API endpoints return 401 for unauthenticated requests (with JSON error)
- [ ] Helper function `getCurrentUser()` to get current user from session in Server Components
- [ ] Helper function `getUserFromRequest()` to get current user from request in API routes
- [ ] Middleware runs on every request except public paths (/, /login, /signup, /forgot-password, /reset-password, /api/auth/*)

### TR-3: Database Schema (Multi-User)
**Description:** Database schema supporting multiple users and prototypes.

**Prisma Schema:**
```prisma
model User {
  id            String      @id @default(cuid())
  email         String      @unique
  passwordHash  String
  name          String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  prototypes    Prototype[]
  passwordResets PasswordReset[]
  sessions      Session[]
  
  @@index([email])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  createdAt    DateTime @default(now())
  
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([sessionToken])
}

model PasswordReset {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([token])
  @@index([userId])
}

model Prototype {
  id              String   @id @default(cuid())
  description     String   @db.Text
  branchName      String   @unique
  v0ProjectId     String
  previewUrl      String?
  prNumber        Int?
  status          String   // IN_PROGRESS, SUBMITTED, MERGED, ARCHIVED, ERROR
  createdById     String
  submittedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  createdBy       User     @relation(fields: [createdById], references: [id], onDelete: Cascade)
  previewDatabase PreviewDatabase?
  
  @@index([createdById, status])
  @@index([createdById, updatedAt])
  @@index([branchName])
}

model PreviewDatabase {
  id               String    @id @default(cuid())
  branchName       String    @unique
  neonBranchId     String
  connectionString String
  prototypeId      String    @unique
  createdAt        DateTime  @default(now())
  
  prototype        Prototype @relation(fields: [prototypeId], references: [id], onDelete: Cascade)
  
  @@index([branchName])
}
```

**Acceptance Criteria:**
- [ ] All models include proper indexes for query performance
- [ ] Foreign keys use cascading delete where appropriate (User deletion cascades to Prototypes)
- [ ] User.email has unique constraint
- [ ] Prototype.branchName has unique constraint
- [ ] Session.sessionToken has unique constraint
- [ ] PasswordReset.token has unique constraint
- [ ] Compound indexes on Prototype for common queries (createdById + status, createdById + updatedAt)
- [ ] Text fields use appropriate database types (@db.Text for long descriptions)

### TR-4: API Integration - GitHub
**Description:** PoC must interact with GitHub API for branch and PR management in THIS repository.

**Acceptance Criteria:**
- [ ] Uses GitHub Personal Access Token or GitHub App for authentication
- [ ] Token has permissions: repo (full control)
- [ ] Can create branches from `main` branch in THIS repository
- [ ] Branch names include user ID to prevent conflicts: `prototype-{userId}-{timestamp}`
- [ ] Can commit files to a specific branch in THIS repository
- [ ] Can create pull requests with custom body including user information
- [ ] PR includes labels: "prototype", "needs-review"
- [ ] Handles API rate limits gracefully (displays error if limit hit, includes retry logic)
- [ ] Uses `@octokit/rest` or `octokit` official SDK
- [ ] Stores GitHub owner and repo name in environment variables
- [ ] All GitHub operations include error handling and detailed logging
- [ ] Can list branches (for cleanup/debugging)
- [ ] Can delete branches (for cleanup after archival)

### TR-5: API Integration - Neon
**Description:** PoC must interact with Neon API for database branching.

**Acceptance Criteria:**
- [ ] Uses Neon API key for authentication
- [ ] Can create database branches via REST API (https://api-docs.neon.tech/)
- [ ] Branch names match Git branch names for traceability
- [ ] Creates branches from specified parent branch ID (production/main branch)
- [ ] Retrieves connection string for newly created branch
- [ ] Branch creation completes within 5 seconds (Neon is instant with copy-on-write)
- [ ] Stores Neon project ID in environment variables
- [ ] Can list existing branches (for debugging)
- [ ] Can delete branches (for cleanup after archival)
- [ ] Handles Neon API errors gracefully (rate limits, quota exceeded, etc.)
- [ ] Connection strings include proper SSL configuration

### TR-6: API Integration - Vercel
**Description:** PoC must interact with Vercel API for environment variable management and deployment status.

**Acceptance Criteria:**
- [ ] Uses Vercel API token for authentication
- [ ] Token has appropriate permissions (env vars, deployments)
- [ ] Can create environment variables scoped to specific Git branch via API
- [ ] Environment variables set with: key="DATABASE_URL", value={neonConnectionString}, target=["preview"], gitBranch={branchName}
- [ ] Can query deployment status by Git branch
- [ ] Can retrieve preview URL for a deployment
- [ ] Can list deployments for project (for debugging)
- [ ] Handles Vercel team/personal account correctly based on configuration
- [ ] Stores Vercel project ID and team ID (if applicable) in environment variables
- [ ] Can delete environment variables (for cleanup after branch deletion)
- [ ] Polling deployment status includes timeout handling (max 5 minutes)
- [ ] Handles Vercel API rate limits and errors gracefully

### TR-7: API Integration - v0 Platform
**Description:** PoC must interact with v0 Platform API for project creation and code generation.

**Acceptance Criteria:**
- [ ] Uses v0 API key for authentication
- [ ] Can create new v0 projects via Platform API
- [ ] Can initialize v0 project with existing codebase files (from THIS repository)
- [ ] Sends only modifiable paths to v0 (excludes protected paths)
- [ ] Sends initial prompt when creating project
- [ ] Retrieves v0 project ID for embedding chat interface
- [ ] Can set up webhook for code change notifications (if supported by v0 API)
- [ ] Falls back to polling if webhooks not available
- [ ] Follows v0 Platform API documentation for "start from existing code" pattern
- [ ] Can list user's v0 projects (if needed for debugging)
- [ ] Handles v0 API errors and rate limits
- [ ] Webhook signature validation if webhooks are used

### TR-8: Repository File Access
**Description:** System must read files from THIS repository's working directory.

**Acceptance Criteria:**
- [ ] Can read files from local filesystem (Node.js `fs` module)
- [ ] Can traverse directory structure to collect files
- [ ] Implements whitelist/blacklist filtering for protected paths
- [ ] Can read file contents as text (UTF-8)
- [ ] Can handle binary files (images, etc.) with base64 encoding if needed
- [ ] Efficiently reads files (streaming for large files, caching for frequently accessed files)
- [ ] Excludes: `node_modules/`, `.next/`, `.git/`, `.env*` files
- [ ] Includes only whitelisted paths when sending to v0
- [ ] File reading errors are handled gracefully (log error, skip file, continue)

### TR-9: Environment Variable Management
**Description:** PoC must manage environment variables securely.

**Acceptance Criteria:**
- [ ] All API keys stored in `.env.local` (not committed to Git)
- [ ] `.env.example` file documents all required variables with descriptions
- [ ] README includes step-by-step instructions for obtaining each API key
- [ ] Application fails fast with clear error message if required env vars missing
- [ ] Error message specifies which variable is missing
- [ ] No API keys exposed in client-side code (all API calls from server)
- [ ] Environment variables required:
  - `GITHUB_TOKEN` - GitHub Personal Access Token with repo permissions
  - `GITHUB_OWNER` - GitHub username/organization
  - `GITHUB_REPO` - Repository name
  - `NEON_API_KEY` - Neon API key
  - `NEON_PROJECT_ID` - Neon project ID
  - `NEON_PARENT_BRANCH_ID` - Neon branch ID to create prototype branches from
  - `VERCEL_TOKEN` - Vercel API token
  - `VERCEL_PROJECT_ID` - Vercel project ID
  - `VERCEL_TEAM_ID` - Vercel team ID (optional, for team accounts)
  - `V0_API_KEY` - v0 Platform API key
  - `DATABASE_URL` - PostgreSQL connection string for PoC's own database
  - `NEXTAUTH_SECRET` - Secret for session encryption (random 32+ character string)
  - `NEXTAUTH_URL` - Base URL of PoC app (e.g., http://localhost:3000 or https://poc.example.com)
  - `EMAIL_SERVER` - SMTP server for password reset emails (e.g., smtp://user:pass@smtp.sendgrid.net:587)
  - `EMAIL_FROM` - Sender address for emails (e.g., noreply@example.com)

### TR-10: Email Service
**Description:** Send transactional emails for password resets.

**Acceptance Criteria:**
- [ ] Uses Resend, SendGrid, or Nodemailer for email delivery
- [ ] Can send password reset emails with reset link
- [ ] Email template includes:
  - [ ] Greeting with user's email
  - [ ] Reset link (valid for 1 hour)
  - [ ] Expiration time
  - [ ] Security notice: "If you didn't request this, ignore this email"
  - [ ] Company/product name
- [ ] Email is plain text or simple HTML (no complex templates needed for PoC)
- [ ] Email service credentials stored in environment variables
- [ ] Failed email sends are logged but don't block user flow (show generic success message)
- [ ] Email includes unsubscribe footer if required by provider
- [ ] Rate limiting on password reset requests (max 3 per hour per email)

### TR-11: Error Handling
**Description:** System handles errors gracefully across all integrations.

**Acceptance Criteria:**
- [ ] API route errors return appropriate HTTP status codes (400, 401, 403, 404, 500, etc.)
- [ ] User-facing errors show helpful messages (no stack traces or sensitive data)
- [ ] Integration errors (GitHub, Neon, Vercel, v0) are logged server-side with full details
- [ ] Logs include: timestamp, user ID, prototype ID, error type, error message, stack trace
- [ ] Failed prototype creation shows specific error:
  - "Failed to create branch" (GitHub error)
  - "Failed to provision database" (Neon error)
  - "Failed to initialize AI assistant" (v0 error)
  - "Failed to configure deployment" (Vercel error)
- [ ] Network errors show: "Connection error. Please try again."
- [ ] Rate limit errors show: "Too many requests. Please wait X seconds and try again."
- [ ] All async operations have timeout handling (max 60 seconds for most operations)
- [ ] Database query errors don't expose sensitive information (no raw SQL in error messages)
- [ ] Error boundary catches React errors and shows friendly 500 page
- [ ] 404 page for non-existent routes
- [ ] Webhook errors return appropriate status to caller but don't expose internals

### TR-12: Concurrent User Support
**Description:** Multiple users can work simultaneously without conflicts or resource contention.

**Acceptance Criteria:**
- [ ] Branch names include user ID to prevent naming conflicts between users
- [ ] Database queries use proper indexes to handle multiple concurrent users efficiently
- [ ] No global state that could leak between users (all state is user-scoped)
- [ ] Session isolation ensures User A cannot see User B's data
- [ ] Race conditions handled for simultaneous prototype creation (database unique constraints prevent duplicates)
- [ ] No shared resources that could cause bottlenecks (each user gets isolated branches/databases)
- [ ] Database connection pool sized appropriately (minimum 10 connections, scales with load)
- [ ] API rate limits are per-user where possible
- [ ] System can handle 10 concurrent users creating prototypes simultaneously without degradation
- [ ] Neon database branching scales to 50+ active preview branches per project

### TR-13: Logging and Monitoring
**Description:** System logs important events for debugging and security.

**Acceptance Criteria:**
- [ ] Logs include timestamp, log level (info/warn/error), context (user ID, prototype ID, etc.)
- [ ] Logs written to stdout (Vercel captures these automatically)
- [ ] Log levels configurable via environment variable
- [ ] Security events logged:
  - [ ] Failed login attempts
  - [ ] Account lockouts
  - [ ] Password reset requests
  - [ ] Attempted access to others' prototypes
  - [ ] Attempted modification of protected paths
- [ ] Integration events logged:
  - [ ] GitHub API calls (branch creation, commits, PR creation)
  - [ ] Neon API calls (branch creation, deletion)
  - [ ] Vercel API calls (env var creation, deployment queries)
  - [ ] v0 API calls (project creation, webhook events)
- [ ] Performance metrics logged:
  - [ ] Prototype creation duration
  - [ ] Database query times (slow queries > 1 second)
  - [ ] API response times
- [ ] No sensitive data in logs (no passwords, full API keys, or connection strings)

---

## User Interface Requirements

### UI-1: Authentication Pages

#### UI-1.1: Login Page (`/login`)
**Acceptance Criteria:**
- [ ] Route: `/login`
- [ ] Centered card with "Sign In" heading
- [ ] Email input field (type="email", autocomplete="email")
- [ ] Password input field (type="password", autocomplete="current-password") with show/hide toggle icon
- [ ] "Sign In" button (primary styling, full width)
- [ ] "Forgot password?" link below form (text link)
- [ ] "Don't have an account? Sign up" link below form (text link)
- [ ] Error messages display above form in red alert box
- [ ] Form validation shows inline errors (invalid email format, empty fields)
- [ ] Loading state on button during submission ("Signing in..." with spinner)
- [ ] Responsive design (works on mobile 375px+ and desktop)
- [ ] If already logged in, redirect to dashboard
- [ ] Support return URL query parameter for redirecting after login

#### UI-1.2: Sign Up Page (`/signup`)
**Acceptance Criteria:**
- [ ] Route: `/signup`
- [ ] Centered card with "Create Account" heading
- [ ] Name input field (optional, autocomplete="name")
- [ ] Email input field (type="email", autocomplete="email")
- [ ] Password input field (type="password", autocomplete="new-password") with show/hide toggle
- [ ] Password strength indicator below field (weak/medium/strong with color coding)
- [ ] Password requirements text: "At least 8 characters with one letter and one number"
- [ ] "Create Account" button (primary styling, full width)
- [ ] "Already have an account? Sign in" link below form
- [ ] Error messages display above form in red alert box
- [ ] Form validation shows inline errors
- [ ] Loading state on button during submission ("Creating account..." with spinner)
- [ ] Responsive design
- [ ] If already logged in, redirect to dashboard

#### UI-1.3: Forgot Password Page (`/forgot-password`)
**Acceptance Criteria:**
- [ ] Route: `/forgot-password`
- [ ] Centered card with "Reset Password" heading
- [ ] Explanation text: "Enter your email address and we'll send you a link to reset your password"
- [ ] Email input field (type="email", autocomplete="email")
- [ ] "Send Reset Link" button (primary styling, full width)
- [ ] "Back to Sign In" link
- [ ] Success message after submission: "Check your email for reset instructions"
- [ ] Success message shows even if email doesn't exist (security best practice)
- [ ] Loading state on button during submission ("Sending..." with spinner)
- [ ] Responsive design
- [ ] Rate limiting feedback if too many requests

#### UI-1.4: Reset Password Page (`/reset-password?token=xxx`)
**Acceptance Criteria:**
- [ ] Route: `/reset-password` with required query parameter `token`
- [ ] Centered card with "Set New Password" heading
- [ ] New password input field with show/hide toggle (autocomplete="new-password")
- [ ] Confirm password input field with show/hide toggle (autocomplete="new-password")
- [ ] Password strength indicator
- [ ] Password requirements text
- [ ] "Reset Password" button (primary styling, full width)
- [ ] Validation: passwords must match (show inline error if mismatch)
- [ ] Error if reset token is invalid/expired: "This reset link is invalid or has expired. Please request a new one."
- [ ] Success message: "Password reset successfully. Redirecting to dashboard..."
- [ ] Auto-redirect to dashboard after 2 seconds
- [ ] Loading state on button during submission
- [ ] Responsive design
- [ ] If no token provided, show error and link to forgot password page

### UI-2: Navigation

#### UI-2.1: Authenticated Navigation
**Acceptance Criteria:**
- [ ] Navigation bar at top of all authenticated pages (fixed position)
- [ ] Logo/app name on left (links to dashboard)
- [ ] User menu on right showing user's email or name (dropdown trigger)
- [ ] User menu dropdown includes:
  - [ ] User's email (non-clickable, shows who's logged in)
  - [ ] Divider
  - [ ] "Dashboard" link (with icon)
  - [ ] "Sign Out" link (with icon, red text)
- [ ] Current page is highlighted in navigation (if applicable)
- [ ] Responsive: collapses to hamburger menu on mobile (< 768px)
- [ ] Hamburger menu slides in from right on mobile
- [ ] Click outside closes dropdown/menu
- [ ] Keyboard accessible (Tab navigation, Enter to select)
- [ ] Logo has hover effect
- [ ] Smooth transitions for dropdowns

#### UI-2.2: Public Navigation
**Acceptance Criteria:**
- [ ] Simple navigation on auth pages (login, signup, forgot password)
- [ ] Logo/app name on left
- [ ] No user menu (not logged in)
- [ ] Clean, minimal design
- [ ] Responsive

### UI-3: Prototype Dashboard

#### UI-3.1: Dashboard Layout (`/dashboard`)
**Acceptance Criteria:**
- [ ] Route: `/dashboard` (protected, requires auth)
- [ ] Page title: "My Prototypes" (H1)
- [ ] "Create New Prototype" button (prominent, top-right, primary button with + icon)
- [ ] Filter tabs below title: All, In Progress, Submitted, Merged, Archived (pill-style tabs)
- [ ] Active filter tab highlighted with primary color
- [ ] Filter counts in badges: "In Progress (3)", "All (15)", etc.
- [ ] Search box below filters (full width on mobile, 50% width on desktop, left-aligned)
- [ ] Search box has search icon and clear button (X)
- [ ] Prototype count below search: "Showing X prototypes"
- [ ] Grid of prototype cards (3 columns on desktop 1024px+, 2 columns on tablet 768px+, 1 column on mobile)
- [ ] Gap between cards: 1.5rem
- [ ] Empty state if no prototypes match filter/search:
  - [ ] Large icon (folder or prototype icon)
  - [ ] Heading: "No prototypes found" or "No prototypes yet"
  - [ ] Subtext with action: "Create your first prototype to get started"
  - [ ] Suggested prototype ideas (if first-time user):
    - "Try: 'Add a contact form to the landing page'"
    - "Try: 'Change the blog layout to a grid'"
    - "Try: 'Add a dark mode toggle'"
- [ ] Loading state while fetching prototypes (3-6 skeleton cards with shimmer effect)
- [ ] Pagination if > 20 prototypes (show 20 per page)
- [ ] Responsive padding and spacing

#### UI-3.2: Prototype Card
**Acceptance Criteria:**
- [ ] Card shows:
  - [ ] Description (truncated to 2 lines with ellipsis)
  - [ ] Status badge (top-right corner of card)
  - [ ] Created date (relative time: "Created 2 days ago")
  - [ ] Last updated date (relative time: "Updated 5 minutes ago")
  - [ ] Preview URL link (if available, with external link icon, opens in new tab)
  - [ ] "Open" button (primary action)
  - [ ] "Delete" button (secondary, destructive styling with trash icon)
- [ ] Status badge styling:
  - IN_PROGRESS: Blue background, white text
  - SUBMITTED: Yellow background, dark text
  - MERGED: Green background, white text
  - ARCHIVED: Gray background, white text
  - ERROR: Red background, white text
- [ ] Card has subtle border and shadow
- [ ] Card has hover effect (shadow increases, subtle scale transform)
- [ ] Truncated description shows tooltip with full text on hover (after 500ms delay)
- [ ] Date format uses relative time (e.g., "2 days ago", "5 minutes ago", "just now")
- [ ] If no preview URL yet, show "Deploying..." badge instead of link
- [ ] Buttons are properly aligned (Open on left, Delete on right, or stacked on mobile)
- [ ] Card has proper padding (1rem on mobile, 1.5rem on desktop)
- [ ] Responsive: cards stack nicely on all screen sizes

#### UI-3.3: Create Prototype Modal
**Acceptance Criteria:**
- [ ] Modal appears when "Create New Prototype" clicked (overlay with backdrop blur)
- [ ] Modal title: "Create New Prototype"
- [ ] Subtext: "Describe what you want to build. You can modify the landing page, example pages, and UI components."
- [ ] Textarea for description:
  - [ ] Placeholder: "Example: Add a contact form to the landing page with name, email, and message fields"
  - [ ] Min height: 120px
  - [ ] Auto-resize as user types
  - [ ] Focus on modal open
- [ ] Character count below textarea: "X / 500 characters"
  - [ ] Turns red if over 500
  - [ ] Turns orange if under 10
  - [ ] Green when valid (10-500)
- [ ] Helpful tips (collapsible section):
  - "What you can modify: Landing page, example blog pages, UI components"
  - "What you cannot modify: Dashboard, authentication pages, core system files"
- [ ] "Cancel" button (secondary styling, closes modal)
- [ ] "Create" button (primary styling, disabled if description invalid)
- [ ] Validation:
  - [ ] Description 10-500 characters
  - [ ] Show inline error if validation fails
- [ ] Loading state during creation:
  - [ ] Button shows spinner and "Creating..."
  - [ ] Progress indicator appears showing steps:
    - "Creating branch..." (with spinner)
    - "Setting up database..." (with spinner)
    - "Initializing AI assistant..." (with spinner)
    - "Deploying preview..." (with spinner)
  - [ ] Each step shows checkmark when complete
  - [ ] Modal cannot be closed during creation
- [ ] Error display if creation fails:
  - [ ] Show error message in red alert box
  - [ ] Show specific error (e.g., "Failed to create branch")
  - [ ] "Try Again" button to retry
  - [ ] "Cancel" button to close modal
- [ ] Success:
  - [ ] Modal closes automatically
  - [ ] Redirect to workspace page
- [ ] Modal accessible (Esc closes modal, Tab navigation)
- [ ] Responsive: modal width adapts to screen size

#### UI-3.4: Delete Confirmation Modal
**Acceptance Criteria:**
- [ ] Modal appears when "Delete" clicked on prototype card
- [ ] Modal title: "Delete Prototype?" (with warning icon)
- [ ] Warning text: "This will permanently delete the branch, database, and all changes. This action cannot be undone."
- [ ] Shows prototype description in italics or quoted
- [ ] Shows additional details:
  - Branch name
  - Created date
  - Number of changes/commits (if available)
- [ ] Confirmation requirement:
  - [ ] Text input with label: "Type DELETE to confirm"
  - [ ] Or: Text input with label: "Type the prototype description to confirm"
- [ ] "Cancel" button (secondary styling)
- [ ] "Delete" button:
  - [ ] Disabled until confirmation text matches exactly (case-insensitive)
  - [ ] Red/destructive styling
  - [ ] Has trash icon
- [ ] Cannot delete if status is SUBMITTED or MERGED:
  - [ ] Show error in modal: "Cannot delete submitted or merged prototypes"
  - [ ] Delete button hidden or disabled
  - [ ] Only show "Close" button
- [ ] Loading state during deletion:
  - [ ] Button shows spinner and "Deleting..."
  - [ ] Modal cannot be closed during deletion
- [ ] Success:
  - [ ] Modal closes automatically
  - [ ] Success toast notification appears: "Prototype archived successfully"
  - [ ] Dashboard refreshes to remove card
- [ ] Error display if deletion fails
- [ ] Modal accessible
- [ ] Responsive

### UI-4: Prototype Workspace

#### UI-4.1: Workspace Layout (`/prototype/[id]`)
**Acceptance Criteria:**
- [ ] Route: `/prototype/[id]` (protected, requires auth and ownership)
- [ ] Split-screen layout on desktop (≥1024px):
  - [ ] Left panel: 50% width, v0 chat
  - [ ] Right panel: 50% width, preview
  - [ ] Resizable split (drag divider to resize)
- [ ] Stacked layout on tablet/mobile (<1024px):
  - [ ] Chat panel above
  - [ ] Preview panel below
  - [ ] Tabs to switch between chat/preview views (saves screen space)
- [ ] Top bar spans full width above split panels:
  - [ ] "← Back to Dashboard" link (left)
  - [ ] Prototype description (center, truncated with tooltip)
  - [ ] Deployment status indicator (green "Live" badge or yellow "Deploying..." spinner)
  - [ ] Preview URL link (opens in new tab, with external link icon)
  - [ ] "Submit for Review" button (right, primary styling)
- [ ] Top bar has subtle border-bottom and padding
- [ ] "Submit for Review" button only enabled when:
  - [ ] Deployment is live (not deploying or failed)
  - [ ] Status is IN_PROGRESS
- [ ] If status is SUBMITTED, button replaced with "Submitted" badge (with link to PR)
- [ ] Full viewport height (minus top bar), no scrolling on outer container
- [ ] Loading state while workspace initializes (full-page spinner)
- [ ] Error state if prototype not found or access denied (403)
- [ ] Responsive: layout adapts smoothly to all screen sizes

#### UI-4.2: v0 Chat Panel
**Acceptance Criteria:**
- [ ] Embeds v0 chat interface via iframe
- [ ] Iframe src: `https://v0.dev/chat/{v0ProjectId}` (or equivalent v0 embed URL)
- [ ] Iframe fills left panel completely (100% width and height)
- [ ] Iframe has `allow` attributes for necessary permissions
- [ ] Loading state while v0 interface loads (centered spinner with "Loading AI assistant...")
- [ ] Error message if v0 iframe fails to load:
  - [ ] Shows error icon and message
  - [ ] "Try reloading" button
  - [ ] Link to open v0 project in new tab
- [ ] Iframe has proper border and styling
- [ ] No scrollbars on outer container (v0 handles scrolling internally)

#### UI-4.3: Preview Panel
**Acceptance Criteria:**
- [ ] Shows iframe of Vercel preview URL when available
- [ ] Iframe fills right panel completely (100% width and height)
- [ ] Iframe has sandbox attributes for security (but allows scripts, forms, etc.)
- [ ] Loading state while deployment is in progress:
  - [ ] Centered spinner
  - [ ] "Deploying..." text
  - [ ] Estimated wait time: "Usually takes 1-2 minutes"
  - [ ] Progress bar or animated dots
- [ ] Polls for deployment status every 10 seconds:
  - [ ] Checks Vercel API for deployment completion
  - [ ] Updates preview URL in database when ready
  - [ ] Auto-refreshes iframe when new deployment detected
- [ ] Manual refresh button in preview panel header:
  - [ ] Icon button (refresh/reload icon)
  - [ ] Tooltip: "Refresh preview"
  - [ ] Reloads iframe content
- [ ] Error message if deployment fails:
  - [ ] Shows error icon and message: "Deployment failed"
  - [ ] Link to Vercel deployment logs: "View logs in Vercel"
  - [ ] "Try again" button (triggers new deployment or manual refresh)
- [ ] Preview URL displayed in header (small text, truncated, with copy button)
- [ ] Open in new tab button (external link icon)
- [ ] Mobile responsive: preview scales appropriately (or shows device frame)

#### UI-4.4: Submit for Review Modal
**Acceptance Criteria:**
- [ ] Modal appears when "Submit for Review" clicked
- [ ] Modal title: "Submit Prototype for Review" (with PR icon)
- [ ] Shows prototype details:
  - [ ] Description (full text, not truncated)
  - [ ] Preview URL (clickable link, opens in new tab)
  - [ ] Number of changes/commits (if available)
  - [ ] List of modified files (collapsible section, shows file paths)
- [ ] Explanation: "This will create a Pull Request in GitHub. Once submitted, you won't be able to make further changes to this prototype."
- [ ] Confirmation checkbox: "I confirm this prototype is ready for review"
- [ ] "Cancel" button (secondary styling)
- [ ] "Submit PR" button (primary styling, disabled until checkbox checked)
- [ ] Loading state during submission:
  - [ ] Button shows spinner and "Creating Pull Request..."
  - [ ] Modal cannot be closed
- [ ] Success state:
  - [ ] Shows success icon and message: "Pull Request created successfully!"
  - [ ] Displays PR URL with "View Pull Request" button (primary styling, opens in new tab)
  - [ ] Displays PR number: "PR #123"
  - [ ] Auto-redirect to read-only workspace after 3 seconds (with countdown)
  - [ ] Or "Stay here" button to close modal without redirect
- [ ] Error display if PR creation fails:
  - [ ] Shows error message
  - [ ] "Try Again" button
  - [ ] "Cancel" button
- [ ] Modal accessible
- [ ] Responsive

#### UI-4.5: Read-Only Workspace (After Submission)
**Acceptance Criteria:**
- [ ] Left panel (chat area) shows informational message instead of v0 iframe:
  - [ ] Icon: locked or submitted icon
  - [ ] Heading: "This prototype has been submitted for review"
  - [ ] Message: "No further changes can be made. The code has been submitted as a Pull Request."
  - [ ] Link to GitHub PR: "View Pull Request #123" (primary button, opens in new tab)
  - [ ] PR status badge (if available): "Open", "Merged", "Closed"
  - [ ] Option to view v0 project history (link to v0 project)
- [ ] Right panel still shows preview iframe (read-only view of deployed prototype)
- [ ] Top bar changes:
  - [ ] "Submit for Review" button replaced with "Submitted" badge
  - [ ] Badge links to GitHub PR
  - [ ] Status shows "Submitted" or "Merged" if PR merged
- [ ] Preview remains functional (user can interact with deployed prototype)
- [ ] "Back to Dashboard" link still works
- [ ] Clear visual indication that workspace is read-only (grayed out chat panel, badge, etc.)

### UI-5: Landing Page

#### UI-5.1: Public Landing Page (`/`)
**Acceptance Criteria:**
- [ ] Route: `/` (public, no auth required)
- [ ] Hero section:
  - [ ] Compelling headline: "Build Prototypes with AI"
  - [ ] Subheading: "Describe your idea, iterate with AI, submit for review"
  - [ ] Primary CTA: "Get Started" (links to /signup)
  - [ ] Secondary CTA: "Sign In" (links to /login)
  - [ ] Hero image or animation (optional but nice to have)
- [ ] Features section (3-4 key features):
  - [ ] "Natural Language Prototyping" - Describe changes in plain English
  - [ ] "Instant Previews" - See your changes live in seconds
  - [ ] "Isolated Environments" - Each prototype has its own database and deployment
  - [ ] "Easy Reviews" - Submit as Pull Requests for team review
  - [ ] Each feature has icon and short description
- [ ] How It Works section (step-by-step):
  - [ ] Step 1: Sign up and create prototype
  - [ ] Step 2: Chat with AI to build your idea
  - [ ] Step 3: Preview changes in real-time
  - [ ] Step 4: Submit for review
  - [ ] Visual diagram or numbered steps
- [ ] CTA section:
  - [ ] Heading: "Ready to start prototyping?"
  - [ ] "Create Free Account" button
- [ ] Footer:
  - [ ] Link to documentation (if available)
  - [ ] Link to GitHub repo (if public)
  - [ ] Copyright notice
- [ ] Navigation:
  - [ ] Logo (links to /)
  - [ ] "Sign In" and "Sign Up" buttons in top-right
- [ ] Responsive design
- [ ] Fast loading (optimize images, minimal JavaScript)
- [ ] Accessible (proper headings, alt text, keyboard nav)
- [ ] **This landing page is modifiable by prototypes** - users can test changes to it

### UI-6: Example Content Pages

#### UI-6.1: Example Blog List Page (`/examples/blog`)
**Acceptance Criteria:**
- [ ] Route: `/examples/blog` (public)
- [ ] Page title: "Blog" (H1)
- [ ] Grid of blog post cards (2-3 columns on desktop, 1 on mobile)
- [ ] Each card shows:
  - [ ] Featured image (placeholder or sample)
  - [ ] Title
  - [ ] Excerpt (first 100 chars)
  - [ ] Published date
  - [ ] "Read More" link (goes to /examples/blog/[slug])
- [ ] Sample data: 5-10 blog posts with lorem ipsum content
- [ ] Pagination if > 10 posts
- [ ] Responsive design
- [ ] **This page is modifiable by prototypes**

#### UI-6.2: Example Blog Detail Page (`/examples/blog/[slug]`)
**Acceptance Criteria:**
- [ ] Route: `/examples/blog/[slug]` (public)
- [ ] Shows single blog post:
  - [ ] Featured image (full width or centered)
  - [ ] Title (H1)
  - [ ] Published date and author
  - [ ] Full content (formatted with headings, paragraphs, lists)
  - [ ] Back to blog link
- [ ] Sample markdown content with formatting examples
- [ ] Responsive design
- [ ] **This page is modifiable by prototypes**

#### UI-6.3: Example Contact Page (`/examples/contact`)
**Acceptance Criteria:**
- [ ] Route: `/examples/contact` (public)
- [ ] Page title: "Contact Us" (H1)
- [ ] Contact form:
  - [ ] Name field (required)
  - [ ] Email field (required, validated)
  - [ ] Message field (textarea, required)
  - [ ] "Send Message" button
- [ ] Form validation (inline errors)
- [ ] Form submission (can be mock - just shows success message)
- [ ] Success message: "Thank you! We'll get back to you soon."
- [ ] Responsive design
- [ ] **This page is modifiable by prototypes**

### UI-7: Loading and Error States

#### UI-7.1: Loading States
**Acceptance Criteria:**
- [ ] Skeleton loaders for dashboard prototype cards (shimmer animation)
- [ ] Full-page spinner for page-level loading (navigation between pages)
- [ ] Inline spinners for button actions (create, delete, submit) with loading text
- [ ] Progress indicators for multi-step operations (prototype creation shows steps)
- [ ] All loading states have appropriate ARIA labels for accessibility
- [ ] Consistent loading spinner design across app

#### UI-7.2: Error States
**Acceptance Criteria:**
- [ ] Toast notifications for action errors:
  - [ ] Position: top-right
  - [ ] Auto-dismiss after 5 seconds (with countdown bar)
  - [ ] Manual dismiss button (X icon)
  - [ ] Color-coded: red for errors, yellow for warnings, green for success
  - [ ] Icon + message format
- [ ] Inline error messages below form inputs (red text with error icon)
- [ ] Alert boxes for important errors (e.g., in modals)
- [ ] Full-page error state for critical failures (500 errors):
  - [ ] Error icon
  - [ ] Heading: "Something went wrong"
  - [ ] Message: "An unexpected error occurred. Please try again."
  - [ ] "Go to Dashboard" button
  - [ ] "Reload Page" button
- [ ] 404 page for non-existent routes:
  - [ ] 404 icon
  - [ ] Heading: "Page not found"
  - [ ] Message: "The page you're looking for doesn't exist."
  - [ ] "Go to Dashboard" button
- [ ] Error boundary catches React errors and shows friendly message
- [ ] All errors include actionable guidance ("Try again" button, "Contact support" link where appropriate)
- [ ] Errors logged to console (for debugging) but not exposed to user

#### UI-7.3: Empty States
**Acceptance Criteria:**
- [ ] Dashboard empty state (no prototypes)
- [ ] Search/filter empty state (no results)
- [ ] Each empty state includes:
  - [ ] Relevant icon (large, centered)
  - [ ] Heading
  - [ ] Helpful message
  - [ ] Call-to-action (button or link)
- [ ] Friendly, encouraging tone
- [ ] Consistent design across all empty states

### UI-8: Responsive Design
**Acceptance Criteria:**
- [ ] All pages work on mobile (375px width minimum)
- [ ] All pages work on tablet (768px width)
- [ ] All pages work on desktop (1024px+ width)
- [ ] Touch targets are minimum 44x44px on mobile (buttons, links, form inputs)
- [ ] Text is readable without zooming on mobile (minimum 16px font size for body text)
- [ ] No horizontal scrolling required on any screen size
- [ ] Images and iframes scale appropriately (responsive, maintain aspect ratio)
- [ ] Navigation adapts (hamburger menu on mobile)
- [ ] Forms stack vertically on mobile
- [ ] Modals resize for mobile (may be full-screen on small devices)
- [ ] Workspace layout adapts (split-screen on desktop, tabs or stack on mobile)
- [ ] Adequate spacing and padding on all screen sizes
- [ ] Tested on iOS Safari, Android Chrome, desktop Chrome/Firefox/Safari

### UI-9: Accessibility
**Acceptance Criteria:**
- [ ] All interactive elements keyboard accessible (Tab navigation, Enter to activate)
- [ ] Focus indicators visible (outline or highlight on focused elements)
- [ ] Proper heading hierarchy (H1 → H2 → H3, no skipping levels)
- [ ] Alt text for all images
- [ ] ARIA labels for icon buttons and dynamic content
- [ ] Form labels associated with inputs (implicit or explicit)
- [ ] Error messages announced to screen readers
- [ ] Loading states announced to screen readers
- [ ] Color contrast meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- [ ] No reliance on color alone to convey information (use icons + color)
- [ ] Skip to main content link (for keyboard users)
- [ ] Modals trap focus (Tab loops within modal)
- [ ] Modals can be closed with Esc key

---

## Performance Requirements

### P-1: Page Load Times
**Acceptance Criteria:**
- [ ] Landing page (/) loads in < 1 second (first contentful paint)
- [ ] Dashboard page (/dashboard) loads in < 2 seconds with 50 prototypes
- [ ] Workspace page (/prototype/[id]) loads in < 3 seconds
- [ ] Authentication pages load in < 1 second
- [ ] Time to interactive (TTI) < 3 seconds for all pages
- [ ] Uses Next.js optimizations: server-side rendering, static generation where possible, image optimization

### P-2: Prototype Creation Time
**Acceptance Criteria:**
- [ ] Total time from clicking "Create" to displaying workspace: < 60 seconds
- [ ] Breakdown target:
  - GitHub branch creation: < 5 seconds
  - Neon branch creation: < 5 seconds
  - v0 project creation: < 20 seconds
  - Vercel env var setup: < 5 seconds
  - Initial migration: < 10 seconds
  - First deployment: < 30 seconds (Vercel's responsibility)
  - Buffer: < 15 seconds
- [ ] User sees progress indicator with current step (good perceived performance)

### P-3: Database Query Performance
**Acceptance Criteria:**
- [ ] Dashboard prototype list query: < 500ms with 100 prototypes per user
- [ ] Prototype ownership check: < 100ms
- [ ] User lookup by email (login): < 200ms
- [ ] All queries use proper indexes (verified with EXPLAIN ANALYZE)
- [ ] Database connection pooling configured (min 5, max 20 connections)
- [ ] Slow query logging enabled (queries > 1 second logged)

### P-4: Concurrent User Support
**Acceptance Criteria:**
- [ ] System supports 10 concurrent users creating prototypes simultaneously
- [ ] No degradation in response time with 10 concurrent users (< 10% increase in p95 latency)
- [ ] Database connection pool sized appropriately (minimum 10 connections for 10 concurrent users)
- [ ] No race conditions or conflicts in branch/database creation
- [ ] API rate limits don't cause failures under normal load

### P-5: Code Sync Latency
**Acceptance Criteria:**
- [ ] Time from v0 code change to GitHub commit: < 10 seconds
- [ ] Time from GitHub commit to Vercel deployment start: < 30 seconds (Vercel's responsibility)
- [ ] Total time from v0 change to live preview: < 2 minutes on average

### P-6: Asset Optimization
**Acceptance Criteria:**
- [ ] Images optimized (Next.js Image component, WebP format, lazy loading)
- [ ] JavaScript bundle size < 500KB (initial load)
- [ ] CSS optimized (purged unused styles, minified)
- [ ] Fonts optimized (variable fonts, subsetting, proper loading strategy)
- [ ] No render-blocking resources (critical CSS inlined, async/defer scripts)

---

## Security Requirements

### S-1: Authentication Security
**Acceptance Criteria:**
- [ ] Passwords hashed with bcrypt (cost factor 12 minimum)
- [ ] No passwords stored in plain text anywhere (logs, database, error messages, etc.)
- [ ] Session tokens are cryptographically secure random values (minimum 32 bytes)
- [ ] Session tokens stored securely (HTTP-only cookies or encrypted database storage)
- [ ] CSRF protection enabled on all mutating requests (POST, PUT, DELETE)
- [ ] Rate limiting on login endpoint (max 5 attempts per minute per IP)
- [ ] Account lockout after 10 failed login attempts in 1 hour
- [ ] Lockout duration: 1 hour (or until admin unlocks)
- [ ] Password reset tokens are cryptographically random (minimum 32 bytes)
- [ ] Password reset tokens expire after 1 hour
- [ ] Password reset tokens single-use only (marked as used after redemption)
- [ ] Password reset tokens stored hashed in database (not plain text)
- [ ] No timing attacks (consistent response time for valid/invalid emails)

### S-2: Authorization Security
**Acceptance Criteria:**
- [ ] All prototype queries filtered by `createdById = currentUser.id`
- [ ] All prototype mutations verify ownership before executing (database-level check)
- [ ] API routes return 403 Forbidden if user attempts to access others' prototypes
- [ ] Prototype workspace checks ownership before rendering (server-side check)
- [ ] No way to enumerate or discover other users' prototypes (no list all endpoint)
- [ ] Session validation on every authenticated request (middleware)
- [ ] No sensitive data (passwords, tokens, connection strings) exposed in API responses
- [ ] API responses don't leak information about existence of other users' data

### S-3: Input Validation
**Acceptance Criteria:**
- [ ] All user inputs validated server-side (never trust client validation alone)
- [ ] Email format validated against RFC 5322 (using trusted library)
- [ ] Description length enforced server-side (10-500 characters)
- [ ] SQL injection prevention via Prisma parameterized queries (never string concatenation)
- [ ] XSS prevention via React's automatic escaping (plus CSP headers)
- [ ] No eval() or similar dynamic code execution on user input
- [ ] File path validation (no directory traversal via ../)
- [ ] Webhook payload validation (signature/token verification)
- [ ] Query parameter validation (type checking, sanitization)

### S-4: Protected Path Security
**Acceptance Criteria:**
- [ ] Whitelist of modifiable paths enforced when sending code to v0
- [ ] Blacklist of protected paths enforced when receiving changes from v0
- [ ] Webhook handler validates every file path before committing
- [ ] Attempted modifications of protected paths logged as security events
- [ ] Security logs include: timestamp, user ID, prototype ID, attempted path, IP address
- [ ] No way to bypass protected path enforcement (server-side validation only)
- [ ] Regular review of protected paths (add new critical files as app grows)

### S-5: API Key Security
**Acceptance Criteria:**
- [ ] All API keys stored in environment variables (never in code)
- [ ] `.env.local` in `.gitignore` (verified)
- [ ] No API keys exposed in client-side JavaScript (all API calls from server)
- [ ] No API keys in error messages or logs (redacted in logs)
- [ ] API keys rotated if accidentally exposed (process documented)
- [ ] Different API keys for different environments (dev, staging, production)
- [ ] API keys have minimal necessary permissions (principle of least privilege)

### S-6: Data Privacy
**Acceptance Criteria:**
- [ ] User cannot see other users' data (prototypes, emails, names, etc.)
- [ ] Error messages don't leak information about other users
- [ ] "User not found" vs. "Invalid credentials" - use same message to prevent enumeration
- [ ] Logs don't contain PII (passwords, full emails - only user IDs)
- [ ] Database backups encrypted at rest (handled by Neon)
- [ ] Database connections encrypted in transit (SSL/TLS required)
- [ ] No user data in URLs (query parameters) - use POST body or cookies
- [ ] Session data not exposed in client-side storage (localStorage/sessionStorage)

### S-7: Dependency Security
**Acceptance Criteria:**
- [ ] All npm dependencies up-to-date (or at least security patches applied)
- [ ] Run `npm audit` regularly and fix high/critical vulnerabilities
- [ ] Use Dependabot or similar tool for automated security updates
- [ ] Pin major versions in package.json (avoid wildcards like `^` or `*`)
- [ ] Review new dependencies before adding (check npm downloads, GitHub stars, maintainer reputation)

### S-8: Content Security Policy
**Acceptance Criteria:**
- [ ] CSP headers configured in Next.js (next.config.js)
- [ ] Allow scripts only from same origin and trusted CDNs
- [ ] Allow styles only from same origin
- [ ] Allow iframes from v0.dev and Vercel preview domains
- [ ] No inline scripts (or use nonce/hash if necessary)
- [ ] report-uri configured to log CSP violations

---

## Testing Requirements

### T-1: Authentication Flow Tests

#### T-1.1: Sign Up Flow
**Test Steps:**
1. Navigate to `/signup`
2. Enter name: "Test User", email: `test-${Date.now()}@example.com`, password: "SecurePass123"
3. Click "Create Account"
4. Verify redirect to `/dashboard`
5. Verify user record created in database (check users table)
6. Verify password is hashed in database (bcrypt hash format)
7. Sign out
8. Sign in with same credentials
9. Verify successful login

**Expected Results:**
- [ ] User created successfully
- [ ] Password is bcrypt hashed (not plain text)
- [ ] Session created
- [ ] User can sign in with credentials
- [ ] Dashboard shows empty state

#### T-1.2: Sign In Flow
**Test Steps:**
1. Sign up with `test@example.com` / "SecurePass123"
2. Sign out
3. Navigate to `/login`
4. Enter email: `test@example.com`, password: "SecurePass123"
5. Click "Sign In"
6. Verify redirect to `/dashboard`
7. Verify dashboard shows "No prototypes yet"
8. Verify user menu shows correct email

**Expected Results:**
- [ ] Successful login
- [ ] Session created
- [ ] Dashboard accessible
- [ ] User menu shows logged-in user

#### T-1.3: Invalid Credentials
**Test Steps:**
1. Navigate to `/login`
2. Enter email: `test@example.com`, password: "WrongPassword"
3. Click "Sign In"
4. Verify error message: "Invalid email or password"
5. Verify user not logged in (still on login page)
6. Try with invalid email: "notfound@example.com", password: "AnyPassword"
7. Verify same error message (no enumeration)

**Expected Results:**
- [ ] Error message: "Invalid email or password"
- [ ] User not logged in
- [ ] No session created
- [ ] Same error for non-existent email (no enumeration)

#### T-1.4: Password Reset Flow
**Test Steps:**
1. Sign up with `test@example.com` / "OldPassword123"
2. Sign out
3. Navigate to `/login`, click "Forgot password?"
4. Enter email: `test@example.com`
5. Click "Send Reset Link"
6. Verify success message (even if email doesn't exist)
7. Check email inbox for reset link
8. Click reset link (opens `/reset-password?token=xxx`)
9. Enter new password: "NewSecurePass456"
10. Confirm new password: "NewSecurePass456"
11. Click "Reset Password"
12. Verify redirect to `/dashboard`
13. Sign out and sign in with new password
14. Verify successful login
15. Try signing in with old password
16. Verify login fails

**Expected Results:**
- [ ] Reset email received
- [ ] Reset link valid for 1 hour
- [ ] Password updated successfully
- [ ] Old password no longer works
- [ ] New password works
- [ ] User logged in after reset

#### T-1.5: Rate Limiting
**Test Steps:**
1. Attempt to sign in with wrong password 6 times rapidly
2. Verify rate limit error after 5th attempt
3. Wait 1 minute
4. Attempt to sign in with correct password
5. Verify successful login

**Expected Results:**
- [ ] Rate limit kicks in after 5 failed attempts
- [ ] Error message: "Too many requests. Please wait and try again."
- [ ] Rate limit resets after 1 minute
- [ ] Successful login after rate limit expires

### T-2: Multi-User Isolation Tests

#### T-2.1: Prototype Ownership
**Test Steps:**
1. Sign up as `user1@example.com`
2. Create prototype A: "Add contact form"
3. Note the prototype ID from URL (`/prototype/abc123`)
4. Sign out
5. Sign up as `user2@example.com`
6. Attempt to navigate directly to `/prototype/abc123` (User 1's prototype)
7. Verify 403 Forbidden or redirect to dashboard
8. Verify User 2's dashboard shows 0 prototypes

**Expected Results:**
- [ ] User 2 cannot access User 1's prototype
- [ ] User 2's dashboard shows 0 prototypes
- [ ] Error message: "You don't have permission to access this prototype"
- [ ] No information leaked about User 1's prototype

#### T-2.2: Dashboard Isolation
**Test Steps:**
1. Sign up as `user1@example.com`
2. Create prototypes: "Add contact form", "Add blog", "Update homepage"
3. Note the prototype IDs
4. Sign out
5. Sign up as `user2@example.com`
6. Create prototype: "Add dark mode"
7. Check dashboard
8. Verify only "Add dark mode" prototype visible
9. Verify count shows "1 prototype"
10. Use browser dev tools to inspect API responses
11. Verify no data about User 1's prototypes in responses

**Expected Results:**
- [ ] User 2's dashboard shows only their prototype
- [ ] User 2 cannot see User 1's prototypes (3 prototypes)
- [ ] API responses don't leak other users' data

#### T-2.3: API Authorization
**Test Steps:**
1. Sign up as `user1@example.com`
2. Create prototype A, note ID: `abc123`
3. Sign out
4. Sign up as `user2@example.com`
5. Use browser dev tools to send DELETE request to `/api/prototype/abc123`
6. Verify 403 Forbidden response
7. Verify prototype A still exists (User 1 can still access it)

**Expected Results:**
- [ ] DELETE request returns 403 Forbidden
- [ ] Error message: "You don't have permission to delete this prototype"
- [ ] Prototype not deleted (ownership check prevents deletion)

### T-3: Multiple Prototypes Tests

#### T-3.1: Create Multiple Prototypes
**Test Steps:**
1. Sign up and login
2. Create prototype A: "Add contact form"
3. Wait for workspace to load
4. Navigate back to dashboard
5. Create prototype B: "Add blog feature"
6. Wait for workspace to load
7. Navigate back to dashboard
8. Create prototype C: "Update homepage design"
9. Navigate back to dashboard
10. Verify all 3 prototypes shown in dashboard
11. Verify each has unique branch name (check database)
12. Verify each has unique Neon database branch
13. Verify each has unique preview URL

**Expected Results:**
- [ ] All 3 prototypes created successfully
- [ ] Each has unique branch name: `prototype-{userId}-{timestamp1/2/3}`
- [ ] Each has separate database branch
- [ ] Each shows in dashboard with correct status (IN_PROGRESS)
- [ ] No branch name conflicts

#### T-3.2: Filter Prototypes
**Test Steps:**
1. Create 5 prototypes (all IN_PROGRESS)
2. Submit 2 prototypes for review (status → SUBMITTED)
3. Navigate to dashboard
4. Click "In Progress" filter
5. Verify 3 prototypes shown
6. Verify count badge: "In Progress (3)"
7. Click "Submitted" filter
8. Verify 2 prototypes shown
9. Verify count badge: "Submitted (2)"
10. Click "All" filter
11. Verify 5 prototypes shown
12. Verify count badge: "All (5)"

**Expected Results:**
- [ ] Filters work correctly
- [ ] Counts accurate in filter badges
- [ ] Filter persists when navigating away and back

#### T-3.3: Search Prototypes
**Test Steps:**
1. Create prototypes with descriptions:
   - "Add contact form to landing page"
   - "Add blog feature with markdown support"
   - "Update homepage hero section design"
2. Navigate to dashboard
3. Type "contact" in search box
4. Verify 1 result shown
5. Clear search
6. Type "add" in search box
7. Verify 2 results shown (contact form and blog feature)
8. Type "design" in search box
9. Verify 1 result (homepage)
10. Type "xyz" in search box
11. Verify 0 results, see "No prototypes found" message

**Expected Results:**
- [ ] Search is case-insensitive
- [ ] Partial matches work
- [ ] Results update as user types (debounced)
- [ ] Empty state shown when no results
- [ ] Clear button resets search

### T-4: End-to-End Prototype Creation and Modification

#### T-4.1: Complete Prototype Flow (Frontend Changes)
**Test Steps:**
1. Sign up and login as `newuser@example.com`
2. Click "Create New Prototype"
3. Enter description: "Add a testimonials section to the landing page with 3 customer quotes"
4. Click "Create"
5. Verify progress indicator shows steps
6. Wait for redirect to workspace (within 60 seconds)
7. Verify left panel shows v0 chat interface
8. Verify right panel shows loading state → preview URL within 2 minutes
9. In v0 chat, request: "Make the testimonial cards have a blue border"
10. Wait for v0 to generate code
11. Wait for preview to update (within 2 minutes)
12. Verify preview shows blue border on testimonial cards
13. Click "Submit for Review"
14. Confirm submission
15. Verify PR created in GitHub (check GitHub repo)
16. Verify PR includes:
    - Correct title: "Prototype by newuser: Add a testimonials section..."
    - Preview URL in PR body
    - Link to v0 project in PR body
    - Created by email in PR body
17. Navigate back to dashboard
18. Verify prototype status is "SUBMITTED"
19. Verify "Submitted" badge on prototype card

**Expected Results:**
- [ ] All steps complete without errors
- [ ] GitHub branch created: `prototype-{userId}-{timestamp}`
- [ ] Neon database branch created with same name
- [ ] Vercel preview deployed successfully
- [ ] v0 changes committed to branch
- [ ] Changes visible in preview
- [ ] PR created with correct metadata
- [ ] Prototype status updated to SUBMITTED

#### T-4.2: Schema Change Flow (Database Changes)
**Test Steps:**
1. Create prototype: "Add a blog post feature to examples"
2. Wait for workspace to load
3. In v0 chat, request: "Create a database model for blog posts with fields: title (string), content (text), slug (string, unique), publishedAt (datetime, nullable)"
4. Wait for v0 to generate Prisma schema changes
5. Verify migration runs (check workspace for deployment status)
6. Wait for preview deployment (within 3 minutes after schema change)
7. In v0 chat, request: "Create an API route at /api/blog/posts to list all blog posts"
8. Wait for v0 to generate API route
9. Wait for preview deployment
10. Open preview in new tab
11. Navigate to `/api/blog/posts` in preview
12. Verify API returns empty array (no posts yet) or sample data
13. Check GitHub branch for files:
    - Modified Prisma schema
    - Migration files in `prisma/migrations/`
    - API route file
14. Submit prototype for review
15. Verify PR includes all changes

**Expected Results:**
- [ ] Prisma schema updated in Git branch
- [ ] Migration files created and committed
- [ ] Preview database has new table structure (can verify by checking Neon dashboard)
- [ ] API route works in preview deployment
- [ ] All changes committed and included in PR

#### T-4.3: Protected Path Enforcement
**Test Steps:**
1. Create prototype: "Modify dashboard to show statistics"
2. Wait for workspace to load
3. In v0 chat, request: "Modify the dashboard page to show prototype statistics"
4. Wait for v0 response
5. Verify v0 attempts to modify `/app/dashboard/page.tsx` (protected path)
6. Verify system rejects the change
7. Verify error message in workspace: "Cannot modify /app/dashboard/page.tsx: This is a protected system file"
8. Verify no commit made to GitHub
9. Verify preview doesn't change
10. In v0 chat, request: "Modify the landing page to show a statistics section instead"
11. Verify v0 modifies `/app/page.tsx` (modifiable path)
12. Verify change committed and deployed
13. Verify preview shows updated landing page

**Expected Results:**
- [ ] Protected path modification rejected
- [ ] Error message shown to user
- [ ] Security event logged (check logs)
- [ ] No changes committed for protected path
- [ ] Modifiable path changes work correctly
- [ ] User redirected to modify allowed paths

### T-5: Concurrent User Tests

#### T-5.1: Simultaneous Prototype Creation
**Test Steps:**
1. Open 3 browser windows (or use 3 different machines/browsers)
2. In window 1: Sign up as `user1@example.com`
3. In window 2: Sign up as `user2@example.com`
4. In window 3: Sign up as `user3@example.com`
5. Simultaneously (within 5 seconds), click "Create New Prototype" in all 3 windows
6. Enter descriptions and create prototypes
7. Wait for all prototypes to complete creation
8. Verify each prototype has unique branch name
9. Verify each prototype has unique database branch
10. Verify no errors in any window
11. Check database for conflicts (all prototypes should exist)
12. Check GitHub for branches (3 branches should exist)
13. Check Neon for database branches (3 branches should exist)

**Expected Results:**
- [ ] All 3 prototypes created successfully
- [ ] No branch name conflicts (each includes unique timestamp)
- [ ] No database conflicts
- [ ] Each user sees only their own prototype in dashboard
- [ ] System handles concurrent load without errors

#### T-5.2: Concurrent Prototype Workspace Access
**Test Steps:**
1. Create 3 users, each with 2 prototypes (6 total prototypes)
2. Open 6 browser tabs
3. Simultaneously load workspace for all 6 prototypes
4. Verify all workspaces load successfully
5. Verify each shows correct v0 chat interface
6. Verify each shows correct preview URL
7. Make changes in multiple workspaces simultaneously (use v0 chat)
8. Verify all changes commit and deploy successfully
9. Verify no cross-contamination (User 1's changes don't affect User 2's preview)

**Expected Results:**
- [ ] All workspaces load successfully
- [ ] No performance degradation with 6 concurrent workspaces
- [ ] Each workspace isolated (no cross-talk)
- [ ] All changes commit and deploy correctly

### T-6: Error Handling Tests

#### T-6.1: GitHub API Failure
**Test Steps:**
1. Temporarily invalidate GitHub token (change one character in .env.local)
2. Restart server
3. Attempt to create prototype
4. Verify creation fails with error: "Failed to create branch"
5. Verify no partial artifacts created (no database record, no Neon branch)
6. Restore valid GitHub token
7. Retry creating prototype
8. Verify success

**Expected Results:**
- [ ] Clear error message shown to user
- [ ] No orphaned resources
- [ ] User can retry after fixing issue

#### T-6.2: Neon API Failure
**Test Steps:**
1. Temporarily invalidate Neon API key
2. Attempt to create prototype
3. Verify creation fails with error: "Failed to provision database"
4. Verify no partial artifacts (GitHub branch may exist, but prototype record not created)
5. Restore valid Neon API key
6. Retry
7. Verify success

**Expected Results:**
- [ ] Clear error message
- [ ] Partial cleanup (ideally delete GitHub branch if Neon fails)
- [ ] User can retry

#### T-6.3: Vercel Deployment Failure
**Test Steps:**
1. Create prototype with valid branch and database
2. Introduce syntax error in code (e.g., invalid TypeScript)
3. Commit to branch
4. Wait for Vercel deployment
5. Verify deployment fails
6. Verify workspace shows error: "Deployment failed"
7. Verify link to Vercel logs provided
8. Fix syntax error via v0 chat
9. Verify re-deployment succeeds

**Expected Results:**
- [ ] Deployment failure detected
- [ ] Error shown in workspace
- [ ] Link to logs provided
- [ ] User can fix and retry

### T-7: Performance Tests

#### T-7.1: Dashboard with Many Prototypes
**Test Steps:**
1. Create 50 prototypes for single user (use script or UI)
2. Navigate to dashboard
3. Measure page load time (should be < 2 seconds)
4. Test filtering (should be instant)
5. Test searching (should update within 300ms)
6. Scroll through prototype list (should be smooth)

**Expected Results:**
- [ ] Dashboard loads in < 2 seconds
- [ ] Filtering is instant
- [ ] Search updates quickly
- [ ] No performance issues with 50+ prototypes

#### T-7.2: Concurrent Load Test
**Test Steps:**
1. Use load testing tool (k6, Artillery, or similar)
2. Simulate 10 concurrent users creating prototypes
3. Measure success rate (should be 100%)
4. Measure average response time (should be < 60 seconds for prototype creation)
5. Check for errors in logs
6. Verify all prototypes created successfully

**Expected Results:**
- [ ] 100% success rate
- [ ] Average prototype creation time < 60 seconds
- [ ] No errors in logs
- [ ] All prototypes exist in database and GitHub

---

## Documentation Requirements

### DOC-1: README
**Location:** `/README.md` in repository root

**Must include:**
1. **Project Overview**
   - [ ] What this PoC is and its purpose
   - [ ] Key features bullet list
   - [ ] Architecture decision: self-modifying application (explain why)

2. **Architecture Diagram**
   - [ ] Visual diagram showing:
     - Next.js app (self-modifying)
     - GitHub (this repo)
     - Neon (database branching)
     - Vercel (deployments)
     - v0 Platform API
   - [ ] Data flow arrows
   - [ ] Protected vs. modifiable paths highlighted

3. **Prerequisites**
   - [ ] Node.js version (18.17.0 or higher)
   - [ ] npm or yarn
   - [ ] Git
   - [ ] Accounts required:
     - GitHub account (for repository and API access)
     - Neon account (for database)
     - Vercel account (for deployments)
     - v0 account (for AI-powered code generation)
     - Email service account (Resend, SendGrid, or SMTP)

4. **Setup Instructions** (step-by-step)
   - [ ] Clone repository
   - [ ] Install dependencies: `npm install`
   - [ ] Copy `.env.example` to `.env.local`
   - [ ] Obtain API keys (with links to each provider):
     - GitHub: Settings → Developer settings → Personal access tokens
     - Neon: Dashboard → API Keys
     - Vercel: Account Settings → Tokens
     - v0: [Link to v0 Platform API docs]
     - Email: [Provider-specific instructions]
   - [ ] Fill in `.env.local` with all keys
   - [ ] Set up database: `npx prisma migrate dev`
   - [ ] Seed database (optional): `npm run seed`
   - [ ] Run development server: `npm run dev`
   - [ ] Open http://localhost:3000

5. **How to Test the PoC**
   - [ ] Sign up for an account
   - [ ] Create your first prototype
   - [ ] Suggested first prototype: "Add a testimonials section to the landing page"
   - [ ] Iterate with v0 in the workspace
   - [ ] Submit for review (creates PR)
   - [ ] View PR in GitHub

6. **Protected vs. Modifiable Paths**
   - [ ] Table showing:
     - Protected paths (cannot modify)
     - Modifiable paths (safe to experiment)
   - [ ] Explanation of why certain paths are protected

7. **Known Limitations**
   - [ ] This is a PoC, not production-ready
   - [ ] Limited error recovery
   - [ ] No automated cleanup of old prototypes
   - [ ] Rate limits from API providers may apply
   - [ ] Cost considerations (Neon branches, Vercel deployments, v0 API calls)

8. **Security Considerations**
   - [ ] Keep API keys secret
   - [ ] Don't commit `.env.local` to Git
   - [ ] Rotate keys if accidentally exposed
   - [ ] Protected path enforcement prevents breaking the app

9. **Next Steps for Production**
   - [ ] Add automated cleanup for old prototypes
   - [ ] Add monitoring and alerting
   - [ ] Add admin dashboard
   - [ ] Add team/organization features
   - [ ] Add granular permissions
   - [ ] Add cost tracking and limits
   - [ ] Add CI/CD for the PoC itself

10. **Troubleshooting**
    - [ ] Common issues and solutions:
      - "Failed to create branch" → Check GitHub token permissions
      - "Failed to provision database" → Check Neon API key
      - "Deployment failed" → Check Vercel logs
      - "Protected path error" → Explains what paths can be modified

### DOC-2: Environment Variables Documentation
**Location:** `/.env.example` in repository root

**Must include:**
```env
# GitHub Configuration
# Create a Personal Access Token at: https://github.com/settings/tokens
# Required permissions: repo (full control)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=your-github-username
GITHUB_REPO=your-repo-name

# Neon Database Configuration
# Create API key at: https://console.neon.tech/app/settings/api-keys
# Project ID found at: https://console.neon.tech/app/projects
NEON_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEON_PROJECT_ID=your-project-id-here
NEON_PARENT_BRANCH_ID=br-xxxxxx-xxxxxx (main/production branch ID)

# Vercel Configuration
# Create token at: https://vercel.com/account/tokens
# Project ID found in project settings
VERCEL_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VERCEL_TEAM_ID=team_xxxxxxxxxxxxxxxxxxxx (optional, only for team accounts)

# v0 Platform API
# Get API key from: https://v0.app/settings/api (or wherever v0 provides keys)
V0_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Database URL for PoC's own data (not prototypes)
# Get from Neon project connection string
DATABASE_URL=postgresql://user:password@ep-xxxxx.neon.tech/dbname?sslmode=require

# NextAuth Configuration
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-random-32-character-secret-here
# Your app's base URL (update for production)
NEXTAUTH_URL=http://localhost:3000

# Email Configuration (for password resets)
# For Resend: https://resend.com/api-keys
# For SendGrid: https://app.sendgrid.com/settings/api_keys
# For SMTP: smtp://username:password@smtp.example.com:587
EMAIL_SERVER=smtp://user:pass@smtp.sendgrid.net:587
EMAIL_FROM=noreply@yourdomain.com
```

**Additional documentation:**
- [ ] Explanation of each variable's purpose
- [ ] Links to documentation for obtaining each key
- [ ] Security notes (which variables are sensitive - all of them!)
- [ ] Instructions for rotating compromised keys

### DOC-3: API Integration Notes
**Location:** `/docs/api-integrations.md`

**Must include:**
1. **v0 Platform API**
   - [ ] How to create a v0 project programmatically
   - [ ] How to send existing code to v0
   - [ ] How to set up webhooks (if available)
   - [ ] Rate limits observed during testing
   - [ ] Cost estimates (API calls per prototype)
   - [ ] Limitations discovered
   - [ ] Workarounds for any issues

2. **Vercel API**
   - [ ] How to set environment variables per branch
   - [ ] How to query deployment status
   - [ ] Rate limits
   - [ ] Quirks (e.g., env var propagation delay)

3. **Neon API**
   - [ ] How to create database branches
   - [ ] How to delete branches
   - [ ] Branching costs (copy-on-write explained)
   - [ ] Limits (max branches per project)
   - [ ] Performance observations

4. **GitHub API**
   - [ ] How to create branches
   - [ ] How to commit files
   - [ ] How to create PRs
   - [ ] Rate limits (5000 requests/hour for authenticated users)
   - [ ] Best practices (batching commits, etc.)

### DOC-4: Database Schema Documentation
**Location:** `/docs/database-schema.md`

**Must include:**
1. **Entity-Relationship Diagram (ERD)**
   - [ ] Visual diagram showing all models and relationships
   - [ ] Can use Mermaid diagram syntax or image

2. **Model Descriptions**
   - [ ] User: Stores user account information
   - [ ] Session: Stores active user sessions (NextAuth)
   - [ ] PasswordReset: Stores password reset tokens
   - [ ] Prototype: Stores prototype metadata and ownership
   - [ ] PreviewDatabase: Stores database branch information per prototype

3. **Field Descriptions**
   - [ ] Explain purpose of each field in each model
   - [ ] Note which fields are required, unique, indexed

4. **Relationships**
   - [ ] User → Prototype (one-to-many)
   - [ ] User → Session (one-to-many)
   - [ ] User → PasswordReset (one-to-many)
   - [ ] Prototype → PreviewDatabase (one-to-one)
   - [ ] Explain cascading deletes

5. **Indexes**
   - [ ] List all indexes and why they exist
   - [ ] Performance rationale (which queries use which indexes)

6. **Migrations**
   - [ ] How to run migrations: `npx prisma migrate dev`
   - [ ] How to reset database (for testing): `npx prisma migrate reset`
   - [ ] How migrations are versioned

### DOC-5: User Guide
**Location:** `/docs/user-guide.md`

**Must include:**
1. **Getting Started**
   - [ ] How to sign up
   - [ ] How to log in
   - [ ] Dashboard overview (screenshot)

2. **Creating Your First Prototype**
   - [ ] Click "Create New Prototype"
   - [ ] Describe your idea clearly
   - [ ] Suggested first prototypes
   - [ ] Wait for workspace to load

3. **Using the Workspace**
   - [ ] Left panel: v0 chat (how to interact with AI)
   - [ ] Right panel: live preview
   - [ ] How to iterate (make changes via chat)
   - [ ] How to wait for deployments

4. **Submitting for Review**
   - [ ] When to submit (when prototype is ready)
   - [ ] Click "Submit for Review"
   - [ ] What happens (PR created)
   - [ ] How to view PR in GitHub

5. **Managing Prototypes**
   - [ ] Dashboard overview
   - [ ] Filtering by status
   - [ ] Searching by description
   - [ ] Deleting prototypes (confirmation required)

6. **Tips and Best Practices**
   - [ ] Be specific in descriptions
   - [ ] Iterate incrementally (small changes)
   - [ ] What you can modify (landing page, examples)
   - [ ] What you cannot modify (dashboard, auth pages)
   - [ ] How to handle errors

7. **Screenshots**
   - [ ] Dashboard
   - [ ] Create prototype modal
   - [ ] Workspace (split-screen)
   - [ ] Submit for review modal

### DOC-6: Contributing Guide
**Location:** `/CONTRIBUTING.md`

**Must include:**
1. **How to Contribute**
   - [ ] Fork the repository
   - [ ] Create a branch
   - [ ] Make changes
   - [ ] Test locally
   - [ ] Submit PR

2. **Code Style**
   - [ ] Use Prettier for formatting
   - [ ] Use ESLint for linting
   - [ ] Follow Next.js conventions
   - [ ] TypeScript strict mode

3. **Testing**
   - [ ] Manual testing checklist
   - [ ] How to test auth flows
   - [ ] How to test prototype creation

4. **PR Guidelines**
   - [ ] Clear title and description
   - [ ] Reference issue if applicable
   - [ ] Screenshots for UI changes

---

## Success Criteria

The PoC is considered successful if all of the following are demonstrated:

1. **✅ Authentication Works**
   - Multiple users can sign up, log in, and manage sessions
   - Password reset flow works end-to-end
   - Rate limiting and security measures in place

2. **✅ Multi-User Isolation**
   - Users can only see and access their own prototypes
   - No data leakage between users
   - Concurrent users don't interfere with each other

3. **✅ Multi-Prototype Support**
   - Single user can create and manage 5+ prototypes simultaneously
   - Dashboard filtering and search work correctly
   - Each prototype has isolated resources (branch, database, deployment)

4. **✅ Core Integration Works**
   - v0 Platform API generates code based on descriptions
   - GitHub branches and commits work automatically
   - Neon database branching provides isolated databases
   - Vercel preview deployments work per branch
   - All four APIs (GitHub, Neon, Vercel, v0) work together seamlessly

5. **✅ Self-Modification Works**
   - Users can modify the landing page, example pages, UI components
   - Changes are visible in preview deployments
   - Protected path enforcement prevents breaking core functionality

6. **✅ Code Sync Works**
   - v0 changes automatically commit to GitHub
   - Commits trigger Vercel deployments
   - Preview updates within 2-3 minutes of v0 change

7. **✅ PR Submission Works**
   - Users can submit prototypes for review
   - PRs created in GitHub with correct metadata
   - Submitted prototypes become read-only

8. **✅ Performance is Acceptable**
   - Prototype creation completes in < 60 seconds
   - Dashboard loads with 50+ prototypes in < 2 seconds
   - 10 concurrent users can work without issues

9. **✅ Value is Demonstrable**
   - Non-technical stakeholder can:
     - Sign up
     - Create a prototype by describing an idea
     - Iterate with v0 to refine the prototype
     - Submit a PR without touching code/git/deployment tools
   - Stakeholder understands the value proposition

10. **✅ Documentation is Complete**
    - README provides clear setup instructions
    - All environment variables documented
    - User guide explains how to use the PoC
    - Architecture is well-documented

## Failure Criteria

The PoC should be abandoned or significantly redesigned if any of the following occur:

1. **❌ Authentication Cannot Be Secured**
   - User isolation cannot be enforced reliably
   - Session management has fundamental security flaws
   - Data leakage between users occurs despite best efforts

2. **❌ v0 Platform API is Insufficient**
   - Cannot work with existing codebases (only generates from scratch)
   - Cannot understand THIS repo's context
   - Rate limits or costs are prohibitively high
   - Quality of generated code is too poor to be useful

3. **❌ Database Branching is Too Expensive**
   - Neon costs for multiple preview branches exceed budget
   - Performance degrades with 10+ active branches
   - Branch creation/deletion too slow (> 30 seconds)

4. **❌ Protected Path Enforcement Fails**
   - Users can bypass protection and break core functionality
   - No reliable way to prevent v0 from modifying protected files
   - Self-modifying architecture proves too risky

5. **❌ Integration Complexity Exceeds Value**
   - Orchestrating 4 APIs (GitHub, Neon, Vercel, v0) is too brittle
   - Too many failure modes and edge cases
   - Maintenance burden outweighs benefits
   - Simpler approach (PMs describe → engineers implement) is faster

6. **❌ Concurrent User Support Fails**
   - Race conditions or conflicts with 10+ concurrent users
   - Database connection pool exhaustion
   - API rate limits hit too frequently

7. **❌ Performance is Unacceptable**
   - Prototype creation takes > 5 minutes consistently
   - Dashboard unusable with 50+ prototypes
   - Preview deployments fail > 20% of the time

---

## Open Questions to Resolve During Implementation

These questions should be answered during development and documented in the README or API integration notes:

1. **v0 Platform API**
   - [ ] Does v0 support webhooks for code changes, or must we poll?
   - [ ] What's the maximum codebase size v0 can handle?
   - [ ] How many files can we send in a single project creation request?
   - [ ] What's the token limit for context?
   - [ ] What's the actual cost per API call?
   - [ ] Can we embed v0 chat via iframe, or must we build custom UI?
   - [ ] How does v0 handle binary files (images, fonts)?

2. **Vercel API**
   - [ ] How long does it take for environment variables to propagate to new deployments?
   - [ ] Can we set env vars before first deployment, or must deployment exist first?
   - [ ] Are there limits on number of env vars per project?
   - [ ] How reliable is deployment status polling?
   - [ ] What's the rate limit on deployment status queries?

3. **Neon API**
   - [ ] What's the actual cost of 10-20 database branches over 1 month?
   - [ ] Are there limits on number of branches per project?
   - [ ] How long do branches take to create (should be instant, but verify)?
   - [ ] How much divergence (data changes) can occur before costs increase significantly?
   - [ ] Can we set branch-specific database configuration (connection limits, etc.)?

4. **GitHub API**
   - [ ] Do we hit rate limits with typical usage (10 users, 50 prototypes)?
   - [ ] Should we use a GitHub App instead of Personal Access Token for better rate limits?
   - [ ] How should we handle merge conflicts if multiple prototypes modify same file?
   - [ ] What's the best way to clean up old branches (manual or automated)?

5. **Migration Strategy**
   - [ ] How do we handle v0 generating duplicate migrations (same schema change twice)?
   - [ ] Should migrations be automatic or require approval?
   - [ ] How do we prevent v0 from modifying the PoC's own database schema?
   - [ ] What happens if migration fails in preview database?

6. **Cost Estimation**
   - [ ] What's the total cost to run this PoC for 1 month with 10 users?
   - [ ] Breakdown: Vercel ($X), Neon ($Y), v0 API ($Z), GitHub (free), Email ($W)
   - [ ] At what scale do costs become prohibitive?

7. **User Experience**
   - [ ] How do users know which paths are safe to modify without reading docs?
   - [ ] Should we show a tutorial on first login?
   - [ ] How do we handle the confusion of "I'm modifying the app I'm using"?
   - [ ] Should we add in-app tips or tooltips?

8. **Error Recovery**
   - [ ] What happens if prototype creation fails halfway through?
   - [ ] How do we clean up partial artifacts (branch created but database failed)?
   - [ ] Should we auto-retry failures or require manual retry?
   - [ ] How do we handle transient failures (network issues, API downtime)?

---

## Timeline Estimate

**Total: 7-8 days of focused development**

### Day 1-2: Authentication & User Management (2 days)
- [ ] Set up Next.js 15 app with App Router
- [ ] Install and configure NextAuth.js v5
- [ ] Implement sign up, login, logout pages and API routes
- [ ] Implement password reset flow (pages, API routes, email sending)
- [ ] Set up email service (Resend or SendGrid)
- [ ] Create User, Session, PasswordReset database models
- [ ] Run initial Prisma migration
- [ ] Implement authentication middleware
- [ ] Test auth flows end-to-end

### Day 3-4: Dashboard & Prototype Management (2 days)
- [ ] Create dashboard UI (prototype list, filters, search)
- [ ] Create prototype creation modal
- [ ] Create prototype deletion modal
- [ ] Implement dashboard API routes (list prototypes, delete prototype)
- [ ] Create Prototype and PreviewDatabase database models
- [ ] Implement authorization checks (ownership verification)
- [ ] Implement filtering and search logic
- [ ] Style dashboard with Tailwind CSS
- [ ] Add responsive design
- [ ] Test multi-prototype management

### Day 5: Core Integration - Part 1 (1 day)
- [ ] Set up GitHub API integration (Octokit)
- [ ] Implement branch creation in THIS repository
- [ ] Implement file commit to branch
- [ ] Implement PR creation
- [ ] Set up Neon API integration
- [ ] Implement database branch creation
- [ ] Test GitHub and Neon integrations separately
- [ ] Handle errors gracefully

### Day 6: Core Integration - Part 2 (1 day)
- [ ] Set up Vercel API integration
- [ ] Implement environment variable creation (per branch)
- [ ] Implement deployment status polling
- [ ] Set up v0 Platform API integration
- [ ] Implement v0 project creation with existing code
- [ ] Implement protected path filtering (whitelist/blacklist)
- [ ] Implement prototype creation orchestration (GitHub + Neon + Vercel + v0)
- [ ] Test end-to-end prototype creation

### Day 7: Workspace & Code Sync (1 day)
- [ ] Create workspace UI (split-screen layout)
- [ ] Embed v0 chat interface (iframe or custom)
- [ ] Implement preview iframe with polling/refresh
- [ ] Implement webhook endpoint for v0 code changes
- [ ] Implement protected path validation in webhook
- [ ] Implement file commit on code changes
- [ ] Implement deployment status updates
- [ ] Implement PR submission flow
- [ ] Implement read-only workspace (post-submission)
- [ ] Test workspace and code sync

### Day 8: Example Content, Testing & Documentation (1 day)
- [ ] Create example landing page content
- [ ] Create example blog pages (/examples/blog)
- [ ] Create example contact page (/examples/contact)
- [ ] Create example UI components (/components/examples)
- [ ] Manual testing of all flows:
  - [ ] Auth flows (sign up, login, password reset)
  - [ ] Multi-user isolation
  - [ ] Multiple prototypes
  - [ ] End-to-end prototype creation and modification
  - [ ] Protected path enforcement
  - [ ] Concurrent users (if possible)
- [ ] Write README with setup instructions
- [ ] Write API integration notes
- [ ] Write user guide
- [ ] Create `.env.example` with documentation
- [ ] Bug fixes from testing
- [ ] Final polish (UI refinements, error messages, loading states)

### Buffer: +1-2 days for unexpected issues

**Realistic timeline with buffer: 8-10 days**

This accounts for:
- Learning curve with v0 Platform API (may take longer than expected)
- Integration debugging (APIs not working as documented)
- Protected path enforcement edge cases
- UI polish and responsive design refinements
- Testing across multiple browsers and devices
- Documentation writing

---

## Risk Mitigation

### High-Risk Areas

1. **v0 Platform API Integration**
   - **Risk:** v0 API may not support all required features or may be poorly documented
   - **Mitigation:** Test v0 API early (Day 6), have fallback plan to use Claude API directly

2. **Protected Path Enforcement**
   - **Risk:** Users may find ways to bypass protection or v0 may not respect limitations
   - **Mitigation:** Implement both client-side (filter before sending) and server-side (validate before committing) checks

3. **Database Branching Costs**
   - **Risk:** Neon branching may be more expensive than expected with real usage
   - **Mitigation:** Monitor costs closely during PoC, implement cleanup early

4. **Concurrent User Conflicts**
   - **Risk:** Race conditions in branch/database creation with simultaneous users
   - **Mitigation:** Use unique branch names (user ID + timestamp), database unique constraints

5. **API Rate Limits**
   - **Risk:** Hitting rate limits on GitHub, Vercel, Neon, or v0 APIs
   - **Mitigation:** Implement rate limit detection and graceful degradation, use caching where possible

### Success Factors

1. **Clear scope** - PoC, not production system
2. **Simple architecture** - Self-modifying app reduces complexity
3. **Proven technologies** - Next.js, Prisma, Neon, Vercel all battle-tested
4. **Iterative approach** - Build and test incrementally
5. **Good documentation** - Clear setup and usage instructions

---

## Conclusion

This PoC demonstrates a novel approach to rapid prototyping: a self-modifying application where non-technical users can describe changes in natural language and see them come to life through AI-powered code generation. By leveraging v0 Platform API, GitHub, Neon database branching, and Vercel preview deployments, users can iterate quickly without touching code, git, or deployment tools.

The self-modifying architecture significantly simplifies implementation compared to managing a separate target repository, while protected path enforcement ensures core functionality remains stable.

**Key Innovation:** Users improve the very tool they're using, creating a tight feedback loop and powerful dogfooding experience.

**Success Measure:** Non-technical PM can go from idea to deployed prototype to GitHub PR in under 10 minutes, without writing a single line of code.

---

**Document Version:** 1.0  
**Last Updated:** [Current Date]  
**Author:** [Your Name]  
**Status:** Ready for Implementation
