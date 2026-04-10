# PodPlate Platform - Dependency Fix Documentation

## Problem Summary

Node.js threw `ERR_MODULE_NOT_FOUND` errors when importing shared middleware because:
1. Shared dependencies (`cors`, `helmet`, `express-rate-limit`, etc.) were missing from service package.json files
2. Import paths were incorrect (using `../shared/` instead of `../../shared/`)

## Solution Applied

### 1. Root package.json with npm Workspaces

Created `@/package.json` with npm workspaces configuration:

```json
{
  "name": "podplate-platform",
  "type": "module",
  "private": true,
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "workspaces": [
    "services/*"
  ],
  "scripts": {
    "install:all": "npm install && npm run install:services",
    "clean": "npm run clean:modules && npm run clean:locks",
    "reinstall": "npm run clean && npm install"
  }
}
```

### 2. Updated All Service package.json Files

Added shared dependencies to all services:

**Common Shared Dependencies (add to ALL services):**
```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-mongo-sanitize": "^2.2.0",
    "express-rate-limit": "^7.1.0",
    "helmet": "^7.1.0",
    "mongoose": "^8.0.0",
    "pino": "^8.16.0",
    "pino-pretty": "^10.2.0",
    "uuid": "^9.0.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**Services Updated:**
- `@services/api-gateway/package.json`
- `@services/user-service/package.json`
- `@services/cart-service/package.json`
- `@services/payment-service/package.json`
- `@services/restaurant-service/package.json`
- `@services/notification-service/package.json`

### 3. Import Path Fix in api-gateway

Fixed imports in `@services/api-gateway/src/app.js`:

```javascript
// Before (INCORRECT):
import { globalErrorHandler } from '../shared/middleware/errorHandler.js';

// After (CORRECT):
import { globalErrorHandler } from '../../shared/middleware/errorHandler.js';
```

All shared imports must use `../../shared/` because `app.js` is inside `src/` directory.

### 4. Shared Middleware Dependencies Reference

The `services/shared/` folder requires these dependencies:

| File | Dependencies Required |
|------|----------------------|
| `config/middleware.js` | `cors`, `helmet`, `express-rate-limit` |
| `middleware/security.js` | `express-mongo-sanitize`, `express-rate-limit` |
| `middleware/performance.js` | `mongoose` |
| `utils/logger.js` | `pino`, `pino-pretty`, `uuid` |

## Quick Commands

### Clean & Reinstall All Dependencies

**Windows (Git Bash/MINGW64):**
```bash
# Using the provided script
./scripts/reinstall.sh

# Or manually
cd /d/Raman/personal_projects/PodPlate-Platform
rm -rf services/*/node_modules
rm -rf services/*/package-lock.json
rm -rf node_modules package-lock.json
npm install
cd services/api-gateway && npm install
```

**Windows (CMD/PowerShell):**
```cmd
:: Using the provided batch script
scripts\reinstall.bat
```

### Start Individual Services

```bash
# API Gateway
cd services/api-gateway && npm run dev

# Auth Service
cd services/auth-service && npm run dev

# Other services...
cd services/user-service && npm run dev
cd services/product-service && npm run dev
cd services/cart-service && npm run dev
cd services/order-service && npm run dev
cd services/payment-service && npm run dev
cd services/restaurant-service && npm run dev
cd services/notification-service && npm run dev
```

### Using Root npm Scripts

```bash
# From project root
cd /d/Raman/personal_projects/PodPlate-Platform

# Install all dependencies
npm run install:all

# Clean everything
npm run clean

# Reinstall everything
npm run reinstall

# Start specific service
npm run dev:gateway
npm run dev:auth
```

## ESM Import Syntax Examples

### Correct ESM Syntax for Shared Imports

```javascript
// ✅ CORRECT: Use .js extension for local files
import { globalErrorHandler } from '../../shared/middleware/errorHandler.js';
import { corsConfig } from '../../shared/config/middleware.js';
import { requestLogger } from '../../shared/utils/logger.js';

// ✅ CORRECT: Named imports from packages
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// ❌ INCORRECT: Missing .js extension for local files
import { errorHandler } from '../../shared/middleware/errorHandler';

// ❌ INCORRECT: Using require()
const cors = require('cors');
```

### Import Path Reference

```
services/
├── api-gateway/
│   └── src/
│       └── app.js        <-- Importing from here
├── shared/
│   ├── config/
│   │   └── middleware.js <-- Target file
│   ├── middleware/
│   │   └── errorHandler.js
│   └── utils/
│       └── logger.js
```

From `api-gateway/src/app.js`, use `../../shared/` to reach `services/shared/`.

## Verification Checklist

After running the reinstall script, verify:

1. **No module not found errors:**
   ```bash
   cd services/api-gateway
   npm run dev
   ```

2. **All shared imports resolve:**
   - `errorHandler.js` ✓
   - `middleware.js` (config) ✓
   - `security.js` ✓
   - `performance.js` ✓
   - `logger.js` ✓

3. **Node.js version compatibility:**
   ```bash
   node --version  # Should be >= 20.0.0
   ```

## Troubleshooting

### Issue: "Cannot find package 'cors'"
**Solution:** Run the reinstall script to install all missing dependencies.

### Issue: "Cannot find module '../../shared/middleware/...'"
**Solution:** Ensure import path uses `../../shared/` not `../shared/`

### Issue: "Must use import to load ES Module"
**Solution:** Ensure `"type": "module"` is in package.json

## Node.js v20+ Compatibility

All services configured with:
```json
"engines": {
  "node": ">=20.0.0"
}
```

ESM features used:
- Top-level `await` (Node 14.8+)
- `import`/`export` syntax
- Import assertions (Node 17+)
- File URL imports with `file://` protocol
