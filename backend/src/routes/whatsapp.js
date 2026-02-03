const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const auth = require('../middleware/auth');

const fs = require('fs');
const path = require('path');

const router = express.Router();

// Store active clients: userId -> { client, qr, isReady, isInitializing }
const clients = new Map();

const SESSION_DIR = path.resolve(process.cwd(), '.wwebjs_auth');
const CACHE_DIR = path.resolve(process.cwd(), '.cache/puppeteer');

// Helper to get or create client state
const getClientState = (userId) => {
    if (!clients.has(userId)) {
        clients.set(userId, {
            client: null,
            qr: null,
            isReady: false,
            isInitializing: false,
            lastError: null,
            stage: 'idle',
            qr: null
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

        console.log(`[WhatsApp] [Init] Initializing for user: ${userId}`);
        console.log(`[WhatsApp] [Init] Puppeteer Cache: ${path.join(process.cwd(), '.cache/puppeteer')}`);

        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: userId,
                dataPath: SESSION_DIR
            }),
            authTimeoutMs: 120000, // Increase to 2 minutes for slow cloud servers
            puppeteer: {
                headless: true,
                handleSIGINT: false,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu',
                    '--window-size=1280,720',
                    '--disable-extensions',
                    '--disable-default-apps',
                    '--mute-audio',
                    '--no-default-browser-check',
                    '--disable-site-isolation-trials',
                    '--no-experiments',
                    '--ignore-gpu-blacklist',
                    '--ignore-certificate-errors',
                    '--ignore-certificate-errors-spki-list',
                    '--disable-extensions',
                    '--proxy-server="direct://"',
                    '--proxy-bypass-list=*'
                ],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
                ignoreHTTPSErrors: true
            }
        });

        state.client = client;

        client.on('qr', (qr) => {
            state.qr = qr;
            state.stage = 'QR Code Ready - Please Scan';
            console.log(`[WhatsApp] [QR] Generated for user: ${userId}`);
        });

        client.on('loading_screen', (percent, message) => {
            state.stage = `Syncing: ${percent}%...`;
            console.log(`[WhatsApp] [Loading] ${percent}% - ${message} for ${userId}`);
        });

        client.on('ready', () => {
            console.log(`WhatsApp client ready for user ${userId}`);
            state.isReady = true;
            state.isInitializing = false;
            state.qr = null;
            state.stage = 'Connected';
            state.lastError = null;
        });

        client.on('authenticated', () => {
            state.stage = 'Scan Successful! Building Session...';
            console.log(`WhatsApp authenticated for user ${userId}`);
        });

        client.on('auth_failure', (msg) => {
            console.error(`WhatsApp auth failure for user ${userId}:`, msg);
            state.isInitializing = false;
            state.isReady = false;
            state.qr = null;
            state.lastError = `Auth Failure: ${msg}`;
            state.stage = 'Auth Failed';
        });

        state.stage = 'Starting Browser Engine...';
        await client.initialize();
        return { status: 'initializing' };

    } catch (error) {
        state.isInitializing = false;
        state.lastError = error.message;
        state.stage = 'Error';
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
        qrCode: state.qr,
        lastError: state.lastError,
        stage: state.stage
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

// Restore sessions on startup
router.restoreSessions = async () => {
    try {
        if (!fs.existsSync(SESSION_DIR)) return;

        const files = fs.readdirSync(SESSION_DIR);
        const sessionFolders = files.filter(f => f.startsWith('session-'));

        console.log(`Found ${sessionFolders.length} WhatsApp sessions to restore`);

        for (const folder of sessionFolders) {
            const userId = folder.replace('session-', '');
            // Initialize but don't wait (async restoration)
            initializeClient(userId).catch(err =>
                console.error(`Failed to restore session for ${userId}:`, err.message)
            );
        }
    } catch (error) {
        console.error('Session restoration failed:', error);
    }
};

module.exports = router;
