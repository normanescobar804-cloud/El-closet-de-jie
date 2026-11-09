import React, { useRef } from 'react';
import {
  X,
  Printer,
  FileText,
  MessageCircle,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Building2,
  MapPin,
  Phone,
  User,
  CreditCard,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { CurrencyType, OrderRecord, StoreSettings } from '../types';
import { formatCurrency } from '../utils/storage';
import { generateReceiptPdf } from '../utils/generateReceiptPdf';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderRecord | null;
  storeSettings: StoreSettings;
  currency: CurrencyType;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
  storeSettings,
  currency
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    // Triggers native browser print dialog. @media print styles ensure ONLY the invoice card prints.
    window.print();
  };

  const handleDownloadPdf = () => {
    generateReceiptPdf({
      order,
      storeSettings,
      currency
    });
  };

  const handleShareWhatsApp = () => {
    const lines = [
      `🧾 *FACTURA DE COMPRA - ${storeSettings.storeName.toUpperCase()}*`,
      `*No. de Factura:* #${order.id}`,
      `*Fecha:* ${new Date(order.createdAt).toLocaleDateString('es-NI', { dateStyle: 'medium', timeStyle: 'short' })}`,
      `*Cliente:* ${order.customerName}`,
      `*Teléfono:* ${order.customerPhone}`,
      `*Destino:* ${order.customerCity} - ${order.customerAddress}`,
      order.indriveReference ? `*Ref. inDrive:* ${order.indriveReference}` : '',
      `\n*DETALLE DE PRENDAS:*`,
      ...order.items.map(
        (it, idx) =>
          `${idx + 1}. ${it.quantity}x ${it.productName}${it.selectedSize ? ` (Talla ${it.selectedSize})` : ''} - C$ ${((it.unitPrice || 0) * it.quantity).toFixed(2)}`
      ),
      `\n*TOTAL:* ${formatCurrency(order.total, currency, storeSettings.exchangeRate)}`,
      `*Método de Pago:* ${order.paymentMethod.replace('_', ' ').toUpperCase()}`,
      `*Estado:* ${order.status.toUpperCase()}`,
      `\n¡Gracias por tu preferencia en ${storeSettings.storeName}!`
    ].filter(Boolean);

    const text = encodeURIComponent(lines.join('\n'));
    const phone = (order.customerPhone || storeSettings.whatsappNumber || '50558898311').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('505') ? phone : `505${phone}`;
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const formattedDate = new Date(order.createdAt).toLocaleDateString('es-NI', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Actions Header (Hidden when printing) */}
        <div className="p-4 sm:p-5 bg-stone-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center font-black shadow-sm">
              🧾
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-white leading-tight">
                Factura Oficial de Compra
              </h3>
              <p className="text-[11px] text-stone-400">
                Pedido #{order.id} • Lista para imprimir o guardar en PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="btn-print-invoice-action"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="Mandar a imprimir esta factura a tu impresora"
            >
              <Printer className="w-4 h-4 text-stone-900" />
              <span>Imprimir Factura</span>
            </button>

            <button
              type="button"
              id="btn-download-pdf-invoice-action"
              onClick={handleDownloadPdf}
              className="px-3 py-2 bg-violet-700 hover:bg-violet-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Descargar documento PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar</span> PDF
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Compartir por WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
              title="Cerrar factura"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet Body */}
        <div
          ref={printAreaRef}
          id="printable-invoice-content"
          className="p-6 sm:p-8 overflow-y-auto space-y-6 text-stone-800 bg-white font-sans print:p-0 print:overflow-visible"
        >
          {/* 1. Header / Logo / Invoice Number */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-stone-900">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">👗</span>
                <h1 className="font-serif text-2xl sm:text-3xl font-black text-stone-950 tracking-tight">
                  {storeSettings.storeName.toUpperCase()}
                </h1>
              </div>
              <p className="text-xs font-semibold text-stone-600">
                Tienda de Ropa, Calzado & Peluches Exclusivos • Nicaragua
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                WhatsApp: {storeSettings.whatsappNumber || '+505 5889 8311'} • Atención a Nivel Nacional
              </p>
              {storeSettings.bankAccount && (
                <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                  Cuenta: {storeSettings.bankAccount} ({storeSettings.bankAccountHolder || 'Tienda'})
                </p>
              )}
            </div>

            <div className="text-left sm:text-right bg-stone-50 p-4 rounded-2xl border border-stone-200 min-w-[200px] shrink-0 print:border-stone-400">
              <span className="inline-block px-2.5 py-0.5 bg-violet-700 text-white font-bold text-[10px] tracking-wider uppercase rounded-md mb-1.5">
                COMPROBANTE OFICIAL
              </span>
              <div className="font-mono text-xl sm:text-2xl font-black text-stone-900">
                #{order.id}
              </div>
              <div className="text-xs text-stone-500 mt-1">
                Fecha: <span className="font-semibold text-stone-800">{formattedDate}</span>
              </div>
              <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 sm:justify-end mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Estado: {order.status.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* 2. Bill To & Shipping Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Customer Info */}
            <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-1.5">
              <span className="font-bold text-[10px] uppercase text-stone-500 tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-stone-400" />
                <span>Datos del Cliente / Facturar A:</span>
              </span>
              <p className="font-bold text-sm text-stone-900">
                {order.customerName}
              </p>
              <p className="text-stone-600 flex items-center gap-1 font-mono">
                <Phone className="w-3 h-3 text-stone-400" />
                <span>{order.customerPhone}</span>
              </p>
              <p className="text-stone-600 flex items-start gap-1">
                <MapPin className="w-3 h-3 text-stone-400 mt-0.5 shrink-0" />
                <span>{order.customerCity || 'Managua'}, Nicaragua</span>
              </p>
            </div>

            {/* Delivery & Payment Method Info */}
            <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-1.5">
              <span className="font-bold text-[10px] uppercase text-stone-500 tracking-wider flex items-center gap-1">
                <Truck className="w-3 h-3 text-stone-400" />
                <span>Dirección de Entrega & Pago:</span>
              </span>
              <p className="text-stone-800 font-medium leading-relaxed">
                {order.customerAddress || 'Entrega acordada con el cliente'}
              </p>
              {order.indriveReference && (
                <p className="text-[11px] text-violet-800 font-semibold bg-violet-50 p-1.5 rounded-lg border border-violet-200/60">
                  📍 Punto inDrive: {order.indriveReference}
                </p>
              )}
              <div className="pt-1 flex items-center justify-between text-[11px] text-stone-600 border-t border-stone-200/60">
                <span>Método de Pago:</span>
                <span className="font-bold text-stone-900 uppercase">
                  {order.paymentMethod.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Products Breakdown Table */}
          <div className="overflow-x-auto border border-stone-200 rounded-2xl shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-900 text-white font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Descripción de la Prenda</th>
                  <th className="py-2.5 px-3 text-center">Talla</th>
                  <th className="py-2.5 px-3 text-center">Color</th>
                  <th className="py-2.5 px-3">Tienda / Boutique</th>
                  <th className="py-2.5 px-3 text-center">Cant.</th>
                  <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                  <th className="py-2.5 px-3 text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-stone-800">
                {order.items.map((item, index) => {
                  const lineTotal = (item.unitPrice || 0) * (item.quantity || 1);
                  return (
                    <tr key={index} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-stone-400">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-stone-900">
                          {item.productName}
                        </div>
                        <span className="text-[10px] text-stone-500">
                          Ref: #{item.productId.slice(0, 8)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-stone-700">
                        {item.selectedSize ? (
                          <span className="px-2 py-0.5 bg-stone-100 rounded-md font-mono text-[11px]">
                            {item.selectedSize}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-stone-700">
                        {item.selectedColor || 'Estándar'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-violet-700">
                        {item.sellerName || storeSettings.storeName}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-stone-900 font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-stone-700">
                        {formatCurrency(item.unitPrice || 0, currency, storeSettings.exchangeRate)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-stone-950">
                        {formatCurrency(lineTotal, currency, storeSettings.exchangeRate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 4. Totals and Signatures */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-2">
            {/* Security Guarantee & QR simulation */}
            <div className="space-y-3 max-w-sm text-xs">
              <div className="flex items-center gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="w-12 h-12 bg-white rounded-xl border border-stone-300 flex items-center justify-center p-1 shrink-0">
                  <QrCode className="w-10 h-10 text-stone-800" />
                </div>
                <div>
                  <span className="font-bold text-stone-900 block text-[11px]">
                    Factura Verificada Digitalmente
                  </span>
                  <span className="text-[10px] text-stone-500 leading-tight block mt-0.5">
                    Comprobante válido para cambios dentro de 7 días presentando prenda con su etiqueta original.
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-stone-400">
                Emitido por la plataforma <strong className="text-stone-600">{storeSettings.storeName}</strong> • Todos los derechos reservados.
              </div>
            </div>

            {/* Calculations Box */}
            <div className="w-full sm:w-72 bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs space-y-2">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold text-stone-900">
                  {formatCurrency(order.subtotal, currency, storeSettings.exchangeRate)}
                </span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Descuento aplicado:</span>
                  <span className="font-mono">
                    -{formatCurrency(order.discount, currency, storeSettings.exchangeRate)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-stone-600">
                <span>Envío / Delivery:</span>
                <span className="font-mono font-semibold text-stone-900">
                  {order.shipping > 0
                    ? formatCurrency(order.shipping, currency, storeSettings.exchangeRate)
                    : 'Gratis'}
                </span>
              </div>

              <div className="pt-2 border-t-2 border-stone-300 flex justify-between items-center text-sm font-black text-stone-950">
                <span>TOTAL A PAGAR:</span>
                <span className="font-mono text-base text-violet-950">
                  {formatCurrency(order.total, currency, storeSettings.exchangeRate)}
                </span>
              </div>

              <div className="text-right text-[10px] text-stone-400 font-mono">
                Equivalente: $ {(order.total / (storeSettings.exchangeRate || 36.65)).toFixed(2)} USD
              </div>
            </div>
          </div>

          {/* Footer Thank You Banner */}
          <div className="pt-6 border-t border-stone-200 text-center text-xs text-stone-500 space-y-1 print:pt-4">
            <p className="font-bold text-stone-800">
              ¡Muchas gracias por su preferencia en {storeSettings.storeName}!
            </p>
            <p className="text-[11px] text-stone-400">
              Para cualquier consulta sobre este pedido o entrega en inDrive / Encomienda, contáctanos a nuestro WhatsApp oficial: {storeSettings.whatsappNumber || '+505 5889 8311'}.
            </p>
          </div>
        </div>

        {/* Modal Footer (Hidden when printing) */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 print:hidden shrink-0">
          <span className="text-xs text-stone-500 font-medium hidden sm:inline">
            🖨️ Presiona <strong>"Imprimir Factura"</strong> para imprimir en papel o guardar como PDF.
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
