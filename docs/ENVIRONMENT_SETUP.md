# Environment Variables Setup

## Overview

This monorepo project uses a centralized environment configuration approach where:
- **Root `.env.local`** - Single source of truth for all environment variables
- **Frontend `.env.local`** - Auto-generated copy for Next.js compatibility
- **Backend** - Reads directly from root `.env.local`

## Setup Instructions

1. **Create root `.env.local`**
   - Copy `.env.example` to `.env.local` in the project root
   - Fill in all required environment variables

2. **Auto-sync to frontend**
   - Run `npm run sync-env` to copy environment variables to frontend
   - This is automatically done when running `npm run dev`

3. **Never edit frontend/.env.local directly**
   - It's auto-generated from the root file
   - Any changes should be made to the root `.env.local`

## Best Practices

1. **Single Source of Truth**: Always edit the root `.env.local` file
2. **Automatic Sync**: The `npm run dev` command automatically syncs environment variables
3. **Git Ignore**: Both `.env.local` files are ignored by git
4. **Backend Access**: Backend directly reads from root `.env.local` using dotenv

## Environment Variables Structure

```bash
# Root structure
AI-E-LEARNING/
├── .env.local          # Main environment file (edit this)
├── .env.example        # Template with all required variables
├── frontend/
│   └── .env.local      # Auto-generated (DO NOT EDIT)
└── backend/
    └── (reads from root .env.local)
```

## Troubleshooting

### NextAuth [NO_SECRET] Error
- Ensure `NEXTAUTH_SECRET` is set in root `.env.local`
- Run `npm run sync-env` to sync to frontend
- Restart the development server

### Environment variables not loading
1. Check root `.env.local` exists and has correct values
2. Run `npm run sync-env` manually
3. Restart the development server
4. Verify frontend/.env.local was created