# NetCharge Pro - AI Agent Instructions

## Architecture Overview

NetCharge Pro is a WiFi billing system with a **NestJS backend** and **Next.js 14 frontend**, containerized with Docker. The backend uses TypeORM with PostgreSQL for entity management, JWT-based authentication, and Swagger API documentation.

### Service Boundaries
- **Backend** (`backend/`): REST API on port 3001, handles auth, customers, invoices, payments
- **Frontend** (`frontend/`): Next.js App Router on port 3000, SSR/CSR hybrid with Zustand state
- **Database**: PostgreSQL on port 5432 (auto-syncs in dev, manual migrations in prod)

### Key Data Flows
1. **Auth Flow**: Login → JWT token → localStorage + Zustand → Bearer auth on all API calls
2. **Customer → Invoice → Payment**: One-to-many relationships, invoices auto-calculate `paidAmount` from payments
3. **QRIS Integration**: Payment entity stores `qrisCode` for QR payment methods

## Backend Patterns (NestJS)

### Module Structure
Each domain follows NestJS standard: `module.ts` imports TypeORM entity, exports service, declares controller.
```typescript
// Pattern: backend/src/<domain>/<domain>.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Entity])],
  controllers: [Controller],
  providers: [Service],
  exports: [Service], // Export service if used by other modules
})
```

### Entity Conventions
- **UUIDs** for all primary keys (`@PrimaryGeneratedColumn('uuid')`)
- **Enums** for status fields (e.g., `CustomerStatus`, `InvoiceStatus`, `PaymentMethod`)
- **Decimal** columns for money: `@Column('decimal', { precision: 10, scale: 2 })`
- **Relationships**: Use `@ManyToOne`/`@OneToMany` with explicit `@JoinColumn({ name: 'foreignKeyId' })`
- Example: `src/customers/entities/customer.entity.ts`, `src/invoices/entities/invoice.entity.ts`

### DTOs & Validation
- Use `class-validator` decorators (`@IsString()`, `@IsEmail()`, `@IsEnum()`, etc.)
- All DTOs have `@ApiProperty()` from `@nestjs/swagger` with examples
- Update DTOs extend with `PartialType(CreateDto)` pattern
- Example: `src/customers/dto/create-customer.dto.ts`

### Controllers
- **Route prefix**: All routes use `/api/<resource>` (e.g., `/api/customers`)
- **Guards**: Apply `@UseGuards(JwtAuthGuard)` at class level, add `RolesGuard` for admin-only routes
- **Swagger docs**: Use `@ApiTags()`, `@ApiOperation()`, `@ApiBearerAuth()`, `@ApiQuery()` decorators
- **Error handling**: Services throw `ConflictException`, `NotFoundException`, `UnauthorizedException` - handled globally

### Authentication
- **Strategy**: JWT with Passport (`src/auth/strategies/jwt.strategy.ts`)
- **Guards**: `JwtAuthGuard` for auth, `RolesGuard` for role-based access (admin/operator)
- **Decorator usage**: `@Roles(UserRole.ADMIN)` with `@UseGuards(JwtAuthGuard, RolesGuard)`
- **Password hashing**: Use bcrypt (10 rounds) in `UsersService.create()`, compare in `AuthService.validateUser()`

### Service Layer
- Inject repository: `@InjectRepository(Entity) private readonly repository: Repository<Entity>`
- **Always** throw `NotFoundException` when `findOne()` returns null
- Use `relations: ['relatedEntity']` in `findOne()` queries to load relationships
- Example pattern: `src/customers/customers.service.ts`

## Frontend Patterns (Next.js 14)

### App Router Structure
- Pages: `src/app/<route>/page.tsx` (e.g., `dashboard/customers/page.tsx`)
- Layouts: `src/app/<route>/layout.tsx` for shared UI (e.g., `dashboard/layout.tsx` has Sidebar)
- **Client components**: All interactive pages use `'use client'` directive at top

### State Management
- **Auth state**: Zustand with persist middleware (`src/lib/store.ts`)
  - Token stored in both localStorage and Zustand
  - Access via `useAuthStore()` hook
- **Component state**: Use `useState` for local UI state, no global state for domain data

### API Communication
- **Axios instance**: `src/lib/api.ts` with interceptors
  - Request interceptor: Auto-attaches Bearer token from localStorage
  - Response interceptor: Redirects to `/login` on 401, removes token
- **Service layer**: `src/services/index.ts` wraps all API calls
  - Pattern: `customerService.getAll()`, `invoiceService.create(data)`
  - Always use services, never call `api` directly in components

### TypeScript Types
- All types in `src/types/index.ts` mirror backend DTOs exactly
- Use string literal types for enums (e.g., `'admin' | 'operator'`, `'pending' | 'paid' | 'overdue' | 'cancelled'`)

### UI Components
- **Component library**: Custom components in `src/components/ui/` (Button, Card, Input, Modal, Badge, Select)
- **Styling**: Tailwind CSS with custom primary color palette (blue shades)
- **Icons**: Lucide React (e.g., `import { Plus, Search, Edit } from 'lucide-react'`)
- **Forms**: React Hook Form + Zod validation pattern (see `CustomerForm.tsx`)

### Component Patterns
- **Data fetching**: `useEffect(() => { fetchData() }, [])` on mount
- **Loading states**: Show spinner during fetch with `loading` state
- **CRUD operations**: Modal-based forms, re-fetch after create/update/delete
- **Search/filter**: Local filtering with `useState` for search term
- Example: `src/app/dashboard/customers/page.tsx`

## Development Workflows

### Running Locally
```bash
# Backend (port 3001)
cd backend
npm install
npm run start:dev  # Hot reload with --watch

# Frontend (port 3000)
cd frontend
npm install
npm run dev  # Next.js dev server

# Database setup
# 1. Start PostgreSQL (port 5432)
# 2. Create database: netcharge_pro
# 3. Backend auto-syncs tables in dev (synchronize: true)
```

### Docker Deployment
```bash
docker-compose up -d  # Starts postgres, backend, frontend
docker-compose logs -f backend  # View API logs
docker-compose down  # Stop all services
```

### API Documentation
- **Swagger UI**: http://localhost:3001/api/docs (auto-generated from decorators)
- Test endpoints with "Authorize" button using JWT token from login response

### Testing
- **Backend**: Jest configured (`jest.config.js`), run `npm test` in `backend/`
- **Pattern**: `*.spec.ts` files in `src/` (e.g., `app.module.spec.ts`)
- **Test environment**: Node, uses ts-jest transformer

## Environment Variables

### Backend `.env`
> **Warning:** Never use default or weak credentials in production. Always set a strong, unique password for your database. The example below uses a placeholder—replace `your-secure-password` with a secure value.
DB_DATABASE=netcharge_pro
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
PORT=3001
NODE_ENV=development
# Generate a strong JWT secret using: openssl rand -base64 32
JWT_SECRET=REPLACE_WITH_A_STRONG_RANDOM_SECRET
JWT_EXPIRES_IN=24h
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

## Key Integration Points

### Adding New Entities
1. Create entity in `backend/src/<domain>/entities/<entity>.entity.ts` with TypeORM decorators
2. Create DTOs in `dto/` with class-validator + ApiProperty decorators
3. Generate service with NestJS CLI: `nest g service <domain>`
4. Generate controller: `nest g controller <domain>`
5. Add module with TypeORM.forFeature([Entity])
6. Import module in `app.module.ts`
7. Add TypeScript types in `frontend/src/types/index.ts`
8. Create service methods in `frontend/src/services/index.ts`

### Role-Based Access
- Use `@Roles(UserRole.ADMIN)` decorator with `RolesGuard` for admin-only endpoints
- Frontend: Check `useAuthStore().user?.role === 'admin'` to show/hide UI elements
- Roles: `ADMIN` (full access), `OPERATOR` (read-only or limited write)

## Critical Conventions

- **Never** bypass DTO validation - all inputs flow through class-validator
- **Always** use services layer in frontend - no direct API calls in components
- **Currency**: Indonesian Rupiah (IDR), format with `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })`
- **Dates**: Store as `date` type in PostgreSQL, format with `date-fns` in frontend
- **API versioning**: Routes prefixed with `/api`, no version number (v1 implied)
- **Error messages**: All backend exceptions are handled by a global exception filter (`AllExceptionsFilter`) located at `backend/src/common/filters/all-exceptions.filter.ts`. This filter ensures that all errors returned to the frontend follow a consistent, user-friendly JSON structure:
  ```json
  {
    "statusCode": 404,
    "message": "Customer not found",
    "error": "Not Found"
  }
  ```
  - Always provide clear, actionable, and non-technical messages in the `message` field.
  - For custom exceptions, ensure the message is suitable for display to end users.
  - All controllers and services should throw standard NestJS exceptions (`NotFoundException`, `ConflictException`, `UnauthorizedException`, etc.) or custom exceptions as needed; the global filter will format the response.
