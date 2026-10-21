export interface Product {
  id: string;
  authorId?: string;
  name: string;
  price: number; // in Cordobas (C$)
  originalPrice?: number;
  category: string;
  condition?: 'nueva' | 'usada'; // Ropa Nueva o Ropa Usada
  material?: string; // Material o composición de la prenda (algodón, denim, etc.)
  description: string;
  icon?: string;
  images: string[];
  sizes: string[];
  colors?: string[];
  inStock: boolean;
  featured?: boolean;
  isBoosted?: boolean;
  boostDays?: number;
  sellerName?: string;
  sellerPhone?: string;
  sellerCity?: string;
  sellerBank?: string;
  sellerBankAccount?: string;
  sellerBankAccountHolder?: string;
  sellerVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  createdAt: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  verifiedPurchase?: boolean;
  createdAt: string;
}

export interface CustomerTestimonial {
  id: string;
  authorId?: string;
  customerName: string;
  customerCity?: string;
  rating: number; // 1 to 5
  comment: string;
  verifiedPurchase: boolean;
  productName?: string;
  sellerStoreName?: string;
  orderReference?: string;
  createdAt: string;
  avatarBg?: string;
}

export interface CartItem {
  id: string; // product.id + selectedSize + selectedColor
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor?: string;
}

export type CurrencyType = 'NIO' | 'USD' | 'cordobas' | 'dolares' | (string & {});

export type DeliveryMethodType = 'tienda' | 'indrive' | 'departamental';
export type DeliveryMethod = DeliveryMethodType;

/**
 * Electronic & Traditional Payment Methods Architecture
 * Prepared for seamless integration with payment gateways (Stripe, Tilopay, BAC CompraClick, PayPal, QR, etc.)
 */
export type PaymentMethodType =
  | 'transferencia_lafise'
  | 'tarjeta_credito_debito'
  | 'link_pago_electronico'
  | 'billetera_movil_qr'
  | 'efectivo_contra_entrega'
  | 'lafise_transfer'
  | 'card_online'
  | 'payment_link'
  | 'mobile_wallet'
  | 'cash_on_delivery';

export type PaymentStatusType =
  | 'pendiente'
  | 'en_verificacion'
  | 'verificando'
  | 'pagado'
  | 'rechazado'
  | 'reembolsado';

export interface PaymentGatewayConfig {
  id: PaymentMethodType;
  name: string;
  shortName?: string;
  shortLabel?: string;
  description: string;
  icon?: string;
  enabled: boolean;
  isElectronic?: boolean;
  mode?: string;
  badge?: string;
  providerName?: string; // e.g., 'Banco LAFISE', 'Tilopay / Stripe', 'CompraClick BAC', 'PayPal / N1CO'
  accountOrMerchantId?: string;
  accountHolder?: string;
  paymentLinkUrl?: string; // Optional base URL for payment links
  publicKey?: string; // Public key placeholder for future gateway SDKs
  webhookEndpoint?: string;
  testMode?: boolean;
  instructions: string;
  supportedCurrencies: ('NIO' | 'USD' | 'cordobas' | 'dolares')[];
  feePercentage?: number;
  feePercent?: number;
}

export interface PriceRangeFilter {
  id: string;
  label: string;
  min: number;
  max: number | null;
}

/**
 * Nicaraguan Business Advertising & Google AdSense Types
 */
export type AdPlanId = 'comunidad_gratis' | 'basico_semanal' | 'destacado_mensual' | 'vip_patrocinador';

export type AdPlacementType = 'hero_banner' | 'catalog_infeed' | 'directory_featured';

export interface AdPlanConfig {
  id: AdPlanId;
  name: string;
  durationDays: number;
  priceNIO: number;
  priceUSD: number;
  badge: string;
  placement: AdPlacementType;
  features: string[];
  popular?: boolean;
}

export interface BusinessAd {
  id: string;
  authorId?: string;
  businessName: string;
  category: string; // e.g. 'Restaurante y Cafetería', 'Calzado y Moda', 'Belleza y Salón', 'Tecnología', 'Servicios', 'Transporte / Envíos'
  department: string; // e.g. 'Managua', 'León', 'Masaya', 'Chinandega', 'Estelí', 'Matagalpa', 'Granada'
  headline: string;
  description: string;
  promoText?: string; // e.g. '15% de descuento mencionando El Clóset de Jié'
  imageUrl: string;
  whatsappPhone: string;
  websiteOrSocialUrl?: string;
  ctaText: string;
  planId: AdPlanId;
  planName: string;
  pricePaid: number; // in C$
  currency: CurrencyType;
  paymentMethod: PaymentMethodType;
  paymentReference?: string;
  paymentStatus: PaymentStatusType;
  status: 'activo' | 'pendiente_aprobacion' | 'pausado' | 'expirado';
  impressions: number;
  clicks: number;
  ownerName: string;
  ownerEmail?: string;
  createdAt: string;
  expiresAt: string;
}

export interface GoogleAdSenseConfig {
  enabled: boolean;
  publisherId: string; // e.g. 'ca-pub-1234567890123456'
  headerSlotId?: string;
  inFeedSlotId?: string;
  footerSlotId?: string;
  autoAdsEnabled: boolean;
  showFallbackSponsorPrompt: boolean;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  whatsappNumber: string; // Optional default, configured per seller
  whatsappCustomGreeting: string;
  currencySymbol: string;
  currencyCode?: string;
  exchangeRate: number; // 1 USD = X NIO (e.g. 36.80)
  discountPercent?: number;
  shippingCost: number; // in Cordobas
  freeShippingThreshold: number; // in Cordobas
  adminPin: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  address?: string;
  bankName?: string; // e.g. 'LAFISE', 'BAC Credomatic', 'Banpro', 'Billetera Móvil'
  bankAccount?: string; // Configured per seller for receiving 97% of sales
  bankAccountHolder?: string;
  sellerWalletPhone?: string;
  indriveEnabled?: boolean;
  indriveEstimatedCost?: number; // Estimated C$ for local Managua trip
  indrivePickupAddress?: string; // Store pickup point for inDrive driver
  paymentGateways?: PaymentGatewayConfig[];
  adSenseConfig?: GoogleAdSenseConfig;
  // 💰 Monetización y Comisiones del Dueño de la App
  platformFeePercent: number; // 3%
  platformOwnerWallet: string; // "+505 58898311"
  platformOwnerAccount: string; // "134082049"
  platformOwnerBank: string; // "LAFISE"
}

export type StoreMembershipTier = 'gratis' | 'pro' | 'vip';

export interface StoreMembershipPlan {
  id: StoreMembershipTier;
  name: string;
  priceNIO: number;
  priceUSD: number;
  badge: string;
  commissionRate: number; // e.g. 3% vs 2%
  maxProducts: number;
  features: string[];
  popular?: boolean;
}

export interface UserAccount {
  uid?: string;
  name: string;
  phone: string;
  phoneOrEmail?: string;
  email?: string;
  photoURL?: string;
  address?: string;
  city?: string;
  department?: string;
  storeName?: string;
  storeWhatsapp?: string;
  storeBankAccount?: string;
  storeBankAccountHolder?: string;
  storeCity?: string;
  storeBio?: string;
  storePlan?: StoreMembershipTier;
  storePlanExpiresAt?: number;
  preferredPaymentMethod?: PaymentMethodType;
  loyaltyPoints?: number;
  authProvider?: string;
  role?: 'customer' | 'seller' | 'admin';
  isLoggedIn: boolean;
  loginDate?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface OrderItemSummary {
  productId: string;
  productName: string;
  size: string;
  color?: string;
  quantity: number;
  price: number; // in C$
  sellerName?: string;
  sellerPhone?: string;
}

export interface OrderRecord {
  id: string;
  customerUid?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  customerCity: string;
  notes?: string;
  deliveryMethod?: DeliveryMethodType;
  paymentMethod?: PaymentMethodType;
  paymentStatus?: PaymentStatusType;
  paymentReference?: string; // Transaction reference or authorization code
  paymentGatewayName?: string;
  items: OrderItemSummary[];
  subtotal: number; // in C$
  discount: number; // in C$ (20% OFF promo)
  shipping: number; // in C$
  total: number; // in C$
  currency: CurrencyType;
  // 💰 Comisiones de Plataforma (3% Dueño / 97% Tienda)
  platformFeePercent?: number; // 3%
  platformFeeAmount?: number; // 3% de ganancia para el dueño de la app
  sellerPayoutAmount?: number; // 97% neto para la tienda de ropa
  platformFeeStatus?: 'pendiente' | 'recaudada';
  platformOwnerWallet?: string; // +505 58898311
  platformOwnerAccount?: string; // 134082049
  sellerStoreName?: string;
  sellerWhatsapp?: string;
  sellerBankAccount?: string;
  createdAt: string;
  updatedAt?: string;
  status: 'pendiente' | 'en_preparacion' | 'enviado' | 'entregado';
  indriveReference?: string;
  indriveLocationUrl?: string;
}

export interface OrderNotification {
  id: string;
  orderId: string;
  productId?: string;
  price?: number;
  targetPrice?: number;
  recipientUid?: string; // 'admin' or customer's uid/phone
  recipientPhone?: string;
  recipientRole: 'customer' | 'admin' | 'all';
  type: 'order_created' | 'status_changed' | 'payment_verified' | 'promo' | 'price_drop';
  title: string;
  message: string;
  orderStatus?: OrderRecord['status'];
  paymentStatus?: PaymentStatusType;
  read: boolean;
  createdAt: string;
}

export interface PriceDropAlert {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  currentPrice: number; // in C$ at the time the alert was set
  targetPrice: number; // in C$ price threshold
  customerPhone?: string;
  customerEmail?: string;
  customerUid?: string;
  createdAt: string;
  triggered?: boolean;
  triggeredAt?: string;
  triggeredPrice?: number;
}

export interface CustomerInquiry {
  id: string;
  customerName: string;
  customerPhone: string;
  customerCity?: string;
  inquiryType: 'prenda' | 'envio_indrive' | 'talla_stock' | 'inscripcion_ofertas' | 'general';
  productName?: string;
  message: string;
  createdAt: string;
  status: 'nuevo' | 'contactado' | 'cerrado';
}

export interface DailyVisitMetric {
  date: string; // YYYY-MM-DD
  dayName?: string;
  views?: number;
  uniqueVisitors: number;
  whatsappClicks: number;
  formattedDate?: string;
  pageViews?: number;
}

export type DailyTrafficStat = DailyVisitMetric;

export interface AnalyticsData {
  totalViews: number;
  uniqueVisitors?: number;
  todayViews: number;
  whatsappClicks?: number;
  mobileViews?: number;
  desktopViews?: number;
  lastVisitAt?: string;
  dailyHistory: DailyVisitMetric[];
  totalUniqueVisitors?: number;
  todayUniqueVisitors?: number;
  yesterdayViews?: number;
  hourlyBreakdown?: Record<string, number>;
  deviceBreakdown?: { mobile: number; desktop: number };
  referrerBreakdown?: Record<string, number>;
  lastUpdated?: string;
  whatsappInquiriesClicks?: number;
}

export type CategoryFilter = 'Todas' | string;
