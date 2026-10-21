import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Plus,
  Upload,
  Store,
  CheckCircle2,
  Trash2,
  Edit2,
  MapPin,
  MessageCircle,
  Sparkles,
  Package,
  Globe,
  ShieldCheck,
  Share2,
  LogIn
} from 'lucide-react';
import { CurrencyType, Product, StoreSettings, UserAccount } from '../types';
import { PRODUCT_CATEGORIES } from '../data/initialProducts';
import { NICARAGUA_DEPARTMENTS } from '../utils/advertising';
import { formatCurrency, processHighResImage } from '../utils/storage';

interface FreeSellerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentUser: UserAccount | null;
  currency: CurrencyType;
  storeSettings: StoreSettings;
  isCloudConnected: boolean;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onGoogleLogin: () => Promise<void>;
  onUpdateUser: (user: UserAccount) => void;
  onFilterBySeller?: (sellerName: string) => void;
}

export const FreeSellerPortalModal: React.FC<FreeSellerPortalModalProps> = ({
  isOpen,
  onClose,
  products,
  currentUser,
  currency,
  storeSettings,
  isCloudConnected,
  onSaveProduct,
  onDeleteProduct,
  onGoogleLogin,
  onUpdateUser,
  onFilterBySeller
}) => {
  const [activeTab, setActiveTab] = useState<'publish' | 'my_items' | 'community_stores'>('publish');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Seller Identity Fields
  const [sellerName, setSellerName] = useState(
    currentUser?.storeName || currentUser?.name || ''
  );
  const [sellerPhone, setSellerPhone] = useState(currentUser?.phone || '');
  const [sellerCity, setSellerCity] = useState(
    currentUser?.department || currentUser?.city || 'Managua'
  );

  // Product Fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [category, setCategory] = useState(
    PRODUCT_CATEGORIES.filter((c) => c !== 'Todas')[0] || 'Ropa de Niños'
  );
  const [condition, setCondition] = useState<'nueva' | 'usada'>('nueva');
  const [material, setMaterial] = useState('');
  const [sizesInput, setSizesInput] = useState('Única, S, M, L');
  const [colorsInput, setColorsInput] = useState('Original');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const myProducts = useMemo(() => {
    return products.filter((p) => {
      if (currentUser?.uid && p.authorId && p.authorId === currentUser.uid) return true;
      if (sellerPhone.trim() && p.sellerPhone && p.sellerPhone.replace(/\D/g, '') === sellerPhone.replace(/\D/g, '')) {
        return true;
      }
      if (sellerName.trim() && p.sellerName && p.sellerName.toLowerCase() === sellerName.trim().toLowerCase()) {
        return true;
      }
      return false;
    });
  }, [products, currentUser?.uid, sellerPhone, sellerName]);

  const communityStores = useMemo(() => {
    const map = new Map<
      string,
      {
        sellerName: string;
        sellerCity: string;
        sellerPhone: string;
        count: number;
        sampleImage: string;
      }
    >();

    // Always include official store
    map.set(storeSettings.storeName, {
      sellerName: storeSettings.storeName,
      sellerCity: 'Managua • Tienda Oficial',
      sellerPhone: storeSettings.whatsappNumber,
      count: products.filter((p) => !p.sellerName || p.sellerName === storeSettings.storeName).length,
      sampleImage: products[0]?.images?.[0] || '/portada.jpg'
    });

    products.forEach((p) => {
      if (p.sellerName && p.sellerName !== storeSettings.storeName) {
        const existing = map.get(p.sellerName);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(p.sellerName, {
            sellerName: p.sellerName,
            sellerCity: p.sellerCity || 'Nicaragua',
            sellerPhone: p.sellerPhone || storeSettings.whatsappNumber,
            count: 1,
            sampleImage: p.images?.[0] || '/portada.jpg'
          });
        }
      }
    });

    return Array.from(map.values());
  }, [products, storeSettings]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const processed = await processHighResImage(file);
      setImageUrl(processed);
    } catch (err) {
      console.error('Error uploading product photo:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const resetProductForm = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setOriginalPrice('');
    setDescription('');
    setImageUrl('');
    setSizesInput('Única, S, M, L');
    setColorsInput('Original');
    setCondition('nueva');
    setMaterial('');
  };

  const handleEditItem = (prod: Product) => {
    setEditingId(prod.id);
    setName(prod.name);
    setPrice(String(prod.price));
    setOriginalPrice(prod.originalPrice ? String(prod.originalPrice) : '');
    setCategory(prod.category);
    setCondition(prod.condition || 'nueva');
    setMaterial(prod.material || '');
    setSizesInput((prod.sizes || ['Única']).join(', '));
    setColorsInput((prod.colors || ['Original']).join(', '));
    setDescription(prod.description || '');
    setImageUrl(prod.images?.[0] || '');
    if (prod.sellerName) setSellerName(prod.sellerName);
    if (prod.sellerPhone) setSellerPhone(prod.sellerPhone);
    if (prod.sellerCity) setSellerCity(prod.sellerCity);
    setActiveTab('publish');
  };

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !sellerName.trim() || !sellerPhone.trim()) return;

    const numericPrice = Math.max(1, Number(price) || 0);
    const numericOriginal = originalPrice ? Number(originalPrice) : Math.round(numericPrice * 1.25);

    const cleanSellerName = sellerName.trim();
    const cleanSellerPhone = sellerPhone.trim();
    const cleanSellerCity = sellerCity.trim() || 'Managua';

    // Save or update user account locally so seller identity persists automatically
    const updatedUser: UserAccount = {
      ...(currentUser || {
        isLoggedIn: true,
        createdAt: Date.now()
      }),
      name: currentUser?.name || cleanSellerName,
      storeName: cleanSellerName,
      phone: cleanSellerPhone,
      city: cleanSellerCity,
      department: cleanSellerCity,
      role: currentUser?.role === 'admin' ? 'admin' : 'seller',
      isLoggedIn: true,
      updatedAt: Date.now()
    };
    onUpdateUser(updatedUser);

    const newProduct: Product = {
      id: editingId || `com-${Date.now().toString().slice(-7)}`,
      authorId: currentUser?.uid || `local-${cleanSellerPhone.replace(/\D/g, '')}`,
      name: name.trim(),
      price: numericPrice,
      originalPrice: numericOriginal > numericPrice ? numericOriginal : undefined,
      category,
      condition,
      material: material.trim() || undefined,
      description:
        description.trim() ||
        `${name.trim()} publicado por ${cleanSellerName} en ${cleanSellerCity}, Nicaragua.`,
      icon: condition === 'nueva' ? '✨' : '♻️',
      images: [
        imageUrl ||
          'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=800&q=80'
      ],
      sizes: sizesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      colors: colorsInput
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      inStock: true,
      featured: true,
      sellerName: cleanSellerName,
      sellerPhone: cleanSellerPhone,
      sellerCity: cleanSellerCity,
      rating: 5.0,
      reviewCount: 1,
      createdAt: Date.now()
    };

    onSaveProduct(newProduct);
    setPublishSuccess(true);
    resetProductForm();
    setTimeout(() => {
      setPublishSuccess(false);
      setActiveTab('my_items');
    }, 1800);
  };

  const handleToggleStock = (prod: Product) => {
    onSaveProduct({
      ...prod,
      inStock: !prod.inStock
    });
  };

  const handleGoogleConnect = async () => {
    setIsLoggingIn(true);
    try {
      await onGoogleLogin();
    } catch (err) {
      console.warn('Google sign-in cancelled or failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-950 via-teal-900 to-stone-950 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-400 text-stone-950 flex items-center justify-center shadow-md shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif text-lg sm:text-2xl font-bold text-white">
                  Plataforma Abierta • Publica y Vende Gratis
                </h2>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  100% Uso Libre • 0% Comisión
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Cualquier persona o emprendedor en Nicaragua puede subir sus productos gratis y recibir pedidos directo en su WhatsApp.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-stone-100 px-3 sm:px-6 py-2.5 border-b border-stone-200 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('publish')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'publish'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-200/70 border border-stone-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{editingId ? 'Editar Producto' : 'Publicar Producto Gratis'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('my_items')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'my_items'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-200/70 border border-stone-200'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Mis Publicaciones ({myProducts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('community_stores')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'community_stores'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-200/70 border border-stone-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Tiendas de la Comunidad ({communityStores.length})</span>
            </button>
          </div>

          {/* Cloud Status / Google Sync Button */}
          <div className="shrink-0 hidden sm:flex items-center gap-2">
            {currentUser?.uid ? (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sincronizado en la Nube ({currentUser.name.split(' ')[0]})</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleGoogleConnect}
                disabled={isLoggingIn}
                className="text-[11px] font-bold text-stone-800 bg-white hover:bg-stone-50 border border-stone-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isLoggingIn ? 'Conectando...' : 'Conectar con Google para Nube Global'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'publish' && (
            <form onSubmit={handlePublishSubmit} className="space-y-6">
              {publishSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center gap-3 animate-fade-in">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-black">¡Tu producto ya está publicado en el catálogo!</h4>
                    <p className="text-xs text-emerald-800">
                      Todos los visitantes pueden verlo y comprarte directo a tu WhatsApp sin comisiones.
                    </p>
                  </div>
                </div>
              )}

              {/* Section 1: Seller / Store Information */}
              <div className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-emerald-600" />
                      <span>1. Datos de tu Tienda o Vendedor</span>
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Los clientes verán tu nombre y podrán enviarte pedidos directo a tu WhatsApp.
                    </p>
                  </div>
                  {!currentUser?.uid && (
                    <button
                      type="button"
                      onClick={handleGoogleConnect}
                      className="sm:hidden text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg"
                    >
                      Conectar Google
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Nombre de tu Tienda o Tu Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      placeholder="Ej. Tienda Variedades Gaby"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:border-emerald-600 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Tu WhatsApp de Ventas (Nicaragua) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={sellerPhone}
                      onChange={(e) => setSellerPhone(e.target.value)}
                      placeholder="Ej. 8888-8888"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:border-emerald-600 focus:outline-none bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Departamento / Ciudad *
                    </label>
                    <select
                      value={sellerCity}
                      onChange={(e) => setSellerCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:border-emerald-600 focus:outline-none bg-white"
                    >
                      {NICARAGUA_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Product Information & Photo */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Left: Photo Upload */}
                <div className="md:col-span-5 space-y-3">
                  <label className="block text-xs font-bold text-stone-700">
                    2. Foto del Producto (Desde tu celular o PC)
                  </label>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative aspect-square rounded-2xl border-2 border-dashed border-stone-300 hover:border-emerald-500 bg-stone-50 flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-colors group"
                  >
                    {imageUrl ? (
                      <>
                        <img
                          src={imageUrl}
                          alt="Vista previa"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-stone-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                          Cambiar Fotografía
                        </div>
                      </>
                    ) : (
                      <div className="p-6 text-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-stone-800">
                          {isUploading ? 'Optimizando imagen HD...' : 'Toca aquí para subir foto'}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          Acepta fotos de cámara de celular o galería (JPG, PNG, WebP)
                        </p>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="O pega el enlace URL de una imagen..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                {/* Right: Item Details */}
                <div className="md:col-span-7 space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Nombre del Producto o Prenda *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Vestido Floral Niña Talla 4 / Peluche Oso Gigante"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Precio de Venta en Córdobas (C$) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        step="any"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Ej. 250"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-mono font-bold focus:border-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Precio Anterior (Opcional C$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        placeholder="Ej. 320"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-mono focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Categoría
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:border-emerald-600 focus:outline-none bg-white"
                      >
                        {PRODUCT_CATEGORIES.filter((c) => c !== 'Todas').map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Estado del Artículo
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setCondition('nueva')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            condition === 'nueva'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-stone-700 border-stone-300'
                          }`}
                        >
                          ✨ Nuevo
                        </button>
                        <button
                          type="button"
                          onClick={() => setCondition('usada')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            condition === 'usada'
                              ? 'bg-amber-500 text-stone-950 border-amber-500'
                              : 'bg-white text-stone-700 border-stone-300'
                          }`}
                        >
                          ♻️ Usado
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Tallas disponibles (separadas por coma)
                      </label>
                      <input
                        type="text"
                        value={sizesInput}
                        onChange={(e) => setSizesInput(e.target.value)}
                        placeholder="Ej. S, M, L o 2T, 4T"
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:border-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Colores (separados por coma)
                      </label>
                      <input
                        type="text"
                        value={colorsInput}
                        onChange={(e) => setColorsInput(e.target.value)}
                        placeholder="Ej. Rosa, Azul, Blanco"
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Material / Composición (Para Ficha y Lectura Rápida)
                    </label>
                    <input
                      type="text"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      placeholder="Ej. 100% Algodón, Denim Stretch, Lino Natural, Felpa suave..."
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Descripción y detalles de entrega
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe el estado, medidas o puntos de entrega en tu ciudad..."
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetProductForm}
                        className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-100 cursor-pointer"
                      >
                        Cancelar edición
                      </button>
                    )}
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>
                        {editingId ? 'Guardar Cambios gratis' : 'Publicar Ahora Gratis en el Catálogo'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'my_items' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Mis Productos Publicados ({myProducts.length})
                  </h3>
                  <p className="text-xs text-stone-500">
                    Administra tus artículos libremente: cambia precios, márcalos como vendidos o agrega más.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetProductForm();
                    setActiveTab('publish');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Publicación Gratis</span>
                </button>
              </div>

              {myProducts.length === 0 ? (
                <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-200 p-6 space-y-3">
                  <Store className="w-10 h-10 text-stone-400 mx-auto" />
                  <h4 className="font-bold text-stone-800 text-sm">
                    Aún no has publicado productos con este perfil
                  </h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    Usa la pestaña &ldquo;Publicar Producto Gratis&rdquo; para subir prendas, calzado, peluches o artículos y empezar a vender libremente en toda Nicaragua.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('publish')}
                    className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 cursor-pointer"
                  >
                    Subir mi primer producto gratis
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {myProducts.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl border border-stone-200 bg-white flex items-center gap-3.5 shadow-2xs"
                    >
                      <img
                        src={item.images[0] || '/portada.jpg'}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover bg-stone-100 shrink-0 border border-stone-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-emerald-700 truncate">
                            {item.sellerName || 'Mi Tienda'} • {item.sellerCity || 'Nicaragua'}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-black text-stone-900 font-mono">
                            {formatCurrency(item.price, currency, storeSettings.exchangeRate)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.inStock
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {item.inStock ? 'En Stock' : 'Vendido / Agotado'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleStock(item)}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold cursor-pointer"
                        >
                          {item.inStock ? 'Marcar Vendido' : 'Reactivar'}
                        </button>
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            type="button"
                            onClick={() => handleEditItem(item)}
                            className="p-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(item.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'community_stores' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Tiendas y Vendedores Activos en la Plataforma ({communityStores.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Explora los artículos de cada vendedor o contáctalos directamente por WhatsApp.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {communityStores.map((store) => {
                  const cleanWa = store.sellerPhone.replace(/\D/g, '');
                  const fullWa = cleanWa.length === 8 ? `505${cleanWa}` : cleanWa || '50558898311';

                  return (
                    <div
                      key={store.sellerName}
                      className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-emerald-400 transition-all shadow-2xs flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={store.sampleImage}
                          alt={store.sellerName}
                          className="w-13 h-13 rounded-2xl object-cover border border-stone-200 bg-stone-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-stone-900 truncate">
                            {store.sellerName}
                          </h4>
                          <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate">{store.sellerCity}</span>
                          </p>
                          <p className="text-[11px] font-bold text-emerald-700 mt-0.5">
                            {store.count} producto{store.count !== 1 ? 's' : ''} en catálogo
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                        {onFilterBySeller && (
                          <button
                            type="button"
                            onClick={() => {
                              onFilterBySeller(store.sellerName);
                              onClose();
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold cursor-pointer transition-colors"
                          >
                            Ver Productos
                          </button>
                        )}
                        <a
                          href={`https://wa.me/${fullWa}?text=${encodeURIComponent(
                            `¡Hola ${store.sellerName}! Vi tu tienda en la plataforma El Clóset de Jié y me gustaría consultar por tus productos.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-600">
          <span className="flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Plataforma Abierta y de Uso Libre para todos los usuarios de Nicaragua</span>
          </span>
          <span className="font-mono text-stone-500">
            {isCloudConnected ? '☁️ Base de Datos Firestore Activa' : '💾 Modo Híbrido Activo'}
          </span>
        </div>
      </div>
    </div>
  );
};
