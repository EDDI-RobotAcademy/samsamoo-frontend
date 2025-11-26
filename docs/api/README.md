# API Integration

Guide for integrating with the SamSamOO-AI-Server backend.

## Configuration

### Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:33333
NEXT_PUBLIC_GOOGLE_LOGIN_PATH=/authentication/google
```

### Base URL Access

```tsx
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
```

## Authentication

### Cookie-Based Sessions

All authenticated requests require `credentials: "include"`:

```tsx
fetch(`${API_BASE}/endpoint`, {
    credentials: "include",  // Required for session cookies
});
```

### Auth Context

```tsx
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
    const { isLoggedIn, logout, refresh } = useAuth();
    // ...
}
```

### Login Flow

```tsx
// Redirect to Google OAuth
const loginUrl = `${API_BASE}${GOOGLE_LOGIN_PATH}`;
window.location.href = loginUrl;
```

### Logout

```tsx
const { logout } = useAuth();

// Calls POST /authentication/logout
logout();
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/authentication/google` | Initiate OAuth |
| GET | `/authentication/status` | Check login status |
| POST | `/authentication/logout` | End session |

### Board (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/board/create` | Create board |
| GET | `/board/list` | List all boards |
| GET | `/board/me` | User's boards |
| GET | `/board/read/{id}` | Get board |
| PUT | `/board/update/{id}` | Update board |
| DELETE | `/board/delete/{id}` | Delete board |

### Anonymous Board

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/anonymouse-board/create` | Create board |
| GET | `/anonymouse-board/list` | List boards |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/documents/register` | Upload document |
| GET | `/documents/list` | List documents |

### Financial Statements

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/financial-statements/register` | Upload & analyze |
| GET | `/financial-statements/list` | List statements |
| GET | `/financial-statements/{id}` | Get details |
| POST | `/financial-statements/{id}/run-analysis` | Run analysis |

### XBRL Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/xbrl/company/{corp_code}` | Company info |
| GET | `/xbrl/statements/{corp_code}` | Financial statements |

## Request Patterns

### GET Request

```tsx
async function fetchData() {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/endpoint`,
        {
            credentials: "include",
        }
    );

    if (!response.ok) {
        throw new Error("Request failed");
    }

    return response.json();
}
```

### POST Request

```tsx
async function createItem(data: CreateItemRequest) {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/endpoint`,
        {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }
    );

    if (!response.ok) {
        throw new Error("Request failed");
    }

    return response.json();
}
```

### File Upload (FormData)

```tsx
async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/upload`,
        {
            method: "POST",
            credentials: "include",
            body: formData,
            // Don't set Content-Type for FormData
        }
    );

    return response.json();
}
```

## Type Definitions

Types are defined in `types/` directory:

```tsx
// types/financial-statement.ts
export interface FinancialStatement {
    id: number;
    company_name: string;
    fiscal_year: string;
    status: string;
    // ...
}
```

### Usage

```tsx
import { FinancialStatement } from "@/types/financial-statement";

const [statements, setStatements] = useState<FinancialStatement[]>([]);
```

## Error Handling

### HTTP Errors

```tsx
async function fetchWithErrorHandling() {
    try {
        const response = await fetch(url, { credentials: "include" });

        if (response.status === 401) {
            // Not authenticated
            redirect("/login");
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Request failed");
        }

        return response.json();
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}
```

### Network Errors

```tsx
try {
    await fetchData();
} catch (error) {
    if (error instanceof TypeError) {
        // Network error (CORS, connection refused, etc.)
        console.error("Network error - check backend connection");
    }
}
```

## See Also

- [Backend API Docs](../../../SamSamOO-AI-Server/docs/api/README.md)
- [Architecture](../architecture/README.md)
- [Swagger UI](http://localhost:33333/docs)
