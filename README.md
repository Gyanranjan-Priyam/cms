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
Password: 01/01/2000

Finance Admin Access:
Username: finance@college.edu
Password: finance123

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

---

<div align="center">

**🎓 Built with ❤️ for Modern Educational Institutions**

*Always for your help."Gyanranjan Priyam"☺️*

[![GitHub stars](https://img.shields.io/github/stars/Gyanranjan-Priyam/cms?style=social)](https://github.com/Gyanranjan-Priyam/cms)
[![GitHub forks](https://img.shields.io/github/forks/Gyanranjan-Priyam/cms?style=social)](https://github.com/Gyanranjan-Priyam/cms/fork)
[![GitHub issues](https://img.shields.io/github/issues/Gyanranjan-Priyam/cms)](https://github.com/Gyanranjan-Priyam/cms/issues)
