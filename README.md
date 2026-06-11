# AI Code Reviewer

Production-ready AI code reviewer powered by Next.js 14 and DeepSeek.

## Features
- Structured AI reviews: severity-tiered issue cards, overall score, positives, and fixed code
- Clean, animated UI with GPU-safe animations
- Serverless proxy to DeepSeek via Vercel API route
- Zero-config deployment to Vercel

## Tech Stack
- Next.js 14 App Router (TypeScript strict)
- Tailwind CSS + CSS Custom Properties
- Framer Motion (GPU-safe animations only)
- Syne (display) + JetBrains Mono (code)
- lucide-react icons

## Setup
```bash
npm install
npm run dev
```

## Deploy
```bash
vercel --prod
```

No environment variables required.
