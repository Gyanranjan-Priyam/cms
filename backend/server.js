const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const branchRoutes = require('./routes/branches');
const paymentRoutes = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard');
const resultRoutes = require('./routes/results');
const attendanceRoutes = require('./routes/attendance');
const facultyRoutes = require('./routes/faculty');
const facultyDashboardRoutes = require('./routes/facultyDashboard');

// New University Management System routes
const adminRoutes = require('./routes/admin');
const studentManagementRoutes = require('./routes/studentManagement');
const financeRoutes = require('./routes/finance');

const Payment = require('./models/Payment');

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
  origin: ["http://localhost:5173", "http://localhost:5174"],
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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/faculty-dashboard', facultyDashboardRoutes);

// University Management System Routes
app.use('/api/admin', adminRoutes);                        // Admin: Department & Faculty Management
app.use('/api/student-management', studentManagementRoutes); // Student Management Dashboard
app.use('/api/finance', financeRoutes);                     // Finance Department

// Payment success redirect - redirect to frontend with parameters
app.get('/payment-success', (req, res) => {
  const { order_id, status } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  
  // Redirect to frontend payment result page with parameters
  res.redirect(`${frontendUrl}/payment-result?order_id=${order_id}&status=${status || 'success'}`);
});

// Payment failure redirect - redirect to frontend with parameters  
app.get('/payment-failure', (req, res) => {
  const { order_id } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  
  // Redirect to frontend payment result page with failure status
  res.redirect(`${frontendUrl}/payment-result?order_id=${order_id}&status=failed`);
});

// Auto-cleanup job for failed payments
const cleanupFailedPayments = async () => {
  try {
    const now = new Date();
    const result = await Payment.deleteMany({
      autoDeleteAt: { $lte: now },
      status: { $in: ['pending', 'failed'] }
    });
    
    if (result.deletedCount > 0) {
      console.log(`🗑️ Auto-deleted ${result.deletedCount} expired failed payments`);
    }
  } catch (error) {
    console.error('Error in auto-cleanup job:', error);
  }
};

// Run cleanup every minute
setInterval(cleanupFailedPayments, 60 * 1000);

// Run cleanup on startup
cleanupFailedPayments();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
