import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Store,
  MapPin,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  MessageCircle,
  PlusCircle,
  Eye,
  Plus,
  Package,
  Radio,
  Filter
} from 'lucide-react';
import { CurrencyType, Product, RegisteredStore, StoreSettings, UserAccount } from '../types';
import { formatCurrency, LEGACY_AI_STORE_NAMES } from '../utils/storage';

export interface StoreProfileInfo {
  id: string;
  ownerId?: string;
  name: string;
  ownerName?: string;
  city: string;
  phone?: string;
  bio?: string;
  photoURL?: string;
  productCount: number;
  previewImages: string[];
  categories: string[];
  products: Product[];
}

interface StoreDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  registeredStores?: RegisteredStore[];
  storeSettings: StoreSettings;
  currency: CurrencyType;
  currentUser: UserAccount | null;
  onSelectStore: (storeName: string) => void;
  onOpenSellerPortal?: () => void;
  onQuickViewProduct?: (product: Product) => void;
  onAddToCart?: (product: Product, size?: string) => void;
  onOpenChatWithStore?: (storeName: string, product?: Product) => void;
}

export const StoreDirectoryModal: React.FC<StoreDirectoryModalProps> = ({
  isOpen,
  onClose,
  products,
  registeredStores = [],
  storeSettings,
  currency,
  currentUser,
  onSelectStore,
  onOpenSellerPortal,
  onQuickViewProduct,
  onAddToCart,
  onOpenChatWithStore
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Todas');
  const [visitedStoreKey, setVisitedStoreKey] = useState<string | null>(null);
  const [inStoreSearch, setInStoreSearch] = useState('');
  const [inStoreCategory, setInStoreCategory] = useState('Todas');

  // Build directory exclusively from real-time registered stores and real user-published products
  const storesList = useMemo<StoreProfileInfo[]>(() => {
    const map = new Map<string, StoreProfileInfo>();

    // 1. Add all real-time registered stores (Cloud + Local Registry)
    registeredStores.forEach((regStore) => {
      const cleanName = (regStore.storeName || '').trim();
      if (!cleanName || LEGACY_AI_STORE_NAMES.has(cleanName.toLowerCase())) return;

      const key = cleanName.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          id: regStore.id || `store-${key}`,
          ownerId: regStore.ownerId,
          name: cleanName,
          ownerName: regStore.ownerName,
          city: regStore.city || 'Managua',
          phone: regStore.whatsapp,
          bio: regStore.bio || 'Tienda registrada en tiempo real en la plataforma.',
          photoURL: regStore.photoURL,
          productCount: 0,
          previewImages: [],
          categories: [],
          products: []
        });
      }
    });

    // 2. Attach real products and any sellers with live products (excluding legacy AI stores)
    products.forEach((p) => {
      const cleanSeller = (p.sellerName || '').trim();
      if (!cleanSeller || LEGACY_AI_STORE_NAMES.has(cleanSeller.toLowerCase())) return;

      const key = cleanSeller.toLowerCase();
      const img = p.images?.[0] || p.image || p.imageUrl || '/portada.jpg';

      let existing = map.get(key);
      if (!existing && p.authorId) {
        existing = Array.from(map.values()).find((s) => s.ownerId && s.ownerId === p.authorId);
      }

      if (existing) {
        existing.products.push(p);
        existing.productCount = existing.products.length;
        if (existing.previewImages.length < 4 && img && !existing.previewImages.includes(img)) {
          existing.previewImages.push(img);
        }
        if (p.category && !existing.categories.includes(p.category)) {
          existing.categories.push(p.category);
        }
        if (!existing.phone && p.sellerPhone) {
          existing.phone = p.sellerPhone;
        }
      } else {
        map.set(key, {
          id: `store-${key}`,
          ownerId: p.authorId,
          name: cleanSeller,
          city: p.sellerCity || 'Managua',
          phone: p.sellerPhone,
          bio: 'Tienda registrada en tiempo real con catálogo activo en Nicaragua.',
          productCount: 1,
          previewImages: img ? [img] : [],
          categories: p.category ? [p.category] : [],
          products: [p]
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.productCount - a.productCount);
  }, [products, registeredStores]);

  // Cities extracted for filtering
  const availableCities = useMemo(() => {
    const set = new Set<string>(['Todas']);
    storesList.forEach((s) => {
      if (s.city) set.add(s.city);
    });
    return Array.from(set);
  }, [storesList]);

  // Filtered stores
  const filteredStores = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return storesList.filter((s) => {
      const matchQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.ownerName && s.ownerName.toLowerCase().includes(q)) ||
        s.city.toLowerCase().includes(q) ||
        (s.bio && s.bio.toLowerCase().includes(q)) ||
        s.categories.some((c) => c.toLowerCase().includes(q)) ||
        s.products.some((p) => p.name.toLowerCase().includes(q));

      const matchCity = selectedCity === 'Todas' || s.city === selectedCity;

      return matchQuery && matchCity;
    });
  }, [storesList, searchQuery, selectedCity]);

  const activeVisitedStore = useMemo(() => {
    if (!visitedStoreKey) return null;
    return (
      storesList.find(
        (s) => s.id === visitedStoreKey || s.name.toLowerCase() === visitedStoreKey.toLowerCase()
      ) || null
    );
  }, [storesList, visitedStoreKey]);

  const inStoreCategories = useMemo(() => {
    if (!activeVisitedStore) return ['Todas'];
    return ['Todas', ...activeVisitedStore.categories];
  }, [activeVisitedStore]);

  const visitedStoreProducts = useMemo(() => {
    if (!activeVisitedStore) return [];
    const q = inStoreSearch.toLowerCase().trim();
    return activeVisitedStore.products.filter((p) => {
      const matchCat = inStoreCategory === 'Todas' || p.category === inStoreCategory;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [activeVisitedStore, inStoreSearch, inStoreCategory]);

  if (!isOpen) return null;

  const handleOpenStoreShowcase = (store: StoreProfileInfo) => {
    setVisitedStoreKey(store.name);
    setInStoreSearch('');
    setInStoreCategory('Todas');
  };

  const handleJumpToMainCatalog = (storeName: string) => {
    onSelectStore(storeName);
    setVisitedStoreKey(null);
    onClose();
  };

  const handleCloseAll = () => {
    setVisitedStoreKey(null);
    onClose();
  };

  const isOwnVisitedStore = Boolean(
    activeVisitedStore &&
      currentUser &&
      ((activeVisitedStore.ownerId && currentUser.uid === activeVisitedStore.ownerId) ||
        (currentUser.storeName &&
          currentUser.storeName.trim().toLowerCase() === activeVisitedStore.name.toLowerCase()))
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs overflow-y-auto"
      onClick={handleCloseAll}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-900 via-purple-950 to-stone-900 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {activeVisitedStore ? (
              <button
                type="button"
                id="btn-back-to-stores-directory"
                onClick={() => setVisitedStoreKey(null)}
                className="w-10 h-10 rounded-2xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Volver a todas las tiendas"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-stone-950 flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
                🏬
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-lg sm:text-xl font-black text-white truncate">
                  {activeVisitedStore
                    ? activeVisitedStore.name
                    : 'Tiendas Registradas en Tiempo Real'}
                </h3>
                <span className="text-[10px] bg-emerald-400 text-stone-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 shrink-0">
                  <Radio className="w-3 h-3" />
                  {activeVisitedStore
                    ? `${activeVisitedStore.productCount} Productos`
                    : `${storesList.length} ${storesList.length === 1 ? 'Tienda' : 'Tiendas'}`}
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5 truncate">
                {activeVisitedStore
                  ? `📍 ${activeVisitedStore.city}, Nicaragua • Explora todos los productos de esta tienda`
                  : 'Busca tiendas reales registradas por usuarios en tiempo real y explora sus productos.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseAll}
            className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VIEW A: VISITED STORE EXPLORER */}
        {activeVisitedStore ? (
          <>
            {/* Store Showcase Hero Info & Actions */}
            <div className="p-4 sm:p-5 bg-stone-50 border-b border-stone-200 space-y-3 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {activeVisitedStore.photoURL ? (
                    <img
                      src={activeVisitedStore.photoURL}
                      alt={activeVisitedStore.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-violet-300 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-center font-black text-lg shadow-xs shrink-0">
                      {activeVisitedStore.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-800 line-clamp-2">
                      {activeVisitedStore.bio || 'Tienda verificada en tiempo real en Nicaragua.'}
                    </p>
                    {activeVisitedStore.ownerName && (
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Propietario: <span className="font-semibold text-stone-700">{activeVisitedStore.ownerName}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {onOpenChatWithStore && (
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseAll();
                        onOpenChatWithStore(
                          activeVisitedStore.name,
                          activeVisitedStore.products[0]
                        );
                      }}
                      className="px-3 py-2 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-900 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat en App</span>
                    </button>
                  )}

                  {activeVisitedStore.phone && (
                    <a
                      href={`https://wa.me/${activeVisitedStore.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `¡Hola ${activeVisitedStore.name}! Visité tu tienda en El Clóset de Jié y me interesa explorar tus productos.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleJumpToMainCatalog(activeVisitedStore.name)}
                    className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Ver en Catálogo Principal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* In-Store Product Search & Category Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center pt-1">
                <div className="sm:col-span-7 relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    id="input-search-inside-store"
                    value={inStoreSearch}
                    onChange={(e) => setInStoreSearch(e.target.value)}
                    placeholder={`Buscar productos dentro de ${activeVisitedStore.name}...`}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-violet-600"
                  />
                  {inStoreSearch && (
                    <button
                      type="button"
                      onClick={() => setInStoreSearch('')}
                      className="absolute right-2.5 top-2 text-xs text-stone-400 hover:text-stone-700"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="sm:col-span-5 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                  <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  {inStoreCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setInStoreCategory(cat)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                        inStoreCategory === cat
                          ? 'bg-violet-700 text-white'
                          : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Store Products Explorer Grid */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-stone-50/40">
              {visitedStoreProducts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-stone-200 p-6 space-y-3">
                  <Package className="w-12 h-12 text-stone-300 mx-auto" />
                  <h4 className="font-bold text-stone-800 text-sm">
                    {activeVisitedStore.products.length === 0
                      ? `${activeVisitedStore.name} aún no ha subido productos al catálogo`
                      : `No hay productos que coincidan con "${inStoreSearch}"`}
                  </h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    {activeVisitedStore.products.length === 0
                      ? 'Esta tienda ya está registrada en tiempo real. Pronto publicará sus artículos o puedes contactarla directamente por WhatsApp.'
                      : 'Prueba limpiando el filtro de búsqueda o categoría dentro de la tienda.'}
                  </p>
                  {isOwnVisitedStore && onOpenSellerPortal && (
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseAll();
                        onOpenSellerPortal();
                      }}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Subir Productos a Mi Tienda</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visitedStoreProducts.map((product) => {
                    const img = product.images?.[0] || '/portada.jpg';
                    return (
                      <div
                        key={product.id}
                        className="bg-white rounded-2xl border border-stone-200 hover:border-violet-400 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div
                            onClick={() => {
                              if (onQuickViewProduct) {
                                handleCloseAll();
                                onQuickViewProduct(product);
                              }
                            }}
                            className="relative aspect-[4/3] w-full bg-stone-100 overflow-hidden cursor-pointer group"
                          >
                            <img
                              src={img}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <span
                              className={`absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs ${
                                product.condition === 'usada'
                                  ? 'bg-amber-400 text-stone-950'
                                  : 'bg-emerald-500 text-white'
                              }`}
                            >
                              {product.condition === 'usada' ? '♻️ Usado' : '✨ Nuevo'}
                            </span>
                            {!product.inStock && (
                              <span className="absolute top-2 right-2 text-[10px] font-bold bg-stone-900/85 text-white px-2 py-0.5 rounded-full">
                                Agotado
                              </span>
                            )}
                          </div>

                          <div className="p-3.5 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700">
                              {product.category}
                            </span>
                            <h4 className="font-bold text-sm text-stone-900 line-clamp-1">
                              {product.name}
                            </h4>
                            <p className="text-[11px] text-stone-500 line-clamp-2">
                              {product.description || 'Disponible en tienda registrada.'}
                            </p>
                            <div className="flex items-baseline gap-2 pt-1">
                              <span className="text-sm font-black text-stone-950 font-mono">
                                {formatCurrency(product.price, currency, storeSettings.exchangeRate)}
                              </span>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-[11px] text-stone-400 line-through font-mono">
                                  {formatCurrency(product.originalPrice, currency, storeSettings.exchangeRate)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-3.5 pt-0 flex items-center gap-2">
                          {onQuickViewProduct && (
                            <button
                              type="button"
                              onClick={() => {
                                handleCloseAll();
                                onQuickViewProduct(product);
                              }}
                              className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver</span>
                            </button>
                          )}
                          {onAddToCart && (
                            <button
                              type="button"
                              disabled={!product.inStock}
                              onClick={() => onAddToCart(product, product.sizes?.[0] || 'Única')}
                              className="flex-1 py-2 px-3 rounded-xl bg-violet-700 hover:bg-violet-800 disabled:bg-stone-300 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{product.inStock ? 'Agregar' : 'Agotado'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          /* VIEW B: DIRECTORY SEARCH & LIST OF REAL-TIME STORES */
          <>
            {/* Search & City Filter Bar */}
            <div className="p-4 sm:p-5 bg-stone-50 border-b border-stone-200 space-y-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  id="input-search-clothing-store"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar tienda registrada por nombre, propietario, ciudad o producto..."
                  className="w-full pl-10 pr-8 py-2.5 bg-white border border-stone-300 rounded-2xl text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:border-violet-600 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-xs text-stone-400 hover:text-stone-700 p-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quick Filter Badges */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0">
                  Ciudad:
                </span>
                {availableCities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedCity(city)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer text-xs ${
                      selectedCity === city
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-200'
                    }`}
                  >
                    {city === 'Todas' ? '🏙️ Todas las Ciudades' : `📍 ${city}`}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handleJumpToMainCatalog('Todas')}
                  className="ml-auto px-3 py-1.5 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-800 font-bold whitespace-nowrap text-xs transition-colors cursor-pointer border border-violet-200"
                >
                  Ver Catálogo Completo →
                </button>
              </div>
            </div>

            {/* Stores Grid Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {storesList.length === 0 ? (
                <div className="text-center py-12 space-y-3 bg-stone-50 rounded-3xl border border-stone-200 p-6">
                  <div className="w-16 h-16 rounded-full bg-white text-violet-600 flex items-center justify-center mx-auto shadow-xs border border-stone-200">
                    <Store className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-stone-900 text-base">
                    Aún no hay tiendas registradas en tiempo real
                  </h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                    Hemos eliminado todas las tiendas ficticias o generadas por IA. Solo aparecerán aquí las tiendas reales registradas por usuarios de la plataforma en tiempo real.
                  </p>
                  {onOpenSellerPortal && (
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseAll();
                        onOpenSellerPortal();
                      }}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Registrar Mi Tienda Gratis Ahora</span>
                    </button>
                  )}
                </div>
              ) : filteredStores.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center text-3xl mx-auto">
                    🏬
                  </div>
                  <h4 className="font-bold text-stone-800 text-sm">
                    No se encontraron tiendas que coincidan con &ldquo;{searchQuery}&rdquo;
                  </h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Prueba con otro nombre o selecciona otra ciudad para ver tiendas registradas.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCity('Todas');
                    }}
                    className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Restablecer Búsqueda
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredStores.map((store) => (
                    <div
                      key={store.id}
                      className="p-5 rounded-3xl bg-white border-2 border-stone-200/80 hover:border-violet-500 hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group"
                    >
                      <div className="space-y-3">
                        {/* Header info */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {store.photoURL ? (
                              <img
                                src={store.photoURL}
                                alt={store.name}
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 rounded-2xl object-cover border border-violet-300 shadow-xs shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                                {store.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-serif text-base font-bold text-stone-950 group-hover:text-violet-700 transition-colors truncate">
                                  {store.name}
                                </h4>
                                <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-200">
                                  En Tiempo Real
                                </span>
                              </div>
                              <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5 flex-wrap">
                                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                <span>{store.city}, Nicaragua</span>
                                <span className="mx-1">·</span>
                                <span className="text-emerald-700 font-bold">
                                  {store.productCount}{' '}
                                  {store.productCount === 1 ? 'producto' : 'productos'}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Bio */}
                        <p className="text-xs text-stone-600 line-clamp-2">
                          {store.bio}
                        </p>

                        {/* Product Variety Thumbnails */}
                        {store.previewImages.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                              Variedad de productos en esta tienda:
                            </span>
                            <div className="flex items-center gap-2">
                              {store.previewImages.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`Producto ${idx + 1}`}
                                  onClick={() => handleOpenStoreShowcase(store)}
                                  className="w-12 h-12 rounded-xl object-cover border border-stone-200 shadow-2xs hover:scale-105 transition-transform cursor-pointer"
                                />
                              ))}
                              {store.productCount > 4 && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenStoreShowcase(store)}
                                  className="w-12 h-12 rounded-xl bg-stone-100 hover:bg-violet-100 border border-stone-200 flex items-center justify-center text-xs font-bold text-stone-700 font-mono cursor-pointer"
                                >
                                  +{store.productCount - 4}
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {store.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {store.categories.slice(0, 3).map((cat, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-lg font-medium"
                              >
                                #{cat}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions Bar */}
                      <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
                        <button
                          type="button"
                          id={`btn-visit-store-${store.name.toLowerCase().replace(/\s+/g, '-')}`}
                          onClick={() => handleOpenStoreShowcase(store)}
                          className="flex-1 py-2.5 px-4 bg-gradient-to-r from-violet-700 to-indigo-700 hover:from-violet-800 hover:to-indigo-800 text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                          <span>Explorar Productos</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        {store.phone && (
                          <a
                            href={`https://wa.me/${store.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `¡Hola ${store.name}! Vi tu catálogo en El Clóset de Jié y deseo consultar por tus productos.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-colors cursor-pointer shrink-0"
                            title="Chat con la tienda por WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Bottom Banner */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="text-stone-600 text-center sm:text-left">
            <span className="font-bold text-stone-900">¿Tienes una tienda o vendes productos?</span>{' '}
            <span className="text-stone-500">
              Regístrala en tiempo real gratis para que tus clientes exploren tu catálogo.
            </span>
          </div>

          {onOpenSellerPortal && (
            <button
              type="button"
              onClick={() => {
                handleCloseAll();
                onOpenSellerPortal();
              }}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>Abrir Mi Tienda Gratis</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
