# SamSamOO-Frontend Documentation

Documentation for the Next.js frontend application.

## Quick Navigation

| Section | Description |
|---------|-------------|
| [Getting Started](./guides/getting-started.md) | Setup and installation |
| [Architecture](./architecture/README.md) | Project structure and patterns |
| [Components](./components/README.md) | Reusable component documentation |
| [API Integration](./api/README.md) | Backend API integration |

## Documentation Structure

```
docs/
├── README.md                 # This file - documentation index
├── guides/
│   └── getting-started.md    # Setup and configuration
├── architecture/
│   └── README.md             # Project structure and patterns
├── components/
│   └── README.md             # Component documentation
└── api/
    └── README.md             # API integration guide
```

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.1 | React framework with App Router |
| React | 19.2.0 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling (PostCSS plugin) |
| AWS SDK | 3.x | S3 file uploads |

## Features

- **Authentication**: Google OAuth via backend API
- **Board System**: Authenticated and anonymous boards
- **Document Analysis**: Multi-agent document processing
- **Financial Statements**: PDF/Excel analysis with reports
- **XBRL Analysis**: Korean corporate financial data

## Project Structure

```
SamSamOO-Frontend/
├── app/                    # Next.js App Router pages
│   ├── anonymous-board/    # Public boards
│   ├── board/              # Authenticated boards
│   ├── documents/          # Document management
│   ├── financial-statements/ # Financial analysis
│   ├── xbrl-analysis/      # XBRL analysis
│   ├── login/              # Login page
│   └── layout.tsx          # Root layout
├── components/             # Reusable components
├── contexts/               # React Context providers
├── features/               # Feature-specific code
├── types/                  # TypeScript definitions
└── docs/                   # Documentation
```

## Related Documentation

- [Backend Documentation](../../SamSamOO-AI-Server/docs/README.md)
- [Main Project CLAUDE.md](../CLAUDE.md)
