import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import userRoutes from './routes/user.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v2/auth', authRoutes);
app.use('/api/v2/ai', aiRoutes);
app.use('/api/v2/users', userRoutes);

// Root Health Check
app.get('/', (req, res) => {
    res.json({ status: 'online', service: 'CareFusion Node Backend', version: '2.0.0' });
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
