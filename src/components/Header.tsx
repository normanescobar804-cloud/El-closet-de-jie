import React from 'react';
import {
  ShoppingBag,
  Heart,
  ShieldCheck,
  Search,
  X,
  Sparkles,
  User,
  LogOut,
  Github,
  BarChart3,
  Bell,
  Store,
  MessageCircle,
  Rocket,
  Smartphone,
  UserPlus,
  Globe
} from 'lucide-react';
import { BusinessAd, CategoryFilter, CurrencyType, Product, StoreSettings, UserAccount } from '../types';
import { formatCurrency } from '../utils/storage';
import { SearchAutocomplete } from './SearchAutocomplete';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  storeSettings: StoreSettings;
  cartCount: number;
  cartTotal: number;
  currency: CurrencyType;
  onCurrencyChange: (curr: CurrencyType) => void;
  favoritesCount: number;
  unreadNotificationsCount?: number;
  unreadChatCount?: number;
  currentUser: UserAccount | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  products?: Product[];
  categories?: CategoryFilter[];
  businessAds?: BusinessAd[];
  catalogSection?: 'todas' | 'ropa' | 'peluches' | 'ofertas' | 'novedades';
  onSelectCatalogSection?: (section: 'todas' | 'ropa' | 'peluches' | 'ofertas' | 'novedades') => void;
  onGoHome?: () => void;
  onOpenOrders?: () => void;
  onSelectProduct?: (product: Product) => void;
  onSelectCategory?: (category: CategoryFilter) => void;
  onSelectSeller?: (sellerName: string) => void;
  onOpenCart: () => void;
  onOpenFavorites: () => void;
  onOpenNotifications?: () => void;
  onOpenChat?: () => void;
  onOpenAuth: () => void;
  onOpenFreeSellerPortal?: () => void;
  onOpenEditStore?: () => void;
  onOpenMonetization?: () => void;
  onOpenAdmin: () => void;
  onOpenAnalytics?: () => void;
  todayViews?: number;
  onOpenContact?: () => void;
  onOpenExportGitHub?: () => void;
  onLogout: () => void;
  isCloudConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  storeSettings,
  cartCount,
  cartTotal,
  currency,
  onCurrencyChange,
  favoritesCount,
  unreadNotificationsCount = 0,
  unreadChatCount = 0,
  currentUser,
  searchQuery,
  onSearchChange,
  products = [],
  categories = [],
  businessAds = [],
  catalogSection = 'todas',
  onSelectCatalogSection,
  onGoHome,
  onOpenOrders,
  onSelectProduct,
  onSelectCategory,
  onSelectSeller,
  onOpenCart,
  onOpenFavorites,
  onOpenNotifications,
  onOpenChat,
  onOpenAuth,
  onOpenFreeSellerPortal,
  onOpenEditStore,
  onOpenMonetization,
  onOpenAdmin,
  onOpenAnalytics,
  todayViews,
  onOpenExportGitHub,
  onLogout,
  isCloudConnected = true,
}) => {
  const isCordobas = currency === 'NIO' || currency === 'cordobas';

  const handleFocusSearch = () => {
    const el = (document.getElementById('search-input-desktop') ||
      document.getElementById('search-input-mobile')) as HTMLInputElement | null;
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/90 transition-shadow duration-200 shadow-2xs">
      {/* Open Platform & Discount Top Bar */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-indigo-950 text-white text-[10px] sm:text-xs py-1 sm:py-1.5 px-3 sm:px-4 text-center font-semibold sm:font-bold tracking-wide flex items-center justify-center gap-1.5 sm:gap-2 shadow-inner">
        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 shrink-0" />
        <span className="truncate">
          <span className="sm:hidden">🇳🇮 Plataforma Abierta • Compra & Vende Gratis en Nicaragua</span>
          <span className="hidden sm:inline">PLATAFORMA ABIERTA Y DE USO LIBRE EN NICARAGUA</span>
        </span>
        <span className="hidden sm:inline text-white/50">·</span>
        <span className="text-amber-200 hidden sm:inline">
          Compra con 20% OFF o Publica y Vende tus Productos 100% Gratis
        </span>
        <span className="hidden lg:inline text-white/40">·</span>
        <span className="hidden lg:inline-flex items-center gap-1.5 text-emerald-300 font-mono text-[10px] bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-500/40">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span>Firebase En Vivo · Tiempo Real</span>
        </span>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-13 sm:h-20 gap-2 sm:gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <a
              href="#"
              className="flex items-center gap-2 sm:gap-2.5 group whitespace-nowrap min-w-0 touch-press"
              title={storeSettings.storeName}
            >
              <div className="relative w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl overflow-hidden shadow-xs ring-1.5 ring-violet-200/80 group-hover:ring-violet-400 group-hover:scale-105 transition-all duration-200 shrink-0 bg-gradient-to-br from-violet-900 via-purple-900 to-pink-700">
                <img
                  src="/icon.svg"
                  alt={storeSettings.storeName}
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-serif text-base sm:text-2xl font-black tracking-tight text-stone-950 group-hover:text-violet-800 transition-colors leading-tight truncate">
                    {storeSettings.storeName}
                  </span>
                  <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white font-mono font-black text-[9px] sm:text-[11px] px-1.5 py-0.5 rounded-md shadow-2xs tracking-wider shrink-0">
                    V2
                  </span>
                </div>
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-violet-700 font-sans mt-0.5">
                  Boutique & Peluches • Nicaragua
                </span>
              </div>
            </a>
          </div>

          {/* Search Bar with Autocomplete - Desktop & Tablet */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <SearchAutocomplete
              id="search-input-desktop"
              className="w-full"
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              products={products}
              categories={categories}
              storeSettings={storeSettings}
              businessAds={businessAds}
              currency={currency}
              placeholder="Buscar productos, categorías, tiendas, marcas..."
              onSelectProduct={onSelectProduct}
              onSelectCategory={onSelectCategory}
              onSelectSeller={onSelectSeller}
            />
          </div>

          {/* Action Buttons & Currency Selector */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Free Seller Portal Button (+ Vender Gratis) - Desktop only (Mobile uses bottom nav + hero) */}
            {onOpenFreeSellerPortal && (
              <button
                id="btn-open-free-seller-header"
                onClick={onOpenFreeSellerPortal}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                title="Publicar y vender tus productos gratis en la plataforma"
              >
                <Store className="w-3.5 h-3.5 text-amber-200" />
                <span>+ Vender Gratis</span>
              </button>
            )}

            {/* Edit My Store Button */}
            {onOpenEditStore && (
              <button
                id="btn-open-edit-store-header"
                onClick={onOpenEditStore}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-full text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                title="Editar los datos, WhatsApp y cuentas de tu tienda de ropa"
              >
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mi Tienda</span>
              </button>
            )}

            {/* Platform Monetization & Owner Earnings (2%) */}
            {onOpenMonetization && (
              <button
                id="btn-open-monetization-header"
                onClick={onOpenMonetization}
                className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                title="Ver comisiones del 2% y modelo de monetización de la plataforma"
              >
                <span className="text-xs">💰</span>
                <span>Ganancias (2%)</span>
              </button>
            )}

            {/* In-App PWA Install Button */}
            <div className="hidden sm:block">
              <PWAInstallButton variant="header" />
            </div>

            {/* Currency Selector (Córdobas / Dólares) - Always accessible on mobile & desktop */}
            <div className="inline-flex rounded-full bg-stone-100 p-0.5 border border-stone-200/90 text-[10px] sm:text-[11px] font-bold shrink-0">
              <button
                onClick={() => onCurrencyChange('NIO')}
                className={`px-2 sm:px-2.5 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                  isCordobas
                    ? 'bg-violet-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Mostrar precios en Córdobas (C$)"
              >
                C$
              </button>
              <button
                onClick={() => onCurrencyChange('USD')}
                className={`px-2 sm:px-2.5 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                  !isCordobas
                    ? 'bg-violet-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Mostrar precios en Dólares ($)"
              >
                $
              </button>
            </div>

            {/* Customer Account Profile / Sign In (Desktop) */}
            {currentUser && currentUser.isLoggedIn ? (
              <div className="hidden sm:flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200/70 border border-stone-200 text-stone-800 transition-colors shrink-0">
                <button
                  type="button"
                  id="btn-open-user-profile-header"
                  onClick={onOpenAuth}
                  title="Ver mi Cuenta, Pedidos y Métodos de Pago"
                  className="flex items-center gap-2 cursor-pointer text-left whitespace-nowrap shrink-0"
                >
                  <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-black shadow-2xs">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold max-w-[90px] truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                </button>
                <button
                  type="button"
                  id="btn-logout-header"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLogout();
                  }}
                  title="Cerrar sesión"
                  className="text-stone-400 hover:text-red-600 transition-colors ml-0.5 p-0.5 cursor-pointer"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="btn-open-auth-header"
                onClick={onOpenAuth}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-violet-900 bg-violet-50 hover:bg-violet-100/80 rounded-full border border-violet-200 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs hover:scale-102"
                title="Iniciar Sesión o Crear tu Cuenta de Cliente"
              >
                <UserPlus className="w-3.5 h-3.5 text-violet-700" />
                <span>Ingresar / Registro</span>
              </button>
            )}

            {/* Customer-to-Customer & Seller Chat with Audio Notes */}
            {onOpenChat && (
              <button
                id="btn-open-chat-header"
                type="button"
                onClick={onOpenChat}
                className="relative p-2 sm:p-2.5 text-stone-700 hover:text-violet-700 hover:bg-violet-50/80 rounded-full transition-colors flex items-center justify-center cursor-pointer shrink-0"
                title="Mensajes entre Clientes y Notas de Audio"
                aria-label="Mensajes y chat con audio"
              >
                <MessageCircle className="w-5 h-5" />
                {unreadChatCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-mono font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs tabular-nums animate-pulse">
                    {unreadChatCount > 9 ? '9+' : unreadChatCount}
                  </span>
                )}
              </button>
            )}

            {/* Order Notifications Bell Button (Desktop only; mobile uses bottom nav Avisos) */}
            {onOpenNotifications && (
              <button
                id="btn-open-notifications-header"
                onClick={onOpenNotifications}
                className="hidden md:flex relative p-2 sm:p-2.5 text-stone-700 hover:text-amber-700 hover:bg-amber-50/70 rounded-full transition-colors items-center justify-center cursor-pointer shrink-0"
                title="Notificaciones de Pedidos"
                aria-label="Notificaciones de pedidos"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-stone-950 text-[10px] font-mono font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs tabular-nums">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Favorites Button - Always present and accessible */}
            <button
              id="btn-open-favorites-header"
              onClick={onOpenFavorites}
              className="relative p-2 sm:p-2.5 text-stone-700 hover:text-rose-600 hover:bg-rose-50/50 rounded-full transition-colors flex items-center justify-center cursor-pointer shrink-0"
              title="Mis Favoritos"
              aria-label="Favoritos"
            >
              <Heart className={`w-5 h-5 ${favoritesCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
              {favoritesCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-[10px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs tabular-nums">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Cart Button (Desktop only; mobile uses dedicated sticky floating drawer & bottom Carrito tab) */}
            <button
              id="btn-open-cart-header"
              onClick={onOpenCart}
              className="hidden md:flex relative items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-700 hover:to-indigo-800 active:scale-95 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-full transition-all shadow-md cursor-pointer whitespace-nowrap shrink-0"
              title="Ver Carrito de Compras"
              aria-label="Carrito de compras"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-amber-200" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-mono font-black w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-xs tabular-nums">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden lg:flex flex-col text-left leading-tight">
                <span className="text-[10px] uppercase font-bold text-violet-200">Carrito</span>
                <span className="text-xs font-black text-white tabular-nums">
                  {cartCount > 0 ? formatCurrency(cartTotal, currency, storeSettings.exchangeRate) : 'Vacío'}
                </span>
              </div>
            </button>

            {/* Estadísticas Button */}
            {onOpenAnalytics && (
              <button
                id="btn-open-analytics-header"
                onClick={onOpenAnalytics}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 sm:px-3 sm:py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300/80 rounded-full text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                title="Abrir Panel de Estadísticas"
                aria-label="Panel de estadísticas"
              >
                <BarChart3 className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden xl:inline font-semibold text-stone-700">Estadísticas</span>
                <span className="font-mono font-black text-amber-950 tabular-nums">
                  {todayViews ?? '0'}
                </span>
              </button>
            )}

            {/* Admin Panel Toggle */}
            <button
              id="btn-open-admin-header"
              onClick={onOpenAdmin}
              className="p-2 sm:p-2.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors flex items-center justify-center cursor-pointer shrink-0"
              title="Panel de Administrador"
              aria-label="Administrador"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>

            {/* URL Oficial de la App & Publicar */}
            {onOpenExportGitHub && (
              <button
                id="btn-open-github-export-header"
                onClick={onOpenExportGitHub}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-900 hover:from-violet-800 hover:to-indigo-800 text-white rounded-full text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0 border border-violet-700/50"
                title="Ver URL oficial de la app y publicar en Google Play Store o Web"
              >
                <Globe className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="hidden sm:inline">URL de la App</span>
                <span className="sm:hidden text-[11px]">URL</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar - 100% Full-Width Native App Style */}
        <div className="pb-2 pt-0.5 md:hidden w-full">
          <SearchAutocomplete
            id="search-input-mobile"
            isMobile={true}
            className="w-full"
            inputClassName="h-10 text-[13px] bg-stone-100/90 focus:bg-white rounded-2xl border-stone-200/90 shadow-2xs"
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            products={products}
            categories={categories}
            storeSettings={storeSettings}
            businessAds={businessAds}
            currency={currency}
            placeholder="Buscar ropa, marcas, peluches, tiendas..."
            onSelectProduct={onSelectProduct}
            onSelectCategory={onSelectCategory}
            onSelectSeller={onSelectSeller}
          />
        </div>
      </div>

      {/* V2 Structural Hierarchy Navigation Bar */}
      <div className="bg-gradient-to-r from-stone-50 via-white to-stone-50 border-t border-stone-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between py-1.5 gap-1.5 overflow-x-auto scrollbar-none text-xs">
            {/* Left Nav: 🏠 Inicio & 🛍️ Catálogo (Ropa, Peluches, Ofertas, Novedades) */}
            <div className="flex items-center gap-1 shrink-0">
              {/* 🏠 Inicio */}
              <button
                type="button"
                id="v2-nav-home"
                onClick={onGoHome}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  catalogSection === 'todas'
                    ? 'bg-violet-700 text-white shadow-2xs'
                    : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                }`}
                title="Volver al Inicio"
              >
                <span>🏠</span>
                <span className="font-extrabold">Inicio</span>
              </button>

              <div className="h-4 w-px bg-stone-200 mx-0.5 hidden sm:block" />

              {/* 🛍️ Catálogo Subsecciones */}
              <div className="flex items-center gap-1 bg-stone-100/80 p-0.5 rounded-xl border border-stone-200/90 shadow-2xs shrink-0">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-violet-900 px-2 flex items-center gap-1 shrink-0">
                  <span>🛍️</span>
                  <span className="hidden md:inline">Catálogo</span>
                </span>

                {/* 👗 Ropa */}
                <button
                  type="button"
                  id="v2-nav-ropa"
                  onClick={() => onSelectCatalogSection?.('ropa')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    catalogSection === 'ropa'
                      ? 'bg-violet-600 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-950 hover:bg-white'
                  }`}
                  title="Ver sólo Ropa de mujer, hombre y niños"
                >
                  <span>👗</span>
                  <span>Ropa</span>
                </button>

                {/* 🧸 Peluches */}
                <button
                  type="button"
                  id="v2-nav-peluches"
                  onClick={() => onSelectCatalogSection?.('peluches')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    catalogSection === 'peluches'
                      ? 'bg-pink-600 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-950 hover:bg-white'
                  }`}
                  title="Ver colección de Peluches tiernos y gigantes"
                >
                  <span>🧸</span>
                  <span>Peluches</span>
                  <span className="text-[9px] bg-pink-100 text-pink-700 font-black px-1 rounded-full uppercase">
                    Nuevo
                  </span>
                </button>

                {/* 🔥 Ofertas */}
                <button
                  type="button"
                  id="v2-nav-ofertas"
                  onClick={() => onSelectCatalogSection?.('ofertas')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    catalogSection === 'ofertas'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-950 hover:bg-white'
                  }`}
                  title="Prendas y peluches con 20% de descuento o liquidación"
                >
                  <span>🔥</span>
                  <span>Ofertas</span>
                  <span className="text-[9px] bg-rose-100 text-rose-700 font-black px-1 rounded-full uppercase">
                    -20%
                  </span>
                </button>

                {/* ✨ Novedades */}
                <button
                  type="button"
                  id="v2-nav-novedades"
                  onClick={() => onSelectCatalogSection?.('novedades')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    catalogSection === 'novedades'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-950 hover:bg-white'
                  }`}
                  title="Lo más nuevo y recién agregado a la tienda"
                >
                  <span>✨</span>
                  <span>Novedades</span>
                </button>
              </div>
            </div>

            {/* Right Nav: 🔎 Buscador, 🛒 Carrito, 📦 Mis pedidos, 👤 Cuenta, 👩‍💼 Admin */}
            <div className="flex items-center gap-1 shrink-0">
              {/* 🔎 Buscador */}
              <button
                type="button"
                id="v2-nav-search"
                onClick={handleFocusSearch}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-stone-700 hover:text-stone-950 hover:bg-stone-100 font-bold transition-all cursor-pointer shrink-0"
                title="Buscar prendas o peluches"
              >
                <span>🔎</span>
                <span className="hidden sm:inline">Buscador</span>
              </button>

              {/* 🛒 Carrito */}
              <button
                type="button"
                id="v2-nav-cart"
                onClick={onOpenCart}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-stone-700 hover:text-stone-950 hover:bg-stone-100 font-bold transition-all cursor-pointer shrink-0"
                title="Ver carrito de compras"
              >
                <span>🛒</span>
                <span className="hidden sm:inline">Carrito</span>
                {cartCount > 0 && (
                  <span className="bg-rose-500 text-white font-mono text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* 📦 Mis pedidos */}
              <button
                type="button"
                id="v2-nav-orders"
                onClick={onOpenOrders}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-stone-700 hover:text-stone-950 hover:bg-stone-100 font-bold transition-all cursor-pointer shrink-0"
                title="Ver mis pedidos realizados y entregas Delivery"
              >
                <span>📦</span>
                <span className="hidden sm:inline">Mis pedidos</span>
                <span className="sm:hidden">Pedidos</span>
              </button>

              {/* 👤 Cuenta */}
              <button
                type="button"
                id="v2-nav-account"
                onClick={onOpenAuth}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-stone-700 hover:text-stone-950 hover:bg-stone-100 font-bold transition-all cursor-pointer shrink-0"
                title="Mi Cuenta de Cliente"
              >
                <span>👤</span>
                <span className="hidden sm:inline">Cuenta</span>
              </button>

              <div className="h-4 w-px bg-stone-200 mx-0.5" />

              {/* Real-time Cloud Status Indicator */}
              <div
                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/90 rounded-lg text-[11px] font-bold shadow-2xs shrink-0 select-none"
                title={isCloudConnected ? "Tienda en tiempo real sincronizada con Firebase (Auth + Firestore + Storage)" : "Modo sin conexión local"}
              >
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isCloudConnected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isCloudConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                </span>
                <span>{isCloudConnected ? 'Tiempo Real' : 'Local'}</span>
              </div>

              {/* 👩‍💼 Administrador */}
              <button
                type="button"
                id="v2-nav-admin"
                onClick={onOpenAdmin}
                className="flex items-center gap-1 px-2.5 py-1 bg-violet-100 hover:bg-violet-200/90 text-violet-950 border border-violet-300 rounded-lg text-xs font-black transition-all cursor-pointer shadow-2xs shrink-0"
                title="Panel de Administrador (Productos, Pedidos, Clientes, Ventas)"
              >
                <span>👩‍💼</span>
                <span>Admin</span>
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};
