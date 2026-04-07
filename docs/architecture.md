# System Architecture

## Overview

PodPlate Platform follows a microservices architecture pattern with an API Gateway as the single entry point. This design enables independent deployment, scaling, and maintenance of each service while maintaining a unified API surface for clients.

---

## Architecture Principles

### 1. Single Responsibility
Each microservice owns a specific business capability:
- **Auth Service**: Identity and access management
- **Cart Service**: Shopping cart operations and session management
- **Order Service**: Order lifecycle and state transitions
- **Payment Service**: Payment processing and transaction records

### 2. Database Per Service
Each service maintains its own data store, ensuring loose coupling:
- Services communicate via APIs, not shared databases
- Data consistency managed through service calls
- Independent schema evolution

### 3. API Gateway Pattern
All client requests route through the API Gateway:
- **Request Routing**: Forwards to appropriate microservice
- **Authentication**: Validates JWT tokens
- **Rate Limiting**: Protects backend services
- **Request Aggregation**: Combines multiple service responses

### 4. Asynchronous Communication
Services communicate using:
- **Synchronous**: HTTP/REST for real-time operations
- **Asynchronous**: Event-driven (future implementation with Kafka)

---

## Service Communication

### Synchronous Flow (Current Implementation)

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP Request
       ↓
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ API Gateway │────→│   Service   │────→│   MongoDB   │
│   :3000     │     │   :500x     │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Inter-Service Communication

```javascript
// Example: Order Service calling Cart Service
import axios from 'axios';

const cartResponse = await axios.get(
  `${process.env.CART_SERVICE_URL}/api/cart`,
  { headers: { Authorization: req.headers.authorization } }
);
```

### Service Registry

The API Gateway uses a simple service registry pattern:

```javascript
// services/api-gateway/src/services/serviceRegistry.js
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
  cart: process.env.CART_SERVICE_URL || 'http://localhost:5004',
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:5005',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:5006',
  product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:5003',
  user: process.env.USER_SERVICE_URL || 'http://localhost:5002',
  restaurant: process.env.RESTAURANT_SERVICE_URL || 'http://localhost:5007',
  notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5008'
};

export const getServiceUrl = (serviceName) => services[serviceName];
```

---

## Data Flow Examples

### Complete Purchase Flow

```
1. Login
   Client → Gateway → Auth Service → MongoDB
                              ↓
                        JWT Token + HTTP-only Cookie

2. Add to Cart
   Client → Gateway → Cart Service → Redis (session)
                              ↓
                        MongoDB (persistence)

3. Create Order
   Client → Gateway → Order Service
                              ↓
                        Validate Idempotency Key
                              ↓
                        Call Cart Service (clear cart)
                              ↓
                        Call Product Service (check stock)
                              ↓
                        Save to MongoDB

4. Process Payment
   Client → Gateway → Payment Service
                              ↓
                        Verify Order with Order Service
                              ↓
                        Process Payment
                              ↓
                        Record Transaction in MongoDB
                              ↓
                        Call Order Service (update status)

5. Send Notification
   Payment Service → Notification Service (async)
                              ↓
                        Send Email/SMS
```

---

## Fault Tolerance

### Circuit Breaker Pattern

Implemented in `shared/middleware/performance.js`:

```javascript
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }
  
  async execute(operation, ...args) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await operation(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

### Timeout Handling

All database queries have timeout protection:

```javascript
export const withTimeout = (promise, timeout = 10000, operation) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${operation} timed out`)), timeout)
    )
  ]);
};
```

---

## Service Boundaries

### Auth Service
**Responsibilities:**
- User registration and login
- JWT token generation and validation
- Password hashing (bcrypt)
- Role management (user, admin)

**Data:**
- User credentials
- JWT refresh tokens
- Role assignments

### Cart Service
**Responsibilities:**
- Add/remove cart items
- Calculate totals
- Session management
- Cart persistence

**Data:**
- Cart items (product/menu references)
- Quantities
- Session identifiers

### Order Service
**Responsibilities:**
- Order creation and lifecycle
- Status tracking (pending → confirmed → shipped → delivered)
- Idempotency handling
- Order history

**Data:**
- Order records
- Shipping addresses
- Order items snapshot
- Status history

### Payment Service
**Responsibilities:**
- Payment intent creation
- Payment processing
- Transaction recording
- Webhook handling

**Data:**
- Transaction records
- Payment method details (tokenized)
- Refund records

### Product Service
**Responsibilities:**
- Product catalog
- Category management
- Inventory tracking
- Search and filtering

**Data:**
- Product details
- Categories
- Stock levels
- Pricing

### Notification Service
**Responsibilities:**
- Email sending
- SMS notifications
- Push notifications
- Template management

**Data:**
- Notification logs
- User preferences
- Templates

---

## Deployment Architecture

### Development

```
Local Machine
├── MongoDB (localhost:27017)
├── Redis (localhost:6379)
├── 9 Microservices (ports 5001-5008, 3000)
└── Next.js Frontend (localhost:3001)
```

### Production (Future)

```
Kubernetes Cluster
├── Ingress Controller (API Gateway)
├── Auth Service Pods (3 replicas)
├── Cart Service Pods (3 replicas)
├── Order Service Pods (3 replicas)
├── Payment Service Pods (3 replicas)
├── MongoDB Replica Set
├── Redis Cluster
└── Monitoring Stack (Prometheus + Grafana)
```

---

## Security Architecture

### Authentication Flow

```
1. Login Request
   Client → Gateway → Auth Service
                              ↓
                        Validate Credentials
                              ↓
                        Generate JWT
                              ↓
                        Set HTTP-only Cookie
                              ↓
                        Response to Client

2. Protected Request
   Client (with cookie) → Gateway
                              ↓
                        Extract JWT from Cookie
                              ↓
                        Validate JWT
                              ↓
                        Add userId to headers
                              ↓
                        Forward to Service
```

### Service-to-Service Authentication

Internal services use a shared service key:

```javascript
export const serviceAuth = (req, res, next) => {
  const serviceKey = req.headers['x-service-key'];
  
  if (serviceKey !== process.env.INTERNAL_SERVICE_KEY) {
    return errorResponse(res, 403, 'Invalid service authentication');
  }
  
  next();
};
```

---

## Scalability Considerations

### Horizontal Scaling
- Stateless services (no session affinity)
- Externalized sessions (Redis)
- Independent database scaling per service

### Caching Strategy
- **Redis**: Session data, rate limit counters, cart data
- **Application**: In-memory circuit breaker state
- **CDN**: Static assets (frontend)

### Database Optimization
- Indexed queries (userId, orderId, status)
- Compound indexes for common queries
- Lean queries for read-heavy operations

---

## Monitoring & Observability

### Current Implementation
- Request logging with Pino
- Slow query detection
- Error tracking with stack traces

### Future Enhancements
- Prometheus metrics export
- Distributed tracing (Jaeger)
- Health check endpoints
- Performance dashboards (Grafana)
