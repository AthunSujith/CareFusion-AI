export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const ENDPOINTS = {
    HEALTH: '/api/health',
    UPLOAD: '/api/v2/patients/upload',
    AI: '/api/v2/ai',
};
