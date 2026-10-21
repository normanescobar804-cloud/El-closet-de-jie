import React from 'react';
import { Clock, Eye, Trash2, ShoppingBag, Heart } from 'lucide-react';
import { CurrencyType, Product, StoreSettings } from '../types';
import { formatCurrency } from '../utils/storage';

interface RecentlyViewedSectionProps {
  products: Product[];
  recentlyViewedIds: string[];
  currency: CurrencyType;
  storeSettings: StoreSettings;
  favorites: string[];
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product, size?: string) => void;
  onToggleFavorite: (product: Product) => void;
  onClearHistory: () => void;
}

export const RecentlyViewedSection: React.FC<RecentlyViewedSectionProps> = ({
  products,
  recentlyViewedIds,
  currency,
  storeSettings,
  favorites,
  onQuickView,
  onAddToCart,
  onToggleFavorite,
  onClearHistory
}) => {
  // Match recently viewed IDs with existing products, keeping recent order
  const viewedProducts = React.useMemo(() => {
    if (!recentlyViewedIds || recentlyViewedIds.length === 0) return [];
    const productMap = new Map<string, Product>();
    products.forEach((p) => productMap.set(p.id, p));

    return recentlyViewedIds
      .map((id) => productMap.get(id))
      .filter((p): p is Product => Boolean(p));
  }, [products, recentlyViewedIds]);

  if (viewedProducts.length === 0) {
    return null;
  }

  return (
    <section
      id="recently-viewed-section"
      className="mt-12 pt-8 border-t border-stone-200/80 scroll-mt-20"
      aria-labelledby="recently-viewed-title"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 text-violet-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4 text-violet-600" />
            <span>Tu Historial de Navegación</span>
          </div>
          <h2 id="recently-viewed-title" className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Productos vistos recientemente
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Retoma tu búsqueda fácilmente y vuelve a ver las prendas que consultaste hace poco.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
            {viewedProducts.length} {viewedProducts.length === 1 ? 'prenda' : 'prendas'}
          </span>
          <button
            type="button"
            onClick={onClearHistory}
            className="text-xs font-bold text-stone-500 hover:text-rose-600 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-200 cursor-pointer"
            title="Borrar historial de productos vistos"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Borrar historial</span>
          </button>
        </div>
      </div>

      {/* Horizontal Carousel with cards */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 -mx-1 snap-x scrollbar-thin scrollbar-thumb-stone-300">
        {viewedProducts.map((product) => {
          const isFav = favorites.includes(product.id);
          const thumb = product.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80';

          return (
            <div
              key={product.id}
              className="w-56 sm:w-64 shrink-0 snap-start bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
            >
              {/* Image & Overlay */}
              <div className="relative aspect-square w-full bg-stone-100 overflow-hidden">
                <img
                  src={thumb}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Condition Badge */}
                <span
                  className={`absolute top-2.5 left-2.5 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider ${
                    product.condition === 'usada'
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {product.condition === 'usada' ? '♻️ Usada' : '✨ Nueva'}
                </span>

                {/* Favorite Button */}
                <button
                  type="button"
                  onClick={() => onToggleFavorite(product)}
                  className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-rose-600 shadow-sm flex items-center justify-center cursor-pointer transition-colors"
                  title="Favorito"
                  aria-label="Guardar en favoritos"
                >
                  <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>

                {/* Hover overlay to open details */}
                <button
                  type="button"
                  onClick={() => onQuickView(product)}
                  className="absolute inset-0 bg-stone-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white font-bold text-xs transition-opacity backdrop-blur-xs cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Ver Prenda</span>
                </button>
              </div>

              {/* Product Info */}
              <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                    <span className="uppercase tracking-wider font-semibold text-violet-700">
                      {product.category}
                    </span>
                    <span className="truncate max-w-[100px] text-stone-400">
                      {product.sellerCity || 'Nicaragua'}
                    </span>
                  </div>

                  <h3
                    onClick={() => onQuickView(product)}
                    className="font-semibold text-xs sm:text-sm text-stone-900 line-clamp-1 group-hover:text-violet-700 cursor-pointer transition-colors"
                    title={product.name}
                  >
                    {product.name}
                  </h3>

                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-black text-sm text-stone-900">
                      {formatCurrency(product.price, currency, storeSettings.exchangeRate)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-[11px] text-stone-400 line-through">
                        {formatCurrency(product.originalPrice, currency, storeSettings.exchangeRate)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => onQuickView(product)}
                    className="py-1.5 px-2 rounded-xl text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-stone-500" />
                    <span>Detalles</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAddToCart(product, product.sizes?.[0] || 'Única')}
                    disabled={!product.inStock}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      product.inStock
                        ? 'bg-violet-700 hover:bg-violet-800 text-white shadow-xs active:scale-95'
                        : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
