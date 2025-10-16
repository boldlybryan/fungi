# Fungi - AI-Powered Prototype Builder (Self-Modifying PoC)

A standalone proof-of-concept application that enables non-technical users to create working prototypes by describing changes in natural language. The system integrates v0 Platform API, GitHub, Neon database branching, and Vercel preview deployments to create an end-to-end prototype development workflow.

**Key Innovation:** This application modifies itself. Users prototype changes to this application, not a separate target repository.

## Features

- 🔐 **Multi-User Authentication** - Secure signup/login with NextAuth.js
- 💬 **Natural Language Prototyping** - Describe changes in plain English
- ⚡ **Instant Previews** - See changes live with Vercel preview deployments
- 🔒 **Isolated Environments** - Each prototype gets its own Git branch and database
- 🤖 **AI-Powered** - Integration with v0 Platform API for code generation
- ✅ **Easy Reviews** - Submit prototypes as GitHub Pull Requests
- 🛡️ **Protected Paths** - Core functionality stays secure while allowing experimentation

## Architecture

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Fungi Next.js App (Self-Modifying)     │
│  - Auth & Dashboard                     │
│  - Prototype Workspace                  │
│  - Protected Core + Modifiable Examples │
└──────┬──────────────────┬───────────────┘
       │                  │
   ┌───▼────┐      ┌──────▼──────┐
   │ GitHub │      │  v0 Platform │
   │ (This  │      │     API      │
   │  Repo) │      └──────────────┘
   └───┬────┘
       │
   ┌───▼────┐      ┌──────────┐
   │ Vercel │      │   Neon   │
   │Preview │      │ Database │
   └────────┘      └──────────┘
```

## Prerequisites

- Node.js 18.17.0 or higher
- npm or bun
- Git
- Accounts for:
  - GitHub (for repository and API access)
  - Neon (for database)
  - Vercel (for deployments)
  - v0 (for AI-powered code generation)
  - Resend (for password reset emails)

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd fungi
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the following variables:

#### Database
```env
DATABASE_URL=postgresql://user:password@ep-xxxxx.neon.tech/fungi?sslmode=require
```
Get from: [Neon Console](https://console.neon.tech) → Your Project → Connection String

#### NextAuth
```env
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=http://localhost:3000
```
Generate secret with: `openssl rand -base64 32`

#### Email (Resend)
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```
Get API key from: [Resend API Keys](https://resend.com/api-keys)

#### GitHub
```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=your-github-username
GITHUB_REPO=fungi
```
Create token at: [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)  
Required permissions: **repo** (full control)

#### Neon
```env
NEON_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEON_PROJECT_ID=your-project-id
NEON_PARENT_BRANCH_ID=br-xxxxxx-xxxxxx
```
- API Key: [Neon Console → Account Settings → API Keys](https://console.neon.tech/app/settings/api-keys)
- Project ID: Found in project URL
- Parent Branch ID: Main/production branch ID from Neon Console

#### Vercel
```env
VERCEL_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VERCEL_TEAM_ID=team_xxxxxxxxxxxxxxxxxxxx  # Optional, for teams
```
Create token at: [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)  
Project ID: Found in project settings

#### v0
```env
V0_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
Get from v0 Platform (when available)

### 3. Initialize Database

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Protected vs. Modifiable Paths

### ✅ Modifiable (Safe to Experiment)
- `/app/page.tsx` - Landing page
- `/app/examples/` - Example blog and contact pages
- `/components/ui/` - UI components
- `/components/examples/` - Example components
- `/public/` - Static assets

### ⚠️ Protected (Cannot Modify)
- `/app/api/prototype/` - Prototype management APIs
- `/app/dashboard/` - User dashboard
- `/app/(auth)/` - Authentication pages
- `/app/prototype/` - Workspace UI
- `/lib/*.ts` - Core integration libraries
- `/middleware.ts` - Auth middleware
- `/prisma/schema.prisma` - PoC database schema

## How to Test the PoC

1. **Sign Up**: Create an account at `/signup`
2. **Create Prototype**: Click "Create New Prototype" in dashboard
3. **Describe Your Idea**: Try: "Add a testimonials section to the landing page"
4. **Wait for Setup**: System creates branch, database, and deployment (~ 30-60s)
5. **Iterate**: Chat with AI in workspace to refine prototype
6. **Preview**: See changes live in preview panel
7. **Submit**: Click "Submit for Review" to create GitHub PR

## Development

### Project Structure

```
fungi/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (protected)
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard (protected)
│   ├── examples/          # Example content (modifiable)
│   ├── prototype/         # Workspace (protected)
│   └── page.tsx           # Landing page (modifiable)
├── components/            # React components
├── lib/                   # Core libraries (protected)
│   ├── auth.ts           # NextAuth config
│   ├── db.ts             # Prisma client
│   ├── github.ts         # GitHub API
│   ├── neon.ts           # Neon API
│   ├── vercel.ts         # Vercel API
│   ├── v0.ts             # v0 Platform API
│   └── protected-paths.ts # Path filtering
├── prisma/               # Database schema
└── public/               # Static assets
```

### Key Technologies

- **Next.js 15** - React framework with App Router
- **NextAuth.js v5** - Authentication
- **Prisma** - Database ORM
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Octokit** - GitHub API client

## Troubleshooting

### "Failed to create branch"
- Check `GITHUB_TOKEN` has `repo` permissions
- Verify `GITHUB_OWNER` and `GITHUB_REPO` are correct
- Ensure token hasn't expired

### "Failed to provision database"
- Check `NEON_API_KEY` is valid
- Verify `NEON_PROJECT_ID` and `NEON_PARENT_BRANCH_ID` are correct
- Check Neon project limits (max branches)

### "Deployment failed"
- Check Vercel project settings
- Verify `VERCEL_TOKEN` has correct permissions
- View logs in Vercel dashboard

### "Protected path error"
- You're trying to modify a core system file
- Stick to modifiable paths: landing page, examples, UI components

## Security Considerations

- Keep all API keys secret (never commit `.env.local`)
- Rotate keys immediately if accidentally exposed
- Protected path enforcement prevents breaking the app
- Each user can only access their own prototypes
- Database sessions for secure authentication

## Known Limitations (PoC)

- Limited error recovery for API failures
- No automated cleanup of old prototypes
- Rate limits from API providers may apply
- Costs scale with number of branches/deployments
- v0 Platform API integration is placeholder (update when API available)

## Next Steps for Production

- [ ] Add automated cleanup for old prototypes/branches
- [ ] Implement monitoring and alerting
- [ ] Add admin dashboard
- [ ] Add team/organization features
- [ ] Add granular permissions (admin vs. user)
- [ ] Add cost tracking and limits
- [ ] Add CI/CD for the PoC itself
- [ ] Implement actual v0 Platform API integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a Pull Request

## License

MIT

## Support

For questions or issues, please open an issue on GitHub or contact the team.

---

**Built with ❤️ as a proof-of-concept for AI-powered prototyping**
