import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import userRoutes from './routes/user.js';
import patientRoutes from './routes/patients.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

/**
 * 🛠️ ULTIMATE CLINICAL HANDSHAKE MIDDLEWARE
 * Replaces standard CORS to ensure compatibility with Localtunnel, Vercel, and Railtel.
 */
app.use((req, res, next) => {
    // 1. Logging for real-time radar
    if (req.method !== 'OPTIONS') {
        console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.path} | Origin: ${req.headers.origin}`);
    }

    // 2. Inject PNA (Private Network Access) headers
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    res.setHeader('X-Powered-By', 'CareFusion Clinical Node');

    // 3. Dynamic CORS Resolution
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    // 4. Strong Preflight (OPTIONS) Interceptor
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, bypass-tunnel-reminder, Access-Control-Allow-Private-Network');
        res.setHeader('Access-Control-Allow-Max-Age', '86400'); // Cache preflight for 24h
        return res.sendStatus(200);
    }

    next();
});

// Quick Health Check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Routes
app.use('/api/v2/auth', authRoutes);
app.use('/api/v2/ai', aiRoutes);
app.use('/api/v2/users', userRoutes);
app.use('/api/v2/patients', patientRoutes);

// Root Health Check
app.get('/', (req, res) => {
    res.json({ status: 'online', service: 'CareFusion Node Backend', version: '2.0.0' });
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
    console.error('🔥 Global Server Error:', err);
    res.status(500).json({
        status: 'error',
        message: err.message || 'Internal Server Error'
    });
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carefusion_v2';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB (CareFusion V2)');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err);
    });
