import { CurrencyType, OrderRecord, StoreSettings } from '../types';
import { getPaymentMethodBadge, getPaymentStatusBadge } from './paymentGateways';

function escapeCsv(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export function exportOrdersToCsv(
  orders: OrderRecord[],
  storeSettings?: StoreSettings,
  defaultCurrency: CurrencyType = 'cordobas'
): { success: boolean; filename: string; count: number } {
  if (!orders || orders.length === 0) {
    return { success: false, filename: '', count: 0 };
  }

  const headers = [
    'No. Pedido',
    'Fecha y Hora',
    'Estado del Pedido',
    'Estado del Pago',
    'Método de Pago',
    'Referencia de Pago',
    'Método de Entrega',
    'Nombre del Cliente',
    'Teléfono / WhatsApp',
    'Correo Electrónico',
    'Dirección de Entrega',
    'Ciudad / Departamento',
    'Total de Prendas',
    'Detalle de Prendas Compradas',
    'Subtotal (C$)',
    'Descuento (C$)',
    'Costo de Envío (C$)',
    'Total Pagado (C$)',
    'Moneda'
  ];

  const rows = orders.map((order) => {
    // Delivery status in clean text
    const statusText =
      order.status === 'entregado'
        ? 'Entregado con éxito'
        : order.status === 'enviado'
        ? 'En camino'
        : order.status === 'en_preparacion'
        ? 'En preparación'
        : 'Pendiente de confirmación';

    // Payment badges
    const payBadge = getPaymentMethodBadge(order.paymentMethod);
    const payStatusBadge = getPaymentStatusBadge(order.paymentStatus);

    // Delivery method
    const deliveryText =
      order.deliveryMethod === 'indrive'
        ? 'inDrive Express (Managua / Departamentos)'
        : order.deliveryMethod === 'departamental'
        ? 'Envío Departamental'
        : 'Retiro en Tienda Física';

    // Total quantity of items
    const totalQty = order.items.reduce((sum, it) => sum + (it.quantity || 1), 0);

    // Formatted items breakdown
    const itemsDescription = order.items
      .map((it) => {
        const details = [
          it.size ? `Talla: ${it.size}` : '',
          it.color ? `Color: ${it.color}` : '',
          it.sellerName ? `Tienda: ${it.sellerName}` : ''
        ]
          .filter(Boolean)
          .join(', ');
        return `${it.quantity}x ${it.productName}${details ? ` (${details})` : ''} - C$ ${(it.price * it.quantity).toFixed(2)}`;
      })
      .join(' | ');

    // Date
    let dateFormatted = order.createdAt;
    try {
      const d = new Date(order.createdAt);
      dateFormatted = d.toLocaleString('es-NI', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      // keep raw createdAt
    }

    return [
      escapeCsv(order.id),
      escapeCsv(dateFormatted),
      escapeCsv(statusText),
      escapeCsv(payStatusBadge.label),
      escapeCsv(payBadge.label),
      escapeCsv(order.paymentReference || 'N/A'),
      escapeCsv(deliveryText),
      escapeCsv(order.customerName || 'Cliente'),
      escapeCsv(order.customerPhone || ''),
      escapeCsv(order.customerEmail || ''),
      escapeCsv(order.customerAddress || ''),
      escapeCsv(order.customerCity || 'Nicaragua'),
      escapeCsv(totalQty),
      escapeCsv(itemsDescription),
      escapeCsv(order.subtotal?.toFixed(2) ?? '0.00'),
      escapeCsv(order.discount?.toFixed(2) ?? '0.00'),
      escapeCsv(order.shipping === 0 ? '0.00 (Gratis)' : order.shipping?.toFixed(2) ?? '0.00'),
      escapeCsv(order.total?.toFixed(2) ?? '0.00'),
      escapeCsv(order.currency || defaultCurrency)
    ].join(',');
  });

  // UTF-8 BOM (\uFEFF) ensures Excel correctly recognizes UTF-8 accented characters
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  const timestamp = new Date().toISOString().slice(0, 10);
  const storeSlug = (storeSettings?.storeName || 'Tienda')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  const filename = `Historial_Pedidos_${storeSlug}_${timestamp}.csv`;

  a.href = url;
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { success: true, filename, count: orders.length };
}
