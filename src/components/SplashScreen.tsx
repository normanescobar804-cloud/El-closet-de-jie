import React, { useState, useEffect } from 'react';
import { Sparkles, ShoppingBag, ShieldCheck } from 'lucide-react';

interface SplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDurationMs = 1500,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Check if splash was already shown in this tab session
    const alreadyShown = sessionStorage.getItem('closet_jie_splash_shown');
    if (alreadyShown) {
      setIsVisible(false);
      onFinish?.();
      return;
    }

    const timer = setTimeout(() => {
      setIsFading(true);
      const closeTimer = setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem('closet_jie_splash_shown', 'true');
        onFinish?.();
      }, 500); // 500ms fade transition
      return () => clearTimeout(closeTimer);
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs, onFinish]);

  const handleSkip = () => {
    setIsFading(true);
    setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('closet_jie_splash_shown', 'true');
      onFinish?.();
    }, 200);
  };

  if (!isVisible) return null;

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-gradient-to-br from-violet-950 via-purple-950 to-indigo-950 text-white select-none transition-opacity duration-500 cursor-pointer ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="Pantalla de inicio El Clóset de Jié V2"
    >
      {/* Top Bar Indicator */}
      <div className="w-full flex items-center justify-between text-[11px] font-semibold text-violet-300/80 pt-safe">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Firebase Cloud Live</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
          className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[10px] text-white/80 transition-colors"
        >
          Entrar →
        </button>
      </div>

      {/* Main Brand Center Content */}
      <div className="flex flex-col items-center text-center my-auto space-y-6">
        {/* Animated Brand Logo with Glowing Halo */}
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-3xl blur-xl opacity-60 animate-pulse" />
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 bg-gradient-to-tr from-amber-300 via-pink-400 to-violet-300 shadow-2xl">
            <div className="w-full h-full rounded-[22px] overflow-hidden bg-violet-950 flex items-center justify-center">
              <img
                src="/icon.svg"
                alt="El Clóset de Jié V2"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-pink-500 text-stone-950 font-black text-[11px] px-2 py-0.5 rounded-full shadow-lg border border-white">
            V2
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-2">
          <h1 className="font-serif text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
            EL CLÓSET DE JIÉ
          </h1>
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-pink-300">
            <span>👗 Ropa</span>
            <span>•</span>
            <span>🧸 Peluches</span>
            <span>•</span>
            <span>🔥 Ofertas</span>
          </div>
          <p className="text-xs text-violet-200/90 font-medium max-w-xs mx-auto">
            Boutique & Peluches en Nicaragua con Entregas Delivery y Pedidos en Tiempo Real
          </p>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-48 sm:w-56 space-y-2 pt-2">
          <div className="h-1.5 w-full bg-violet-900/80 rounded-full overflow-hidden p-0.5 border border-violet-700/50">
            <div className="h-full bg-gradient-to-r from-pink-400 via-amber-300 to-emerald-400 rounded-full animate-[pulse_1.5s_infinite] w-full" />
          </div>
          <span className="text-[10px] text-violet-300/80 tracking-wide font-mono">
            Sincronizando tienda en vivo...
          </span>
        </div>
      </div>

      {/* Bottom Features Footer */}
      <div className="w-full flex flex-wrap items-center justify-center gap-3 text-[11px] font-semibold text-violet-200/80 pb-safe">
        <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-xs">
          <span>🛵</span>
          <span>Delivery Managua & Departamentos</span>
        </span>
        <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-xs">
          <span>💳</span>
          <span>LAFISE & Efectivo</span>
        </span>
      </div>
    </div>
  );
};
