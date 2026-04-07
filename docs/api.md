# API Documentation

## Base URLs

```
Development: http://localhost:3000/api
Production: https://api.yourdomain.com/api
```

---

## Authentication

The API uses HTTP-only cookies for session management. After login, the cookie is automatically included in subsequent requests.

### Authentication Header (Alternative)

For API clients that don't support cookies:

```
Authorization: Bearer <jwt_token>
```

---

## Response Format

All responses follow a standardized format:

### Success Response

```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... },
  "error": null,
  "meta": {
    "pagination": { ... }
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "error": {
    "code": 400,
    "message": "Detailed error message",
    "errors": {
      "field": "validation message"
    },
    "stack": "..." // Only in development
  }
}
```

---

## Auth Service

### POST /api/auth/register

Register a new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "user" // Optional, defaults to "user"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "jwt_token"
  }
}
```

**Errors:**
- `400` - Validation error (missing fields, invalid email)
- `409` - Email already exists

---

### POST /api/auth/login

Authenticate user and set session cookie.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
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

**Note:** Sets HTTP-only cookie `token=<jwt_token>`

**Errors:**
- `401` - Invalid credentials

---

### GET /api/auth/profile

Get authenticated user profile.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "phone": "+91 98765 43210",
      "addresses": [...]
    }
  }
}
```

---

### POST /api/auth/logout

Logout user and clear session.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Product Service

### GET /api/products

List all products with pagination and filtering.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `search` (string) - Search in name/description
- `category` (string) - Filter by category
- `minPrice` (number) - Minimum price filter
- `maxPrice` (number) - Maximum price filter
- `sort` (string) - `featured`, `price-low`, `price-high`, `newest`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_id",
        "name": "Product Name",
        "description": "Product description",
        "price": 299.99,
        "originalPrice": 399.99,
        "stock": 50,
        "category": "Electronics",
        "images": ["url1", "url2"],
        "ratings": {
          "average": 4.5,
          "count": 128
        }
      }
    ],
    "meta": {
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 150,
        "totalPages": 15,
        "hasNextPage": true,
        "hasPrevPage": false
      }
    }
  }
}
```

---

### GET /api/products/:id

Get single product details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "prod_id",
      "name": "Product Name",
      "description": "Detailed description...",
      "price": 299.99,
      "stock": 50,
      "category": "Electronics",
      "images": ["url1", "url2"]
    }
  }
}
```

**Errors:**
- `404` - Product not found

---

### POST /api/products

Create new product (Admin only).

**Auth Required:** Yes (Admin role)

**Request:**
```json
{
  "name": "New Product",
  "description": "Product description (min 10 chars)",
  "price": 199.99,
  "originalPrice": 249.99,
  "stock": 100,
  "category": "Electronics",
  "images": ["https://example.com/image1.jpg"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Product created",
  "data": { "product": { ... } }
}
```

---

## Cart Service

### GET /api/cart

Get current user's cart.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "cart": {
      "userId": "user_id",
      "items": [
        {
          "productId": "prod_id",
          "type": "product",
          "name": "Product Name",
          "image": "image_url",
          "price": 299.99,
          "quantity": 2
        }
      ],
      "totalItems": 2,
      "totalAmount": 599.98
    }
  }
}
```

---

### POST /api/cart/add

Add item to cart.

**Auth Required:** Yes

**Request:**
```json
{
  "itemId": "prod_id",
  "type": "product", // or "menu"
  "quantity": 2,
  "restaurantId": "rest_id" // Required for menu items
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "cart": { ... }
  }
}
```

---

### PUT /api/cart/update

Update cart item quantity.

**Auth Required:** Yes

**Request:**
```json
{
  "itemId": "prod_id",
  "type": "product",
  "quantity": 5
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Cart updated",
  "data": {
    "cart": { ... }
  }
}
```

---

### DELETE /api/cart/remove/:itemId

Remove item from cart.

**Auth Required:** Yes

**Query Parameters:**
- `type` (string, required) - `product` or `menu`

**Response (200):**
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

---

## Order Service

### POST /api/orders

Create new order (idempotent).

**Auth Required:** Yes

**Headers:**
- `X-Idempotency-Key` (string, required) - Unique key to prevent duplicate orders

**Request:**
```json
{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "country": "India"
  },
  "paymentMethod": "card", // card, cod, wallet, upi
  "notes": "Leave at door"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": "order_id",
      "userId": "user_id",
      "items": [...],
      "totalAmount": 599.98,
      "status": "pending",
      "shippingAddress": { ... },
      "paymentMethod": "card",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Idempotency:**
- Same `X-Idempotency-Key` within 24 hours returns the existing order
- Prevents duplicate charges and orders

---

### GET /api/orders

List user's orders.

**Auth Required:** Yes

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `status` (string) - Filter by status

**Response (200):**
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "meta": {
      "pagination": { ... }
    }
  }
}
```

---

### GET /api/orders/:id

Get order details.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_id",
      "status": "confirmed",
      "items": [...],
      "totalAmount": 599.98,
      "shippingAddress": { ... },
      "statusHistory": [
        { "status": "pending", "timestamp": "..." },
        { "status": "confirmed", "timestamp": "..." }
      ]
    }
  }
}
```

---

### PATCH /api/orders/:id/status

Update order status (Admin only).

**Auth Required:** Yes (Admin role)

**Request:**
```json
{
  "status": "shipped",
  "transactionId": "txn_123" // Optional
}
```

**Allowed Status Transitions:**
- `pending` → `confirmed`, `cancelled`
- `confirmed` → `processing`, `cancelled`
- `processing` → `shipped`
- `shipped` → `delivered`

---

## Payment Service

### POST /api/payments/intent

Create payment intent for order.

**Auth Required:** Yes

**Request:**
```json
{
  "orderId": "order_id",
  "method": "card" // card, wallet, upi
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_123_secret",
    "amount": 599.98,
    "currency": "INR"
  }
}
```

---

### POST /api/payments/process

Process payment.

**Auth Required:** Yes

**Request:**
```json
{
  "orderId": "order_id",
  "method": "card",
  "cardNumber": "4111111111111111",
  "expiry": "12/25",
  "cvv": "123",
  "transactionId": "txn_123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment successful",
  "data": {
    "transaction": {
      "id": "txn_id",
      "orderId": "order_id",
      "amount": 599.98,
      "status": "success",
      "method": "card"
    }
  }
}
```

---

### GET /api/payments/history

Get user's payment history.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_id",
        "orderId": "order_id",
        "amount": 599.98,
        "status": "success",
        "method": "card",
        "createdAt": "2024-01-15T10:35:00Z"
      }
    ]
  }
}
```

---

### POST /api/payments/callback

Payment gateway webhook (no auth required).

**Request:**
```json
{
  "orderId": "order_id",
  "status": "success",
  "gatewayTransactionId": "gateway_txn_123"
}
```

---

## Restaurant Service

### GET /api/restaurants

List all restaurants.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "restaurants": [
      {
        "id": "rest_id",
        "name": "Restaurant Name",
        "cuisine": "Italian",
        "rating": 4.5,
        "deliveryTime": "30-45 min",
        "minOrder": 200
      }
    ]
  }
}
```

---

### GET /api/restaurants/:id

Get restaurant details with menu.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "restaurant": {
      "id": "rest_id",
      "name": "Restaurant Name",
      "menu": [
        {
          "id": "item_id",
          "name": "Margherita Pizza",
          "price": 299,
          "category": "Pizza"
        }
      ]
    }
  }
}
```

---

## Notification Service

### GET /api/notifications

Get user notifications.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_id",
        "type": "order",
        "title": "Order Confirmed",
        "message": "Your order #123 has been confirmed",
        "isRead": false,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

### PATCH /api/notifications/:id/read

Mark notification as read.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

## User Service

### GET /api/users/profile

Get user profile.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+91 98765 43210",
      "addresses": [
        {
          "street": "123 Main St",
          "city": "Mumbai",
          "state": "Maharashtra",
          "zipCode": "400001",
          "country": "India"
        }
      ]
    }
  }
}
```

---

### PUT /api/users/profile

Update user profile.

**Auth Required:** Yes

**Request:**
```json
{
  "name": "John Updated",
  "phone": "+91 98765 43210",
  "address": {
    "street": "456 New St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400002",
    "country": "India"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated",
  "data": { "user": { ... } }
}
```

---

## Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 400 | Bad Request | Validation error or malformed request |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Service temporarily unavailable |

---

## Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Standard API | 100 requests | 15 minutes |
| Authentication | 10 attempts | 15 minutes |
| Payment | 5 attempts | 1 minute |

**Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Timestamp when limit resets
