const dotenv = require('dotenv');
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.error('Please create a .env file based on .env.example and fill in the required values.');
  process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const branchRoutes = require('./routes/branches');
const dashboardRoutes = require('./routes/dashboard');
const paymentsRoutes = require('./routes/payments');
const razorpayRoutes = require('./routes/razorpayRoutes');

// New University Management System routes
const adminRoutes = require('./routes/admin');
const studentManagementRoutes = require('./routes/studentManagement');
const financeRoutes = require('./routes/finance');


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173", 
    "http://localhost:5174",
    "https://cms-gyanranjanpriyam.netlify.app/",
    /\.vercel\.app$/,
    /\.netlify\.app$/
  ],
  credentials: true
}));
app.use(express.json());

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/results', resultRoutes);
// app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/razorpay', razorpayRoutes);

// University Management System Routes
app.use('/api/admin', adminRoutes);                        // Admin: Department Management
app.use('/api/student-management', studentManagementRoutes); // Student Management Dashboard
app.use('/api/finance', financeRoutes);                     // Finance Department

// Payment success redirect - redirect to frontend with parameters

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
