import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker safely (only in production or when supported)
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    registerSW({
      immediate: true,
      onOfflineReady() {
        console.log('El closet de jie: Catálogo y tienda listos para funcionar offline.');
      },
      onNeedRefresh() {
        console.log('El closet de jie: Nueva versión disponible.');
      },
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
