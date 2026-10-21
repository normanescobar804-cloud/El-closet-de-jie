import { OrderNotification, PriceDropAlert, Product } from '../types';
import {
  createPriceDropNotification,
  getSavedNotifications,
  playNotificationChime,
  saveNotifications,
  triggerBrowserNotification
} from './notifications';

const PRICE_ALERTS_STORAGE_KEY = 'tienda_jiet_price_alerts_v1';

export function getSavedPriceAlerts(): PriceDropAlert[] {
  try {
    const raw = localStorage.getItem(PRICE_ALERTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePriceAlertsToStorage(alerts: PriceDropAlert[]): void {
  try {
    localStorage.setItem(PRICE_ALERTS_STORAGE_KEY, JSON.stringify(alerts.slice(0, 100)));
  } catch (err) {
    console.warn('Error saving price alerts to localStorage:', err);
  }
}

export function savePriceAlert(alert: PriceDropAlert): PriceDropAlert[] {
  const current = getSavedPriceAlerts();
  // If an alert for this product already exists, update it, otherwise prepend
  const exists = current.some((a) => a.productId === alert.productId || a.id === alert.id);
  const updated = exists
    ? current.map((a) => (a.productId === alert.productId || a.id === alert.id ? alert : a))
    : [alert, ...current];

  savePriceAlertsToStorage(updated);
  return updated;
}

export function removePriceAlert(alertIdOrProductId: string): PriceDropAlert[] {
  const current = getSavedPriceAlerts();
  const updated = current.filter(
    (a) => a.id !== alertIdOrProductId && a.productId !== alertIdOrProductId
  );
  savePriceAlertsToStorage(updated);
  return updated;
}

export function getProductPriceAlert(productId: string): PriceDropAlert | undefined {
  const alerts = getSavedPriceAlerts();
  return alerts.find((a) => a.productId === productId);
}

/**
 * Checks all saved price alerts against the current catalog products.
 * If any product's current price is <= alert's targetPrice and hasn't been triggered yet,
 * it creates a price drop notification, plays the chime, triggers browser notification,
 * and marks the alert as triggered.
 */
export function checkAndTriggerPriceAlerts(
  products: Product[],
  currentAlerts?: PriceDropAlert[]
): {
  triggeredAlerts: PriceDropAlert[];
  newNotifications: OrderNotification[];
  updatedAlerts: PriceDropAlert[];
} {
  const alerts = currentAlerts || getSavedPriceAlerts();
  if (alerts.length === 0 || products.length === 0) {
    return { triggeredAlerts: [], newNotifications: [], updatedAlerts: alerts };
  }

  const triggeredAlerts: PriceDropAlert[] = [];
  const newNotifications: OrderNotification[] = [];

  const updatedAlerts = alerts.map((alert) => {
    // Find product in catalog
    const prod = products.find((p) => p.id === alert.productId);
    if (!prod) return alert;

    // Check if price decreased to or below the user's target threshold
    const hasDropped = prod.price <= alert.targetPrice;
    if (hasDropped && !alert.triggered) {
      // Trigger notification
      const notif = createPriceDropNotification(
        prod,
        alert.targetPrice,
        alert.customerUid,
        alert.customerPhone
      );

      triggeredAlerts.push(alert);
      newNotifications.push(notif);

      return {
        ...alert,
        triggered: true,
        triggeredAt: new Date().toISOString(),
        triggeredPrice: prod.price
      };
    }

    return alert;
  });

  if (triggeredAlerts.length > 0) {
    savePriceAlertsToStorage(updatedAlerts);

    // Save and push notifications
    const existingNotifs = getSavedNotifications();
    const mergedNotifs = [...newNotifications, ...existingNotifs];
    saveNotifications(mergedNotifs);

    // Play chime sound and browser notification
    playNotificationChime();
    newNotifications.forEach((n) => {
      triggerBrowserNotification(n.title, n.message);
    });
  }

  return { triggeredAlerts, newNotifications, updatedAlerts };
}
