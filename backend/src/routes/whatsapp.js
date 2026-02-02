const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const auth = require('../middleware/auth');

const fs = require('fs');
const path = require('path');

const router = express.Router();

// Store active clients: userId -> { client, qr, isReady, isInitializing }
const clients = new Map();

const SESSION_DIR = './.wwebjs_auth';

// Helper to get or create client state
const getClientState = (userId) => {
    if (!clients.has(userId)) {
        clients.set(userId, {
            client: null,
            qr: null,
            isReady: false,
            isInitializing: false
        });
    }
    return clients.get(userId);
};

// Initialize client for a specific user
const initializeClient = async (userId) => {
    const state = getClientState(userId);

    try {
        if (state.isReady) return { status: 'ready' };
        if (state.isInitializing) return { status: 'initializing' };

        state.isInitializing = true;
        state.qr = null; // Reset QR on new init

        console.log(`Initializing WhatsApp for user: ${userId}`);

        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: userId, // Use userId to create separate session files
                dataPath: SESSION_DIR
            }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        state.client = client;

        client.on('qr', (qr) => {
            state.qr = qr;
            // qrcode.generate(qr, { small: true }); // Removed direct terminal output for multi-tenancy
            console.log(`QR Code generated for user ${userId}`);
        });

        client.on('ready', () => {
            console.log(`WhatsApp client ready for user ${userId}`);
            state.isReady = true;
            state.isInitializing = false;
            state.qr = null;
        });

        client.on('authenticated', () => {
            console.log(`WhatsApp authenticated for user ${userId}`);
        });

        client.on('auth_failure', (msg) => {
            console.error(`WhatsApp auth failure for user ${userId}:`, msg);
            state.isInitializing = false;
            state.isReady = false;
            state.qr = null;
        });

        client.on('disconnected', (reason) => {
            console.log(`WhatsApp disconnected for user ${userId}:`, reason);
            state.isReady = false;
            state.isInitializing = false;
            state.client = null;
            state.qr = null;
            clients.delete(userId); // Clean up client state from map
        });

        await client.initialize();
        return { status: 'initializing' };

    } catch (error) {
        state.isInitializing = false;
        console.error(`WhatsApp init error for user ${userId}:`, error);
        throw error;
    }
};

// Check if session exists for user (Lazy Restore Check)
const sessionExists = (userId) => {
    // LocalAuth creates a folder like .wwebjs_auth/session-userId
    const userSessionPath = path.join(SESSION_DIR, `session-${userId}`);
    return fs.existsSync(userSessionPath);
};

// Initialize WhatsApp client (manual trigger)
router.post('/init', auth, async (req, res) => {
    try {
        const userId = req.pgId.toString();
        const result = await initializeClient(userId);
        res.json({
            status: result.status,
            message: result.status === 'ready' ? 'WhatsApp already connected' : 'WhatsApp connecting... Check for QR code.'
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to initialize WhatsApp', error: error.message });
    }
});

// Get connection status and QR code
router.get('/status', auth, (req, res) => {
    const userId = req.pgId.toString();
    const state = getClientState(userId);
    res.json({
        isReady: state.isReady,
        isInitializing: state.isInitializing,
        hasQRCode: !!state.qr,
        qrCode: state.qr
    });
});

// Send bulk reminders - one click automation!
router.post('/send-reminders', auth, async (req, res) => {
    try {
        const { residents } = req.body; // [{phone, name, amount}]
        const userId = req.pgId.toString();
        const state = getClientState(userId);

        // Check connection
        if (!state.isReady || !state.client) {
            // Lazy restoration logic: Check if session exists and try to restore
            if (sessionExists(userId) && !state.isInitializing) {
                console.log(`Lazy restoring session for user ${userId}...`);
                initializeClient(userId).catch(err => console.error('Lazy init failed:', err));

                return res.json({
                    success: false,
                    message: 'Restoring WhatsApp connection... Please wait 15-20 seconds and click "Send All Reminders" again.'
                });
            } else if (state.isInitializing) {
                return res.json({
                    success: false,
                    message: 'WhatsApp is connecting... Please wait a moment and try again.'
                });
            }

            return res.status(400).json({
                success: false,
                message: 'WhatsApp not connected. Please connect from Settings page first.'
            });
        }

        if (!residents || residents.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No residents to send reminders to'
            });
        }

        const results = [];
        for (const r of residents) {
            const cleanPhone = r.phone?.replace(/\D/g, '');
            if (!cleanPhone || cleanPhone.length < 10) {
                results.push({ phone: r.phone, status: 'failed', error: 'Invalid phone number' });
                continue;
            }

            const chatId = `91${cleanPhone.slice(-10)}@c.us`;
            const message = `Hi ${r.name}! 🏠\n\nThis is a friendly reminder that your PG rent of ₹${r.amount?.toLocaleString()} is pending for this month.\n\nPlease make the payment at your earliest convenience.\n\nThank you! 🙏`;

            try {
                await state.client.sendMessage(chatId, message);
                results.push({ phone: r.phone, name: r.name, status: 'sent' });

                // Small delay between messages to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err) {
                console.error(`Failed to send to ${r.phone} for user ${userId}:`, err.message);
                results.push({ phone: r.phone, name: r.name, status: 'failed', error: err.message });
            }
        }

        const sentCount = results.filter(r => r.status === 'sent').length;
        const failedCount = results.filter(r => r.status === 'failed').length;

        res.json({
            success: true,
            message: `Sent ${sentCount} reminder(s)${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
            results,
            summary: { sent: sentCount, failed: failedCount, total: residents.length }
        });
    } catch (error) {
        console.error('Send reminders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send reminders',
            error: error.message
        });
    }
});

// Disconnect WhatsApp
router.post('/disconnect', auth, async (req, res) => {
    try {
        const userId = req.pgId.toString();
        const state = getClientState(userId);
        if (state.client) {
            await state.client.destroy();
        }
        clients.delete(userId); // Remove client state from map

        // Optional: Clean up session file if desired, but LocalAuth usually handles directory
        // We can manually delete the folder if we want to "Forget" the device completely
        try {
            const userSessionPath = path.join(SESSION_DIR, `session-${userId}`);
            if (fs.existsSync(userSessionPath)) {
                fs.rmSync(userSessionPath, { recursive: true, force: true });
                console.log(`Cleaned up session files for user ${userId}`);
            }
        } catch (err) {
            console.error(`Error cleaning up session files for user ${userId}:`, err);
        }

        res.json({ success: true, message: 'WhatsApp disconnected' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to disconnect', error: error.message });
    }
});

module.exports = router;
