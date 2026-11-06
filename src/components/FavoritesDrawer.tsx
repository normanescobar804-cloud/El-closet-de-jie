import React from 'react';
import { X, Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { CurrencyType, Product, StoreSettings } from '../types';
import { formatCurrency } from '../utils/storage';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: Product[];
  currency: CurrencyType;
  storeSettings: StoreSettings;
  onRemoveFavorite: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onAddAllToCart: () => void;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  favorites,
  currency,
  storeSettings,
  onRemoveFavorite,
  onAddToCart,
  onAddAllToCart,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-stone-200 z-10 animate-slide-left">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            <h2 className="font-serif text-lg font-bold text-stone-900">
              Tus Favoritos
            </h2>
            <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {favorites.length}
            </span>
          </div>

          <button
            id="btn-close-favorites-drawer"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar favoritos"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Favorite Items */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-stone-100">
          {favorites.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center text-rose-400">
                <Heart className="w-10 h-10 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">Aún no tienes favoritos</h3>
                <p className="text-xs text-stone-500 max-w-xs">
                  Toca el corazón en cualquier prenda de la tienda para guardarla y revisarla cuando desees.
                </p>
              </div>
              <button
                id="btn-empty-fav-explore"
                onClick={onClose}
                className="mt-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-transform active:scale-95 shadow-md cursor-pointer"
              >
                Ver Colección
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {favorites.map((product) => (
                <div
                  key={product.id}
                  className="flex gap-3 pt-3 first:pt-0 group items-center bg-stone-50/50 p-2.5 rounded-xl border border-stone-100"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-white shrink-0 border border-stone-200 relative">
                    <img
                      src={product.images[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80'}
                      alt={product.name}
                      className="w-full h-full object-cover object-center"
                    />
                    {product.icon && (
                      <span className="absolute bottom-1 right-1 text-xs bg-white/90 rounded px-1 shadow-2xs">
                        {product.icon}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-bold text-xs sm:text-sm text-stone-900 line-clamp-1">
                          {product.name}
                        </h4>
                        <button
                          id={`btn-remove-fav-${product.id}`}
                          onClick={() => onRemoveFavorite(product.id)}
                          className="text-stone-400 hover:text-red-600 transition-colors p-1"
                          title="Quitar de favoritos"
                          aria-label="Quitar de favoritos"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-[10px] text-stone-400 block mt-0.5">
                        {product.category}
                      </span>
                      <div className="text-xs font-black text-stone-900 mt-1">
                        {formatCurrency(product.price, currency, storeSettings.exchangeRate)}
                      </div>
                    </div>

                    {/* Add to cart quick button */}
                    <button
                      id={`btn-fav-add-to-cart-${product.id}`}
                      onClick={() => onAddToCart(product)}
                      disabled={!product.inStock}
                      className={`mt-2 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        product.inStock
                          ? 'bg-violet-700 hover:bg-violet-800 text-white shadow-xs'
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{product.inStock ? 'Pasar al Carrito' : 'Agotado'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {favorites.length > 0 && (
          <div className="p-4 sm:p-5 bg-white border-t border-stone-200 space-y-2.5">
            <button
              id="btn-add-all-favorites-to-cart"
              onClick={onAddAllToCart}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Agregar todos al Carrito</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
