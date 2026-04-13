# PodPlate - DevOps Handover Guide

## 🚀 Quick Start for DevOps

### 1. Prerequisites
- AWS CLI configured
- Node.js 20+ installed
- Access to AWS Console

### 2. Environment Setup

```bash
# Clone repo
git clone https://github.com/your-org/podplate.git
cd podplate

# Create production environment file
cp .env.production.example .env.production
# Edit with real values from AWS Secrets Manager
nano .env.production
```

### 3. Database Setup (Neon PostgreSQL)

Create 9 databases in Neon Console:
1. auth_db
2. user_db
3. product_db
4. restaurant_db
5. cart_db
6. order_db
7. payment_db
8. notification_db

Run migrations:
```bash
for service in auth user product restaurant cart order payment notification; do
  cd "services/${service}-service"
  cp .env.production .env
  npm run db:setup
  cd ../..
done
```

### 4. Docker Build & Push

```bash
# Build all services
docker build -t your-registry/podplate-api-gateway:latest ./services/api-gateway
docker build -t your-registry/podplate-auth-service:latest ./services/auth-service
# ... repeat for all 9 services

# Push to ECR
docker push your-registry/podplate-api-gateway:latest
# ... push all services
```

### 5. AWS Infrastructure (Terraform/CDK recommended)

Required resources:
- VPC with public/private subnets
- ECS Cluster (Fargate)
- ALB with SSL certificate
- ElastiCache Redis (Cart Service)
- S3 bucket (Product images)
- Secrets Manager (Environment variables)

### 6. Service Health Checks

All services expose:
- `GET /health` - Basic health check
- Returns: `{ success: true, database: "connected" }`

Use these for ALB target group health checks.

### 7. Environment Variables

Critical vars for production:
- `DATABASE_URL` (9 different Neon URLs)
- `REDIS_URL` (ElastiCache endpoint)
- `JWT_SECRET` (generate: openssl rand -base64 32)
- `STRIPE_SECRET_KEY` (from Stripe Dashboard)
- `SENDGRID_API_KEY` (from SendGrid)

Store these in AWS Secrets Manager, NOT in Git!

### 8. Deployment Order

1. Databases (Neon)
2. Redis (ElastiCache)
3. Core Services: Auth → User → Product → Restaurant
4. Supporting: Cart → Order → Payment → Notification
5. API Gateway (last)

### 9. Verification

```bash
# Test API Gateway
curl https://api.yourdomain.com/health

# Test product service
curl https://api.yourdomain.com/api/products

# Test authentication
curl -X POST https://api.yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test"}'
```

### 10. Monitoring

- All services use Pino logging (structured JSON)
- Logs go to stdout (configure CloudWatch in ECS)
- Request IDs are generated for tracing

### 11. Security Notes

- JWT tokens stored in HTTP-only cookies
- CORS configured with credentials
- Rate limiting enabled on all endpoints
- Input sanitization for SQL injection protection
- Helmet headers enabled

## 📞 Support

Application Architecture:
- 9 Microservices (Node.js + Express + Drizzle ORM)
- PostgreSQL per service (Neon)
- Redis for sessions (Cart)
- JWT authentication
- REST API (Gateway pattern)

Contact: [Your email/Slack]
