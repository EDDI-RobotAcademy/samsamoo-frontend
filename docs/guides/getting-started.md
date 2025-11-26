# Getting Started

Quick setup guide for SamSamOO-Frontend.

## Prerequisites

- Node.js 18+
- npm or yarn
- Backend server running (SamSamOO-AI-Server)

## Installation

### 1. Install Dependencies

```bash
cd SamSamOO-Frontend
npm install
```

### 2. Configure Environment

Create `.env.local` in the project root:

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

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## Windows PowerShell Note

If you encounter `UnauthorizedAccess` error:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Backend API URL |
| `NEXT_PUBLIC_GOOGLE_LOGIN_PATH` | Yes | OAuth redirect path |
| `AWS_REGION` | For uploads | AWS region |
| `AWS_ACCESS_KEY_ID` | For uploads | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | For uploads | AWS credentials |
| `AWS_S3_BUCKET` | For uploads | S3 bucket name |

## Verification

### Check Frontend

1. Open http://localhost:3000
2. Verify Navbar displays correctly
3. Check Login button appears

### Check Backend Connection

1. Click Login button
2. Should redirect to Google OAuth
3. After login, menu items should appear

## Troubleshooting

### CORS Errors

Ensure backend CORS is configured for `http://localhost:3000`.

### Authentication Not Working

1. Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
2. Verify backend is running on port 33333
3. Check browser cookies (session_id)

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

## Next Steps

- [Architecture Overview](../architecture/README.md)
- [Component Documentation](../components/README.md)
- [API Integration](../api/README.md)
