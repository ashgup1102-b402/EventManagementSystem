require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { sequelize } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const entityRoutes = require('./routes/entity.routes');
const eventRoutes = require('./routes/event.routes');
const menuRoutes = require('./routes/menu.routes');
const discountRoutes = require('./routes/discount.routes');
const bookingRoutes = require('./routes/booking.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const whatsappRoutes = require('./routes/whatsapp.routes');
const searchRoutes = require('./routes/search.routes');
const configRoutes = require('./routes/config.routes');
const slotRoutes = require('./routes/slot.routes');
const categoryRoutes = require('./routes/category.routes');
const masterRoutes = require('./routes/master.routes');

const app = express();

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Auth-specific stricter limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
  const fs = require('fs');
  fs.appendFileSync('debug_log.txt', `[REQ] ${req.method} ${req.url}\n`);
  next();
});
// Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/config', configRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/masters', masterRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Event Management API is running', timestamp: new Date() });
});

// Error handler
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Sync database and start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    await sequelize.sync({ alter: false });
    console.log('✅ Database models synchronized.');
    
    // Seed Roles & Auth
    const seedRoles = require('./seeders/roleSeeder');
    const seedCategories = require('./seeders/categorySeeder');
    await seedRoles();
    await seedCategories();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`📖 API: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
