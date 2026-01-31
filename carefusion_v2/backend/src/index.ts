import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import userRoutes from './routes/user.js';
import patientRoutes from './routes/patients.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// 1. Explicit Clinical Allowlist
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://clinical-vault-bridge-2026.loca.lt",
    "https://clinical-bridge-v2-dev.loca.lt",
    "https://carefusion-v2-bridge.loca.lt",
    "https://care-fusion-ai.vercel.app"
];

// 2. Configure CORS properly (Explicit Allowlist)
app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        // check if the origin is in our allowlist or from a trusted tunnel provider
        const isAllowed = allowedOrigins.includes(origin) ||
            origin.includes('loca.lt') ||
            origin.includes('trycloudflare.com');

        if (isAllowed) {
            return callback(null, true);
        } else {
            console.warn(`🚨 Security Block: CORS origin ${origin} not in allowlist`);
            return callback(new Error("CORS blocked: " + origin));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "bypass-tunnel-reminder", "Access-Control-Allow-Private-Network"],
    credentials: true,
    optionsSuccessStatus: 200
}));

// 3. Explicitly handle OPTIONS preflight (CRITICAL)
// Also inject PNA header for local-to-remote handshakes
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    res.setHeader('X-Powered-By', 'CareFusion Clinical Node');
    next();
});

// Fixed for Express 5: Use regex /.*/ instead of "*" or "(.*)" to avoid PathError
app.options(/.*/, cors());

// Quick Health Check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
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
