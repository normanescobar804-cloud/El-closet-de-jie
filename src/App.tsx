import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ShoppingBag,
  MessageCircle,
  Truck,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  Filter,
  ArrowUpDown,
  Maximize2,
  Star,
  X,
  Download,
  BarChart3,
  Eye,
  Megaphone,
  Store,
  PlusCircle
} from 'lucide-react';
import portadaImg from './assets/images/portada_closet_jie_1789701820109.jpg';
import {
  AnalyticsData,
  BusinessAd,
  CartItem,
  CategoryFilter,
  CurrencyType,
  CustomerTestimonial,
  OrderNotification,
  OrderRecord,
  PaymentStatusType,
  Product,
  StoreSettings,
  UserAccount
} from './types';
import {
  getSavedCart,
  getSavedFavorites,
  getSavedOrders,
  getSavedProducts,
  getSavedSettings,
  getSavedUser,
  getSavedCurrency,
  getSavedTestimonials,
  saveTestimonial,
  deleteTestimonial,
  saveCart,
  saveFavorites,
  saveProducts,
  saveSettings,
  saveUser,
  saveCurrency,
  resetProductsToDefault,
  formatCurrency,
  getSavedRecentlyViewed,
  saveRecentlyViewed,
  clearRecentlyViewed
} from './utils/storage';
import { getAnalyticsData, recordPageView } from './utils/analytics';
import {
  getSavedNotifications,
  saveNotifications,
  createOrderNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
  playNotificationChime
} from './utils/notifications';
import { checkAndTriggerPriceAlerts } from './utils/priceAlerts';
import {
  getSavedBusinessAds,
  saveBusinessAds,
  recordAdClickLocal
} from './utils/advertising';
import {
  auth,
  onAuthStateChanged,
  ensureCustomerAccountInFirestore,
  signInCustomerWithGoogle,
  signOutCustomer,
  saveProductToCloud,
  deleteProductFromCloud,
  saveBusinessAdToCloud,
  deleteBusinessAdFromCloud,
  saveOrderToCloud,
  updateOrderInCloudByAdmin,
  markNotificationReadInCloud,
  subscribeToCloudProducts,
  subscribeToCloudBusinessAds,
  subscribeToUserOrders,
  subscribeToUserNotifications,
  ADMIN_OWNER_EMAIL
} from './firebase';
import { PRODUCT_CATEGORIES } from './data/initialProducts';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { RecentlyViewedSection } from './components/RecentlyViewedSection';
import { CartDrawer } from './components/CartDrawer';
import { QuickAuthModal } from './components/QuickAuthModal';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import { AdminModal } from './components/AdminModal';
import { ContactModal } from './components/ContactModal';
import { GitHubExportModal } from './components/GitHubExportModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { GoogleAdSenseSlot } from './components/GoogleAdSenseSlot';
import {
  SponsoredHeroBanner,
  SponsoredCatalogCard,
  SponsoredBusinessDirectory
} from './components/SponsoredAdBanner';
import { AdvertiseModal } from './components/AdvertiseModal';
import { FreeSellerPortalModal } from './components/FreeSellerPortalModal';
import { EditStoreModal } from './components/EditStoreModal';
import { MonetizationHubModal } from './components/MonetizationHubModal';
import { TestimonialCarousel } from './components/TestimonialCarousel';
import { ToastContainer, ToastMessage } from './components/Toast';
import { OfflineIndicator } from './components/OfflineIndicator';

type PriceRangeType = 'all' | '10-50' | '50-100' | '100-200' | '200-500' | '500+';
type SortOrderType = 'featured' | 'price-asc' | 'price-desc' | 'name-asc';

export default function App() {
  // --- Persistent States ---
  const [products, setProducts] = useState<Product[]>(getSavedProducts);
  const [cart, setCart] = useState<CartItem[]>(getSavedCart);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(getSavedSettings);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(getSavedUser);
  const [favorites, setFavorites] = useState<string[]>(getSavedFavorites);
  const [orders, setOrders] = useState<OrderRecord[]>(getSavedOrders);
  const [notifications, setNotifications] = useState<OrderNotification[]>(getSavedNotifications);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(isNotificationSoundEnabled);
  const [businessAds, setBusinessAds] = useState<BusinessAd[]>(getSavedBusinessAds);
  const [currency, setCurrency] = useState<CurrencyType>(getSavedCurrency);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(getAnalyticsData);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(getSavedRecentlyViewed);
  const [testimonials, setTestimonials] = useState<CustomerTestimonial[]>(getSavedTestimonials);

  // --- Modal & Drawer Visibility States ---
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'orders' | 'notifications' | 'profile' | 'reviews'>('orders');
  const [isFreeSellerPortalOpen, setIsFreeSellerPortalOpen] = useState(false);
  const [isEditStoreModalOpen, setIsEditStoreModalOpen] = useState(false);
  const [isMonetizationHubOpen, setIsMonetizationHubOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isAdvertiseModalOpen, setIsAdvertiseModalOpen] = useState(false);
  const [isGitHubExportOpen, setIsGitHubExportOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactProduct, setContactProduct] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isPortadaModalOpen, setIsPortadaModalOpen] = useState(false);

  // --- Filtering & Search States ---
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('Todas');
  const [selectedSellerFilter, setSelectedSellerFilter] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);
  const [conditionFilter, setConditionFilter] = useState<'all' | 'nueva' | 'usada'>('all');
  const [priceRange, setPriceRange] = useState<PriceRangeType>('all');
  const [sortOrder, setSortOrder] = useState<SortOrderType>('featured');

  // --- Toast Notifications State ---
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'cart' | 'favorite' | 'info', title: string, subtitle?: string) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      title,
      subtitle
    };
    setToasts((prev) => [...prev.slice(-3), newToast]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --- 💬 Customer Testimonials Handlers ---
  const handleAddTestimonial = (testimonial: CustomerTestimonial) => {
    const updated = saveTestimonial(testimonial);
    setTestimonials(updated);
    addToast('info', '¡Testimonio Publicado!', 'Tu reseña ya es visible en el carrusel de la página de inicio.');
  };

  const handleDeleteTestimonial = (id: string) => {
    const updated = deleteTestimonial(id);
    setTestimonials(updated);
    addToast('info', 'Reseña Eliminada', 'El testimonio fue removido.');
  };

  // --- 💾 Local Persistence Effects ---
  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    saveSettings(storeSettings);
  }, [storeSettings]);

  useEffect(() => {
    saveUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  useEffect(() => {
    saveCurrency(currency);
  }, [currency]);

  useEffect(() => {
    saveBusinessAds(businessAds);
  }, [businessAds]);

  useEffect(() => {
    saveRecentlyViewed(recentlyViewedIds);
  }, [recentlyViewedIds]);

  useEffect(() => {
    if (quickViewProduct) {
      setRecentlyViewedIds((prev) => {
        const filtered = prev.filter((id) => id !== quickViewProduct.id);
        const updated = [quickViewProduct.id, ...filtered].slice(0, 16);
        saveRecentlyViewed(updated);
        return updated;
      });
    }
  }, [quickViewProduct?.id]);

  // --- 🔔 Price Drop Alerts Catalog Evaluation ---
  useEffect(() => {
    if (products.length > 0) {
      const { newNotifications } = checkAndTriggerPriceAlerts(products);
      if (newNotifications.length > 0) {
        setNotifications((prev) => {
          const combined = [...newNotifications, ...prev];
          saveNotifications(combined);
          return combined;
        });
        newNotifications.forEach((n) => {
          addToast('info', n.title, n.message);
        });
      }
    }
  }, [products]);

  // --- ☁️ Firebase Cloud Auth & Firestore Real-time Sync ---
  useEffect(() => {
    const unsubProducts = subscribeToCloudProducts((cloudProducts) => {
      if (cloudProducts.length > 0) {
        setProducts((prev) => {
          const map = new Map<string, Product>();
          prev.forEach((p) => map.set(p.id, p));
          cloudProducts.forEach((cp) => map.set(cp.id, cp));
          return Array.from(map.values());
        });
        setIsCloudConnected(true);
      }
    });

    const unsubAds = subscribeToCloudBusinessAds((cloudAds) => {
      if (cloudAds.length > 0) {
        setBusinessAds((prev) => {
          const map = new Map<string, BusinessAd>();
          prev.forEach((a) => map.set(a.id, a));
          cloudAds.forEach((ca) => map.set(ca.id, ca));
          return Array.from(map.values());
        });
        setIsCloudConnected(true);
      }
    });

    return () => {
      unsubProducts();
      unsubAds();
    };
  }, []);

  useEffect(() => {
    let unsubOrders: (() => void) | null = null;
    let unsubNotifs: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (unsubOrders) {
        unsubOrders();
        unsubOrders = null;
      }
      if (unsubNotifs) {
        unsubNotifs();
        unsubNotifs = null;
      }

      if (fbUser) {
        try {
          const syncedAccount = await ensureCustomerAccountInFirestore(
            fbUser,
            currentUser || undefined,
            favorites
          );
          setCurrentUser(syncedAccount);
          setIsCloudConnected(true);

          const isOwnerAdmin = Boolean(
            fbUser.emailVerified &&
              fbUser.email?.toLowerCase() === ADMIN_OWNER_EMAIL.toLowerCase()
          );

          unsubOrders = subscribeToUserOrders(fbUser.uid, isOwnerAdmin, (cloudOrders) => {
            if (cloudOrders.length > 0) {
              setOrders((prev) => {
                const map = new Map<string, OrderRecord>();
                prev.forEach((o) => map.set(o.id, o));
                cloudOrders.forEach((co) => map.set(co.id, co));
                return Array.from(map.values()).sort(
                  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
              });
            }
          });

          unsubNotifs = subscribeToUserNotifications(fbUser.uid, isOwnerAdmin, (cloudNotifs) => {
            if (cloudNotifs.length > 0) {
              setNotifications((prev) => {
                const map = new Map<string, OrderNotification>();
                prev.forEach((n) => map.set(n.id, n));
                cloudNotifs.forEach((cn) => map.set(cn.id, cn));
                const merged = Array.from(map.values()).sort(
                  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                saveNotifications(merged);
                return merged;
              });
            }
          });
        } catch (err) {
          console.warn('Cloud account sync notice:', err);
        }
      }
    });

    return () => {
      unsubAuth();
      if (unsubOrders) unsubOrders();
      if (unsubNotifs) unsubNotifs();
    };
  }, []);

  // --- 📊 Traffic & Visit Analytics Recording ---
  useEffect(() => {
    const updated = recordPageView();
    setAnalyticsData(updated);
  }, []);

  // --- 🔗 Deep Link: Abrir producto compartido por WhatsApp (?producto=ID o ?product=ID) ---
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const targetProductId = searchParams.get('producto') || searchParams.get('product');
      if (targetProductId && products.length > 0) {
        const found = products.find((p) => p.id === targetProductId);
        if (found) {
          setQuickViewProduct(found);
        }
      }
    } catch (e) {
      console.warn('Notice reading product deep link:', e);
    }
  }, [products]);

  // --- 🛍️ Cart Actions ---
  const handleAddToCart = (product: Product, size?: string, color?: string, quantity: number = 1) => {
    const chosenSize = size || product.sizes?.[0] || 'Única';
    const chosenColor = color || product.colors?.[0] || 'Original';
    const itemId = `${product.id}-${chosenSize}-${chosenColor}`;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === itemId);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        const newItem: CartItem = {
          id: itemId,
          product,
          quantity,
          selectedSize: chosenSize,
          selectedColor: chosenColor
        };
        return [...prevCart, newItem];
      }
    });

    addToast('cart', '¡Agregado al carrito!', `${quantity}x ${product.name} (${chosenSize})`);
  };

  const handleUpdateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === itemId ? { ...item, quantity: newQty } : item))
    );
  };

  const handleUpdateProductCartQuantity = (product: Product, newQty: number) => {
    const matchingItems = cart.filter((i) => i.product.id === product.id);
    if (matchingItems.length > 0) {
      if (newQty <= 0) {
        setCart((prev) => prev.filter((i) => i.product.id !== product.id));
        addToast('info', 'Prenda retirada del carrito', product.name);
      } else {
        const primary = matchingItems[0];
        setCart((prev) =>
          prev.map((i) => (i.id === primary.id ? { ...i, quantity: newQty } : i))
        );
      }
    } else if (newQty > 0) {
      handleAddToCart(product, product.sizes?.[0] || 'Única', undefined, newQty);
    }
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prevCart) => {
      const item = prevCart.find((i) => i.id === itemId);
      if (item) {
        addToast('info', 'Prenda eliminada del carrito', item.product.name);
      }
      return prevCart.filter((i) => i.id !== itemId);
    });
  };

  const handleClearCart = () => {
    if (cart.length > 0) {
      setCart([]);
      addToast('info', 'Carrito vaciado');
    }
  };

  // --- 🔒 Favorites & Customer Account Actions ---
  const handleToggleFavorite = (product: Product) => {
    const isFav = favorites.includes(product.id);
    if (isFav) {
      setFavorites((prev) => prev.filter((id) => id !== product.id));
      addToast('favorite', 'Prenda retirada de tus favoritos', product.name);
    } else {
      setFavorites((prev) => [...prev, product.id]);
      addToast('favorite', '¡Guardado en tus favoritos!', product.name);
    }
  };

  const handleRemoveFavoriteById = (productId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== productId));
    addToast('favorite', 'Prenda retirada de tus favoritos');
  };

  const handleClearRecentlyViewed = () => {
    clearRecentlyViewed();
    setRecentlyViewedIds([]);
    addToast('info', 'Historial borrado', 'Se eliminaron las prendas vistas recientemente');
  };

  const handleAddAllFavoritesToCart = () => {
    const favProducts = products.filter((p) => favorites.includes(p.id) && p.inStock);
    if (favProducts.length === 0) return;

    favProducts.forEach((p) => {
      handleAddToCart(p, p.sizes?.[0] || 'Única');
    });

    setIsFavoritesOpen(false);
    setIsCartOpen(true);
    addToast('cart', '¡Prendas agregadas al carrito!', `${favProducts.length} producto(s) añadidos`);
  };

  const handleLoginUser = async (user: UserAccount) => {
    setCurrentUser(user);
    if (auth.currentUser) {
      try {
        const cloudAcc = await ensureCustomerAccountInFirestore(auth.currentUser, user, favorites);
        setCurrentUser(cloudAcc);
      } catch (e) {
        console.warn('Sync notice:', e);
      }
    }
    addToast('info', `¡Bienvenida/o, ${user.name}!`, 'Tu cuenta en la plataforma está activa');
  };

  const handleGoogleLogin = async () => {
    const cloudUser = await signInCustomerWithGoogle();
    setCurrentUser(cloudUser);
    addToast('info', `¡Hola ${cloudUser.name}!`, 'Cuenta sincronizada con la base de datos en la nube');
  };

  const handleLogoutUser = async () => {
    try {
      await signOutCustomer();
    } catch (e) {
      console.warn(e);
    }
    setCurrentUser(null);
    addToast('info', 'Sesión cerrada');
  };

  const handleReorderAll = (order: OrderRecord) => {
    order.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId) || {
        id: item.productId,
        name: item.productName,
        price: item.price,
        category: 'Catálogo',
        description: '',
        images: [],
        sizes: item.size ? [item.size] : ['Única'],
        colors: item.color ? [item.color] : ['Original'],
        inStock: true,
        createdAt: Date.now()
      };
      handleAddToCart(prod, item.size, item.color, item.quantity);
    });
    setIsAuthOpen(false);
    setIsCartOpen(true);
    addToast('cart', '¡Prendas agregadas al carrito!', `${order.items.length} producto(s) listos para ordenar de nuevo`);
  };

  // --- 🔔 Order Notification Actions ---
  const handleMarkNotificationRead = (notifId: string) => {
    const updated = markNotificationAsRead(notifId);
    setNotifications(updated);
    markNotificationReadInCloud(notifId).catch(() => {});
  };

  const handleMarkAllNotificationsRead = () => {
    const updated = markAllNotificationsAsRead();
    setNotifications(updated);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    saveNotifications([]);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setNotificationSoundEnabled(next);
    if (next) playNotificationChime();
  };

  // --- 📢 Nicaraguan Business Advertising Actions ---
  const handleSubmitBusinessAd = (newAd: BusinessAd) => {
    setBusinessAds((prev) => [newAd, ...prev]);
    saveBusinessAdToCloud(newAd).catch(() => {});
    addToast(
      'info',
      `¡Anuncio de ${newAd.businessName} publicado!`,
      `${newAd.planName} activo en la plataforma`
    );
  };

  const handleAdClick = (ad: BusinessAd) => {
    const updated = recordAdClickLocal(ad.id);
    setBusinessAds(updated);
  };

  const handleUpdateBusinessAd = (updatedAd: BusinessAd) => {
    setBusinessAds((prev) => prev.map((a) => (a.id === updatedAd.id ? updatedAd : a)));
    saveBusinessAdToCloud(updatedAd).catch(() => {});
    addToast('info', 'Anuncio actualizado', updatedAd.businessName);
  };

  const handleDeleteBusinessAd = (adId: string) => {
    setBusinessAds((prev) => prev.filter((a) => a.id !== adId));
    deleteBusinessAdFromCloud(adId).catch(() => {});
    addToast('info', 'Anuncio eliminado');
  };

  // --- 🛠️ Open Platform Seller & Admin Product Actions ---
  const handleSaveProduct = (product: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.map((p) => (p.id === product.id ? product : p));
      } else {
        return [product, ...prev];
      }
    });
    saveProductToCloud(product).catch(() => {});
    addToast('info', 'Producto publicado en el catálogo', product.name);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
    setFavorites((prev) => prev.filter((id) => id !== productId));
    deleteProductFromCloud(productId).catch(() => {});
    addToast('info', 'Producto eliminado del catálogo');
  };

  const handleResetProducts = () => {
    const defaults = resetProductsToDefault();
    setProducts(defaults);
    addToast('info', 'Catálogo restablecido de fábrica');
  };

  const handleSaveSettings = (newSettings: StoreSettings) => {
    setStoreSettings(newSettings);
    addToast('info', 'Configuración de plataforma guardada');
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    status: OrderRecord['status'],
    paymentStatus?: PaymentStatusType
  ) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              paymentStatus: paymentStatus || o.paymentStatus,
              updatedAt: new Date().toISOString()
            }
          : o
      )
    );

    if (targetOrder) {
      const isPayUpdate = paymentStatus && paymentStatus !== targetOrder.paymentStatus;
      const updatedOrder: OrderRecord = {
        ...targetOrder,
        status,
        paymentStatus: paymentStatus || targetOrder.paymentStatus
      };

      const notif = createOrderNotification(
        updatedOrder,
        isPayUpdate ? 'payment_verified' : 'status_changed',
        'all'
      );

      setNotifications((prev) => [notif, ...prev]);
      updateOrderInCloudByAdmin(
        updatedOrder,
        { status, paymentStatus },
        {
          title: notif.title,
          message: notif.message,
          type: isPayUpdate ? 'pago_actualizado' : 'cambio_estado'
        }
      ).catch(() => {});

      addToast('info', notif.title, notif.message);
    }
  };

  const handleOrderCompleted = (order: OrderRecord) => {
    setOrders((prev) => [order, ...prev]);

    const notif = createOrderNotification(order, 'order_created', 'all');
    setNotifications((prev) => [notif, ...prev]);

    saveOrderToCloud(order).catch(() => {});
    addToast('info', `¡Pedido #${order.id} registrado!`, 'Notificación de pedido activada en tiempo real');
  };

  const handleOpenContact = (product?: Product) => {
    setContactProduct(product || null);
    setIsContactOpen(true);
  };

  // --- Computed Values ---
  const totalCartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const activeHeroAd = useMemo(
    () =>
      businessAds.find(
        (ad) => ad.status === 'activo' && ad.planId === 'vip_patrocinador'
      ) || businessAds.find((ad) => ad.status === 'activo'),
    [businessAds]
  );

  const activeCatalogAds = useMemo(
    () => businessAds.filter((ad) => ad.status === 'activo'),
    [businessAds]
  );

  const availableSellers = useMemo(() => {
    const sellers = new Set<string>(['Todas', storeSettings.storeName]);
    products.forEach((p) => {
      if (p.sellerName) sellers.add(p.sellerName);
    });
    return Array.from(sellers);
  }, [products, storeSettings.storeName]);

  // Filtered & Sorted Products for Display
  const displayedProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'Todas' || product.category === selectedCategory;

      const productSeller = product.sellerName || storeSettings.storeName;
      const matchesSeller =
        selectedSellerFilter === 'Todas' || productSeller === selectedSellerFilter;

      const matchesSearch =
        searchQuery === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.sellerName && product.sellerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStock = showOnlyInStock ? product.inStock : true;

      const matchesCondition =
        conditionFilter === 'all' ||
        (conditionFilter === 'nueva' && product.condition !== 'usada') ||
        (conditionFilter === 'usada' && product.condition === 'usada');

      let matchesPrice = true;
      if (priceRange === '10-50') matchesPrice = product.price >= 10 && product.price <= 50;
      else if (priceRange === '50-100') matchesPrice = product.price > 50 && product.price <= 100;
      else if (priceRange === '100-200') matchesPrice = product.price > 100 && product.price <= 200;
      else if (priceRange === '200-500') matchesPrice = product.price > 200 && product.price <= 500;
      else if (priceRange === '500+') matchesPrice = product.price > 500;

      return (
        matchesCategory &&
        matchesSeller &&
        matchesSearch &&
        matchesStock &&
        matchesCondition &&
        matchesPrice
      );
    });

    if (sortOrder === 'price-asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortOrder === 'name-asc') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result = [...result].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return result;
  }, [
    products,
    selectedCategory,
    selectedSellerFilter,
    storeSettings.storeName,
    searchQuery,
    showOnlyInStock,
    conditionFilter,
    priceRange,
    sortOrder
  ]);

  const favoriteProducts = useMemo(() => {
    return products.filter((p) => favorites.includes(p.id));
  }, [products, favorites]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-800 pb-24 md:pb-0">
      {/* 1. Header with Search, Free Seller Hub, Notifications, Customer Account, Cart & Currency Switcher */}
      <Header
        storeSettings={storeSettings}
        cartCount={totalCartCount}
        cartTotal={cartSubtotal}
        currency={currency}
        onCurrencyChange={setCurrency}
        favoritesCount={favorites.length}
        unreadNotificationsCount={unreadNotificationsCount}
        currentUser={currentUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        products={products}
        categories={PRODUCT_CATEGORIES}
        businessAds={businessAds}
        onSelectProduct={(prod) => {
          setQuickViewProduct(prod);
          setSearchQuery(prod.name);
          document.getElementById('catalogo-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setSearchQuery('');
          document.getElementById('catalogo-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onSelectSeller={(seller) => {
          setSelectedSellerFilter(seller);
          setSearchQuery('');
          document.getElementById('catalogo-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAuth={() => {
          setAuthInitialTab('orders');
          setIsAuthOpen(true);
        }}
        onOpenFreeSellerPortal={() => setIsFreeSellerPortalOpen(true)}
        onOpenEditStore={() => setIsEditStoreModalOpen(true)}
        onOpenMonetization={() => setIsMonetizationHubOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
        todayViews={analyticsData.todayViews}
        onOpenContact={() => handleOpenContact()}
        onOpenExportGitHub={() => setIsGitHubExportOpen(true)}
        onLogout={handleLogoutUser}
      />

      {/* 2. Hero Banner con la Portada Oficial y Acceso Libre a la Plataforma */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#081120] via-[#0C1A30] to-[#0A1629] text-white border-b border-amber-500/20 py-8 sm:py-12">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Brand & Open Platform CTAs */}
            <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap">
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl overflow-hidden shadow-lg shadow-amber-400/25 ring-2 ring-amber-300/80 shrink-0 bg-gradient-to-br from-violet-900 via-purple-900 to-pink-700">
                  <img
                    src="/icon.svg"
                    alt={storeSettings.storeName}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-400/15 border border-emerald-300/30 text-emerald-300 text-xs font-bold shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>🇳🇮 PLATAFORMA ABIERTA Y DE USO LIBRE • COMPRA Y VENDE GRATIS</span>
                </div>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300 tracking-tight leading-[1.1]">
                {storeSettings.storeName}
              </h1>

              <div className="space-y-2">
                <p className="font-serif text-lg sm:text-xl text-amber-200/90 italic font-semibold">
                  &ldquo;Tu mejor elección para los que más amas — abierta para toda Nicaragua&rdquo;
                </p>
                <p className="text-stone-300 text-xs sm:text-sm max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                  Plataforma real y 100% libre para todos los usuarios: compra ropa nueva, ropa usada y peluches, o <strong>abre tu propia tienda gratis</strong> para publicar tus productos y negocios desde tu celular o computadora.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <button
                  onClick={() => {
                    document.getElementById('catalogo-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-stone-950 font-black text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg shadow-amber-500/20 hover:brightness-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-stone-950" />
                  <span>Explorar Catálogo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsFreeSellerPortalOpen(true)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Store className="w-4 h-4 text-stone-950" />
                  <span>Publicar / Vender Gratis</span>
                </button>

                <button
                  onClick={() => setIsAdvertiseModalOpen(true)}
                  className="bg-white/10 hover:bg-white/20 text-amber-200 font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl border border-amber-400/40 backdrop-blur-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Megaphone className="w-4 h-4 text-amber-300" />
                  <span>Anunciar Negocio 🇳🇮</span>
                </button>

                <button
                  onClick={() => setIsPortadaModalOpen(true)}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl border border-white/20 backdrop-blur-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4 text-amber-300" />
                  <span>Ver Portada</span>
                </button>
              </div>
            </div>

            {/* Right Column: Hero Portada Graphic */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-sm sm:max-w-md">
                <div className="p-1.5 sm:p-2 rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 shadow-2xl shadow-amber-500/20">
                  <div
                    onClick={() => setIsPortadaModalOpen(true)}
                    className="relative rounded-2xl overflow-hidden bg-stone-900 group cursor-pointer aspect-square"
                  >
                    <img
                      src={portadaImg}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/portada.jpg';
                      }}
                      alt="Portada Oficial El Clóset de Jié - Peluches y Ropa de Niños"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      referrerPolicy="no-referrer"
                    />

                    <div className="absolute top-3 left-3 bg-stone-950/80 backdrop-blur-md text-amber-300 border border-amber-400/40 text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Plataforma Oficial</span>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent flex flex-col justify-end p-4 sm:p-5 text-white opacity-95 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-serif text-sm sm:text-base font-black text-amber-200 leading-tight">
                            El Clóset de Jié
                          </p>
                          <p className="text-[10px] sm:text-xs text-stone-300 font-medium">
                            Comunidad & Tienda Abierta • Nicaragua
                          </p>
                        </div>
                        <span className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 border border-white/30 shadow-xs transition-colors shrink-0">
                          <Maximize2 className="w-3 h-3" />
                          <span>Ampliar</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Storefront Content */}
      <main id="catalogo-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex-1 w-full">
        {/* Open Platform Free Community Callout Strip */}
        <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-900 to-stone-950 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-500/30">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-400 text-stone-950 flex items-center justify-center shrink-0 shadow-md">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-white">
                  ¿Tienes ropa, calzado, peluches o un negocio en Nicaragua?
                </h2>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-400 text-stone-950">
                  100% Uso Libre y Gratis
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5 max-w-2xl">
                Cualquier usuario puede publicar sus productos en este catálogo o registrar su negocio gratis en el directorio para recibir pedidos directo en su WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
            <button
              onClick={() => setIsFreeSellerPortalOpen(true)}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Subir Producto Gratis</span>
            </button>
            <button
              onClick={() => setIsAdvertiseModalOpen(true)}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Megaphone className="w-4 h-4 text-amber-300" />
              <span>Anunciar Negocio Gratis / VIP</span>
            </button>
          </div>
        </div>

        {/* VIP Sponsored Business Banner (Nicaragua Business Ads) */}
        {activeHeroAd && (
          <SponsoredHeroBanner
            ad={activeHeroAd}
            onAdClick={handleAdClick}
            onOpenAdvertiseModal={() => setIsAdvertiseModalOpen(true)}
          />
        )}

        {/* Google AdSense Top / Catalog Slot */}
        <GoogleAdSenseSlot
          config={storeSettings.adSenseConfig}
          slotType="header"
          onOpenAdvertiseModal={() => setIsAdvertiseModalOpen(true)}
        />

        {/* inDrive Express & Direct Contact Banner */}
        <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-50 via-rose-50/40 to-violet-50/60 border border-amber-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center text-2xl shadow-sm shrink-0">
              🛵
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-stone-900">
                  ¿Quieres entrega inmediata hoy en tu puerta?
                </span>
                <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                  inDrive Express
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-600 mt-0.5 max-w-2xl leading-relaxed">
                Coordinamos el envío directo con motorizado de inDrive hacia tu ubicación en Managua, o envíos departamentales.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              id="btn-banner-open-contact"
              onClick={() => handleOpenContact()}
              className="w-full sm:w-auto px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Dejar Mensaje / Consulta</span>
            </button>
          </div>
        </div>

        {/* Category & Seller Filter Section */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xs sm:text-sm font-black text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-violet-600" />
              <span>Categorías del Catálogo Abierto</span>
            </h2>
            <span className="text-[11px] text-stone-500 font-bold tabular-nums">
              {displayedProducts.length} producto{displayedProducts.length !== 1 ? 's' : ''} disponible{displayedProducts.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {PRODUCT_CATEGORIES.map((category) => (
              <button
                key={category}
                id={`cat-filter-${category}`}
                onClick={() => setSelectedCategory(category)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm ring-2 ring-violet-300'
                    : 'bg-white text-stone-700 hover:text-stone-950 border border-stone-200 hover:border-stone-400'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Carrusel de Testimonios de Clientes (Debajo de Categorías) */}
          <TestimonialCarousel
            testimonials={testimonials}
            currentUser={currentUser}
            onOpenReviewForm={() => {
              setAuthInitialTab('reviews');
              setIsAuthOpen(true);
            }}
            onDeleteTestimonial={handleDeleteTestimonial}
          />

          {/* Secondary Filter Bar */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-xl border border-stone-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setConditionFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    conditionFilter === 'all'
                      ? 'bg-white text-stone-950 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setConditionFilter('nueva')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    conditionFilter === 'nueva'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-emerald-700'
                  }`}
                >
                  <span>✨</span>
                  <span>Nuevas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConditionFilter('usada')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    conditionFilter === 'usada'
                      ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
                      : 'text-stone-600 hover:text-amber-800'
                  }`}
                >
                  <span>♻️</span>
                  <span>Usadas</span>
                </button>
              </div>

              {/* Filter by Seller / Community Store */}
              <div className="flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <select
                  value={selectedSellerFilter}
                  onChange={(e) => setSelectedSellerFilter(e.target.value)}
                  className="bg-stone-100 text-stone-800 text-xs font-bold py-1.5 px-2.5 rounded-lg border border-stone-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {availableSellers.map((seller) => (
                    <option key={seller} value={seller}>
                      {seller === 'Todas' ? 'Todas las Tiendas' : `Tienda: ${seller}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px] mr-1 shrink-0">
                  Precio:
                </span>
                {[
                  { id: 'all', label: 'Todos' },
                  { id: '10-50', label: 'C$ 10 - 50' },
                  { id: '50-100', label: 'C$ 50 - 100' },
                  { id: '100-200', label: 'C$ 100 - 200' },
                  { id: '200-500', label: 'C$ 200 - 500' },
                  { id: '500+', label: 'C$ 500+' }
                ].map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setPriceRange(range.id as PriceRangeType)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                      priceRange === range.id
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
              <label className="flex items-center gap-1.5 cursor-pointer text-stone-700 select-none font-bold text-[11px]">
                <input
                  id="toggle-in-stock-only"
                  type="checkbox"
                  checked={showOnlyInStock}
                  onChange={(e) => setShowOnlyInStock(e.target.checked)}
                  className="w-4 h-4 rounded text-violet-600 border-stone-300 focus:ring-violet-500 cursor-pointer"
                />
                <span>Solo en Stock</span>
              </label>

              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
                <select
                  id="select-sort-order"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrderType)}
                  className="bg-stone-100 text-stone-800 text-xs font-bold py-1.5 px-2.5 rounded-lg border border-stone-200 focus:outline-none focus:border-stone-400 cursor-pointer"
                >
                  <option value="featured">Destacados</option>
                  <option value="price-asc">Precio: Menor a Mayor</option>
                  <option value="price-desc">Precio: Mayor a Menor</option>
                  <option value="name-asc">Nombre: A - Z</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Product Cards Grid + Interleaved Sponsored Nicaraguan Business Ads */}
        {displayedProducts.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8 space-y-4 max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                No encontramos productos con esos criterios
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Intenta cambiar el filtro de tienda, rango de precio o categoría.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCategory('Todas');
                setSelectedSellerFilter('Todas');
                setSearchQuery('');
                setPriceRange('all');
                setShowOnlyInStock(false);
              }}
              className="bg-stone-900 text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
            >
              Ver todos los productos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {displayedProducts.map((product, index) => {
              const productCartCount = cart
                .filter((i) => i.product.id === product.id)
                .reduce((sum, i) => sum + i.quantity, 0);

              const sponsoredAdForSlot =
                (index + 1) % 4 === 0 && activeCatalogAds.length > 0
                  ? activeCatalogAds[Math.floor(index / 4) % activeCatalogAds.length]
                  : null;

              return (
                <React.Fragment key={product.id}>
                  <ProductCard
                    product={product}
                    currency={currency}
                    exchangeRate={storeSettings.exchangeRate}
                    cartQuantity={productCartCount}
                    isFavorite={favorites.includes(product.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onAddToCart={(prod, qty, size) => handleAddToCart(prod, size, undefined, qty)}
                    onUpdateCartQuantity={handleUpdateProductCartQuantity}
                    onQuickView={setQuickViewProduct}
                  />
                  {sponsoredAdForSlot && (
                    <SponsoredCatalogCard
                      ad={sponsoredAdForSlot}
                      onAdClick={handleAdClick}
                      onOpenAdvertiseModal={() => setIsAdvertiseModalOpen(true)}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Recently Viewed Products Section */}
        <RecentlyViewedSection
          products={products}
          recentlyViewedIds={recentlyViewedIds}
          currency={currency}
          storeSettings={storeSettings}
          favorites={favorites}
          onQuickView={setQuickViewProduct}
          onAddToCart={(prod, size) => handleAddToCart(prod, size, undefined, 1)}
          onToggleFavorite={handleToggleFavorite}
          onClearHistory={handleClearRecentlyViewed}
        />

        {/* 5. Nicaraguan Sponsored & Free Community Business Directory */}
        <SponsoredBusinessDirectory
          ads={businessAds}
          onAdClick={handleAdClick}
          onOpenAdvertiseModal={() => setIsAdvertiseModalOpen(true)}
        />

        {/* 6. Google AdSense Footer Slot */}
        <div className="mt-8">
          <GoogleAdSenseSlot
            config={storeSettings.adSenseConfig}
            slotType="footer"
            onOpenAdvertiseModal={() => setIsAdvertiseModalOpen(true)}
          />
        </div>

        {/* WhatsApp Direct Assistance Banner */}
        <section className="mt-10 bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-800/40">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs uppercase tracking-widest text-emerald-300 font-bold">
              ¿Dudas con tu compra o quieres ayuda para publicar gratis?
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold">
              Te atendemos en vivo por WhatsApp
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl">
              {storeSettings.whatsappNumber ? (
                <>Escríbenos al <span className="font-bold text-white font-mono">{storeSettings.whatsappNumber}</span> para coordinar entregas rápidas o envíos a toda Nicaragua.</>
              ) : (
                <>Atención directa de la plataforma al <span className="font-bold text-white font-mono">+505 58898311</span> o configura tu tienda para atender clientes directamente.</>
              )}
            </p>
          </div>

          <a
            href={`https://wa.me/${storeSettings.whatsappNumber ? storeSettings.whatsappNumber.replace(/\D/g, '') : '50558898311'}?text=${encodeURIComponent(
              `¡Hola ${storeSettings.storeName}! ✨ Me gustaría recibir asesoría sobre la plataforma de ropa.`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs sm:text-sm px-6 py-3.5 rounded-full shadow-lg flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 fill-stone-950/20" />
            <span>Chatear por WhatsApp</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </section>
      </main>

      {/* 7. Footer */}
      <footer className="bg-stone-900 text-stone-300 py-10 sm:py-12 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-stone-800">
            <div className="space-y-3 md:col-span-2">
              <span className="font-serif text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl overflow-hidden ring-1 ring-white/20 shrink-0 bg-gradient-to-br from-violet-900 via-purple-900 to-pink-700 shadow-xs">
                  <img src="/icon.svg" alt={storeSettings.storeName} className="w-full h-full object-cover" />
                </div>
                <span>{storeSettings.storeName}</span>
                <span className="text-xs bg-emerald-800 text-emerald-100 font-mono px-2 py-0.5 rounded font-bold">
                  Plataforma Abierta 🇳🇮
                </span>
              </span>
              <p className="text-xs text-stone-400 max-w-sm leading-relaxed">
                {storeSettings.tagline}. Plataforma libre y abierta para cualquier tienda de ropa en Nicaragua: compra, vende, administra tus productos y recibe tus ganancias (97%) directamente en tus cuentas bancarias.
              </p>
              {storeSettings.address && (
                <p className="text-xs text-stone-400">📍 {storeSettings.address}</p>
              )}
              <div className="pt-2 text-xs space-y-1">
                {storeSettings.bankAccount ? (
                  <p className="text-stone-300 font-medium">
                    💳 Cuenta de Tienda: <span className="font-mono text-sky-400 font-bold">{storeSettings.bankAccount}</span>
                    {storeSettings.bankAccountHolder && ` (${storeSettings.bankAccountHolder})`}
                  </p>
                ) : (
                  <p className="text-stone-400">
                    💳 Cuentas bancarias configurables por cada tienda de ropa.
                  </p>
                )}
                <p className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1.5 flex-wrap">
                  <span>🛡️ Comisión Plataforma (3%):</span>
                  <span className="font-mono text-white">Billetera +505 58898311</span>
                  <span>•</span>
                  <span className="font-mono text-white">Cuenta LAFISE 134082049</span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Categorías Populares</h4>
              <ul className="text-xs space-y-1.5 text-stone-400">
                {PRODUCT_CATEGORIES.slice(1, 6).map((cat) => (
                  <li key={cat}>
                    <button
                      onClick={() => {
                        setSelectedCategory(cat);
                        window.scrollTo({ top: 350, behavior: 'smooth' });
                      }}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Plataforma Libre</h4>
              <div className="pt-1 space-y-2">
                <button
                  type="button"
                  onClick={() => setIsEditStoreModalOpen(true)}
                  className="text-xs text-emerald-300 hover:text-emerald-200 flex items-center gap-1.5 cursor-pointer font-bold"
                >
                  <Store className="w-3.5 h-3.5 text-emerald-300" />
                  <span>⚙️ Configurar / Editar Mi Tienda</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMonetizationHubOpen(true)}
                  className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1.5 cursor-pointer font-bold"
                >
                  <span className="text-xs">💰</span>
                  <span>Ganancias Dueño (3%) & Planes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFreeSellerPortalOpen(true)}
                  className="text-xs text-stone-300 hover:text-white flex items-center gap-1.5 cursor-pointer font-semibold"
                >
                  <Store className="w-3.5 h-3.5 text-emerald-300" />
                  <span>🏪 Publicar y Vender Gratis</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdvertiseModalOpen(true)}
                  className="text-xs text-stone-300 hover:text-white flex items-center gap-1.5 cursor-pointer font-semibold"
                >
                  <Megaphone className="w-3.5 h-3.5 text-amber-300" />
                  <span>🇳🇮 Anuncia tu Negocio Aquí</span>
                </button>
                <button
                  type="button"
                  id="btn-footer-analytics"
                  onClick={() => setIsAnalyticsModalOpen(true)}
                  className="text-xs text-stone-300 hover:text-white flex items-center gap-1.5 cursor-pointer font-semibold"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
                  <span>📊 Panel de Estadísticas ({analyticsData.todayViews} hoy)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdminOpen(true)}
                  className="text-xs text-stone-400 hover:text-white flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Panel Administrador</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3 border-t border-stone-800/60 mt-4">
            <span>© {new Date().getFullYear()} {storeSettings.storeName}. Plataforma de Uso Libre.</span>

            <button
              id="btn-footer-counter-badge"
              onClick={() => setIsAnalyticsModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-amber-300 text-xs font-semibold transition-colors cursor-pointer group tabular-nums"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>{analyticsData.totalViews.toLocaleString()} visitas • Ver Estadísticas</span>
            </button>

            <span>Hecho para toda la comunidad de Nicaragua</span>
          </div>
        </div>
      </footer>

      {/* 8. Floating Cart Bar */}
      {totalCartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 z-30 max-w-sm sm:w-80 animate-slide-up">
          <button
            id="btn-floating-cart-bar"
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 text-white rounded-2xl p-3.5 shadow-2xl flex items-center justify-between border border-violet-500/50 active:scale-98 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-amber-300" />
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs tabular-nums">
                  {totalCartCount}
                </span>
              </div>
              <span className="text-xs font-black">Ver Mi Carrito ({totalCartCount})</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-amber-300 tabular-nums">
                {formatCurrency(cartSubtotal * 0.8, currency, storeSettings.exchangeRate)}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* 9. Mobile Bottom Navigation Bar */}
      <MobileNav
        activeTab="catalog"
        cartCount={totalCartCount}
        cartTotal={cartSubtotal}
        currency={currency}
        storeSettings={storeSettings}
        favoritesCount={favorites.length}
        unreadNotificationsCount={unreadNotificationsCount}
        currentUser={currentUser}
        onOpenCatalog={() => {
          setSelectedCategory('Todas');
          setSelectedSellerFilter('Todas');
          setSearchQuery('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenFreeSellerPortal={() => setIsFreeSellerPortalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => {
          setAuthInitialTab('orders');
          setIsAuthOpen(true);
        }}
      />

      {/* 10. Slide-over Cart Drawer with Electronic Payment Gateways */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        currency={currency}
        onCurrencyChange={setCurrency}
        storeSettings={storeSettings}
        currentUser={currentUser}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onOrderCompleted={handleOrderCompleted}
      />

      {/* 11. Product Detail Modal */}
      <ProductDetailModal
        product={quickViewProduct}
        currency={currency}
        storeSettings={storeSettings}
        isFavorite={quickViewProduct ? favorites.includes(quickViewProduct.id) : false}
        currentUser={currentUser}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        onToggleFavorite={handleToggleFavorite}
        onPriceAlertSaved={(alert) => {
          addToast(
            'info',
            'Alerta de Precio Activada',
            `Te avisaremos cuando "${alert.productName}" baje a C$ ${alert.targetPrice.toFixed(2)}`
          );
        }}
        onPriceDropTriggered={(notif) => {
          setNotifications((prev) => {
            const next = [notif, ...prev];
            saveNotifications(next);
            return next;
          });
          addToast('info', notif.title, notif.message);
        }}
      />

      {/* 12. Favorites Drawer */}
      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favoriteProducts}
        currency={currency}
        storeSettings={storeSettings}
        onRemoveFavorite={handleRemoveFavoriteById}
        onAddToCart={(prod) => handleAddToCart(prod, prod.sizes?.[0] || 'Única')}
        onAddAllToCart={handleAddAllFavoritesToCart}
      />

      {/* 13. Customer Account & Order History Modal */}
      <QuickAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLogin={handleLoginUser}
        onGoogleLogin={handleGoogleLogin}
        onLogout={handleLogoutUser}
        orders={orders}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        products={products}
        storeSettings={storeSettings}
        currency={currency}
        onAddToCart={handleAddToCart}
        onOpenFavorites={() => {
          setIsAuthOpen(false);
          setIsFavoritesOpen(true);
        }}
        onUpdateUser={(updatedUser) => {
          setCurrentUser(updatedUser);
          saveUser(updatedUser);
          if (auth.currentUser) {
            ensureCustomerAccountInFirestore(auth.currentUser, updatedUser, favorites).catch(() => {});
          }
          addToast('info', 'Perfil Actualizado', 'Tus datos se han guardado correctamente.');
        }}
        onReorderAll={handleReorderAll}
        initialTab={authInitialTab}
        testimonials={testimonials}
        onAddTestimonial={handleAddTestimonial}
        onDeleteTestimonial={handleDeleteTestimonial}
      />

      {/* 14. Open Platform Free Seller Hub Modal */}
      <FreeSellerPortalModal
        isOpen={isFreeSellerPortalOpen}
        onClose={() => setIsFreeSellerPortalOpen(false)}
        products={products}
        currentUser={currentUser}
        currency={currency}
        storeSettings={storeSettings}
        isCloudConnected={isCloudConnected}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
        onGoogleLogin={handleGoogleLogin}
        onUpdateUser={(updatedUser) => {
          setCurrentUser(updatedUser);
          saveUser(updatedUser);
        }}
        onFilterBySeller={(sellerName) => {
          setSelectedSellerFilter(sellerName);
          document.getElementById('catalogo-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 14b. Edit Clothing Store Modal (Multi-vendor Setup) */}
      <EditStoreModal
        isOpen={isEditStoreModalOpen}
        onClose={() => setIsEditStoreModalOpen(false)}
        storeSettings={storeSettings}
        currentUser={currentUser}
        onSaveSettings={handleSaveSettings}
        onUpdateUser={(updatedUser) => {
          setCurrentUser(updatedUser);
          saveUser(updatedUser);
        }}
      />

      {/* 14c. Platform Monetization & Owner Earnings Hub (3% Commission, Accounts, Pro/VIP Plans) */}
      <MonetizationHubModal
        isOpen={isMonetizationHubOpen}
        onClose={() => setIsMonetizationHubOpen(false)}
        storeSettings={storeSettings}
        currency={currency}
        products={products}
        currentUser={currentUser}
        onUpdateProduct={handleSaveProduct}
        onUpdateUser={(updatedUser) => {
          setCurrentUser(updatedUser);
          saveUser(updatedUser);
        }}
      />

      {/* 15. Real-Time Order Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        orders={orders}
        currentUser={currentUser}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onMarkAsRead={handleMarkNotificationRead}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onClearAll={handleClearNotifications}
        onSelectOrder={() => {
          setIsNotificationsOpen(false);
          setIsAuthOpen(true);
        }}
      />

      {/* 16. Admin & Database Management Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        storeSettings={storeSettings}
        orders={orders}
        customers={currentUser ? [currentUser] : []}
        businessAds={businessAds}
        currency={currency}
        isCloudConnected={isCloudConnected}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
        onResetProducts={handleResetProducts}
        onSaveSettings={handleSaveSettings}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onUpdateBusinessAd={handleUpdateBusinessAd}
        onDeleteBusinessAd={handleDeleteBusinessAd}
        onOpenCreateAdModal={() => setIsAdvertiseModalOpen(true)}
      />

      {/* 17. Nicaraguan Business Advertising Self-Serve Portal Modal */}
      <AdvertiseModal
        isOpen={isAdvertiseModalOpen}
        onClose={() => setIsAdvertiseModalOpen(false)}
        storeSettings={storeSettings}
        currency={currency}
        onSubmitAd={handleSubmitBusinessAd}
      />

      {/* 18. Customer Inquiry Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => {
          setIsContactOpen(false);
          setContactProduct(null);
        }}
        storeSettings={storeSettings}
        product={contactProduct}
        onInquirySaved={() => {
          addToast('info', '¡Mensaje guardado!', 'Te responderemos pronto por WhatsApp.');
        }}
      />

      {/* 19. GitHub Export Modal */}
      <GitHubExportModal
        isOpen={isGitHubExportOpen}
        onClose={() => setIsGitHubExportOpen(false)}
      />

      {/* 20. Commercial & Traffic Statistics Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        analytics={analyticsData}
        orders={orders}
        products={products}
        currency={currency}
        exchangeRate={storeSettings.exchangeRate}
        customersCount={currentUser ? 1 : 0}
        isCloudConnected={isCloudConnected}
        onRefresh={() => setAnalyticsData(getAnalyticsData())}
      />

      {/* 21. Portada Oficial Lightbox Modal */}
      {isPortadaModalOpen && (
        <div
          id="modal-portada-lightbox"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/85 backdrop-blur-md animate-fade-in"
          onClick={() => setIsPortadaModalOpen(false)}
        >
          <div
            className="relative max-w-2xl w-full bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 rounded-3xl overflow-hidden shadow-2xl border border-amber-400/40 p-4 sm:p-6 flex flex-col items-center animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧸</span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-amber-300 font-serif">
                    Portada Oficial • El Clóset de Jié
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Peluches y Ropa de Niños • Plataforma Abierta de Nicaragua
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsPortadaModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full relative rounded-2xl overflow-hidden border border-amber-400/30 bg-black shadow-inner flex justify-center">
              <img
                src={portadaImg}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/portada.jpg';
                }}
                alt="Portada Oficial El Clóset de Jié"
                className="w-full max-h-[65vh] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="w-full mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
              <p className="text-[11px] text-stone-400">
                ✨ Imagen de presentación para promociones, redes y WhatsApp
              </p>

              <div className="flex items-center gap-2">
                <a
                  href="/portada.jpg"
                  download="portada-el-closet-de-jie.jpg"
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  <span>Descargar</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 22. Floating Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* 23. Offline Mode Service Worker Indicator */}
      <OfflineIndicator />
    </div>
  );
}
