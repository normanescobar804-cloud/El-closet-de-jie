import React, { useState } from 'react';
import { Heart, Plus, Minus, ShoppingBag, Eye, Star, Store, Flame, ZoomIn, WifiOff, MessageCircle } from 'lucide-react';
import { CurrencyType, Product } from '../types';
import { formatCurrency, getOptimizedCatalogImageUrl, isDollarCurrency } from '../utils/storage';

interface ProductCardProps {
  product: Product;
  currency: CurrencyType;
  exchangeRate: number;
  cartQuantity: number;
  isFavorite: boolean;
  disableHighResImages?: boolean;
  onToggleFavorite: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number, size?: string) => void;
  onUpdateCartQuantity?: (product: Product, newQuantity: number) => void;
  onQuickView: (product: Product) => void;
  onOpenChat?: (product: Product) => void;
  onSelectSeller?: (sellerName: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  exchangeRate,
  cartQuantity,
  isFavorite,
  disableHighResImages = false,
  onToggleFavorite,
  onAddToCart,
  onUpdateCartQuantity,
  onQuickView,
  onOpenChat,
  onSelectSeller,
}) => {
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [isZooming, setIsZooming] = useState<boolean>(false);
  const [zoomCoords, setZoomCoords] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [forceHdLoaded, setForceHdLoaded] = useState<boolean>(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomCoords({ x, y });
  };

  const handleMouseEnter = () => {
    setIsZooming(true);
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
    setZoomCoords({ x: 50, y: 50 });
  };

  // Check inventory scarcity (< 3 units) to incentivize rapid purchases
  const stockQty = product.stock ?? product.inventory;
  const isLowStock = product.inStock && stockQty !== undefined && stockQty > 0 && stockQty < 3;
  const maxAvailable = isLowStock && stockQty ? stockQty : 20;

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 20;

  const defaultSize = product.sizes?.[0] || 'Única';

  const handleMinus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartQuantity > 0 && onUpdateCartQuantity) {
      onUpdateCartQuantity(product, cartQuantity - 1);
    } else {
      setSelectedQty((prev) => Math.max(1, prev - 1));
    }
  };

  const handlePlus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartQuantity > 0 && onUpdateCartQuantity) {
      if (cartQuantity < maxAvailable) {
        onUpdateCartQuantity(product, cartQuantity + 1);
      }
    } else {
      setSelectedQty((prev) => Math.min(maxAvailable, prev + 1));
    }
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, selectedQty, defaultSize);
    setSelectedQty(1);
  };

  return (
    <article
      id={`product-card-${product.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-stone-200/90 hover:border-violet-300 hover:shadow-xl transition-all duration-300 flex flex-col h-full relative"
    >
      {/* Image Container with Badges & Interactive Fabric Zoom */}
      <div
        className="relative aspect-square sm:aspect-[4/5] w-full overflow-hidden bg-stone-100 cursor-crosshair select-none"
        onClick={() => onQuickView(product)}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title="Pasa el cursor para inspeccionar la tela y el estado de la prenda en detalle"
      >
        <img
          src={getOptimizedCatalogImageUrl(
            product.images[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
            forceHdLoaded ? false : disableHighResImages
          )}
          alt={product.name}
          loading="lazy"
          decoding="async"
          width="400"
          height="400"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center pointer-events-none will-change-transform"
          style={{
            transformOrigin: `${zoomCoords.x}% ${zoomCoords.y}%`,
            transform: isZooming ? 'scale(2.2)' : 'scale(1)',
            transition: isZooming
              ? 'transform-origin 0.08s ease-out, transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)'
              : 'transform 0.35s ease-out, transform-origin 0.35s ease-out'
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=50';
          }}
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 pointer-events-none z-10">
          <span className="bg-gradient-to-r from-rose-600 to-red-500 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full shadow-xs tracking-wide tabular-nums">
            -{discountPercent}%
          </span>
          {isLowStock && (
            <span
              id={`badge-low-stock-${product.id}`}
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1 border border-white/25 animate-pulse"
              title={`¡Incentivo de compra rápida! Solo quedan ${stockQty} unidades en inventario`}
            >
              <Flame className="w-3 h-3 text-amber-200 fill-amber-200 shrink-0" />
              <span>Últimas unidades{stockQty !== undefined ? ` (${stockQty})` : ''}</span>
            </span>
          )}
          {product.condition === 'usada' ? (
            <span className="bg-amber-500 text-stone-950 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider flex items-center gap-0.5">
              <span>♻️</span> Ropa Usada
            </span>
          ) : (
            <span className="bg-emerald-600 text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider flex items-center gap-0.5">
              <span>✨</span> Ropa Nueva
            </span>
          )}
          {!product.inStock && (
            <span className="bg-stone-900/90 text-white text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Agotado
            </span>
          )}
        </div>

        {/* Fabric Detail / Zoom Indicator Badge */}
        {isZooming && (
          <div className="absolute top-2.5 right-12 z-20 pointer-events-none bg-stone-950/85 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md border border-white/20 animate-fade-in">
            <ZoomIn className="w-3 h-3 text-amber-300" />
            <span>Detalle de tela (2.2x)</span>
          </div>
        )}

        {/* Mobile Data Saver Badge / Load HD Button */}
        {disableHighResImages && !forceHdLoaded && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setForceHdLoaded(true);
            }}
            title="Ahorro de datos activo (imagen comprimida). Toca para cargar en alta resolución."
            className="absolute bottom-2.5 right-2.5 z-20 bg-stone-900/85 hover:bg-stone-950 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-md shadow-xs border border-white/20 transition-all cursor-pointer pointer-events-auto"
          >
            <WifiOff className="w-2.5 h-2.5 text-amber-300" />
            <span>Ahorro Datos · Cargar HD</span>
          </button>
        )}

        {/* Product Emoji Icon Tag */}
        {product.icon && (
          <div className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-xs rounded-lg px-2 py-1 text-base sm:text-lg shadow-2xs z-10 pointer-events-none">
            {product.icon}
          </div>
        )}

        {/* Direct Chat / Voice Note Inquiry Button */}
        {onOpenChat && (
          <button
            id={`btn-chat-prod-${product.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChat(product);
            }}
            className="absolute top-2.5 right-11.5 sm:right-12.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-violet-700 backdrop-blur-xs shadow-xs flex items-center justify-center transition-transform active:scale-90 cursor-pointer z-20"
            title="Preguntar o mandar nota de voz sobre esta prenda"
            aria-label="Chatear sobre la prenda"
          >
            <MessageCircle className="w-4 h-4 text-violet-600" />
          </button>
        )}

        {/* Favorite Heart Button */}
        <button
          id={`btn-fav-${product.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product);
          }}
          className="absolute top-2.5 right-2.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-rose-600 backdrop-blur-xs shadow-xs flex items-center justify-center transition-transform active:scale-90 cursor-pointer z-20"
          title={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          aria-label="Favorito"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? 'fill-rose-500 text-rose-500' : 'text-stone-600'
            }`}
          />
        </button>

        {/* Desktop Quick View Overlay */}
        <div className={`absolute bottom-2.5 inset-x-2.5 transition-opacity duration-200 hidden md:flex justify-center pointer-events-none z-10 ${isZooming ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="pointer-events-auto bg-stone-900/90 hover:bg-stone-900 text-white text-xs font-bold py-1.5 px-4 rounded-full shadow-md flex items-center gap-1.5 backdrop-blur-xs transition-transform active:scale-95 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver detalle</span>
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-stone-500 mb-0.5 truncate">
            <span className="uppercase tracking-wider font-bold text-violet-700 truncate">
              {product.category}
            </span>
            {product.sellerName && (
              <>
                <span aria-hidden="true">·</span>
                <span
                  onClick={(e) => {
                    if (onSelectSeller && product.sellerName) {
                      e.stopPropagation();
                      onSelectSeller(product.sellerName);
                    }
                  }}
                  className="inline-flex items-center gap-0.5 font-semibold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer truncate"
                  title={`Ver todas las prendas de ${product.sellerName}`}
                >
                  <Store className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{product.sellerName}</span>
                </span>
              </>
            )}
          </div>

          <h3
            onClick={() => onQuickView(product)}
            className="font-bold text-xs sm:text-sm text-stone-900 line-clamp-2 hover:text-violet-900 cursor-pointer transition-colors leading-tight"
          >
            {product.name}
          </h3>

          {/* Calificación 5 Estrellas */}
          <div
            onClick={() => onQuickView(product)}
            className="flex items-center gap-1 mt-1 cursor-pointer group/rating"
            title={`${(product.rating || 5.0).toFixed(1)} de 5 estrellas`}
          >
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= Math.round(product.rating || 5)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-stone-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-stone-700 ml-0.5 group-hover/rating:text-violet-700 tabular-nums">
              {(product.rating || 5.0).toFixed(1)}
            </span>
            {product.sellerCity && (
              <span className="text-[10px] text-stone-400 truncate">
                · {product.sellerCity}
              </span>
            )}
          </div>

          {/* Low Stock Scarcity Alert */}
          {isLowStock && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-amber-900 bg-amber-50/90 border border-amber-200/90 rounded-lg px-2 py-0.5 w-fit shadow-2xs">
              <Flame className="w-3 h-3 text-amber-600 fill-amber-500 shrink-0" />
              <span>¡Solo {stockQty === 1 ? 'queda 1 unidad' : `quedan ${stockQty} unidades`}!</span>
            </div>
          )}
        </div>

        {/* Price Row with Real-Time Currency Conversion */}
        <div>
          <div className="flex items-baseline gap-1.5 flex-wrap tabular-nums">
            <span className="text-sm sm:text-base font-black text-stone-900">
              {formatCurrency(product.price, currency, exchangeRate)}
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
              {isDollarCurrency(currency) ? 'USD' : 'NIO'}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[10px] sm:text-xs text-stone-400 line-through">
                {formatCurrency(product.originalPrice, currency, exchangeRate)}
              </span>
            )}
          </div>
          <div className="text-[10px] text-stone-500 tabular-nums mt-0.5">
            {isDollarCurrency(currency)
              ? `Equiv. C$ ${product.price.toFixed(2)}`
              : `≈ $ ${(product.price / (exchangeRate || 36.5)).toFixed(2)} USD`}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-1 border-t border-stone-100">
          {cartQuantity > 0 ? (
            <div className="bg-violet-50 rounded-xl p-1.5 border border-violet-200 flex items-center justify-between">
              <span className="text-[11px] font-bold text-violet-900 pl-1">
                En carrito ({cartQuantity})
              </span>
              <div className="flex items-center gap-1 bg-white rounded-lg border border-violet-200 overflow-hidden shadow-2xs">
                <button
                  onClick={handleMinus}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-stone-700 hover:bg-violet-100 active:bg-violet-200 transition-colors cursor-pointer"
                  title="Disminuir"
                  aria-label="Disminuir"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-xs font-black text-stone-900 tabular-nums">
                  {cartQuantity}
                </span>
                <button
                  onClick={handlePlus}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-stone-700 hover:bg-violet-100 active:bg-violet-200 transition-colors cursor-pointer"
                  title="Aumentar"
                  aria-label="Aumentar"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 overflow-hidden shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedQty((q) => Math.max(1, q - 1));
                  }}
                  className="w-7 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
                  title="Menos"
                  aria-label="Menos"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-xs font-bold text-stone-800 tabular-nums">
                  {selectedQty}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedQty((q) => Math.min(20, q + 1));
                  }}
                  className="w-7 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
                  title="Más"
                  aria-label="Más"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <button
                id={`btn-add-cart-${product.id}`}
                disabled={!product.inStock}
                onClick={handleAdd}
                className={`flex-1 min-h-[36px] py-1.5 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer shadow-xs touch-press ${
                  product.inStock
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{product.inStock ? 'Agregar' : 'Agotado'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
