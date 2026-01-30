const getStoredTunnel = () => {
    try {
        return localStorage.getItem('carefusion_tunnel_url');
    } catch (e) {
        return null;
    }
};

const DEFAULT_TUNNEL = 'https://carefusion-v2-bridge.loca.lt'; // Fallback
const LOCAL_BACKEND = 'http://localhost:5000';

export const getApiBase = () => {
    // If we are on localhost, use local backend directly
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return LOCAL_BACKEND;
    }

    // Use stored tunnel URL if available, otherwise use default
    const storedTunnel = getStoredTunnel();
    return (storedTunnel || DEFAULT_TUNNEL).replace(/\/$/, '');
};

export const setApiBase = (url: string) => {
    let cleanUrl = url.trim().replace(/\/$/, '');
    if (!cleanUrl.startsWith('http')) {
        cleanUrl = 'https://' + cleanUrl;
    }
    localStorage.setItem('carefusion_tunnel_url', cleanUrl);
};

export const API_ENDPOINTS = {
    AI: '/api/v2/ai',
    PATIENTS: '/api/v2/patients'
};
