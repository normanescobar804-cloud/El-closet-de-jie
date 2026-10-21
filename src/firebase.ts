import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
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
import firebaseConfig from './firebase-applet-config.json';
import {
  AdPlanId,
  BusinessAd,
  CurrencyType,
  OrderNotification,
  OrderRecord,
  PaymentMethodType,
  PaymentStatusType,
  Product,
  UserAccount
} from './types';

// Initialize Firebase App, Firestore Database, and Auth
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
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
export async function signInCustomerWithGoogle(): Promise<UserAccount> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;
  return await ensureCustomerAccountInFirestore(fbUser);
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

  if (!existingPublic) {
    try {
      await setDoc(doc(db, 'users', uid), {
        uid,
        displayName,
        city,
        favoritesCsv,
        loyaltyPoints: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, publicPath);
    }
  } else if (overrides?.name || overrides?.city || favorites.length > 0) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        displayName,
        city,
        favoritesCsv,
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
    photoURL: fbUser.photoURL || undefined,
    city,
    department: overrides?.department || city,
    storeName: overrides?.storeName || displayName,
    address,
    preferredPaymentMethod: fromCloudPaymentMethod(cloudPayMethod),
    role: isAdmin ? 'admin' : 'seller',
    isLoggedIn: true,
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
      if (snapshot.empty) return;
      const loaded: Product[] = snapshot.docs.map((docSnap) => {
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
        };
      });
      onProductsLoaded(loaded);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
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
      if (snapshot.empty) return;
      const loaded: BusinessAd[] = snapshot.docs.map((docSnap) => {
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
        };
      });
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

export { onAuthStateChanged };
