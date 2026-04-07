# Authentication System

## Overview

PodPlate uses a hybrid authentication system combining **HTTP-only cookies** and **JWT tokens**. This approach provides security against XSS attacks while maintaining stateless authentication suitable for microservices.

---

## Authentication Flow

### 1. Registration

```
┌─────────┐     ┌──────────┐     ┌─────────────┐     ┌─────────┐
│ Client  │────→│ Gateway  │────→│ Auth Service│────→│ MongoDB │
└─────────┘     └──────────┘     └─────────────┘     └─────────┘
     │                                    │                 │
     │                                    ↓                 │
     │                           1. Hash password          │
     │                           2. Create user            │
     │                                    │                 │
     │                                    ↓                 │
     │                           3. Generate JWT           │
     │                                    │                 │
     │                                    ↓                 │
     │                           4. Set HTTP-only cookie   │
     │                                    │                 │
     │←───────────────────────────────────┘                │
     │
   201 Created
   + Set-Cookie: token=<jwt>
```

**Code Flow:**
```javascript
// 1. Client sends registration request
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}

// 2. Auth Service processes
const hashedPassword = await bcrypt.hash(password, 10);
const user = await User.create({ name, email, password: hashedPassword });

// 3. Generate JWT
const token = jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// 4. Set HTTP-only cookie
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

---

### 2. Login

```
┌─────────┐     ┌──────────┐     ┌─────────────┐     ┌─────────┐
│ Client  │────→│ Gateway  │────→│ Auth Service│────→│ MongoDB │
└─────────┘     └──────────┘     └─────────────┘     └─────────┘
     │                                    │                 │
     │                                    ↓                 │
     │                           1. Find user by email      │
     │                                    │                 │
     │                                    ↓                 │
     │                           2. Compare password          │
     │                                    │                 │
     │                                    ↓                 │
     │                           3. Generate JWT            │
     │                                    │                 │
     │                                    ↓                 │
     │                           4. Set HTTP-only cookie      │
     │                                    │                 │
     │←───────────────────────────────────┘                │
     │
   200 OK
   + Set-Cookie: token=<jwt>
```

---

### 3. Protected Request

```
┌─────────┐     ┌──────────┐     ┌─────────────┐     ┌──────────┐
│ Client  │────→│ Gateway  │────→│ Middleware  │────→│ Service  │
│ (Cookie)│     │          │     │ (Validate)  │     │          │
└─────────┘     └──────────┘     └─────────────┘     └──────────┘
     │               │                  │                 │
     │──────────────→│                  │                 │
     │ Cookie: token │                  │                 │
     │               │                  │                 │
     │               │                  ↓                 │
     │               │           1. Extract token         │
     │               │           2. Verify JWT          │
     │               │           3. Add userId to headers │
     │               │                  │                 │
     │               │─────────────────→│                 │
     │               │ X-User-Id: id    │                 │
     │               │                  │────────────────→│
```

**Implementation:**

```javascript
// Gateway middleware
export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
```

---

## Security Features

### HTTP-only Cookies

**Why HTTP-only?**
- Prevents XSS attacks from stealing tokens via `document.cookie`
- Cookie is automatically sent with every request
- No JavaScript access to token value

**Cookie Configuration:**
```javascript
res.cookie('token', token, {
  httpOnly: true,        // No JavaScript access
  secure: true,          // HTTPS only in production
  sameSite: 'strict',    // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
});
```

---

### JWT Token Structure

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "id": "user_object_id",
  "role": "user",
  "iat": 1705312800,
  "exp": 1705917600
}
```

**Signature:**
```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  JWT_SECRET
)
```

---

### Password Hashing

Using bcrypt with salt rounds:

```javascript
import bcrypt from 'bcryptjs';

// Hash password (10 salt rounds = ~100ms)
const hashedPassword = await bcrypt.hash(plainPassword, 10);

// Compare password
const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
```

**Security Properties:**
- Adaptive hashing (slows down brute force)
- Salt prevents rainbow table attacks
- 10 rounds balances security and performance

---

### Role-Based Access Control (RBAC)

**Roles:**
- `user` - Standard customer
- `admin` - System administrator

**Middleware Implementation:**

```javascript
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
    next();
  };
};

// Usage
router.post('/products', requireAuth, authorize('admin'), createProduct);
```

---

## Token Lifecycle

### Token Expiration Strategy

**Current Implementation:**
- Access Token: 7 days
- No refresh token rotation (simplified for MVP)

**Future Enhancement:**
```
┌──────────┐     ┌──────────────┐     ┌─────────────┐
│  Short   │────→│    Valid     │────→│  Refresh    │
│  Access  │     │   Request    │     │   Token     │
│ (15 min) │     │              │     │  (7 days)   │
└──────────┘     └──────────────┘     └─────────────┘
      │                                    │
      │ Expired                            │ Expired
      ↓                                    ↓
┌──────────┐                         ┌──────────┐
│ 401 Error│                         │ Re-login │
└──────────┘                         └──────────┘
```

---

## Cross-Service Authentication

### Service-to-Service Key

Internal services use a shared secret for authentication:

```javascript
export const serviceAuth = (req, res, next) => {
  const serviceKey = req.headers['x-service-key'];
  
  if (serviceKey !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: 'Invalid service authentication' });
  }
  
  next();
};
```

### Token Forwarding

API Gateway forwards user context to services:

```javascript
// Gateway route
router.get('/orders', requireAuth, async (req, res) => {
  const response = await axios.get(
    `${ORDER_SERVICE_URL}/api/orders`,
    {
      headers: {
        'Authorization': req.headers.authorization,
        'X-User-Id': req.userId  // Forward user context
      }
    }
  );
  res.json(response.data);
});
```

---

## Frontend Integration

### Cookie Handling

**Axios Configuration:**
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,  // Important: send cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// No manual token handling needed - cookie is automatic
```

**Login Flow:**
```javascript
// React component
const handleLogin = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    // Cookie is automatically set by browser
    router.push('/dashboard');
  } catch (error) {
    setError(error.response?.data?.message);
  }
};
```

---

## Security Best Practices

### 1. Token Storage
✅ **Do:** Use HTTP-only cookies
❌ **Don't:** Store tokens in localStorage (XSS vulnerable)

### 2. HTTPS in Production
```javascript
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',  // HTTPS only
  sameSite: 'strict'
};
```

### 3. JWT Secret Management
```env
# .env
JWT_SECRET=minimum-32-character-long-secret-key-here
JWT_EXPIRE=7d
```

**Requirements:**
- Minimum 32 characters
- Cryptographically random
- Never commit to version control

### 4. Rate Limiting on Auth Endpoints
```javascript
export const rateLimiters = {
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 10,  // 10 attempts
    skipSuccessfulRequests: true
  })
};
```

### 5. Sensitive Data Redaction
```javascript
export const logger = pino({
  redact: {
    paths: ['req.headers.authorization', 'req.body.password', 'req.body.cvv'],
    remove: true
  }
});
```

---

## Troubleshooting

### Common Issues

#### Cookie Not Being Set
**Check:**
1. `withCredentials: true` in frontend axios config
2. CORS configuration allows credentials
3. SameSite cookie policy matches request origin

#### 401 Errors After Login
**Check:**
1. Cookie is being sent in request
2. JWT secret matches between services
3. Token has not expired
4. Cookie domain matches API domain

#### CORS Issues
```javascript
// Correct CORS config
cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,  // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
});
```
