# Setup Guide

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **MongoDB** (v6.0 or higher)
- **Redis** (v7.0 or higher)
- **Git**
- **npm** or **yarn**

---

## Environment Setup

### 1. Database Installation

#### MongoDB (Local)

**macOS (Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0
```

**Ubuntu:**
```bash
sudo apt-get install mongodb-org
sudo systemctl start mongod
```

**Windows:**
Download and install from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

**Verify Installation:**
```bash
mongosh --eval "db.version()"
```

#### MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create new cluster (free tier available)
3. Add IP to whitelist
4. Create database user
5. Copy connection string

#### Redis

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Docker (Recommended):**
```bash
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

**Verify Installation:**
```bash
redis-cli ping
# Should return: PONG
```

---

## Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/PodPlate-Platform.git
cd PodPlate-Platform
```

### 2. Install Dependencies

Navigate to each service and install dependencies:

```bash
# API Gateway
cd services/api-gateway && npm install

# Core Services
cd ../auth-service && npm install
cd ../user-service && npm install
cd ../product-service && npm install

# Transaction Services
cd ../cart-service && npm install
cd ../order-service && npm install
cd ../payment-service && npm install

# Supporting Services
cd ../restaurant-service && npm install
cd ../notification-service && npm install
```

**Or use the setup script:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

---

## Environment Configuration

### 1. Create Environment Files

Copy example files in each service:

```bash
cp services/api-gateway/.env.example services/api-gateway/.env
cp services/auth-service/.env.example services/auth-service/.env
# ... repeat for all services
```

### 2. Configure Environment Variables

#### API Gateway (.env)

```env
NODE_ENV=development
PORT=3000
SERVICE_NAME=api-gateway

# Service URLs
AUTH_SERVICE_URL=http://localhost:5001
USER_SERVICE_URL=http://localhost:5002
PRODUCT_SERVICE_URL=http://localhost:5003
CART_SERVICE_URL=http://localhost:5004
ORDER_SERVICE_URL=http://localhost:5005
PAYMENT_SERVICE_URL=http://localhost:5006
RESTAURANT_SERVICE_URL=http://localhost:5007
NOTIFICATION_SERVICE_URL=http://localhost:5008

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Auth Service (.env)

```env
NODE_ENV=development
PORT=5001
SERVICE_NAME=auth-service

# Database
MONGODB_URI=mongodb://localhost:27017/podplate_auth

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Logging
LOG_LEVEL=info
```

#### Cart Service (.env)

```env
NODE_ENV=development
PORT=5004
SERVICE_NAME=cart-service

# MongoDB
MONGODB_URI=mongodb://localhost:27017/podplate_cart

# Redis
REDIS_URL=redis://localhost:6379

# Service URLs
PRODUCT_SERVICE_URL=http://localhost:5003
AUTH_SERVICE_URL=http://localhost:5001
```

#### Order Service (.env)

```env
NODE_ENV=development
PORT=5005
SERVICE_NAME=order-service

# MongoDB
MONGODB_URI=mongodb://localhost:27017/podplate_orders

# Service URLs
CART_SERVICE_URL=http://localhost:5004
PAYMENT_SERVICE_URL=http://localhost:5006
PRODUCT_SERVICE_URL=http://localhost:5003
NOTIFICATION_SERVICE_URL=http://localhost:5008
AUTH_SERVICE_URL=http://localhost:5001

# Idempotency
IDEMPOTENCY_KEY_TTL=86400
```

#### Payment Service (.env)

```env
NODE_ENV=development
PORT=5006
SERVICE_NAME=payment-service

# MongoDB
MONGODB_URI=mongodb://localhost:27017/podplate_payments

# Service URLs
ORDER_SERVICE_URL=http://localhost:5005
AUTH_SERVICE_URL=http://localhost:5001
NOTIFICATION_SERVICE_URL=http://localhost:5008

# Payment Gateway (Test Keys)
PAYMENT_GATEWAY_KEY=test_key_here
PAYMENT_GATEWAY_SECRET=test_secret_here
```

### 3. MongoDB Atlas Configuration

If using MongoDB Atlas, replace local URI:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/podplate_service?retryWrites=true&w=majority
```

---

## Running the Application

### Development Mode

Start each service in a separate terminal (order matters):

**Terminal 1 - Core Services:**
```bash
cd services/auth-service && npm run dev
```

**Terminal 2:**
```bash
cd services/user-service && npm run dev
```

**Terminal 3:**
```bash
cd services/product-service && npm run dev
```

**Terminal 4 - Transaction Services:**
```bash
cd services/cart-service && npm run dev
```

**Terminal 5:**
```bash
cd services/order-service && npm run dev
```

**Terminal 6:**
```bash
cd services/payment-service && npm run dev
```

**Terminal 7 - Supporting Services:**
```bash
cd services/restaurant-service && npm run dev
```

**Terminal 8:**
```bash
cd services/notification-service && npm run dev
```

**Terminal 9 - API Gateway:**
```bash
cd services/api-gateway && npm run dev
```

**Terminal 10 - Frontend (Optional):**
```bash
cd frontend && npm run dev
```

### Using Concurrently (Alternative)

Install `concurrently` globally:
```bash
npm install -g concurrently
```

Create a root `package.json`:
```json
{
  "scripts": {
    "dev:auth": "cd services/auth-service && npm run dev",
    "dev:user": "cd services/user-service && npm run dev",
    "dev:product": "cd services/product-service && npm run dev",
    "dev:cart": "cd services/cart-service && npm run dev",
    "dev:order": "cd services/order-service && npm run dev",
    "dev:payment": "cd services/payment-service && npm run dev",
    "dev:restaurant": "cd services/restaurant-service && npm run dev",
    "dev:notification": "cd services/notification-service && npm run dev",
    "dev:gateway": "cd services/api-gateway && npm run dev",
    "dev": "concurrently \"npm run dev:auth\" \"npm run dev:user\" \"npm run dev:product\" \"npm run dev:cart\" \"npm run dev:order\" \"npm run dev:payment\" \"npm run dev:restaurant\" \"npm run dev:notification\" \"npm run dev:gateway\""
  }
}
```

Run all services:
```bash
npm run dev
```

---

## Verification

### 1. Health Checks

Verify all services are running:

```bash
# API Gateway
curl http://localhost:3000/health

# Auth Service
curl http://localhost:5001/health

# Check all services
for port in 3000 5001 5002 5003 5004 5005 5006 5007 5008; do
  echo "Checking port $port:"
  curl -s http://localhost:$port/health | jq '.success'
done
```

### 2. Test Authentication Flow

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login (saves cookie)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Access protected route
curl http://localhost:3000/api/auth/profile \
  -b cookies.txt
```

---

## Production Deployment

### Using PM2

1. **Install PM2:**
```bash
npm install -g pm2
```

2. **Create Ecosystem File** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [
    {
      name: 'api-gateway',
      cwd: './services/api-gateway',
      script: 'src/app.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'auth-service',
      cwd: './services/auth-service',
      script: 'src/app.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      }
    }
    // ... add other services
  ]
};
```

3. **Start Services:**
```bash
pm2 start ecosystem.config.js
```

4. **Monitor:**
```bash
pm2 monit
pm2 logs
```

---

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Refused

**Error:**
```
MongooseServerSelectionError: connect ECONNREFUSED ::1:27017
```

**Solutions:**
```bash
# Check MongoDB status
sudo systemctl status mongod  # Linux
brew services list | grep mongodb  # macOS

# Start MongoDB
sudo systemctl start mongod
brew services start mongodb-community@6.0

# Check URI format (use IPv4 if IPv6 issues)
MONGODB_URI=mongodb://127.0.0.1:27017/podplate_auth
```

#### 2. Redis Connection Error

**Error:**
```
Error: Redis connection failed
```

**Solutions:**
```bash
# Verify Redis is running
redis-cli ping

# Check Redis URL format
REDIS_URL=redis://localhost:6379
# or for Docker
REDIS_URL=redis://host.docker.internal:6379
```

#### 3. ESM Module Errors

**Error:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
```

**Solutions:**
- Ensure `"type": "module"` is in `package.json`
- Verify `.js` extensions on all imports
- Check that `node_modules` exists: `npm install`

#### 4. Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5001
```

**Solutions:**
```bash
# Find process using port
lsof -i :5001  # macOS/Linux
netstat -ano | findstr :5001  # Windows

# Kill process
kill -9 <PID>
# or change PORT in .env
```

#### 5. JWT Verification Failed

**Error:**
```
JsonWebTokenError: invalid signature
```

**Solutions:**
- Ensure `JWT_SECRET` is identical across all services
- Minimum 32 characters recommended
- Check for whitespace or special characters in .env

#### 6. CORS Errors in Browser

**Error:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions:**
```javascript
// Gateway CORS config
cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,  // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
})

// Frontend axios config
axios.defaults.withCredentials = true;
```

---

## Environment Variables Reference

### Required for All Services

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development`, `production` |
| `PORT` | Service port | `3000`, `5001` |
| `SERVICE_NAME` | Service identifier | `auth-service` |
| `MONGODB_URI` | MongoDB connection | `mongodb://localhost:27017/db` |
| `JWT_SECRET` | JWT signing key | `min-32-char-secret` |

### Service-Specific

| Service | Additional Variables |
|---------|---------------------|
| API Gateway | `*_SERVICE_URL` for all services |
| Cart | `REDIS_URL` |
| Order | `CART_SERVICE_URL`, `PAYMENT_SERVICE_URL`, `IDEMPOTENCY_KEY_TTL` |
| Payment | `ORDER_SERVICE_URL`, `PAYMENT_GATEWAY_KEY` |
| Notification | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` |

---

## Docker Setup (Optional)

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  auth-service:
    build: ./services/auth-service
    ports:
      - "5001:5001"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/podplate_auth
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongodb

  # ... add other services

volumes:
  mongo_data:
```

Run:
```bash
docker-compose up --build
```
