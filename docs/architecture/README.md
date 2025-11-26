# Architecture Overview

SamSamOO-Frontend follows Next.js 16 App Router patterns with React 19.

## Project Structure

```
SamSamOO-Frontend/
├── app/                    # App Router pages
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles
│   ├── anonymous-board/    # Public board feature
│   │   ├── list/page.tsx
│   │   ├── create/page.tsx
│   │   └── [id]/page.tsx
│   ├── board/              # Authenticated board feature
│   │   ├── list/page.tsx
│   │   ├── create/page.tsx
│   │   ├── me/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── edit/page.tsx
│   ├── documents/          # Document analysis
│   │   ├── list/page.tsx
│   │   └── register/page.tsx
│   ├── financial-statements/ # Financial analysis
│   │   ├── list/page.tsx
│   │   ├── create/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── upload/page.tsx
│   ├── xbrl-analysis/      # XBRL analysis
│   │   └── page.tsx
│   └── login/              # Authentication
│       └── page.tsx
├── components/             # Shared components
│   ├── Navbar.tsx
│   ├── FileUpload.tsx
│   └── FinancialPipeline.tsx
├── contexts/               # React Context
│   └── AuthContext.tsx
├── features/               # Feature modules
│   └── upload/
├── types/                  # TypeScript types
│   ├── anonymous-board.ts
│   ├── document.ts
│   ├── financial-statement.ts
│   └── xbrl-analysis.ts
└── docs/                   # Documentation
```

## Key Patterns

### App Router

Next.js 16 App Router with file-based routing:

```
app/board/[id]/page.tsx → /board/123
app/board/list/page.tsx → /board/list
```

### Client vs Server Components

**Server Components** (default):
- No `"use client"` directive
- Can fetch data directly
- No React hooks

**Client Components**:
- Require `"use client"` directive
- Can use hooks (useState, useEffect)
- Required for interactivity

```tsx
// Client component example
"use client";

import { useState } from "react";

export default function MyComponent() {
    const [state, setState] = useState(false);
    // ...
}
```

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│   Google    │
│   /login    │     │   /auth     │     │   OAuth     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │◀──────────────────┘
       │                   │  (redirect with code)
       │◀──────────────────┘
       │  (session cookie)
       ▼
┌─────────────┐
│ AuthContext │
│ isLoggedIn  │
└─────────────┘
```

### State Management

**AuthContext** provides global authentication state:

```tsx
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
    const { isLoggedIn, logout, refresh } = useAuth();

    if (!isLoggedIn) {
        return <LoginPrompt />;
    }
    // ...
}
```

### API Integration

All API calls include credentials for cookie-based auth:

```tsx
fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/endpoint`, {
    credentials: "include",  // Required for cookies
    headers: {
        "Content-Type": "application/json",
    },
});
```

### Path Aliases

TypeScript path alias `@/*` resolves to project root:

```tsx
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
```

## Feature Modules

### Anonymous Board
- Public access (no auth required)
- CRUD operations

### Board (Authenticated)
- Requires login
- User-specific content (`/board/me`)
- Owner-only edit/delete

### Documents
- File upload to S3
- Multi-agent analysis

### Financial Statements
- PDF/Excel upload
- Ratio calculation
- LLM analysis
- Report generation

### XBRL Analysis
- DART API integration
- Korean corporate data
- K-IFRS parsing

## Styling

Tailwind CSS 4 via PostCSS plugin:

```tsx
// Inline Tailwind classes
<div className="bg-gray-800 text-white p-4 flex justify-between">
```

Configuration in `postcss.config.mjs`:

```js
export default {
    plugins: {
        "@tailwindcss/postcss": {},
    },
};
```

## See Also

- [Components](../components/README.md)
- [API Integration](../api/README.md)
- [Backend Architecture](../../../SamSamOO-AI-Server/docs/architecture/hexagonal.md)
