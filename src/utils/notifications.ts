import { OrderNotification, OrderRecord, PaymentStatusType, Product } from '../types';

const NOTIFICATIONS_STORAGE_KEY = 'tienda_jiet_notifications_v2';
const SOUND_ENABLED_KEY = 'tienda_jiet_notif_sound_v2';

export function getSavedNotifications(): OrderNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveNotifications(notifications: OrderNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications.slice(0, 100)));
  } catch (err) {
    console.warn('Error saving notifications to localStorage:', err);
  }
}

export function isNotificationSoundEnabled(): boolean {
  try {
    const val = localStorage.getItem(SOUND_ENABLED_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setNotificationSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
  } catch {
    // ignore
  }
}

/**
 * Synthesizes a clean, pleasant 2-tone chime using the Web Audio API
 * so notifications never rely on fragile external audio files.
 */
export function playNotificationChime(): void {
  if (!isNotificationSoundEnabled()) return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    // Pleasant major third interval (E5 -> G#5)
    osc1.frequency.setValueAtTime(659.25, now);
    osc1.frequency.setValueAtTime(830.61, now + 0.11);

    osc2.frequency.setValueAtTime(329.63, now);
    osc2.frequency.setValueAtTime(415.30, now + 0.11);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.38);
    osc2.stop(now + 0.38);
  } catch {
    // Ignore if browser autoplay policy blocks audio prior to interaction
  }
}

export function triggerBrowserNotification(title: string, body: string): void {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/portada.jpg'
      });
    }
  } catch {
    // Ignore on unsupported mobile browsers
  }
}

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  try {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch {
    return false;
  }
}

export function buildOrderStatusNotificationCopy(
  order: OrderRecord,
  newStatus: OrderRecord['status']
): { title: string; message: string } {
  const code = `#${order.id}`;
  switch (newStatus) {
    case 'en_preparacion':
      return {
        title: `Pedido ${code} en preparación`,
        message: `Hola ${order.customerName}, estamos empacando tus prendas de El Clóset de Jié con mucho cuidado.`
      };
    case 'enviado':
      return {
        title: `¡Pedido ${code} en camino!`,
        message: `Tu paquete (${order.items.length} prenda${order.items.length !== 1 ? 's' : ''}) ya salió a ruta de entrega.`
      };
    case 'entregado':
      return {
        title: `Pedido ${code} entregado con éxito`,
        message: `¡Gracias por tu compra, ${order.customerName}! Tu pedido ha sido marcado como entregado.`
      };
    case 'pendiente':
    default:
      return {
        title: `Pedido ${code} registrado`,
        message: `Recibimos tu pedido por C$ ${order.total.toFixed(2)}. Pronto confirmaremos tu envío.`
      };
  }
}

export function buildPaymentStatusNotificationCopy(
  order: OrderRecord,
  paymentStatus: PaymentStatusType
): { title: string; message: string } {
  const code = `#${order.id}`;
  switch (paymentStatus) {
    case 'pagado':
      return {
        title: `Pago verificado en pedido ${code}`,
        message: `Confirmamos la recepción de tu pago (${order.paymentReference || 'Verificado'}). ¡Gracias por tu compra!`
      };
    case 'verificando':
      return {
        title: `Comprobante recibido para ${code}`,
        message: `Estamos verificando la referencia de pago ${order.paymentReference || ''} de tu pedido.`
      };
    case 'reembolsado':
      return {
        title: `Reembolso aplicado en ${code}`,
        message: `El pago correspondiente al pedido ${code} fue marcado como reembolsado.`
      };
    case 'pendiente':
    default:
      return {
        title: `Pago pendiente en pedido ${code}`,
        message: `Recuerda adjuntar tu referencia de pago o coordinar por WhatsApp.`
      };
  }
}

export function createOrderNotification(
  order: OrderRecord,
  type: 'order_created' | 'status_changed' | 'payment_verified' | 'promo' = 'order_created',
  recipientRole: 'customer' | 'admin' | 'all' = 'all'
): OrderNotification {
  let title = `Pedido #${order.id}`;
  let message = `Nuevo pedido de ${order.customerName} por C$ ${order.total.toFixed(2)}`;

  if (type === 'status_changed' && order.status) {
    const copy = buildOrderStatusNotificationCopy(order, order.status);
    title = copy.title;
    message = copy.message;
  } else if (type === 'payment_verified' && order.paymentStatus) {
    const copy = buildPaymentStatusNotificationCopy(order, order.paymentStatus);
    title = copy.title;
    message = copy.message;
  }

  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    orderId: order.id,
    recipientRole,
    recipientPhone: order.customerPhone,
    recipientUid: order.customerUid,
    type,
    title,
    message,
    orderStatus: order.status,
    paymentStatus: order.paymentStatus,
    read: false,
    createdAt: new Date().toISOString()
  };
}

export function createPriceDropNotification(
  product: Product,
  targetPrice: number,
  recipientUid?: string,
  recipientPhone?: string
): OrderNotification {
  return {
    id: `notif-pd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    orderId: product.id,
    productId: product.id,
    price: product.price,
    targetPrice,
    recipientRole: 'customer',
    recipientUid,
    recipientPhone,
    type: 'price_drop',
    title: `🏷️ ¡Bajó de precio: ${product.name}!`,
    message: `¡Buenas noticias! ${product.name} ahora cuesta C$ ${product.price.toFixed(2)} (alcanzó tu meta deseada de C$ ${targetPrice.toFixed(2)}). ¡Aprovecha antes de que se agote!`,
    read: false,
    createdAt: new Date().toISOString()
  };
}

export function markNotificationAsRead(
  arg1: string | OrderNotification[],
  arg2?: string
): OrderNotification[] {
  let id: string;
  let list: OrderNotification[];

  if (typeof arg1 === 'string') {
    id = arg1;
    list = getSavedNotifications();
  } else {
    list = arg1;
    id = arg2 || '';
  }

  const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(updated);
  return updated;
}

export function markAllNotificationsAsRead(notifications?: OrderNotification[]): OrderNotification[] {
  const list = notifications || getSavedNotifications();
  const updated = list.map((n) => ({ ...n, read: true }));
  saveNotifications(updated);
  return updated;
}

