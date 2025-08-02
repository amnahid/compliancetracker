# 🌐 API Overview

## Introduction

The Healthcare Compliance Application provides a comprehensive REST API built with Next.js API Routes. All endpoints follow RESTful conventions and return JSON responses.

## Base URL

```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

## Authentication

Most API endpoints require authentication using NextAuth.js sessions. Include the session cookie with requests.

### Session-Based Authentication

```typescript
// Frontend usage with fetch
const response = await fetch('/api/protected-endpoint', {
  method: 'GET',
  credentials: 'include', // Include session cookie
});
```

### Server-Side Session Validation

```typescript
// In API routes
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Protected logic here
}
```

## Response Format

### Success Response

```json
{
  "data": {},
  "message": "Operation successful",
  "status": 200
}
```

### Error Response

```json
{
  "error": "Error description",
  "status": 400,
  "code": "VALIDATION_ERROR"
}
```

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 500 | Internal Error | Server error |

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/signup
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "organization": "Healthcare Corp"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "userId": "64a7b8c9d0e1f2g3h4i5j6k7"
}
```

**Validation Rules:**
- `name`: Required, 2-50 characters
- `email`: Required, valid email format
- `password`: Required, minimum 8 characters
- `organization`: Optional, max 100 characters

#### POST /api/auth/upgrade-role
Upgrade user role to admin using bootstrap codes.

**Request Body:**
```json
{
  "upgradeCode": "FIRST_ADMIN_2024"
}
```

**Valid Codes:**
- `FIRST_ADMIN_2024`
- `BOOTSTRAP_ADMIN`

#### DELETE /api/auth/delete-account
Delete current user's account.

**Request Body:**
```json
{
  "password": "userpassword",
  "confirmDelete": "DELETE"
}
```

### User Management Endpoints

#### GET /api/admin/users
Get list of all users (Admin only).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term for name/email
- `role`: Filter by role (user/admin)

**Response:**
```json
{
  "users": [
    {
      "id": "64a7b8c9d0e1f2g3h4i5j6k7",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "organization": "Healthcare Corp",
      "subscription": {
        "status": "active",
        "plan": "Professional"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "totalPages": 15
}
```

#### PATCH /api/admin/users/[id]/role
Update user role (Admin only).

**URL Parameters:**
- `id`: User ID

**Request Body:**
```json
{
  "role": "admin"
}
```

**Safety Checks:**
- Cannot demote yourself
- Cannot demote last admin

#### DELETE /api/admin/users/[id]
Delete user account (Admin only).

**URL Parameters:**
- `id`: User ID

**Safety Checks:**
- Cannot delete yourself
- Cannot delete last admin
- Automatically cancels Stripe subscriptions

### Payment Endpoints

#### POST /api/stripe/create-checkout-session
Create Stripe checkout session for subscription.

**Request Body:**
```json
{
  "priceId": "price_1234567890abcdef"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_1234567890abcdef"
}
```

#### POST /api/stripe/webhook
Handle Stripe webhook events.

**Headers Required:**
- `stripe-signature`: Webhook signature

**Handled Events:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### Admin Statistics

#### GET /api/admin/stats
Get application statistics (Admin only).

**Response:**
```json
{
  "users": {
    "total": 1500,
    "admins": 5,
    "activeSubscriptions": 1200,
    "trialUsers": 150
  },
  "revenue": {
    "monthly": 25000,
    "annual": 300000
  },
  "growth": {
    "newUsersThisMonth": 100,
    "churnRate": 0.05
  }
}
```

## Error Handling

### Common Error Codes

#### VALIDATION_ERROR (400)
```json
{
  "error": "Validation failed",
  "details": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  },
  "status": 400,
  "code": "VALIDATION_ERROR"
}
```

#### UNAUTHORIZED (401)
```json
{
  "error": "Authentication required",
  "status": 401,
  "code": "UNAUTHORIZED"
}
```

#### FORBIDDEN (403)
```json
{
  "error": "Admin access required",
  "status": 403,
  "code": "FORBIDDEN"
}
```

#### NOT_FOUND (404)
```json
{
  "error": "User not found",
  "status": 404,
  "code": "NOT_FOUND"
}
```

#### CONFLICT (409)
```json
{
  "error": "Email already exists",
  "status": 409,
  "code": "CONFLICT"
}
```

## Rate Limiting

### Default Limits

- **Authentication endpoints**: 10 requests per minute
- **User management**: 100 requests per minute
- **General API**: 1000 requests per hour

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60,
  "status": 429,
  "code": "RATE_LIMIT_EXCEEDED"
}
```

## Pagination

### Request Parameters

```
GET /api/admin/users?page=2&limit=20
```

### Response Format

```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": true
  }
}
```

## Filtering and Searching

### Query Parameters

#### User Endpoints
- `search`: Search in name, email, organization
- `role`: Filter by user role
- `status`: Filter by subscription status
- `organization`: Filter by organization
- `createdAfter`: Filter by creation date
- `createdBefore`: Filter by creation date

#### Example
```
GET /api/admin/users?search=john&role=admin&status=active
```

## Data Validation

### Input Validation Rules

#### User Data
```typescript
const userValidation = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/
  },
  email: {
    required: true,
    format: 'email',
    maxLength: 100
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
  },
  organization: {
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s&.-]+$/
  }
};
```

#### Role Validation
```typescript
const validRoles = ['user', 'admin'];
const validSubscriptionStatuses = [
  'active', 
  'trialing', 
  'past_due', 
  'canceled', 
  'unpaid'
];
```

## Security Headers

### Required Headers

All API responses include security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

## CORS Configuration

### Allowed Origins

```typescript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

## API Versioning

### Current Version

All endpoints are currently version 1 (v1). Future versions will be introduced as:

```
/api/v2/endpoint
```

### Backward Compatibility

- v1 endpoints will be maintained for 12 months after v2 release
- Deprecation notices will be sent 6 months before removal
- New features will be added to the latest version only

## Testing API Endpoints

### Using cURL

```bash
# Register new user
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "testpass123",
    "organization": "Test Corp"
  }'

# Get users (requires admin session)
curl -X GET http://localhost:3000/api/admin/users \
  -H "Cookie: next-auth.session-token=your-session-token"
```

### Using Postman

1. Import the API collection
2. Set up environment variables
3. Configure authentication
4. Test endpoints with sample data

### Using API Client Libraries

```typescript
// Example with axios
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
});

// Create user
const createUser = async (userData) => {
  const response = await apiClient.post('/auth/signup', userData);
  return response.data;
};

// Get users
const getUsers = async (params) => {
  const response = await apiClient.get('/admin/users', { params });
  return response.data;
};
```

## Monitoring and Logging

### Request Logging

All API requests are logged with:

- Timestamp
- HTTP method and path
- User agent
- IP address
- Response status
- Response time

### Error Tracking

Errors are tracked with:

- Error message and stack trace
- Request context
- User information
- Environment details

### Analytics

API usage analytics include:

- Endpoint popularity
- Response times
- Error rates
- User activity patterns

---

**Next: Dive deeper into [Authentication APIs](./12-auth-apis.md)!**
