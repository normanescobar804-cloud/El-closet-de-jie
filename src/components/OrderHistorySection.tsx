import React, { useState, useMemo } from 'react';
import {
  Package,
  PackageCheck,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  Copy,
  Check,
  RotateCcw,
  MessageCircle,
  ShoppingBag,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  CreditCard,
  FileText,
  Download,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';
import { CurrencyType, OrderRecord, Product, StoreSettings } from '../types';
import { formatCurrency } from '../utils/storage';
import { getPaymentMethodBadge, getPaymentStatusBadge } from '../utils/paymentGateways';
import { generateReceiptPdf } from '../utils/generateReceiptPdf';
import { exportOrdersToCsv } from '../utils/exportOrdersCsv';

interface OrderHistorySectionProps {
  orders: OrderRecord[];
  products?: Product[];
  currency: CurrencyType;
  storeSettings: StoreSettings;
  onCloseModal?: () => void;
  onAddToCart?: (product: Product, size?: string, color?: string, quantity?: number) => void;
  onReorderAll?: (order: OrderRecord) => void;
}

export const OrderHistorySection: React.FC<OrderHistorySectionProps> = ({
  orders,
  products = [],
  currency,
  storeSettings,
  onCloseModal,
  onAddToCart,
  onReorderAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | OrderRecord['status']>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [reorderSuccessId, setReorderSuccessId] = useState<string | null>(null);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [pdfSuccessId, setPdfSuccessId] = useState<string | null>(null);
  const [csvExportSuccess, setCsvExportSuccess] = useState(false);

  // Status mapping and configuration
  const STATUS_CONFIG: Record<
    OrderRecord['status'],
    {
      label: string;
      step: number;
      badgeClass: string;
      icon: React.ComponentType<{ className?: string }>;
      description: string;
    }
  > = {
    pendiente: {
      label: 'Pendiente de confirmación',
      step: 1,
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300/80',
      icon: Clock,
      description: 'Tu pedido fue registrado y estamos confirmando la disponibilidad de las prendas.'
    },
    en_preparacion: {
      label: 'En preparación',
      step: 2,
      badgeClass: 'bg-sky-100 text-sky-900 border-sky-300/80',
      icon: PackageCheck,
      description: 'Estamos empacando tus prendas y alistando el paquete con mucho cuidado.'
    },
    enviado: {
      label: 'En camino',
      step: 3,
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-300/80',
      icon: Truck,
      description: 'Tu paquete ya está en ruta con el repartidor o servicio de encomienda.'
    },
    entregado: {
      label: 'Entregado con éxito',
      step: 4,
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300/80',
      icon: CheckCircle2,
      description: '¡Tu pedido fue entregado! Muchas gracias por confiar en El Clóset de Jié.'
    }
  };

  // Copy Order ID to clipboard
  const handleCopyOrderId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2500);
  };

  // Generate & Download PDF Receipt
  const handleDownloadReceipt = (order: OrderRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setGeneratingPdfId(order.id);
      generateReceiptPdf({
        order,
        storeSettings,
        currency
      });
      setPdfSuccessId(order.id);
      setTimeout(() => setPdfSuccessId(null), 3500);
    } catch (err) {
      console.error('Error al generar recibo en PDF:', err);
    } finally {
      setTimeout(() => setGeneratingPdfId(null), 600);
    }
  };

  // Export orders to CSV spreadsheet
  const handleExportCsv = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const ordersToExport = filteredOrders.length > 0 ? filteredOrders : orders;
    const result = exportOrdersToCsv(ordersToExport, storeSettings, currency);
    if (result.success) {
      setCsvExportSuccess(true);
      setTimeout(() => setCsvExportSuccess(false), 4500);
    }
  };

  // Open WhatsApp to inquire about this order
  const handleInquireWhatsApp = (order: OrderRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let rawNumber = storeSettings.whatsappNumber.replace(/\D/g, '');
    if (rawNumber.length === 8) {
      rawNumber = `505${rawNumber}`;
    }
    if (!rawNumber) rawNumber = '50558898311';

    const message = `¡Hola ${storeSettings.storeName}! 👋\nQuisiera consultar el estado de mi pedido con código *#${order.id}* realizado a nombre de *${order.customerName}* por un total de *${formatCurrency(order.total, order.currency, storeSettings.exchangeRate)}*.\n¿Me podrían dar información de mi entrega? ¡Muchas gracias!`;

    const url = `https://wa.me/${rawNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Handle re-ordering items from this order
  const handleReorder = (order: OrderRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onReorderAll) {
      onReorderAll(order);
    } else if (onAddToCart) {
      order.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId) || {
          id: item.productId,
          name: item.productName,
          price: item.price,
          category: 'Catálogo',
          description: '',
          images: [],
          sizes: item.size ? [item.size] : ['Única'],
          colors: item.color ? [item.color] : ['Original'],
          inStock: true,
          createdAt: Date.now()
        };
        onAddToCart(prod, item.size, item.color, item.quantity);
      });
    }

    setReorderSuccessId(order.id);
    setTimeout(() => setReorderSuccessId(null), 3500);
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (selectedStatusFilter !== 'all' && order.status !== selectedStatusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = order.id.toLowerCase().includes(q);
        const matchesName = order.customerName.toLowerCase().includes(q);
        const matchesPhone = order.customerPhone.includes(q);
        const matchesItem = order.items.some(i => i.productName.toLowerCase().includes(q));
        return matchesId || matchesName || matchesPhone || matchesItem;
      }
      return true;
    });
  }, [orders, selectedStatusFilter, searchQuery]);

  // Format order date nicely
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-NI', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Search / Filters Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h4 className="font-serif text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-violet-700" />
              <span>Historial de Pedidos</span>
              <span className="text-xs font-sans font-bold bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full">
                {orders.length}
              </span>
            </h4>
            <p className="text-xs text-stone-500 mt-0.5">
              Seguimiento en vivo de entrega, método de pago y detalle de tus compras.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Search Box */}
            <div className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por # o prenda..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-stone-100 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-1 focus:ring-violet-200"
              />
            </div>

            {/* Exportar historial de pedidos a CSV Button */}
            {orders.length > 0 && (
              <button
                type="button"
                id="btn-export-orders-csv"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                title="Descargar historial de pedidos en archivo CSV para Excel u Hojas de Cálculo"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">Exportar historial a CSV</span>
                <span className="sm:hidden">Exportar CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* CSV Export Success Banner */}
        {csvExportSuccess && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center justify-between gap-2 font-medium animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Se descargó tu historial de pedidos en formato <strong>CSV</strong> (compatible con Excel y Google Sheets).</span>
            </div>
            <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">CSV Listo</span>
          </div>
        )}

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedStatusFilter === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            Todos ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('pendiente')}
            className={`px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedStatusFilter === 'pendiente'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pendientes</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('en_preparacion')}
            className={`px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedStatusFilter === 'en_preparacion'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200/80'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>En preparación</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('enviado')}
            className={`px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedStatusFilter === 'enviado'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200/80'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>En camino</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('entregado')}
            className={`px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedStatusFilter === 'entregado'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Entregados</span>
          </button>
        </div>
      </div>

      {/* Orders List Container */}
      {filteredOrders.length === 0 ? (
        <div className="py-12 px-4 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-200/60 flex items-center justify-center text-stone-400">
            <Package className="w-7 h-7" />
          </div>
          <div className="max-w-xs mx-auto">
            <h5 className="font-semibold text-stone-800 text-sm">
              {searchQuery || selectedStatusFilter !== 'all'
                ? 'No se encontraron pedidos con ese filtro'
                : 'Aún no tienes pedidos registrados'}
            </h5>
            <p className="text-xs text-stone-500 mt-1">
              {searchQuery || selectedStatusFilter !== 'all'
                ? 'Prueba borrando el término de búsqueda o cambiando el filtro.'
                : 'Explora nuestro catálogo de ropa de niños y peluches para estrenar hoy.'}
            </p>
          </div>
          {onCloseModal && (
            <button
              type="button"
              onClick={onCloseModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Ver Catálogo de Prendas</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {filteredOrders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pendiente;
            const StatusIcon = statusConfig.icon;
            const isExpanded = expandedOrderId === order.id || filteredOrders.length === 1;
            const payBadge = getPaymentMethodBadge(order.paymentMethod);
            const payStatusBadge = getPaymentStatusBadge(order.paymentStatus);

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:border-stone-300 transition-all overflow-hidden"
              >
                {/* Order Card Header */}
                <div className="p-4 sm:p-5 bg-gradient-to-b from-stone-50/70 to-white border-b border-stone-100">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    {/* Left: Code, Date & Items count */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm sm:text-base text-stone-900 tracking-tight">
                          #{order.id}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyOrderId(order.id, e)}
                          title="Copiar código del pedido"
                          className="text-stone-400 hover:text-stone-700 transition-colors p-1 rounded-md hover:bg-stone-200/60"
                        >
                          {copiedOrderId === order.id ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                              <Check className="w-3 h-3" /> Copiado
                            </span>
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDownloadReceipt(order, e)}
                          title="Descargar comprobante detallado de compra en PDF"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 border border-violet-200/90 px-2 py-0.5 rounded-lg transition-all cursor-pointer shadow-2xs active:scale-95"
                        >
                          {generatingPdfId === order.id ? (
                            <Loader2 className="w-3 h-3 animate-spin text-violet-600" />
                          ) : pdfSuccessId === order.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <FileText className="w-3 h-3 text-violet-600" />
                          )}
                          <span>
                            {generatingPdfId === order.id
                              ? 'Generando...'
                              : pdfSuccessId === order.id
                              ? 'Descargado'
                              : 'Recibo PDF'}
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-stone-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{formatDate(order.createdAt)}</span>
                        </span>
                        <span>•</span>
                        <span>
                          {order.items.reduce((acc, it) => acc + it.quantity, 0)} prenda
                          {order.items.reduce((acc, it) => acc + it.quantity, 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Right: Status Badge & Total */}
                    <div className="flex flex-col sm:items-end gap-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.badgeClass}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{statusConfig.label}</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${payStatusBadge.colorClass}`}>
                          <span>{payStatusBadge.icon}</span>
                          <span>{payStatusBadge.label}</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-stone-400 block sm:inline mr-1">Total:</span>
                        <span className="font-serif font-black text-stone-950 text-base sm:text-lg">
                          {formatCurrency(order.total, order.currency || currency, storeSettings.exchangeRate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Status Progress Stepper */}
                  <div className="mt-4 pt-3 border-t border-stone-100">
                    <div className="relative">
                      <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-600 via-purple-600 to-emerald-500 transition-all duration-500 rounded-full"
                          style={{
                            width: `${((statusConfig.step - 1) / 3) * 100}%`
                          }}
                        />
                      </div>

                      {/* 4 Steps Indicators */}
                      <div className="flex justify-between items-center -mt-2.5">
                        {[
                          { label: 'Recibido', step: 1 },
                          { label: 'Empacando', step: 2 },
                          { label: 'En camino', step: 3 },
                          { label: 'Entregado', step: 4 }
                        ].map((s) => {
                          const isCompleted = statusConfig.step >= s.step;
                          const isCurrent = statusConfig.step === s.step;

                          return (
                            <div key={s.step} className="flex flex-col items-center">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                                  isCompleted
                                    ? 'bg-violet-600 border-white text-white shadow-xs'
                                    : 'bg-white border-stone-300 text-stone-400'
                                } ${isCurrent ? 'ring-2 ring-violet-300 ring-offset-1 scale-110' : ''}`}
                              >
                                {isCompleted ? '✓' : s.step}
                              </div>
                              <span
                                className={`text-[10px] mt-1 font-medium ${
                                  isCompleted ? 'text-stone-800 font-bold' : 'text-stone-400'
                                }`}
                              >
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Status hint text */}
                    <div className="mt-3.5 bg-stone-50/80 rounded-xl p-2.5 text-xs text-stone-600 flex items-start gap-2 border border-stone-200/60">
                      <Info className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
                      <p className="leading-tight">{statusConfig.description}</p>
                    </div>
                  </div>
                </div>

                {/* Collapsible / Expandable Details Section */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Delivery & Electronic Payment Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-stone-50/60 p-3 rounded-xl border border-stone-100">
                    <div>
                      <span className="font-bold text-stone-500 uppercase tracking-wider text-[10px] block mb-0.5">
                        Método de entrega
                      </span>
                      <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                        {order.deliveryMethod === 'indrive' ? (
                          <>
                            <span className="text-base">🛵</span>
                            <span>inDrive Express</span>
                          </>
                        ) : order.deliveryMethod === 'departamental' ? (
                          <>
                            <span className="text-base">📦</span>
                            <span>Envío Departamental</span>
                          </>
                        ) : (
                          <>
                            <span className="text-base">🛍️</span>
                            <span>Retiro en Tienda</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-stone-500 uppercase tracking-wider text-[10px] block mb-0.5">
                        Método de Pago
                      </span>
                      <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                        <CreditCard className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                        <span>{payBadge.icon} {payBadge.label}</span>
                      </div>
                      {order.paymentReference && (
                        <span className="text-[10px] font-mono text-stone-500 block mt-0.5">
                          Ref: {order.paymentReference}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="font-bold text-stone-500 uppercase tracking-wider text-[10px] block mb-0.5">
                        Destino / Contacto
                      </span>
                      <p className="text-stone-700 truncate">
                        {order.customerAddress || 'Retiro en tienda física'}
                        {order.customerPhone ? ` • ${order.customerPhone}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Purchased Items List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        Prendas compradas ({order.items.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="text-xs text-violet-700 hover:text-violet-900 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Ver menos' : 'Ver detalle completo'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {isExpanded ? (
                      <div className="space-y-2 divide-y divide-stone-100">
                        {order.items.map((item, idx) => {
                          const catalogProduct = products.find(p => p.id === item.productId);
                          const image = catalogProduct?.images?.[0];

                          return (
                            <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {image ? (
                                  <img
                                    src={image}
                                    alt={item.productName}
                                    referrerPolicy="no-referrer"
                                    className="w-10 h-10 object-cover rounded-lg border border-stone-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-base shrink-0">
                                    👗
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-semibold text-stone-800 truncate">{item.productName}</p>
                                  <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                                    {item.size && (
                                      <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-600 font-medium">
                                        Talla: {item.size}
                                      </span>
                                    )}
                                    {item.color && (
                                      <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-600 font-medium">
                                        Color: {item.color}
                                      </span>
                                    )}
                                    <span>• Cant: {item.quantity}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-semibold text-stone-900 block">
                                  {formatCurrency(item.price * item.quantity, order.currency || currency, storeSettings.exchangeRate)}
                                </span>
                                {item.quantity > 1 && (
                                  <span className="text-[10px] text-stone-400">
                                    {formatCurrency(item.price, order.currency || currency, storeSettings.exchangeRate)} c/u
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Financial summary breakdown */}
                        <div className="pt-3 mt-3 border-t border-stone-200 text-xs space-y-1 text-stone-600">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(order.subtotal, order.currency || currency, storeSettings.exchangeRate)}</span>
                          </div>
                          {order.discount > 0 && (
                            <div className="flex justify-between text-rose-600 font-medium">
                              <span>Descuento aplicado (20% OFF):</span>
                              <span>-{formatCurrency(order.discount, order.currency || currency, storeSettings.exchangeRate)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Costo de envío:</span>
                            <span>
                              {order.shipping === 0
                                ? '¡Gratis!'
                                : formatCurrency(order.shipping, order.currency || currency, storeSettings.exchangeRate)}
                            </span>
                          </div>
                          <div className="flex justify-between text-stone-900 font-bold text-sm pt-1 border-t border-stone-100">
                            <span>Total de la orden:</span>
                            <span>{formatCurrency(order.total, order.currency || currency, storeSettings.exchangeRate)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Compact items preview */
                      <div className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl flex items-center justify-between">
                        <span className="truncate pr-2">
                          {order.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}
                        </span>
                        <span className="font-bold text-stone-900 shrink-0">
                          {formatCurrency(order.total, order.currency || currency, storeSettings.exchangeRate)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Banner de Pedido Completado con llamado a la acción instantáneo */}
                  {order.status === 'entregado' && (
                    <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-emerald-950">
                            ¡Pedido completado y entregado con éxito!
                          </div>
                          <div className="text-[11px] text-emerald-800">
                            ¿Te gustaron tus prendas? Puedes agregarlas al carrito de nuevo con un solo toque.
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        id={`btn-reorder-completed-callout-${order.id}`}
                        onClick={(e) => handleReorder(order, e)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                        title="Agregar de inmediato las mismas prendas al carrito"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Volver a añadir al carrito</span>
                      </button>
                    </div>
                  )}

                  {/* Action Buttons: Volver a añadir al carrito, Generar Recibo en PDF & WhatsApp */}
                  <div className="pt-2 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <button
                      type="button"
                      id={`btn-reorder-cart-${order.id}`}
                      onClick={(e) => handleReorder(order, e)}
                      className={`py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 cursor-pointer shrink-0 ${
                        order.status === 'entregado'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white ring-2 ring-emerald-200/80 shadow-emerald-700/20'
                          : 'bg-stone-900 hover:bg-stone-800 text-white'
                      }`}
                      title="Volver a agregar estas prendas al carrito de compras de forma instantánea"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Volver a añadir al carrito</span>
                    </button>

                    <button
                      type="button"
                      id={`btn-download-pdf-receipt-${order.id}`}
                      onClick={(e) => handleDownloadReceipt(order, e)}
                      disabled={generatingPdfId === order.id}
                      className="flex-1 py-2.5 px-3 bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200/90 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-98 cursor-pointer disabled:opacity-75"
                      title="Generar y descargar comprobante oficial de compra en PDF"
                    >
                      {generatingPdfId === order.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
                          <span>Generando PDF...</span>
                        </>
                      ) : pdfSuccessId === order.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>¡Recibo Descargado!</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-3.5 h-3.5 text-violet-600" />
                          <span>Generar Recibo en PDF</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleInquireWhatsApp(order, e)}
                      className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 cursor-pointer shrink-0"
                      title="Consultar por WhatsApp con el código de pedido"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>
                  </div>

                  {pdfSuccessId === order.id && (
                    <div className="p-2.5 bg-violet-50 border border-violet-200 text-violet-900 rounded-xl text-xs flex items-center justify-between gap-2 font-medium animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Se descargó el comprobante <strong>Recibo_Pedido_{order.id}.pdf</strong></span>
                      </div>
                      <span className="text-[10px] text-violet-700 font-bold bg-violet-100 px-2 py-0.5 rounded-full">PDF Listo</span>
                    </div>
                  )}

                  {reorderSuccessId === order.id && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-1.5 font-medium animate-fadeIn">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>¡Prendas agregadas al carrito de compras con éxito!</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
