import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  Plus,
  Minus,
  ShoppingBag,
  MessageCircle,
  Check,
  ShieldCheck,
  Truck,
  Star,
  ThumbsUp,
  Send,
  Share2,
  Copy,
  Zap,
  Ruler,
  Feather,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Layers,
  Info,
  Bell,
  BellRing,
  TrendingDown,
  Tag,
  AlertCircle,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { CurrencyType, OrderNotification, PriceDropAlert, Product, ProductReview, StoreSettings, UserAccount } from '../types';
import { formatCurrency, getProductReviews, getProductRatingStats, saveReview } from '../utils/storage';
import { getProductPriceAlert, savePriceAlert, removePriceAlert } from '../utils/priceAlerts';
import {
  playNotificationChime,
  requestBrowserNotificationPermission,
  triggerBrowserNotification,
  createPriceDropNotification
} from '../utils/notifications';

interface ProductDetailModalProps {
  product: Product | null;
  currency: CurrencyType;
  storeSettings: StoreSettings;
  isFavorite: boolean;
  currentUser?: UserAccount | null;
  onClose: () => void;
  onAddToCart: (product: Product, size?: string, color?: string, quantity?: number) => void;
  onToggleFavorite: (product: Product) => void;
  onReviewAdded?: (newReview: ProductReview) => void;
  onPriceAlertSaved?: (alert: PriceDropAlert) => void;
  onPriceDropTriggered?: (notif: OrderNotification) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  currency,
  storeSettings,
  isFavorite,
  currentUser,
  onClose,
  onAddToCart,
  onToggleFavorite,
  onReviewAdded,
  onPriceAlertSaved,
  onPriceDropTriggered,
}) => {
  if (!product) return null;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes?.[0] || 'Única');
  const [selectedColor, setSelectedColor] = useState<string>(product.colors?.[0] || 'Original');
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);

  // ⭐ 5-Star Reviews & Rating State
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [reviewerName, setReviewerName] = useState(currentUser?.name || '');
  const [reviewerComment, setReviewerComment] = useState('');
  const [reviewSubmittedSuccess, setReviewSubmittedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  // ⚡ Modo Lectura Rápida (Quick Reading Mode)
  const [quickReadMode, setQuickReadMode] = useState<boolean>(false);

  // 🔔 Price Drop Alert State
  const [existingAlert, setExistingAlert] = useState<PriceDropAlert | null>(null);
  const [showPriceAlertPanel, setShowPriceAlertPanel] = useState<boolean>(false);
  const [targetPriceThreshold, setTargetPriceThreshold] = useState<number>(0);
  const [priceAlertFeedback, setPriceAlertFeedback] = useState<string | null>(null);
  const [priceAlertError, setPriceAlertError] = useState<string | null>(null);

  // 🔍 Image Zoom & Full-Screen Viewer State
  const [isHoverZooming, setIsHoverZooming] = useState<boolean>(false);
  const [zoomOrigin, setZoomOrigin] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isFullScreenViewerOpen, setIsFullScreenViewerOpen] = useState<boolean>(false);
  const [fullscreenZoom, setFullscreenZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (product) {
      setReviews(getProductReviews(product.id));
      setSelectedImageIndex(0);
      setSelectedSize(product.sizes?.[0] || 'Única');
      setSelectedColor(product.colors?.[0] || 'Original');
      setQuantity(1);
      setShowRatingForm(false);
      setReviewSubmittedSuccess(false);
      setReviewerName(currentUser?.name || '');
      setReviewerComment('');
      setActiveTab('details');
      setQuickReadMode(false);

      // Reset image zoom & fullscreen states
      setIsHoverZooming(false);
      setZoomOrigin({ x: 50, y: 50 });
      setIsFullScreenViewerOpen(false);
      setFullscreenZoom(1);
      setPanOffset({ x: 0, y: 0 });
      setIsDragging(false);

      // Check for existing price drop alert for this product
      const currentAlert = getProductPriceAlert(product.id);
      setExistingAlert(currentAlert || null);
      setShowPriceAlertPanel(false);
      setPriceAlertFeedback(null);
      setPriceAlertError(null);
      if (currentAlert) {
        setTargetPriceThreshold(currentAlert.targetPrice);
      } else {
        // Default target: 15% discount
        setTargetPriceThreshold(Math.max(1, Math.round(product.price * 0.85)));
      }
    }
  }, [product?.id, currentUser?.name]);

  const handleSavePriceAlert = (customTarget?: number) => {
    if (!product) return;
    const target = customTarget !== undefined ? customTarget : targetPriceThreshold;

    if (!target || target <= 0) {
      setPriceAlertError('Por favor ingresa un precio objetivo válido.');
      return;
    }
    if (target >= product.price) {
      setPriceAlertError(`El precio objetivo debe ser menor al precio actual (C$ ${product.price.toFixed(2)}).`);
      return;
    }

    setPriceAlertError(null);
    const newAlert: PriceDropAlert = {
      id: existingAlert?.id || `alert_${product.id}_${Date.now()}`,
      productId: product.id,
      productName: product.name,
      productImage: product.images?.[0] || product.image,
      currentPrice: product.price,
      targetPrice: target,
      createdAt: existingAlert?.createdAt || new Date().toISOString(),
      customerUid: currentUser?.uid,
      customerPhone: currentUser?.phone,
      triggered: false
    };

    savePriceAlert(newAlert);
    setExistingAlert(newAlert);
    setTargetPriceThreshold(target);
    setShowPriceAlertPanel(false);
    setPriceAlertFeedback(`¡Alerta guardada! Te avisaremos cuando baje a C$ ${target.toFixed(2)}.`);
    onPriceAlertSaved?.(newAlert);
    requestBrowserNotificationPermission();
    setTimeout(() => setPriceAlertFeedback(null), 4000);
  };

  const handleRemovePriceAlert = () => {
    if (!product) return;
    removePriceAlert(product.id);
    setExistingAlert(null);
    setPriceAlertFeedback('Alerta de precio eliminada.');
    setPriceAlertError(null);
    setTimeout(() => setPriceAlertFeedback(null), 3000);
  };

  const handleTestPriceDropNotification = () => {
    if (!product) return;
    const testTarget = targetPriceThreshold > 0 && targetPriceThreshold < product.price
      ? targetPriceThreshold
      : Math.max(1, Math.round(product.price * 0.85));

    const testNotif = createPriceDropNotification(
      product,
      testTarget,
      currentUser?.uid,
      currentUser?.phone
    );

    playNotificationChime();
    triggerBrowserNotification(testNotif.title, testNotif.message);
    onPriceDropTriggered?.(testNotif);
    setPriceAlertFeedback('🔔 ¡Alerta de prueba enviada con sonido y notificación!');
    setTimeout(() => setPriceAlertFeedback(null), 4500);
  };

  // Especificaciones clave calculadas para lectura rápida
  const getKeySpecs = () => {
    if (!product) return null;
    let materialName = product.material;
    let materialDetail = 'Composición textil duradera y cómoda';

    if (!materialName) {
      const text = `${product.name} ${product.description || ''} ${product.category}`.toLowerCase();
      if (text.includes('algodón') || text.includes('cotton')) {
        materialName = '100% Algodón Peinado';
        materialDetail = 'Hipoalergénico, transpirable y extra suave';
      } else if (text.includes('denim') || text.includes('jean') || text.includes('mezclilla')) {
        materialName = 'Denim Stretch Resistente';
        materialDetail = '98% Algodón, 2% Elastano de alta durabilidad';
      } else if (text.includes('peluche') || text.includes('felpa') || text.includes('oso')) {
        materialName = 'Felpa Suave & Algodón PP';
        materialDetail = 'Relleno hipoalergénico, seguro para niños';
      } else if (text.includes('lino')) {
        materialName = 'Lino Natural de Verano';
        materialDetail = 'Fibra fresca y transpirable para clima cálido';
      } else if (text.includes('chaqueta') || text.includes('abrigo') || text.includes('cortaviento')) {
        materialName = 'Poliéster y Algodón Térmico';
        materialDetail = 'Aislante cortaviento y forro interior suave';
      } else if (text.includes('deportiv') || text.includes('lycra') || text.includes('dry')) {
        materialName = 'Microfibra Dry-Fit Transpirable';
        materialDetail = 'Secado ultra rápido y elasticidad en 4 direcciones';
      } else if (text.includes('niño') || text.includes('bebé') || text.includes('infantil')) {
        materialName = 'Algodón Puro para Bebé/Niño';
        materialDetail = 'Protección hipoalergénica para pieles sensibles';
      } else if (text.includes('cuero') || text.includes('sintético')) {
        materialName = 'Cuero Vegano / Sintético';
        materialDetail = 'Acabado resistente y fácil de limpiar';
      } else {
        materialName = 'Tejido Confort Multiuso';
        materialDetail = 'Mezcla suave lavable a máquina';
      }
    }

    const sizesText = product.sizes && product.sizes.length > 0
      ? product.sizes.join(', ')
      : 'Talla Única';

    const isUsed = product.condition === 'usada';
    const conditionTitle = isUsed ? 'Prenda Usada / Seminueva' : 'Prenda Nueva de Paquete';
    const conditionDetail = isUsed
      ? 'Segunda mano revisada, limpia y garantizada'
      : '100% Nueva a estrenar con etiquetas originales';

    return {
      materialName,
      materialDetail,
      sizesText,
      isUsed,
      conditionTitle,
      conditionDetail
    };
  };

  const keySpecs = getKeySpecs();

  const ratingStats = product ? getProductRatingStats(product.id, reviews) : { average: 5.0, count: 0, breakdown: {} };

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const newReview: ProductReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      customerName: reviewerName.trim() || 'Cliente Satisfecho',
      rating: selectedStars,
      comment: reviewerComment.trim() || '¡Excelente prenda, muy recomendada!',
      verifiedPurchase: true,
      createdAt: new Date().toLocaleDateString('es-NI', { year: 'numeric', month: 'short', day: 'numeric' })
    };

    saveReview(newReview);
    const updated = [newReview, ...reviews];
    setReviews(updated);
    setReviewSubmittedSuccess(true);
    setShowRatingForm(false);
    setReviewerComment('');
    if (onReviewAdded) onReviewAdded(newReview);

    setTimeout(() => {
      setReviewSubmittedSuccess(false);
    }, 4000);
  };

  const images = (product.images && product.images.length > 0)
    ? product.images
    : (product.image ? [product.image] : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80']);

  // ⌨️ Keyboard shortcuts & navigation for Fullscreen Image Lightbox
  useEffect(() => {
    if (!isFullScreenViewerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullScreenViewerOpen(false);
        setFullscreenZoom(1);
        setPanOffset({ x: 0, y: 0 });
      } else if (e.key === 'ArrowLeft') {
        setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        setPanOffset({ x: 0, y: 0 });
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        setPanOffset({ x: 0, y: 0 });
      } else if (e.key === '+' || e.key === '=') {
        setFullscreenZoom((prev) => Math.min(4, Number((prev + 0.5).toFixed(1))));
      } else if (e.key === '-' || e.key === '_') {
        setFullscreenZoom((prev) => {
          const next = Math.max(1, Number((prev - 0.5).toFixed(1)));
          if (next === 1) setPanOffset({ x: 0, y: 0 });
          return next;
        });
      } else if (e.key === '0') {
        setFullscreenZoom(1);
        setPanOffset({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreenViewerOpen, images.length]);

  // 🔍 Hover lens coordinate tracker on main product image
  const handleMainImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomOrigin({ x, y });
  };

  // 🖼️ Fullscreen viewer mouse pan handlers
  const handleFullscreenMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (fullscreenZoom <= 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    });
  };

  const handleFullscreenMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || fullscreenZoom <= 1) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleFullscreenMouseUp = () => {
    setIsDragging(false);
  };

  // 📱 Touch pan gestures for mobile devices
  const handleFullscreenTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && fullscreenZoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y,
      });
    }
  };

  const handleFullscreenTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || fullscreenZoom <= 1 || e.touches.length !== 1) return;
    setPanOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleFullscreenTouchEnd = () => {
    setIsDragging(false);
  };

  const handleToggleDoubleClickZoom = () => {
    if (fullscreenZoom > 1) {
      setFullscreenZoom(1);
      setPanOffset({ x: 0, y: 0 });
    } else {
      setFullscreenZoom(2.5);
    }
  };

  const handleZoomIn = () => {
    setFullscreenZoom((prev) => Math.min(4, Number((prev + 0.5).toFixed(1))));
  };

  const handleZoomOut = () => {
    setFullscreenZoom((prev) => {
      const next = Math.max(1, Number((prev - 0.5).toFixed(1)));
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setFullscreenZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 20;

  const itemTotal = product.price * quantity;

  const handleAddToCart = () => {
    onAddToCart(product, selectedSize, selectedColor, quantity);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 500);
  };

  const handleDirectWhatsAppInquiry = () => {
    const targetPhone = product.sellerPhone || storeSettings.whatsappNumber;
    const targetStoreName = product.sellerName || storeSettings.storeName;
    let rawNumber = targetPhone.replace(/\D/g, '');
    if (rawNumber.length === 8) {
      rawNumber = `505${rawNumber}`;
    }
    if (!rawNumber) rawNumber = '50558898311';

    const text = encodeURIComponent(
      `¡Hola ${targetStoreName}! ✨ Me interesa este artículo publicado en la plataforma:\n\n` +
      `👗 Producto: ${product.name} ${product.icon || ''}\n` +
      `📏 Talla: ${selectedSize}\n` +
      `🎨 Color: ${selectedColor}\n` +
      `🔢 Cantidad: ${quantity}\n` +
      `💰 Precio: ${formatCurrency(itemTotal, currency, storeSettings.exchangeRate)}\n\n` +
      `¿Lo tienen disponible para entrega? ¡Muchas gracias!`
    );
    window.open(`https://wa.me/${rawNumber}?text=${text}`, '_blank');
  };

  const getProductShareUrl = () => {
    try {
      const origin = window.location.origin || '';
      const pathname = window.location.pathname || '';
      return `${origin}${pathname}?producto=${encodeURIComponent(product.id)}`;
    } catch {
      return `?producto=${encodeURIComponent(product.id)}`;
    }
  };

  const generateShareText = () => {
    const productUrl = getProductShareUrl();
    const formattedPrice = formatCurrency(product.price, currency, storeSettings.exchangeRate);
    const sellerInfo = product.sellerName || storeSettings.storeName;
    const conditionText = product.condition === 'usada' ? 'Ropa Usada (Buen Estado) ♻️' : 'Ropa Nueva ✨';

    let message = `¡Hola! Te comparto esta prenda de *El Clóset de Jié* 🛍️✨\n\n`;
    message += `👗 *${product.name}* ${product.icon || ''}\n`;
    message += `💰 *Precio:* ${formattedPrice}\n`;
    message += `✨ *Estado:* ${conditionText}\n`;
    message += `🏷️ *Categoría:* ${product.category}\n`;
    if (selectedSize && selectedSize !== 'Única') {
      message += `📏 *Talla:* ${selectedSize}\n`;
    }
    if (selectedColor && selectedColor !== 'Original') {
      message += `🎨 *Color:* ${selectedColor}\n`;
    }
    message += `🏪 *Vendido por:* ${sellerInfo}${product.sellerCity ? ` (${product.sellerCity})` : ''}\n`;
    if (product.description) {
      const cleanDesc = product.description.replace(/\s+/g, ' ').trim();
      const snippet = cleanDesc.length > 115 ? `${cleanDesc.substring(0, 112)}...` : cleanDesc;
      message += `📝 "${snippet}"\n`;
    }
    message += `\n🔗 *Ver producto en la tienda:*\n${productUrl}`;
    return message;
  };

  const handleShareOnWhatsApp = () => {
    const message = generateShareText();
    // wa.me without a number opens contact picker in WhatsApp
    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    setShareFeedback(true);
    setTimeout(() => setShareFeedback(false), 3000);
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyProductLink = async () => {
    const productUrl = getProductShareUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(productUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = productUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.warn('Error copying link:', err);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div
        className="relative bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col md:flex-row max-h-[92vh] md:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          id="btn-close-product-modal"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-9 h-9 bg-white/90 hover:bg-white text-stone-700 hover:text-stone-950 rounded-full flex items-center justify-center shadow-md backdrop-blur-xs transition-transform active:scale-95 cursor-pointer"
          title="Cerrar ventana"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gallery / Photos Left Section */}
        <div className="w-full md:w-1/2 bg-stone-50 flex flex-col justify-between p-4 sm:p-6">
          {/* Main High-Res Image Display */}
          <div
            className="group relative aspect-square sm:aspect-[4/5] w-full rounded-2xl overflow-hidden bg-white shadow-inner flex items-center justify-center border border-stone-200 cursor-zoom-in"
            onMouseEnter={() => setIsHoverZooming(true)}
            onMouseLeave={() => setIsHoverZooming(false)}
            onMouseMove={handleMainImageMouseMove}
            onClick={() => setIsFullScreenViewerOpen(true)}
            title="Haz clic para ver en pantalla completa o usa el zoom para examinar la tela"
          >
            <img
              src={images[selectedImageIndex]}
              alt={`${product.name} - Vista ${selectedImageIndex + 1}`}
              className="w-full h-full object-cover object-center pointer-events-none select-none will-change-transform"
              style={{
                transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                transform: isHoverZooming ? 'scale(2.2)' : 'scale(1)',
                transition: isHoverZooming ? 'transform 0.1s ease-out' : 'transform 0.3s ease-out'
              }}
            />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none z-10">
              <span className="bg-rose-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-xs">
                -{discountPercent}% OFF
              </span>
              {product.condition === 'usada' ? (
                <span className="bg-amber-500 text-stone-950 text-xs font-black px-2.5 py-1 rounded-full shadow-xs uppercase tracking-wider flex items-center gap-1">
                  <span>♻️</span> Ropa Usada
                </span>
              ) : (
                <span className="bg-emerald-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-xs uppercase tracking-wider flex items-center gap-1">
                  <span>✨</span> Ropa Nueva
                </span>
              )}
            </div>

            {/* Product Emoji Tag */}
            {product.icon && (
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs rounded-xl px-2.5 py-1 text-2xl shadow-sm z-10 pointer-events-none">
                {product.icon}
              </div>
            )}

            {/* Quick Actions: WhatsApp Share & Favorite in Modal */}
            <div
              className="absolute top-3 right-3 flex items-center gap-1.5 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleShareOnWhatsApp}
                className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-[#25D366] shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
                title="Compartir en WhatsApp con tus contactos"
                aria-label="Compartir en WhatsApp"
              >
                <Share2 className="w-4 h-4 text-emerald-600" />
              </button>
              <button
                type="button"
                onClick={() => onToggleFavorite(product)}
                className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-rose-600 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
                title="Favorito"
                aria-label="Favorito"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>

            {/* Zoom & Fullscreen Action Button */}
            <div
              className="absolute bottom-3 right-3 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                id="btn-open-fullscreen-image"
                onClick={() => setIsFullScreenViewerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/85 hover:bg-stone-950 text-white text-xs font-bold shadow-md backdrop-blur-xs transition-all active:scale-95 cursor-pointer border border-white/20 group/btn"
                title="Abrir visor de tela y costuras en pantalla completa"
              >
                <Maximize2 className="w-3.5 h-3.5 text-amber-300 transition-transform group-hover/btn:scale-110" />
                <span className="hidden sm:inline">Inspeccionar tela</span>
                <span className="sm:hidden">Zoom</span>
              </button>
            </div>

            {/* Prev/Next arrows on main image if multiple images */}
            {images.length > 1 && (
              <div
                className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-stone-800 shadow-md flex items-center justify-center pointer-events-auto transition-transform active:scale-90 cursor-pointer opacity-75 hover:opacity-100 group-hover:opacity-100"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-stone-800 shadow-md flex items-center justify-center pointer-events-auto transition-transform active:scale-90 cursor-pointer opacity-75 hover:opacity-100 group-hover:opacity-100"
                  aria-label="Foto siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedImageIndex(idx);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    selectedImageIndex === idx
                      ? 'border-violet-600 ring-2 ring-violet-200 scale-105'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  title={`Ver foto ${idx + 1}`}
                >
                  <img src={img} alt="Miniatura" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Right Section */}
        <div className="w-full md:w-1/2 p-5 sm:p-7 overflow-y-auto flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[11px] uppercase tracking-widest font-bold text-violet-700">
                  {product.category}
                </span>
                <span className="text-stone-300">•</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  product.condition === 'usada'
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                }`}>
                  {product.condition === 'usada' ? '♻️ Prenda Usada' : '✨ Prenda Nueva'}
                </span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 leading-tight">
                {product.name}
              </h2>
              <p className="text-xs font-semibold text-emerald-800 mt-1">
                Vendido por: <strong>{product.sellerName || storeSettings.storeName}</strong>
                {product.sellerCity ? ` · ${product.sellerCity}` : ' · Nicaragua'}
              </p>
            </div>

            {/* ⭐ Calificación 5 Estrellas Bar */}
            <div className="flex items-center justify-between py-2 px-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(ratingStats.average)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-stone-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-black text-amber-950">
                  {ratingStats.average.toFixed(1)} de 5
                </span>
                <span className="text-[11px] text-amber-800">
                  ({reviews.length} {reviews.length === 1 ? 'opinión' : 'opiniones'})
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('reviews');
                  setShowRatingForm(true);
                }}
                className="text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-200/70 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>⭐ Calificar</span>
              </button>
            </div>

            {/* ⚡ Quick Reading Mode Toggle Bar */}
            <div className="flex items-center justify-between gap-2 p-2.5 bg-gradient-to-r from-amber-50 via-amber-100/50 to-orange-50 rounded-2xl border border-amber-200 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    quickReadMode
                      ? 'bg-amber-500 text-stone-950 shadow-sm ring-2 ring-amber-300'
                      : 'bg-white text-amber-700 border border-amber-300'
                  }`}
                >
                  <Zap className={`w-4 h-4 ${quickReadMode ? 'fill-stone-950 animate-bounce' : ''}`} />
                </div>
                <div>
                  <div className="text-xs font-black text-stone-900 flex items-center gap-1.5 leading-none">
                    <span>Modo Lectura Rápida</span>
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-amber-200 text-amber-950">
                      3 seg
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-600 mt-0.5">
                    Resalta talla, material y condición con iconos simplificados
                  </div>
                </div>
              </div>

              <button
                type="button"
                id="btn-toggle-quick-read"
                onClick={() => {
                  setQuickReadMode(!quickReadMode);
                  if (!quickReadMode) setActiveTab('details');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 shrink-0 ${
                  quickReadMode
                    ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 ring-2 ring-amber-300 shadow-md'
                    : 'bg-stone-900 hover:bg-stone-800 text-white'
                }`}
                title={quickReadMode ? 'Desactivar modo lectura rápida' : 'Activar modo de lectura rápida'}
              >
                <Zap className={`w-3.5 h-3.5 ${quickReadMode ? 'fill-stone-950' : 'text-amber-400'}`} />
                <span>{quickReadMode ? 'Activado' : 'Activar'}</span>
              </button>
            </div>

            {/* Tabs Selector: Prenda vs Opiniones */}
            <div className="flex border-b border-stone-200 gap-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`pb-2 transition-colors cursor-pointer ${
                  activeTab === 'details'
                    ? 'text-violet-700 border-b-2 border-violet-700'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Detalles y Tallas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`pb-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'reviews'
                    ? 'text-violet-700 border-b-2 border-violet-700'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <span>⭐ Opiniones ({reviews.length})</span>
              </button>
            </div>

            {activeTab === 'details' ? (
              <div className="space-y-4">
                {/* Price Row */}
                <div className="flex items-baseline gap-3 pb-2 border-b border-stone-100">
                  <span className="text-2xl sm:text-3xl font-black text-stone-900">
                    {formatCurrency(product.price, currency, storeSettings.exchangeRate)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm text-stone-400 line-through">
                      {formatCurrency(product.originalPrice, currency, storeSettings.exchangeRate)}
                    </span>
                  )}
                  {currency === 'dolares' && (
                    <span className="text-xs text-stone-500">
                      (C$ {product.price.toFixed(2)})
                    </span>
                  )}
                </div>

                {/* 🔔 Price Drop Alert Component ('Avisarme si baja de precio') */}
                <div className="rounded-2xl border border-violet-100/90 bg-gradient-to-br from-violet-50/70 via-stone-50 to-amber-50/40 p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 ${existingAlert ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-300/50' : 'bg-violet-100 text-violet-700'}`}>
                        {existingAlert ? (
                          <BellRing className="w-4 h-4 text-amber-700 animate-pulse" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-violet-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-stone-900">
                            {existingAlert ? 'Alerta de precio activa' : 'Avisarme si baja de precio'}
                          </span>
                          {existingAlert && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              C$ {existingAlert.targetPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 truncate">
                          {existingAlert
                            ? `Te notificaremos si cae a C$ ${existingAlert.targetPrice.toFixed(2)} (-${Math.round((1 - existingAlert.targetPrice / product.price) * 100)}%)`
                            : 'Recibe una notificación automática si este producto baja'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPriceAlertPanel(!showPriceAlertPanel);
                          setPriceAlertError(null);
                        }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                          existingAlert
                            ? 'bg-stone-200/90 hover:bg-stone-300 text-stone-800'
                            : 'bg-violet-600 hover:bg-violet-700 text-white shadow-xs hover:shadow-sm'
                        }`}
                        title={existingAlert ? 'Modificar umbral de precio' : 'Activar alerta de precio'}
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>{existingAlert ? 'Editar' : 'Avisarme'}</span>
                      </button>

                      {existingAlert && (
                        <button
                          type="button"
                          onClick={handleRemovePriceAlert}
                          className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar alerta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Feedback Message */}
                  {priceAlertFeedback && (
                    <div className="mt-2.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5 animate-fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{priceAlertFeedback}</span>
                    </div>
                  )}

                  {/* Expandable Setup & Threshold Panel */}
                  {showPriceAlertPanel && (
                    <div className="mt-3 pt-3 border-t border-violet-100/90 space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-stone-800">
                          🎯 Elige tu precio deseado:
                        </span>
                        <span className="text-[11px] text-stone-500 font-medium">
                          Precio actual: <strong className="text-stone-800">C$ {product.price.toFixed(2)}</strong>
                        </span>
                      </div>

                      {/* Quick Percentage Presets */}
                      <div>
                        <div className="text-[11px] text-stone-500 mb-1.5 font-medium">Descuentos preestablecidos:</div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { pct: 5, label: '-5%' },
                            { pct: 10, label: '-10%' },
                            { pct: 15, label: '-15%' },
                            { pct: 20, label: '-20%' },
                          ].map((preset) => {
                            const val = Math.max(1, Math.round(product.price * (1 - preset.pct / 100)));
                            const isSelected = targetPriceThreshold === val;
                            return (
                              <button
                                key={preset.pct}
                                type="button"
                                onClick={() => {
                                  setTargetPriceThreshold(val);
                                  setPriceAlertError(null);
                                }}
                                className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center border ${
                                  isSelected
                                    ? 'bg-violet-700 text-white border-violet-700 shadow-xs'
                                    : 'bg-white hover:bg-violet-50 text-stone-700 border-stone-200'
                                }`}
                              >
                                <span>{preset.label}</span>
                                <span className={`text-[10px] ${isSelected ? 'text-violet-200' : 'text-stone-400'}`}>
                                  C$ {val}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Input */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-stone-700 block">
                          O ingresa tu precio objetivo personalizado (C$):
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-stone-400">
                              C$
                            </span>
                            <input
                              type="number"
                              min={1}
                              max={Math.max(1, product.price - 1)}
                              step={1}
                              value={targetPriceThreshold || ''}
                              onChange={(e) => {
                                const parsed = parseFloat(e.target.value);
                                setTargetPriceThreshold(isNaN(parsed) ? 0 : parsed);
                                setPriceAlertError(null);
                              }}
                              placeholder="Ej: 350"
                              className="w-full pl-9 pr-3 py-1.5 text-xs font-bold rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSavePriceAlert()}
                            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>Guardar alerta</span>
                          </button>
                        </div>

                        {/* Savings calculation indicator */}
                        {targetPriceThreshold > 0 && targetPriceThreshold < product.price && (
                          <div className="flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-50/90 px-2.5 py-1 rounded-lg border border-emerald-200/80 font-medium">
                            <span>Ahorro si baja al umbral:</span>
                            <strong className="font-extrabold">
                              C$ {(product.price - targetPriceThreshold).toFixed(2)} (-{Math.round((1 - targetPriceThreshold / product.price) * 100)}%)
                            </strong>
                          </div>
                        )}

                        {priceAlertError && (
                          <div className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{priceAlertError}</span>
                          </div>
                        )}
                      </div>

                      {/* Simulation/Test helper button */}
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                        <span className="text-stone-400">¿Quieres comprobar la alerta ahora?</span>
                        <button
                          type="button"
                          onClick={handleTestPriceDropNotification}
                          className="font-bold text-violet-700 hover:text-violet-900 underline flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Probar sonido y aviso</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ⚡ Especificaciones Clave (Modo Lectura Rápida) vs Descripción Estándar */}
                {quickReadMode ? (
                  <div className="space-y-3 p-3.5 bg-gradient-to-b from-amber-50/70 to-stone-50/80 rounded-2xl border border-amber-200/90 shadow-2xs animate-fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-amber-200/80">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-amber-950">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>Ficha Técnica Resumida</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setQuickReadMode(false)}
                        className="text-[11px] font-bold text-amber-900 hover:text-amber-950 underline cursor-pointer"
                      >
                        Ver texto completo
                      </button>
                    </div>

                    {/* Especificaciones clave con iconos: Talla, Material, Condición */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* TALLA */}
                      <div className="p-3 bg-white rounded-xl border border-violet-200/90 shadow-2xs flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                            <Ruler className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-violet-800">
                            Talla
                          </span>
                        </div>
                        <div className="text-sm font-black text-stone-900">
                          {keySpecs?.sizesText}
                        </div>
                        <div className="text-[10px] text-stone-500 font-semibold mt-1">
                          Horma regular estándar
                        </div>
                      </div>

                      {/* MATERIAL */}
                      <div className="p-3 bg-white rounded-xl border border-emerald-200/90 shadow-2xs flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <Feather className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                            Material
                          </span>
                        </div>
                        <div className="text-xs font-black text-stone-900 leading-snug">
                          {keySpecs?.materialName}
                        </div>
                        <div className="text-[10px] text-emerald-800 font-medium mt-1 line-clamp-1">
                          {keySpecs?.materialDetail}
                        </div>
                      </div>

                      {/* CONDICIÓN */}
                      <div className="p-3 bg-white rounded-xl border border-amber-200/90 shadow-2xs flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            keySpecs?.isUsed ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {keySpecs?.isUsed ? <RefreshCw className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                            Condición
                          </span>
                        </div>
                        <div className="text-xs font-black text-stone-900 leading-snug">
                          {keySpecs?.conditionTitle}
                        </div>
                        <div className="text-[10px] text-stone-500 font-medium mt-1 line-clamp-1">
                          {keySpecs?.conditionDetail}
                        </div>
                      </div>
                    </div>

                    {/* Resumen simplificado en una línea */}
                    <div className="bg-white/80 border border-amber-200/60 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-stone-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="text-xs leading-snug">
                        <strong className="text-stone-900">Idea clave:</strong>{' '}
                        <span>
                          {product.description
                            ? product.description.split('.')[0] + '.'
                            : 'Prenda verificada y recomendada.'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Description */
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      {product.description || 'Prenda de alta calidad para toda la familia en El closet de jie.'}
                    </p>
                  </div>
                )}

                {/* Size Selector */}
                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Talla: <span className="text-violet-900 font-extrabold">{selectedSize}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setSelectedSize(sz)}
                          className={`min-w-[40px] h-9 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            selectedSize === sz
                              ? 'bg-violet-700 text-white border-violet-700 shadow-xs'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selector */}
                {product.colors && product.colors.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Color: <span className="text-violet-900 font-extrabold">{selectedColor}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                            selectedColor === color
                              ? 'bg-violet-50 text-violet-900 border-violet-400 font-bold'
                              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Cantidad a pedir
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-stone-300 rounded-xl bg-stone-50 overflow-hidden shadow-2xs">
                      <button
                        id="btn-qty-minus"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center text-stone-700 hover:bg-stone-200 disabled:opacity-40 transition-colors cursor-pointer"
                        aria-label="Menos"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center font-black text-sm text-stone-900">
                        {quantity}
                      </span>
                      <button
                        id="btn-qty-plus"
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
                        aria-label="Más"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-xs text-stone-500">
                      Subtotal: <span className="font-bold text-stone-900">{formatCurrency(itemTotal, currency, storeSettings.exchangeRate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ⭐ Reviews and 5-Star Ratings Section */
              <div className="space-y-4">
                {reviewSubmittedSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>¡Muchas gracias! Tu calificación de {selectedStars} estrellas se guardó correctamente.</span>
                  </div>
                )}

                {/* Top Rating Summary Card */}
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-stone-900">
                        {ratingStats.average.toFixed(1)}
                      </span>
                      <span className="text-xs text-stone-500">de 5.0</span>
                    </div>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= Math.round(ratingStats.average)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-stone-500">
                      Basado en {reviews.length} {reviews.length === 1 ? 'cliente' : 'clientes'}
                    </p>
                  </div>

                  {!showRatingForm && (
                    <button
                      type="button"
                      onClick={() => setShowRatingForm(true)}
                      className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <span>★ Calificar prenda</span>
                    </button>
                  )}
                </div>

                {/* Interactive Rating Form */}
                {showRatingForm && (
                  <form onSubmit={handleRatingSubmit} className="p-4 bg-violet-50/70 border border-violet-200 rounded-2xl space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-violet-950 uppercase tracking-wider">
                        ¿Cuántas estrellas le das a esta prenda?
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowRatingForm(false)}
                        className="text-xs text-stone-400 hover:text-stone-600"
                      >
                        Cancelar
                      </button>
                    </div>

                    {/* 5 Stars Interactive Selector */}
                    <div className="flex flex-col gap-1 items-start">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setSelectedStars(star)}
                            onMouseEnter={() => setHoverStars(star)}
                            onMouseLeave={() => setHoverStars(0)}
                            className="p-1 transition-transform hover:scale-125 active:scale-95 cursor-pointer"
                            aria-label={`${star} estrellas`}
                          >
                            <Star
                              className={`w-7 h-7 transition-colors ${
                                star <= (hoverStars || selectedStars)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-stone-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-amber-900">
                        {selectedStars === 5 && '⭐⭐⭐⭐⭐ ¡Excelente! Me encantó la prenda'}
                        {selectedStars === 4 && '⭐⭐⭐⭐ ¡Muy buena! Buena calidad y tela'}
                        {selectedStars === 3 && '⭐⭐⭐ Buena / Aceptable'}
                        {selectedStars === 2 && '⭐⭐ Regular'}
                        {selectedStars === 1 && '⭐ No me gustó'}
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Tu Nombre
                      </label>
                      <input
                        type="text"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        placeholder="Ej: Sofia Morales"
                        className="w-full px-3 py-2 bg-white border border-violet-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Tu Opinión sobre la prenda o el servicio (Opcional)
                      </label>
                      <textarea
                        rows={2}
                        value={reviewerComment}
                        onChange={(e) => setReviewerComment(e.target.value)}
                        placeholder="Ej: La tela es fresca, la talla perfecta y el envío en Managua fue súper rápido..."
                        className="w-full px-3 py-2 bg-white border border-violet-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-violet-700 hover:bg-violet-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publicar mi Calificación de {selectedStars} Estrellas</span>
                    </button>
                  </form>
                )}

                {/* Customer Reviews List */}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {reviews.length === 0 ? (
                    <div className="text-center py-6 text-stone-400 text-xs">
                      Aún no hay opiniones escritas. ¡Sé la primera persona en darle 5 estrellas a esta prenda!
                    </div>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev.id} className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900">{rev.customerName}</span>
                            {rev.verifiedPurchase && (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" /> Compra Verificada
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-stone-400">{rev.createdAt}</span>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-stone-300'
                              }`}
                            />
                          ))}
                        </div>

                        {rev.comment && (
                          <p className="text-stone-600 text-[11px] leading-relaxed">
                            {rev.comment}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 mt-4 border-t border-stone-100 space-y-2">
            <button
              id="btn-confirm-add-cart"
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-md cursor-pointer ${
                product.inStock
                  ? addedAnimation
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white active:scale-98'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Agregado al Carrito!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Agregar al Carrito • {formatCurrency(itemTotal, currency, storeSettings.exchangeRate)}</span>
                </>
              )}
            </button>

            {/* ⭐ Botón: Compartir en WhatsApp a Contactos */}
            <button
              id="btn-share-whatsapp-item"
              type="button"
              onClick={handleShareOnWhatsApp}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-[#25D366] hover:bg-[#20ba5a] active:bg-[#1caa52] border border-[#1faa51] shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
              title="Enviar link del producto y sus detalles directamente a tus contactos o grupos de WhatsApp"
            >
              <Share2 className="w-4 h-4 text-white" />
              <span>{shareFeedback ? '¡Abriendo WhatsApp para compartir!' : 'Compartir en WhatsApp'}</span>
              <span className="hidden sm:inline text-emerald-100 text-[11px] font-normal">• Enviar a contactos</span>
            </button>

            {/* Fila secundaria: Consultar a la tienda & Copiar Enlace */}
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-direct-whatsapp-item"
                type="button"
                onClick={handleDirectWhatsAppInquiry}
                className="w-full py-2 px-2.5 rounded-xl font-bold text-[11px] text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 flex items-center justify-center gap-1.5 transition-colors active:scale-98 cursor-pointer"
                title="Escribir directamente al vendedor o tienda"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Contactar Tienda</span>
              </button>

              <button
                id="btn-copy-product-link"
                type="button"
                onClick={handleCopyProductLink}
                className={`w-full py-2 px-2.5 rounded-xl font-bold text-[11px] border flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                }`}
                title="Copiar enlace directo de este producto"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">¡Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <span className="truncate">Copiar Enlace</span>
                  </>
                )}
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-stone-500">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-stone-400" />
                <span>Envíos a toda Nicaragua</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                <span>Descuento del 20% aplicado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* 🔍 Full-Screen Image Lightbox & Fabric Inspector */}
    {isFullScreenViewerOpen && (
      <div
        id="modal-fullscreen-image-viewer"
        className="fixed inset-0 z-[100] bg-stone-950/95 backdrop-blur-md flex flex-col justify-between select-none animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar: Title, Fabric info, Zoom controls & Close */}
        <div className="px-4 py-3 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between gap-3 text-white z-20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-violet-600/30 border border-violet-400/40 text-violet-300 flex items-center justify-center shrink-0">
              <ZoomIn className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-white truncate max-w-[200px] sm:max-w-md">
                  {product.name}
                </h3>
                <span className="text-[11px] font-mono tabular-nums text-stone-400">
                  Foto {selectedImageIndex + 1} de {images.length}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-400 truncate">
                <span className="text-amber-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Inspección de tela y acabados
                </span>
                {product.material && (
                  <>
                    <span>·</span>
                    <span className="text-stone-300">{product.material}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Zoom Controls & Close Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center bg-stone-800/90 rounded-xl p-1 border border-stone-700/80">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={fullscreenZoom <= 1}
                className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Alejar (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono tabular-nums font-bold text-amber-300 min-w-[50px] text-center">
                {Math.round(fullscreenZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={fullscreenZoom >= 4}
                className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Acercar (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-stone-700 mx-1" />
              <button
                type="button"
                onClick={handleResetZoom}
                disabled={fullscreenZoom === 1 && panOffset.x === 0 && panOffset.y === 0}
                className="px-2 py-1 rounded-lg text-[11px] font-semibold text-stone-300 hover:text-white hover:bg-stone-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors flex items-center gap-1 cursor-pointer"
                title="Restablecer tamaño (0)"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">100%</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsFullScreenViewerOpen(false);
                setFullscreenZoom(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-1 border border-stone-700"
              title="Cerrar visor (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Central Stage: Image & Left/Right navigation */}
        <div
          className="relative flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-6 select-none"
          onMouseDown={handleFullscreenMouseDown}
          onMouseMove={handleFullscreenMouseMove}
          onMouseUp={handleFullscreenMouseUp}
          onTouchStart={handleFullscreenTouchStart}
          onTouchMove={handleFullscreenTouchMove}
          onTouchEnd={handleFullscreenTouchEnd}
          onDoubleClick={handleToggleDoubleClickZoom}
          style={{
            cursor: fullscreenZoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
          }}
        >
          {/* Prev image button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
                setPanOffset({ x: 0, y: 0 });
              }}
              className="absolute left-3 sm:left-6 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white border border-stone-700 flex items-center justify-center shadow-2xl backdrop-blur-sm transition-transform active:scale-95 cursor-pointer"
              title="Foto anterior (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next image button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
                setPanOffset({ x: 0, y: 0 });
              }}
              className="absolute right-3 sm:right-6 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white border border-stone-700 flex items-center justify-center shadow-2xl backdrop-blur-sm transition-transform active:scale-95 cursor-pointer"
              title="Foto siguiente (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* The Zoomable & Pannable Image */}
          <img
            src={images[selectedImageIndex]}
            alt={`${product.name} - Inspección detallada ${selectedImageIndex + 1}`}
            draggable={false}
            className="max-h-[72vh] max-w-[92vw] sm:max-h-[76vh] object-contain transition-transform duration-150 select-none shadow-2xl rounded-lg will-change-transform"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${fullscreenZoom})`,
              transformOrigin: 'center center'
            }}
          />
        </div>

        {/* Bottom Bar: Thumbnail strip & navigation instructions */}
        <div className="px-4 py-3 bg-stone-900/90 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 z-20 shrink-0">
          {/* Thumbnails */}
          {images.length > 1 ? (
            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedImageIndex(idx);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    selectedImageIndex === idx
                      ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105'
                      : 'border-stone-700 opacity-60 hover:opacity-100'
                  }`}
                  title={`Vista ${idx + 1}`}
                >
                  <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-stone-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fotografía de alta definición</span>
            </div>
          )}

          {/* Interaction Hints */}
          <div className="text-[11px] text-stone-400 flex items-center gap-3 text-center sm:text-right flex-wrap justify-center sm:justify-end">
            <span>💡 <strong>Doble clic</strong> para zoom (250%)</span>
            <span className="hidden md:inline">·</span>
            <span className="hidden md:inline">🖱️ <strong>Arrastra</strong> para inspeccionar costuras</span>
            <span className="hidden lg:inline">·</span>
            <span className="hidden lg:inline">⌨️ Teclas <strong>← / →</strong> para cambiar foto</span>
          </div>
        </div>
      </div>
    )}
  </>
  );
};
