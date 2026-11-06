import React, { useEffect, useRef } from 'react';
import { Megaphone, Sparkles, ExternalLink, Globe } from 'lucide-react';
import { GoogleAdSenseConfig } from '../types';

interface GoogleAdSenseSlotProps {
  config?: GoogleAdSenseConfig;
  slotType: 'header' | 'infeed' | 'footer';
  onOpenAdvertiseModal: () => void;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export const GoogleAdSenseSlot: React.FC<GoogleAdSenseSlotProps> = ({
  config,
  slotType,
  onOpenAdvertiseModal
}) => {
  const adPushed = useRef(false);

  const isEnabled = config?.enabled !== false;
  const publisherId = config?.publisherId?.trim() || 'ca-pub-0000000000000000';
  const isRealPublisherId =
    publisherId.startsWith('ca-pub-') &&
    publisherId !== 'ca-pub-0000000000000000' &&
    publisherId.length >= 20;

  const slotId =
    slotType === 'header'
      ? config?.headerSlotId || '1029384756'
      : slotType === 'infeed'
      ? config?.inFeedSlotId || '5647382910'
      : config?.footerSlotId || '9081726354';

  // Dynamically load AdSense script when a real publisher ID is configured
  useEffect(() => {
    if (!isEnabled || !isRealPublisherId) return;

    const existingScript = document.querySelector(
      `script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`
    );
    if (!existingScript) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
        publisherId
      )}`;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    if (!adPushed.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adPushed.current = true;
      } catch (e) {
        console.warn('AdSense push warning:', e);
      }
    }
  }, [isEnabled, isRealPublisherId, publisherId]);

  if (!isEnabled) return null;

  return (
    <div className="w-full my-4">
      <div className="relative rounded-2xl border border-stone-200/90 bg-gradient-to-r from-stone-50 via-white to-amber-50/40 p-3 sm:p-4 shadow-2xs overflow-hidden">
        {/* Top Micro Label */}
        <div className="flex items-center justify-between gap-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-sky-600" />
            <span>
              {isRealPublisherId
                ? 'Publicidad • Google AdSense'
                : 'Espacio Publicitario • Google AdSense & Negocios de Nicaragua'}
            </span>
          </span>
          <button
            type="button"
            onClick={onOpenAdvertiseModal}
            className="text-violet-700 hover:text-violet-900 font-bold flex items-center gap-1 cursor-pointer hover:underline"
          >
            <Megaphone className="w-3 h-3" />
            <span>Anúnciate aquí</span>
          </button>
        </div>

        {/* Live Google AdSense Unit if real Publisher ID is configured */}
        {isRealPublisherId ? (
          <div className="min-h-[90px] flex items-center justify-center bg-stone-50/50 rounded-xl overflow-hidden">
            <ins
              className="adsbygoogle"
              style={{ display: 'block', width: '100%' }}
              data-ad-client={publisherId}
              data-ad-slot={slotId}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
        ) : (
          /* Interactive AdSense + Local Business Sponsor Fallback Banner */
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/90 border border-stone-200/80 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-stone-950 flex items-center justify-center shrink-0 shadow-xs">
                <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-black text-stone-900">
                    ¿Tienes un negocio o emprendimiento en Nicaragua? 🇳🇮
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                    Desde C$ 250 / semana
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-stone-600 mt-0.5 leading-relaxed">
                  Promociona tu marca, tienda, restaurante o servicio en <strong>El Clóset de Jié</strong> y recibe clientes directos a tu WhatsApp. Espacio compatible con <strong>Google AdSense</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenAdvertiseModal}
              className="w-full sm:w-auto px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-95 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Publicar mi Anuncio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
