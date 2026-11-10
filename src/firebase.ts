import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadString,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json';
import {
  AdPlanId,
  BusinessAd,
  CurrencyType,
  GoogleAdSenseConfig,
  OrderNotification,
  OrderRecord,
  PaymentMethodType,
  PaymentStatusType,
  Product,
  RegisteredStore,
  StoreSettings,
  UserAccount
} from './types';
import {
  BankWithdrawalRecord,
  isLegacySimulatedEarning,
  LEGACY_SIMULATED_BANK_IDS,
  LEGACY_SIMULATED_PAYPAL_IDS,
  PaypalWithdrawalRecord,
  PlatformEarningRecord
} from './utils/monetization';
import { LEGACY_AI_STORE_NAMES, isLegacyAiProduct } from './utils/storage';

// Initialize Firebase App, Firestore Database, Auth, and Storage
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export const ADMIN_OWNER_EMAIL = 'normanescobar804@gmail.com';

// ============================================================================
// Mandatory Connection Test on Boot (from firebase-integration-rpc skill)
// ============================================================================
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// ============================================================================
// Mandatory Firestore Error Handler (from firebase-integration-rpc skill)
// ============================================================================
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: boolean | string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ============================================================================
// Defensive Payload Sanitization & Enum Mappers (Matching firestore.rules)
// ============================================================================
export function sanitizeId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
  return cleaned.length > 0 ? cleaned : `doc-${Date.now()}`;
}

function truncateString(val: string | undefined | null, maxLen: number, fallback = ''): string {
  const str = (val ?? fallback).trim();
  if (str.length === 0 && fallback.length > 0) return fallback.slice(0, maxLen);
  return str.slice(0, maxLen);
}

function formatTimestampToIso(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

function toCloudPaymentMethod(method?: PaymentMethodType): string {
  switch (method) {
    case 'tarjeta_credito_debito':
      return 'card_online';
    case 'link_pago_electronico':
      return 'payment_link';
    case 'billetera_movil_qr':
      return 'mobile_wallet';
    case 'efectivo_contra_entrega':
      return 'cash_on_delivery';
    case 'transferencia_lafise':
    default:
      return 'lafise_transfer';
  }
}

function fromCloudPaymentMethod(cloudVal?: string): PaymentMethodType {
  switch (cloudVal) {
    case 'card_online':
      return 'tarjeta_credito_debito';
    case 'payment_link':
      return 'link_pago_electronico';
    case 'mobile_wallet':
      return 'billetera_movil_qr';
    case 'cash_on_delivery':
      return 'efectivo_contra_entrega';
    case 'lafise_transfer':
    default:
      return 'transferencia_lafise';
  }
}

function toCloudPaymentStatus(status?: PaymentStatusType): string {
  if (status === 'en_verificacion') return 'verificando';
  if (status === 'pagado') return 'pagado';
  if (status === 'reembolsado' || status === 'rechazado') return 'reembolsado';
  return 'pendiente';
}

function fromCloudPaymentStatus(cloudVal?: string): PaymentStatusType {
  if (cloudVal === 'verificando') return 'en_verificacion';
  if (cloudVal === 'pagado') return 'pagado';
  if (cloudVal === 'reembolsado') return 'reembolsado';
  return 'pendiente';
}

// ============================================================================
// Authentication & Customer / Seller Account Cloud Sync
// ============================================================================
export async function signInCustomerWithGoogle(): Promise<UserAccount | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    return await ensureCustomerAccountInFirestore(fbUser);
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.code === 'auth/popup-blocked' ||
      error?.message?.includes('popup-closed-by-user')
    ) {
      console.info('Google sign-in popup was closed or cancelled by the user.');
      return null;
    }
    console.error('Google sign-in error:', error);
    throw error;
  }
}

export const signInWithGooglePopup = signInCustomerWithGoogle;

export async function signOutCustomer(): Promise<void> {
  await signOut(auth);
}

export async function grantCurrentUserAdminRole(): Promise<void> {
  if (!auth.currentUser) return;
  const uid = sanitizeId(auth.currentUser.uid);
  if (auth.currentUser.email?.toLowerCase() !== ADMIN_OWNER_EMAIL.toLowerCase()) {
    return;
  }
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    if (!snap.exists()) {
      await setDoc(doc(db, 'admins', uid), {
        uid,
        role: 'owner',
        createdAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.warn('Admin role check notice:', error);
  }
}

export async function ensureCustomerAccountInFirestore(
  fbUser: User,
  overrides?: Partial<UserAccount>,
  favorites: string[] = []
): Promise<UserAccount> {
  const uid = sanitizeId(fbUser.uid);
  const publicPath = `users/${uid}`;
  const privatePath = `users/${uid}/private/info`;

  let existingPublic: Record<string, unknown> | null = null;
  let existingPrivate: Record<string, unknown> | null = null;

  try {
    const pubSnap = await getDoc(doc(db, 'users', uid));
    if (pubSnap.exists()) {
      existingPublic = pubSnap.data();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, publicPath);
  }

  const displayName = truncateString(
    overrides?.name || (existingPublic?.displayName as string) || fbUser.displayName || 'Usuario Comunidad',
    100,
    'Usuario Comunidad'
  );
  const city = truncateString(
    overrides?.city || (existingPublic?.city as string) || 'Managua',
    80,
    'Managua'
  );
  const favoritesCsv = truncateString(
    favorites.length > 0 ? favorites.join(',') : ((existingPublic?.favoritesCsv as string) || ''),
    2000,
    ''
  );
  const photoURL = truncateString(
    overrides?.photoURL || (existingPublic?.photoURL as string) || fbUser.photoURL || '',
    900000,
    ''
  );

  if (!existingPublic) {
    try {
      await setDoc(doc(db, 'users', uid), {
        uid,
        displayName,
        city,
        favoritesCsv,
        loyaltyPoints: 0,
        photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, publicPath);
    }
  } else if (overrides?.name || overrides?.city || overrides?.photoURL || favorites.length > 0) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        displayName,
        city,
        favoritesCsv,
        photoURL,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, publicPath);
    }
  }

  try {
    const privSnap = await getDoc(doc(db, 'users', uid, 'private', 'info'));
    if (privSnap.exists()) {
      existingPrivate = privSnap.data();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, privatePath);
  }

  const email = truncateString(
    overrides?.email || (existingPrivate?.email as string) || fbUser.email || '',
    160,
    ''
  );
  const phone = truncateString(
    overrides?.phone ||
      (existingPrivate?.phone as string) ||
      fbUser.phoneNumber ||
      email ||
      '50558898311',
    40,
    '50558898311'
  );
  const address = truncateString(
    overrides?.address ?? ((existingPrivate?.address as string) || ''),
    400,
    ''
  );
  const indriveReference = truncateString(
    (existingPrivate?.indriveReference as string) || '',
    400,
    ''
  );
  const cloudPayMethod = toCloudPaymentMethod(
    overrides?.preferredPaymentMethod ||
      fromCloudPaymentMethod(existingPrivate?.preferredPaymentMethod as string)
  );

  if (!existingPrivate) {
    try {
      await setDoc(doc(db, 'users', uid, 'private', 'info'), {
        uid,
        email,
        phone,
        address,
        indriveReference,
        preferredPaymentMethod: cloudPayMethod,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, privatePath);
    }
  } else if (overrides) {
    try {
      await updateDoc(doc(db, 'users', uid, 'private', 'info'), {
        email,
        phone,
        address,
        indriveReference,
        preferredPaymentMethod: cloudPayMethod,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, privatePath);
    }
  }

  const isAdmin = Boolean(
    fbUser.emailVerified && fbUser.email?.toLowerCase() === ADMIN_OWNER_EMAIL.toLowerCase()
  );

  return {
    uid,
    name: displayName,
    email,
    phone,
    photoURL: photoURL || fbUser.photoURL || undefined,
    city,
    department: overrides?.department || city,
    storeName: overrides?.storeName || displayName,
    address,
    preferredPaymentMethod: fromCloudPaymentMethod(cloudPayMethod),
    role: isAdmin ? 'admin' : 'seller',
    favorites: favoritesCsv ? favoritesCsv.split(',').filter(Boolean) : [],
    isLoggedIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

// ============================================================================
// Real-Time Registered Stores Directory Sync (/stores/{storeId})
// ============================================================================
export async function saveStoreToCloud(
  store: Partial<RegisteredStore> & { storeName: string }
): Promise<RegisteredStore | null> {
  if (!auth.currentUser) return null;
  const cleanStoreName = truncateString(store.storeName, 120, '');
  if (!cleanStoreName || LEGACY_AI_STORE_NAMES.has(cleanStoreName.toLowerCase())) {
    return null;
  }

  const uid = sanitizeId(auth.currentUser.uid);
  const storeId = uid;
  const path = `stores/${storeId}`;

  await ensureCustomerAccountInFirestore(auth.currentUser, {
    name: store.ownerName || auth.currentUser.displayName || cleanStoreName,
    phone: store.whatsapp || undefined,
    city: store.city || 'Managua',
    photoURL: store.photoURL || auth.currentUser.photoURL || undefined
  });

  let existingStore: Record<string, unknown> | null = null;
  try {
    const snap = await getDoc(doc(db, 'stores', storeId));
    if (snap.exists()) {
      existingStore = snap.data();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const ownerName = truncateString(
    store.ownerName || (existingStore?.ownerName as string) || auth.currentUser.displayName || cleanStoreName,
    100,
    cleanStoreName
  );
  const city = truncateString(
    store.city || (existingStore?.city as string) || 'Managua',
    80,
    'Managua'
  );
  const bio = truncateString(
    store.bio !== undefined ? store.bio : ((existingStore?.bio as string) || ''),
    500,
    ''
  );
  const whatsapp = truncateString(
    store.whatsapp !== undefined ? store.whatsapp : ((existingStore?.whatsapp as string) || ''),
    40,
    ''
  );
  const photoURL = truncateString(
    store.photoURL !== undefined ? store.photoURL : ((existingStore?.photoURL as string) || auth.currentUser.photoURL || ''),
    900000,
    ''
  );
  const isActive = store.isActive !== undefined ? Boolean(store.isActive) : true;

  if (!existingStore) {
    try {
      await setDoc(doc(db, 'stores', storeId), {
        id: storeId,
        ownerId: uid,
        storeName: cleanStoreName,
        ownerName,
        city,
        bio,
        whatsapp,
        photoURL,
        isActive,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else {
    try {
      await updateDoc(doc(db, 'stores', storeId), {
        storeName: cleanStoreName,
        ownerName,
        city,
        bio,
        whatsapp,
        photoURL,
        isActive,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  return {
    id: storeId,
    ownerId: uid,
    storeName: cleanStoreName,
    ownerName,
    city,
    bio,
    whatsapp,
    photoURL: photoURL || undefined,
    isActive,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

// ============================================================================
// Open Platform Products Firestore Sync (Any Verified User or Admin)
// ============================================================================
export async function saveProductToCloud(product: Product): Promise<void> {
  if (!auth.currentUser) return;

  // Ensure parent user profile exists so firestore.rules relational check passes
  await ensureCustomerAccountInFirestore(auth.currentUser, {
    name: product.sellerName || auth.currentUser.displayName || 'Vendedor Nicaragua',
    phone: product.sellerPhone || undefined,
    city: product.sellerCity || 'Managua'
  });

  const productId = sanitizeId(product.id);
  const path = `products/${productId}`;

  let existsInCloud = false;
  try {
    const snap = await getDoc(doc(db, 'products', productId));
    existsInCloud = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const payload: Record<string, unknown> = {
    id: productId,
    authorId: sanitizeId(auth.currentUser.uid),
    name: truncateString(product.name, 160, 'Prenda'),
    price: Math.max(0, Math.min(1000000, Number(product.price) || 0)),
    category: truncateString(product.category, 80, 'Catálogo'),
    condition: product.condition === 'nueva' ? 'nueva' : 'usada',
    description: truncateString(product.description, 2000, ''),
    primaryImageUrl: truncateString(
      product.images?.[0] || '/portada.jpg',
      900000,
      '/portada.jpg'
    ),
    sizesCsv: truncateString((product.sizes || ['Única']).join(','), 200, 'Única'),
    colorsCsv: truncateString((product.colors || ['Original']).join(','), 200, 'Original'),
    inStock: Boolean(product.inStock),
    featured: Boolean(product.featured),
    sellerName: truncateString(
      product.sellerName || auth.currentUser.displayName || 'El Clóset de Jié',
      120,
      'El Clóset de Jié'
    ),
    sellerPhone: truncateString(product.sellerPhone || '50558898311', 40, '50558898311'),
    sellerCity: truncateString(product.sellerCity || 'Managua', 80, 'Managua'),
    updatedAt: serverTimestamp()
  };

  if (typeof product.originalPrice === 'number' && product.originalPrice > 0) {
    payload.originalPrice = Math.min(1000000, product.originalPrice);
  }

  if (!existsInCloud) {
    payload.createdAt = serverTimestamp();
    try {
      await setDoc(doc(db, 'products', productId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else {
    try {
      await updateDoc(doc(db, 'products', productId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  // Register seller's store in real-time /stores collection if not legacy AI
  if (product.sellerName && !LEGACY_AI_STORE_NAMES.has(product.sellerName.trim().toLowerCase())) {
    saveStoreToCloud({
      storeName: product.sellerName.trim(),
      ownerName: auth.currentUser.displayName || product.sellerName.trim(),
      city: product.sellerCity || 'Managua',
      whatsapp: product.sellerPhone || '',
      photoURL: auth.currentUser.photoURL || undefined,
      isActive: true
    }).catch((err) => console.warn('Store registration sync notice:', err));
  }
}

export async function deleteProductFromCloud(productId: string): Promise<void> {
  if (!auth.currentUser) return;
  const cleanId = sanitizeId(productId);
  const path = `products/${cleanId}`;
  try {
    await deleteDoc(doc(db, 'products', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// Open Platform Business Ads & Free Directory Firestore Sync
// ============================================================================
export async function saveBusinessAdToCloud(ad: BusinessAd): Promise<void> {
  if (!auth.currentUser) return;

  await ensureCustomerAccountInFirestore(auth.currentUser, {
    name: ad.ownerName || ad.businessName,
    phone: ad.whatsappPhone,
    city: ad.department || 'Managua'
  });

  const adId = sanitizeId(ad.id);
  const path = `business_ads/${adId}`;

  let existsInCloud = false;
  try {
    const snap = await getDoc(doc(db, 'business_ads', adId));
    existsInCloud = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const planIdValid: AdPlanId =
    ad.planId === 'comunidad_gratis' ||
    ad.planId === 'basico_semanal' ||
    ad.planId === 'destacado_mensual' ||
    ad.planId === 'vip_patrocinador'
      ? ad.planId
      : 'comunidad_gratis';

  const cloudPaymentMethod =
    ad.pricePaid === 0 || planIdValid === 'comunidad_gratis'
      ? 'free_plan'
      : toCloudPaymentMethod(ad.paymentMethod);

  const payload: Record<string, unknown> = {
    id: adId,
    authorId: sanitizeId(auth.currentUser.uid),
    businessName: truncateString(ad.businessName, 120, 'Negocio Nicaragua'),
    ownerName: truncateString(ad.ownerName || ad.businessName, 120, 'Emprendedor'),
    category: truncateString(ad.category, 80, 'Servicios Profesionales'),
    department: truncateString(ad.department, 80, 'Managua'),
    headline: truncateString(ad.headline, 200, 'Conoce nuestros productos y servicios'),
    description: truncateString(ad.description || ad.headline, 1000, 'Atención directa por WhatsApp'),
    promoText: truncateString(ad.promoText || '', 200, ''),
    imageUrl: truncateString(ad.imageUrl || '/portada.jpg', 900000, '/portada.jpg'),
    whatsappPhone: truncateString(ad.whatsappPhone, 40, '50558898311'),
    websiteOrSocialUrl: truncateString(ad.websiteOrSocialUrl || '', 300, ''),
    ctaText: truncateString(ad.ctaText || 'Contactar por WhatsApp', 80, 'Contactar por WhatsApp'),
    planId: planIdValid,
    planName: truncateString(ad.planName, 120, 'Plan Comunidad Libre'),
    pricePaid: Math.max(0, Math.min(100000, Number(ad.pricePaid) || 0)),
    currency: ad.currency === 'USD' || ad.currency === 'dolares' ? 'dolares' : 'cordobas',
    paymentMethod: cloudPaymentMethod,
    paymentStatus:
      ad.pricePaid === 0
        ? 'pagado'
        : toCloudPaymentStatus(ad.paymentStatus),
    paymentReference: truncateString(ad.paymentReference || '', 120, ''),
    status:
      ad.status === 'pendiente_aprobacion' ||
      ad.status === 'pausado' ||
      ad.status === 'expirado'
        ? ad.status
        : 'activo',
    impressions: Math.max(0, Math.min(10000000, Math.round(Number(ad.impressions) || 1))),
    clicks: Math.max(0, Math.min(10000000, Math.round(Number(ad.clicks) || 0))),
    expiresAtIso: truncateString(
      ad.expiresAt || new Date(Date.now() + 14 * 86400000).toISOString(),
      40,
      new Date(Date.now() + 14 * 86400000).toISOString()
    ),
    updatedAt: serverTimestamp()
  };

  if (!existsInCloud) {
    payload.createdAt = serverTimestamp();
    try {
      await setDoc(doc(db, 'business_ads', adId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else {
    try {
      await updateDoc(doc(db, 'business_ads', adId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}

export async function deleteBusinessAdFromCloud(adId: string): Promise<void> {
  if (!auth.currentUser) return;
  const cleanId = sanitizeId(adId);
  const path = `business_ads/${cleanId}`;
  try {
    await deleteDoc(doc(db, 'business_ads', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// Orders & Notifications Firestore Sync
// ============================================================================
export async function saveOrderToCloud(order: OrderRecord): Promise<void> {
  if (!auth.currentUser) return;

  await ensureCustomerAccountInFirestore(auth.currentUser, {
    name: order.customerName,
    phone: order.customerPhone,
    address: order.customerAddress,
    city: order.customerCity || 'Managua'
  });

  const orderId = sanitizeId(order.id);
  const customerId = sanitizeId(auth.currentUser.uid);
  const orderPath = `orders/${orderId}`;

  const itemsSummary = truncateString(
    order.items.map((it) => `${it.quantity}x ${it.productName} (${it.size || 'Única'})`).join(', '),
    2000,
    'Pedido de prendas'
  );
  const itemsJson = truncateString(JSON.stringify(order.items), 8000, '[]');
  const itemsCount = Math.max(
    1,
    Math.min(
      500,
      Math.round(order.items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0))
    )
  );

  const orderPayload = {
    id: orderId,
    customerId,
    customerName: truncateString(order.customerName, 120, 'Cliente'),
    customerPhone: truncateString(order.customerPhone, 40, '50558898311'),
    customerAddress: truncateString(order.customerAddress || 'Retiro en tienda', 400, 'Managua'),
    customerCity: truncateString(order.customerCity || 'Managua', 80, 'Managua'),
    deliveryMethod:
      order.deliveryMethod === 'departamental'
        ? 'departamental'
        : order.deliveryMethod === 'tienda'
        ? 'pickup'
        : 'indrive',
    paymentMethod: toCloudPaymentMethod(order.paymentMethod),
    paymentStatus:
      order.paymentStatus === 'en_verificacion' ? 'verificando' : 'pendiente',
    paymentReference: truncateString(order.paymentReference || '', 120, ''),
    itemsSummary,
    itemsJson,
    itemsCount,
    subtotal: Math.max(0, Math.min(1000000, Number(order.subtotal) || 0)),
    discount: Math.max(0, Math.min(1000000, Number(order.discount) || 0)),
    shipping: Math.max(0, Math.min(100000, Number(order.shipping) || 0)),
    total: Math.max(0, Math.min(1000000, Number(order.total) || 0)),
    currency: order.currency === 'USD' || order.currency === 'dolares' ? 'dolares' : 'cordobas',
    status: 'pendiente',
    notes: truncateString(order.notes || '', 500, ''),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, 'orders', orderId), orderPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, orderPath);
  }

  // Create real-time notification for the Customer
  const customerNotifId = sanitizeId(`notif-cust-${orderId}-${Date.now()}`);
  try {
    await setDoc(doc(db, 'notifications', customerNotifId), {
      id: customerNotifId,
      recipientId: customerId,
      authorId: customerId,
      orderId,
      title: truncateString(`¡Pedido #${orderId} recibido!`, 140, 'Pedido recibido'),
      message: truncateString(
        `Tu pedido de ${itemsCount} prenda(s) por C$ ${order.total.toFixed(2)} fue registrado en la base de datos.`,
        500,
        'Pedido registrado.'
      ),
      type: 'nuevo_pedido',
      read: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `notifications/${customerNotifId}`);
  }

  // Create real-time notification for the Store Admin ('ADMIN')
  const adminNotifId = sanitizeId(`notif-adm-${orderId}-${Date.now()}`);
  try {
    await setDoc(doc(db, 'notifications', adminNotifId), {
      id: adminNotifId,
      recipientId: 'ADMIN',
      authorId: customerId,
      orderId,
      title: truncateString(`Nuevo pedido #${orderId} de ${order.customerName}`, 140, 'Nuevo pedido'),
      message: truncateString(
        `${itemsSummary} • Total: C$ ${order.total.toFixed(2)} (${order.customerPhone})`,
        500,
        'Nuevo pedido recibido.'
      ),
      type: 'nuevo_pedido',
      read: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `notifications/${adminNotifId}`);
  }
}

export async function updateOrderInCloudByAdmin(
  order: OrderRecord,
  updates: {
    status?: OrderRecord['status'];
    paymentStatus?: PaymentStatusType;
    paymentReference?: string;
    notes?: string;
  },
  notificationCopy?: {
    title: string;
    message: string;
    type: 'cambio_estado' | 'pago_actualizado';
  }
): Promise<void> {
  if (!auth.currentUser) return;
  const orderId = sanitizeId(order.id);
  const path = `orders/${orderId}`;

  const updatePayload: Record<string, unknown> = {
    updatedAt: serverTimestamp()
  };
  if (updates.status) updatePayload.status = updates.status;
  if (updates.paymentStatus) {
    updatePayload.paymentStatus = toCloudPaymentStatus(updates.paymentStatus);
  }
  if (updates.paymentReference !== undefined) {
    updatePayload.paymentReference = truncateString(updates.paymentReference, 120, '');
  }
  if (updates.notes !== undefined) {
    updatePayload.notes = truncateString(updates.notes, 500, '');
  }

  try {
    const snap = await getDoc(doc(db, 'orders', orderId));
    if (!snap.exists()) return;
    await updateDoc(doc(db, 'orders', orderId), updatePayload);

    const orderData = snap.data();
    const targetCustomerId = orderData.customerId as string | undefined;

    if (targetCustomerId && notificationCopy) {
      const notifId = sanitizeId(`notif-upd-${orderId}-${Date.now()}`);
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        recipientId: sanitizeId(targetCustomerId),
        authorId: sanitizeId(auth.currentUser.uid),
        orderId,
        title: truncateString(notificationCopy.title, 140, 'Actualización de pedido'),
        message: truncateString(notificationCopy.message, 500, 'El estado de tu pedido cambió.'),
        type: notificationCopy.type,
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markNotificationReadInCloud(notificationId: string): Promise<void> {
  if (!auth.currentUser) return;
  const cleanId = sanitizeId(notificationId);
  const path = `notifications/${cleanId}`;
  try {
    const snap = await getDoc(doc(db, 'notifications', cleanId));
    if (!snap.exists()) return;
    await updateDoc(doc(db, 'notifications', cleanId), {
      read: true,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ============================================================================
// Real-time Listeners (onSnapshot with error callbacks)
// ============================================================================
export function subscribeToCloudProducts(
  onProductsLoaded: (products: Product[]) => void
): () => void {
  const q = query(collection(db, 'products'), where('price', '>=', 0));
  return onSnapshot(
    q,
    (snapshot) => {
      const loaded: Product[] = snapshot.docs
        .map((docSnap) => {
          const d = docSnap.data();
          return {
            id: String(d.id || docSnap.id),
            authorId: d.authorId ? String(d.authorId) : undefined,
            name: String(d.name || 'Prenda'),
            price: Number(d.price) || 0,
            originalPrice: typeof d.originalPrice === 'number' ? d.originalPrice : undefined,
            category: String(d.category || 'Catálogo'),
            condition: d.condition === 'nueva' ? 'nueva' : 'usada',
            description: String(d.description || ''),
            images: [String(d.primaryImageUrl || '/portada.jpg')],
            sizes: String(d.sizesCsv || 'Única')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
            colors: String(d.colorsCsv || 'Original')
              .split(',')
              .map((c) => c.trim())
              .filter(Boolean),
            inStock: Boolean(d.inStock),
            featured: Boolean(d.featured),
            sellerName: d.sellerName ? String(d.sellerName) : undefined,
            sellerPhone: d.sellerPhone ? String(d.sellerPhone) : undefined,
            sellerCity: d.sellerCity ? String(d.sellerCity) : undefined,
            createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : Date.now()
          } as Product;
        })
        .filter((prod) => !isLegacyAiProduct(prod));
      onProductsLoaded(loaded);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    }
  );
}

export function subscribeToCloudStores(
  onStoresLoaded: (stores: RegisteredStore[]) => void
): () => void {
  const q = query(collection(db, 'stores'), where('isActive', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      const loaded: RegisteredStore[] = snapshot.docs
        .map((docSnap) => {
          const d = docSnap.data();
          return {
            id: String(d.id || docSnap.id),
            ownerId: String(d.ownerId || ''),
            storeName: String(d.storeName || ''),
            ownerName: String(d.ownerName || ''),
            city: String(d.city || 'Managua'),
            bio: d.bio ? String(d.bio) : undefined,
            whatsapp: d.whatsapp ? String(d.whatsapp) : undefined,
            photoURL: d.photoURL ? String(d.photoURL) : undefined,
            isActive: Boolean(d.isActive),
            createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : Date.now(),
            updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toMillis() : Date.now()
          } as RegisteredStore;
        })
        .filter(
          (st) =>
            st.storeName.trim().length > 0 &&
            !LEGACY_AI_STORE_NAMES.has(st.storeName.trim().toLowerCase())
        );
      onStoresLoaded(loaded);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'stores');
    }
  );
}

export function subscribeToCloudBusinessAds(
  onAdsLoaded: (ads: BusinessAd[]) => void
): () => void {
  const q = query(collection(db, 'business_ads'), where('pricePaid', '>=', 0));
  return onSnapshot(
    q,
    (snapshot) => {
      const loaded: BusinessAd[] = snapshot.docs
        .map((docSnap) => {
          const d = docSnap.data();
          return {
            id: String(d.id || docSnap.id),
            authorId: d.authorId ? String(d.authorId) : undefined,
            businessName: String(d.businessName || 'Negocio Nicaragua'),
            ownerName: String(d.ownerName || 'Emprendedor'),
            category: String(d.category || 'Servicios Profesionales'),
            department: String(d.department || 'Managua'),
            headline: String(d.headline || ''),
            description: String(d.description || ''),
            promoText: d.promoText ? String(d.promoText) : undefined,
            imageUrl: String(d.imageUrl || '/portada.jpg'),
            whatsappPhone: String(d.whatsappPhone || '50558898311'),
            websiteOrSocialUrl: d.websiteOrSocialUrl ? String(d.websiteOrSocialUrl) : undefined,
            ctaText: String(d.ctaText || 'Contactar por WhatsApp'),
            planId: (d.planId as AdPlanId) || 'comunidad_gratis',
            planName: String(d.planName || 'Plan Comunidad Libre'),
            pricePaid: Number(d.pricePaid) || 0,
            currency: d.currency === 'dolares' ? 'USD' : 'NIO',
            paymentMethod: fromCloudPaymentMethod(String(d.paymentMethod || '')),
            paymentStatus: fromCloudPaymentStatus(String(d.paymentStatus || '')),
            paymentReference: d.paymentReference ? String(d.paymentReference) : undefined,
            status: (d.status as BusinessAd['status']) || 'activo',
            impressions: Number(d.impressions) || 1,
            clicks: Number(d.clicks) || 0,
            createdAt: formatTimestampToIso(d.createdAt),
            expiresAt: String(d.expiresAtIso || new Date(Date.now() + 14 * 86400000).toISOString())
          } as BusinessAd;
        })
        .filter(
          (ad) =>
            !/^ad-nic-[123]$/.test(ad.id) &&
            !LEGACY_AI_STORE_NAMES.has(ad.businessName.trim().toLowerCase())
        );
      onAdsLoaded(loaded);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'business_ads');
    }
  );
}

export function subscribeToUserOrders(
  uid: string,
  isAdmin: boolean,
  onOrdersUpdate: (orders: OrderRecord[]) => void
): () => void {
  const ordersQuery = isAdmin
    ? query(collection(db, 'orders'))
    : query(collection(db, 'orders'), where('customerId', '==', uid));

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const loaded: OrderRecord[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        let parsedItems = [];
        try {
          parsedItems = JSON.parse(String(d.itemsJson || '[]'));
        } catch {
          parsedItems = [];
        }
        const currency: CurrencyType = d.currency === 'dolares' ? 'USD' : 'NIO';
        return {
          id: String(d.id || docSnap.id),
          customerUid: String(d.customerId || ''),
          createdAt: formatTimestampToIso(d.createdAt),
          updatedAt: formatTimestampToIso(d.updatedAt),
          customerName: String(d.customerName || 'Cliente'),
          customerPhone: String(d.customerPhone || ''),
          customerAddress: String(d.customerAddress || ''),
          customerCity: String(d.customerCity || 'Managua'),
          deliveryMethod:
            d.deliveryMethod === 'departamental'
              ? 'departamental'
              : d.deliveryMethod === 'pickup'
              ? 'tienda'
              : 'indrive',
          paymentMethod: fromCloudPaymentMethod(String(d.paymentMethod || '')),
          paymentStatus: fromCloudPaymentStatus(String(d.paymentStatus || '')),
          paymentReference: String(d.paymentReference || ''),
          items: Array.isArray(parsedItems) ? parsedItems : [],
          subtotal: Number(d.subtotal) || 0,
          discount: Number(d.discount) || 0,
          shipping: Number(d.shipping) || 0,
          total: Number(d.total) || 0,
          currency,
          status: (d.status as OrderRecord['status']) || 'pendiente',
          notes: String(d.notes || '')
        };
      });
      onOrdersUpdate(loaded);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    }
  );
}

export function subscribeToUserNotifications(
  uid: string,
  isAdmin: boolean,
  onNotificationsUpdate: (notifications: OrderNotification[]) => void
): () => void {
  const notifQuery = isAdmin
    ? query(collection(db, 'notifications'))
    : query(collection(db, 'notifications'), where('recipientId', '==', uid));

  return onSnapshot(
    notifQuery,
    (snapshot) => {
      const loaded: OrderNotification[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const rawType = String(d.type || 'cambio_estado');
        const mappedType: OrderNotification['type'] =
          rawType === 'nuevo_pedido'
            ? 'order_created'
            : rawType === 'pago_actualizado'
            ? 'payment_verified'
            : rawType === 'promocion'
            ? 'promo'
            : 'status_changed';

        return {
          id: String(d.id || docSnap.id),
          orderId: String(d.orderId || ''),
          recipientUid: String(d.recipientId || ''),
          recipientRole: d.recipientId === 'ADMIN' ? 'admin' : 'customer',
          title: String(d.title || 'Notificación de pedido'),
          message: String(d.message || ''),
          type: mappedType,
          read: Boolean(d.read),
          createdAt: formatTimestampToIso(d.createdAt)
        };
      });
      loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onNotificationsUpdate(loaded);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    }
  );
}

// ============================================================================
// Firebase Storage: Cloud Image Upload for Products & Media
// ============================================================================
export async function uploadProductImageToStorage(
  fileOrDataUrl: File | string,
  preferredName?: string
): Promise<string> {
  const cleanName = sanitizeId(preferredName || `img-${Date.now()}`);
  const storagePath = `products/${cleanName}-${Date.now()}.jpg`;

  // First convert File to optimized data URL if it's a File object
  let localDataUrl: string = '';
  if (fileOrDataUrl instanceof File) {
    try {
      localDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileOrDataUrl);
      });
    } catch {
      localDataUrl = '';
    }
  } else if (typeof fileOrDataUrl === 'string') {
    localDataUrl = fileOrDataUrl;
  }

  try {
    const storageRef = ref(storage, storagePath);
    if (localDataUrl && localDataUrl.startsWith('data:')) {
      const snap = await Promise.race([
        uploadString(storageRef, localDataUrl, 'data_url'),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Storage timeout')), 4000))
      ]);
      return await getDownloadURL(snap.ref);
    } else if (fileOrDataUrl instanceof File) {
      const snap = await Promise.race([
        uploadBytes(storageRef, fileOrDataUrl),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Storage timeout')), 4000))
      ]);
      return await getDownloadURL(snap.ref);
    }
  } catch (error) {
    console.info('Storage direct upload note; using optimized image data payload:', error);
  }

  // Fallback to crisp high quality local image representation so gallery upload NEVER fails
  if (localDataUrl) {
    return localDataUrl;
  }
  return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '/portada.jpg';
}

// ============================================================================
// Real-time Cloud Users Directory Subscription (For Admin & Live Community)
// ============================================================================
export function subscribeToAllUsers(
  onUsersUpdate: (users: UserAccount[]) => void
): () => void {
  const usersQuery = query(collection(db, 'users'));
  return onSnapshot(
    usersQuery,
    (snapshot) => {
      const loaded: UserAccount[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          uid: String(d.uid || docSnap.id),
          name: String(d.displayName || 'Usuario'),
          email: '',
          phone: '',
          city: String(d.city || 'Managua'),
          department: String(d.city || 'Managua'),
          storeName: String(d.displayName || 'Usuario'),
          preferredPaymentMethod: 'transferencia_lafise',
          role: 'customer',
          photoURL: d.photoURL ? String(d.photoURL) : undefined,
          isLoggedIn: false,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : Date.now(),
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toMillis() : Date.now()
        };
      });
      onUsersUpdate(loaded);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
  );
}

// ============================================================================
// Real-time Profile Photo Update (Storage + Auth + Public User Record)
// ============================================================================
export async function updateUserCloudProfilePhoto(
  photoUrlOrFile: string | File,
  userId?: string
): Promise<string> {
  const effectiveUid = userId || auth.currentUser?.uid || 'user';
  const photoUrl = await uploadProductImageToStorage(photoUrlOrFile, `avatar-${effectiveUid}`);
  const cleanPhotoUrl = truncateString(photoUrl, 900000, '');

  if (auth.currentUser) {
    try {
      await updateProfile(auth.currentUser, { photoURL: cleanPhotoUrl });
    } catch (err) {
      console.info('Note on auth updateProfile:', err);
    }

    const uid = sanitizeId(auth.currentUser.uid);
    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists()) {
        await updateDoc(doc(db, 'users', uid), {
          photoURL: cleanPhotoUrl,
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.info('Note updating user doc photoURL:', err);
    }

    try {
      const storeSnap = await getDoc(doc(db, 'stores', uid));
      if (storeSnap.exists()) {
        await updateDoc(doc(db, 'stores', uid), {
          photoURL: cleanPhotoUrl,
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.info('Note updating store doc photoURL:', err);
    }
  }

  return photoUrl;
}

// ============================================================================
// Bulk Cloud Catalog Real-time Synchronization
// ============================================================================
export async function seedInitialCatalogToCloud(productsToSeed: Product[]): Promise<number> {
  if (!auth.currentUser) return 0;
  let count = 0;
  for (const product of productsToSeed) {
    try {
      await saveProductToCloud(product);
      count++;
    } catch (e) {
      console.warn('Catalog cloud sync notice for:', product.name, e);
    }
  }
  return count;
}

export async function syncFavoritesToCloud(favorites: string[]): Promise<void> {
  if (!auth.currentUser) return;
  const uid = sanitizeId(auth.currentUser.uid);
  const favoritesCsv = truncateString(favorites.join(','), 2000, '');
  try {
    await updateDoc(doc(db, 'users', uid), {
      favoritesCsv,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.warn('Favorites cloud sync notice:', error);
  }
}

// ============================================================================
// Real Platform Monetization Cloud Sync (AdSense Config, Earnings & Withdrawals)
// ============================================================================
export interface CloudPublicPlatformConfig {
  adSenseConfig: GoogleAdSenseConfig;
  platformPaymentLink: string;
  platformFeePercent: number;
}

export async function savePlatformConfigToCloud(settings: StoreSettings): Promise<void> {
  if (!auth.currentUser) return;
  const path = 'platform_config/public';
  const adCfg = settings.adSenseConfig;
  const payload = {
    id: 'public',
    adSenseEnabled: adCfg?.enabled !== false,
    adSensePublisherId: truncateString(adCfg?.publisherId || '', 64, ''),
    adSenseHeaderSlotId: truncateString(adCfg?.headerSlotId || '', 64, ''),
    adSenseInFeedSlotId: truncateString(adCfg?.inFeedSlotId || '', 64, ''),
    adSenseFooterSlotId: truncateString(adCfg?.footerSlotId || '', 64, ''),
    adSenseAutoAds: adCfg?.autoAdsEnabled !== false,
    platformPaymentLink: truncateString(settings.platformPaymentLink || '', 300, ''),
    platformFeePercent: Math.max(0, Math.min(50, Number(settings.platformFeePercent ?? 2))),
    updatedAt: serverTimestamp()
  };

  try {
    const snap = await getDoc(doc(db, 'platform_config', 'public'));
    if (!snap.exists()) {
      await setDoc(doc(db, 'platform_config', 'public'), payload);
    } else {
      await updateDoc(doc(db, 'platform_config', 'public'), payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToPlatformConfig(
  onConfigUpdate: (cfg: CloudPublicPlatformConfig) => void
): () => void {
  return onSnapshot(
    doc(db, 'platform_config', 'public'),
    (docSnap) => {
      if (!docSnap.exists()) return;
      const d = docSnap.data();
      onConfigUpdate({
        adSenseConfig: {
          enabled: d.adSenseEnabled !== false,
          publisherId: String(d.adSensePublisherId || ''),
          headerSlotId: String(d.adSenseHeaderSlotId || ''),
          inFeedSlotId: String(d.adSenseInFeedSlotId || ''),
          footerSlotId: String(d.adSenseFooterSlotId || ''),
          autoAdsEnabled: d.adSenseAutoAds !== false,
          showFallbackSponsorPrompt: true
        },
        platformPaymentLink: String(d.platformPaymentLink || ''),
        platformFeePercent: typeof d.platformFeePercent === 'number' ? d.platformFeePercent : 2
      });
    },
    (error) => {
      console.info('Platform public config listener notice:', error?.message || error);
    }
  );
}

export async function savePlatformEarningToCloud(record: PlatformEarningRecord): Promise<void> {
  if (!auth.currentUser || isLegacySimulatedEarning(record)) return;

  await ensureCustomerAccountInFirestore(auth.currentUser, {
    name: record.storeOrUserName || auth.currentUser.displayName || 'Usuario'
  });

  const earningId = sanitizeId(record.id);
  const path = `platform_earnings/${earningId}`;
  const isOwnerAdmin = Boolean(
    auth.currentUser.emailVerified &&
      auth.currentUser.email?.toLowerCase() === ADMIN_OWNER_EMAIL.toLowerCase()
  );

  let existsInCloud = false;
  try {
    const snap = await getDoc(doc(db, 'platform_earnings', earningId));
    existsInCloud = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const dest =
    record.paymentDestination === 'billetera_movil' ||
    record.paymentDestination === 'cuenta_lafise' ||
    record.paymentDestination === 'paypal' ||
    record.paymentDestination === 'digital_link'
      ? record.paymentDestination
      : 'digital_link';

  // Only verified Admin can create directly as 'liquidado'; regular users create as 'pendiente_confirmacion'
  const safeStatus = isOwnerAdmin ? record.status : 'pendiente_confirmacion';

  if (!existsInCloud) {
    const payload: Record<string, unknown> = {
      id: earningId,
      authorId: sanitizeId(auth.currentUser.uid),
      source: record.source,
      title: truncateString(record.title, 180, 'Ingreso de plataforma'),
      amountNIO: Math.max(0, Math.min(1000000, Number(record.amountNIO) || 0)),
      storeOrUserName: truncateString(record.storeOrUserName, 120, 'Tienda'),
      dateLabel: truncateString(record.date || new Date().toLocaleDateString('es-NI'), 60, 'Hoy'),
      status: safeStatus,
      reference: truncateString(record.reference || '', 120, ''),
      paymentDestination: dest,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };
    if (record.targetId) {
      payload.targetId = sanitizeId(record.targetId);
    }
    try {
      await setDoc(doc(db, 'platform_earnings', earningId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else if (isOwnerAdmin) {
    try {
      await updateDoc(doc(db, 'platform_earnings', earningId), {
        status: record.status,
        reference: truncateString(record.reference || '', 120, ''),
        amountNIO: Math.max(0, Math.min(1000000, Number(record.amountNIO) || 0)),
        title: truncateString(record.title, 180, 'Ingreso de plataforma'),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}

export async function updatePlatformEarningStatusInCloud(
  earningId: string,
  status: 'liquidado' | 'pendiente_confirmacion' | 'rechazado',
  reference?: string
): Promise<void> {
  if (!auth.currentUser) return;
  const cleanId = sanitizeId(earningId);
  const path = `platform_earnings/${cleanId}`;
  try {
    const snap = await getDoc(doc(db, 'platform_earnings', cleanId));
    if (!snap.exists()) return;
    const payload: Record<string, unknown> = {
      status,
      updatedAt: serverTimestamp()
    };
    if (reference !== undefined) {
      payload.reference = truncateString(reference, 120, '');
    }
    await updateDoc(doc(db, 'platform_earnings', cleanId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToPlatformEarnings(
  uid: string,
  isAdmin: boolean,
  onEarningsUpdate: (earnings: PlatformEarningRecord[]) => void
): () => void {
  const q = isAdmin
    ? query(collection(db, 'platform_earnings'))
    : query(collection(db, 'platform_earnings'), where('authorId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const loaded: PlatformEarningRecord[] = snapshot.docs
        .map((docSnap) => {
          const d = docSnap.data();
          return {
            id: String(d.id || docSnap.id),
            authorId: d.authorId ? String(d.authorId) : undefined,
            source: d.source as PlatformEarningRecord['source'],
            title: String(d.title || 'Ingreso'),
            amountNIO: Number(d.amountNIO) || 0,
            storeOrUserName: String(d.storeOrUserName || 'Tienda'),
            date: String(d.dateLabel || formatTimestampToIso(d.createdAt)),
            status:
              d.status === 'liquidado' || d.status === 'rechazado'
                ? d.status
                : 'pendiente_confirmacion',
            reference: d.reference ? String(d.reference) : '',
            paymentDestination:
              (d.paymentDestination as PlatformEarningRecord['paymentDestination']) || 'digital_link',
            targetId: d.targetId ? String(d.targetId) : undefined
          } as PlatformEarningRecord;
        })
        .filter((e) => !isLegacySimulatedEarning(e));
      onEarningsUpdate(loaded);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'platform_earnings');
    }
  );
}

export async function savePlatformWithdrawalToCloud(
  method: 'paypal' | 'bank',
  record: PaypalWithdrawalRecord | BankWithdrawalRecord
): Promise<void> {
  if (!auth.currentUser) return;
  if (method === 'paypal' && LEGACY_SIMULATED_PAYPAL_IDS.has(record.id)) return;
  if (method === 'bank' && LEGACY_SIMULATED_BANK_IDS.has(record.id)) return;

  const wId = sanitizeId(record.id);
  const path = `platform_withdrawals/${wId}`;
  const isPaypal = method === 'paypal';
  const ppRec = record as PaypalWithdrawalRecord;
  const bkRec = record as BankWithdrawalRecord;

  const payload = {
    id: wId,
    ownerUid: sanitizeId(auth.currentUser.uid),
    method,
    destination: truncateString(
      isPaypal ? ppRec.paypalEmail : bkRec.accountNumber,
      160,
      'Cuenta registrada'
    ),
    bankName: truncateString(
      isPaypal ? 'PayPal' : bkRec.bankName || 'Banco LAFISE Bancentro',
      100,
      'PayPal'
    ),
    accountHolder: truncateString(
      isPaypal ? auth.currentUser.displayName || 'Propietario' : bkRec.accountHolder || 'Propietario',
      120,
      'Propietario'
    ),
    amountNIO: Math.max(0.01, Math.min(1000000, Number(record.amountNIO) || 0)),
    amountUSD: Math.max(0.01, Math.min(100000, Number(record.amountUSD) || 0)),
    dateLabel: truncateString(record.date || new Date().toLocaleDateString('es-NI'), 60, 'Hoy'),
    status: record.status === 'completado' ? 'completado' : 'solicitado',
    transactionId: truncateString(record.transactionId || `REQ-${Date.now()}`, 120, `REQ-${Date.now()}`),
    sourceBreakdown: truncateString(record.sourceBreakdown || 'Ingresos reales verificados', 200, ''),
    note: truncateString(record.note || '', 300, ''),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, 'platform_withdrawals', wId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updatePlatformWithdrawalInCloud(
  withdrawalId: string,
  status: 'solicitado' | 'completado',
  transactionId: string,
  note?: string
): Promise<void> {
  if (!auth.currentUser) return;
  const cleanId = sanitizeId(withdrawalId);
  const path = `platform_withdrawals/${cleanId}`;
  try {
    const snap = await getDoc(doc(db, 'platform_withdrawals', cleanId));
    if (!snap.exists()) return;
    await updateDoc(doc(db, 'platform_withdrawals', cleanId), {
      status,
      transactionId: truncateString(transactionId, 120, cleanId),
      note: truncateString(note || 'Transferencia confirmada', 300, ''),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToPlatformWithdrawals(
  onWithdrawalsUpdate: (data: {
    paypal: PaypalWithdrawalRecord[];
    bank: BankWithdrawalRecord[];
  }) => void
): () => void {
  const q = query(collection(db, 'platform_withdrawals'));
  return onSnapshot(
    q,
    (snapshot) => {
      const paypal: PaypalWithdrawalRecord[] = [];
      const bank: BankWithdrawalRecord[] = [];
      snapshot.docs.forEach((docSnap) => {
        const d = docSnap.data();
        const id = String(d.id || docSnap.id);
        if (d.method === 'paypal') {
          if (LEGACY_SIMULATED_PAYPAL_IDS.has(id)) return;
          paypal.push({
            id,
            paypalEmail: String(d.destination || ''),
            amountNIO: Number(d.amountNIO) || 0,
            amountUSD: Number(d.amountUSD) || 0,
            date: String(d.dateLabel || formatTimestampToIso(d.createdAt)),
            status: d.status === 'completado' ? 'completado' : 'solicitado',
            transactionId: String(d.transactionId || id),
            sourceBreakdown: d.sourceBreakdown ? String(d.sourceBreakdown) : undefined,
            note: d.note ? String(d.note) : undefined
          });
        } else if (d.method === 'bank') {
          if (LEGACY_SIMULATED_BANK_IDS.has(id)) return;
          bank.push({
            id,
            bankName: String(d.bankName || 'Banco Nacional'),
            accountNumber: String(d.destination || ''),
            accountHolder: String(d.accountHolder || 'Propietario'),
            amountNIO: Number(d.amountNIO) || 0,
            amountUSD: Number(d.amountUSD) || 0,
            date: String(d.dateLabel || formatTimestampToIso(d.createdAt)),
            status: d.status === 'completado' ? 'completado' : 'solicitado',
            transactionId: String(d.transactionId || id),
            sourceBreakdown: d.sourceBreakdown ? String(d.sourceBreakdown) : undefined,
            note: d.note ? String(d.note) : undefined
          });
        }
      });
      onWithdrawalsUpdate({ paypal, bank });
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'platform_withdrawals');
    }
  );
}

export { onAuthStateChanged };
