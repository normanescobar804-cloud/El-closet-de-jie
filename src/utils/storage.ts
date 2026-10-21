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
  RECENTLY_VIEWED: 'tienda_jiet_recently_viewed_v2'
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
  return saved;
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

  // 💰 Enforce App Owner Platform Fee & Monetization Accounts
  merged.platformFeePercent = 3;
  merged.platformOwnerWallet = '+505 58898311';
  merged.platformOwnerAccount = '134082049';
  merged.platformOwnerBank = 'LAFISE';

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

// User Profile (Quick Login)
export function getSavedUser(): UserAccount | null {
  return getFromStorage<UserAccount | null>(STORAGE_KEYS.USER, null);
}

export function saveUser(user: UserAccount | null): void {
  saveToStorage(STORAGE_KEYS.USER, user);
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
