# BalanceVault – Secure Digital Banking Platform

**BalanceVault** is a full-stack digital banking application designed to provide users with a secure and convenient way to manage their financial activities. It supports account management, deposits, withdrawals, fund transfers, and transaction tracking, along with administrative controls for managing banking operations.

## Live Demo

- **Frontend:** https://balance-vault-eosin.vercel.app/
- **Backend API:** https://balancevault-api-21sq.onrender.com/
- **API Health Check:** https://balancevault-api-21sq.onrender.com/api/health

## 🔐 Demo Admin Credentials

For project evaluation and testing, admin login access is provided below.

- **Application URL:** https://balance-vault-eosin.vercel.app/
- **Role:** Administrator
- **Email:** lavanya.demo@example.com
- **Password:** [Shared separately with the evaluator]

**Note:** These credentials are provided exclusively for demonstration and evaluation purposes. Please do not share them publicly or use them for real financial transactions.

## Features

### User Features
- Secure user registration and login.
- JWT-based authentication.
- User account management.
- View account balances and transaction history.
- Deposit money through deposit requests.
- Withdraw money from accounts.
- Transfer funds between accounts.
- Credit and debit transaction tracking.
- View transaction details and account statements.

### Admin Features
- Admin authentication and authorization.
- Manage registered users.
- Monitor banking transactions.
- Review and approve deposit requests.
- Administrative dashboard and transaction management.

### Security Features
- Password hashing using bcrypt.
- JWT-based authentication.
- Role-based access control.
- API rate limiting.
- Input validation using Zod.
- Database operations using Prisma ORM.

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript, CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT, bcryptjs |
| Caching | Redis |
| Validation | Zod |
| API Testing | Postman |
| Version Control | Git, GitHub |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Database Hosting | Neon |

## Project Structure

```text
BalanceVault/
│
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── app.js
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   ├── package.json
│   └── .env
│
└── README.md
```

## Installation and Setup

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- PostgreSQL database (local or hosted)
- Redis instance
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/lavanya4704/BalanceVault.git

cd BalanceVault
```

### 2. Set Up the Backend

```bash
cd server

npm install
```

Create a `.env` file inside the `server` directory:

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
REDIS_URL=your_redis_connection_string
JWT_SECRET=your_secure_secret_key
CLIENT_URL=http://localhost:5173
```

Generate the Prisma Client:

```bash
npx prisma generate
```

Apply database migrations:

```bash
npx prisma migrate deploy
```

Start the backend:

```bash
npm run dev
```

Backend runs at:

```text
http://localhost:5000
```

### 3. Set Up the Frontend

Open another terminal:

```bash
cd client

npm install
```

Create a `.env` file inside the `client` directory:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check backend status |
| GET | `/api/health` | API health check |
| GET | `/api/ready` | Database readiness check |
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Authenticate user |
| `/` | `/api/users` | User-related operations |
| `/` | `/api/accounts` | Account-related operations |
| `/` | `/api/transactions` | Transaction operations |
| `/` | `/api/deposits` | Deposit request operations |
| `/` | `/api/admin` | Administrative operations |

*Refer to the backend route files for the complete endpoint paths and request formats.*

## Deployment

BalanceVault is deployed using:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Neon PostgreSQL
- **Caching:** Redis

The frontend communicates with the deployed backend through the `VITE_API_URL` environment variable.

## Environment Variables

Never commit `.env` files, database credentials, Redis credentials, or JWT secrets to GitHub.

Add environment variables through the deployment platforms' project settings.

## Future Enhancements

- Email and OTP-based verification.
- Downloadable transaction statements.
- Enhanced financial analytics and visual reports.
- Improved fraud detection and suspicious transaction monitoring.
- Additional account and transaction security controls.

## Developer

**Lavanya Singamsetti**

- GitHub: https://github.com/lavanya4704
- LinkedIn: https://www.linkedin.com/in/lavanya-singamsetti-6a41b232a/

---

⭐ If you find this project interesting, consider giving the repository a star.

**BalanceVault – Secure Banking. Smarter Transactions.**
