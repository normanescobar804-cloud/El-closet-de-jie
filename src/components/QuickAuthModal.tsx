import React, { useState, useId, useMemo, useEffect } from 'react';
import {
  X,
  User,
  Heart,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Package,
  MapPin,
  Edit3,
  Save,
  LogOut,
  Search,
  Check,
  Bell,
  CreditCard,
  Cloud,
  Star,
  Trash2,
  PenSquare,
  MessageSquareHeart,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import {
  CurrencyType,
  CustomerTestimonial,
  OrderNotification,
  OrderRecord,
  PaymentMethodType,
  Product,
  StoreSettings,
  UserAccount
} from '../types';
import { OrderHistorySection } from './OrderHistorySection';
import { getPaymentMethodLabel } from '../utils/paymentGateways';
import { NICARAGUA_DEPARTMENTS } from '../utils/advertising';
import { exportOrdersToCsv } from '../utils/exportOrdersCsv';

interface QuickAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onLogin: (user: UserAccount) => void;
  onGoogleLogin?: () => Promise<void>;
  onLogout: () => void;
  orders?: OrderRecord[];
  notifications?: OrderNotification[];
  onMarkNotificationRead?: (id: string) => void;
  products?: Product[];
  storeSettings: StoreSettings;
  currency: CurrencyType;
  onAddToCart?: (product: Product, size?: string, color?: string, quantity?: number) => void;
  onOpenFavorites?: () => void;
  onUpdateUser?: (user: UserAccount) => void;
  onReorderAll?: (order: OrderRecord) => void;
  initialTab?: 'orders' | 'notifications' | 'profile' | 'reviews';
  testimonials?: CustomerTestimonial[];
  onAddTestimonial?: (testimonial: CustomerTestimonial) => void;
  onDeleteTestimonial?: (id: string) => void;
}

export const QuickAuthModal: React.FC<QuickAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onGoogleLogin,
  onLogout,
  orders = [],
  notifications = [],
  onMarkNotificationRead,
  products = [],
  storeSettings,
  currency,
  onAddToCart,
  onOpenFavorites,
  onUpdateUser,
  onReorderAll,
  initialTab,
  testimonials = [],
  onAddTestimonial,
  onDeleteTestimonial
}) => {
  const nameInputId = useId();
  const contactInputId = useId();
  const cityInputId = useId();
  const addressInputId = useId();

  // Active Tab when logged in: 'orders' | 'notifications' | 'profile' | 'reviews'
  const [activeTab, setActiveTab] = useState<'orders' | 'notifications' | 'profile' | 'reviews'>('orders');

  // Form states for registration / login
  const [name, setName] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [preferredPayment, setPreferredPayment] = useState<PaymentMethodType>('lafise_transfer');
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Profile Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhoneOrEmail, setEditPhoneOrEmail] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editIndriveRef, setEditIndriveRef] = useState('');
  const [editPreferredPayment, setEditPreferredPayment] = useState<PaymentMethodType>('lafise_transfer');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Guest Order Tracking State
  const [guestLookupQuery, setGuestLookupQuery] = useState('');
  const [guestAuthTab, setGuestAuthTab] = useState<'login' | 'track' | 'review'>('login');
  const [showAllDeviceOrders, setShowAllDeviceOrders] = useState(false);
  const [csvModalSuccess, setCsvModalSuccess] = useState(false);

  // Testimonial & Review Form State
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewName, setReviewName] = useState('');
  const [reviewCity, setReviewCity] = useState('Managua');
  const [reviewGarment, setReviewGarment] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewVerified, setReviewVerified] = useState(true);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Sync state with currentUser & initialTab
  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        if (currentUser?.isLoggedIn) {
          setActiveTab(initialTab);
        } else {
          setGuestAuthTab(initialTab === 'reviews' ? 'review' : 'login');
        }
      }
      setReviewName(currentUser?.name || '');
      setReviewCity(currentUser?.city || currentUser?.department || 'Managua');
      setReviewSuccessMsg('');
      setReviewError('');
    }
  }, [isOpen, initialTab, currentUser]);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhoneOrEmail(currentUser.phoneOrEmail || '');
      setCity(currentUser.city || '');
      setAddress(currentUser.address || '');
      setPreferredPayment(currentUser.preferredPaymentMethod || 'lafise_transfer');

      setEditName(currentUser.name || '');
      setEditPhoneOrEmail(currentUser.phoneOrEmail || '');
      setEditCity(currentUser.city || '');
      setEditAddress(currentUser.address || '');
      setEditIndriveRef(currentUser.indriveReference || '');
      setEditPreferredPayment(currentUser.preferredPaymentMethod || 'lafise_transfer');

      if (!reviewName) {
        setReviewName(currentUser.name || '');
      }
      if (currentUser.city) {
        setReviewCity(currentUser.city);
      }
    }
  }, [currentUser]);

  // Filter orders matching current logged-in user
  const userOrders = useMemo(() => {
    if (!currentUser) return [];

    const normalizedUserPhone = (currentUser.phoneOrEmail || '').replace(/\D/g, '');
    const normalizedUserName = (currentUser.name || '').trim().toLowerCase();

    return orders.filter((order) => {
      if (currentUser.uid && order.customerId && order.customerId === currentUser.uid) {
        return true;
      }
      const normalizedOrderPhone = (order.customerPhone || '').replace(/\D/g, '');
      const normalizedOrderName = (order.customerName || '').trim().toLowerCase();

      const phoneMatch =
        normalizedUserPhone.length >= 6 &&
        normalizedOrderPhone.length >= 6 &&
        (normalizedOrderPhone.includes(normalizedUserPhone) ||
          normalizedUserPhone.includes(normalizedOrderPhone));

      const nameMatch =
        normalizedUserName &&
        (normalizedOrderName === normalizedUserName ||
          normalizedOrderName.includes(normalizedUserName) ||
          normalizedUserName.includes(normalizedOrderName));

      return Boolean(phoneMatch || nameMatch);
    });
  }, [orders, currentUser]);

  const displayedUserOrders = useMemo(() => {
    if (showAllDeviceOrders || (userOrders.length === 0 && orders.length > 0)) {
      return orders;
    }
    return userOrders;
  }, [showAllDeviceOrders, userOrders, orders]);

  const unreadNotifCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Guest tracked orders
  const guestTrackedOrders = useMemo(() => {
    if (!guestLookupQuery.trim()) return [];
    const q = guestLookupQuery.trim().toLowerCase();
    const cleanDigits = guestLookupQuery.replace(/\D/g, '');

    return orders.filter((order) => {
      const matchId = order.id.toLowerCase().includes(q);
      const matchName = order.customerName.toLowerCase().includes(q);
      const matchPhone =
        cleanDigits && order.customerPhone.replace(/\D/g, '').includes(cleanDigits);
      return matchId || matchName || matchPhone;
    });
  }, [orders, guestLookupQuery]);

  if (!isOpen) return null;

  const handleGoogleSignInClick = async () => {
    if (!onGoogleLogin) return;
    setError('');
    setIsGoogleLoading(true);
    try {
      await onGoogleLogin();
      setActiveTab('orders');
    } catch (err) {
      console.error(err);
      setError('No se pudo completar el inicio con Google. Puedes ingresar tus datos directamente abajo.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handle Login / Account creation submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor escribe tu nombre y apellido');
      return;
    }
    if (!phoneOrEmail.trim()) {
      setError('Por favor ingresa tu WhatsApp o Correo');
      return;
    }

    const newUser: UserAccount = {
      name: name.trim(),
      phoneOrEmail: phoneOrEmail.trim(),
      phone: phoneOrEmail.trim(),
      city: city.trim() || 'Managua',
      address: address.trim(),
      preferredPaymentMethod: preferredPayment,
      loyaltyPoints: 50,
      authProvider: 'local',
      isLoggedIn: true,
      loginDate: new Date().toISOString()
    };

    onLogin(newUser);
    setActiveTab('orders');
    setError('');
  };

  const handleQuickDemoLogin = (demoName: string) => {
    const demoUser: UserAccount = {
      name: demoName,
      phoneOrEmail: '88451920',
      phone: '88451920',
      city: 'Managua',
      address: 'Bello Horizonte, de la rotonda 2c al sur',
      preferredPaymentMethod: 'lafise_transfer',
      loyaltyPoints: 120,
      authProvider: 'local',
      isLoggedIn: true,
      loginDate: new Date().toISOString()
    };
    onLogin(demoUser);
    setActiveTab('orders');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editPhoneOrEmail.trim()) return;

    const updated: UserAccount = {
      ...(currentUser || { isLoggedIn: true }),
      name: editName.trim(),
      phoneOrEmail: editPhoneOrEmail.trim(),
      phone: editPhoneOrEmail.trim(),
      city: editCity.trim() || 'Managua',
      address: editAddress.trim(),
      indriveReference: editIndriveRef.trim(),
      preferredPaymentMethod: editPreferredPayment,
      isLoggedIn: true
    };

    if (onUpdateUser) {
      onUpdateUser(updated);
    } else {
      onLogin(updated);
    }

    setIsEditingProfile(false);
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 3000);
  };

  // Submit Customer Testimonial
  const handleSubmitTestimonial = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = (reviewName.trim() || currentUser?.name || '').trim();
    if (!finalName) {
      setReviewError('Por favor ingresa tu nombre para que aparezca en tu reseña.');
      return;
    }
    if (!reviewComment.trim() || reviewComment.trim().length < 8) {
      setReviewError('Por favor escribe un comentario detallando tu experiencia (al menos 8 letras).');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError('');

    const randomBgs = [
      'bg-violet-600',
      'bg-emerald-600',
      'bg-rose-600',
      'bg-amber-600',
      'bg-sky-600',
      'bg-teal-600',
      'bg-indigo-600'
    ];
    const pickedBg = randomBgs[Math.floor(Math.random() * randomBgs.length)];

    const newTestimonial: CustomerTestimonial = {
      id: `testimonio-${Date.now()}`,
      authorId: currentUser?.uid || `local-${Date.now()}`,
      customerName: finalName,
      customerCity: reviewCity.trim() || 'Managua',
      rating: reviewRating,
      comment: reviewComment.trim(),
      verifiedPurchase: reviewVerified || (userOrders && userOrders.length > 0),
      productName: reviewGarment.trim() || (userOrders[0]?.items?.[0]?.product?.name ? `${userOrders[0].items[0].product.name}` : 'Prendas del Catálogo'),
      sellerStoreName: storeSettings.storeName,
      createdAt: 'Justo ahora',
      avatarBg: pickedBg
    };

    if (onAddTestimonial) {
      onAddTestimonial(newTestimonial);
    }

    setTimeout(() => {
      setIsSubmittingReview(false);
      setReviewSuccessMsg('¡Muchas gracias por tu reseña! Tu testimonio ya está visible en el carrusel de la página de inicio.');
      setReviewComment('');
      setReviewGarment('');
    }, 400);
  };

  // User's own testimonials
  const myReviews = useMemo(() => {
    if (!testimonials) return [];
    return testimonials.filter((t) => {
      if (currentUser?.uid && t.authorId === currentUser.uid) return true;
      if (currentUser?.name && t.customerName.toLowerCase() === currentUser.name.toLowerCase()) return true;
      if (reviewName && t.customerName.toLowerCase() === reviewName.toLowerCase()) return true;
      return false;
    });
  }, [testimonials, currentUser, reviewName]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative bg-white w-full ${
          currentUser?.isLoggedIn ? 'max-w-3xl' : 'max-w-md'
        } rounded-3xl overflow-hidden shadow-2xl border border-stone-200 p-4 sm:p-7 max-h-[92vh] flex flex-col transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          id="btn-close-quick-auth"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 flex items-center justify-center transition-colors cursor-pointer"
          title="Cerrar modal"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {currentUser?.isLoggedIn ? (
          /* =======================================================
             LOGGED-IN CUSTOMER ACCOUNT, ORDERS & NOTIFICATIONS VIEW
             ======================================================= */
          <div className="flex flex-col h-full overflow-hidden space-y-4">
            {/* Header: User Avatar & Basic Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 pr-8">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-2xl object-cover border border-stone-200 shadow-xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-stone-900 text-amber-300 flex items-center justify-center text-xl font-black shadow-sm">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 leading-tight">
                      {currentUser.name}
                    </h3>
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <Cloud className="w-3.5 h-3.5" />
                      {currentUser.isCloudSynced ? 'Cuenta Sincronizada en Nube' : 'Cuenta Activa'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 flex items-center gap-2 mt-0.5 flex-wrap">
                    <span>{currentUser.phoneOrEmail}</span>
                    {currentUser.city && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          {currentUser.city}
                        </span>
                      </>
                    )}
                    <span>·</span>
                    <span className="text-stone-700 font-medium">
                      Pago: {getPaymentMethodLabel(currentUser.preferredPaymentMethod)}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-logout-account-header"
                onClick={onLogout}
                className="self-start sm:self-center py-1.5 px-3 rounded-xl border border-stone-200 hover:border-red-200 text-stone-600 hover:text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar sesión</span>
              </button>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="flex items-center gap-1.5 border-b border-stone-200/80 pb-2 overflow-x-auto scrollbar-none">
              <button
                type="button"
                id="tab-user-orders"
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'orders'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Mis Pedidos ({userOrders.length})</span>
              </button>

              <button
                type="button"
                id="tab-user-notifications"
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'notifications'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Notificaciones</span>
                {unreadNotifCount > 0 && (
                  <span className="font-mono tabular-nums text-[11px] text-amber-400 font-black">
                    ({unreadNotifCount})
                  </span>
                )}
              </button>

              <button
                type="button"
                id="tab-user-profile"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'profile'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Datos y Pagos</span>
              </button>

              <button
                type="button"
                id="tab-user-testimonials"
                onClick={() => setActiveTab('reviews')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'reviews'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs font-black'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Mi Testimonio {myReviews.length > 0 ? `(${myReviews.length})` : ''}</span>
              </button>

              {onOpenFavorites && (
                <button
                  type="button"
                  id="tab-user-favorites-link"
                  onClick={() => {
                    onClose();
                    onOpenFavorites();
                  }}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-600 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-auto cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Favoritos</span>
                </button>
              )}
            </div>

            {/* TAB 1: Orders History */}
            {activeTab === 'orders' && (
              <div className="flex-1 overflow-y-auto space-y-4">
                {orders.length > userOrders.length && userOrders.length > 0 && (
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 text-xs text-amber-900 flex items-center justify-between gap-2">
                    <span className="text-[11px]">
                      Mostrando {userOrders.length} pedido(s) de tu cuenta.
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAllDeviceOrders(!showAllDeviceOrders)}
                      className="font-bold underline hover:text-amber-950 text-[11px] cursor-pointer shrink-0"
                    >
                      {showAllDeviceOrders
                        ? 'Solo mis pedidos'
                        : `Ver todos de este equipo (${orders.length})`}
                    </button>
                  </div>
                )}

                {/* Quick Action Header: Export CSV for User Orders */}
                {displayedUserOrders.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-50/80 p-2.5 sm:p-3 rounded-2xl border border-stone-200">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                        <Package className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-stone-800">
                        Historial de Compras ({displayedUserOrders.length})
                      </span>
                    </div>

                    <button
                      type="button"
                      id="btn-export-orders-csv-quickauth"
                      onClick={() => {
                        const res = exportOrdersToCsv(displayedUserOrders, storeSettings, currency);
                        if (res.success) {
                          setCsvModalSuccess(true);
                          setTimeout(() => setCsvModalSuccess(false), 4500);
                        }
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-900 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                      title="Descargar registro de compras en formato CSV compatible con Excel y Hojas de Cálculo"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Exportar historial de pedidos a CSV</span>
                    </button>
                  </div>
                )}

                {csvModalSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center justify-between gap-2 font-medium animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Se descargó tu registro de compras en formato <strong>CSV</strong> (compatible con Excel).</span>
                    </div>
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">Listo</span>
                  </div>
                )}

                <OrderHistorySection
                  orders={displayedUserOrders}
                  products={products}
                  currency={currency}
                  storeSettings={storeSettings}
                  onCloseModal={onClose}
                  onAddToCart={onAddToCart}
                  onReorderAll={onReorderAll}
                />
              </div>
            )}

            {/* TAB 2: Customer Notifications */}
            {activeTab === 'notifications' && (
              <div className="flex-1 overflow-y-auto space-y-3">
                {notifications.length === 0 ? (
                  <div className="py-12 px-4 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 space-y-2">
                    <Bell className="w-7 h-7 text-stone-400 mx-auto" />
                    <h4 className="font-semibold text-sm text-stone-800">
                      Sin notificaciones recientes
                    </h4>
                    <p className="text-xs text-stone-500 max-w-xs mx-auto">
                      Aquí aparecerán los avisos automáticos cuando tu pedido pase a preparación, salga en camino o se verifique tu pago.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.read && onMarkNotificationRead) onMarkNotificationRead(n.id);
                        }}
                        className={`p-3.5 text-xs transition-colors cursor-pointer ${
                          !n.read ? 'bg-amber-50/40' : 'bg-white hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-stone-900">{n.title}</span>
                          <span className="text-[11px] text-stone-400 tabular-nums">
                            {new Date(n.createdAt).toLocaleDateString('es-NI', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-stone-600 mt-1">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Personal Information, Delivery & Payment Preferences */}
            {activeTab === 'profile' && (
              <div className="flex-1 overflow-y-auto space-y-4">
                <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-stone-900">
                        Datos de Cuenta, Entrega y Pago Preferido
                      </h4>
                      <p className="text-xs text-stone-500">
                        Se completan automáticamente al ordenar desde tu computadora o celular.
                      </p>
                    </div>

                    {!isEditingProfile && (
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-stone-500" />
                        <span>Editar</span>
                      </button>
                    )}
                  </div>

                  {profileSaveSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>¡Tus datos y método de pago preferido fueron guardados!</span>
                    </div>
                  )}

                  {isEditingProfile ? (
                    <form onSubmit={handleSaveProfile} className="space-y-3 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                            Nombre Completo
                          </label>
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-violet-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                            WhatsApp / Teléfono
                          </label>
                          <input
                            type="text"
                            required
                            value={editPhoneOrEmail}
                            onChange={(e) => setEditPhoneOrEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-violet-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                            Ciudad / Departamento
                          </label>
                          <input
                            type="text"
                            value={editCity}
                            onChange={(e) => setEditCity(e.target.value)}
                            placeholder="Ej: Managua, Masaya, León..."
                            className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-violet-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                            Método de Pago Preferido
                          </label>
                          <select
                            value={editPreferredPayment}
                            onChange={(e) =>
                              setEditPreferredPayment(e.target.value as PaymentMethodType)
                            }
                            className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-violet-500"
                          >
                            <option value="lafise_transfer">Transferencia Bancaria LAFISE</option>
                            <option value="card_online">Tarjeta Crédito / Débito (En línea)</option>
                            <option value="payment_link">Link de Pago Electrónico</option>
                            <option value="mobile_wallet">Billetera Digital / QR</option>
                            <option value="cash_on_delivery">Pago Contra Entrega</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                          Dirección de Entrega Frecuente
                        </label>
                        <textarea
                          rows={2}
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          placeholder="Ej: Bello Horizonte, de la rotonda 2 cuadras al sur..."
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-violet-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                          Punto de Referencia para inDrive (Opcional)
                        </label>
                        <input
                          type="text"
                          value={editIndriveRef}
                          onChange={(e) => setEditIndriveRef(e.target.value)}
                          placeholder="Ej: Casa portón negro frente al parque..."
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-violet-500"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="flex-1 py-2 px-3 border border-stone-200 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Guardar Cambios</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-2.5 text-xs text-stone-700 divide-y divide-stone-200/60">
                      <div className="flex justify-between py-1.5">
                        <span className="text-stone-500">Nombre de contacto:</span>
                        <span className="font-semibold text-stone-900">{currentUser.name}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-stone-500">WhatsApp / Correo:</span>
                        <span className="font-semibold text-stone-900">{currentUser.phoneOrEmail}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-stone-500">Ciudad:</span>
                        <span className="font-semibold text-stone-900">
                          {currentUser.city || 'Managua'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-stone-500">Dirección guardada:</span>
                        <span className="font-semibold text-stone-900 text-right max-w-[60%]">
                          {currentUser.address || 'Sin dirección guardada'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-stone-500">Método de pago preferido:</span>
                        <span className="font-semibold text-violet-800 flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5" />
                          {getPaymentMethodLabel(currentUser.preferredPaymentMethod)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Testimonial Invitation from Profile */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-100/50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs mt-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-950">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span>¿Te gustó tu experiencia de compra o prendas?</span>
                      </div>
                      <p className="text-[11px] text-stone-600">
                        Deja tu reseña y aparecerá con tu nombre y ciudad en el carrusel de la página de inicio.
                      </p>
                    </div>
                    <button
                      type="button"
                      id="btn-profile-go-to-review"
                      onClick={() => setActiveTab('reviews')}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      <PenSquare className="w-3.5 h-3.5" />
                      <span>Escribir Testimonio</span>
                    </button>
                  </div>
                </div>

                {!currentUser.isCloudSynced && onGoogleLogin && (
                  <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="text-xs">
                      <p className="font-bold text-violet-950">
                        ¿Quieres respaldar tu cuenta en la nube?
                      </p>
                      <p className="text-violet-700 mt-0.5">
                        Vincula tu cuenta con Google para acceder a tus pedidos desde cualquier celular o computadora.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGoogleSignInClick}
                      className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Vincular con Google
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Customer Testimonial & Review Form */}
            {activeTab === 'reviews' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Header intro banner */}
                <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-50 rounded-2xl p-4 sm:p-5 border border-amber-300/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-950 uppercase tracking-wider mb-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>Comparte tu Experiencia con la Ropa y la Plataforma</span>
                    </div>
                    <p className="text-xs text-stone-600 max-w-xl">
                      Tu reseña se publicará directamente en el <strong>carrusel de testimonios de la página principal</strong> para que compradores de toda Nicaragua conozcan la calidad y el servicio.
                    </p>
                  </div>
                  <div className="hidden sm:flex flex-col items-center justify-center px-3.5 py-2 rounded-xl bg-white border border-amber-200 shadow-2xs shrink-0">
                    <span className="text-[10px] text-stone-500 font-bold uppercase">Calificación</span>
                    <span className="font-mono text-base font-black text-amber-600">5.0 ★</span>
                  </div>
                </div>

                {reviewSuccessMsg && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{reviewSuccessMsg}</span>
                  </div>
                )}

                {reviewError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    {reviewError}
                  </div>
                )}

                {/* Review Form */}
                <form onSubmit={handleSubmitTestimonial} className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs space-y-4">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                    <PenSquare className="w-4 h-4 text-amber-600" />
                    <span>Escribir Nuevo Testimonio</span>
                  </h4>

                  {/* Rating Selector */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Puntuación General *
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 bg-stone-50 p-1.5 rounded-xl border border-stone-200">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setReviewRating(star)}
                            className="p-1 rounded-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
                            title={`${star} Estrella${star > 1 ? 's' : ''}`}
                            aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
                          >
                            <Star
                              className={`w-6 h-6 transition-colors ${
                                (hoverRating || reviewRating) >= star
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-stone-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        {reviewRating === 5 && '⭐⭐⭐⭐⭐ ¡Excelente experiencia (5/5)!'}
                        {reviewRating === 4 && '⭐⭐⭐⭐ Muy buena calidad y atención (4/5)'}
                        {reviewRating === 3 && '⭐⭐⭐ Bueno (3/5)'}
                        {reviewRating === 2 && '⭐⭐ Regular (2/5)'}
                        {reviewRating === 1 && '⭐ Mejorable (1/5)'}
                      </span>
                    </div>
                  </div>

                  {/* Name and City */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Tu Nombre Visible *
                      </label>
                      <input
                        type="text"
                        required
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder="Ej: Sofia Morales"
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-amber-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Departamento / Ciudad *
                      </label>
                      <select
                        value={reviewCity}
                        onChange={(e) => setReviewCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-amber-500 font-semibold"
                      >
                        {NICARAGUA_DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Garment or past order item */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      ¿Qué prenda, categoría o tienda compraste? (Opcional)
                    </label>
                    <input
                      type="text"
                      value={reviewGarment}
                      onChange={(e) => setReviewGarment(e.target.value)}
                      placeholder="Ej: Vestidos de Dama, Ropa Infantil, Jeans Denim, Camisetas..."
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-amber-500"
                    />
                    {userOrders.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-stone-400 font-semibold">Tus compras recientes:</span>
                        {userOrders.slice(0, 3).map((o) => {
                          const firstProd = o.items?.[0]?.product?.name;
                          if (!firstProd) return null;
                          return (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => setReviewGarment(firstProd)}
                              className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                            >
                              + {firstProd}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Comment */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-stone-700">
                        Tu Testimonio u Opinión *
                      </label>
                      <span className="text-[10px] text-stone-400">
                        {reviewComment.length} caracteres
                      </span>
                    </div>
                    <textarea
                      required
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Cuéntanos qué te pareció la tela, la talla, la entrega con inDrive/delivery o la atención por WhatsApp..."
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-amber-500 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Verified purchase checkbox */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-950">
                      <input
                        type="checkbox"
                        checked={reviewVerified}
                        onChange={(e) => setReviewVerified(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Marcar como Compra Verificada</span>
                      </span>
                    </label>
                    <span className="text-[10px] text-emerald-800">
                      Distintivo oficial en la tarjeta del carrusel
                    </span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PenSquare className="w-4 h-4 text-amber-100" />
                    <span>{isSubmittingReview ? 'Publicando en el carrusel...' : 'Publicar mi Testimonio en el Carrusel'}</span>
                  </button>
                </form>

                {/* Published Reviews by this user */}
                {myReviews.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Tus Reseñas Publicadas ({myReviews.length})</span>
                    </h4>
                    <div className="space-y-2">
                      {myReviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-0.5">
                                {[...Array(rev.rating)].map((_, i) => (
                                  <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                ))}
                              </div>
                              <span className="font-bold text-stone-900">{rev.customerName}</span>
                              <span className="text-stone-400 text-[11px]">· {rev.createdAt}</span>
                            </div>
                            <p className="text-stone-700 italic">«{rev.comment}»</p>
                            {rev.productName && (
                              <p className="text-[11px] text-stone-500 font-medium">
                                Prenda: {rev.productName}
                              </p>
                            )}
                          </div>
                          {onDeleteTestimonial && (
                            <button
                              type="button"
                              onClick={() => onDeleteTestimonial(rev.id)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                              title="Eliminar reseña"
                              aria-label="Eliminar reseña"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Modal Actions */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Seguir Comprando
              </button>
            </div>
          </div>
        ) : (
          /* =======================================================
             GUEST / LOGOUT VIEW: CREATE ACCOUNT, GOOGLE LOGIN & ORDER TRACKER
             ======================================================= */
          <div>
            {/* Tabs for Guests */}
            <div className="flex items-center gap-2 border-b border-stone-200 pb-2 mb-4 pr-8">
              <button
                type="button"
                onClick={() => setGuestAuthTab('login')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  guestAuthTab === 'login'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                Cuenta de Cliente
              </button>
              <button
                type="button"
                onClick={() => setGuestAuthTab('track')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  guestAuthTab === 'track'
                    ? 'bg-violet-700 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Rastrear Pedido</span>
              </button>
              <button
                type="button"
                id="btn-guest-leave-review"
                onClick={() => setGuestAuthTab('review')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  guestAuthTab === 'review'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs font-black'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Dejar Reseña</span>
              </button>
            </div>

            {guestAuthTab === 'login' ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-serif text-xl font-bold text-stone-900">
                    Crea o Ingresa a tu Cuenta
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Sincroniza tus pedidos, recibe notificaciones de envío y guarda tus datos de pago y entrega.
                  </p>
                </div>

                {/* Google Cloud Sign-In Button */}
                {onGoogleLogin && (
                  <button
                    type="button"
                    id="btn-google-cloud-login"
                    disabled={isGoogleLoading}
                    onClick={handleGoogleSignInClick}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-stone-50 text-stone-900 font-bold text-xs border-2 border-stone-200 hover:border-stone-300 flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer"
                  >
                    <Cloud className="w-4 h-4 text-violet-600" />
                    <span>
                      {isGoogleLoading
                        ? 'Conectando con Google...'
                        : 'Continuar con Google (Sincronización en Nube)'}
                    </span>
                  </button>
                )}

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-stone-200" />
                  <span className="flex-shrink mx-3 text-[11px] text-stone-400 font-medium">
                    o registro directo con tus datos
                  </span>
                  <div className="flex-grow border-t border-stone-200" />
                </div>

                {error && (
                  <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 font-medium">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label
                      htmlFor={nameInputId}
                      className="block text-xs font-semibold text-stone-700 mb-1"
                    >
                      Nombre y Apellido *
                    </label>
                    <input
                      id={nameInputId}
                      type="text"
                      required
                      placeholder="Ej: Carolina Rojas"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-400 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label
                        htmlFor={contactInputId}
                        className="block text-xs font-semibold text-stone-700 mb-1"
                      >
                        WhatsApp o Correo *
                      </label>
                      <input
                        id={contactInputId}
                        type="text"
                        required
                        placeholder="Ej: 88889999 o correo@ejemplo.com"
                        value={phoneOrEmail}
                        onChange={(e) => setPhoneOrEmail(e.target.value)}
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-400 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={cityInputId}
                        className="block text-xs font-semibold text-stone-700 mb-1"
                      >
                        Ciudad / Departamento
                      </label>
                      <input
                        id={cityInputId}
                        type="text"
                        placeholder="Ej: Managua, Masaya..."
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-400 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={addressInputId}
                      className="block text-xs font-semibold text-stone-700 mb-1"
                    >
                      Dirección de Entrega (Opcional)
                    </label>
                    <input
                      id={addressInputId}
                      type="text"
                      placeholder="Ej: Altamira, del BDF 2c al lago..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-400 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Método de Pago Preferido
                    </label>
                    <select
                      value={preferredPayment}
                      onChange={(e) => setPreferredPayment(e.target.value as PaymentMethodType)}
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-400 focus:bg-white"
                    >
                      <option value="lafise_transfer">Transferencia Bancaria LAFISE</option>
                      <option value="card_online">Tarjeta Crédito / Débito (En línea)</option>
                      <option value="payment_link">Link de Pago Electrónico</option>
                      <option value="mobile_wallet">Billetera Digital / QR</option>
                      <option value="cash_on_delivery">Pago Contra Entrega</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    id="btn-submit-quick-login"
                    className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <span>Crear / Ingresar a mi Cuenta</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Fast guest login test */}
                <div className="pt-2 border-t border-stone-100 text-center">
                  <button
                    type="button"
                    id="btn-fast-guest-login"
                    onClick={() => handleQuickDemoLogin('Carolina Rojas')}
                    className="w-full py-2 px-3 rounded-xl border border-dashed border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Acceso Rápido de Prueba (Ver cuenta con pedidos)</span>
                  </button>
                </div>
              </div>
            ) : guestAuthTab === 'track' ? (
              /* GUEST ORDER TRACKER VIEW */
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center mx-auto mb-2">
                    <Package className="w-6 h-6 text-violet-600" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Consultar Estado de Pedido
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Ingresa tu código de pedido (ej:{' '}
                    <span className="font-mono font-bold">JIET-829104</span>) o tu número de WhatsApp.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Escribe el código o tu teléfono..."
                    value={guestLookupQuery}
                    onChange={(e) => setGuestLookupQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-violet-500 font-mono"
                  />
                </div>

                {guestLookupQuery.trim() && (
                  <div>
                    {guestTrackedOrders.length > 0 ? (
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                          Resultados encontrados ({guestTrackedOrders.length})
                        </span>
                        <OrderHistorySection
                          orders={guestTrackedOrders}
                          products={products}
                          currency={currency}
                          storeSettings={storeSettings}
                          onCloseModal={onClose}
                          onAddToCart={onAddToCart}
                          onReorderAll={onReorderAll}
                        />
                      </div>
                    ) : (
                      <div className="p-4 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-center text-xs text-stone-500">
                        No se encontró ningún pedido con ese código o teléfono.
                      </div>
                    )}
                  </div>
                )}

                {!guestLookupQuery.trim() && orders.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                      Pedidos recientes:
                    </span>
                    <div className="space-y-1.5">
                      {orders.slice(0, 3).map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setGuestLookupQuery(o.id)}
                          className="w-full p-2.5 bg-stone-50 hover:bg-stone-100 rounded-xl text-left flex items-center justify-between text-xs border border-stone-100 transition-colors cursor-pointer"
                        >
                          <div>
                            <span className="font-mono font-bold text-stone-900">#{o.id}</span>
                            <span className="text-stone-500 ml-2">({o.customerName})</span>
                          </div>
                          <span className="text-[11px] font-bold text-violet-700">Ver estado →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* GUEST TESTIMONIAL VIEW */
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
                    <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Dejar Testimonio de Cliente
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    ¿Compraste ropa por WhatsApp o inDrive? Comparte tu experiencia con toda la comunidad.
                  </p>
                </div>

                {reviewSuccessMsg && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{reviewSuccessMsg}</span>
                  </div>
                )}

                {reviewError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                    {reviewError}
                  </div>
                )}

                <form onSubmit={handleSubmitTestimonial} className="space-y-3.5 bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Tu Calificación *
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setReviewRating(star)}
                            className="p-1 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                            title={`${star} Estrella${star > 1 ? 's' : ''}`}
                            aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
                          >
                            <Star
                              className={`w-5 h-5 ${
                                (hoverRating || reviewRating) >= star
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-stone-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-[11px] font-bold text-amber-800 ml-1">
                        {reviewRating === 5 && '⭐⭐⭐⭐⭐ ¡Excelente (5/5)!'}
                        {reviewRating === 4 && '⭐⭐⭐⭐ Muy buena (4/5)'}
                        {reviewRating === 3 && '⭐⭐⭐ Regular/Bueno (3/5)'}
                        {reviewRating <= 2 && '⭐ Mejorable'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Tu Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder="Ej: Valeria Rivas"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Ciudad / Departamento *
                      </label>
                      <select
                        value={reviewCity}
                        onChange={(e) => setReviewCity(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500 font-semibold"
                      >
                        {NICARAGUA_DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Prenda comprada o tienda
                    </label>
                    <input
                      type="text"
                      value={reviewGarment}
                      onChange={(e) => setReviewGarment(e.target.value)}
                      placeholder="Ej: Blusas Elegantes, Ropa Infantil, Jeans..."
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Tu Opinión o Testimonio *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Describe qué tal estuvo la atención por WhatsApp, la entrega con inDrive o la calidad de la ropa..."
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PenSquare className="w-4 h-4" />
                    <span>{isSubmittingReview ? 'Publicando...' : 'Publicar Testimonio en el Carrusel'}</span>
                  </button>
                </form>
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-1 text-[10px] text-stone-400">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
              <span>Cuentas protegidas con Firebase Authentication & Firestore</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
