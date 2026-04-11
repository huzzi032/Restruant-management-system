# Restaurant Management System

A comprehensive, production-ready Restaurant Management System built with FastAPI backend and React frontend.

## Features

### Core Modules

1. **Authentication & Role Management**
   - JWT-based authentication
   - Role-based access control (Admin, Manager, Waiter, Chef, Cashier)
   - Secure password hashing

2. **Menu Management**
   - Category management (Fast Food, Desi, BBQ, Drinks, etc.)
   - Menu items with pricing, costs, and profit calculations
   - Ingredient linking to inventory
   - Availability toggling

3. **Order Management System**
   - Table-based and takeaway orders
   - Real-time order status tracking
   - Special instructions support
   - Order history

4. **Kitchen Display System (KDS)**
   - Live incoming orders
   - Status updates (Pending → Cooking → Ready)
   - Preparation time tracking
   - Priority sorting

5. **Billing & Payments**
   - Multiple payment methods (Cash, Card, Online, Wallet)
   - Tax and discount support
   - Refund handling
   - Daily cash flow tracking

6. **Inventory Management**
   - Raw material tracking
   - Automatic stock deduction on orders
   - Low stock alerts
   - Purchase order management

7. **Employee Management**
   - Employee records and roles
   - Attendance tracking
   - Salary calculation and payroll

8. **Reports & Analytics**
   - Daily/Monthly sales reports
   - Top selling items
   - Profit & Loss statements
   - Inventory reports

9. **AI Integration (Groq API)**
   - Business insights
   - Demand prediction
   - Menu optimization suggestions
   - Chat assistant

## Tech Stack

### Backend
- **Framework**: FastAPI
- **Database**: SQLite (Development) / PostgreSQL (Production ready)
- **ORM**: SQLAlchemy
- **Authentication**: JWT with python-jose
- **Real-time**: WebSockets
- **AI**: Groq API

### Frontend
- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Query (TanStack Query)
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Project Structure

```
restaurant-management-system/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, database, security
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   ├── routers/        # API endpoints
│   │   └── main.py         # Application entry
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # Auth & Theme contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create .env file:
```bash
cp .env.example .env
```

5. Run the backend:
```bash
python -m app.main
```

The backend will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create .env file:
```bash
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env
```

4. Run the frontend:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Default Demo Credentials

| Role     | Username | Password  |
|----------|----------|-----------|
| Admin    | admin    | admin123  |
| Manager  | manager  | manager123|
| Waiter   | waiter   | waiter123 |
| Chef     | chef     | chef123   |
| Cashier  | cashier  | cashier123|

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Register (Admin only)
- `GET /api/v1/auth/me` - Get current user

### Users
- `GET /api/v1/users` - List users
- `GET /api/v1/users/{id}` - Get user
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Menu
- `GET /api/v1/menu/categories` - List categories
- `POST /api/v1/menu/categories` - Create category
- `GET /api/v1/menu/items` - List menu items
- `POST /api/v1/menu/items` - Create menu item
- `PUT /api/v1/menu/items/{id}` - Update menu item

### Orders
- `GET /api/v1/orders` - List orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/{id}` - Get order
- `PATCH /api/v1/orders/{id}/status` - Update order status
- `POST /api/v1/orders/{id}/items` - Add item to order

### Kitchen
- `GET /api/v1/kitchen/orders` - Get kitchen orders
- `PATCH /api/v1/kitchen/orders/{id}/start-cooking` - Start cooking
- `PATCH /api/v1/kitchen/orders/{id}/mark-ready` - Mark ready

### Inventory
- `GET /api/v1/inventory/items` - List inventory items
- `POST /api/v1/inventory/items` - Create item
- `POST /api/v1/inventory/items/{id}/add-stock` - Add stock
- `GET /api/v1/inventory/items/low-stock` - Get low stock items

### Reports
- `GET /api/v1/reports/daily` - Daily report
- `GET /api/v1/reports/monthly` - Monthly report
- `GET /api/v1/reports/sales` - Sales report
- `GET /api/v1/reports/dashboard` - Dashboard summary

### AI
- `GET /api/v1/ai/insights` - Business insights
- `GET /api/v1/ai/demand-prediction` - Demand prediction
- `GET /api/v1/ai/menu-optimization` - Menu optimization
- `POST /api/v1/ai/chat` - Chat assistant

## Environment Variables

### Backend (.env)
```env
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///./restaurant.db
CORS_ORIGINS=http://localhost:5173
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.3-70b-versatile
TAX_RATE=0.10
CURRENCY=USD
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Deploy Backend on Vercel

This repository includes a Vercel-ready backend setup in `backend/`:
- `backend/api/index.py` (serverless entrypoint)
- `backend/vercel.json` (routing/build config)
- `backend/runtime.txt` (Python version)

### Important Production Note

Vercel serverless functions have ephemeral storage. SQLite works for testing, but data does not persist reliably between cold starts/redeploys. For production, use PostgreSQL and set `DATABASE_URL`.

### Deploy Steps (Backend Only)

1. Push your code to GitHub.
2. In Vercel Dashboard, click **New Project** and import this repo.
3. Set **Root Directory** to `backend`.
4. Leave framework as **Other**.
5. Add Environment Variables in Vercel:
   - `SECRET_KEY` = strong random string
   - `CORS_ORIGINS` = frontend URL(s), comma-separated
   - `DATABASE_URL` = PostgreSQL URL (recommended for production)
   - `GROQ_API_KEY` = optional, only if AI endpoints are needed
   - `GROQ_MODEL` = optional (example: `llama-3.3-70b-versatile`)
   - `DEBUG` = `False`
6. Click **Deploy**.

### After Deploy

- Health check: `https://<your-backend-domain>/health`
- API docs: `https://<your-backend-domain>/docs`

If you keep SQLite temporarily, the backend now uses `/tmp` paths on Vercel to avoid startup write errors, but treat it as non-persistent storage.

## Enable AI Features

1. Add a valid Groq API key in backend `.env`:
```env
GROQ_API_KEY=your-real-groq-key
```

2. Restart backend after updating `.env`.

3. Login as `admin` or `manager` to use AI panels:
- Dashboard: AI Insights card
- Reports: AI tab (insights, demand prediction, menu optimization, chat assistant)

If no key is set, AI endpoints return a friendly fallback message instead of failing.

## WebSocket Endpoints

- `/api/v1/orders/ws` - Order updates
- `/api/v1/kitchen/ws` - Kitchen display updates

## Database Schema

### Core Tables
- `users` - User accounts
- `categories` - Menu categories
- `menu_items` - Menu items
- `tables` - Restaurant tables
- `orders` - Customer orders
- `order_items` - Order line items
- `inventory_items` - Inventory/stock
- `inventory_transactions` - Stock movements
- `employees` - Employee records
- `attendance` - Attendance records
- `salaries` - Salary records
- `payments` - Payment records
- `expenses` - Business expenses
- `suppliers` - Supplier records

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For support, email huzaifachaduhary@gmail.com or open an issue on GitHub.

## Windows Run Commands

Backend:
```powershell
cd "C:\Users\hp\Downloads\Kimi_Agent_Restaurant Management System\restaurant-management-system\backend"
..\..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Frontend:
```powershell
cd "C:\Users\hp\Downloads\Kimi_Agent_Restaurant Management System\restaurant-management-system\frontend"
npm run dev -- --host 127.0.0.1 --port 5173
```

python -m uvicorn app.main:app --port 8000 --reload



issues
alag alag portal nhi bn raha and menu issue