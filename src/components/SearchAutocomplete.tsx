import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Store,
  Tag,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  ChevronRight,
  TrendingUp,
  MapPin,
  Flame,
  Mic,
  MicOff,
  AudioWaveform,
  AlertCircle,
  Check
} from 'lucide-react';
import { BusinessAd, CategoryFilter, CurrencyType, Product, StoreSettings } from '../types';
import { formatCurrency } from '../utils/storage';
import { useVoiceSearch } from '../hooks/useVoiceSearch';

export interface SearchAutocompleteProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  products: Product[];
  categories: CategoryFilter[];
  storeSettings: StoreSettings;
  businessAds?: BusinessAd[];
  currency: CurrencyType;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  id?: string;
  isMobile?: boolean;
  onSelectProduct?: (product: Product) => void;
  onSelectCategory?: (category: CategoryFilter) => void;
  onSelectSeller?: (sellerName: string) => void;
  onPerformSearch?: (query: string) => void;
}

interface CategorySuggestion {
  type: 'category';
  id: string;
  name: string;
  count: number;
}

interface StoreSuggestion {
  type: 'store';
  id: string;
  name: string;
  location?: string;
  badge: 'oficial' | 'vendedor' | 'negocio';
  productCount: number;
}

interface ProductSuggestion {
  type: 'product';
  id: string;
  product: Product;
}

type SuggestionItem = CategorySuggestion | StoreSuggestion | ProductSuggestion;

// Helper to highlight matching text
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim()) {
    return <span>{text}</span>;
  }

  const trimmedQuery = query.trim().toLowerCase();
  const index = text.toLowerCase().indexOf(trimmedQuery);

  if (index === -1) {
    return <span>{text}</span>;
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + trimmedQuery.length);
  const after = text.slice(index + trimmedQuery.length);

  return (
    <span>
      {before}
      <span className="bg-amber-100 text-stone-950 font-black rounded-xs px-0.5 underline decoration-violet-400 decoration-2">
        {match}
      </span>
      {after}
    </span>
  );
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  searchQuery,
  onSearchChange,
  products,
  categories,
  storeSettings,
  businessAds = [],
  currency,
  placeholder = 'Buscar productos, tiendas, ropa de niños, peluches...',
  className = '',
  inputClassName = '',
  id = 'search-input',
  isMobile = false,
  onSelectProduct,
  onSelectCategory,
  onSelectSeller,
  onPerformSearch
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 🎙️ Web Speech API - Búsqueda por Voz en Tiempo Real
  const {
    isSupported: isSpeechSupported,
    isListening,
    liveTranscript,
    errorMessage: voiceError,
    toggleListening,
    stopListening,
    abortListening,
    clearError: clearVoiceError
  } = useVoiceSearch({
    lang: 'es-NI',
    onTranscriptChange: (text, isFinal) => {
      onSearchChange(text);
      setIsOpen(true);
      if (isFinal) {
        const catalogEl = document.getElementById('catalogo-section');
        if (catalogEl) {
          catalogEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    },
    onFinalResult: (finalText) => {
      onSearchChange(finalText);
      const catalogEl = document.getElementById('catalogo-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  const cleanQuery = searchQuery.trim().toLowerCase();

  // 1. Compute Category Suggestions
  const matchingCategories = useMemo<CategorySuggestion[]>(() => {
    // Unique valid categories (exclude 'Todas')
    const allUniqueCategories = Array.from(
      new Set([
        ...categories.filter((c) => c !== 'Todas'),
        ...products.map((p) => p.category).filter(Boolean)
      ])
    );

    if (!cleanQuery) return [];

    return allUniqueCategories
      .filter((cat) => cat.toLowerCase().includes(cleanQuery))
      .slice(0, 4)
      .map((cat) => ({
        type: 'category' as const,
        id: `cat-${cat}`,
        name: cat,
        count: products.filter((p) => p.category.toLowerCase() === cat.toLowerCase()).length
      }));
  }, [categories, products, cleanQuery]);

  // 2. Compute Store / Seller Suggestions
  const matchingStores = useMemo<StoreSuggestion[]>(() => {
    if (!cleanQuery) return [];

    const storesMap = new Map<string, StoreSuggestion>();

    // Main official store
    if (storeSettings.storeName.toLowerCase().includes(cleanQuery)) {
      storesMap.set(storeSettings.storeName.toLowerCase(), {
        type: 'store' as const,
        id: 'store-main',
        name: storeSettings.storeName,
        location: storeSettings.address ? 'Managua, Nicaragua' : undefined,
        badge: 'oficial',
        productCount: products.filter((p) => !p.sellerName || p.sellerName === storeSettings.storeName).length
      });
    }

    // Community sellers from products
    products.forEach((p) => {
      if (p.sellerName && p.sellerName.toLowerCase().includes(cleanQuery)) {
        const key = p.sellerName.toLowerCase();
        if (!storesMap.has(key)) {
          storesMap.set(key, {
            type: 'store' as const,
            id: `store-seller-${p.sellerName}`,
            name: p.sellerName,
            location: p.sellerCity || 'Nicaragua',
            badge: 'vendedor',
            productCount: products.filter((item) => item.sellerName === p.sellerName).length
          });
        }
      }
    });

    // Business ads registered in directory
    businessAds.forEach((ad) => {
      const matchName = ad.businessName.toLowerCase().includes(cleanQuery);
      const matchDept = ad.department?.toLowerCase().includes(cleanQuery);
      const key = ad.businessName.toLowerCase();

      if ((matchName || matchDept) && !storesMap.has(key)) {
        storesMap.set(key, {
          type: 'store' as const,
          id: `store-ad-${ad.id}`,
          name: ad.businessName,
          location: ad.department ? `${ad.department}, Nicaragua` : 'Nicaragua',
          badge: 'negocio',
          productCount: products.filter((p) => p.sellerName === ad.businessName).length
        });
      }
    });

    return Array.from(storesMap.values()).slice(0, 4);
  }, [storeSettings, products, businessAds, cleanQuery]);

  // 3. Compute Product Suggestions
  const matchingProducts = useMemo<ProductSuggestion[]>(() => {
    if (!cleanQuery) return [];

    return products
      .filter((p) => {
        const matchName = p.name.toLowerCase().includes(cleanQuery);
        const matchCat = p.category.toLowerCase().includes(cleanQuery);
        const matchDesc = p.description?.toLowerCase().includes(cleanQuery);
        const matchSeller = p.sellerName?.toLowerCase().includes(cleanQuery);
        return matchName || matchCat || matchDesc || matchSeller;
      })
      .slice(0, 5)
      .map((p) => ({
        type: 'product' as const,
        id: `prod-${p.id}`,
        product: p
      }));
  }, [products, cleanQuery]);

  // Flattened list for keyboard navigation
  const flatSuggestions = useMemo<SuggestionItem[]>(() => {
    return [...matchingCategories, ...matchingStores, ...matchingProducts];
  }, [matchingCategories, matchingStores, matchingProducts]);

  const hasResults = flatSuggestions.length > 0;
  const isTyping = cleanQuery.length > 0;

  // Popular / Trending categories for empty state when user focuses on search
  const popularCategories = useMemo(() => {
    return categories.filter((c) => c !== 'Todas').slice(0, 5);
  }, [categories]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery]);

  const handleExecuteSearch = (queryToSearch: string) => {
    setIsOpen(false);
    if (onPerformSearch) {
      onPerformSearch(queryToSearch);
    } else {
      onSearchChange(queryToSearch);
      const catalogEl = document.getElementById('catalogo-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleSelectCategory = (categoryName: string) => {
    setIsOpen(false);
    if (onSelectCategory) {
      onSelectCategory(categoryName as CategoryFilter);
    } else {
      onSearchChange(categoryName);
    }
    const catalogEl = document.getElementById('catalogo-section');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectStore = (storeName: string) => {
    setIsOpen(false);
    if (onSelectSeller) {
      onSelectSeller(storeName);
    } else {
      onSearchChange(storeName);
    }
    const catalogEl = document.getElementById('catalogo-section');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectProduct = (product: Product) => {
    setIsOpen(false);
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      onSearchChange(product.name);
      const catalogEl = document.getElementById('catalogo-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flatSuggestions.length) {
        const item = flatSuggestions[selectedIndex];
        if (item.type === 'category') handleSelectCategory(item.name);
        else if (item.type === 'store') handleSelectStore(item.name);
        else if (item.type === 'product') handleSelectProduct(item.product);
      } else {
        handleExecuteSearch(searchQuery);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  let globalIndexCounter = -1;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input Container */}
      <div className="relative w-full flex items-center">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={`${id}-suggestions-list`}
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className={`w-full pl-10 pr-16 sm:pr-20 py-2 bg-stone-100 hover:bg-white focus:bg-white text-xs sm:text-sm text-stone-900 rounded-full border border-stone-200 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200/60 transition-all placeholder:text-stone-400 ${inputClassName}`}
        />

        {/* Action Buttons: Clear Search & Voice Search (Web Speech API) */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 sm:gap-1 z-10">
          {searchQuery && (
            <button
              type="button"
              id={`${id}-clear-btn`}
              onClick={() => {
                onSearchChange('');
                setSelectedIndex(-1);
                inputRef.current?.focus();
              }}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer transition-colors"
              title="Limpiar búsqueda"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            id={`${id}-voice-btn`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleListening();
            }}
            className={`p-1.5 rounded-full transition-all cursor-pointer relative flex items-center justify-center shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-400'
                : 'text-stone-400 hover:text-violet-600 hover:bg-stone-200/70'
            }`}
            title={
              isListening
                ? 'Escuchando tu voz... Haz clic para detener'
                : isSpeechSupported
                ? 'Búsqueda por voz (Web Speech API) - Habla para buscar'
                : 'Búsqueda por voz (Navegador no compatible)'
            }
            aria-label={isListening ? 'Detener búsqueda por voz' : 'Iniciar búsqueda por voz'}
          >
            {isListening ? (
              <>
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-80"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>
                <Mic className="w-3.5 h-3.5 text-white animate-pulse" />
              </>
            ) : (
              <Mic className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* 🎙️ Voice Search Active Floating Banner */}
      {isListening && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-gradient-to-r from-stone-900 via-violet-950 to-stone-900 text-white rounded-2xl p-3.5 shadow-2xl border border-violet-500/40 z-50 animate-fade-in backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <AudioWaveform className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                Escuchando en tiempo real...
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={stopListening}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                title="Finalizar y ver resultados"
              >
                <Check className="w-3 h-3" />
                <span>Listo</span>
              </button>
              <button
                type="button"
                onClick={abortListening}
                className="p-1 text-stone-400 hover:text-white rounded-full cursor-pointer transition-colors"
                title="Cancelar voz"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Voice Wave Animation */}
          <div className="flex items-center justify-center gap-1 py-1.5">
            <div className="w-1 bg-violet-400 rounded-full animate-pulse h-4"></div>
            <div className="w-1 bg-rose-400 rounded-full animate-bounce h-6"></div>
            <div className="w-1 bg-amber-400 rounded-full animate-pulse h-5"></div>
            <div className="w-1 bg-emerald-400 rounded-full animate-bounce h-7"></div>
            <div className="w-1 bg-violet-300 rounded-full animate-pulse h-4"></div>
          </div>

          {/* Live Transcript Display */}
          <div className="bg-stone-800/80 rounded-xl px-3 py-2 border border-stone-700 text-center my-1">
            {liveTranscript ? (
              <p className="text-xs sm:text-sm font-medium text-amber-200 italic font-mono">
                "{liveTranscript}"
              </p>
            ) : (
              <p className="text-xs text-stone-400 italic">
                Habla ahora... Di prendas, categorías o nombres de tiendas.
              </p>
            )}
          </div>

          <div className="text-[10px] text-stone-400 text-center mt-1 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
            <span>Filtrando los productos del catálogo al instante con Web Speech API</span>
          </div>
        </div>
      )}

      {/* ⚠️ Voice Search Error Banner */}
      {voiceError && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl p-2.5 shadow-lg z-50 text-xs flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{voiceError}</span>
          </div>
          <button
            type="button"
            onClick={clearVoiceError}
            className="p-1 text-rose-500 hover:text-rose-800 rounded-full cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div
          id={`${id}-suggestions-list`}
          className={`absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-stone-200 shadow-xl shadow-stone-900/10 overflow-hidden z-50 animate-fade-in ${
            isMobile ? 'max-h-[75vh]' : 'max-h-[520px]'
          } overflow-y-auto divide-y divide-stone-100`}
          style={{ minWidth: isMobile ? '100%' : '380px' }}
        >
          {/* STATE 1: Empty Query - Show Quick Discover / Trending */}
          {!isTyping && (
            <div className="p-3 sm:p-4 bg-stone-50/70">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Explorar Categorías Populares</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {popularCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-violet-50 hover:text-violet-700 text-stone-700 text-xs font-semibold border border-stone-200/90 shadow-2xs transition-all cursor-pointer active:scale-95"
                  >
                    <Tag className="w-3 h-3 text-stone-400" />
                    <span>{cat}</span>
                  </button>
                ))}
              </div>

              {/* Store Quick Jump */}
              <div className="mt-3 pt-3 border-t border-stone-200/70 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleSelectStore(storeSettings.storeName)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-violet-700 hover:text-violet-900 cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Ver Tienda Oficial ({storeSettings.storeName})</span>
                </button>
                <span className="text-[10px] text-stone-400 font-medium">Comunidad Nicaragua</span>
              </div>
            </div>
          )}

          {/* STATE 2: User is typing and has matches */}
          {isTyping && hasResults && (
            <div>
              {/* SECTION A: Categorías */}
              {matchingCategories.length > 0 && (
                <div className="p-2.5 sm:p-3">
                  <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-violet-600" />
                    <span>Categorías ({matchingCategories.length})</span>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {matchingCategories.map((cat) => {
                      globalIndexCounter++;
                      const isHighlighted = selectedIndex === globalIndexCounter;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleSelectCategory(cat.name)}
                          onMouseEnter={() => setSelectedIndex(globalIndexCounter)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                            isHighlighted ? 'bg-violet-50 text-violet-900' : 'hover:bg-stone-50 text-stone-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                              <Tag className="w-3 h-3" />
                            </div>
                            <span className="text-xs sm:text-sm font-semibold truncate">
                              <HighlightMatch text={cat.name} query={searchQuery} />
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-400 font-medium tabular-nums shrink-0 ml-2">
                            {cat.count} {cat.count === 1 ? 'producto' : 'productos'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION B: Tiendas y Vendedores */}
              {matchingStores.length > 0 && (
                <div className="p-2.5 sm:p-3 bg-stone-50/50">
                  <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                    <Store className="w-3 h-3 text-emerald-600" />
                    <span>Tiendas y Vendedores ({matchingStores.length})</span>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {matchingStores.map((store) => {
                      globalIndexCounter++;
                      const isHighlighted = selectedIndex === globalIndexCounter;
                      return (
                        <button
                          key={store.id}
                          type="button"
                          onClick={() => handleSelectStore(store.name)}
                          onMouseEnter={() => setSelectedIndex(globalIndexCounter)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                            isHighlighted ? 'bg-emerald-50 text-emerald-950' : 'hover:bg-stone-100/70 text-stone-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                              store.badge === 'oficial'
                                ? 'bg-amber-100 text-amber-800'
                                : store.badge === 'vendedor'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              <Store className="w-3 h-3" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs sm:text-sm font-bold truncate">
                                  <HighlightMatch text={store.name} query={searchQuery} />
                                </span>
                                {store.badge === 'oficial' && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-200 text-amber-900 shrink-0">
                                    Oficial
                                  </span>
                                )}
                                {store.badge === 'vendedor' && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-200 text-emerald-900 shrink-0">
                                    Comunidad
                                  </span>
                                )}
                                {store.badge === 'negocio' && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-200 text-blue-900 shrink-0">
                                    Negocio Aliado
                                  </span>
                                )}
                              </div>
                              {store.location && (
                                <div className="flex items-center gap-1 text-[11px] text-stone-500">
                                  <MapPin className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                                  <span className="truncate">{store.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {store.productCount > 0 && (
                            <span className="text-[11px] text-stone-400 font-medium tabular-nums shrink-0 ml-2">
                              {store.productCount} {store.productCount === 1 ? 'artículo' : 'artículos'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION C: Productos */}
              {matchingProducts.length > 0 && (
                <div className="p-2.5 sm:p-3">
                  <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                    <ShoppingBag className="w-3 h-3 text-indigo-600" />
                    <span>Productos sugeridos ({matchingProducts.length})</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {matchingProducts.map(({ product }) => {
                      globalIndexCounter++;
                      const isHighlighted = selectedIndex === globalIndexCounter;
                      const thumb = product.images?.[0] || '';

                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleSelectProduct(product)}
                          onMouseEnter={() => setSelectedIndex(globalIndexCounter)}
                          className={`w-full flex items-center justify-between gap-3 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                            isHighlighted ? 'bg-indigo-50/80' : 'hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Thumbnail */}
                            <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs">
                                  🛍️
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                                <HighlightMatch text={product.name} query={searchQuery} />
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-stone-500 mt-0.5">
                                <span>{product.category}</span>
                                {product.condition === 'usada' ? (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1 rounded">
                                    ♻️ Usada
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                                    ✨ Nueva
                                  </span>
                                )}
                                {product.sellerName && (
                                  <span className="text-stone-400">· {product.sellerName}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="text-right shrink-0">
                            <span className="text-xs sm:text-sm font-black text-stone-900 font-mono tabular-nums">
                              {formatCurrency(product.price, currency, storeSettings.exchangeRate)}
                            </span>
                            <span className="block text-[10px] text-violet-600 font-semibold">
                              Ver prenda →
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STATE 3: User is typing but NO matches found */}
          {isTyping && !hasResults && (
            <div className="p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-2.5">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-stone-800">
                No encontramos resultados para &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                Prueba buscando por categoría como &ldquo;Niños&rdquo;, &ldquo;Peluches&rdquo; o el nombre de una tienda.
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {popularCategories.slice(0, 3).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Action Footer: Always available when typing */}
          {isTyping && (
            <div className="p-2 sm:p-2.5 bg-stone-50 flex items-center justify-between text-xs border-t border-stone-200/80">
              <button
                type="button"
                onClick={() => handleExecuteSearch(searchQuery)}
                className="flex items-center gap-1.5 font-bold text-violet-700 hover:text-violet-900 transition-colors cursor-pointer group"
              >
                <span>Ver todos los resultados para &ldquo;<span className="underline">{searchQuery}</span>&rdquo;</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <span className="hidden sm:inline-block text-[10px] text-stone-400 font-mono bg-white px-1.5 py-0.5 rounded border border-stone-200">
                Presiona Enter ↵
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
