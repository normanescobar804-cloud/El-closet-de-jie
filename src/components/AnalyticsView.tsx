import React, { useState, useMemo } from 'react';
import {
  Eye,
  Users,
  TrendingUp,
  MessageCircle,
  Smartphone,
  Monitor,
  Clock,
  Share2,
  RefreshCw,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Download,
  ShoppingBag,
  DollarSign,
  CreditCard,
  Truck,
  CheckCircle2,
  Package,
  Database
} from 'lucide-react';
import { AnalyticsData, CurrencyType, OrderRecord, Product } from '../types';
import { formatCurrency } from '../utils/storage';
import { getPaymentMethodLabel } from '../utils/paymentGateways';

interface AnalyticsViewProps {
  analytics: AnalyticsData;
  orders?: OrderRecord[];
  products?: Product[];
  currency?: CurrencyType;
  exchangeRate?: number;
  isCloudConnected?: boolean;
  onRefresh: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  analytics,
  orders = [],
  products = [],
  currency = 'cordobas',
  exchangeRate = 36.5,
  isCloudConnected = true,
  onRefresh
}) => {
  const [activeSection, setActiveSection] = useState<'sales' | 'traffic'>('sales');
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | 'all'>('14d');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // =========================================================================
  // 1. Commercial & Database Order Statistics Calculations
  // =========================================================================
  const salesMetrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenueCordobas = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const deliveredRevenueCordobas = orders
      .filter((o) => o.status === 'entregado')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const averageTicketCordobas = totalOrders > 0 ? totalRevenueCordobas / totalOrders : 0;
    const totalUnitsSold = orders.reduce(
      (sum, o) => sum + o.items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0),
      0
    );

    // Unique customers by phone or name
    const uniqueCustomersSet = new Set(
      orders.map((o) => o.customerPhone.replace(/\D/g, '') || o.customerName.toLowerCase().trim())
    );

    // Breakdown by Order Status
    const statusCounts = {
      pendiente: orders.filter((o) => o.status === 'pendiente').length,
      en_preparacion: orders.filter((o) => o.status === 'en_preparacion').length,
      enviado: orders.filter((o) => o.status === 'enviado').length,
      entregado: orders.filter((o) => o.status === 'entregado').length
    };

    // Breakdown by Payment Method
    const paymentCounts: Record<string, { count: number; total: number }> = {
      lafise_transfer: { count: 0, total: 0 },
      card_online: { count: 0, total: 0 },
      payment_link: { count: 0, total: 0 },
      mobile_wallet: { count: 0, total: 0 },
      cash_on_delivery: { count: 0, total: 0 }
    };

    // Breakdown by Delivery Method
    const deliveryCounts: Record<string, number> = {
      indrive: 0,
      departamental: 0,
      pickup: 0
    };

    // Product Sales Aggregation
    const productStatsMap: Record<
      string,
      { id: string; name: string; category: string; units: number; revenue: number }
    > = {};

    orders.forEach((order) => {
      const pm = order.paymentMethod || 'lafise_transfer';
      if (!paymentCounts[pm]) {
        paymentCounts[pm] = { count: 0, total: 0 };
      }
      paymentCounts[pm].count += 1;
      paymentCounts[pm].total += Number(order.total) || 0;

      const dm = order.deliveryMethod || 'indrive';
      deliveryCounts[dm] = (deliveryCounts[dm] || 0) + 1;

      order.items.forEach((item) => {
        const key = item.productId || item.productName;
        const catalogMatch = products.find((p) => p.id === item.productId);
        if (!productStatsMap[key]) {
          productStatsMap[key] = {
            id: key,
            name: item.productName,
            category: catalogMatch?.category || 'Catálogo',
            units: 0,
            revenue: 0
          };
        }
        productStatsMap[key].units += Number(item.quantity) || 1;
        productStatsMap[key].revenue += (Number(item.price) || 0) * (Number(item.quantity) || 1);
      });
    });

    const topProducts = Object.values(productStatsMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    return {
      totalOrders,
      totalRevenueCordobas,
      deliveredRevenueCordobas,
      averageTicketCordobas,
      totalUnitsSold,
      uniqueCustomersCount: uniqueCustomersSet.size,
      statusCounts,
      paymentCounts,
      deliveryCounts,
      topProducts
    };
  }, [orders, products]);

  // =========================================================================
  // 2. Web Traffic Calculations
  // =========================================================================
  const historyList = [...analytics.dailyHistory].reverse();
  const displayedHistory =
    timeRange === '7d'
      ? historyList.slice(0, 7)
      : timeRange === '14d'
      ? historyList.slice(0, 14)
      : historyList;

  const maxViews = Math.max(...displayedHistory.map((d) => d.pageViews), 1);
  const yesterdayViews = analytics.yesterdayViews || 1;
  const growthRate = Math.round(((analytics.todayViews - yesterdayViews) / yesterdayViews) * 100);

  const totalPeriodViews = displayedHistory.reduce((acc, curr) => acc + curr.pageViews, 0);
  const averageDailyViews =
    displayedHistory.length > 0 ? Math.round(totalPeriodViews / displayedHistory.length) : 0;

  const bestDay = [...analytics.dailyHistory].sort((a, b) => b.pageViews - a.pageViews)[0];

  const hourlyEntries = Object.entries(analytics.hourlyBreakdown || {}) as [string, number][];
  const topHours = [...hourlyEntries]
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 3)
    .map(([hour, count]) => {
      const h = parseInt(hour, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return { label: `${formattedHour}:00 ${ampm}`, count };
    });

  const handleDownloadCSV = () => {
    const headers = [
      'Pedido ID',
      'Fecha',
      'Cliente',
      'Telefono',
      'Metodo Entrega',
      'Metodo Pago',
      'Estado Pago',
      'Estado Pedido',
      'Prendas',
      'Total Cordobas'
    ];
    const rows = orders.map((o) => [
      o.id,
      new Date(o.createdAt).toLocaleDateString('es-NI'),
      `"${o.customerName.replace(/"/g, '""')}"`,
      o.customerPhone,
      o.deliveryMethod || 'indrive',
      getPaymentMethodLabel(o.paymentMethod),
      o.paymentStatus || 'pendiente',
      o.status,
      o.items.reduce((acc, i) => acc + i.quantity, 0),
      o.total.toFixed(2)
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estadisticas-pedidos-closet-jie-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Section Switcher & Export Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSection('sales')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'sales'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Ventas, Pedidos y Pagos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('traffic')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'traffic'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Tráfico y Visitas Diarias</span>
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 px-2">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isCloudConnected ? 'Base de Datos Firestore Activa' : 'Almacenamiento Local'}</span>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
            title="Actualizar métricas"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 text-xs font-bold text-stone-800 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            title="Descargar reporte en CSV para Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {activeSection === 'sales' ? (
        /* ===================================================================
           TAB 1: COMMERCIAL & DATABASE STATISTICS (ORDERS, REVENUE, PAYMENTS)
           =================================================================== */
        <div className="space-y-6">
          {/* 4 Commercial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Ingresos Totales */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Ingresos en Pedidos
                </span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="font-serif text-2xl sm:text-3xl font-black text-stone-900 tabular-nums">
                {formatCurrency(salesMetrics.totalRevenueCordobas, currency, exchangeRate)}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-500 tabular-nums">
                <span>Entregados:</span>
                <strong className="text-emerald-700">
                  {formatCurrency(salesMetrics.deliveredRevenueCordobas, currency, exchangeRate)}
                </strong>
              </div>
            </div>

            {/* KPI 2: Total Pedidos */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Pedidos Registrados
                </span>
                <span className="p-2 rounded-xl bg-violet-50 text-violet-700">
                  <Package className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl sm:text-3xl font-black text-stone-900 tabular-nums">
                  {salesMetrics.totalOrders}
                </span>
                <span className="text-xs text-stone-500">órdenes</span>
              </div>
              <p className="mt-2 text-xs text-stone-500 tabular-nums">
                {salesMetrics.totalUnitsSold} prendas vendidas en total
              </p>
            </div>

            {/* KPI 3: Ticket Promedio */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Ticket Promedio
                </span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-800">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="font-serif text-2xl sm:text-3xl font-black text-stone-900 tabular-nums">
                {formatCurrency(salesMetrics.averageTicketCordobas, currency, exchangeRate)}
              </div>
              <p className="mt-2 text-xs text-stone-500">
                Valor promedio por cada compra
              </p>
            </div>

            {/* KPI 4: Clientes Activos */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Clientes con Pedidos
                </span>
                <span className="p-2 rounded-xl bg-sky-50 text-sky-700">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl sm:text-3xl font-black text-stone-900 tabular-nums">
                  {salesMetrics.uniqueCustomersCount}
                </span>
                <span className="text-xs text-stone-500">clientes</span>
              </div>
              <p className="mt-2 text-xs text-stone-500 tabular-nums">
                {products.filter((p) => p.inStock).length} prendas activas en stock
              </p>
            </div>
          </div>

          {/* 2-Column Grid: Order Status Breakdown & Electronic Payment Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Estado de los Pedidos */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-serif text-base font-bold text-stone-900">
                    Estado de Entregas y Pedidos
                  </h4>
                  <p className="text-xs text-stone-500">
                    Distribución en tiempo real del flujo de pedidos
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>

              <div className="space-y-3 pt-1">
                {[
                  {
                    key: 'pendiente',
                    label: 'Pendientes de confirmación',
                    count: salesMetrics.statusCounts.pendiente,
                    barColor: 'bg-amber-500'
                  },
                  {
                    key: 'en_preparacion',
                    label: 'En preparación / Empaque',
                    count: salesMetrics.statusCounts.en_preparacion,
                    barColor: 'bg-sky-500'
                  },
                  {
                    key: 'enviado',
                    label: 'En camino (inDrive / Encomienda)',
                    count: salesMetrics.statusCounts.enviado,
                    barColor: 'bg-violet-600'
                  },
                  {
                    key: 'entregado',
                    label: 'Entregados con éxito',
                    count: salesMetrics.statusCounts.entregado,
                    barColor: 'bg-emerald-600'
                  }
                ].map((st) => {
                  const pct =
                    salesMetrics.totalOrders > 0
                      ? Math.round((st.count / salesMetrics.totalOrders) * 100)
                      : 0;
                  return (
                    <div key={st.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-stone-700">{st.label}</span>
                        <span className="font-mono font-bold text-stone-900 tabular-nums">
                          {st.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${st.barColor}`}
                          style={{ width: `${ Math.max(pct, st.count > 0 ? 6 : 0) }%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delivery method summary */}
              <div className="pt-3 border-t border-stone-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                  <div className="font-mono font-bold text-stone-900 text-sm tabular-nums">
                    {salesMetrics.deliveryCounts.indrive || 0}
                  </div>
                  <div className="text-[11px] text-stone-500 flex items-center justify-center gap-1 mt-0.5">
                    <Truck className="w-3 h-3 text-amber-600" />
                    <span>inDrive</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                  <div className="font-mono font-bold text-stone-900 text-sm tabular-nums">
                    {salesMetrics.deliveryCounts.departamental || 0}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">Departamental</div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                  <div className="font-mono font-bold text-stone-900 text-sm tabular-nums">
                    {salesMetrics.deliveryCounts.pickup || 0}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">Retiro Tienda</div>
                </div>
              </div>
            </div>

            {/* Métodos de Pago Electrónico y Tradicional */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-serif text-base font-bold text-stone-900">
                    Volumen por Pasarela de Pago
                  </h4>
                  <p className="text-xs text-stone-500">
                    Desglose de pagos por transferencia y medios electrónicos
                  </p>
                </div>
                <CreditCard className="w-5 h-5 text-violet-600" />
              </div>

              <div className="divide-y divide-stone-100 text-xs">
                {(
                  [
                    'lafise_transfer',
                    'card_online',
                    'payment_link',
                    'mobile_wallet',
                    'cash_on_delivery'
                  ] as const
                ).map((methodKey) => {
                  const stat = salesMetrics.paymentCounts[methodKey] || { count: 0, total: 0 };
                  return (
                    <div key={methodKey} className="py-2.5 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-stone-800 block">
                          {getPaymentMethodLabel(methodKey)}
                        </span>
                        <span className="text-[11px] text-stone-500 tabular-nums">
                          {stat.count} transacci{stat.count === 1 ? 'ón' : 'ones'}
                        </span>
                      </div>
                      <div className="text-right font-mono font-bold text-stone-900 tabular-nums">
                        {formatCurrency(stat.total, currency, exchangeRate)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Selling Products Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h4 className="font-serif text-base font-bold text-stone-900">
                  Prendas Más Vendidas del Catálogo
                </h4>
                <p className="text-xs text-stone-500">
                  Ranking de productos por ingresos generados y unidades ordenadas
                </p>
              </div>
              <span className="text-xs text-stone-500 font-mono tabular-nums">
                Top {salesMetrics.topProducts.length}
              </span>
            </div>

            {salesMetrics.topProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                Aún no hay productos vendidos registrados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-stone-50 text-stone-600 text-[11px] uppercase tracking-wider font-bold border-b border-stone-200">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Prenda</th>
                      <th className="py-3 px-4">Categoría</th>
                      <th className="py-3 px-4 text-right">Unidades</th>
                      <th className="py-3 px-4 text-right">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-800">
                    {salesMetrics.topProducts.map((prod, idx) => (
                      <tr key={prod.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-stone-400 tabular-nums">
                          0{idx + 1}
                        </td>
                        <td className="py-3 px-4 font-semibold text-stone-900">{prod.name}</td>
                        <td className="py-3 px-4 text-stone-500">{prod.category}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                          {prod.units}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums">
                          {formatCurrency(prod.revenue, currency, exchangeRate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ===================================================================
           TAB 2: WEB TRAFFIC & DAILY VISITS ANALYTICS
           =================================================================== */
        <div className="space-y-6">
          {/* Time Range Filter */}
          <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-stone-200">
            <span className="text-xs font-bold text-stone-700">
              Período de historial de tráfico:
            </span>
            <div className="bg-stone-100 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTimeRange('7d')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  timeRange === '7d'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                7 Días
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('14d')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  timeRange === '14d'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                14 Días
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('all')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  timeRange === 'all'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Todo
              </button>
            </div>
          </div>

          {/* 4 Traffic Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-300/80 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Vistas de Hoy
                </span>
                <span className="p-2 rounded-xl bg-amber-500 text-stone-950">
                  <Eye className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-black text-stone-900 tabular-nums">
                  {analytics.todayViews}
                </span>
                <span className="text-xs font-medium text-stone-500">vistas</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs tabular-nums">
                {growthRate >= 0 ? (
                  <span className="inline-flex items-center text-emerald-700 font-bold">
                    <ArrowUpRight className="w-3.5 h-3.5" />+{growthRate}%
                  </span>
                ) : (
                  <span className="inline-flex items-center text-rose-700 font-bold">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    {growthRate}%
                  </span>
                )}
                <span className="text-stone-500 text-[11px]">vs ayer ({analytics.yesterdayViews})</span>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                  Clientes Únicos Hoy
                </span>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-black text-stone-900 tabular-nums">
                  {analytics.todayUniqueVisitors}
                </span>
                <span className="text-xs font-medium text-stone-500">personas</span>
              </div>
              <p className="mt-2 text-[11px] text-stone-500">
                Dispositivos distintos conectados hoy
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                  Total Histórico
                </span>
                <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <BarChart3 className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-black text-stone-900 tabular-nums">
                  {analytics.totalViews.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-stone-500">vistas</span>
              </div>
              <p className="mt-2 text-[11px] text-stone-500 tabular-nums">
                {analytics.totalUniqueVisitors.toLocaleString()} visitantes acumulados
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                  Clics a WhatsApp
                </span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <MessageCircle className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-black text-emerald-700 tabular-nums">
                  {analytics.whatsappInquiriesClicks}
                </span>
                <span className="text-xs font-medium text-stone-500">conversiones</span>
              </div>
              <p className="mt-2 text-[11px] text-stone-500">
                Pedidos y consultas iniciadas
              </p>
            </div>
          </div>

          {/* Visual Bar Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h4 className="font-serif text-base sm:text-lg font-bold text-stone-900">
                  Evolución de Vistas por Día
                </h4>
                <p className="text-xs text-stone-500">
                  Tráfico registrado en los últimos {displayedHistory.length} días
                </p>
              </div>
            </div>

            <div className="h-52 sm:h-60 flex items-end gap-2 sm:gap-3 pt-6 pb-2 px-2 border-b border-stone-200">
              {[...displayedHistory].reverse().map((day) => {
                const heightPercent = Math.max(8, Math.round((day.pageViews / maxViews) * 100));
                const isToday = day.date === new Date().toISOString().slice(0, 10);

                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                    onMouseEnter={() => setShowTooltip(day.date)}
                    onMouseLeave={() => setShowTooltip(null)}
                  >
                    {showTooltip === day.date && (
                      <div className="absolute -top-14 z-20 bg-stone-950 text-white text-[11px] py-1.5 px-3 rounded-xl shadow-xl whitespace-nowrap border border-stone-700 pointer-events-none tabular-nums">
                        <p className="font-bold text-amber-300">
                          {day.formattedDate} ({day.dayName})
                        </p>
                        <p>
                          {day.pageViews} vistas · {day.uniqueVisitors} personas
                        </p>
                      </div>
                    )}

                    <span className="text-[10px] sm:text-xs font-mono font-bold text-stone-700 mb-1 tabular-nums">
                      {day.pageViews}
                    </span>

                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg transition-all duration-200 relative ${
                        isToday ? 'bg-amber-500' : 'bg-stone-300 hover:bg-amber-400'
                      }`}
                    />

                    <span className="text-[9px] sm:text-[11px] font-semibold text-stone-500 mt-2 truncate max-w-[45px] text-center">
                      {day.formattedDate}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-stone-500 gap-2 tabular-nums">
              <span>
                Promedio del período:{' '}
                <strong className="text-stone-800 font-bold">{averageDailyViews} vistas/día</strong>
              </span>
              {bestDay && (
                <span className="flex items-center gap-1 text-amber-800 font-semibold">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  Día récord: {bestDay.formattedDate} con {bestDay.pageViews} vistas
                </span>
              )}
            </div>
          </div>

          {/* Devices & Peak Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-violet-700" />
                <h4 className="font-serif text-base font-bold text-stone-900">
                  Adaptabilidad por Dispositivo
                </h4>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1 tabular-nums">
                    <span className="flex items-center gap-1 text-stone-700">
                      <Smartphone className="w-3.5 h-3.5 text-stone-500" />
                      Teléfonos Celulares
                    </span>
                    <span>{analytics.deviceBreakdown.mobile}%</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      style={{ width: `${analytics.deviceBreakdown.mobile}%` }}
                      className="bg-amber-500 h-full rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1 tabular-nums">
                    <span className="flex items-center gap-1 text-stone-700">
                      <Monitor className="w-3.5 h-3.5 text-stone-500" />
                      Computadoras y Laptops
                    </span>
                    <span>{analytics.deviceBreakdown.desktop}%</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      style={{ width: `${analytics.deviceBreakdown.desktop}%` }}
                      className="bg-blue-600 h-full rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-700" />
                <h4 className="font-serif text-base font-bold text-stone-900">
                  Canales y Horarios de Mayor Compra
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs tabular-nums">
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <span className="text-emerald-700 font-bold block">
                    WhatsApp ({analytics.referrerBreakdown.whatsapp}%)
                  </span>
                  <span className="text-[11px] text-stone-500">Estados y enlaces directos</span>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <span className="text-blue-700 font-bold block">
                    Catálogo Web ({analytics.referrerBreakdown.direct}%)
                  </span>
                  <span className="text-[11px] text-stone-500">Acceso directo en navegador</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 pt-1 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>Horas pico:</span>
                {topHours.map((h) => (
                  <span key={h.label} className="font-semibold text-stone-900">
                    {h.label} ({h.count})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
