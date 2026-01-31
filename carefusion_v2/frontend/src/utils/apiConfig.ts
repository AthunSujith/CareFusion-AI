const getStoredTunnel = () => {
    try {
        return localStorage.getItem('carefusion_tunnel_url');
    } catch (e) {
        return null;
    }
};

const DEFAULT_TUNNEL = 'https://carefusion-v2-bridge.loca.lt'; // Fallback

export const getApiBase = () => {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

    // Default to the secure tunnel for global access
    const storedTunnel = getStoredTunnel();
    const activeTunnel = (storedTunnel || DEFAULT_TUNNEL).replace(/\/$/, '');

    // If on localhost, use the explicit IP to avoid IPv6/DNS resolution delays
    if (isLocal) {
        return `http://127.0.0.1:5000`;
    }

    // Otherwise (e.g., on Vercel), use the hardcoded secure bridge
    console.log('📡 Routed through CareFusion Global Bridge:', activeTunnel);
    return activeTunnel;
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
