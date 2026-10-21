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
  Store
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
  currentUser: UserAccount | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  products?: Product[];
  categories?: CategoryFilter[];
  businessAds?: BusinessAd[];
  onSelectProduct?: (product: Product) => void;
  onSelectCategory?: (category: CategoryFilter) => void;
  onSelectSeller?: (sellerName: string) => void;
  onOpenCart: () => void;
  onOpenFavorites: () => void;
  onOpenNotifications?: () => void;
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
}

export const Header: React.FC<HeaderProps> = ({
  storeSettings,
  cartCount,
  cartTotal,
  currency,
  onCurrencyChange,
  favoritesCount,
  unreadNotificationsCount = 0,
  currentUser,
  searchQuery,
  onSearchChange,
  products = [],
  categories = [],
  businessAds = [],
  onSelectProduct,
  onSelectCategory,
  onSelectSeller,
  onOpenCart,
  onOpenFavorites,
  onOpenNotifications,
  onOpenAuth,
  onOpenFreeSellerPortal,
  onOpenEditStore,
  onOpenMonetization,
  onOpenAdmin,
  onOpenAnalytics,
  todayViews,
  onOpenExportGitHub,
  onLogout,
}) => {
  const isCordobas = currency === 'NIO' || currency === 'cordobas';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/90 transition-shadow duration-200 shadow-2xs">
      {/* Open Platform & Discount Top Bar */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 text-white text-[11px] sm:text-xs py-1.5 px-3 sm:px-4 text-center font-bold tracking-wide flex items-center justify-center gap-2 flex-wrap shadow-inner">
        <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
        <span>
          PLATAFORMA ABIERTA Y DE USO LIBRE EN NICARAGUA
        </span>
        <span className="hidden sm:inline text-white/50">·</span>
        <span className="text-amber-200 hidden sm:inline">
          Compra con 20% OFF o Publica y Vende tus Productos 100% Gratis
        </span>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="#"
              className="flex items-center gap-2.5 group whitespace-nowrap shrink-0 touch-press"
              title={storeSettings.storeName}
            >
              <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-2xl overflow-hidden shadow-sm shadow-purple-950/20 ring-2 ring-violet-200/80 group-hover:ring-violet-400 group-hover:scale-105 transition-all duration-200 shrink-0 bg-gradient-to-br from-violet-900 via-purple-900 to-pink-700">
                <img
                  src="/icon.svg"
                  alt={storeSettings.storeName}
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg sm:text-2xl font-black tracking-tight text-stone-950 group-hover:text-violet-800 transition-colors leading-none">
                  {storeSettings.storeName}
                </span>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-violet-700 font-sans mt-0.5">
                  Boutique • Nicaragua
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
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Free Seller Portal Button (+ Vender Gratis) */}
            {onOpenFreeSellerPortal && (
              <button
                id="btn-open-free-seller-header"
                onClick={onOpenFreeSellerPortal}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
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

            {/* Platform Monetization & Owner Earnings (3%) */}
            {onOpenMonetization && (
              <button
                id="btn-open-monetization-header"
                onClick={onOpenMonetization}
                className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                title="Ver comisiones del 3% y modelo de monetización de la plataforma"
              >
                <span className="text-xs">💰</span>
                <span>Ganancias (3%)</span>
              </button>
            )}

            {/* In-App PWA Install Button */}
            <div className="hidden sm:block">
              <PWAInstallButton variant="header" />
            </div>

            {/* Currency Selector (Córdobas / Dólares) */}
            <div className="hidden sm:inline-flex rounded-full bg-stone-100 p-0.5 border border-stone-300/80 text-[11px] font-bold shrink-0">
              <button
                onClick={() => onCurrencyChange('NIO')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                  isCordobas
                    ? 'bg-violet-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Mostrar precios en Córdobas"
              >
                C$
              </button>
              <button
                onClick={() => onCurrencyChange('USD')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                  !isCordobas
                    ? 'bg-violet-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Mostrar precios en Dólares"
              >
                $
              </button>
            </div>

            {/* Customer Account Profile / Sign In */}
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
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-full border border-stone-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <User className="w-4 h-4 text-stone-500" />
                <span>Mi Cuenta</span>
              </button>
            )}

            {/* Order Notifications Bell Button */}
            {onOpenNotifications && (
              <button
                id="btn-open-notifications-header"
                onClick={onOpenNotifications}
                className="relative p-2 sm:p-2.5 text-stone-700 hover:text-amber-700 hover:bg-amber-50/70 rounded-full transition-colors flex items-center justify-center cursor-pointer shrink-0"
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

            {/* Favorites Button */}
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

            {/* Cart Button */}
            <button
              id="btn-open-cart-header"
              onClick={onOpenCart}
              className="relative flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-700 hover:to-indigo-800 active:scale-95 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-full transition-all shadow-md cursor-pointer whitespace-nowrap shrink-0"
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

            {/* GitHub Export Direct Button */}
            {onOpenExportGitHub && (
              <button
                id="btn-open-github-export-header"
                onClick={onOpenExportGitHub}
                className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                title="Pasar proyecto a GitHub"
              >
                <Github className="w-4 h-4 text-white" />
                <span>GitHub</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar + Mobile Currency Switcher */}
        <div className="pb-2.5 pt-1 md:hidden flex items-center gap-2">
          <div className="flex-1">
            <SearchAutocomplete
              id="search-input-mobile"
              isMobile={true}
              className="w-full"
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              products={products}
              categories={categories}
              storeSettings={storeSettings}
              businessAds={businessAds}
              currency={currency}
              placeholder="Prendas, tiendas, peluches..."
              onSelectProduct={onSelectProduct}
              onSelectCategory={onSelectCategory}
              onSelectSeller={onSelectSeller}
            />
          </div>

          <div className="md:hidden shrink-0">
            <PWAInstallButton variant="header" />
          </div>

          <div className="inline-flex rounded-full bg-stone-100 p-0.5 border border-stone-300 text-[11px] font-bold shrink-0">
            <button
              onClick={() => onCurrencyChange('NIO')}
              className={`px-2 py-1 rounded-full transition-all ${
                isCordobas ? 'bg-violet-600 text-white' : 'text-stone-600'
              }`}
            >
              C$
            </button>
            <button
              onClick={() => onCurrencyChange('USD')}
              className={`px-2 py-1 rounded-full transition-all ${
                !isCordobas ? 'bg-violet-600 text-white' : 'text-stone-600'
              }`}
            >
              $
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
