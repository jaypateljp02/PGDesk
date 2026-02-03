import { useState, useEffect } from 'react';

/**
 * Hook to handle PWA installation
 * Returns { canInstall, isInstalled, promptInstall }
 */
export const usePWAInstall = () => {
    const [canInstall, setCanInstall] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed as PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check iOS - can't detect install prompt, but check if standalone
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS && window.navigator.standalone) {
            setIsInstalled(true);
            return;
        }

        // Listen for install prompt availability
        const handleInstallAvailable = () => {
            setCanInstall(true);
        };

        window.addEventListener('pwa-install-available', handleInstallAvailable);

        // Check if install prompt is already available
        if (window.deferredPrompt) {
            setCanInstall(true);
        }

        return () => {
            window.removeEventListener('pwa-install-available', handleInstallAvailable);
        };
    }, []);

    const promptInstall = async () => {
        if (window.installPWA) {
            await window.installPWA();
            setCanInstall(false);
        }
    };

    return { canInstall, isInstalled, promptInstall };
};

export default usePWAInstall;
