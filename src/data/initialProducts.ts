import { CategoryFilter, OrderRecord, PriceRangeFilter, Product, ProductReview, StoreSettings } from '../types';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'El Clóset de Jié',
  tagline: 'Plataforma Nacional de Ropa y Clósets • Compra y Vende en Toda Nicaragua',
  whatsappNumber: '', // Configurado por cada usuario al editar su tienda
  whatsappCustomGreeting: '¡Hola! 👋 Me gustaría realizar el siguiente pedido desde su tienda de ropa:',
  currencySymbol: 'C$',
  currencyCode: 'NIO',
  exchangeRate: 36.5, // 1 USD = ~36.5 Cordobas
  discountPercent: 20, // 20% discount across store
  shippingCost: 50,
  freeShippingThreshold: 450,
  adminPin: 'jordan#$29',
  instagramUrl: 'https://instagram.com',
  facebookUrl: 'https://facebook.com',
  tiktokUrl: 'https://tiktok.com',
  address: 'Managua, Nicaragua',
  bankName: '',
  bankAccount: '', // Configurado por cada vendedor para recibir su 98%
  bankAccountHolder: '',
  sellerWalletPhone: '',
  indriveEnabled: true,
  indriveEstimatedCost: 70,
  indrivePickupAddress: 'Punto de retiro acordado con la tienda',
  // 💰 Datos Oficiales del Dueño de la App (Comisión 2% y Monetización)
  platformFeePercent: 2,
  platformOwnerWallet: '+505 58898311',
  platformOwnerAccount: '134082049',
  platformOwnerBank: 'LAFISE',
  platformOwnerPaypalEmail: 'normanescobar804@gmail.com',
  hidePersonalAccountsFromPublic: true, // 🛡️ Modo privacidad activo por defecto: protege tu celular y cuenta personal
  platformCollectionMethod: 'digital_link',
  platformPaymentLink: 'https://paypal.me/elclosetdejie',
  platformBusinessName: 'El Clóset de Jié Oficial',
  disableHighResCatalogImages: false // Carga normal por defecto, configurable por el administrador
};

export const PRICE_RANGE_FILTERS: PriceRangeFilter[] = [
  { id: 'all', label: 'Todos los precios', min: 0, max: null },
  { id: '10-50', label: 'C$ 10 - C$ 50', min: 10, max: 50 },
  { id: '50-100', label: 'C$ 50 - C$ 100', min: 50, max: 100 },
  { id: '100-200', label: 'C$ 100 - C$ 200', min: 100, max: 200 },
  { id: '200-500', label: 'C$ 200 - C$ 500', min: 200, max: 500 },
  { id: '500-plus', label: 'C$ 500+', min: 500, max: null }
];

export const PRODUCT_CATEGORIES: CategoryFilter[] = [
  'Todas',
  'Ropa',
  'Peluches',
  'Ofertas',
  'Novedades',
  'Camisetas y Camisas',
  'Pantalones y Jeans',
  'Vestidos y Faldas',
  'Chaquetas y Abrigos',
  'Ropa para Niños',
  'Calzado y Zapatos',
  'Bolsas y Accesorios',
  'Perfumes y Belleza',
  'Celulares y Tecnología',
  'Joyería y Relojes',
  'Hogar y Decoración',
  'Artesanías y Recuerdos',
  'Deportiva y Playa',
  'Otros Productos'
];

// Catálogo sin datos ficticios de IA: solo productos y tiendas registradas en tiempo real.
export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_REVIEWS: ProductReview[] = [];

export const INITIAL_ORDERS: OrderRecord[] = [];
