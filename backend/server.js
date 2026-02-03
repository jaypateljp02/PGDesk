require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const authRoutes = require('./src/routes/auth');
const roomsRoutes = require('./src/routes/rooms');
const residentsRoutes = require('./src/routes/residents');
const rentRoutes = require('./src/routes/rent');
const foodRoutes = require('./src/routes/food');
const dashboardRoutes = require('./src/routes/dashboard');
const whatsappRoutes = require('./src/routes/whatsapp');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/residents', residentsRoutes);
app.use('/api/rent', rentRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running', environment: process.env.VERCEL ? 'vercel' : 'local' });
});

// MongoDB Connection Helper for Serverless
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
    }
};

// Start server for local development
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    });
}

// Middleware to ensure DB connection for every Vercel request
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

module.exports = app;
