import React, { useState } from 'react';
import {
  X,
  DollarSign,
  TrendingUp,
  CreditCard,
  Smartphone,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Award,
  Store,
  Layers,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { CurrencyType, Product, StoreSettings, UserAccount } from '../types';
import {
  PLATFORM_OWNER_CONFIG,
  STORE_MEMBERSHIP_TIERS,
  PRODUCT_BOOST_TIERS,
  STORE_VERIFICATION_PLAN,
  getSavedPlatformEarnings,
  savePlatformEarning,
  PlatformEarningRecord,
  calculateEarningsSplit
} from '../utils/monetization';
import { formatCurrency } from '../utils/storage';

interface MonetizationHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSettings: StoreSettings;
  currency: CurrencyType;
  products: Product[];
  currentUser: UserAccount | null;
  onUpdateProduct?: (product: Product) => void;
  onUpdateUser?: (user: UserAccount) => void;
}

export const MonetizationHubModal: React.FC<MonetizationHubModalProps> = ({
  isOpen,
  onClose,
  storeSettings,
  currency,
  products,
  currentUser,
  onUpdateProduct,
  onUpdateUser
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'commission' | 'memberships' | 'boosts' | 'verification' | 'history'>('overview');
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [earningsList, setEarningsList] = useState<PlatformEarningRecord[]>(getSavedPlatformEarnings());
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  // Simulator State
  const [simSaleAmount, setSimSaleAmount] = useState<number>(1000);

  // Boost Selection State
  const [selectedProductToBoost, setSelectedProductToBoost] = useState<string>(products[0]?.id || '');
  const [selectedBoostTier, setSelectedBoostTier] = useState<string>('boost_7_dias');

  if (!isOpen) return null;

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(PLATFORM_OWNER_CONFIG.walletPhone);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2500);
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(PLATFORM_OWNER_CONFIG.lafiseAccount);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  const simSplit = calculateEarningsSplit(simSaleAmount);

  // Aggregate metrics
  const totalCommissionRevenue = earningsList
    .filter((e) => e.source === 'comision_3_porciento')
    .reduce((sum, e) => sum + e.amountNIO, 0);

  const totalMembershipsRevenue = earningsList
    .filter((e) => e.source === 'plan_tienda_pro' || e.source === 'plan_boutique_vip')
    .reduce((sum, e) => sum + e.amountNIO, 0);

  const totalBoostsRevenue = earningsList
    .filter((e) => e.source === 'destacado_producto')
    .reduce((sum, e) => sum + e.amountNIO, 0);

  const totalOtherRevenue = earningsList
    .filter((e) => e.source === 'verificacion_tienda' || e.source === 'publicidad_anuncio')
    .reduce((sum, e) => sum + e.amountNIO, 0);

  const totalPlatformEarningsAll = totalCommissionRevenue + totalMembershipsRevenue + totalBoostsRevenue + totalOtherRevenue;

  // Handle Plan Subscription
  const handleSubscribePlan = (planId: string, planTitle: string, priceNIO: number) => {
    if (priceNIO === 0) {
      setActionSuccessMessage('¡Plan Básico Gratuito activo!');
      return;
    }

    const newRecord: PlatformEarningRecord = {
      id: `sub-${Date.now()}`,
      source: planId === 'plan_boutique_vip' ? 'plan_boutique_vip' : 'plan_tienda_pro',
      title: `Pago Suscripción ${planTitle}`,
      amountNIO: priceNIO,
      storeOrUserName: currentUser?.storeName || storeSettings.storeName || 'Mi Tienda',
      date: 'Justo ahora',
      status: 'liquidado',
      reference: `REC-${Date.now().toString().slice(-6)}`,
      paymentDestination: 'cuenta_lafise'
    };

    savePlatformEarning(newRecord);
    setEarningsList(getSavedPlatformEarnings());

    if (currentUser && onUpdateUser) {
      onUpdateUser({
        ...currentUser,
        storePlan: planId === 'plan_boutique_vip' ? 'vip' : 'pro',
        storePlanExpiresAt: Date.now() + 30 * 86400000
      });
    }

    setActionSuccessMessage(`¡Suscripción ${planTitle} procesada con éxito! Destinada a cuenta LAFISE ${PLATFORM_OWNER_CONFIG.lafiseAccount}`);
    setTimeout(() => setActionSuccessMessage(''), 4000);
  };

  // Handle Boosting a Product
  const handleBoostProduct = () => {
    const tier = PRODUCT_BOOST_TIERS.find((b) => b.id === selectedBoostTier) || PRODUCT_BOOST_TIERS[1];
    const prod = products.find((p) => p.id === selectedProductToBoost);
    if (!prod) return;

    const newRecord: PlatformEarningRecord = {
      id: `boost-${Date.now()}`,
      source: 'destacado_producto',
      title: `${tier.title}: ${prod.name}`,
      amountNIO: tier.priceNIO,
      storeOrUserName: prod.sellerName || storeSettings.storeName,
      date: 'Justo ahora',
      status: 'liquidado',
      reference: `BOOST-${Date.now().toString().slice(-5)}`,
      paymentDestination: 'billetera_movil'
    };

    savePlatformEarning(newRecord);
    setEarningsList(getSavedPlatformEarnings());

    if (onUpdateProduct) {
      onUpdateProduct({
        ...prod,
        isBoosted: true,
        boostDays: tier.priceNIO === 35 ? 3 : tier.priceNIO === 70 ? 7 : 15,
        featured: true
      });
    }

    setActionSuccessMessage(`¡Prenda "${prod.name}" impulsada por ${tier.durationLabel}! Pago registrado a Billetera ${PLATFORM_OWNER_CONFIG.walletPhone}`);
    setTimeout(() => setActionSuccessMessage(''), 4500);
  };

  // Handle Store Verification
  const handleVerifyStore = () => {
    const newRecord: PlatformEarningRecord = {
      id: `verif-${Date.now()}`,
      source: 'verificacion_tienda',
      title: 'Verificación Oficial de Tienda',
      amountNIO: STORE_VERIFICATION_PLAN.priceNIO,
      storeOrUserName: currentUser?.storeName || storeSettings.storeName,
      date: 'Justo ahora',
      status: 'liquidado',
      reference: `VERIF-${Date.now().toString().slice(-5)}`,
      paymentDestination: 'cuenta_lafise'
    };

    savePlatformEarning(newRecord);
    setEarningsList(getSavedPlatformEarnings());

    if (currentUser && onUpdateUser) {
      onUpdateUser({
        ...currentUser,
        role: 'seller'
      });
    }

    setActionSuccessMessage(`¡Insignia de Tienda Oficial Verificada activada! Pago registrado a LAFISE ${PLATFORM_OWNER_CONFIG.lafiseAccount}`);
    setTimeout(() => setActionSuccessMessage(''), 4500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-950 via-stone-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-bold text-xl shadow-inner">
              💰
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl sm:text-2xl font-black tracking-tight">
                  Centro de Monetización & Ganancias
                </h2>
                <span className="text-[10px] bg-emerald-500 text-stone-950 font-mono font-black px-2 py-0.5 rounded-full uppercase">
                  3% Comisión App
                </span>
              </div>
              <p className="text-xs text-stone-300">
                Modelo de ingresos para el dueño de la app: comisión del 3% sobre ventas, suscripciones pro y destacados.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Official Revenue Accounts Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white p-3.5 sm:p-4 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-emerald-800/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold block">
                Cuentas Oficiales para Recaudar Ganancias del Dueño
              </span>
              <p className="text-xs text-emerald-100 font-medium">
                Las comisiones y servicios adicionales van destinados directamente a:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Wallet Button */}
            <button
              onClick={handleCopyWallet}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-mono font-bold border border-emerald-500/60 transition-all cursor-pointer shadow-xs"
              title="Copiar Billetera Móvil del dueño"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-300" />
              <span>Billetera: {PLATFORM_OWNER_CONFIG.walletPhone}</span>
              {copiedWallet ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 text-emerald-200" />}
            </button>

            {/* LAFISE Button */}
            <button
              onClick={handleCopyAccount}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-700/80 hover:bg-sky-600 text-white rounded-xl text-xs font-mono font-bold border border-sky-400/60 transition-all cursor-pointer shadow-xs"
              title="Copiar Cuenta Bancaria LAFISE del dueño"
            >
              <CreditCard className="w-3.5 h-3.5 text-sky-200" />
              <span>LAFISE: {PLATFORM_OWNER_CONFIG.lafiseAccount}</span>
              {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 text-sky-200" />}
            </button>
          </div>
        </div>

        {/* Action Success Alert */}
        {actionSuccessMessage && (
          <div className="p-3 bg-emerald-100 border-b border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-center gap-2 animate-fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 sm:px-6 pt-2 gap-2 shrink-0 overflow-x-auto scrollbar-none text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Resumen Financiero</span>
          </button>

          <button
            onClick={() => setActiveTab('commission')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'commission'
                ? 'border-emerald-600 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Comisión 3% (Principal)</span>
          </button>

          <button
            onClick={() => setActiveTab('memberships')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'memberships'
                ? 'border-emerald-600 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Store className="w-4 h-4 text-amber-600" />
            <span>Suscripciones Pro & VIP</span>
          </button>

          <button
            onClick={() => setActiveTab('boosts')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'boosts'
                ? 'border-emerald-600 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Destacar Prendas</span>
          </button>

          <button
            onClick={() => setActiveTab('verification')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'verification'
                ? 'border-emerald-600 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Award className="w-4 h-4 text-sky-600" />
            <span>Sello Verificado</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Layers className="w-4 h-4 text-stone-500" />
            <span>Historial de Ganancias ({earningsList.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs text-stone-800">
          {/* 1. OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                    Total Ganado por la App
                  </span>
                  <p className="font-mono text-xl sm:text-2xl font-black text-emerald-950">
                    {formatCurrency(totalPlatformEarningsAll, currency, storeSettings.exchangeRate)}
                  </p>
                  <span className="text-[10px] text-emerald-700">En todas las fuentes</span>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-teal-800 block">
                    Comisión 3% Ventas
                  </span>
                  <p className="font-mono text-xl sm:text-2xl font-black text-teal-950">
                    {formatCurrency(totalCommissionRevenue, currency, storeSettings.exchangeRate)}
                  </p>
                  <span className="text-[10px] text-teal-700">De pedidos procesados</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-amber-800 block">
                    Suscripciones Tiendas
                  </span>
                  <p className="font-mono text-xl sm:text-2xl font-black text-amber-950">
                    {formatCurrency(totalMembershipsRevenue, currency, storeSettings.exchangeRate)}
                  </p>
                  <span className="text-[10px] text-amber-700">Planes Pro & VIP</span>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-indigo-800 block">
                    Destacados & Sellos
                  </span>
                  <p className="font-mono text-xl sm:text-2xl font-black text-indigo-950">
                    {formatCurrency(totalBoostsRevenue + totalOtherRevenue, currency, storeSettings.exchangeRate)}
                  </p>
                  <span className="text-[10px] text-indigo-700">Impulso de prendas</span>
                </div>
              </div>

              {/* Revenue Streams Overview Grid */}
              <div className="space-y-3">
                <h3 className="font-serif text-base font-bold text-stone-900">
                  Fuentes de Ingresos Disponibles para el Dueño de la App
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div
                    onClick={() => setActiveTab('commission')}
                    className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-emerald-400 hover:shadow-sm transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                          %
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-950 text-xs sm:text-sm group-hover:text-emerald-700 transition-colors">
                            1. Comisión del 3% por cada Venta
                          </h4>
                          <span className="text-[10px] text-stone-500">Comisión automática en checkout</span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 transition-colors" />
                    </div>
                    <p className="text-[11px] text-stone-600">
                      El 97% del pago de la prenda va directo al vendedor y el 3% de tarifa va a tu Billetera (+505 58898311) o Cuenta LAFISE (134082049).
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab('memberships')}
                    className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                          👑
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-950 text-xs sm:text-sm group-hover:text-amber-700 transition-colors">
                            2. Planes de Membresía Mensual
                          </h4>
                          <span className="text-[10px] text-stone-500">C$ 150 y C$ 350 / mes por tienda</span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-amber-600 transition-colors" />
                    </div>
                    <p className="text-[11px] text-stone-600">
                      Suscripciones recurrentes para tiendas y boutiques que quieren catálogo ilimitado, menor comisión o banner en portada.
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab('boosts')}
                    className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-violet-400 hover:shadow-sm transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                          🔥
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-950 text-xs sm:text-sm group-hover:text-violet-700 transition-colors">
                            3. Impulso y Destacados de Prendas
                          </h4>
                          <span className="text-[10px] text-stone-500">C$ 35 (3d), C$ 70 (7d), C$ 120 (15d)</span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-violet-600 transition-colors" />
                    </div>
                    <p className="text-[11px] text-stone-600">
                      Los vendedores pagan para fijar sus prendas en el carrusel principal y en las búsquedas por voz.
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab('verification')}
                    className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-sky-400 hover:shadow-sm transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                          ✓
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-950 text-xs sm:text-sm group-hover:text-sky-700 transition-colors">
                            4. Sello Oficial de Tienda Verificada
                          </h4>
                          <span className="text-[10px] text-stone-500">Pago único C$ 75 por tienda</span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-sky-600 transition-colors" />
                    </div>
                    <p className="text-[11px] text-stone-600">
                      Otorga la insignia dorada de vendedor verificado que aumenta la confianza en compras en línea en Nicaragua.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. COMMISSION 3% */}
          {activeTab === 'commission' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <h3 className="font-serif text-base font-bold text-emerald-950 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span>Modelo de Comisión del 3%</span>
                </h3>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  De cada venta de ropa procesada en la plataforma, <strong>el 97% de la ganancia va destinada directamente a la tienda de ropa</strong> a su cuenta bancaria configurada, y <strong>el 3% le queda al dueño de la aplicación</strong> para sustentar la infraestructura y soporte técnico.
                </p>
              </div>

              {/* Live Calculator */}
              <div className="p-5 rounded-2xl bg-stone-900 text-white space-y-4 shadow-lg">
                <h4 className="font-bold text-sm text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <span>🧮 Simulador de Ganancias (97% / 3%)</span>
                </h4>

                <div>
                  <label className="block text-xs text-stone-300 mb-1">
                    Ingresa un monto de venta total en Córdobas (C$):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={simSaleAmount}
                    onChange={(e) => setSimSaleAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-white font-mono font-bold text-base focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 bg-stone-800/80 rounded-xl border border-stone-700">
                    <span className="text-[11px] text-stone-400 block">🏪 Ganancia para la Tienda de Ropa (97%):</span>
                    <p className="font-mono text-xl font-bold text-white mt-1">
                      {formatCurrency(simSplit.sellerAmount, currency, storeSettings.exchangeRate)}
                    </p>
                    <span className="text-[10px] text-stone-400">Transferido a la cuenta de la tienda</span>
                  </div>

                  <div className="p-3.5 bg-emerald-950/80 rounded-xl border border-emerald-600/60">
                    <span className="text-[11px] text-emerald-300 block">🛡️ Comisión para el Dueño de la App (3%):</span>
                    <p className="font-mono text-xl font-bold text-emerald-300 mt-1">
                      {formatCurrency(simSplit.platformFee, currency, storeSettings.exchangeRate)}
                    </p>
                    <span className="text-[10px] text-emerald-200">Billetera: +505 58898311 | LAFISE: 134082049</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. MEMBERSHIPS */}
          {activeTab === 'memberships' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Planes de Suscripción Mensual para Tiendas
                </h3>
                <p className="text-xs text-stone-500">
                  Monetización recurrente: las tiendas pagan mensualmente para obtener mayores beneficios en la plataforma.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {STORE_MEMBERSHIP_TIERS.map((tier) => (
                  <div
                    key={tier.id}
                    className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                      tier.recommended
                        ? 'bg-amber-50/70 border-amber-300 shadow-md ring-2 ring-amber-400/40'
                        : 'bg-white border-stone-200'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-stone-900 text-white">
                          {tier.badge}
                        </span>
                        {tier.recommended && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            Recomendado
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-base text-stone-900">{tier.title}</h4>
                        <p className="font-mono text-2xl font-black text-stone-950 mt-1">
                          {tier.priceNIO === 0 ? 'Gratis' : `C$ ${tier.priceNIO}`}
                          {tier.priceNIO > 0 && <span className="text-xs font-normal text-stone-500"> / mes</span>}
                        </p>
                        <p className="text-[11px] text-stone-600 mt-1">{tier.description}</p>
                      </div>

                      <ul className="space-y-2 pt-2 border-t border-stone-200/80 text-[11px] text-stone-700">
                        {tier.benefits.map((b, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSubscribePlan(tier.id, tier.title, tier.priceNIO)}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all active:scale-98 cursor-pointer ${
                        tier.recommended
                          ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 shadow-sm'
                          : tier.priceNIO === 0
                          ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          : 'bg-stone-900 hover:bg-stone-800 text-white shadow-xs'
                      }`}
                    >
                      {tier.priceNIO === 0 ? 'Plan Actual' : `Activar ${tier.title} (C$ ${tier.priceNIO})`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. PRODUCT BOOSTS */}
          {activeTab === 'boosts' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Impulso de Prendas en Portada (Product Boost)
                </h3>
                <p className="text-xs text-stone-500">
                  Las tiendas pagan micro-tarifas para fijar sus prendas en la cima del catálogo y en la búsqueda por voz.
                </p>
              </div>

              {/* Boost Configurator */}
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      1. Selecciona la prenda a impulsar:
                    </label>
                    <select
                      value={selectedProductToBoost}
                      onChange={(e) => setSelectedProductToBoost(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-900"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - C$ {p.price} ({p.sellerName || 'Tienda'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      2. Selecciona la duración del impulso:
                    </label>
                    <select
                      value={selectedBoostTier}
                      onChange={(e) => setSelectedBoostTier(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-900"
                    >
                      {PRODUCT_BOOST_TIERS.map((tier) => (
                        <option key={tier.id} value={tier.id}>
                          {tier.title} - C$ {tier.priceNIO}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-stone-200">
                  <div className="text-xs">
                    <span className="text-stone-500">Pago directo al dueño: </span>
                    <strong className="text-emerald-700">
                      Billetera {PLATFORM_OWNER_CONFIG.walletPhone} o LAFISE {PLATFORM_OWNER_CONFIG.lafiseAccount}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={handleBoostProduct}
                    className="py-2.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Zap className="w-4 h-4 fill-stone-950/20" />
                    <span>Impulsar Prenda Ahora</span>
                  </button>
                </div>
              </div>

              {/* Boost Tiers Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PRODUCT_BOOST_TIERS.map((b) => (
                  <div key={b.id} className="p-4 rounded-xl bg-white border border-stone-200 space-y-2">
                    <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      {b.badge}
                    </span>
                    <h5 className="font-bold text-sm text-stone-900">{b.title}</h5>
                    <p className="font-mono text-xl font-bold text-emerald-800">C$ {b.priceNIO}</p>
                    <p className="text-[11px] text-stone-500">{b.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. VERIFICATION */}
          {activeTab === 'verification' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-950 to-indigo-950 text-white space-y-3">
                <div className="flex items-center gap-2.5">
                  <Award className="w-6 h-6 text-sky-300" />
                  <h3 className="font-serif text-lg font-bold">
                    Sello de Tienda Oficial Verificada
                  </h3>
                </div>
                <p className="text-xs text-sky-100 leading-relaxed max-w-xl">
                  En Nicaragua, la confianza es el factor #1 para compras en línea. Ofrece a los vendedores la verificación oficial de identidad (RUC, Cédula o Comercio Registrado) por una tarifa única de <strong>C$ 75</strong>.
                </p>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleVerifyStore}
                    className="py-2.5 px-5 bg-sky-400 hover:bg-sky-300 text-sky-950 font-bold text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Adquirir Sello de Tienda Verificada (C$ 75)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <h5 className="font-bold text-stone-900">Beneficio para el Dueño</h5>
                  <p className="text-stone-600">
                    Ingreso neto instantáneo pagado a Billetera +505 58898311 o LAFISE 134082049 sin costos recurrentes.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <h5 className="font-bold text-stone-900">Beneficio para la Tienda</h5>
                  <p className="text-stone-600">
                    Badge de autenticidad visible para todos los compradores, incrementando las ventas hasta un 40%.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 6. HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-stone-900">
                    Registro de Ganancias Recaudadas
                  </h3>
                  <p className="text-xs text-stone-500">
                    Comisiones del 3%, suscripciones pro y pagos destinados a las cuentas oficiales.
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-stone-500 block">Total Acumulado:</span>
                  <span className="font-mono text-base font-black text-emerald-800">
                    {formatCurrency(totalPlatformEarningsAll, currency, storeSettings.exchangeRate)}
                  </span>
                </div>
              </div>

              <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-stone-700 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Concepto / Fuente</th>
                      <th className="py-2.5 px-3">Tienda / Usuario</th>
                      <th className="py-2.5 px-3">Destino</th>
                      <th className="py-2.5 px-3 text-right">Ganancia App</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {earningsList.map((item) => (
                      <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-2.5 px-3 text-stone-500 whitespace-nowrap">{item.date}</td>
                        <td className="py-2.5 px-3 font-semibold text-stone-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{item.title}</span>
                        </td>
                        <td className="py-2.5 px-3 text-stone-600">{item.storeOrUserName}</td>
                        <td className="py-2.5 px-3 text-stone-500 font-mono text-[11px]">
                          {item.paymentDestination === 'billetera_movil' ? 'Billetera Móvil' : 'Cuenta LAFISE'}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 text-right">
                          {formatCurrency(item.amountNIO, currency, storeSettings.exchangeRate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
