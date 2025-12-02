# NetCharge Pro

<div align="center">
  <h3>🌐 Modern WiFi Billing System</h3>
  <p>A scalable, fully automated WiFi billing system with QRIS integration and real-time customer management</p>
</div>

## ✨ Features

- **📊 Dashboard Analytics** - Real-time insights into revenue, pending invoices, and customer status
- **👥 Customer Management** - Complete CRUD operations with package tiers (Basic, Standard, Premium)
- **📄 Automated Invoicing** - Monthly invoice generation with configurable billing periods
- **💳 QRIS Payment Integration** - Generate QR codes for seamless mobile payments
- **🔐 Multi-Admin Access** - Role-based access control (Admin & Operator)
- **📱 WhatsApp Bot Ready** - API endpoints for WhatsApp bot integration
- **🐳 Docker Support** - Easy deployment with Docker Compose

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS 10
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **API Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios

## 📁 Project Structure

```
NetCharge-Pro/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # User management
│   │   ├── customers/      # Customer management
│   │   ├── invoices/       # Invoice & billing
│   │   └── payments/       # Payment processing & QRIS
│   └── Dockerfile
├── frontend/               # Next.js Dashboard
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # UI components
│   │   ├── lib/           # Utilities & stores
│   │   └── services/      # API services
│   └── Dockerfile
└── docker-compose.yml
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- npm or yarn

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/SmanCuk/NetCharge-Pro.git
   cd NetCharge-Pro
   ```

2. **Setup Backend**
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run start:dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   cp .env.example .env.local
   npm install
   npm run dev
   ```

4. **Setup Database**
   - Create a PostgreSQL database named `netcharge_pro`
   - The backend will auto-sync tables on first run

### Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📖 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:3001/api/docs

## 🔑 Environment Variables

### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=netcharge_pro
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PATCH /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `POST /api/customers/:id/suspend` - Suspend customer
- `POST /api/customers/:id/activate` - Activate customer

### Invoices
- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get invoice details
- `GET /api/invoices/customer/:id` - Get customer invoices
- `POST /api/invoices/generate/monthly` - Generate monthly invoices
- `GET /api/invoices/dashboard/stats` - Get dashboard statistics

### Payments
- `GET /api/payments` - List all payments
- `POST /api/payments` - Create payment
- `POST /api/payments/:id/confirm` - Confirm payment
- `POST /api/payments/qris/generate/:invoiceId` - Generate QRIS payment

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation with class-validator

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
