# Components

Reusable React components for SamSamOO-Frontend.

## Component Overview

| Component | Type | Description |
|-----------|------|-------------|
| [Navbar](#navbar) | Client | Navigation bar with auth state |
| [FileUpload](#fileupload) | Client | S3 file upload component |
| [FinancialPipeline](#financialpipeline) | Server | Analysis pipeline visualization |

---

## Navbar

Navigation component with authentication-aware menu rendering.

### Location
`components/Navbar.tsx`

### Type
Client Component (`"use client"`)

### Props
None (uses AuthContext)

### Features
- Responsive navigation bar
- Conditional menu items based on auth state
- Login/Logout button toggle
- Korean menu labels

### Usage

```tsx
// Included in app/layout.tsx
import Navbar from "@/components/Navbar";

<Navbar />
```

### Menu Structure

**Public (Always Visible)**:
- Home (`/`)
- 익명 게시판 (`/anonymous-board/list`)

**Authenticated Only**:
- 게시판 (`/board/list`)
- 내 게시글 (`/board/me`)
- 문서 분석 (`/documents/list`)
- 재무제표 분석 (`/financial-statements/list`)
- XBRL 분석 (`/xbrl-analysis`)

---

## FileUpload

File upload component with S3 integration.

### Location
`components/FileUpload.tsx`

### Type
Client Component (`"use client"`)

### Props
None (uses useUpload hook)

### Features
- PDF file selection
- Upload progress indicator
- Success/error feedback
- S3 key display on success

### Dependencies
- `@/features/upload/upload` hook

### Usage

```tsx
import FileUpload from "@/components/FileUpload";

<FileUpload />
```

### States

| State | Description |
|-------|-------------|
| `file` | Selected file object |
| `loading` | Upload in progress |
| `document` | Upload result (originalName, s3Key) |
| `error` | Error message |

---

## FinancialPipeline

Visual pipeline showing financial analysis progress.

### Location
`components/FinancialPipeline.tsx`

### Type
Server Component (no `"use client"`)

### Props

| Prop | Type | Description |
|------|------|-------------|
| `status` | string | Current pipeline status |

### Status Values

| Status | Description |
|--------|-------------|
| `metadata_only` | Initial state, awaiting PDF |
| `pdf_uploaded` | PDF extracted, ready for analysis |
| `ratios_calculated` | Ratios computed, LLM analysis next |
| `analysis_complete` | All stages complete |

### Pipeline Stages

1. **PDF 추출** - Extract financial data from PDF
2. **비율 계산** - Calculate financial ratios
3. **LLM 분석** - AI-powered analysis
4. **리포트 생성** - Generate PDF report

### Visual States

| Color | Meaning |
|-------|---------|
| Green (`bg-green-500`) | Complete |
| Yellow (`bg-yellow-500`) | Next/In Progress |
| Gray (`bg-gray-300`) | Pending |

### Usage

```tsx
import FinancialPipeline from "@/components/FinancialPipeline";

<FinancialPipeline status="pdf_uploaded" />
```

---

## Adding New Components

### Guidelines

1. **Client Components**: Add `"use client"` if using hooks
2. **Props Interface**: Define TypeScript interface for props
3. **Styling**: Use Tailwind CSS classes
4. **Path Alias**: Import with `@/` prefix

### Template

```tsx
// components/MyComponent.tsx
"use client";  // Only if needed

interface MyComponentProps {
    title: string;
    onClick?: () => void;
}

export default function MyComponent({ title, onClick }: MyComponentProps) {
    return (
        <div className="p-4 bg-white rounded shadow">
            <h2 className="text-lg font-bold">{title}</h2>
            {onClick && (
                <button
                    onClick={onClick}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
                >
                    Click
                </button>
            )}
        </div>
    );
}
```

## See Also

- [Architecture](../architecture/README.md)
- [API Integration](../api/README.md)
