const express = require('express');
const jwt = require('jsonwebtoken');
const PG = require('../models/PG');
const auth = require('../middleware/auth');

const router = express.Router();

// Register new PG
router.post('/register', async (req, res) => {
    try {
        const { name, ownerName, phone, email, password, language, securityQuestion, securityAnswer } = req.body;

        // Check if PG with email already exists
        const existingPG = await PG.findOne({ email });
        if (existingPG) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const pg = new PG({
            name,
            ownerName,
            phone,
            email,
            password,

            language: language || 'en',
            securityQuestion,
            securityAnswer
        });

        await pg.save();

        const token = jwt.sign({ id: pg._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        res.status(201).json({
            token,
            pg: {
                id: pg._id,
                name: pg.name,
                ownerName: pg.ownerName,
                email: pg.email,
                language: pg.language
            }
        });
    } catch (error) {
        console.error('Registration Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for:', email);

        const pg = await PG.findOne({ email });
        if (!pg) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await pg.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: pg._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        res.json({
            token,
            pg: {
                id: pg._id,
                name: pg.name,
                ownerName: pg.ownerName,
                email: pg.email,
                language: pg.language,
                defaultRentCycle: pg.defaultRentCycle,
                fixedRentDate: pg.fixedRentDate,
                defaultFoodEnabled: pg.defaultFoodEnabled
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        res.json({
            pg: {
                id: req.pg._id,
                name: req.pg.name,
                ownerName: req.pg.ownerName,
                email: req.pg.email,
                phone: req.pg.phone,
                language: req.pg.language,
                defaultRentCycle: req.pg.defaultRentCycle,
                fixedRentDate: req.pg.fixedRentDate,
                defaultFoodEnabled: req.pg.defaultFoodEnabled
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update settings
router.put('/settings', auth, async (req, res) => {
    try {
        const updates = req.body;
        const allowedUpdates = ['name', 'ownerName', 'phone', 'language', 'defaultRentCycle', 'fixedRentDate', 'defaultFoodEnabled'];

        const updateFields = {};

        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updateFields[key] = updates[key];
            }
        });

        // Use findByIdAndUpdate to avoid validation errors on unrelated required fields (legacy data support)
        const updatedPG = await PG.findByIdAndUpdate(
            req.pgId,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        res.json({ pg: updatedPG });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get Security Question
router.post('/security-question', async (req, res) => {
    try {
        const { email } = req.body;
        const pg = await PG.findOne({ email });

        if (!pg) {
            return res.status(404).json({ message: 'Email not found' });
        }

        res.json({ question: pg.securityQuestion });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, securityAnswer, newPassword } = req.body;

        const pg = await PG.findOne({ email });
        if (!pg) {
            return res.status(404).json({ message: 'Email not found' });
        }

        const isMatch = await pg.compareSecurityAnswer(securityAnswer);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect security answer' });
        }

        pg.password = newPassword;
        await pg.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
