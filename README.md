# 🎓 College Management System (CMS)

A comprehensive web-based College Management System built with React, Node.js, and MongoDB. This system provides complete management capabilities for educational institutions including student management, payment processing, finance tracking, and administrative controls.

## 🌟 Features

### 👨‍🎓 Student Portal
- **Student Dashboard** - Personalized dashboard with academic information
- **Payment Management** - View payment history, pending dues, and make payments
- **Custom Payment System** - UPI/QR code integration for seamless payments
- **Real-time Notifications** - Payment confirmations and updates
- **Responsive Design** - Mobile-friendly interface

### 👨‍💼 Administrative Portal
- **Admin Dashboard** - Complete overview of institutional metrics
- **Student Management** - Add, edit, and manage student records
- **Finance Department** - Comprehensive payment tracking and reporting
- **Branch Management** - Multi-branch/department support
- **User Management** - Role-based access control

### 💳 Payment System
- **Multiple Payment Methods** - Cash, Online, Cheque support
- **Payment Gateway Integration** - Cashfree integration for online payments
- **Custom Payment Flow** - QR code generation and transaction tracking
- **Payment History** - Detailed transaction records with Excel export
- **Receipt Management** - Automated receipt generation

### 📊 Finance Management
- **Advanced Filtering** - Filter by branch, semester, payment type, status
- **Excel Export** - Export payment data and history reports
- **Dashboard Analytics** - Revenue tracking and payment distribution charts
- **Branch-wise Reporting** - Department-specific financial insights
- **Payment History Tab** - Comprehensive transaction management

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling
- **Framer Motion** for smooth animations
- **Lucide React** for modern icons
- **Recharts** for data visualization
- **XLSX** for Excel export functionality
- **Axios** for API communication

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
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
