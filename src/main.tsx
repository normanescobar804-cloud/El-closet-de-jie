import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker with Automatic Seamless Updating (No reinstallation needed!)
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const updateSW = registerSW({
      immediate: true,
      onOfflineReady() {
        console.log('El Clóset de Jié: Catálogo y tienda listos para funcionar offline.');
      },
      onNeedRefresh() {
        console.log('El Clóset de Jié: Nueva versión detectada en GitHub. Actualizando automáticamente...');
        // Automatically activate new service worker and refresh the page to get the latest features
        updateSW(true);
      },
      onRegisteredSW(swUrl, registration) {
        if (registration) {
          // Check for updates automatically every 30 minutes
          setInterval(() => {
            registration.update().catch(() => {});
          }, 30 * 60 * 1000);
        }
      }
    });

    // Check for updates whenever user returns to the installed app
    window.addEventListener('focus', () => {
      navigator.serviceWorker.getRegistration().then((reg) => reg?.update()).catch(() => {});
    });

    window.addEventListener('online', () => {
      navigator.serviceWorker.getRegistration().then((reg) => reg?.update()).catch(() => {});
    });
  }
} catch (swError) {
  console.warn('PWA service worker registration bypassed:', swError);
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
