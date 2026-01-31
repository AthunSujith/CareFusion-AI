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

// 1. Logging and Handshake
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const origin = req.headers.origin || 'INTERNAL';
    console.log(`[${timestamp}] 📡 Handshake: ${req.method} ${req.url} | Origin: ${origin}`);

    // Required for Firefox/Chrome connecting to localhost from a different port
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    res.setHeader('X-Powered-By', 'CareFusion Clinical Node');
    next();
});

// 2. Permanent CORS Bridge
app.use(cors({
    origin: (origin, callback) => {
        // Permit all local dev and deployment patterns
        if (!origin || /localhost|127\.0\.0\.1|loca\.lt|vercel\.app/.test(origin)) {
            callback(null, true);
        } else {
            console.warn(`🚨 Security Block: Unauthorized Origin [${origin}]`);
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'bypass-tunnel-reminder', 'Access-Control-Allow-Private-Network'],
    optionsSuccessStatus: 200
}));

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
