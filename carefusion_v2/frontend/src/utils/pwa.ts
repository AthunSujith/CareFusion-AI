/**
 * Utility to detect if the app is running in 'standalone' (installed) mode.
 */
export const isStandalone = () => {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://')
    );
};

export const getPlatform = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/android/.test(userAgent)) return 'android';
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    return 'desktop';
};
