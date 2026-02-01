const getStoredTunnel = () => {
    try {
        return localStorage.getItem('carefusion_tunnel_url');
    } catch (e) {
        return null;
    }
};

const DEFAULT_TUNNEL = 'https://breezy-cows-start.loca.lt'; // Fallback

export const getApiBase = () => {
    // 1. Priority: Environment Variable (Vite/Next)
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl) return envUrl;

    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

    // 2. Default to the secure tunnel for global access (from localStorage setting)
    let storedTunnel = getStoredTunnel();

    // AUTO-MIGRATE: If stored tunnel is old/stale, clear it to use the new DEFAULT_TUNNEL
    if (storedTunnel && (storedTunnel.includes('v2-bridge') || storedTunnel.includes('doctor-bridge') || storedTunnel.includes('v2-dev'))) {
        localStorage.removeItem('carefusion_tunnel_url');
        storedTunnel = null;
    }

    const activeTunnel = (storedTunnel || DEFAULT_TUNNEL).replace(/\/$/, '');

    // 3. If on local machine and no env var, default to local backend port 8000
    if (isLocal) {
        return `http://${hostname}:8000`;
    }

    // 4. Otherwise (e.g., on Vercel), use the tunnel
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
    PATIENTS: '/api/v2/patients',
    ADMIN: '/api/v2/admin',
    SIGNUP: '/api/v2/signup'
};



