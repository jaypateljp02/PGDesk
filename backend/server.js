require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./src/routes/auth');
const roomsRoutes = require('./src/routes/rooms');
const residentsRoutes = require('./src/routes/residents');
const rentRoutes = require('./src/routes/rent');
const foodRoutes = require('./src/routes/food');
const dashboardRoutes = require('./src/routes/dashboard');
const whatsappRoutes = require('./src/routes/whatsapp');

const app = express();

// ======================
// SECURITY MIDDLEWARE
// ======================

// Helmet for security headers
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - restrict to frontend URL
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10kb' })); // Limit body size

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Global rate limiter (100 requests per 15 minutes)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api', globalLimiter);

// Stricter rate limiter for auth routes (15 requests per 15 minutes)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: { message: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// ======================
// DATABASE CONNECTION
// ======================

let isConnected = false;

const connectDB = async () => {
    if (isConnected && mongoose.connection.readyState === 1) return;

    try {
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        await mongoose.connect(process.env.MONGODB_URI, options);
        isConnected = true;
        console.log('✅ Connected to MongoDB Atlas');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        isConnected = false;
        // Don't throw - let request fail gracefully
    }
};

// MongoDB connection events
mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
    isConnected = false;
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err);
    isConnected = false;
});

// ======================
// DB MIDDLEWARE (BEFORE ROUTES)
// ======================
app.use(async (req, res, next) => {
    try {
        await connectDB();
        if (!isConnected) {
            return res.status(503).json({ message: 'Database temporarily unavailable' });
        }
        next();
    } catch (error) {
        return res.status(503).json({ message: 'Database connection failed' });
    }
});

// ======================
// ROUTES
// ======================
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/residents', residentsRoutes);
app.use('/api/rent', rentRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'PGDesk API is running',
        environment: process.env.VERCEL ? 'vercel' : 'local',
        dbConnected: isConnected
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'PGDesk API',
        version: '1.0.0',
        docs: '/api/health'
    });
});

// ======================
// ERROR HANDLING
// ======================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);

    // Don't leak error details in production
    const isDev = process.env.NODE_ENV === 'development';

    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        ...(isDev && { stack: err.stack })
    });
});

// ======================
// START SERVER
// ======================
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    connectDB().then(() => {
        // Restore WhatsApp sessions
        if (whatsappRoutes.restoreSessions) {
            whatsappRoutes.restoreSessions();
        }

        app.listen(PORT, () => {
            console.log(`🚀 PGDesk API running on port ${PORT}`);
        });
    });
}

module.exports = app;
