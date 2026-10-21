import React, { useState } from 'react';
import { Download, Smartphone, Monitor, X, Check, Share, Sparkles, WifiOff, Zap } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'floating' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [activeDeviceTab, setActiveDeviceTab] = useState<'auto' | 'pc' | 'android' | 'ios'>(
    isIOS ? 'ios' : 'auto'
  );

  // If already running in standalone mode, show clean installed status badge
  if (isInstalled) {
    return (
      <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <Check className="w-3.5 h-3.5 text-emerald-600" />
        <span>App Instalada</span>
      </div>
    );
  }

  const handleButtonClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
        return;
      }
    }
    // If browser prompt wasn't triggered immediately, show the installation modal with the logo and guides
    setShowModal(true);
  };

  const handleDirectInstall = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        setShowModal(false);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        id="btn-pwa-install"
        onClick={handleButtonClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap shrink-0 touch-press ${
          variant === 'header'
            ? 'bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 hover:from-violet-800 hover:to-indigo-900 text-white ring-1 ring-violet-400/40'
            : 'bg-stone-900 hover:bg-stone-800 text-white'
        } ${className}`}
        title="Instalar El Clóset de Jié en tu celular o computadora con el logo oficial"
      >
        {installSuccess ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-300" />
            <span>¡Instalado!</span>
          </>
        ) : (
          <>
            <div className="w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 border border-amber-200/60">
              <img src="/icon.svg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span>Instalar App</span>
            <span className="hidden lg:inline text-[10px] font-bold bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded-full uppercase tracking-wider">
              Gratis
            </span>
          </>
        )}
      </button>

      {/* High-Impact Brand Installation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-stone-200 animate-scale-up overflow-hidden relative">
            {/* Background ambient spot */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header with Close */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-stone-100 relative z-10">
              <div className="flex items-center gap-3">
                {/* Official App Logo Emblem */}
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-md shadow-purple-950/25 ring-2 ring-violet-200 shrink-0 bg-gradient-to-br from-violet-900 via-purple-900 to-pink-700">
                  <img
                    src="/pwa-192x192.png"
                    alt="Logo oficial de El Clóset de Jié"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/30 rounded-2xl pointer-events-none" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full mb-0.5">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>App Oficial Instalable</span>
                  </div>
                  <h3 className="font-serif text-lg font-black text-stone-900 leading-tight">
                    El Clóset de Jié
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Moda, calidad y delivery en toda Nicaragua
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                aria-label="Cerrar modal de instalación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-2 my-4 text-center">
              <div className="bg-stone-50 p-2.5 rounded-2xl border border-stone-100">
                <Zap className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-stone-800 block">Carga Instantánea</span>
                <span className="text-[9px] text-stone-500">Sin demoras ni esperas</span>
              </div>
              <div className="bg-stone-50 p-2.5 rounded-2xl border border-stone-100">
                <WifiOff className="w-4 h-4 text-violet-600 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-stone-800 block">Catálogo Offline</span>
                <span className="text-[9px] text-stone-500">Úsalo sin internet</span>
              </div>
              <div className="bg-stone-50 p-2.5 rounded-2xl border border-stone-100">
                <Smartphone className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-stone-800 block">Logo en Pantalla</span>
                <span className="text-[9px] text-stone-500">Celular o tu PC</span>
              </div>
            </div>

            {/* Direct Browser Prompt Action (if ready) */}
            {isInstallable && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleDirectInstall}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 hover:from-violet-800 hover:to-indigo-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 active:scale-98 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-300" />
                  <span>Instalar Ahora con un Solo Toque</span>
                </button>
              </div>
            )}

            {/* Device Selector Tabs */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl mb-3.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveDeviceTab('pc')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeDeviceTab === 'pc' || (!isIOS && activeDeviceTab === 'auto')
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-violet-600" />
                <span>PC / Laptop</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveDeviceTab('android')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeDeviceTab === 'android'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Android</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveDeviceTab('ios')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeDeviceTab === 'ios'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-stone-800" />
                <span>iPhone / iPad</span>
              </button>
            </div>

            {/* Device Instructions Content */}
            <div className="space-y-2.5 text-xs text-stone-700">
              {(activeDeviceTab === 'pc' || (!isIOS && activeDeviceTab === 'auto')) && (
                <div className="space-y-2 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <p className="leading-snug">
                      En <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong>, busca el icono de <strong>Instalar</strong> en la barra de direcciones (al lado de la estrella de favoritos).
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <p className="leading-snug">
                      O haz clic en el menú <strong>⋮</strong> arriba a la derecha y selecciona <strong>«Instalar El Clóset de Jié»</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </span>
                    <p className="leading-snug">
                      ¡Listo! Quedará el logo oficial en tu <strong>escritorio y barra de tareas de la PC</strong> para abrir la app al instante.
                    </p>
                  </div>
                </div>
              )}

              {activeDeviceTab === 'android' && (
                <div className="space-y-2 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <p className="leading-snug">
                      Toca el menú de los <strong>3 puntos ⋮</strong> en la esquina superior de Chrome en tu celular.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <p className="leading-snug">
                      Presiona <strong>«Instalar aplicación»</strong> o <strong>«Agregar a la pantalla principal»</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </span>
                    <p className="leading-snug">
                      El icono oficial morado y dorado aparecerá junto a tus otras apps de Android.
                    </p>
                  </div>
                </div>
              )}

              {activeDeviceTab === 'ios' && (
                <div className="space-y-2 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <p className="leading-snug">
                      Toca el botón <strong>Compartir</strong> <Share className="w-3 h-3 inline text-blue-600 align-baseline" /> en la barra inferior de Safari.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <p className="leading-snug">
                      Desliza hacia abajo y presiona <strong>«Agregar a pantalla de inicio»</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </span>
                    <p className="leading-snug">
                      ¡Listo! El icono oficial de la boutique quedará en tu iPhone como una app nativa.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[11px] text-stone-500 font-medium">
                Ocupa menos de 2 MB en tu equipo
              </span>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
