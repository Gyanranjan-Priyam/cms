# 🎓 Modern College Management System (CMS)

A cutting-edge, full-stack College Management System built with **React 19**, **Node.js**, and **MongoDB**. Features a modern UI with dark theme support, advanced payment processing, comprehensive finance management, and real-time analytics for educational institutions.

[![Built with React](https://img.shields.io/badge/React-19.1.1-blue?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green?logo=mongodb)](https://mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1+-blue?logo=tailwindcss)](https://tailwindcss.com/)

## ✨ Key Highlights

- 🎨 **Modern UI/UX** - Dark/Light theme with smooth animations
- 🔄 **Real-time Updates** - Socket.io integration for live data
- 📱 **Responsive Design** - Mobile-first approach with Tailwind CSS
- 💳 **Advanced Payments** - Multi-gateway support (Cashfree, Razorpay)
- 📊 **Smart Analytics** - Interactive charts and data visualization
- 🔍 **Advanced Filtering** - Multi-parameter search and export functionality
- 🔐 **Secure Architecture** - JWT authentication with role-based access

## 🌟 Core Features

### 🎛️ Modern Dashboard Experience
- **Auto-Collapsing Sidebar** - Hover-to-expand with smooth animations
- **Dark/Light Theme Toggle** - System preference detection with localStorage persistence
- **Interactive Charts** - Real-time data visualization with Recharts
- **Smart Navigation** - Tooltip-enabled icon navigation
- **Session Management** - Automatic timeout with warning modals

### 👨‍🎓 Enhanced Student Portal
- **Unified Login System** - Single interface for all user types
- **Personalized Dashboard** - Academic progress and payment tracking
- **Payment History** - Detailed transaction records with receipt downloads
- **Real-time Notifications** - Instant updates on payments and announcements
- **Mobile-Optimized** - Progressive Web App (PWA) ready interface

### 💼 Advanced Administrative Suite
- **Multi-Role Management** - Admin, Finance, Faculty access levels
- **Student Lifecycle Management** - Complete student record management
- **Branch & Department Control** - Multi-campus support with hierarchical structure
- **Attendance Tracking** - Digital attendance with analytics
- **Result Management** - Grade recording and transcript generation

### 💰 Sophisticated Finance Management
- **Advanced Payment Filtering** - Filter by branch, semester, payment type, status, date range
- **Excel Export System** - Comprehensive data export with custom formatting
- **Payment Gateway Integration** - Cashfree and Razorpay support
- **QR Code Payments** - Dynamic UPI payment generation
- **Financial Analytics** - Revenue tracking with interactive dashboards
- **Payment History Management** - Dedicated interface for transaction monitoring
- **Student Payment Tracking** - Individual payment summaries with totals

### 🔧 Technical Excellence
- **Type-Safe Development** - Full TypeScript implementation
- **Modern State Management** - React 19 hooks and context patterns
- **Optimized Performance** - Code splitting and lazy loading
- **API Security** - JWT tokens with refresh mechanism
- **Database Optimization** - MongoDB aggregation pipelines
- **Error Handling** - Comprehensive error boundaries and logging

## 🏗️ Architecture & Tech Stack

### Frontend Technology Stack
```typescript
// Core Framework
React 19.1.1 + TypeScript 5.0+
Vite 7.1.3 (Ultra-fast build tool)

// UI & Styling
Tailwind CSS 4.1+ (Utility-first CSS)
Framer Motion 12.23+ (Smooth animations)
Lucide React 0.541+ (Modern icon library)
@ark-ui/react 5.21+ (Headless UI components)

// Data & State Management
Axios 1.11+ (HTTP client)
React Router DOM 7.8+ (Client-side routing)
Context API + Hooks (State management)

// Visualization & Analytics
Recharts 3.1+ (Charts and graphs)
XLSX library (Excel export functionality)

// Real-time Features
Socket.io Client 4.8+ (WebSocket communication)
```

### Backend Technology Stack
```javascript
// Core Runtime
Node.js 20+ with Express.js 5.1+

// Database & ODM
MongoDB 6.18+ (NoSQL database)
Mongoose 8.18+ (Object Document Mapper)
Mongoose-Paginate-v2 (Advanced pagination)

// Authentication & Security
JSON Web Token 9.0+ (JWT authentication)
Bcrypt.js 3.0+ (Password hashing)
CORS 2.8+ (Cross-origin resource sharing)

// Payment Processing
Cashfree PG 5.0+ (Payment gateway)
Razorpay 2.9+ (Alternative payment gateway)

// Utilities & Features
XLSX 0.18+ (Excel file processing)
Socket.io 4.8+ (Real-time communication)
Dotenv 17.2+ (Environment management)
```

## 📁 Enhanced Project Structure

```
CMS/
├── 📁 backend/                     # Node.js Express Server
│   ├── 📁 controllers/            # Business logic controllers
│   │   ├── attendanceController.js
│   │   ├── facultyController.js
│   │   └── resultController.js
│   ├── 📁 middleware/             # Custom middleware
│   │   └── auth.js               # JWT authentication
│   ├── 📁 models/                # MongoDB schemas
│   │   ├── User.js              # User authentication model
│   │   ├── Student.js           # Student information model
│   │   ├── Payment.js           # Payment transactions
│   │   ├── Branch.js            # Branch/Department model
│   │   ├── Department.js        # Department management
│   │   └── Notification.js      # System notifications
│   ├── 📁 routes/                # API endpoints
│   │   ├── auth.js              # Authentication routes
│   │   ├── admin.js             # Admin management
│   │   ├── students.js          # Student operations
│   │   ├── payments.js          # Payment processing
│   │   ├── dashboard.js         # Dashboard data
│   │   ├── finance.js           # Finance operations
│   │   ├── branches.js          # Branch management
│   │   ├── studentManagement.js # Student lifecycle
│   │   └── razorpayRoutes.js    # Razorpay integration
│   ├── 📄 server.js             # Main server configuration
│   ├── 📄 vercel.json           # Vercel deployment config
│   └── 📄 package.json          # Backend dependencies
│
├── 📁 frontend/                    # React TypeScript Application
│   ├── 📁 src/
│   │   ├── 📁 components/         # Reusable UI components
│   │   │   ├── SessionIndicator.tsx
│   │   │   ├── SessionTest.tsx
│   │   │   ├── SessionWarningModal.tsx
│   │   │   ├── StudentSection.tsx
│   │   │   ├── UnifiedLogin.tsx
│   │   │   └── 📁 ui/            # Base UI components
│   │   │       ├── button.tsx
│   │   │       ├── sidebar.tsx
│   │   │       ├── table.tsx
│   │   │       └── simple-table.tsx
│   │   ├── 📁 pages/             # Main application pages
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── StudentDashboardNew.tsx
│   │   │   ├── FinanceDashboard.tsx  # Enhanced finance management
│   │   │   ├── StudentManagement.tsx
│   │   │   ├── CollegeManagement.tsx
│   │   │   ├── CustomPayment.tsx
│   │   │   └── PaymentResult.tsx
│   │   ├── 📁 config/            # Configuration files
│   │   │   ├── api.ts           # API configuration
│   │   │   └── session.ts       # Session management
│   │   ├── 📁 hooks/             # Custom React hooks
│   │   │   └── useSessionTimeout.ts
│   │   ├── 📁 services/          # External service integrations
│   │   │   └── razorpayService.ts
│   │   ├── 📁 lib/               # Utility functions
│   │   │   └── utils.ts
│   │   ├── 📄 App.tsx           # Main application component
│   │   └── 📄 main.tsx          # Application entry point
│   ├── 📄 index.html            # HTML template
│   ├── 📄 vite.config.ts        # Vite configuration
│   ├── 📄 tailwind.config.js    # Tailwind CSS config
│   ├── 📄 components.json       # UI component registry
│   ├── 📄 park-ui.json          # Park UI configuration
│   └── 📄 package.json          # Frontend dependencies
│
└── 📄 README.md                  # Project documentation
```

## 🚀 Quick Start Guide

### Prerequisites
Ensure you have the following installed:
- **Node.js** (v20 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v6.0 or higher) - [Download](https://mongodb.com/try/download/community)
- **npm** or **yarn** - Package manager
- **Git** - Version control

### 1. Repository Setup
```bash
# Clone the repository
git clone https://github.com/Gyanranjan-Priyam/cms.git
cd cms

# Install dependencies for both frontend and backend
npm run install:all  # If available, or install manually
```

### 2. Backend Configuration
```bash
cd backend
npm install

# Create environment configuration
cp .env.example .env  # If available, or create manually
```

**Create `.env` file in backend directory:**
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/cms_db
MONGODB_TEST_URI=mongodb://localhost:27017/cms_test_db

# Authentication (IMPORTANT: Use strong, unique secrets in production)
JWT_SECRET=generate_your_own_secure_32_character_secret_key
JWT_REFRESH_SECRET=generate_your_own_refresh_token_secret_key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Payment Gateway - Cashfree (Get from https://merchant.cashfree.com/)
CASHFREE_APP_ID=TEST_xxxxxxxxxxxxxxxxxxxxxxxx
CASHFREE_SECRET_KEY=cfsk_ma_test_xxxxxxxxxxxxxxxxxxxxxxxx
CASHFREE_BASE_URL=https://sandbox.cashfree.com/pg
CASHFREE_API_VERSION=2023-08-01

# Payment Gateway - Razorpay (Get from https://dashboard.razorpay.com/)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# File Upload (Optional)
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10MB

# Email Configuration (Optional - Use App Password for Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_college_email@gmail.com
SMTP_PASS=your_gmail_app_password
```

### 3. Frontend Configuration
```bash
cd ../frontend
npm install

# Create environment configuration
```

**Create `.env` file in frontend directory:**
```env
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_API_TIMEOUT=10000

# Application Configuration
VITE_APP_TITLE=College Management System
VITE_APP_VERSION=2.0.0
VITE_APP_DESCRIPTION=Modern College Management System

# Payment Gateway Keys (Public Keys Only - Never expose secret keys)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
VITE_CASHFREE_APP_ID=TEST_xxxxxxxxxxxxxxxxxxxxxxxx

# Feature Flags
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PWA=true

# Environment
VITE_NODE_ENV=development
```

### 4. Database Initialization
```bash
# Ensure MongoDB is running
mongod  # Or start MongoDB service

# Create admin user and sample data
cd backend
node scripts/setup-database.js  # If available
# OR manually create admin user:
node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/cms_db');

const createAdmin = async () => {
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const admin = new User({
    username: 'admin',
    email: 'admin@college.edu',
    password: hashedPassword,
    role: 'admin',
    isActive: true
  });
  await admin.save();
  console.log('Admin user created successfully');
  process.exit(0);
};

createAdmin().catch(console.error);
"
```

## 🏃‍♂️ Running the Application

### Development Mode (Recommended)
Start both servers concurrently for development:

```bash
# Terminal 1 - Backend Server
cd backend
npm run dev  # Uses nodemon for auto-restart
# Server runs on http://localhost:5000

# Terminal 2 - Frontend Development Server
cd frontend
npm run dev  # Vite dev server with HMR
# Application runs on http://localhost:5173
```

### Production Mode
```bash
# Build frontend for production
cd frontend
npm run build
# Creates optimized build in dist/ folder

# Start backend in production mode
cd ../backend
NODE_ENV=production npm start
# Serves frontend from backend server
```

### Docker Deployment (Optional)
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build individual containers
docker build -t cms-backend ./backend
docker build -t cms-frontend ./frontend
```

### Access Points
- **🌐 Frontend Application:** http://localhost:5173
- **🔧 Backend API:** http://localhost:5000
- **📊 API Documentation:** http://localhost:5000/api-docs (if Swagger enabled)
- **🗄️ MongoDB:** mongodb://localhost:27017/cms_db

### Default Login Credentials
```
⚠️  CHANGE THESE CREDENTIALS IMMEDIATELY AFTER SETUP

Admin Access:
Username: admin
Password: admin123

Test Student (if sample data loaded):
Registration: STU001
Password: student123

🔒 Security Note: These are default credentials for initial setup only.
   Change them immediately in production environments.
```

## 🎯 Feature Showcase

### 🎨 Modern UI/UX Features
- **🌓 Dark/Light Theme** - Seamless theme switching with system preference detection
- **📱 Responsive Design** - Mobile-first approach with Tailwind CSS
- **🎭 Smooth Animations** - Framer Motion powered transitions
- **🔍 Smart Search** - Real-time filtering with debounced input
- **📊 Interactive Charts** - Dynamic data visualization with Recharts

### 💳 Advanced Payment System
- **🏦 Multi-Gateway Support** - Cashfree and Razorpay integration
- **📱 QR Code Payments** - Dynamic UPI payment generation
- **📋 Payment History** - Comprehensive transaction tracking
- **💰 Smart Analytics** - Revenue insights and payment trends
- **📤 Excel Export** - Custom formatted financial reports

### 👥 Enhanced Student Management
- **🔍 Advanced Filtering** - Multi-parameter search (branch, semester, status)
- **📊 Student Analytics** - Payment summaries and academic progress
- **📁 Bulk Operations** - Mass import/export of student data
- **🔔 Real-time Notifications** - Instant updates and alerts

### 🛡️ Security & Performance
- **🔐 JWT Authentication** - Secure token-based auth with refresh tokens
- **🔒 Role-based Access** - Granular permission system
- **⚡ Optimized Performance** - Code splitting and lazy loading
- **🛡️ Input Validation** - Comprehensive server-side validation

## 📊 API Documentation

### Authentication Endpoints
```http
POST /api/auth/login          # User authentication
POST /api/auth/logout         # Session termination
POST /api/auth/refresh        # Token refresh
POST /api/auth/register       # New user registration
GET  /api/auth/me            # Current user profile
```

### Student Management
```http
GET    /api/students                    # List students with pagination
POST   /api/students                    # Create new student
GET    /api/students/:id               # Get student details
PUT    /api/students/:id               # Update student information
DELETE /api/students/:id               # Remove student
GET    /api/students/search            # Advanced student search
POST   /api/students/bulk-import       # Bulk student import
GET    /api/students/export            # Export student data
```

### Payment Processing
```http
GET    /api/payments                   # List payments with filters
POST   /api/payments/manual           # Manual payment entry
POST   /api/payments/create-order     # Payment gateway order
POST   /api/payments/verify           # Payment verification
GET    /api/payments/history          # Payment history
DELETE /api/payments/:id              # Cancel/remove payment
GET    /api/payments/export           # Export payment data
GET    /api/payments/analytics        # Payment analytics
```

### Finance Dashboard
```http
GET    /api/finance/dashboard         # Finance overview
GET    /api/finance/revenue           # Revenue analytics
GET    /api/finance/students          # Student financial data
GET    /api/finance/branches          # Branch-wise finances
GET    /api/finance/reports           # Financial reports
```

### Administrative
```http
GET    /api/admin/dashboard           # Admin overview
GET    /api/admin/users               # User management
POST   /api/admin/users               # Create new user
PUT    /api/admin/users/:id           # Update user
GET    /api/admin/branches            # Branch management
POST   /api/admin/branches            # Create branch
GET    /api/admin/notifications       # System notifications
POST   /api/admin/notifications       # Send notification
```

## � Security & Environment Setup

### 🚨 **IMPORTANT SECURITY NOTICE**
**NEVER commit your actual API keys, secrets, or database URIs to version control!**

- Use `.env` files for local development
- Add `.env` to your `.gitignore` file
- Use environment variables in production
- Rotate keys regularly
- Use different keys for development/staging/production

### 🛡️ Security Best Practices
```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore

# Generate secure JWT secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### �🔧 Configuration Guide

### Environment Variables Reference

#### Backend Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | Primary database connection | `mongodb://localhost:27017/cms_db` | ✅ |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | - | ✅ |
| `CASHFREE_APP_ID` | Cashfree payment app ID (from dashboard) | - | ✅ |
| `CASHFREE_SECRET_KEY` | Cashfree secret key (keep secure) | - | ✅ |
| `RAZORPAY_KEY_ID` | Razorpay public key (from dashboard) | - | ✅ |
| `RAZORPAY_KEY_SECRET` | Razorpay private key (keep secure) | - | ✅ |
| `PORT` | Server port number | `5000` | ❌ |
| `NODE_ENV` | Environment mode | `development` | ❌ |
| `CORS_ORIGIN` | Allowed frontend origins | `http://localhost:5173` | ❌ |

#### Frontend Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000` | ✅ |
| `VITE_APP_TITLE` | Application title | `CMS` | ❌ |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public key (safe for frontend) | - | ✅ |
| `VITE_ENABLE_DARK_MODE` | Enable dark theme toggle | `true` | ❌ |

### Payment Gateway Setup

#### Cashfree Configuration
1. Sign up at [Cashfree Dashboard](https://merchant.cashfree.com/)
2. Get your App ID and Secret Key from API section
3. Configure webhook URLs for payment verification
4. Update environment variables with your credentials

#### Razorpay Configuration
1. Create account at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Generate API keys from Settings > API Keys
3. Configure webhooks for payment notifications
4. Update both backend and frontend environment files

### Database Configuration
```javascript
// MongoDB connection options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  bufferCommands: false,
};
```

## 🧪 Testing & Quality Assurance

### Running Tests
```bash
# Backend tests
cd backend
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:coverage      # Test coverage report

# Frontend tests
cd frontend
npm test                   # Run all tests
npm run test:unit         # Unit tests
npm run test:e2e          # End-to-end tests
npm run test:coverage     # Coverage report
```

### Test Payment Flow
```bash
# Run payment system tests
cd backend
node scripts/test-payment-flow.js

# Test finance dashboard functionality
node scripts/testFinanceFunctionality.js
```

### Quality Checks
```bash
# Frontend linting and formatting
cd frontend
npm run lint              # ESLint checks
npm run lint:fix          # Auto-fix linting issues
npm run type-check        # TypeScript checks

# Backend code quality
cd backend
npm run lint              # ESLint checks
npm run security-audit    # Security vulnerability scan
```

## 🚀 Deployment Guide

### Production Checklist
- [ ] Update all environment variables for production
- [ ] Configure production MongoDB instance
- [ ] Set up SSL certificates (HTTPS)
- [ ] Switch payment gateways to production mode
- [ ] Configure CDN for static assets
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies
- [ ] Test all critical flows in production environment

### Vercel Deployment (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

### Railway/Render Deployment (Backend)
1. Connect your GitHub repository
2. Set environment variables in platform dashboard
3. Configure build and start commands
4. Deploy and monitor

### Docker Production Deployment
```dockerfile
# docker-compose.prod.yml
version: '3.8'
services:
  mongodb:
    image: mongo:6.0
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: secure_password_here
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build: ./backend
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:secure_password_here@mongodb:27017/cms_db?authSource=admin
    ports:
      - "5000:5000"
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongo_data:
```

## 🎯 Advanced Features

### Real-time Features
- **Live Notifications** - Socket.io powered real-time updates
- **Payment Status Updates** - Instant payment confirmation
- **User Activity Tracking** - Real-time user presence
- **Dashboard Auto-refresh** - Live data updates without page reload

### Analytics & Reporting
- **Interactive Dashboards** - Charts and graphs with drill-down capability
- **Custom Report Builder** - User-defined report generation
- **Data Export** - Multiple format support (Excel, PDF, CSV)
- **Automated Reports** - Scheduled report generation and email delivery

### Mobile & PWA Features
- **Progressive Web App** - Offline functionality and app-like experience
- **Push Notifications** - Browser and mobile push notifications
- **Mobile Optimized UI** - Touch-friendly interface design
- **Offline Data Sync** - Local storage with sync when online

### Security Features
- **Two-Factor Authentication** - Optional 2FA for enhanced security
- **Session Management** - Advanced session timeout and security
- **Audit Logging** - Comprehensive activity tracking
- **Data Encryption** - Sensitive data encryption at rest and in transit

## 📈 Performance Optimization

### Frontend Optimizations
- **Code Splitting** - Route-based and component-based splitting
- **Lazy Loading** - On-demand component loading
- **Image Optimization** - WebP format with fallbacks
- **Bundle Analysis** - Webpack bundle analyzer integration
- **Caching Strategy** - Service worker implementation

### Backend Optimizations
- **Database Indexing** - Optimized MongoDB queries
- **Connection Pooling** - Efficient database connections
- **Caching Layer** - Redis integration for frequently accessed data
- **API Rate Limiting** - Request throttling and protection
- **Compression** - Gzip compression for responses

### Monitoring & Analytics
```bash
# Performance monitoring setup
npm install --save-dev webpack-bundle-analyzer
npm install --save helmet compression morgan
```

## 🤝 Contributing Guidelines

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards
- **TypeScript** - Strict mode enabled
- **ESLint** - Airbnb configuration
- **Prettier** - Code formatting
- **Conventional Commits** - Commit message standards
- **Component Documentation** - JSDoc comments required

### Development Guidelines
```bash
# Before submitting PR
npm run lint:fix          # Fix linting issues
npm run type-check        # TypeScript validation
npm run test:coverage     # Ensure test coverage
npm run build            # Verify production build
```

## 📞 Support & Community

### Getting Help
- 📚 **Documentation** - Comprehensive guides and API reference
- 🐛 **Issue Tracker** - Report bugs and request features
- 💬 **Discussions** - Community Q&A and discussions
- 📧 **Email Support** - Direct support for critical issues

### Community Resources
- **Discord Server** - Real-time community chat
- **Stack Overflow** - Technical questions with `cms-college` tag
- **YouTube Tutorials** - Video guides and walkthroughs
- **Blog Posts** - Implementation tips and best practices

## 📝 License & Legal

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### Third-party Acknowledgments
- React team for the amazing framework
- Tailwind CSS for utility-first styling
- MongoDB for flexible database solution
- Cashfree and Razorpay for payment processing
- All open-source contributors

## 🔄 Changelog & Roadmap

### Current Version: v2.0.0
- ✅ Modern React 19 implementation
- ✅ Dark/Light theme with smooth transitions
- ✅ Advanced finance dashboard with filtering
- ✅ Auto-collapsing sidebar with hover functionality
- ✅ Excel export with comprehensive data
- ✅ Real-time payment tracking
- ✅ Enhanced student management

### Upcoming Features (v2.1.0)
- 🔜 Mobile app development (React Native)
- 🔜 Advanced analytics dashboard
- 🔜 Two-factor authentication
- 🔜 Automated report generation
- 🔜 Integration with external APIs
- 🔜 Advanced notification system
- 🔜 Bulk operations enhancement

### Future Roadmap (v3.0.0)
- 🚀 AI-powered insights and recommendations
- 🚀 Advanced reporting with custom templates
- 🚀 Integration with learning management systems
- 🚀 Advanced role-based permissions
- 🚀 Multi-tenant architecture support
- 🚀 Advanced audit and compliance features

---

<div align="center">

**🎓 Built with ❤️ for Modern Educational Institutions**

*Empowering education through technology*

[![GitHub stars](https://img.shields.io/github/stars/Gyanranjan-Priyam/cms?style=social)](https://github.com/Gyanranjan-Priyam/cms)
[![GitHub forks](https://img.shields.io/github/forks/Gyanranjan-Priyam/cms?style=social)](https://github.com/Gyanranjan-Priyam/cms/fork)
[![GitHub issues](https://img.shields.io/github/issues/Gyanranjan-Priyam/cms)](https://github.com/Gyanranjan-Priyam/cms/issues)

</div>
- **Bcrypt** for password hashing
- **Cashfree SDK** for payment processing
- **CORS** for cross-origin requests
- **Dotenv** for environment management

### Database
- **MongoDB** - NoSQL database for flexible data storage
- **Mongoose** - ODM for MongoDB with schema validation
- **Aggregation Pipelines** - Complex queries for reporting

## 📁 Project Structure

```
CMS/
├── backend/                    # Backend server
│   ├── models/                # Database models
│   │   ├── User.js           # User authentication model
│   │   ├── Student.js        # Student information model
│   │   ├── Payment.js        # Payment transaction model
│   │   ├── Branch.js         # Branch/Department model
│   │   └── Notification.js   # Notification system model
│   ├── routes/                # API endpoints
│   │   ├── auth.js           # Authentication routes
│   │   ├── students.js       # Student management routes
│   │   ├── payments.js       # Payment processing routes
│   │   ├── dashboard.js      # Dashboard data routes
│   │   └── branches.js       # Branch management routes
│   ├── middleware/            # Custom middleware
│   │   └── auth.js           # JWT authentication middleware
│   ├── server.js             # Main server file
│   ├── create-admin.js       # Admin user creation utility
│   ├── cleanup-test-payments.js # Database cleanup utility
│   ├── delete-script.js      # Payment deletion functionality
│   └── package.json          # Backend dependencies
├── frontend/                  # React application
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── AdminLogin.tsx
│   │   │   ├── StudentLogin.tsx
│   │   │   └── ui/           # UI components
│   │   ├── pages/            # Main application pages
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── FinanceDepartment.tsx
│   │   │   ├── StudentManagement.tsx
│   │   │   ├── CustomPayment.tsx
│   │   │   └── PaymentResult.tsx
│   │   ├── lib/              # Utility functions
│   │   │   └── utils.ts
│   │   ├── App.tsx           # Main application component
│   │   └── main.tsx          # Application entry point
│   ├── public/               # Static assets
│   ├── index.html            # HTML template
│   ├── vite.config.ts        # Vite configuration
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   └── package.json          # Frontend dependencies
└── README.md                 # Project documentation
```

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn** package manager

### 1. Clone the Repository
```bash
git clone <repository-url>
cd CMS
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/cms

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Cashfree Payment Gateway (Sandbox)
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_BASE_URL=https://sandbox.cashfree.com/pg

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:5000
VITE_APP_TITLE=College Management System
```

### 4. Database Setup
Make sure MongoDB is running, then create an admin user:
```bash
cd backend
node create-admin.js
```

## 🚀 Running the Application

### Development Mode
Start both servers in development mode:

**Backend (Terminal 1):**
```bash
cd backend
npm start
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

### Production Mode
```bash
# Build frontend
cd frontend
npm run build

# Start backend in production
cd ../backend
NODE_ENV=production npm start
```

### Access the Application
- **Frontend:** http://localhost:5173 (development) or http://localhost:5174
- **Backend API:** http://localhost:5000
- **Admin Panel:** Login with admin credentials created in setup

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `CASHFREE_APP_ID` | Cashfree payment gateway app ID | Yes |
| `CASHFREE_SECRET_KEY` | Cashfree secret key | Yes |
| `CASHFREE_BASE_URL` | Cashfree API base URL | Yes |
| `PORT` | Server port number | No (default: 5000) |

#### Frontend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |
| `VITE_APP_TITLE` | Application title | No |

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Payments
- `GET /api/payments` - Get payments with filtering
- `POST /api/payments/manual` - Create manual payment
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/history` - Get payment history
- `GET /api/payments/export` - Export payments to Excel

### Dashboard
- `GET /api/dashboard/admin` - Admin dashboard data
- `GET /api/dashboard/student` - Student dashboard data
- `GET /api/dashboard/finance` - Finance dashboard data

## 🎨 Key Features Explained

### Smart Payment System
- **QR Code Generation** - Dynamic QR codes for UPI payments
- **Transaction Tracking** - Real-time payment status updates
- **Multiple Payment Methods** - Support for various payment options
- **Auto-cleanup** - Automatic cleanup of test/failed payments

### Advanced Finance Dashboard
- **Branch Filtering** - Filter payments by department/branch
- **Semester-based Filtering** - Student categorization by semester
- **Excel Export** - Export filtered data with comprehensive formatting
- **Payment History** - Dedicated tab for completed transactions
- **Real-time Analytics** - Live dashboard with charts and metrics

### Responsive Design
- **Mobile-first Approach** - Optimized for all device sizes
- **Dark Mode Support** - Toggle between light and dark themes
- **Smooth Animations** - Framer Motion integration for enhanced UX
- **Modern UI** - Clean, professional interface design

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt for secure password storage
- **Role-based Access** - Different access levels for users
- **Input Validation** - Server-side validation for all inputs
- **CORS Protection** - Configured cross-origin resource sharing

## 🚀 Deployment

### Production Checklist
1. **Environment Variables** - Update all production URLs and keys
2. **Database** - Set up production MongoDB instance
3. **SSL Certificates** - Enable HTTPS for production
4. **Payment Gateway** - Switch to production Cashfree credentials
5. **Build Optimization** - Run production builds for frontend

### Docker Deployment (Optional)
```dockerfile
# Backend Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

### Test Payment Flow
1. Login as admin
2. Create test student
3. Add payment record
4. Test custom payment with QR code
5. Verify payment completion
6. Check finance dashboard

### Database Cleanup
```bash
cd backend
node cleanup-test-payments.js
```

## 📈 Performance Optimization

- **Code Splitting** - Lazy loading of React components
- **Image Optimization** - Compressed assets and icons
- **Database Indexing** - Optimized MongoDB queries
- **Caching** - Redis integration for session management
- **CDN Integration** - Static asset delivery optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added payment gateway integration
- **v1.2.0** - Enhanced finance dashboard with filtering
- **v1.3.0** - Added Excel export and payment history

---

**Built with ❤️ for educational institutions**
