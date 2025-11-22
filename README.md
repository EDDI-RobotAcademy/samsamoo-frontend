# SamSamOO-Frontend
samsamoo-frontend

## .env.local setting (The top-level package)
NEXT_PUBLIC_API_BASE_URL=http://localhost:33333
NEXT_PUBLIC_GOOGLE_LOGIN_PATH=/authentication/google
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=yourAccessKeyId
AWS_SECRET_ACCESS_KEY=yourSecretAccessKey
AWS_S3_BUCKET=yourBucketName

# setting install
npm install
npm install aws-sdk

## if you message UnauthorizedAccess
 Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

## then run!
npm run dev

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started
First, run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
