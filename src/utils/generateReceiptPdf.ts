import { jsPDF } from 'jspdf';
import { CurrencyType, OrderRecord, StoreSettings } from '../types';
import { formatCurrency } from './storage';
import { getPaymentMethodBadge, getPaymentStatusBadge } from './paymentGateways';

export interface GenerateReceiptOptions {
  order: OrderRecord;
  storeSettings: StoreSettings;
  currency?: CurrencyType;
}

export function generateReceiptPdf({
  order,
  storeSettings,
  currency = 'cordobas'
}: GenerateReceiptOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors palette
  const primaryColor: [number, number, number] = [109, 40, 217]; // Violet 700
  const primaryLight: [number, number, number] = [245, 243, 255]; // Violet 50
  const darkColor: [number, number, number] = [28, 25, 23]; // Stone 900
  const grayColor: [number, number, number] = [120, 113, 108]; // Stone 500
  const lightGray: [number, number, number] = [245, 245, 244]; // Stone 100
  const borderColor: [number, number, number] = [229, 231, 235]; // Stone 200
  const emeraldColor: [number, number, number] = [5, 150, 105]; // Emerald 600

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, y, contentWidth, 26, 3, 3, 'F');

  // Brand Name & Tagline
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(storeSettings.storeName.toUpperCase(), margin + 6, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('MODA Y CALIDAD PARA NIÑOS, JÓVENES Y FAMILIAS • NICARAGUA', margin + 6, y + 16);
  doc.text(
    `WhatsApp: ${storeSettings.whatsappNumber || '+505 5889 8311'}  •  Atención en todo el país`,
    margin + 6,
    y + 21
  );

  // Receipt Badge on Right Header
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - margin - 52, y + 5, 46, 16, 2, 2, 'F');
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('COMPROBANTE', pageWidth - margin - 29, y + 11.5, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('DE COMPRA', pageWidth - margin - 29, y + 16.5, { align: 'center' });

  y += 32;

  // 2. Order Meta Box & Status Summary
  doc.setFillColor(...lightGray);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  // Left side: Order Code & Date
  doc.setTextColor(...grayColor);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('NO. DE PEDIDO', margin + 5, y + 6);
  doc.setTextColor(...darkColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`#${order.id}`, margin + 5, y + 12);

  doc.setTextColor(...grayColor);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  const formattedDate = new Date(order.createdAt).toLocaleDateString('es-NI', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Fecha: ${formattedDate}`, margin + 5, y + 19);

  // Middle: Payment Status
  const payBadge = getPaymentMethodBadge(order.paymentMethod);
  const payStatusBadge = getPaymentStatusBadge(order.paymentStatus);

  doc.setTextColor(...grayColor);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('MÉTODO DE PAGO', margin + 68, y + 6);
  doc.setTextColor(...darkColor);
  doc.setFontSize(8.5);
  doc.text(payBadge.label, margin + 68, y + 12);

  if (order.paymentReference) {
    doc.setTextColor(...grayColor);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ref: ${order.paymentReference.slice(0, 24)}`, margin + 68, y + 19);
  } else {
    doc.setTextColor(...emeraldColor);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(payStatusBadge.label, margin + 68, y + 19);
  }

  // Right side: Order Status & Total
  doc.setTextColor(...grayColor);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL DE LA COMPRA', pageWidth - margin - 5, y + 6, { align: 'right' });
  doc.setTextColor(...primaryColor);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  const formattedTotal = formatCurrency(order.total, order.currency || currency, storeSettings.exchangeRate);
  doc.text(formattedTotal, pageWidth - margin - 5, y + 13, { align: 'right' });

  doc.setTextColor(...emeraldColor);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  const statusLabel =
    order.status === 'entregado'
      ? '✓ Entregado'
      : order.status === 'enviado'
      ? 'En camino'
      : order.status === 'en_preparacion'
      ? 'En preparación'
      : 'Pendiente de confirmación';
  doc.text(statusLabel, pageWidth - margin - 5, y + 19, { align: 'right' });

  y += 29;

  // 3. Customer & Delivery Address Card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'FD');

  doc.setTextColor(...primaryColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL CLIENTE Y ENVÍO', margin + 5, y + 6);

  doc.setTextColor(...darkColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(order.customerName || 'Cliente Particular', margin + 5, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  const contactLine = [
    order.customerPhone ? `Tel/WhatsApp: ${order.customerPhone}` : null,
    order.customerEmail ? `Correo: ${order.customerEmail}` : null
  ]
    .filter(Boolean)
    .join('  •  ');
  doc.text(contactLine || 'Sin datos de contacto directos', margin + 5, y + 17);

  const deliveryType =
    order.deliveryMethod === 'indrive'
      ? 'Envío Express inDrive'
      : order.deliveryMethod === 'departamental'
      ? 'Envío Departamental'
      : 'Retiro en Tienda Física';

  const addressLine = `Entrega: ${deliveryType}  •  ${order.customerAddress || 'Retiro en tienda física'} (${order.customerCity || 'Nicaragua'})`;
  const truncatedAddress = doc.splitTextToSize(addressLine, contentWidth - 10);
  doc.text(truncatedAddress[0] || addressLine, margin + 5, y + 23);

  y += 33;

  // 4. Products Table
  doc.setFillColor(...primaryLight);
  doc.roundedRect(margin, y, contentWidth, 8, 1, 1, 'F');

  doc.setTextColor(...primaryColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  // Column headers
  const colItemX = margin + 4;
  const colQtyX = margin + 110;
  const colUnitPriceX = margin + 135;
  const colTotalX = pageWidth - margin - 4;

  doc.text('DESCRIPCIÓN DE LA PRENDA / ARTÍCULO', colItemX, y + 5.5);
  doc.text('CANT', colQtyX, y + 5.5, { align: 'center' });
  doc.text('PRECIO UNIT.', colUnitPriceX, y + 5.5, { align: 'right' });
  doc.text('IMPORTE', colTotalX, y + 5.5, { align: 'right' });

  y += 10;

  // Item rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  order.items.forEach((item, index) => {
    // Check if new page needed
    if (y > pageHeight - 45) {
      doc.addPage();
      y = margin;
    }

    const rowBg = index % 2 === 0 ? 255 : 250;
    doc.setFillColor(rowBg, rowBg, rowBg);
    doc.rect(margin, y, contentWidth, 9, 'F');

    // Item Title
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'bold');
    const truncatedName =
      item.productName.length > 48
        ? `${item.productName.slice(0, 46)}...`
        : item.productName;
    doc.text(truncatedName, colItemX, y + 4.5);

    // Size / Color / Seller subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...grayColor);
    const itemDetails = [
      item.size ? `Talla: ${item.size}` : null,
      item.color ? `Color: ${item.color}` : null,
      item.sellerName ? `Vendedor: ${item.sellerName}` : null
    ]
      .filter(Boolean)
      .join('  |  ');
    doc.text(itemDetails || 'Prenda única de catálogo', colItemX, y + 8);

    // Qty
    doc.setFontSize(8);
    doc.setTextColor(...darkColor);
    doc.text(String(item.quantity), colQtyX, y + 6, { align: 'center' });

    // Unit Price
    const unitPrice = formatCurrency(
      item.price,
      order.currency || currency,
      storeSettings.exchangeRate
    );
    doc.text(unitPrice, colUnitPriceX, y + 6, { align: 'right' });

    // Total Line
    doc.setFont('helvetica', 'bold');
    const lineTotal = formatCurrency(
      item.price * item.quantity,
      order.currency || currency,
      storeSettings.exchangeRate
    );
    doc.text(lineTotal, colTotalX, y + 6, { align: 'right' });

    y += 9.5;
  });

  // Table bottom border
  doc.setDrawColor(...borderColor);
  doc.line(margin, y, pageWidth - margin, y);

  y += 4;

  // 5. Totals Breakdown Card (aligned to the right)
  const totalsBoxWidth = 85;
  const totalsBoxX = pageWidth - margin - totalsBoxWidth;

  doc.setFillColor(...lightGray);
  doc.roundedRect(totalsBoxX, y, totalsBoxWidth, 34, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.setFont('helvetica', 'normal');

  // Subtotal
  doc.text('Subtotal prendas:', totalsBoxX + 4, y + 6);
  doc.setTextColor(...darkColor);
  const formattedSubtotal = formatCurrency(
    order.subtotal,
    order.currency || currency,
    storeSettings.exchangeRate
  );
  doc.text(formattedSubtotal, pageWidth - margin - 4, y + 6, { align: 'right' });

  // Discount (if any)
  if (order.discount > 0) {
    doc.setTextColor(225, 29, 72); // Rose 600
    doc.text('Descuento aplicado:', totalsBoxX + 4, y + 12);
    const formattedDiscount = `-${formatCurrency(
      order.discount,
      order.currency || currency,
      storeSettings.exchangeRate
    )}`;
    doc.text(formattedDiscount, pageWidth - margin - 4, y + 12, { align: 'right' });
  } else {
    doc.setTextColor(...grayColor);
    doc.text('Descuentos:', totalsBoxX + 4, y + 12);
    doc.text('C$ 0.00', pageWidth - margin - 4, y + 12, { align: 'right' });
  }

  // Shipping
  doc.setTextColor(...grayColor);
  doc.text('Costo de envío:', totalsBoxX + 4, y + 18);
  doc.setTextColor(...darkColor);
  const formattedShipping =
    order.shipping === 0
      ? '¡Gratis!'
      : formatCurrency(order.shipping, order.currency || currency, storeSettings.exchangeRate);
  doc.text(formattedShipping, pageWidth - margin - 4, y + 18, { align: 'right' });

  // Divider inside totals
  doc.setDrawColor(...borderColor);
  doc.line(totalsBoxX + 4, y + 21, pageWidth - margin - 4, y + 21);

  // Grand Total
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', totalsBoxX + 4, y + 28);
  doc.text(formattedTotal, pageWidth - margin - 4, y + 28, { align: 'right' });

  // Left side: Important notes and warranty
  doc.setFillColor(...primaryLight);
  doc.roundedRect(margin, y, contentWidth - totalsBoxWidth - 6, 34, 2, 2, 'F');

  doc.setTextColor(...primaryColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('POLÍTICAS Y GARANTÍA DE SATISFACCIÓN', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...darkColor);
  doc.text('• Revisa tus prendas al momento de recibirlas con tu repartidor.', margin + 4, y + 11.5);
  doc.text('• Tienes hasta 48 horas para cambios de talla en prendas seleccionadas.', margin + 4, y + 16.5);
  doc.text('• Conserva este comprobante digital o su código para cualquier consulta.', margin + 4, y + 21.5);
  doc.text(
    `• Dudas o seguimiento: WhatsApp oficial al ${storeSettings.whatsappNumber || '+505 5889 8311'}.`,
    margin + 4,
    y + 26.5
  );

  y += 42;

  // 6. Security Footer & Verification Seal
  doc.setDrawColor(...borderColor);
  doc.line(margin, y, pageWidth - margin, y);

  doc.setTextColor(...grayColor);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Documento electrónico generado automáticamente por la plataforma de ${storeSettings.storeName}.`,
    margin,
    y + 5
  );
  doc.text(
    `Folio digital: ${order.id} • Emisión: ${new Date().toLocaleString('es-NI')} • Válido en toda Nicaragua`,
    margin,
    y + 9
  );
  doc.text('Página 1 de 1', pageWidth - margin, y + 7, { align: 'right' });

  // 7. Trigger download
  const filename = `Recibo_Pedido_${order.id}.pdf`;
  doc.save(filename);
}
