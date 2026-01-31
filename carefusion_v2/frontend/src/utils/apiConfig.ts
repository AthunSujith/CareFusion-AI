const getStoredTunnel = () => {
    try {
        return localStorage.getItem('carefusion_tunnel_url');
    } catch (e) {
        return null;
    }
};

const DEFAULT_TUNNEL = 'https://clinical-bridge-v2-dev.loca.lt'; // Fallback

export const getApiBase = () => {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

    // Default to the secure tunnel for global access
    let storedTunnel = getStoredTunnel();

    // AUTO-MIGRATE: If stored tunnel is old/stale, clear it to use the new DEFAULT_TUNNEL
    if (storedTunnel && (storedTunnel.includes('v2-bridge') || storedTunnel.includes('doctor-bridge'))) {
        localStorage.removeItem('carefusion_tunnel_url');
        storedTunnel = null;
    }

    const activeTunnel = (storedTunnel || DEFAULT_TUNNEL).replace(/\/$/, '');

    // If on local machine, match the current hostname exactly to avoid cross-host CORS issues
    if (isLocal) {
        return `http://${hostname}:5001`;
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
