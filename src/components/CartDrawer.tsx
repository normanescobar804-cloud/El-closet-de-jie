import React, { useState, useId, useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  MessageCircle,
  ArrowRight,
  Truck,
  CheckCircle2,
  Star,
  Check,
  CreditCard,
  Copy,
  ShieldCheck,
  Smartphone,
  Link2,
  Banknote
} from 'lucide-react';
import {
  CartItem,
  CurrencyType,
  DeliveryMethod,
  OrderRecord,
  PaymentMethodType,
  ProductReview,
  StoreSettings,
  UserAccount
} from '../types';
import { formatCurrency, saveOrder, saveReview } from '../utils/storage';
import { recordWhatsAppAction } from '../utils/analytics';
import {
  DEFAULT_PAYMENT_GATEWAYS,
  executePaymentGatewayTransaction,
  getPaymentMethodLabel
} from '../utils/paymentGateways';
import {
  calculateEarningsSplit,
  PLATFORM_OWNER_CONFIG,
  savePlatformEarning
} from '../utils/monetization';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  currency: CurrencyType;
  onCurrencyChange: (curr: CurrencyType) => void;
  storeSettings: StoreSettings;
  currentUser: UserAccount | null;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onOrderCompleted?: (order: OrderRecord) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  currency,
  onCurrencyChange,
  storeSettings,
  currentUser,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderCompleted,
}) => {
  const nameInputId = useId();
  const phoneInputId = useId();
  const addressInputId = useId();
  const notesInputId = useId();
  const indriveRefInputId = useId();
  const indriveMapInputId = useId();

  // Customer checkout form
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phoneOrEmail || '');
  const [customerAddress, setCustomerAddress] = useState(currentUser?.address || '');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    storeSettings.indriveEnabled !== false ? 'indrive' : 'departamental'
  );
  const [indriveReference, setIndriveReference] = useState(currentUser?.indriveReference || '');
  const [indriveLocationUrl, setIndriveLocationUrl] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [formError, setFormError] = useState('');

  // Electronic & Traditional Payment Gateway State
  const activeGateways = (storeSettings.paymentGateways || DEFAULT_PAYMENT_GATEWAYS).filter(
    (g) => g.enabled
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>(
    currentUser?.preferredPaymentMethod || 'lafise_transfer'
  );
  const [paymentReferenceInput, setPaymentReferenceInput] = useState('');
  const [cardLast4Input, setCardLast4Input] = useState('');
  const [cardHolderInput, setCardHolderInput] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Sync with currentUser when session changes
  useEffect(() => {
    if (currentUser?.isLoggedIn) {
      if (currentUser.name && !customerName) setCustomerName(currentUser.name);
      if (currentUser.phoneOrEmail && !customerPhone) setCustomerPhone(currentUser.phoneOrEmail);
      if (currentUser.address && !customerAddress) setCustomerAddress(currentUser.address);
      if (currentUser.indriveReference && !indriveReference) {
        setIndriveReference(currentUser.indriveReference);
      }
      if (currentUser.preferredPaymentMethod) {
        setSelectedPaymentMethod(currentUser.preferredPaymentMethod);
      }
    }
  }, [currentUser]);

  // Post-Purchase 5-Star Rating State
  const [completedOrder, setCompletedOrder] = useState<OrderRecord | null>(null);
  const [itemRatings, setItemRatings] = useState<
    Record<string, { stars: number; comment: string; submitted: boolean }>
  >({});

  const handleRatePurchasedItem = (productId: string) => {
    const current = itemRatings[productId];
    if (!current) return;

    const newReview: ProductReview = {
      id: `rev-post-purchase-${Date.now()}-${productId}`,
      productId: productId,
      customerName: customerName.trim() || 'Cliente Verificado',
      rating: current.stars,
      comment:
        current.comment.trim() ||
        `¡Excelente compra en El closet de jie! Calificación: ${current.stars} estrellas.`,
      verifiedPurchase: true,
      createdAt: new Date().toLocaleDateString('es-NI', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    };

    saveReview(newReview);
    setItemRatings((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], submitted: true }
    }));
  };

  const handleCloseAfterCompleted = () => {
    setCompletedOrder(null);
    setItemRatings({});
    setShowCheckoutForm(false);
    onClose();
  };

  if (!isOpen) return null;

  // Automatic Calculations (Base in Córdobas)
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountPercent = storeSettings.discountPercent ?? 20;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

  const isFreeShipping = subtotalAfterDiscount >= (storeSettings.freeShippingThreshold || 450);
  let shipping = 0;
  if (cart.length > 0) {
    if (deliveryMethod === 'pickup') {
      shipping = 0;
    } else if (deliveryMethod === 'indrive') {
      shipping = isFreeShipping ? 0 : storeSettings.indriveEstimatedCost || 70;
    } else {
      shipping = isFreeShipping ? 0 : storeSettings.shippingCost || 120;
    }
  }

  const total = subtotalAfterDiscount + shipping;
  const freeShippingDifference = Math.max(
    0,
    (storeSettings.freeShippingThreshold || 450) - subtotalAfterDiscount
  );
  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotalAfterDiscount / (storeSettings.freeShippingThreshold || 450)) * 100)
  );

  const [copiedStoreAccount, setCopiedStoreAccount] = useState(false);
  const [copiedPlatformLafise, setCopiedPlatformLafise] = useState(false);
  const [copiedPlatformWallet, setCopiedPlatformWallet] = useState(false);

  const handleCopyStoreBankAccount = () => {
    if (!storeSettings.bankAccount) return;
    navigator.clipboard.writeText(storeSettings.bankAccount);
    setCopiedStoreAccount(true);
    setTimeout(() => setCopiedStoreAccount(false), 2500);
  };

  const handleCopyPlatformLafise = () => {
    navigator.clipboard.writeText(PLATFORM_OWNER_CONFIG.lafiseAccount);
    setCopiedPlatformLafise(true);
    setTimeout(() => setCopiedPlatformLafise(false), 2500);
  };

  const handleCopyPlatformWallet = () => {
    navigator.clipboard.writeText(PLATFORM_OWNER_CONFIG.walletPhone);
    setCopiedPlatformWallet(true);
    setTimeout(() => setCopiedPlatformWallet(false), 2500);
  };

  // Process Checkout (Electronic Payment Adapter + Database Order + WhatsApp)
  const handleCheckoutWhatsApp = async () => {
    setFormError('');

    if (cart.length === 0) {
      setFormError('El carrito está vacío. Agrega productos para ordenar.');
      return;
    }

    if (!customerName.trim()) {
      setShowCheckoutForm(true);
      setFormError('Por favor ingresa tu nombre para identificar tu pedido.');
      return;
    }

    if (!customerPhone.trim()) {
      setShowCheckoutForm(true);
      setFormError('Por favor ingresa tu número de WhatsApp para contacto.');
      return;
    }

    if (deliveryMethod === 'indrive' && !customerAddress.trim() && !indriveReference.trim()) {
      setShowCheckoutForm(true);
      setFormError(
        'Para entrega por inDrive, indica tu dirección o un punto de referencia para el conductor.'
      );
      return;
    }

    const orderId = `JIET-${Date.now().toString().slice(-6)}`;
    setIsProcessingPayment(true);

    try {
      // Execute modular payment gateway adapter
      const paymentResult = await executePaymentGatewayTransaction(
        {
          orderId,
          amountInCordobas: total,
          currency,
          exchangeRate: storeSettings.exchangeRate,
          method: selectedPaymentMethod,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          cardLast4: cardLast4Input,
          cardHolder: cardHolderInput || customerName.trim(),
          manualReference: paymentReferenceInput
        },
        activeGateways
      );

      // Format WhatsApp message
      let orderMessage = `*¡Hola ${storeSettings.storeName}!* 🛍️✨\n`;
      orderMessage += `Me gustaría realizar el siguiente pedido (#${orderId}):\n\n`;
      orderMessage += `📋 *PRODUCTOS SELECCIONADOS:*\n`;

      cart.forEach((item, index) => {
        const itemSubtotal = item.product.price * item.quantity;
        const sizeText = item.selectedSize ? ` (Talla: ${item.selectedSize})` : '';
        const colorText = item.selectedColor ? ` [Color: ${item.selectedColor}]` : '';
        orderMessage += `${index + 1}. *${item.product.name}*\n`;
        orderMessage += `   • Cantidad: ${item.quantity}${sizeText}${colorText}\n`;
        orderMessage += `   • Subtotal: ${formatCurrency(itemSubtotal, currency, storeSettings.exchangeRate)}\n`;
      });

      orderMessage += `\n─────────────────────\n`;
      orderMessage += `💵 *Subtotal:* ${formatCurrency(subtotal, currency, storeSettings.exchangeRate)}\n`;
      if (discountAmount > 0) {
        orderMessage += `🏷️ *Descuento (${discountPercent}%):* -${formatCurrency(discountAmount, currency, storeSettings.exchangeRate)}\n`;
      }

      let shippingLabel = '';
      if (deliveryMethod === 'indrive') {
        shippingLabel = isFreeShipping
          ? 'inDrive GRATIS 🎉'
          : `inDrive (${formatCurrency(shipping, currency, storeSettings.exchangeRate)})`;
      } else if (deliveryMethod === 'departamental') {
        shippingLabel = isFreeShipping
          ? 'Departamental GRATIS 🎉'
          : `Departamental (${formatCurrency(shipping, currency, storeSettings.exchangeRate)})`;
      } else {
        shippingLabel = 'Retiro en Tienda (Gratis)';
      }

      orderMessage += `🚚 *Envío:* ${shippingLabel}\n`;
      orderMessage += `⭐ *TOTAL A PAGAR:* ${formatCurrency(total, currency, storeSettings.exchangeRate)}\n`;
      orderMessage += `💳 *MÉTODO DE PAGO:* ${getPaymentMethodLabel(selectedPaymentMethod)}\n`;
      orderMessage += `🧾 *Detalle de Pago:* ${paymentResult.receiptSummary}\n`;
      orderMessage += `─────────────────────\n\n`;

      orderMessage += `📍 *DATOS PARA LA ENTREGA:*\n`;
      orderMessage += `👤 *Cliente:* ${customerName.trim()}\n`;
      orderMessage += `📱 *Teléfono:* ${customerPhone.trim()}\n`;

      if (deliveryMethod === 'indrive') {
        orderMessage += `🛵 *MÉTODO DE ENVÍO:* inDrive Express\n`;
        if (customerAddress.trim()) {
          orderMessage += `🏡 *Dirección:* ${customerAddress.trim()}\n`;
        }
        if (indriveReference.trim()) {
          orderMessage += `🧭 *Referencia:* ${indriveReference.trim()}\n`;
        }
        if (indriveLocationUrl.trim()) {
          orderMessage += `🗺️ *Ubicación GPS:* ${indriveLocationUrl.trim()}\n`;
        }
      } else if (deliveryMethod === 'departamental') {
        orderMessage += `📦 *MÉTODO DE ENVÍO:* Envío Departamental\n`;
        if (customerAddress.trim()) {
          orderMessage += `🏡 *Dirección:* ${customerAddress.trim()}\n`;
        }
      } else {
        orderMessage += `🛍️ *MÉTODO DE ENTREGA:* Retiro en tienda física\n`;
      }

      if (orderNotes.trim()) {
        orderMessage += `📝 *Notas:* ${orderNotes.trim()}\n`;
      }

      // 💰 Desglose Transparente de Ganancias (97% Tienda / 3% Plataforma)
      const { sellerAmount, platformFee } = calculateEarningsSplit(total);
      orderMessage += `\n📊 *DESGLOSE DE LIQUIDACIÓN:*\n`;
      orderMessage += `🏪 Pago a la Tienda de Ropa (97%): ${formatCurrency(sellerAmount, currency, storeSettings.exchangeRate)}\n`;
      orderMessage += `🛡️ Tarifa de Plataforma (3%): ${formatCurrency(platformFee, currency, storeSettings.exchangeRate)}\n`;
      orderMessage += `   • Billetera Móvil App: ${PLATFORM_OWNER_CONFIG.walletPhone}\n`;
      orderMessage += `   • Cuenta LAFISE App: ${PLATFORM_OWNER_CONFIG.lafiseAccount}\n\n`;
      orderMessage += `¿Me confirman disponibilidad y recepción del pedido? ¡Muchas gracias! 🙏`;

      // Save record to order history & cloud database
      const orderRecord: OrderRecord = {
        id: orderId,
        customerId: currentUser?.uid,
        createdAt: new Date().toISOString(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim() || 'Retiro en tienda',
        customerCity: currentUser?.city || 'Managua',
        deliveryMethod,
        indriveReference: indriveReference.trim() || undefined,
        indriveLocationUrl: indriveLocationUrl.trim() || undefined,
        paymentMethod: selectedPaymentMethod,
        paymentStatus: paymentResult.paymentStatus,
        paymentReference: paymentResult.transactionReference,
        notes: orderNotes.trim(),
        items: cart.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          price: i.product.price,
          quantity: i.quantity,
          size: i.selectedSize,
          color: i.selectedColor,
          sellerName: i.product.sellerName || storeSettings.storeName,
          sellerPhone: i.product.sellerPhone || storeSettings.whatsappNumber
        })),
        subtotal,
        discount: discountAmount,
        shipping,
        total,
        currency,
        status: 'pendiente'
      };

      saveOrder(orderRecord);

      // Registrar ganancia del 3% en el panel del dueño de la app
      if (platformFee > 0) {
        savePlatformEarning({
          id: `earn-fee-${Date.now()}`,
          source: 'comision_3_porciento',
          title: `Comisión 3% Venta #${orderId}`,
          amountNIO: platformFee,
          storeOrUserName: cart[0]?.product.sellerName || storeSettings.storeName || 'Tienda Asociada',
          date: 'Hoy',
          status: 'liquidado',
          reference: orderId,
          paymentDestination: 'billetera_movil'
        });
      }

      if (onOrderCompleted) onOrderCompleted(orderRecord);

      const initialRatings: Record<
        string,
        { stars: number; comment: string; submitted: boolean }
      > = {};
      orderRecord.items.forEach((it) => {
        initialRatings[it.productId] = { stars: 5, comment: '', submitted: false };
      });
      setItemRatings(initialRatings);
      setCompletedOrder(orderRecord);
      onClearCart();

      // WhatsApp destination: Target seller's phone, store phone, or platform support (+505 58898311)
      const primarySellerPhone = cart.find((i) => i.product.sellerPhone)?.product.sellerPhone;
      const targetStorePhone = primarySellerPhone || storeSettings.whatsappNumber;
      let rawNumber = (targetStorePhone || '').replace(/\D/g, '');
      if (rawNumber.length === 8) {
        rawNumber = `505${rawNumber}`;
      }
      if (!rawNumber) {
        rawNumber = '50558898311'; // Billetera y WhatsApp de Soporte Oficial de la App
      }

      const whatsappUrl = `https://wa.me/${rawNumber}?text=${encodeURIComponent(orderMessage)}`;
      recordWhatsAppAction();
      window.open(whatsappUrl, '_blank');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col h-full border-l border-stone-200 z-10 animate-slide-left">
        {completedOrder ? (
          /* Post-Purchase 5-Star Rating & Electronic Receipt Confirmation Screen */
          <div className="flex flex-col h-full overflow-hidden bg-stone-50">
            <div className="p-4 sm:p-5 border-b border-stone-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base">
                  ✓
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-stone-900 leading-tight">
                    ¡Pedido #{completedOrder.id} Registrado!
                  </h2>
                  <p className="text-[11px] text-emerald-700 font-semibold">
                    Guardado en Base de Datos y enviado a WhatsApp
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseAfterCompleted}
                className="w-8 h-8 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* Payment & Order Receipt Summary */}
              <div className="p-4 bg-white border border-emerald-200 rounded-2xl text-xs text-stone-700 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Comprobante de Orden
                  </span>
                  <span className="font-mono font-bold text-stone-900 tabular-nums">
                    {formatCurrency(completedOrder.total, currency, storeSettings.exchangeRate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Método de Pago:</span>
                  <span className="font-semibold text-stone-900">
                    {getPaymentMethodLabel(completedOrder.paymentMethod)}
                  </span>
                </div>
                {completedOrder.paymentReference && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Referencia / Transacción:</span>
                    <span className="font-mono font-bold text-violet-800">
                      {completedOrder.paymentReference}
                    </span>
                  </div>
                )}
                <p className="text-[11px] text-stone-500 pt-1">
                  Recibirás notificaciones en tiempo real cuando tu pedido pase a preparación y salga a entrega.
                </p>
              </div>

              {/* 5-Star Rating Prompt Box */}
              <div className="p-4 bg-white border border-amber-200 rounded-2xl shadow-xs space-y-3">
                <div>
                  <h3 className="text-sm font-black text-stone-900 leading-snug">
                    Califica tus prendas adquiridas
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Comparte tu opinión con otros clientes de la tienda:
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  {completedOrder.items.map((item) => {
                    const ratingState = itemRatings[item.productId] || {
                      stars: 5,
                      comment: '',
                      submitted: false
                    };

                    return (
                      <div
                        key={item.productId}
                        className={`p-3.5 rounded-xl border transition-all ${
                          ratingState.submitted
                            ? 'bg-emerald-50/70 border-emerald-200'
                            : 'bg-stone-50 border-stone-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-bold text-xs text-stone-900">{item.productName}</h4>
                            <p className="text-[11px] text-stone-500">
                              {item.size ? `Talla: ${item.size}` : ''}{' '}
                              {item.color ? `· Color: ${item.color}` : ''}
                            </p>
                          </div>
                          <span className="text-xs font-mono font-black text-violet-900 tabular-nums">
                            {formatCurrency(
                              item.price * item.quantity,
                              currency,
                              storeSettings.exchangeRate
                            )}
                          </span>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                disabled={ratingState.submitted}
                                onClick={() => {
                                  setItemRatings((prev) => ({
                                    ...prev,
                                    [item.productId]: {
                                      ...prev[item.productId],
                                      stars: star
                                    }
                                  }));
                                }}
                                className={`p-1 transition-transform ${
                                  ratingState.submitted
                                    ? 'cursor-default'
                                    : 'hover:scale-125 cursor-pointer'
                                }`}
                              >
                                <Star
                                  className={`w-5 h-5 transition-colors ${
                                    star <= ratingState.stars
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-stone-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>

                          {!ratingState.submitted ? (
                            <div className="space-y-2 pt-2">
                              <input
                                type="text"
                                value={ratingState.comment}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setItemRatings((prev) => ({
                                    ...prev,
                                    [item.productId]: {
                                      ...prev[item.productId],
                                      comment: val
                                    }
                                  }));
                                }}
                                placeholder="Escribe tu opinión opcional..."
                                className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-violet-400"
                              />

                              <button
                                type="button"
                                onClick={() => handleRatePurchasedItem(item.productId)}
                                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                              >
                                <Star className="w-3.5 h-3.5 fill-current" />
                                <span>Guardar Calificación ({ratingState.stars} Estrellas)</span>
                              </button>
                            </div>
                          ) : (
                            <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5 pt-1">
                              <Check className="w-4 h-4 text-emerald-600" />
                              <span>¡Calificación publicada!</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-stone-200 shrink-0">
              <button
                onClick={handleCloseAfterCompleted}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Volver al Catálogo y Seguir Comprando
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/80 shrink-0">
              <div>
                <h2 className="font-serif text-lg font-bold text-stone-900 leading-tight">
                  Mi Carrito de Compras
                </h2>
                <p className="text-[11px] text-stone-500 tabular-nums">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)} prenda
                  {cart.reduce((sum, i) => sum + i.quantity, 0) !== 1 ? 's' : ''} seleccionada
                  {cart.reduce((sum, i) => sum + i.quantity, 0) !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    id="btn-clear-cart"
                    onClick={onClearCart}
                    className="text-xs text-stone-400 hover:text-red-600 transition-colors font-semibold px-2 py-1 cursor-pointer"
                  >
                    Vaciar
                  </button>
                )}
                <button
                  id="btn-close-cart-drawer"
                  onClick={onClose}
                  className="w-9 h-9 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-200/70 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Cerrar carrito"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Currency Switcher Toggle */}
            <div className="px-4 py-2 bg-stone-100/70 border-b border-stone-200 flex items-center justify-between gap-2 shrink-0">
              <span className="text-[11px] font-semibold text-stone-600">Moneda de pago:</span>
              <div className="inline-flex rounded-full bg-stone-200/80 p-0.5 border border-stone-300">
                <button
                  id="btn-currency-cordobas"
                  onClick={() => onCurrencyChange('cordobas')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    currency === 'cordobas'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Córdobas (C$)
                </button>
                <button
                  id="btn-currency-dolares"
                  onClick={() => onCurrencyChange('dolares')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    currency === 'dolares'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Dólares ($)
                </button>
              </div>
            </div>

            {/* Free Shipping Progress */}
            {cart.length > 0 && (
              <div className="bg-amber-50 px-4 py-2 border-b border-amber-100 text-xs text-amber-900 shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Truck className="w-3.5 h-3.5 text-amber-700" />
                    <span>
                      {isFreeShipping ? (
                        <span className="text-emerald-800 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ¡Envío GRATIS alcanzado!
                        </span>
                      ) : (
                        <>
                          Faltan{' '}
                          <strong className="text-amber-950 font-bold tabular-nums">
                            {formatCurrency(
                              freeShippingDifference,
                              currency,
                              storeSettings.exchangeRate
                            )}
                          </strong>{' '}
                          para Envío GRATIS
                        </>
                      )}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-800 tabular-nums">
                    {freeShippingProgress}%
                  </span>
                </div>
                <div className="w-full bg-amber-200/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isFreeShipping ? 'bg-emerald-500' : 'bg-amber-600'
                    }`}
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Scrollable Body: Cart Items + Delivery + Electronic Payments */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-violet-50 text-violet-500 flex items-center justify-center text-2xl">
                    🛍️
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">
                      Tu carrito está vacío
                    </h3>
                    <p className="text-xs text-stone-500 max-w-xs mx-auto">
                      Agrega prendas del catálogo de {storeSettings.storeName} para iniciar tu pedido.
                    </p>
                  </div>
                  <button
                    id="btn-empty-cart-explore"
                    onClick={onClose}
                    className="mt-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-6 py-3 rounded-full transition-transform active:scale-95 shadow-md cursor-pointer"
                  >
                    Explorar Catálogo
                  </button>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div className="space-y-2.5">
                    {cart.map((item) => {
                      const itemTotal = item.product.price * item.quantity;
                      return (
                        <div
                          key={item.id}
                          className="flex gap-3 items-center bg-stone-50/70 p-2.5 rounded-xl border border-stone-200/80"
                        >
                          <div className="w-14 h-16 rounded-lg overflow-hidden bg-white shrink-0 border border-stone-200 flex items-center justify-center">
                            {item.product.images && item.product.images[0] ? (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xl">{item.product.icon || '👕'}</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-1">
                              <div>
                                <h4 className="font-bold text-xs text-stone-900 line-clamp-1">
                                  {item.product.name}
                                </h4>
                                {item.selectedSize && item.selectedSize !== 'Única' && (
                                  <span className="text-[10px] text-stone-500 font-medium">
                                    Talla: {item.selectedSize}
                                  </span>
                                )}
                              </div>

                              <button
                                id={`btn-remove-item-${item.id}`}
                                onClick={() => onRemoveItem(item.id)}
                                className="text-stone-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                title="Eliminar producto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden">
                                <button
                                  id={`btn-cart-minus-${item.id}`}
                                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                  className="w-7 h-7 flex items-center justify-center text-stone-700 hover:bg-stone-100 cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-7 text-center text-xs font-mono font-bold text-stone-900 tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  id={`btn-cart-plus-${item.id}`}
                                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                  className="w-7 h-7 flex items-center justify-center text-stone-700 hover:bg-stone-100 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="text-right font-mono font-bold text-xs text-stone-900 tabular-nums">
                                {formatCurrency(itemTotal, currency, storeSettings.exchangeRate)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Step 1: Delivery Details Collapsible */}
                  <div className="border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/70">
                    <button
                      type="button"
                      onClick={() => setShowCheckoutForm(!showCheckoutForm)}
                      className="w-full px-3.5 py-2.5 text-xs font-bold text-stone-900 flex items-center justify-between hover:bg-stone-100 transition-colors cursor-pointer"
                    >
                      <span>
                        1. Datos de Cliente y Envío {customerName ? `(${customerName})` : ''}
                      </span>
                      <span className="text-[11px] text-violet-700 underline font-semibold">
                        {showCheckoutForm ? 'Ocultar' : 'Editar / Completar'}
                      </span>
                    </button>

                    {showCheckoutForm && (
                      <div className="p-3.5 border-t border-stone-200 bg-white space-y-3 text-xs">
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDeliveryMethod('indrive')}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                              deliveryMethod === 'indrive'
                                ? 'bg-amber-50 border-amber-500 font-bold text-stone-950'
                                : 'bg-stone-50 border-stone-200 text-stone-600'
                            }`}
                          >
                            <div className="text-[11px] font-bold">inDrive</div>
                            <div className="text-[10px] text-stone-500 tabular-nums">
                              {isFreeShipping
                                ? 'Gratis'
                                : formatCurrency(
                                    storeSettings.indriveEstimatedCost || 70,
                                    currency,
                                    storeSettings.exchangeRate
                                  )}
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeliveryMethod('departamental')}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                              deliveryMethod === 'departamental'
                                ? 'bg-violet-50 border-violet-500 font-bold text-stone-950'
                                : 'bg-stone-50 border-stone-200 text-stone-600'
                            }`}
                          >
                            <div className="text-[11px] font-bold">Nacional</div>
                            <div className="text-[10px] text-stone-500 tabular-nums">
                              {isFreeShipping
                                ? 'Gratis'
                                : formatCurrency(
                                    storeSettings.shippingCost || 120,
                                    currency,
                                    storeSettings.exchangeRate
                                  )}
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeliveryMethod('pickup')}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                              deliveryMethod === 'pickup'
                                ? 'bg-emerald-50 border-emerald-500 font-bold text-stone-950'
                                : 'bg-stone-50 border-stone-200 text-stone-600'
                            }`}
                          >
                            <div className="text-[11px] font-bold">En Tienda</div>
                            <div className="text-[10px] text-emerald-700">Gratis</div>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label
                              htmlFor={nameInputId}
                              className="block text-[11px] font-bold text-stone-700 mb-0.5"
                            >
                              Nombre y Apellido *
                            </label>
                            <input
                              id={nameInputId}
                              type="text"
                              placeholder="Ej: María José López"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:border-violet-500"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={phoneInputId}
                              className="block text-[11px] font-bold text-stone-700 mb-0.5"
                            >
                              WhatsApp *
                            </label>
                            <input
                              id={phoneInputId}
                              type="tel"
                              placeholder="Ej: 88889999"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:border-violet-500"
                            />
                          </div>
                        </div>

                        {deliveryMethod !== 'pickup' && (
                          <div>
                            <label
                              htmlFor={addressInputId}
                              className="block text-[11px] font-bold text-stone-700 mb-0.5"
                            >
                              Dirección de Entrega *
                            </label>
                            <input
                              id={addressInputId}
                              type="text"
                              placeholder="Barrio, calle o referencia principal..."
                              value={customerAddress}
                              onChange={(e) => setCustomerAddress(e.target.value)}
                              className="w-full px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:border-violet-500"
                            />
                          </div>
                        )}

                        {deliveryMethod === 'indrive' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label
                                htmlFor={indriveRefInputId}
                                className="block text-[10px] font-bold text-stone-700 mb-0.5"
                              >
                                Punto de referencia inDrive
                              </label>
                              <input
                                id={indriveRefInputId}
                                type="text"
                                placeholder="Color de casa, portón..."
                                value={indriveReference}
                                onChange={(e) => setIndriveReference(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={indriveMapInputId}
                                className="block text-[10px] font-bold text-stone-700 mb-0.5"
                              >
                                Link Google Maps (Opcional)
                              </label>
                              <input
                                id={indriveMapInputId}
                                type="url"
                                placeholder="https://maps.google.com/..."
                                value={indriveLocationUrl}
                                onChange={(e) => setIndriveLocationUrl(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900"
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <label
                            htmlFor={notesInputId}
                            className="block text-[11px] font-bold text-stone-700 mb-0.5"
                          >
                            Notas adicionales (Opcional)
                          </label>
                          <input
                            id={notesInputId}
                            type="text"
                            placeholder="Horario preferido de entrega..."
                            value={orderNotes}
                            onChange={(e) => setOrderNotes(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Modular Electronic & Traditional Payment Gateway Selector */}
                  <div className="border border-stone-200 rounded-2xl p-3.5 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-violet-700" />
                        <span>2. Método de Pago Electrónico o Tradicional</span>
                      </span>
                      <span className="text-[10px] text-stone-500">Pasarela Modular</span>
                    </div>

                    {/* Payment Method Tabs */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                      {activeGateways.map((gw) => {
                        const isSelected = selectedPaymentMethod === gw.id;
                        return (
                          <button
                            key={gw.id}
                            type="button"
                            onClick={() => setSelectedPaymentMethod(gw.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                                : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-[11px] leading-tight">
                                {gw.shortLabel}
                              </span>
                              {gw.id === 'card_online' && <CreditCard className="w-3.5 h-3.5 shrink-0" />}
                              {gw.id === 'payment_link' && <Link2 className="w-3.5 h-3.5 shrink-0" />}
                              {gw.id === 'mobile_wallet' && <Smartphone className="w-3.5 h-3.5 shrink-0" />}
                              {gw.id === 'cash_on_delivery' && <Banknote className="w-3.5 h-3.5 shrink-0" />}
                            </div>
                            <span
                              className={`text-[9px] mt-1 ${
                                isSelected ? 'text-amber-300' : 'text-stone-400'
                              }`}
                            >
                              {gw.mode === 'active' ? 'Directo' : 'Digital'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Dynamic Gateway Details Form */}
                    {selectedPaymentMethod === 'lafise_transfer' && (
                      <div className="p-3 bg-sky-50/80 border border-sky-200 rounded-xl space-y-3 text-xs text-sky-950">
                        {/* 1. Datos de la Tienda de Ropa */}
                        <div className="p-2.5 bg-white border border-sky-200 rounded-lg space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-stone-800">
                              🏪 1. Pago a la Tienda (97%):
                            </span>
                            {storeSettings.bankAccount ? (
                              <button
                                type="button"
                                onClick={handleCopyStoreBankAccount}
                                className="inline-flex items-center gap-1 font-mono font-black text-xs bg-sky-50 px-2 py-0.5 rounded border border-sky-300 hover:bg-sky-100 cursor-pointer"
                              >
                                <span>{storeSettings.bankAccount}</span>
                                {copiedStoreAccount ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-sky-600" />
                                )}
                              </button>
                            ) : (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
                                Acordar datos por WhatsApp
                              </span>
                            )}
                          </div>
                          {storeSettings.bankAccountHolder && (
                            <p className="text-[10px] text-stone-500">
                              Titular de tienda: <strong>{storeSettings.bankAccountHolder}</strong>
                            </p>
                          )}
                        </div>

                        {/* 2. Tarifa de Servicio de la App (3%) */}
                        <div className="p-2.5 bg-emerald-50/90 border border-emerald-300 rounded-lg space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-emerald-950">
                              🛡️ 2. Comisión App (3%):
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={handleCopyPlatformLafise}
                                title="Copiar cuenta LAFISE del dueño"
                                className="inline-flex items-center gap-1 font-mono font-bold text-[11px] bg-white px-1.5 py-0.5 rounded border border-emerald-300 hover:bg-emerald-100 cursor-pointer text-emerald-900"
                              >
                                <span>LAFISE 134082049</span>
                                {copiedPlatformLafise ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3 text-emerald-600" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={handleCopyPlatformWallet}
                                title="Copiar Billetera Móvil del dueño"
                                className="inline-flex items-center gap-1 font-mono font-bold text-[11px] bg-white px-1.5 py-0.5 rounded border border-emerald-300 hover:bg-emerald-100 cursor-pointer text-emerald-900"
                              >
                                <span>+505 58898311</span>
                                {copiedPlatformWallet ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3 text-emerald-600" />
                                )}
                              </button>
                            </div>
                          </div>
                          <p className="text-[10px] text-emerald-800">
                            Destinado a la Billetera Móvil o Cuenta LAFISE del dueño de la app.
                          </p>
                        </div>

                        <input
                          type="text"
                          placeholder="Número de comprobante / referencia bancaria (opcional)"
                          value={paymentReferenceInput}
                          onChange={(e) => setPaymentReferenceInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:border-sky-500 font-mono"
                        />
                      </div>
                    )}

                    {selectedPaymentMethod === 'card_online' && (
                      <div className="p-3 bg-violet-50/70 border border-violet-200 rounded-xl space-y-2.5 text-xs">
                        <div className="flex items-center justify-between text-violet-950">
                          <span className="font-bold flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-violet-700" />
                            <span>Pre-Autorización con Tarjeta (Visa / Mastercard)</span>
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Titular en la tarjeta"
                            value={cardHolderInput}
                            onChange={(e) => setCardHolderInput(e.target.value)}
                            className="col-span-2 px-2.5 py-1.5 bg-white border border-violet-200 rounded-lg text-xs text-stone-900 focus:outline-none"
                          />
                          <input
                            type="text"
                            maxLength={4}
                            placeholder="Últimos 4 díg."
                            value={cardLast4Input}
                            onChange={(e) => setCardLast4Input(e.target.value.replace(/\D/g, ''))}
                            className="px-2.5 py-1.5 bg-white border border-violet-200 rounded-lg text-xs text-stone-900 font-mono text-center focus:outline-none"
                          />
                        </div>
                        <p className="text-[10px] text-violet-800">
                          Genera un token electrónico de reserva para tu orden sin almacenar datos sensibles.
                        </p>
                      </div>
                    )}

                    {selectedPaymentMethod === 'payment_link' && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-950">
                        <p className="text-[11px] leading-snug">
                          Recibirás un enlace de pago electrónico seguro (CompraClick / N1CO / PayPal) o ingresa tu código si ya abonaste:
                        </p>
                        <input
                          type="text"
                          placeholder="Código de comprobante (opcional)"
                          value={paymentReferenceInput}
                          onChange={(e) => setPaymentReferenceInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs text-stone-900 font-mono"
                        />
                      </div>
                    )}

                    {selectedPaymentMethod === 'mobile_wallet' && (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-950">
                        <p className="text-[11px] leading-snug">
                          Billetera Digital / QR asociada al número{' '}
                          <span className="font-mono font-bold">+505 8770-2337</span>:
                        </p>
                        <input
                          type="text"
                          placeholder="Referencia de billetera móvil (opcional)"
                          value={paymentReferenceInput}
                          onChange={(e) => setPaymentReferenceInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs text-stone-900 font-mono"
                        />
                      </div>
                    )}

                    {selectedPaymentMethod === 'cash_on_delivery' && (
                      <div className="p-3 bg-stone-100 border border-stone-200 rounded-xl text-xs text-stone-700">
                        Pagarás en efectivo ({formatCurrency(total, currency, storeSettings.exchangeRate)}) al recibir o retirar tus prendas.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Bottom Summary & Checkout CTA */}
            {cart.length > 0 && (
              <div className="p-4 bg-white border-t border-stone-200 shadow-xl space-y-3 shrink-0">
                {formError && (
                  <div className="text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200 font-semibold">
                    {formError}
                  </div>
                )}

                <div className="space-y-1 text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200 tabular-nums">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-bold text-stone-800">
                      {formatCurrency(subtotal, currency, storeSettings.exchangeRate)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Descuento ({discountPercent}%):</span>
                    <span>-{formatCurrency(discountAmount, currency, storeSettings.exchangeRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío ({deliveryMethod}):</span>
                    <span className={isFreeShipping ? 'text-emerald-700 font-bold' : 'font-semibold'}>
                      {isFreeShipping
                        ? 'GRATIS'
                        : formatCurrency(shipping, currency, storeSettings.exchangeRate)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-stone-950 pt-1.5 border-t border-stone-200">
                    <span>TOTAL:</span>
                    <span className="text-violet-900 font-mono font-black">
                      {formatCurrency(total, currency, storeSettings.exchangeRate)}
                    </span>
                  </div>

                  {/* 💰 Desglose Transparente de Fondos */}
                  <div className="pt-2 border-t border-stone-200/90 space-y-1 text-[11px]">
                    <div className="flex justify-between items-center text-stone-700">
                      <span>🏪 A la Tienda de Ropa (97%):</span>
                      <span className="font-bold text-stone-900 font-mono">
                        {formatCurrency(total * 0.97, currency, storeSettings.exchangeRate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                      <span>🛡️ Tarifa Plataforma (3%):</span>
                      <span className="font-bold font-mono">
                        {formatCurrency(total * 0.03, currency, storeSettings.exchangeRate)}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-400 leading-tight">
                      Ganancias app destinadas a Billetera +505 58898311 y LAFISE 134082049.
                    </p>
                  </div>
                </div>

                <button
                  id="btn-checkout-whatsapp"
                  disabled={isProcessingPayment}
                  onClick={handleCheckoutWhatsApp}
                  className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 active:scale-98 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 fill-white/20 shrink-0" />
                  <span>
                    {isProcessingPayment
                      ? 'Procesando transacción y pedido...'
                      : 'Confirmar Pedido y Enviar a WhatsApp'}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-auto shrink-0" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
