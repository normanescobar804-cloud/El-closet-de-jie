import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2, X, Sparkles } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, wasOffline, setWasOffline } = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
    if (!isOnline) {
      setIsDismissed(false);
    }
  }, [isOnline, wasOffline, setWasOffline]);

  const handleCheckConnection = () => {
    if (navigator.onLine) {
      window.location.reload();
    }
  };

  // Reconnected Toast
  if (isOnline && showReconnected) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-emerald-900 text-white rounded-2xl p-3.5 shadow-2xl border border-emerald-500/40 flex items-center justify-between gap-3 animate-fade-in"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
            <Wifi className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-black flex items-center gap-1.5">
              <span>¡Conexión Restablecida!</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            </div>
            <p className="text-[11px] text-emerald-200 mt-0.5">
              El catálogo y los pedidos están sincronizados en tiempo real.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowReconnected(false)}
          className="p-1 text-emerald-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  // Offline Notification Banner
  if (!isOnline && !isDismissed) {
    return (
      <aside
        role="alert"
        aria-live="assertive"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-stone-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border-2 border-amber-500/50 animate-fade-in"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0 mt-0.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-md">
                <WifiOff className="w-4 h-4" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Modo Sin Conexión (Offline)
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-900/80 text-amber-200 border border-amber-600/50">
                  Service Worker Activo
                </span>
              </div>
              <p className="text-xs text-stone-200 mt-1 leading-snug">
                Estás navegando sin internet. El <strong>catálogo completo de productos</strong> sigue disponible gracias a la memoria caché local.
              </p>
              <div className="flex items-center gap-3 mt-2.5">
                <button
                  type="button"
                  onClick={handleCheckConnection}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reintentar Conexión</span>
                </button>
                <span className="text-[11px] text-stone-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Precios y prendas visibles
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 text-stone-400 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
            title="Ocultar aviso"
            aria-label="Ocultar aviso de modo offline"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  return null;
};
