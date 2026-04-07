# PodPlate Platform - API Contract Document

## Version: 1.0.0
## Date: April 2026
## Status: Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Standard Response Format](#standard-response-format)
3. [Authentication](#authentication)
4. [Error Handling](#error-handling)
5. [Pagination](#pagination)
6. [Service Endpoints](#service-endpoints)
7. [CORS Configuration](#cors-configuration)

---

## Overview

The PodPlate Platform is a microservices architecture consisting of the following services:

| Service | Port | Purpose |
|---------|------|---------|
| API Gateway | 3000 | Central entry point, routing, auth verification |
| Auth Service | 3001 | User registration, login, JWT management |
| User Service | 3002 | User profile management |
| Product Service | 3003 | Product catalog management |
| Restaurant Service | 3004 | Restaurant and menu management |
| Cart Service | 3005 | Shopping cart management |
| Order Service | 3006 | Order creation and management |
| Payment Service | 3007 | Payment processing |
| Notification Service | 3008 | Notifications and emails |

---

## Standard Response Format

All API responses follow a consistent structure:

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "error": null,
  "meta": { ... }  // Optional: pagination, counts, etc.
}
```

### Error Response

```json
{
  "success": false,
  "message": "Human-readable error description",
  "data": null,
  "error": {
    "code": 400,
    "message": "Detailed error message",
    "errors": {      // Optional: validation errors
      "fieldName": "Field-specific error message"
    },
    "stack": "..."   // Only in development mode
  }
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (new resource) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error, malformed request |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource, concurrent modification |
| 422 | Unprocessable | Business logic error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Unexpected server error |
| 503 | Service Unavailable | Service temporarily down |

---

## Authentication

### Authentication Method

The platform uses **HTTP-only cookies** for authentication:

1. Login/Register: Server sets `token` cookie with JWT
2. Subsequent requests: Browser automatically sends cookie
3. Logout: Server clears the cookie

### Cookie Configuration

```javascript
{
  httpOnly: true,        // Not accessible via JavaScript
  secure: true,          // HTTPS only in production
  sameSite: 'strict',    // CSRF protection
  maxAge: 30 days        // Token expiration
}
```

### Alternative: Authorization Header

For non-browser clients, use the Bearer token:

```
Authorization: Bearer <jwt_token>
```

### Protected Routes

All routes except the following require authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/restaurants`
- `GET /api/restaurants/:id`
- `GET /health`

---

## Error Handling

### Global Error Handler

All services use a centralized error handler that catches:

1. **Mongoose Validation Errors** → 400 Bad Request
2. **Duplicate Key Errors** → 400 Bad Request
3. **Cast Errors (Invalid ObjectId)** → 404 Not Found
4. **JWT Errors** → 401 Unauthorized
5. **Zod Validation Errors** → 400 Bad Request
6. **Axios Service Errors** → Forward status or 503

### Validation Errors

Zod validation provides detailed field-level errors:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": 400,
    "message": "Validation failed",
    "errors": {
      "email": "Invalid email address",
      "password": "Password must be at least 6 characters"
    }
  }
}
```

---

## Pagination

### Request Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number (1-indexed) |
| limit | integer | 10 | Items per page (max 100) |
| sort | string | -createdAt | Sort field and direction |

### Response Meta

```json
{
  "success": true,
  "message": "Items retrieved",
  "data": { "items": [...] },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 95,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## Service Endpoints

### 1. Auth Service (Port 3001)

#### POST /api/auth/register
Register a new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

#### POST /api/auth/login
Authenticate user and set cookie.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

**Cookie Set:** `token=<jwt>`

#### POST /api/auth/logout
Clear authentication cookie.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /api/auth/profile
Get current user profile.

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

---

### 2. User Service (Port 3002)

#### GET /api/users/profile
Get detailed user profile.

#### PUT /api/users/profile
Update user profile.

**Request:**
```json
{
  "name": "Jane Doe",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

---

### 3. Product Service (Port 3003)

#### GET /api/products
List products with filtering.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `search` (string): Search term
- `category` (string): Filter by category
- `sort` (string): `featured`, `price-low`, `price-high`, `newest`
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price

**Response (200):**
```json
{
  "success": true,
  "message": "Products retrieved",
  "data": {
    "products": [
      {
        "id": "prod_id",
        "name": "Product Name",
        "description": "Description",
        "price": 99.99,
        "originalPrice": 129.99,
        "stock": 50,
        "category": { "name": "Electronics" },
        "images": ["url1", "url2"],
        "ratings": { "average": 4.5, "count": 120 }
      }
    ]
  },
  "meta": {
    "pagination": { ... }
  }
}
```

#### GET /api/products/:id
Get single product.

#### POST /api/products (Admin)
Create new product.

---

### 4. Cart Service (Port 3005)

#### GET /api/cart
Get current cart.

**Response (200):**
```json
{
  "success": true,
  "message": "Cart retrieved",
  "data": {
    "cart": {
      "id": "cart_id",
      "items": [
        {
          "productId": "prod_id",
          "type": "product",
          "name": "Product Name",
          "image": "url",
          "price": 99.99,
          "quantity": 2
        }
      ],
      "totalItems": 2,
      "totalAmount": 199.98
    }
  }
}
```

#### POST /api/cart/add
Add item to cart.

**Request:**
```json
{
  "itemId": "product_id",
  "type": "product",
  "quantity": 1
}
```

#### PUT /api/cart/update
Update item quantity.

**Request:**
```json
{
  "itemId": "product_id",
  "type": "product",
  "quantity": 3
}
```

#### DELETE /api/cart/remove
Remove item from cart.

#### DELETE /api/cart/clear
Clear entire cart.

---

### 5. Order Service (Port 3006)

#### GET /api/orders
Get user orders with pagination.

#### POST /api/orders
Create order from cart.

**Request:**
```json
{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "card",
  "notes": "Leave at door",
  "idempotencyKey": "unique-key-for-duplicate-prevention"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Order created",
  "data": {
    "order": {
      "id": "order_id",
      "orderNumber": "ORD-123456",
      "totalAmount": 249.97,
      "status": "pending",
      "items": [...]
    }
  }
}
```

**Duplicate Prevention:**
If the same `idempotencyKey` is used within 24 hours, returns the existing order with 200 status.

#### GET /api/orders/:id
Get order details.

#### PATCH /api/orders/:id
Update order status (payment callback/admin).

**Request:**
```json
{
  "status": "confirmed",
  "transactionId": "txn_12345"
}
```

**Status Flow:**
- `pending` → `confirmed` | `cancelled`
- `confirmed` → `processing` | `cancelled`
- `processing` → `shipped` | `cancelled`
- `shipped` → `delivered` | `cancelled`
- `delivered` → (terminal)
- `cancelled` → (terminal)

---

### 6. Payment Service (Port 3007)

#### POST /api/payment/intent
Create payment intent.

**Request:**
```json
{
  "orderId": "order_id",
  "method": "card"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment intent created",
  "data": {
    "clientSecret": "secret_key",
    "transactionId": "txn_id",
    "amount": 249.97,
    "currency": "INR"
  }
}
```

#### POST /api/payment/process
Process payment with card details.

**Request:**
```json
{
  "orderId": "order_id",
  "method": "card",
  "cardNumber": "4111111111111111",
  "expiry": "12/25",
  "cvv": "123",
  "transactionId": "txn_id"
}
```

**Response (200 for success, 402 for failure):**
```json
{
  "success": true,
  "message": "Payment successful",
  "data": {
    "status": "success",
    "transactionId": "txn_xxx"
  }
}
```

#### GET /api/payment/history
Get payment history.

---

## CORS Configuration

### Allowed Origins
- `http://localhost:3000` (Frontend development)
- `http://localhost:3001` (Alternative port)
- Production frontend URL (configured via `FRONTEND_URL` env var)

### CORS Settings
```javascript
{
  origin: (origin, callback) => { ... },
  credentials: true,  // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Service-Key'
  ]
}
```

---

## Rate Limiting

### Standard Routes
- 100 requests per 15 minutes per IP

### Auth Routes (Login/Register)
- 10 requests per 15 minutes per IP
- Successful requests don't count toward limit

### Payment Routes
- 5 requests per minute per IP

---

## Security Headers

All responses include:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

---

## Idempotency

For critical operations (order creation), use idempotency keys:

1. Generate unique key on client (UUID recommended)
2. Include in request body: `idempotencyKey`
3. Server caches result for 24 hours
4. Duplicate requests with same key return cached result

**Best Practice:**
```javascript
const idempotencyKey = `${userId}-${Date.now()}-${Math.random()}`;
```

---

## Testing Checklist

### Auth Flow
- [ ] Register new user
- [ ] Login with correct credentials
- [ ] Login with wrong password (expect 401)
- [ ] Access protected route without token (expect 401)
- [ ] Access protected route with valid token
- [ ] Logout and verify cookie cleared
- [ ] Token expiration handling

### Cart Flow
- [ ] Add item to cart (authenticated)
- [ ] Add item to cart (guest)
- [ ] Update quantity
- [ ] Remove item
- [ ] Clear cart
- [ ] Cart persistence after login

### Order Flow
- [ ] Create order with valid cart
- [ ] Create order with empty cart (expect 400)
- [ ] Duplicate order with same idempotency key
- [ ] Order status transitions
- [ ] Cart cleared after order creation

### Payment Flow
- [ ] Create payment intent
- [ ] Process successful payment
- [ ] Process failed payment
- [ ] Payment callback/webhook
- [ ] Order status updated after payment

---

## Changelog

### v1.0.0 (2026-04-06)
- Initial API contract
- Standardized response format
- HTTP-only cookie authentication
- Zod validation schemas
- Global error handling
- Rate limiting implementation
- CORS configuration
- Idempotency support

---

## Contact

For API support or questions:
- Email: api-support@podplate.com
- Docs: https://docs.podplate.com
- Status: https://status.podplate.com
