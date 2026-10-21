import React from 'react';
import { Home, ShoppingBag, User, Bell, Store } from 'lucide-react';
import { CurrencyType, StoreSettings, UserAccount } from '../types';
import { formatCurrency } from '../utils/storage';

interface MobileNavProps {
  activeTab: 'catalog' | 'favorites' | 'cart' | 'admin';
  cartCount: number;
  cartTotal: number;
  currency: CurrencyType;
  storeSettings: StoreSettings;
  favoritesCount: number;
  unreadNotificationsCount?: number;
  currentUser: UserAccount | null;
  onOpenCatalog: () => void;
  onOpenFavorites: () => void;
  onOpenFreeSellerPortal?: () => void;
  onOpenNotifications?: () => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  cartCount,
  cartTotal,
  currency,
  storeSettings,
  unreadNotificationsCount = 0,
  currentUser,
  onOpenCatalog,
  onOpenFreeSellerPortal,
  onOpenNotifications,
  onOpenCart,
  onOpenAuth,
}) => {
  return (
    <>
      {/* Floating Cart Bar when items are in cart (Mobile only) */}
      {cartCount > 0 && activeTab !== 'cart' && (
        <div className="md:hidden fixed bottom-18 left-3 right-3 z-40 animate-slide-up">
          <button
            onClick={onOpenCart}
            className="w-full bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between border border-violet-500/30 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-mono font-bold text-xs tabular-nums">
                {cartCount}
              </div>
              <div className="text-left">
                <div className="text-xs font-black">Ver mi Carrito</div>
                <div className="text-[10px] text-violet-200">
                  {cartCount} producto{cartCount !== 1 ? 's' : ''} · Pagos Electrónicos o Efectivo
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black bg-white/15 px-2.5 py-1 rounded-lg tabular-nums">
                {formatCurrency(cartTotal, currency, storeSettings.exchangeRate)}
              </span>
              <span className="text-xs font-bold text-amber-300">Pagar →</span>
            </div>
          </button>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe gpu-layer">
        <nav className="grid grid-cols-5 h-16 max-w-md mx-auto px-1 items-center">
          {/* Catálogo / Inicio */}
          <button
            id="mobile-nav-catalog"
            onClick={onOpenCatalog}
            className={`flex flex-col items-center justify-center gap-0.5 h-full touch-press ${
              activeTab === 'catalog' ? 'text-violet-700 font-bold' : 'text-stone-600'
            } active:scale-95 transition-all`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] tracking-tight whitespace-nowrap">Catálogo</span>
          </button>

          {/* Vender Gratis (Open Platform Seller Hub) */}
          <button
            id="mobile-nav-sell-free"
            onClick={onOpenFreeSellerPortal}
            className="flex flex-col items-center justify-center gap-0.5 h-full text-emerald-700 font-bold active:scale-95 transition-all"
          >
            <Store className="w-5 h-5" />
            <span className="text-[10px] tracking-tight whitespace-nowrap">Vender Gratis</span>
          </button>

          {/* Carrito de Compras (Central destacado) */}
          <button
            id="mobile-nav-cart"
            onClick={onOpenCart}
            className="relative flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all -top-1.5"
          >
            <div className="relative w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <ShoppingBag className="w-5 h-5 text-amber-200" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-mono font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs tabular-nums">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold text-stone-900 tracking-tight whitespace-nowrap">
              Carrito
            </span>
          </button>

          {/* Notificaciones de Pedidos */}
          <button
            id="mobile-nav-notifications"
            onClick={onOpenNotifications}
            className="relative flex flex-col items-center justify-center gap-0.5 h-full text-stone-600 active:scale-95 transition-all"
            title="Notificaciones de Pedidos"
          >
            <div className="relative">
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-stone-950 text-[9px] font-mono font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs tabular-nums">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight font-medium whitespace-nowrap">
              Avisos
            </span>
          </button>

          {/* Cuenta de Cliente / Pedidos */}
          <button
            id="mobile-nav-user"
            onClick={onOpenAuth}
            className="flex flex-col items-center justify-center gap-0.5 h-full text-stone-600 active:scale-95 transition-all"
          >
            <div className="relative">
              <User className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight font-medium whitespace-nowrap">
              {currentUser?.isLoggedIn ? 'Mi Cuenta' : 'Cuenta'}
            </span>
          </button>
        </nav>
      </div>
    </>
  );
};
