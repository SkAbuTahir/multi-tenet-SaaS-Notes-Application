# Multi-Tenant Notes SaaS

A production-ready multi-tenant SaaS Notes application built with Next.js and deployed on Vercel.

## Multi-Tenancy Approach

**Chosen Approach: Shared Schema with Tenant ID**

This implementation uses a shared database schema with a `tenantId` column in all tenant-specific tables (users, notes). This approach was chosen because:

1. **Simplicity**: Single database, single schema, easier to manage and deploy
2. **Cost-effective**: No need for multiple databases or complex schema management
3. **Scalability**: Can handle multiple tenants efficiently with proper indexing
4. **Vercel-friendly**: Works seamlessly with serverless functions and edge databases

Data isolation is enforced at the application level by always filtering queries by `tenantId`, ensuring strict tenant separation.

## Features

- **Multi-tenant architecture** with strict data isolation
- **JWT-based authentication** with role-based access control
- **Subscription-based feature gating** (Free: 3 notes max, Pro: unlimited)
- **Complete CRUD operations** for notes
- **Admin capabilities**: user invitation and tenant upgrades
- **Responsive web interface**
- **Comprehensive test suite**

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React
- **Backend**: Next.js API Routes (serverless)
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT with bcryptjs
- **Deployment**: Vercel

## Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

For Vercel deployment, set these in your Vercel project settings.

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up the database**:
   ```bash
   npm run db:generate
   npm run db:push
   ```

3. **Seed the database**:
   ```bash
   npm run db:seed
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api

## Test Accounts

The seed script creates these test accounts (all with password: `password`):

- `admin@acme.test` - Admin, tenant: acme
- `user@acme.test` - Member, tenant: acme  
- `admin@globex.test` - Admin, tenant: globex
- `user@globex.test` - Member, tenant: globex

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password, returns JWT

### User Management
- `GET /api/me` - Get current user info from JWT
- `POST /api/tenants/:slug/invite` - Invite user to tenant (Admin only)

### Notes Management
- `GET /api/notes` - List all notes for current tenant
- `POST /api/notes` - Create new note (respects free plan limits)
- `GET /api/notes/:id` - Get specific note (tenant-scoped)
- `PUT /api/notes/:id` - Update note (tenant-scoped)
- `DELETE /api/notes/:id` - Delete note (tenant-scoped)

### Tenant Management
- `POST /api/tenants/:slug/upgrade` - Upgrade tenant to Pro plan (Admin only)

### System
- `GET /api/health` - Health check endpoint

## API Examples

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.test","password":"password"}'
```

Response:
```json
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
```

### Create Note
```bash
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title":"My Note","content":"Note content here"}'
```

Response (201):
```json
{
  "id": "clr1234567890",
  "title": "My Note",
  "content": "Note content here",
  "tenantId": "clr0987654321",
  "createdByUserId": "clr1111111111",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "createdBy": {"email": "admin@acme.test"}
}
```

### Free Plan Limit Exceeded
```json
{
  "error": "note_limit_reached",
  "message": "Tenant has reached the note limit for Free plan"
}
```

## Deployment to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Set environment variables** in Vercel dashboard:
   - `DATABASE_URL` - Your production database URL
   - `JWT_SECRET` - Strong secret for JWT signing

4. **Run database setup** (if using a new database):
   ```bash
   vercel env pull .env.local
   npm run db:push
   npm run db:seed
   ```

## Testing

Run the automated test suite:

```bash
# Local testing
npm test

# Test against deployed instance
API_BASE_URL=https://your-app.vercel.app FRONTEND_URL=https://your-app.vercel.app npm test

# Using shell script
./tests/run-tests.sh https://your-app.vercel.app https://your-app.vercel.app
```

The test suite validates:
- Health endpoint functionality
- Authentication with all test accounts
- Tenant data isolation
- Role-based access control
- Free plan note limits and Pro upgrade
- Complete CRUD operations
- Frontend accessibility

## Security Features

- **JWT-based authentication** with secure token signing
- **Password hashing** using bcryptjs
- **Tenant data isolation** enforced at query level
- **Role-based access control** for admin operations
- **CORS enabled** for API access
- **Input validation** on all endpoints

## Production Considerations

- Use a production database (PostgreSQL recommended)
- Set strong JWT_SECRET in production
- Enable database connection pooling
- Add rate limiting for API endpoints
- Implement proper logging and monitoring
- Add input sanitization and validation
- Consider implementing refresh tokens for better security

## License

MIT License
# Multi-Tenant Notes SaaS

A production-ready multi-tenant SaaS Notes application built with Next.js and deployed on Vercel.

## Multi-Tenancy Approach

**Chosen Approach: Shared Schema with Tenant ID**

This implementation uses a shared database schema with a `tenantId` column in all tenant-specific tables (users, notes). This approach was chosen because:

1. **Simplicity**: Single database, single schema, easier to manage and deploy
2. **Cost-effective**: No need for multiple databases or complex schema management
3. **Scalability**: Can handle multiple tenants efficiently with proper indexing
4. **Vercel-friendly**: Works seamlessly with serverless functions and edge databases

Data isolation is enforced at the application level by always filtering queries by `tenantId`, ensuring strict tenant separation.

## Features

- **Multi-tenant architecture** with strict data isolation
- **JWT-based authentication** with role-based access control
- **Subscription-based feature gating** (Free: 3 notes max, Pro: unlimited)
- **Complete CRUD operations** for notes
- **Admin capabilities**: user invitation and tenant upgrades
- **Responsive web interface**
- **Comprehensive test suite**

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React
- **Backend**: Next.js API Routes (serverless)
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT with bcryptjs
- **Deployment**: Vercel

## Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

For Vercel deployment, set these in your Vercel project settings.

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up the database**:
   ```bash
   npm run db:generate
   npm run db:push
   ```

3. **Seed the database**:
   ```bash
   npm run db:seed
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api

## Test Accounts

The seed script creates these test accounts (all with password: `password`):

- `admin@acme.test` - Admin, tenant: acme
- `user@acme.test` - Member, tenant: acme  
- `admin@globex.test` - Admin, tenant: globex
- `user@globex.test` - Member, tenant: globex

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password, returns JWT

### User Management
- `GET /api/me` - Get current user info from JWT
- `POST /api/tenants/:slug/invite` - Invite user to tenant (Admin only)

### Notes Management
- `GET /api/notes` - List all notes for current tenant
- `POST /api/notes` - Create new note (respects free plan limits)
- `GET /api/notes/:id` - Get specific note (tenant-scoped)
- `PUT /api/notes/:id` - Update note (tenant-scoped)
- `DELETE /api/notes/:id` - Delete note (tenant-scoped)

### Tenant Management
- `POST /api/tenants/:slug/upgrade` - Upgrade tenant to Pro plan (Admin only)

### System
- `GET /api/health` - Health check endpoint

## API Examples

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.test","password":"password"}'
```

Response:
```json
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
```

### Create Note
```bash
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title":"My Note","content":"Note content here"}'
```

Response (201):
```json
{
  "id": "clr1234567890",
  "title": "My Note",
  "content": "Note content here",
  "tenantId": "clr0987654321",
  "createdByUserId": "clr1111111111",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "createdBy": {"email": "admin@acme.test"}
}
```

### Free Plan Limit Exceeded
```json
{
  "error": "note_limit_reached",
  "message": "Tenant has reached the note limit for Free plan"
}
```

## Deployment to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Set environment variables** in Vercel dashboard:
   - `DATABASE_URL` - Your production database URL
   - `JWT_SECRET` - Strong secret for JWT signing

4. **Run database setup** (if using a new database):
   ```bash
   vercel env pull .env.local
   npm run db:push
   npm run db:seed
   ```

## Testing

Run the automated test suite:

```bash
# Local testing
npm test

# Test against deployed instance
API_BASE_URL=https://your-app.vercel.app FRONTEND_URL=https://your-app.vercel.app npm test

# Using shell script
./tests/run-tests.sh https://your-app.vercel.app https://your-app.vercel.app
```

The test suite validates:
- Health endpoint functionality
- Authentication with all test accounts
- Tenant data isolation
- Role-based access control
- Free plan note limits and Pro upgrade
- Complete CRUD operations
- Frontend accessibility

## Security Features

- **JWT-based authentication** with secure token signing
- **Password hashing** using bcryptjs
- **Tenant data isolation** enforced at query level
- **Role-based access control** for admin operations
- **CORS enabled** for API access
- **Input validation** on all endpoints

## Production Considerations

- Use a production database (PostgreSQL recommended)
- Set strong JWT_SECRET in production
- Enable database connection pooling
- Add rate limiting for API endpoints
- Implement proper logging and monitoring
- Add input sanitization and validation
- Consider implementing refresh tokens for better security

## License

MIT License