# AI Architect Hub

Transform your app ideas into developer-ready documentation with AI-powered generation.

## Overview

AI Architect Hub is a full-stack SaaS application that generates three comprehensive markdown artifacts from a simple app idea:
- **requirements.md** - Product requirements and user stories
- **design.md** - System architecture and technical design
- **tasks.md** - Granular development task breakdown

## Tech Stack

### Frontend
- **Next.js 14+** with App Router
- **TypeScript** with strict mode
- **Tailwind CSS** with glassmorphism styling
- **Supabase JS Client** for auth and realtime updates

### Backend
- **Express.js** API
- **MiniMax M2.5 Free** LLM (via Vercel AI SDK)
- **Supabase** for PostgreSQL database and authentication

### Infrastructure
- **Vercel** for hosting and serverless functions
- **Supabase Cloud** for database and realtime subscriptions

## Project Structure

```
ai_app/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles with glassmorphism
├── components/            # React components
├── lib/                   # Utility functions and services
├── api/                   # Express API routes
├── types/                 # TypeScript type definitions
│   └── index.ts          # Shared interfaces
├── tailwind.config.js    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration (strict mode)
├── next.config.js        # Next.js configuration
└── package.json          # Dependencies and scripts
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- MiniMax API key

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MINIMAX_API_KEY`

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Create a production build:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Core Dependencies

- **next**: ^16.2.6
- **react**: ^19.2.6
- **typescript**: ^6.0.3
- **tailwindcss**: ^4.3.0
- **@supabase/supabase-js**: ^2.105.4
- **express**: ^5.2.1
- **ai**: ^6.0.177 (Vercel AI SDK)
- **vercel-minimax-ai-provider**: ^0.0.2
- **jszip**: ^3.10.1

## Features

### Implemented
- ✅ Next.js 14+ with TypeScript and App Router
- ✅ Tailwind CSS with glassmorphism utilities
- ✅ TypeScript strict mode configuration
- ✅ Project folder structure
- ✅ Core dependencies installed
- ✅ MiniMax SDK integration ready

### Coming Soon
- 🔄 User authentication with Supabase
- 🔄 AI generation pipeline
- 🔄 Real-time artifact updates
- 🔄 Project history
- 🔄 Download bundle feature

## License

ISC
