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

        // Clear any previous timeouts
        if (state._readyTimeout) clearTimeout(state._readyTimeout);

        console.log(`[WhatsApp] [Init] Initializing for user: ${userId}`);
        console.log(`[WhatsApp] [Init] Puppeteer Cache: ${path.join(process.cwd(), '.cache/puppeteer')}`);

        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: userId,
                dataPath: SESSION_DIR
            }),
            authTimeoutMs: 180000, // 3 minutes for very slow servers
            qrMaxRetries: 5,
            takeoverOnConflict: true,
            takeoverTimeoutMs: 10000,
            puppeteer: {
                headless: 'new', // Use NEW headless mode for better stability
                handleSIGINT: false,
                timeout: 120000,
                protocolTimeout: 180000,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--single-process', // Critical for low memory envs
                    '--disable-extensions',
                    '--disable-default-apps',
                    '--mute-audio',
                    '--no-default-browser-check',
                    '--disable-site-isolation-trials',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--ignore-gpu-blacklist',
                    '--ignore-certificate-errors',
                    '--ignore-certificate-errors-spki-list',
                    '--proxy-server="direct://"',
                    '--proxy-bypass-list=*'
                ],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
                ignoreHTTPSErrors: true
            },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        });

        state.client = client;

        // Heartbeat to keep track of connection progress without overwriting STAGE
        let lastActivity = Date.now();
        const heartbeat = setInterval(() => {
            if (state.isReady || !state.isInitializing) {
                clearInterval(heartbeat);
                return;
            }
            const secondsSinceActivity = Math.floor((Date.now() - lastActivity) / 1000);
            if (secondsSinceActivity > 10) {
                if (!state.stage.includes('(Waiting:')) {
                    state.stage = `${state.stage} (Waiting: ${secondsSinceActivity}s)`;
                } else {
                    state.stage = state.stage.replace(/\(Waiting: \d+s\)/, `(Waiting: ${secondsSinceActivity}s)`);
                }
            }
        }, 5000);

        // RAM SAVER: Disable images/css once browser starts
        client.on('browser_launched', async (browser) => {
            try {
                const pages = await browser.pages();
                const page = pages[0];
                await page.setRequestInterception(true);
                page.on('request', (req) => {
                    const resourceType = req.resourceType();
                    if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                        req.abort();
                    } else {
                        req.continue();
                    }
                });
                console.log(`[WhatsApp] [RAM] Image/CSS blocking active for ${userId}`);
            } catch (err) {
                console.error(`[WhatsApp] [RAM] Failed to set interception:`, err.message);
            }
        });

        client.on('qr', (qr) => {
            lastActivity = Date.now();
            state.qr = qr;
            state.stage = 'QR Code Ready - Please Scan';
            console.log(`[WhatsApp] [QR] Generated for user: ${userId}`);
        });

        client.on('loading_screen', (percent, message) => {
            lastActivity = Date.now();
            state.stage = `Syncing: ${percent}%`;
            console.log(`[WhatsApp] [Loading] ${percent}% - ${message} for ${userId}`);
        });

        client.on('change_state', (whatsappState) => {
            lastActivity = Date.now();
            console.log(`[WhatsApp] [State] ${whatsappState} for user ${userId}`);
            if (!state.isReady) state.stage = `State: ${whatsappState}`;
        });

        client.on('ready', () => {
            clearInterval(heartbeat);
            if (state._readyTimeout) clearTimeout(state._readyTimeout); // Clear the timeout

            console.log(`[WhatsApp] [Ready] ✅ Client READY for user ${userId}`);
            console.log(`[WhatsApp] [Ready] Setting isReady=true, isInitializing=false`);
            state.isReady = true;
            state.isInitializing = false;
            state.qr = null;
            state.stage = 'Connected';
            state.lastError = null;
            console.log(`[WhatsApp] [Ready] State updated:`, { isReady: state.isReady, isInitializing: state.isInitializing, stage: state.stage });
        });

        client.on('authenticated', () => {
            lastActivity = Date.now();
            state.stage = 'Scan Successful! Syncing data...';
            console.log(`[WhatsApp] [Auth] Authenticated successfully for user ${userId}`);
            console.log(`[WhatsApp] [Auth] Waiting for ready event...`);

            // Set a timeout: if 'ready' doesn't fire within 2 minutes, something is wrong
            const readyTimeout = setTimeout(() => {
                if (!state.isReady && state.isInitializing) {
                    console.error(`[WhatsApp] [Timeout] 'ready' event not received within 2 minutes for user ${userId}`);
                    state.lastError = 'Connection timed out after authentication. WhatsApp sync took too long. Please click Reset and try again.';
                    state.stage = 'Sync Timeout - Click Reset';
                    state.isInitializing = false;
                    // Try to clean up the client
                    if (state.client) {
                        try {
                            state.client.destroy();
                        } catch (e) {
                            console.error(`[WhatsApp] [Timeout] Failed to destroy client:`, e.message);
                        }
                    }
                }
            }, 120000); // 2 minutes

            // Store timeout so it can be cleared if ready fires
            state._readyTimeout = readyTimeout;
        });

        client.on('auth_failure', (msg) => {
            clearInterval(heartbeat);
            console.error(`[WhatsApp] [Auth Failure] User ${userId}:`, msg);
            state.isInitializing = false;
            state.isReady = false;
            state.qr = null;
            state.lastError = `Auth Failure: ${msg}`;
            state.stage = 'Auth Failed';
        });

        client.on('disconnected', (reason) => {
            clearInterval(heartbeat);
            console.log(`[WhatsApp] [Disconnected] User ${userId} - Reason: ${reason}`);
            state.isReady = false;
            state.isInitializing = false;
            state.qr = null;
            state.stage = `Disconnected: ${reason}`;
            state.lastError = `Disconnected: ${reason}`;
        });

        client.on('message', (msg) => {
            lastActivity = Date.now();
            console.log(`[WhatsApp] [Message] Received message for user ${userId}`);
        });

        state.stage = 'Engine Startup...';
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
    const userSessionPath = path.join(SESSION_DIR, `session-${userId}`);
    return fs.existsSync(userSessionPath);
};

// Initialize WhatsApp client (manual trigger)
router.post('/init', auth, async (req, res) => {
    try {
        const userId = req.pgId.toString();
        const state = getClientState(userId);

        // FORCE RESET: If we were already initializing or error, clean up first
        if (req.query.reset === 'true') {
            try {
                if (state.client) await state.client.destroy();
            } catch (e) { }
            clients.delete(userId);
            const userSessionPath = path.join(SESSION_DIR, `session-${userId}`);
            if (fs.existsSync(userSessionPath)) {
                fs.rmSync(userSessionPath, { recursive: true, force: true });
                console.log(`[WhatsApp] [Reset] Cleaned session for user: ${userId}`);
            }
        }

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
