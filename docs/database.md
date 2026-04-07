# Database Schema

## Overview

PodPlate uses **MongoDB** as the primary database for all microservices. Each service maintains its own database, ensuring loose coupling and independent scalability.

---

## Database Per Service

| Service | Database | Collections |
|---------|----------|-------------|
| Auth Service | `podplate_auth` | users |
| User Service | `podplate_users` | profiles, addresses |
| Product Service | `podplate_products` | products, categories |
| Cart Service | `podplate_cart` | carts |
| Order Service | `podplate_orders` | orders |
| Payment Service | `podplate_payments` | transactions |
| Restaurant Service | `podplate_restaurants` | restaurants, menu_items |
| Notification Service | `podplate_notifications` | notifications |

---

## Auth Service

### Users Collection

```javascript
{
  _id: ObjectId,
  name: String,           // required, min 2 chars
  email: String,          // required, unique, indexed
  password: String,       // required, bcrypt hashed
  role: String,           // enum: ['user', 'admin'], default: 'user'
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
// Unique email index
db.users.createIndex({ email: 1 }, { unique: true });

// Role index for admin queries
db.users.createIndex({ role: 1 });
```

---

## User Service

### Profiles Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,       // reference to auth.users
  phone: String,
  avatar: String,        // URL
  preferences: {
    newsletter: Boolean,
    notifications: {
      email: Boolean,
      sms: Boolean,
      push: Boolean
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
db.profiles.createIndex({ userId: 1 }, { unique: true });
```

### Addresses Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  label: String,         // 'Home', 'Work', etc.
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
  isDefault: Boolean,
  createdAt: Date
}
```

**Indexes:**
```javascript
db.addresses.createIndex({ userId: 1 });
db.addresses.createIndex({ userId: 1, isDefault: 1 });
```

---

## Product Service

### Products Collection

```javascript
{
  _id: ObjectId,
  name: String,           // required, indexed
  description: String,    // required, min 10 chars
  price: Number,          // required, positive
  originalPrice: Number,  // optional
  stock: Number,        // default: 0, min: 0
  category: String,     // required, indexed
  images: [String],     // URLs
  ratings: {
    average: Number,    // 0-5
    count: Number
  },
  isActive: Boolean,    // default: true
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
// Text search on name
db.products.createIndex({ name: 'text', description: 'text' });

// Category filtering
db.products.createIndex({ category: 1 });

// Price range queries
db.products.createIndex({ price: 1 });

// Active products with category
db.products.createIndex({ isActive: 1, category: 1 });

// Sort by rating
db.products.createIndex({ 'ratings.average': -1 });
```

### Categories Collection

```javascript
{
  _id: ObjectId,
  name: String,         // required, unique
  description: String,
  image: String,
  parentId: ObjectId,   // for subcategories
  order: Number,        // display order
  isActive: Boolean,
  createdAt: Date
}
```

**Indexes:**
```javascript
db.categories.createIndex({ name: 1 }, { unique: true });
db.categories.createIndex({ parentId: 1 });
db.categories.createIndex({ order: 1 });
```

---

## Cart Service

### Carts Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,     // sparse index (allows guest carts)
  sessionId: String,    // for guest users
  items: [{
    productId: ObjectId,  // required if type: 'product'
    menuItemId: ObjectId, // required if type: 'menu'
    type: String,         // enum: ['product', 'menu']
    name: String,
    image: String,
    price: Number,
    quantity: Number,     // min: 1
    restaurantId: ObjectId // for menu items
  }],
  totalItems: Number,
  totalAmount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
// User cart lookup
db.carts.createIndex({ userId: 1, updatedAt: -1 });

// Session-based cart (guest users)
db.carts.createIndex({ sessionId: 1, updatedAt: -1 });

// Sparse index allows null values
db.carts.createIndex({ userId: 1 }, { sparse: true });
```

---

## Order Service

### Orders Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,     // required, indexed
  idempotencyKey: String,  // prevent duplicates
  items: [{
    productId: ObjectId,
    type: String,       // 'product' or 'menu'
    name: String,       // snapshot at order time
    price: Number,      // snapshot at order time
    quantity: Number,
    restaurantId: ObjectId
  }],
  totalAmount: Number,
  status: String,       // enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
  statusHistory: [{
    status: String,
    timestamp: Date,
    note: String
  }],
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  paymentMethod: String,  // enum: ['card', 'cod', 'wallet', 'upi']
  paymentStatus: String,  // enum: ['pending', 'paid', 'failed']
  transactionId: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
// User order history
db.orders.createIndex({ userId: 1, createdAt: -1 });

// Status-based queries (admin)
db.orders.createIndex({ status: 1, createdAt: -1 });

// Idempotency key
db.orders.createIndex({ idempotencyKey: 1 }, { unique: true, sparse: true });

// Transaction lookup
db.orders.createIndex({ transactionId: 1 }, { sparse: true });

// Compound: user + status
db.orders.createIndex({ userId: 1, status: 1 });
```

---

## Payment Service

### Transactions Collection

```javascript
{
  _id: ObjectId,
  orderId: ObjectId,    // required, indexed
  userId: ObjectId,     // required, indexed
  amount: Number,       // required, positive
  currency: String,     // default: 'INR'
  status: String,       // enum: ['pending', 'success', 'failed', 'refunded']
  method: String,       // enum: ['card', 'wallet', 'upi']
  gatewayTransactionId: String,  // from payment provider
  cardDetails: {
    last4: String,      // masked: '1111'
    brand: String       // 'visa', 'mastercard'
  },
  failureReason: String,
  refundAmount: Number,
  refundReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
// Order lookup
db.transactions.createIndex({ orderId: 1 });

// User transaction history
db.transactions.createIndex({ userId: 1, createdAt: -1 });

// Gateway transaction lookup
db.transactions.createIndex({ gatewayTransactionId: 1 }, { unique: true });

// Status-based queries
db.transactions.createIndex({ status: 1, createdAt: -1 });

// Pending transactions (cleanup job)
db.transactions.createIndex({ status: 1, createdAt: 1 });
```

---

## Restaurant Service

### Restaurants Collection

```javascript
{
  _id: ObjectId,
  name: String,         // required, indexed
  description: String,
  cuisine: String,      // indexed
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  location: {
    type: 'Point',
    coordinates: [longitude, latitude]
  },
  rating: Number,       // 0-5
  ratingCount: Number,
  deliveryTime: String, // '30-45 min'
  minOrder: Number,
  deliveryFee: Number,
  isActive: Boolean,
  openingHours: {
    monday: { open: String, close: String },
    // ... other days
  },
  images: [String],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
// Geospatial queries
db.restaurants.createIndex({ location: '2dsphere' });

// Name search
db.restaurants.createIndex({ name: 'text', description: 'text' });

// Cuisine filtering
db.restaurants.createIndex({ cuisine: 1 });

// Active + rating sort
db.restaurants.createIndex({ isActive: 1, rating: -1 });
```

### MenuItems Collection

```javascript
{
  _id: ObjectId,
  restaurantId: ObjectId,  // required, indexed
  name: String,
  description: String,
  price: Number,
  category: String,        // 'Starters', 'Main Course', etc.
  isVegetarian: Boolean,
  isVegan: Boolean,
  isGlutenFree: Boolean,
  spiceLevel: Number,      // 1-5
  image: String,
  isAvailable: Boolean,
  createdAt: Date
}
```

**Indexes:**
```javascript
// Restaurant menu lookup
db.menuItems.createIndex({ restaurantId: 1, category: 1 });

// Category filtering
db.menuItems.createIndex({ category: 1 });

// Available items
db.menuItems.createIndex({ restaurantId: 1, isAvailable: 1 });
```

---

## Notification Service

### Notifications Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,     // required, indexed
  type: String,         // enum: ['order', 'payment', 'promo', 'system']
  title: String,
  message: String,
  data: Object,         // flexible metadata
  channels: [{
    type: String,       // 'email', 'sms', 'push'
    status: String,     // 'sent', 'delivered', 'failed'
    sentAt: Date
  }],
  isRead: Boolean,      // default: false
  readAt: Date,
  createdAt: Date
}
```

**Indexes:**
```javascript
// User notifications
db.notifications.createIndex({ userId: 1, createdAt: -1 });

// Unread notifications
db.notifications.createIndex({ userId: 1, isRead: 1 });

// Type-based queries
db.notifications.createIndex({ userId: 1, type: 1 });

// Cleanup old notifications (TTL)
db.notifications.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days
```

---

## Indexing Strategy Summary

### Query Optimization

| Collection | Primary Query | Index |
|------------|---------------|-------|
| users | Login by email | `{ email: 1 }` unique |
| products | Category filter | `{ category: 1, isActive: 1 }` |
| products | Search | `{ name: 'text', description: 'text' }` |
| orders | User history | `{ userId: 1, createdAt: -1 }` |
| orders | Status filter | `{ status: 1, createdAt: -1 }` |
| transactions | Order lookup | `{ orderId: 1 }` |
| restaurants | Nearby search | `{ location: '2dsphere' }` |
| notifications | User inbox | `{ userId: 1, isRead: 1, createdAt: -1 }` |

### Performance Considerations

1. **Compound Indexes**: Order fields from most selective to least selective
2. **Partial Indexes**: Use for queries on subset of data (e.g., `{ isActive: true }`)
3. **Sparse Indexes**: For optional fields to reduce index size
4. **TTL Indexes**: Auto-delete old notifications
5. **Text Indexes**: Full-text search on product names and descriptions

---

## Data Consistency Patterns

### Denormalization

Order items store product snapshot to maintain historical accuracy:

```javascript
// Order items contain product data at purchase time
items: [{
  productId: ObjectId,  // Reference for analytics
  name: "Product Name", // Snapshot
  price: 299.99         // Snapshot
}]
```

### Referential Integrity

Soft references with application-level validation:

```javascript
// Application validates product exists before adding to cart
// Database stores ObjectId reference only
```

---

## Scaling Considerations

### Sharding Strategy (Future)

| Collection | Shard Key | Rationale |
|------------|-----------|-----------|
| orders | `userId` | User-centric queries |
| transactions | `userId` | User transaction history |
| notifications | `userId` | User inbox |
| products | `_id` | Even distribution |

### Read Replicas

- Product catalog: High read, low write → Multiple replicas
- Orders: Balanced → Moderate replicas
- Notifications: High write → Write-optimized
