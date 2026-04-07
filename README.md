# PodPlate Platform

A production-grade, microservices-based e-commerce platform built with Node.js (ESM) and Next.js 14. Features secure authentication, API gateway routing, idempotent order handling, and comprehensive observability.

![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green?style=flat-square&logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-7.0-red?style=flat-square&logo=redis)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Setup Instructions](#-setup-instructions)
- [API Overview](#-api-overview)
- [Testing](#-testing)
- [Security](#-security)
- [Documentation](#-documentation)
- [Future Roadmap](#-future-roadmap)
- [Author](#-author)

---

## 🚀 Features

### Core Platform
- **Microservices Architecture**: 9 independent services with clear separation of concerns
- **API Gateway**: Single entry point with routing, rate limiting, and request aggregation
- **Secure Authentication**: HTTP-only cookies + JWT with refresh token rotation
- **Idempotent Operations**: Prevents duplicate orders and payments via idempotency keys
- **Real-time Notifications**: Email, SMS, and push notification support

### Backend Capabilities
- **ESM Native**: Full ES Module system (no CommonJS)
- **Input Validation**: Zod schema validation across all endpoints
- **Rate Limiting**: Per-user and per-endpoint rate limiting with Redis
- **Structured Logging**: Pino logger with request tracing and redaction
- **Circuit Breaker**: Fault tolerance for inter-service communication
- **Performance Monitoring**: Query timeout handling and slow query logging

### Frontend Integration
- **Next.js 14**: App Router with Server Components
- **State Management**: Zustand for client state, React Query for server state
- **Type Safety**: Full TypeScript support across frontend and backend
- **Responsive Design**: Tailwind CSS with mobile-first approach

---

## 🏗️ Architecture

### Microservices Overview

| Service | Port | Responsibility | Database |
|---------|------|----------------|----------|
| **Auth Service** | 5001 | User registration, login, JWT management | MongoDB |
| **User Service** | 5002 | Profile management, addresses, preferences | MongoDB |
| **Product Service** | 5003 | Catalog, categories, inventory | MongoDB |
| **Cart Service** | 5004 | Shopping cart, session management | MongoDB + Redis |
| **Order Service** | 5005 | Order lifecycle, status tracking | MongoDB |
| **Payment Service** | 5006 | Payment processing, transactions | MongoDB |
| **Restaurant Service** | 5007 | Restaurant listings, menu management | MongoDB |
| **Notification Service** | 5008 | Email, SMS, push notifications | MongoDB |
| **API Gateway** | 3000 | Routing, auth, rate limiting, aggregation | - |

### Request Flow

```
Client Request
     ↓
API Gateway (Port 3000)
     ↓
[Auth Check] → [Rate Limit] → [Validation]
     ↓
Service Router
     ↓
┌─────────────┬─────────────┬─────────────┐
│   Auth      │    Cart     │   Order     │
│   Service   │   Service   │   Service   │
│   (5001)    │   (5004)    │   (5005)    │
└─────────────┴─────────────┴─────────────┘
     ↓              ↓              ↓
   MongoDB       MongoDB        MongoDB
   + Redis
```

### Transaction Flow Example

```
1. User Login → Auth Service (JWT + HTTP-only cookie)
        ↓
2. Add to Cart → Cart Service (Redis for session, MongoDB for persistence)
        ↓
3. Create Order → Order Service (idempotency key validation)
        ↓
4. Process Payment → Payment Service (transaction record)
        ↓
5. Send Notification → Notification Service (email confirmation)
        ↓
6. Update Order Status → Order Service (webhook callback)
```

---

## 💻 Tech Stack

### Backend
- **Runtime**: Node.js 18+ (ESM)
- **Framework**: Express.js 4.x
- **Database**: MongoDB 6.0 with Mongoose ODM
- **Cache**: Redis 7.0 (sessions, rate limiting, cart)
- **Validation**: Zod
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **HTTP Client**: Axios
- **Logging**: Pino
- **Security**: Helmet, express-mongo-sanitize, express-rate-limit

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand + React Query (TanStack Query)
- **Forms**: React Hook Form + Zod resolver
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

### DevOps & Tools
- **Process Manager**: PM2 (production)
- **API Testing**: Postman / Insomnia
- **Version Control**: Git with conventional commits
- **Environment**: dotenv for configuration management

---

## 📁 Project Structure

```
PodPlate-Platform/
├── services/                    # Backend microservices
│   ├── api-gateway/            # API Gateway (port 3000)
│   │   └── src/
│   │       ├── app.js
│   │       ├── middleware/
│   │       ├── routes/
│   │       └── services/
│   ├── auth-service/           # Authentication (port 5001)
│   │   └── src/
│   │       ├── app.js
│   │       ├── controllers/
│   │       ├── models/
│   │       ├── routes/
│   │       └── middleware/
│   ├── cart-service/           # Shopping cart (port 5004)
│   ├── order-service/          # Order management (port 5005)
│   ├── payment-service/         # Payment processing (port 5006)
│   ├── product-service/         # Product catalog (port 5003)
│   ├── user-service/            # User profiles (port 5002)
│   ├── restaurant-service/      # Restaurant data (port 5007)
│   ├── notification-service/    # Notifications (port 5008)
│   └── shared/                  # Shared utilities
│       ├── middleware/          # Common middleware (auth, validation, error handling)
│       ├── utils/               # Utilities (logger, response helpers)
│       └── config/              # Shared configuration
├── frontend/                    # Next.js frontend
│   ├── app/                     # App Router
│   ├── components/              # React components
│   ├── lib/                     # Utilities, hooks
│   └── store/                   # Zustand stores
├── docs/                        # Documentation
│   ├── architecture.md
│   ├── api.md
│   ├── auth.md
│   ├── database.md
│   └── setup.md
├── .env.example                 # Environment template
└── README.md                    # This file
```

---

## 🔧 Setup Instructions

### Prerequisites

- **Node.js**: 18.x or higher
- **MongoDB**: 6.0 or higher (local or Atlas)
- **Redis**: 7.0 or higher
- **Git**: For cloning the repository

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/PodPlate-Platform.git
   cd PodPlate-Platform
   ```

2. **Install dependencies for all services**
   ```bash
   # Install gateway dependencies
   cd services/api-gateway && npm install
   
   # Install auth service
   cd ../auth-service && npm install
   
   # Install remaining services
   cd ../cart-service && npm install
   cd ../order-service && npm install
   cd ../payment-service && npm install
   cd ../product-service && npm install
   cd ../user-service && npm install
   cd ../restaurant-service && npm install
   cd ../notification-service && npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy example env files in each service
   cp services/auth-service/.env.example services/auth-service/.env
   cp services/api-gateway/.env.example services/api-gateway/.env
   # ... repeat for all services
   ```

### Environment Variables

Create `.env` files in each service directory:

```env
# Example .env for auth-service
NODE_ENV=development
PORT=5001
SERVICE_NAME=auth-service
MONGODB_URI=mongodb://localhost:27017/podplate_auth
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7
```

Full environment configuration: [docs/setup.md](./docs/setup.md)

### Running the Project

**Development Mode** (using separate terminals):

```bash
# Terminal 1: Core Services
cd services/auth-service && npm run dev      # Port 5001
cd services/user-service && npm run dev      # Port 5002
cd services/product-service && npm run dev   # Port 5003

# Terminal 2: Transaction Services
cd services/cart-service && npm run dev      # Port 5004
cd services/order-service && npm run dev     # Port 5005
cd services/payment-service && npm run dev     # Port 5006

# Terminal 3: Supporting Services
cd services/restaurant-service && npm run dev      # Port 5007
cd services/notification-service && npm run dev    # Port 5008

# Terminal 4: API Gateway
cd services/api-gateway && npm run dev       # Port 3000

# Terminal 5: Frontend
cd frontend && npm run dev                   # Port 3001
```

**Production Mode** (using PM2):

```bash
# Start all services with PM2
pm2 start services/api-gateway/ecosystem.config.js
pm2 start services/auth-service/ecosystem.config.js
# ... etc for all services

# Or use the startup script
./scripts/start-production.sh
```

---

## 🌐 API Overview

### Base URL

```
Development: http://localhost:3000/api
Production: https://api.yourdomain.com/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/profile` | Get user profile | Yes |
| POST | `/api/auth/logout` | Logout user | Yes |

### Product Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/products` | List all products | No |
| GET | `/api/products/:id` | Get single product | No |
| POST | `/api/products` | Create product | Admin |
| PUT | `/api/products/:id` | Update product | Admin |

### Cart Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/cart` | Get cart items | Yes |
| POST | `/api/cart/add` | Add item to cart | Yes |
| PUT | `/api/cart/update` | Update cart item | Yes |
| DELETE | `/api/cart/remove/:itemId` | Remove item | Yes |

### Order Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/orders` | Create order | Yes |
| GET | `/api/orders` | List user orders | Yes |
| GET | `/api/orders/:id` | Get order details | Yes |
| PATCH | `/api/orders/:id/status` | Update status | Admin |

### Payment Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/payments/intent` | Create payment intent | Yes |
| POST | `/api/payments/process` | Process payment | Yes |
| GET | `/api/payments/history` | Payment history | Yes |

Full API documentation: [docs/api.md](./docs/api.md)

---

## 🧪 Testing

### Manual Testing Flow

#### 1. Authentication Flow
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login (sets HTTP-only cookie)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Access protected route
curl http://localhost:3000/api/auth/profile \
  -b cookies.txt
```

#### 2. Cart Flow
```bash
# Add item to cart
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"itemId":"product-id-123","type":"product","quantity":2}'

# View cart
curl http://localhost:3000/api/cart \
  -b cookies.txt
```

#### 3. Order Flow
```bash
# Create order (idempotent with X-Idempotency-Key)
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: unique-key-123" \
  -b cookies.txt \
  -d '{
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zipCode": "400001",
      "country": "India"
    },
    "paymentMethod": "card"
  }'
```

#### 4. Payment Flow
```bash
# Create payment intent
curl -X POST http://localhost:3000/api/payments/intent \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"orderId":"order-id-123","method":"card"}'

# Process payment
curl -X POST http://localhost:3000/api/payments/process \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "orderId":"order-id-123",
    "method":"card",
    "cardNumber":"4111111111111111",
    "expiry":"12/25",
    "cvv":"123",
    "transactionId":"txn-123"
  }'
```

---

## 🔒 Security

### Authentication & Authorization
- **HTTP-only Cookies**: JWT tokens stored in secure, HTTP-only cookies
- **CSRF Protection**: Cookie-based CSRF tokens for state-changing operations
- **JWT Validation**: Short-lived access tokens (15 min) with refresh token rotation
- **Role-based Access**: User and Admin role separation

### Input Protection
- **Schema Validation**: Zod validation on all request bodies, queries, and params
- **NoSQL Injection Prevention**: express-mongo-sanitize removes `$` and `.` operators
- **XSS Protection**: Helmet security headers and input sanitization
- **SQL Injection**: Not applicable (MongoDB with Mongoose)

### Rate Limiting
- **Standard API**: 100 requests per 15 minutes per user/IP
- **Auth Endpoints**: 10 attempts per 15 minutes
- **Payment Endpoints**: 5 attempts per minute
- **Gateway Level**: Additional protection at API Gateway

### Data Protection
- **Sensitive Data Redaction**: Passwords, CVV, card numbers excluded from logs
- **Request Tracing**: Unique request IDs for debugging without exposing data
- **Environment Separation**: Strict NODE_ENV checks for dev-only features

---

## 📚 Documentation

- [Architecture Overview](./docs/architecture.md) - Microservices design and communication
- [API Reference](./docs/api.md) - Complete endpoint documentation
- [Database Schema](./docs/database.md) - MongoDB collections and indexes
- [Authentication Flow](./docs/auth.md) - Cookie and JWT implementation
- [Setup Guide](./docs/setup.md) - Detailed installation and configuration

---

## 🗺️ Future Roadmap

### Phase 1: Enhanced Observability
- [ ] Prometheus metrics collection
- [ ] Grafana dashboards for service health
- [ ] Distributed tracing with Jaeger
- [ ] Centralized logging with ELK stack

### Phase 2: Event-Driven Architecture
- [ ] Apache Kafka for async communication
- [ ] Event sourcing for order lifecycle
- [ ] Saga pattern for distributed transactions
- [ ] Webhook system for third-party integrations

### Phase 3: Infrastructure
- [ ] Kubernetes deployment manifests
- [ ] Docker Compose for local development
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Terraform for AWS infrastructure

### Phase 4: Advanced Features
- [ ] Real-time order tracking with WebSockets
- [ ] Multi-tenancy support
- [ ] Advanced analytics and reporting
- [ ] Mobile app (React Native)

---

## 👨‍💻 Author

**Raman Mohapatra**

- Full-Stack Software Engineer
- Specializing in Node.js, React, and Microservices Architecture
- Passionate about building scalable, production-ready systems

**Connect:**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [linkedin.com/in/yourprofile](https://linkedin.com/in/yourprofile)
- Email: your.email@example.com

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Express.js team for the robust web framework
- MongoDB and Redis communities for excellent documentation
- Next.js team for the modern React framework
- All open-source contributors whose libraries made this possible
