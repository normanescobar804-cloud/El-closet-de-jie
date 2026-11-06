import React from 'react';
import {
  Megaphone,
  MapPin,
  MessageCircle,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  PlusCircle,
  Eye,
  MousePointerClick
} from 'lucide-react';
import { BusinessAd } from '../types';

interface SponsoredHeroBannerProps {
  ad: BusinessAd;
  onAdClick: (ad: BusinessAd) => void;
  onOpenAdvertiseModal: () => void;
}

export const SponsoredHeroBanner: React.FC<SponsoredHeroBannerProps> = ({
  ad,
  onAdClick,
  onOpenAdvertiseModal
}) => {
  const handleContactBusiness = () => {
    onAdClick(ad);
    let cleanPhone = ad.whatsappPhone.replace(/\D/g, '');
    if (cleanPhone.length === 8) cleanPhone = `505${cleanPhone}`;
    const text = `¡Hola *${ad.businessName}*! 👋 Vi su anuncio patrocinado en *El Clóset de Jié* (${ad.headline}) y me gustaría recibir más información.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="mb-6 rounded-3xl overflow-hidden border-2 border-amber-300/80 bg-gradient-to-r from-stone-950 via-stone-900 to-indigo-950 text-white shadow-xl relative">
      {/* Top Sponsored Bar */}
      <div className="px-4 py-1.5 bg-amber-400/15 border-b border-amber-400/20 flex items-center justify-between gap-2 text-[10px] sm:text-xs">
        <div className="flex items-center gap-2 font-bold text-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>NEGOCIO PATROCINADO DE NICARAGUA 🇳🇮</span>
          <span className="hidden sm:inline text-stone-400">•</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-stone-200">
            <MapPin className="w-3 h-3 text-amber-300" />
            {ad.department} • {ad.category}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenAdvertiseModal}
          className="text-amber-200 hover:text-white font-bold flex items-center gap-1 underline cursor-pointer"
        >
          <Megaphone className="w-3 h-3" />
          <span>¿Quieres anunciar tu negocio aquí?</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center">
        {/* Image */}
        <div className="md:col-span-4 lg:col-span-3">
          <div
            onClick={handleContactBusiness}
            className="relative aspect-[16/10] md:aspect-[4/3] rounded-2xl overflow-hidden border border-white/15 bg-stone-800 cursor-pointer group"
          >
            <img
              src={ad.imageUrl}
              alt={ad.businessName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-2 left-2 bg-stone-950/85 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{ad.department}</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="md:col-span-8 lg:col-span-9 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
              {ad.businessName}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
              <CheckCircle2 className="w-3 h-3" />
              <span>Anunciante Verificado</span>
            </span>
          </div>

          <h3 className="font-serif text-lg sm:text-2xl font-bold text-white leading-snug">
            {ad.headline}
          </h3>

          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-3xl">
            {ad.description}
          </p>

          {ad.promoText && (
            <div className="inline-block bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-bold px-3 py-1 rounded-xl">
              {ad.promoText}
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleContactBusiness}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-stone-950/15" />
              <span>{ad.ctaText || 'Contactar por WhatsApp'}</span>
            </button>

            {ad.websiteOrSocialUrl && (
              <a
                href={ad.websiteOrSocialUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onAdClick(ad)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 border border-white/15 transition-colors"
              >
                <span>Ver Red Social / Web</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface SponsoredCatalogCardProps {
  ad: BusinessAd;
  onAdClick: (ad: BusinessAd) => void;
  onOpenAdvertiseModal: () => void;
}

export const SponsoredCatalogCard: React.FC<SponsoredCatalogCardProps> = ({
  ad,
  onAdClick,
  onOpenAdvertiseModal
}) => {
  const handleContactBusiness = () => {
    onAdClick(ad);
    let cleanPhone = ad.whatsappPhone.replace(/\D/g, '');
    if (cleanPhone.length === 8) cleanPhone = `505${cleanPhone}`;
    const text = `¡Hola *${ad.businessName}*! 👋 Vi su anuncio en el catálogo de *El Clóset de Jié* y me gustaría consultar sobre: ${ad.headline}`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="group bg-gradient-to-b from-amber-50/70 via-white to-stone-50 rounded-2xl sm:rounded-3xl border-2 border-amber-300/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative">
      <div>
        {/* Image Header */}
        <div
          onClick={handleContactBusiness}
          className="relative aspect-[4/5] w-full overflow-hidden bg-stone-900 cursor-pointer"
        >
          <img
            src={ad.imageUrl}
            alt={ad.businessName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />

          {/* Top Sponsored Tag */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
            <span className="bg-stone-950/90 backdrop-blur-md text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-400/40 flex items-center gap-1 shadow-sm">
              <Megaphone className="w-3 h-3 text-amber-400" />
              <span>Patrocinado</span>
            </span>

            <span className="bg-white/95 text-stone-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-rose-600" />
              <span>{ad.department}</span>
            </span>
          </div>

          {/* Promo overlay at bottom of image */}
          {ad.promoText && (
            <div className="absolute bottom-2 inset-x-2 bg-amber-400 text-stone-950 text-[10px] font-black px-2.5 py-1 rounded-xl shadow-md text-center truncate">
              {ad.promoText}
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-3 sm:p-4 space-y-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-700 truncate">
              {ad.category}
            </span>
            <span className="text-[10px] text-emerald-700 font-bold">🇳🇮 Nicaragua</span>
          </div>

          <h3 className="font-serif font-bold text-stone-900 text-sm sm:text-base line-clamp-1">
            {ad.businessName}
          </h3>

          <p className="text-xs font-semibold text-stone-800 line-clamp-2 leading-snug">
            {ad.headline}
          </p>

          <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
            {ad.description}
          </p>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-3 sm:p-4 pt-0 space-y-2">
        <button
          type="button"
          onClick={handleContactBusiness}
          className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="truncate">{ad.ctaText || 'Escribir al WhatsApp'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenAdvertiseModal}
          className="w-full text-center text-[10px] font-bold text-stone-500 hover:text-violet-700 transition-colors cursor-pointer"
        >
          ✨ Anuncia tu negocio aquí
        </button>
      </div>
    </div>
  );
};

interface SponsoredBusinessDirectoryProps {
  ads: BusinessAd[];
  onAdClick: (ad: BusinessAd) => void;
  onOpenAdvertiseModal: () => void;
}

export const SponsoredBusinessDirectory: React.FC<SponsoredBusinessDirectoryProps> = ({
  ads,
  onAdClick,
  onOpenAdvertiseModal
}) => {
  const activeAds = ads.filter((a) => a.status === 'activo');

  return (
    <section className="mt-12 bg-white rounded-3xl border border-stone-200 p-5 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black uppercase tracking-wider mb-2">
            <Megaphone className="w-3.5 h-3.5 text-amber-700" />
            <span>Directorio Comercial • Emprendimientos y Negocios de Nicaragua</span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
            Negocios Recomendados y Patrocinadores Oficiales
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Apoyamos el comercio local en Managua y todos los departamentos de Nicaragua. Impulsa tus ventas anunciándote en nuestra tienda.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAdvertiseModal}
          className="px-5 py-3 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 hover:brightness-110 text-amber-300 font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95 shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-amber-300" />
          <span>Anunciar mi Negocio (Desde C$ 250)</span>
        </button>
      </div>

      {activeAds.length === 0 ? (
        <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 space-y-3">
          <Megaphone className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="font-bold text-stone-800 text-sm">
            ¡Conviértete en el primer negocio patrocinador destacado!
          </h4>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Publica tu banner o tarjeta comercial y recibe mensajes directos de clientes en tu WhatsApp.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeAds.map((ad) => {
            const handleContact = () => {
              onAdClick(ad);
              let cleanPhone = ad.whatsappPhone.replace(/\D/g, '');
              if (cleanPhone.length === 8) cleanPhone = `505${cleanPhone}`;
              const text = `¡Hola *${ad.businessName}*! 👋 Vi su negocio en el Directorio Patrocinado de *El Clóset de Jié* y me gustaría más información.`;
              window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
            };

            return (
              <div
                key={ad.id}
                className="rounded-2xl border border-stone-200 hover:border-amber-400 bg-stone-50/50 hover:bg-white transition-all overflow-hidden flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="relative h-40 w-full bg-stone-900 overflow-hidden">
                    <img
                      src={ad.imageUrl}
                      alt={ad.businessName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-stone-950/85 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{ad.department}</span>
                    </div>
                    <div className="absolute top-2.5 right-2.5 bg-white/90 text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {ad.category}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="font-serif font-bold text-base text-stone-900">
                      {ad.businessName}
                    </h4>
                    <p className="text-xs font-bold text-stone-800 leading-snug">
                      {ad.headline}
                    </p>
                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {ad.description}
                    </p>
                    {ad.promoText && (
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900">
                        {ad.promoText}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0 space-y-2">
                  <button
                    type="button"
                    onClick={handleContact}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{ad.ctaText || 'Contactar por WhatsApp'}</span>
                  </button>

                  <div className="flex items-center justify-between text-[10px] text-stone-400 px-1">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {ad.impressions} vistas
                    </span>
                    <span className="flex items-center gap-1">
                      <MousePointerClick className="w-3 h-3" /> {ad.clicks} clics
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
