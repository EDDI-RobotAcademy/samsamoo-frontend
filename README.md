# SamSamOO-Frontend

Next.js 16 frontend for AI-powered financial statement analysis.

## Features

- **Google OAuth Authentication** via backend API
- **Board System** with authenticated and anonymous boards
- **Document Analysis** with multi-agent processing
- **Financial Statement Analysis** with PDF/Excel support
- **XBRL Analysis** for Korean corporate data

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your settings

# Run development server
npm run dev
```

Open http://localhost:3000 in your browser.

## Environment Variables

Create `.env.local`:

```env
# Backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:33333
NEXT_PUBLIC_GOOGLE_LOGIN_PATH=/authentication/google

# AWS S3 (for file uploads)
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
```

## Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](./docs/guides/getting-started.md) | Setup guide |
| [Architecture](./docs/architecture/README.md) | Project structure |
| [Components](./docs/components/README.md) | Component reference |
| [API Integration](./docs/api/README.md) | Backend API guide |

## Project Structure

```
SamSamOO-Frontend/
├── app/                    # Next.js App Router pages
├── components/             # Reusable components
├── contexts/               # React Context providers
├── features/               # Feature-specific code
├── types/                  # TypeScript definitions
└── docs/                   # Documentation
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Production server |
| `npm run lint` | Run ESLint |

## Technology Stack

- **Next.js** 16.0.1 with App Router
- **React** 19.2.0
- **TypeScript** 5.x (strict mode)
- **Tailwind CSS** 4.x (PostCSS plugin)
- **AWS SDK** 3.x for S3 uploads

## Windows PowerShell Note

If you encounter `UnauthorizedAccess`:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## Related

- [Backend Documentation](../SamSamOO-AI-Server/docs/README.md)
- [Backend API](http://localhost:33333/docs)
