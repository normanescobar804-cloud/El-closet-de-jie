import { CartItem, CurrencyType, CustomerInquiry, CustomerTestimonial, OrderRecord, Product, ProductReview, StoreSettings, UserAccount } from '../types';
import { DEFAULT_STORE_SETTINGS, INITIAL_ORDERS, INITIAL_PRODUCTS, INITIAL_REVIEWS } from '../data/initialProducts';
import { INITIAL_TESTIMONIALS } from '../data/initialTestimonials';

const STORAGE_KEYS = {
  PRODUCTS: 'tienda_jiet_products_v2',
  CART: 'tienda_jiet_cart_v2',
  SETTINGS: 'tienda_jiet_settings_v2',
  USER: 'tienda_jiet_user_v2',
  FAVORITES: 'tienda_jiet_favorites_v2',
  ORDERS: 'tienda_jiet_orders_v2',
  CURRENCY: 'tienda_jiet_currency_v2',
  INQUIRIES: 'tienda_jiet_inquiries_v2',
  REVIEWS: 'tienda_jiet_reviews_v2',
  TESTIMONIALS: 'tienda_jiet_testimonials_v2',
  RECENTLY_VIEWED: 'tienda_jiet_recently_viewed_v2',
  ACCOUNTS_REGISTRY: 'tienda_jiet_accounts_registry_v2'
};

// Safe JSON Parse
function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
  }
}

// Products
export function getSavedProducts(): Product[] {
  const saved = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  if (!saved || saved.length < 10) {
    saveToStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    return INITIAL_PRODUCTS;
  }
  const savedIds = new Set(saved.map((p) => p.id));
  const missingInitial = INITIAL_PRODUCTS.filter((p) => !savedIds.has(p.id));
  const merged = missingInitial.length > 0 ? [...saved, ...missingInitial] : saved;

  // Ensure stock is hydrated for existing stored products if missing
  const initialMap = new Map(INITIAL_PRODUCTS.map((p) => [p.id, p]));
  const hydrated = merged.map((p) => {
    if (p.stock === undefined && p.inventory === undefined) {
      const match = initialMap.get(p.id);
      return {
        ...p,
        stock: match?.stock ?? (p.condition === 'usada' ? 1 : 5)
      };
    }
    return p;
  });
  return hydrated;
}

export function saveProducts(products: Product[]): void {
  saveToStorage(STORAGE_KEYS.PRODUCTS, products);
}

export function resetProductsToDefault(): Product[] {
  saveToStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  return INITIAL_PRODUCTS;
}

// Cart (💾 Persistent even across refreshes)
export function getSavedCart(): CartItem[] {
  return getFromStorage<CartItem[]>(STORAGE_KEYS.CART, []);
}

export function saveCart(cart: CartItem[]): void {
  saveToStorage(STORAGE_KEYS.CART, cart);
}

// Currency Mode ('cordobas' | 'dolares')
export function getSavedCurrency(): CurrencyType {
  const saved = getFromStorage<CurrencyType>(STORAGE_KEYS.CURRENCY, 'cordobas');
  return saved === 'dolares' ? 'dolares' : 'cordobas';
}

export function saveCurrency(currency: CurrencyType): void {
  saveToStorage(STORAGE_KEYS.CURRENCY, currency);
}

// Store Settings
export function getSavedSettings(): StoreSettings {
  const saved = getFromStorage<Partial<StoreSettings>>(STORAGE_KEYS.SETTINGS, {});
  const merged: StoreSettings = { ...DEFAULT_STORE_SETTINGS, ...saved };
  
  // Purge legacy hardcoded account and phone numbers so the store owner configures their own
  if (saved.whatsappNumber && (saved.whatsappNumber.includes('83702337') || saved.whatsappNumber.includes('87702337'))) {
    merged.whatsappNumber = '';
  }
  if (saved.bankAccount && (saved.bankAccount.includes('131017025') || saved.bankAccount.includes('FISE131017025'))) {
    merged.bankAccount = '';
  }
  if (saved.bankAccountHolder && (saved.bankAccountHolder.includes('Yordan') || saved.bankAccountHolder.includes('Escobar Ruiz'))) {
    merged.bankAccountHolder = '';
  }

  // 💰 Enforce App Owner Platform Fee & Monetization Settings
  merged.platformFeePercent = typeof saved.platformFeePercent === 'number' ? saved.platformFeePercent : 3;
  merged.platformOwnerWallet = saved.platformOwnerWallet !== undefined ? saved.platformOwnerWallet : '+505 58898311';
  merged.platformOwnerAccount = saved.platformOwnerAccount !== undefined ? saved.platformOwnerAccount : '134082049';
  merged.platformOwnerBank = saved.platformOwnerBank || 'LAFISE';
  merged.hidePersonalAccountsFromPublic = saved.hidePersonalAccountsFromPublic !== undefined ? saved.hidePersonalAccountsFromPublic : true;
  merged.platformCollectionMethod = saved.platformCollectionMethod || 'digital_link';
  merged.platformPaymentLink = saved.platformPaymentLink || 'https://paypal.me/elclosetdejie';
  merged.platformBusinessName = saved.platformBusinessName || 'El Clóset de Jié Oficial';
  merged.disableHighResCatalogImages = Boolean(saved.disableHighResCatalogImages);

  // Enforce requested owner security key: strictly jordan#$29 and purge legacy 1234
  if (!saved.adminPin || saved.adminPin === '1234' || saved.adminPin.length === 4) {
    merged.adminPin = 'jordan#$29';
    saveToStorage(STORAGE_KEYS.SETTINGS, merged);
  }
  return merged;
}

export function saveSettings(settings: StoreSettings): void {
  const sanitized = { ...settings };
  if (!sanitized.adminPin || sanitized.adminPin === '1234') {
    sanitized.adminPin = 'jordan#$29';
  }
  saveToStorage(STORAGE_KEYS.SETTINGS, sanitized);
}

// User Profile (Quick Login & Active Session)
export function getSavedUser(): UserAccount | null {
  return getFromStorage<UserAccount | null>(STORAGE_KEYS.USER, null);
}

export function saveUser(user: UserAccount | null): void {
  saveToStorage(STORAGE_KEYS.USER, user);
}

// 👥 Registro de Cuentas de Usuarios (Registro de Sesión Persistente)
export function getRegisteredAccounts(): UserAccount[] {
  const accounts = getFromStorage<UserAccount[]>(STORAGE_KEYS.ACCOUNTS_REGISTRY, []);
  if (accounts.length === 0) {
    const seed: UserAccount[] = [
      {
        uid: 'user-demo-1',
        name: 'Carolina Rojas',
        phone: '88889999',
        phoneOrEmail: '88889999',
        email: 'carolina@ejemplo.com',
        pin: '1234',
        city: 'Managua',
        department: 'Managua',
        address: 'Bello Horizonte, de la rotonda 2c al sur, casa #45',
        indriveReference: 'Portón negro frente al parque',
        preferredPaymentMethod: 'lafise_transfer',
        loyaltyPoints: 120,
        authProvider: 'local',
        role: 'customer',
        isLoggedIn: false,
        createdAt: Date.now() - 86400000 * 5
      }
    ];
    saveToStorage(STORAGE_KEYS.ACCOUNTS_REGISTRY, seed);
    return seed;
  }
  return accounts;
}

export function saveRegisteredAccounts(accounts: UserAccount[]): void {
  saveToStorage(STORAGE_KEYS.ACCOUNTS_REGISTRY, accounts);
}

export function registerCustomerAccount(
  accountData: Omit<UserAccount, 'isLoggedIn' | 'uid' | 'createdAt'>,
  passwordOrPin: string
): { success: boolean; message: string; user?: UserAccount } {
  const accounts = getRegisteredAccounts();
  const phoneOrEmailClean = (accountData.phoneOrEmail || accountData.phone || accountData.email || '').trim().toLowerCase();

  if (!accountData.name.trim()) {
    return { success: false, message: 'Por favor ingresa tu nombre y apellido.' };
  }
  if (!phoneOrEmailClean) {
    return { success: false, message: 'Por favor ingresa tu número de WhatsApp o correo electrónico.' };
  }

  // Check if account already exists
  const existing = accounts.find(
    (acc) =>
      (acc.phone && acc.phone.toLowerCase() === phoneOrEmailClean) ||
      (acc.phoneOrEmail && acc.phoneOrEmail.toLowerCase() === phoneOrEmailClean) ||
      (acc.email && acc.email.toLowerCase() === phoneOrEmailClean)
  );

  if (existing) {
    return {
      success: false,
      message: 'Ya existe una cuenta con este número o correo. Puedes iniciar sesión con tu contraseña o PIN.'
    };
  }

  const newUid = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newUser: UserAccount = {
    ...accountData,
    uid: newUid,
    pin: passwordOrPin.trim(),
    passwordHash: passwordOrPin.trim(),
    phoneOrEmail: phoneOrEmailClean,
    phone: accountData.phone || phoneOrEmailClean,
    city: accountData.city?.trim() || 'Managua',
    department: accountData.department?.trim() || accountData.city?.trim() || 'Managua',
    address: accountData.address?.trim() || '',
    indriveReference: accountData.indriveReference?.trim() || '',
    preferredPaymentMethod: accountData.preferredPaymentMethod || 'lafise_transfer',
    loyaltyPoints: 50, // Bono de bienvenida
    authProvider: 'local',
    role: 'customer',
    isLoggedIn: true,
    loginDate: new Date().toISOString(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const updatedList = [newUser, ...accounts];
  saveRegisteredAccounts(updatedList);
  saveUser(newUser);

  return {
    success: true,
    message: `¡Cuenta creada exitosamente! Bienvenido(a), ${newUser.name}. Recibiste 50 puntos de bienvenida.`,
    user: newUser
  };
}

export function loginCustomerAccount(
  identifier: string,
  passwordOrPin: string
): { success: boolean; message: string; user?: UserAccount } {
  const accounts = getRegisteredAccounts();
  const cleanId = identifier.trim().toLowerCase();
  const cleanPin = passwordOrPin.trim();

  if (!cleanId) {
    return { success: false, message: 'Ingresa tu número de WhatsApp o correo registrado.' };
  }

  const found = accounts.find(
    (acc) =>
      (acc.phone && acc.phone.toLowerCase() === cleanId) ||
      (acc.phoneOrEmail && acc.phoneOrEmail.toLowerCase() === cleanId) ||
      (acc.email && acc.email.toLowerCase() === cleanId)
  );

  if (!found) {
    return {
      success: false,
      message: 'No encontramos ninguna cuenta con ese número o correo. Regístrate para crear una nueva.'
    };
  }

  // Check pin/password if set
  if (found.pin && found.pin !== cleanPin && cleanPin !== '') {
    return {
      success: false,
      message: 'Contraseña o PIN incorrecto. Si lo olvidaste, puedes recuperarlo o ingresar con tu código de WhatsApp.'
    };
  }

  const loggedUser: UserAccount = {
    ...found,
    isLoggedIn: true,
    loginDate: new Date().toISOString()
  };

  saveUser(loggedUser);
  return {
    success: true,
    message: `¡Bienvenido(a) de nuevo, ${loggedUser.name}!`,
    user: loggedUser
  };
}

// 🗑️ Eliminar Cuenta de Usuario y Datos Personales (Obligatorio por Directiva de Google Play Store)
export function deleteCustomerAccountPermanently(userUidOrPhone: string): void {
  const accounts = getRegisteredAccounts();
  const filtered = accounts.filter(
    (acc) =>
      acc.uid !== userUidOrPhone &&
      acc.phone !== userUidOrPhone &&
      acc.phoneOrEmail !== userUidOrPhone
  );
  saveRegisteredAccounts(filtered);
  saveUser(null);
}

// Favorites
export function getSavedFavorites(): string[] {
  return getFromStorage<string[]>(STORAGE_KEYS.FAVORITES, []);
}

export function saveFavorites(favorites: string[]): void {
  saveToStorage(STORAGE_KEYS.FAVORITES, favorites);
}

// Orders
export function getSavedOrders(): OrderRecord[] {
  const saved = getFromStorage<OrderRecord[]>(STORAGE_KEYS.ORDERS, []);
  if (!saved || saved.length === 0) {
    saveToStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    return INITIAL_ORDERS;
  }
  return saved;
}

export function saveOrder(order: OrderRecord): void {
  const currentOrders = getSavedOrders();
  const updated = [order, ...currentOrders];
  saveToStorage(STORAGE_KEYS.ORDERS, updated);
}

export function updateOrderStatus(orderId: string, status: OrderRecord['status']): void {
  const currentOrders = getSavedOrders();
  const updated = currentOrders.map(o => o.id === orderId ? { ...o, status } : o);
  saveToStorage(STORAGE_KEYS.ORDERS, updated);
}

// 💬 Inquiries / Contact Messages from Customers
export function getSavedInquiries(): CustomerInquiry[] {
  return getFromStorage<CustomerInquiry[]>(STORAGE_KEYS.INQUIRIES, []);
}

export function saveInquiry(inquiry: CustomerInquiry): void {
  const currentInquiries = getSavedInquiries();
  const updated = [inquiry, ...currentInquiries];
  saveToStorage(STORAGE_KEYS.INQUIRIES, updated);
}

export function updateInquiryStatus(inquiryId: string, status: CustomerInquiry['status']): void {
  const currentInquiries = getSavedInquiries();
  const updated = currentInquiries.map(item => item.id === inquiryId ? { ...item, status } : item);
  saveToStorage(STORAGE_KEYS.INQUIRIES, updated);
}

export function deleteInquiry(inquiryId: string): void {
  const currentInquiries = getSavedInquiries();
  const updated = currentInquiries.filter(item => item.id !== inquiryId);
  saveToStorage(STORAGE_KEYS.INQUIRIES, updated);
}

// ⭐ Product Reviews & 5-Star Ratings
export function getSavedReviews(): ProductReview[] {
  const saved = getFromStorage<ProductReview[]>(STORAGE_KEYS.REVIEWS, []);
  if (!saved || saved.length === 0) {
    saveToStorage(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    return INITIAL_REVIEWS;
  }
  return saved;
}

export function saveReview(review: ProductReview): ProductReview[] {
  const current = getSavedReviews();
  const updated = [review, ...current];
  saveToStorage(STORAGE_KEYS.REVIEWS, updated);
  return updated;
}

// 💬 Testimonios de Clientes de la Plataforma (Carrusel y Perfil)
export function getSavedTestimonials(): CustomerTestimonial[] {
  const saved = getFromStorage<CustomerTestimonial[]>(STORAGE_KEYS.TESTIMONIALS, []);
  if (!saved || saved.length === 0) {
    saveToStorage(STORAGE_KEYS.TESTIMONIALS, INITIAL_TESTIMONIALS);
    return INITIAL_TESTIMONIALS;
  }
  return saved;
}

export function saveTestimonial(testimonial: CustomerTestimonial): CustomerTestimonial[] {
  const current = getSavedTestimonials();
  // If editing an existing one with same ID, replace; otherwise prepend
  const exists = current.some((t) => t.id === testimonial.id);
  const updated = exists
    ? current.map((t) => (t.id === testimonial.id ? testimonial : t))
    : [testimonial, ...current];
  saveToStorage(STORAGE_KEYS.TESTIMONIALS, updated);
  return updated;
}

export function deleteTestimonial(testimonialId: string): CustomerTestimonial[] {
  const current = getSavedTestimonials();
  const updated = current.filter((t) => t.id !== testimonialId);
  saveToStorage(STORAGE_KEYS.TESTIMONIALS, updated);
  return updated;
}

export function getProductReviews(productId: string, allReviews?: ProductReview[]): ProductReview[] {
  const reviews = allReviews || getSavedReviews();
  return reviews.filter(r => r.productId === productId);
}

export function getProductRatingStats(productId: string, allReviews?: ProductReview[]): {
  average: number;
  count: number;
  breakdown: Record<number, number>;
} {
  const reviews = getProductReviews(productId, allReviews);
  const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  if (reviews.length === 0) {
    return {
      average: 5.0,
      count: 0,
      breakdown
    };
  }

  let sum = 0;
  for (const rev of reviews) {
    const r = Math.min(5, Math.max(1, Math.round(rev.rating)));
    breakdown[r] = (breakdown[r] || 0) + 1;
    sum += rev.rating;
  }

  const average = Number((sum / reviews.length).toFixed(1));
  return {
    average,
    count: reviews.length,
    breakdown
  };
}

/**
 * Formats price according to active currency (Córdobas C$ or Dólares $)
 * based on exchange rate (default 36.5 NIO per USD as used on user's site)
 */
export function formatCurrency(
  amountInCordobas: number,
  currency: CurrencyType = 'cordobas',
  exchangeRate: number = 36.5
): string {
  if (currency === 'dolares') {
    const usd = amountInCordobas / (exchangeRate || 36.5);
    return `$ ${usd.toFixed(2)}`;
  }
  return `C$ ${amountInCordobas.toFixed(2)}`;
}

/**
 * Optimizes high resolution images (e.g. phone camera shots)
 * while maintaining crisp definition and ensuring storage longevity.
 */
export async function processHighResImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen no válido'));
      img.onload = () => {
        // 1200px max dimension gives crisp clarity on retina displays while keeping data lightweight
        const maxDimension = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Transforma la URL de una imagen a una versión optimizada de bajo consumo de datos móviles si está activo.
 * Reduce el consumo de datos celulares en un 70% a 85% para planes prepago y redes lentas (Claro / Tigo).
 */
export function getOptimizedCatalogImageUrl(url: string, disableHighRes: boolean = false): string {
  if (!url) {
    return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=50';
  }

  if (!disableHighRes) {
    return url;
  }

  // Si es una imagen de Unsplash o CDN con parámetros de dimensión:
  if (url.includes('images.unsplash.com')) {
    let optimized = url;
    if (optimized.includes('w=')) {
      optimized = optimized.replace(/w=\d+/, 'w=360');
    } else {
      optimized += '&w=360';
    }
    if (optimized.includes('q=')) {
      optimized = optimized.replace(/q=\d+/, 'q=45');
    } else {
      optimized += '&q=45';
    }
    return optimized;
  }

  return url;
}

// 🕒 Productos vistos recientemente (Recently Viewed Products)
export function getSavedRecentlyViewed(): string[] {
  const saved = getFromStorage<string[] | null>(STORAGE_KEYS.RECENTLY_VIEWED, null);
  if (saved === null) {
    const initial = ['p1', 'p2', 'p3', 'p4'];
    saveToStorage(STORAGE_KEYS.RECENTLY_VIEWED, initial);
    return initial;
  }
  return saved;
}

export function saveRecentlyViewed(ids: string[]): void {
  saveToStorage(STORAGE_KEYS.RECENTLY_VIEWED, ids.slice(0, 16));
}

export function recordRecentlyViewedProduct(productId: string): string[] {
  if (!productId) return getSavedRecentlyViewed();
  const current = getSavedRecentlyViewed();
  const filtered = current.filter((id) => id !== productId);
  const updated = [productId, ...filtered].slice(0, 16);
  saveRecentlyViewed(updated);
  return updated;
}

export function clearRecentlyViewed(): void {
  saveToStorage(STORAGE_KEYS.RECENTLY_VIEWED, []);
}
