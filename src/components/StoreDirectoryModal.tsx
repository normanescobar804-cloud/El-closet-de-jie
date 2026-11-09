import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Store,
  MapPin,
  Sparkles,
  ArrowRight,
  ShoppingBag,
  MessageCircle,
  ShieldCheck,
  Tag,
  Star,
  PlusCircle,
  ExternalLink
} from 'lucide-react';
import { Product, StoreSettings, UserAccount } from '../types';

export interface StoreProfileInfo {
  id: string;
  name: string;
  city: string;
  phone?: string;
  bio?: string;
  isOfficial?: boolean;
  productCount: number;
  previewImages: string[];
  categories: string[];
}

interface StoreDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  storeSettings: StoreSettings;
  currentUser: UserAccount | null;
  onSelectStore: (storeName: string) => void;
  onOpenSellerPortal?: () => void;
}

export const StoreDirectoryModal: React.FC<StoreDirectoryModalProps> = ({
  isOpen,
  onClose,
  products,
  storeSettings,
  currentUser,
  onSelectStore,
  onOpenSellerPortal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Todas');

  // Compute all available stores and boutiques from catalog and settings
  const storesList = useMemo<StoreProfileInfo[]>(() => {
    const map = new Map<string, StoreProfileInfo>();

    // 1. Official Main Store
    const officialProds = products.filter(
      (p) => !p.sellerName || p.sellerName === storeSettings.storeName
    );
    map.set(storeSettings.storeName.toLowerCase(), {
      id: 'official-main-store',
      name: storeSettings.storeName,
      city: 'Managua',
      phone: storeSettings.whatsappNumber || '+505 5889 8311',
      bio: 'Tienda Oficial de moda femenina, juvenil, ropa casual y peluches importados en Nicaragua.',
      isOfficial: true,
      productCount: officialProds.length,
      previewImages: officialProds.slice(0, 4).map((p) => p.image || p.imageUrl || '/portada.jpg'),
      categories: Array.from(new Set(officialProds.map((p) => p.category)))
    });

    // 2. All Vendor Boutiques from products catalog
    products.forEach((p) => {
      if (p.sellerName && p.sellerName !== storeSettings.storeName) {
        const key = p.sellerName.toLowerCase();
        const existing = map.get(key);
        const img = p.image || p.imageUrl || '/portada.jpg';
        if (existing) {
          existing.productCount += 1;
          if (existing.previewImages.length < 4 && img) {
            existing.previewImages.push(img);
          }
          if (p.category && !existing.categories.includes(p.category)) {
            existing.categories.push(p.category);
          }
        } else {
          map.set(key, {
            id: `store-${p.sellerName}`,
            name: p.sellerName,
            city: p.sellerCity || 'Managua',
            phone: p.sellerPhone,
            bio: `Boutique de moda y variedad con catálogo disponible en la plataforma.`,
            isOfficial: false,
            productCount: 1,
            previewImages: img ? [img] : [],
            categories: p.category ? [p.category] : []
          });
        }
      }
    });

    return Array.from(map.values());
  }, [products, storeSettings]);

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
        s.city.toLowerCase().includes(q) ||
        (s.bio && s.bio.toLowerCase().includes(q)) ||
        s.categories.some((c) => c.toLowerCase().includes(q));

      const matchCity = selectedCity === 'Todas' || s.city === selectedCity;

      return matchQuery && matchCity;
    });
  }, [storesList, searchQuery, selectedCity]);

  if (!isOpen) return null;

  const handleVisitStore = (storeName: string) => {
    onSelectStore(storeName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-900 via-purple-950 to-stone-900 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-stone-950 flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
              🏬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg sm:text-xl font-black text-white">
                  Directorio de Tiendas de Ropa & Boutiques
                </h3>
                <span className="text-[10px] bg-amber-400 text-stone-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {storesList.length} Tiendas
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                Busca y visita la tienda que prefieras para explorar todas sus prendas y realizar tus compras.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & City Filter Bar */}
        <div className="p-4 sm:p-5 bg-stone-50 border-b border-stone-200 space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
            <input
              type="text"
              id="input-search-clothing-store"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tienda de ropa por nombre, boutique o ciudad..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-2xl text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:border-violet-600 shadow-2xs"
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
              onClick={() => handleVisitStore('Todas')}
              className="ml-auto px-3 py-1.5 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-800 font-bold whitespace-nowrap text-xs transition-colors cursor-pointer border border-violet-200"
            >
              Ver Catálogo Completo →
            </button>
          </div>
        </div>

        {/* Stores Grid Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {filteredStores.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center text-3xl mx-auto">
                🏬
              </div>
              <h4 className="font-bold text-stone-800 text-sm">
                No se encontraron tiendas que coincidan con "{searchQuery}"
              </h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Prueba con otro nombre o selecciona otra ciudad para ver boutiques disponibles.
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
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                          {store.isOfficial ? '👑' : store.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-serif text-base font-bold text-stone-950 group-hover:text-violet-700 transition-colors">
                              {store.name}
                            </h4>
                            {store.isOfficial && (
                              <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                                Oficial
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-stone-400" />
                            <span>{store.city}, Nicaragua</span>
                            <span className="mx-1">·</span>
                            <span className="text-emerald-700 font-bold">
                              {store.productCount} {store.productCount === 1 ? 'prenda' : 'prendas'}
                            </span>
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-xl border border-violet-200 shrink-0">
                        ⭐ 5.0
                      </span>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-stone-600 line-clamp-2">
                      {store.bio}
                    </p>

                    {/* Product Variety Thumbnails */}
                    {store.previewImages.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                          Variedad de prendas en vitrina:
                        </span>
                        <div className="flex items-center gap-2">
                          {store.previewImages.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Prenda ${idx + 1}`}
                              className="w-12 h-12 rounded-xl object-cover border border-stone-200 shadow-2xs hover:scale-105 transition-transform"
                            />
                          ))}
                          {store.productCount > 4 && (
                            <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-xs font-bold text-stone-600 font-mono">
                              +{store.productCount - 4}
                            </div>
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
                      onClick={() => handleVisitStore(store.name)}
                      className="flex-1 py-2.5 px-4 bg-gradient-to-r from-violet-700 to-indigo-700 hover:from-violet-800 hover:to-indigo-800 text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                      <span>Visitar Tienda & Comprar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {store.phone && (
                      <a
                        href={`https://wa.me/${store.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `¡Hola ${store.name}! Vi tu catálogo en El Clóset de Jié y deseo consultar por tus prendas.`
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

        {/* Bottom Banner */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="text-stone-600 text-center sm:text-left">
            <span className="font-bold text-stone-900">¿Tienes una tienda o vendes ropa?</span>{' '}
            <span className="text-stone-500">
              Sube tus prendas gratis para que miles de compradores te visiten.
            </span>
          </div>

          {onOpenSellerPortal && (
            <button
              type="button"
              onClick={() => {
                onClose();
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
