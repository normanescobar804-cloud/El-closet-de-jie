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
  Info,
  Wallet,
  Send,
  Megaphone,
  Globe,
  ExternalLink,
  Clock,
  ArrowDownToLine,
  RefreshCw
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
  calculateEarningsSplit,
  PaypalWithdrawalRecord,
  getSavedPaypalWithdrawals,
  savePaypalWithdrawal,
  BankWithdrawalRecord,
  getSavedBankWithdrawals,
  saveBankWithdrawal
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
  const [activeTab, setActiveTab] = useState<
    'overview' | 'commission' | 'bank' | 'paypal' | 'ads' | 'memberships' | 'boosts' | 'verification' | 'history'
  >('overview');

  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedPaypal, setCopiedPaypal] = useState(false);

  const [earningsList, setEarningsList] = useState<PlatformEarningRecord[]>(getSavedPlatformEarnings());
  const [paypalWithdrawals, setPaypalWithdrawals] = useState<PaypalWithdrawalRecord[]>(getSavedPaypalWithdrawals());
  const [bankWithdrawals, setBankWithdrawals] = useState<BankWithdrawalRecord[]>(getSavedBankWithdrawals());
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  // Simulator State
  const [simSaleAmount, setSimSaleAmount] = useState<number>(1000);

  // Boost Selection State
  const [selectedProductToBoost, setSelectedProductToBoost] = useState<string>(products[0]?.id || '');
  const [selectedBoostTier, setSelectedBoostTier] = useState<string>('boost_7_dias');

  // PayPal Withdrawal State
  const defaultPaypalEmail =
    storeSettings.platformOwnerPaypalEmail || PLATFORM_OWNER_CONFIG.paypalEmail || '';
  const [paypalEmailInput, setPaypalEmailInput] = useState<string>(defaultPaypalEmail);
  const [withdrawAmountInput, setWithdrawAmountInput] = useState<number>(350);
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);

  // Bank Withdrawal State
  const [bankNameInput, setBankNameInput] = useState<string>(storeSettings.platformOwnerBank || 'Banco LAFISE Bancentro');
  const [bankAccountInput, setBankAccountInput] = useState<string>(storeSettings.platformOwnerAccount || '134082049');
  const [bankHolderInput, setBankHolderInput] = useState<string>('Administración El Clóset de Jié');
  const [bankWithdrawAmountInput, setBankWithdrawAmountInput] = useState<number>(500);
  const [isProcessingBankWithdrawal, setIsProcessingBankWithdrawal] = useState(false);

  if (!isOpen) return null;

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(storeSettings.platformOwnerWallet || PLATFORM_OWNER_CONFIG.walletPhone);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2500);
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(storeSettings.platformOwnerAccount || PLATFORM_OWNER_CONFIG.lafiseAccount);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  const handleCopyPaypal = () => {
    navigator.clipboard.writeText(defaultPaypalEmail);
    setCopiedPaypal(true);
    setTimeout(() => setCopiedPaypal(false), 2500);
  };

  const simSplit = calculateEarningsSplit(simSaleAmount);

  // Aggregate metrics
  const totalCommissionRevenue = earningsList
    .filter((e) => e.source === 'comision_2_porciento' || e.source === 'comision_3_porciento')
    .reduce((sum, e) => sum + e.amountNIO, 0);

  const totalMembershipsRevenue = earningsList
    .filter((e) => e.source === 'plan_tienda_pro' || e.source === 'plan_boutique_vip')
    .reduce((sum, e) => sum + e.amountNIO, 0);

  const totalBoostsRevenue = earningsList
    .filter((e) => e.source === 'destacado_producto')
    .reduce((sum, e) => sum + e.amountNIO, 0);

  const totalAdsRevenue = earningsList
    .filter((e) => e.source === 'publicidad_anuncio' || e.source === 'ingresos_adsense')
    .reduce((sum, e) => sum + e.amountNIO, 0);

  const totalOtherRevenue = earningsList
    .filter((e) => e.source === 'verificacion_tienda')
    .reduce((sum, e) => sum + e.amountNIO, 0);

  const totalPlatformEarningsAll =
    totalCommissionRevenue + totalMembershipsRevenue + totalBoostsRevenue + totalAdsRevenue + totalOtherRevenue;

  // Total withdrawn via PayPal
  const totalPaypalWithdrawnNIO = paypalWithdrawals
    .filter((w) => w.status === 'completado')
    .reduce((sum, w) => sum + w.amountNIO, 0);

  // Total withdrawn via Bank Transfer
  const totalBankWithdrawnNIO = bankWithdrawals
    .filter((w) => w.status === 'completado')
    .reduce((sum, w) => sum + w.amountNIO, 0);

  // Available balance for withdrawal (PayPal or Bank)
  const availableWithdrawalBalanceNIO = Math.max(
    0,
    totalPlatformEarningsAll - totalPaypalWithdrawnNIO - totalBankWithdrawnNIO
  );

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

    setActionSuccessMessage(
      `¡Suscripción ${planTitle} procesada con éxito! Destinada a cuenta LAFISE ${storeSettings.platformOwnerAccount || PLATFORM_OWNER_CONFIG.lafiseAccount}`
    );
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

    setActionSuccessMessage(
      `¡Prenda "${prod.name}" impulsada por ${tier.durationLabel}! Pago registrado a Billetera ${storeSettings.platformOwnerWallet || PLATFORM_OWNER_CONFIG.walletPhone}`
    );
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

    setActionSuccessMessage(
      `¡Insignia de Tienda Oficial Verificada activada! Pago registrado a LAFISE ${storeSettings.platformOwnerAccount || PLATFORM_OWNER_CONFIG.lafiseAccount}`
    );
    setTimeout(() => setActionSuccessMessage(''), 4500);
  };

  // Handle PayPal Withdrawal Request
  const handleRequestPaypalWithdrawal = () => {
    if (withdrawAmountInput <= 0) {
      setActionSuccessMessage('Por favor ingresa un monto válido a retirar.');
      return;
    }
    if (withdrawAmountInput > availableWithdrawalBalanceNIO) {
      setActionSuccessMessage(
        `El monto solicitado (C$ ${withdrawAmountInput}) supera tu saldo disponible (C$ ${availableWithdrawalBalanceNIO.toFixed(2)}).`
      );
      return;
    }
    if (!paypalEmailInput.includes('@')) {
      setActionSuccessMessage('Por favor ingresa un correo de PayPal válido.');
      return;
    }

    setIsProcessingWithdrawal(true);
    setTimeout(() => {
      const exchangeRate = storeSettings.exchangeRate || 36.8;
      const amountUSD = Number((withdrawAmountInput / exchangeRate).toFixed(2));
      const newRecord: PaypalWithdrawalRecord = {
        id: `pp-wd-${Date.now()}`,
        paypalEmail: paypalEmailInput.trim(),
        amountNIO: withdrawAmountInput,
        amountUSD,
        date: 'Hoy, hace un momento',
        status: 'completado',
        transactionId: `PP-TX-${Date.now().toString().slice(-7)}`,
        sourceBreakdown: 'Comisiones 2% y Publicidad de Negocios',
        note: 'Transferencia procesada a tu balance de PayPal'
      };

      savePaypalWithdrawal(newRecord);
      setPaypalWithdrawals(getSavedPaypalWithdrawals());
      setIsProcessingWithdrawal(false);
      setActionSuccessMessage(
        `¡Retiro completado! C$ ${withdrawAmountInput} ($${amountUSD} USD) transferidos a tu cuenta PayPal (${paypalEmailInput}).`
      );
      setTimeout(() => setActionSuccessMessage(''), 5000);
    }, 800);
  };

  // Handle Bank Transfer Withdrawal Request (LAFISE, BAC, Banpro, etc.)
  const handleRequestBankWithdrawal = () => {
    if (bankWithdrawAmountInput <= 0) {
      setActionSuccessMessage('Por favor ingresa un monto válido a transferir.');
      return;
    }
    if (bankWithdrawAmountInput > availableWithdrawalBalanceNIO) {
      setActionSuccessMessage(
        `El monto solicitado (C$ ${bankWithdrawAmountInput}) supera tu saldo disponible (C$ ${availableWithdrawalBalanceNIO.toFixed(2)}).`
      );
      return;
    }
    if (!bankAccountInput.trim()) {
      setActionSuccessMessage('Por favor ingresa el número de cuenta bancaria nacional.');
      return;
    }

    setIsProcessingBankWithdrawal(true);
    setTimeout(() => {
      const exchangeRate = storeSettings.exchangeRate || 36.8;
      const amountUSD = Number((bankWithdrawAmountInput / exchangeRate).toFixed(2));
      const newRecord: BankWithdrawalRecord = {
        id: `bank-wd-${Date.now()}`,
        bankName: bankNameInput.trim() || 'Banco LAFISE Bancentro',
        accountNumber: bankAccountInput.trim(),
        accountHolder: bankHolderInput.trim() || 'Administración Central',
        amountNIO: bankWithdrawAmountInput,
        amountUSD,
        date: 'Hoy, hace un momento',
        status: 'completado',
        transactionId: `ACH-TX-${Date.now().toString().slice(-7)}`,
        sourceBreakdown: 'Comisiones 2% y Publicidad de Negocios',
        note: `Transferencia bancaria enviada a ${bankNameInput} (${bankAccountInput})`
      };

      saveBankWithdrawal(newRecord);
      setBankWithdrawals(getSavedBankWithdrawals());
      setIsProcessingBankWithdrawal(false);
      setActionSuccessMessage(
        `¡Transferencia Bancaria completada con éxito! C$ ${bankWithdrawAmountInput} enviados a tu cuenta ${bankNameInput} (${bankAccountInput}).`
      );
      setTimeout(() => setActionSuccessMessage(''), 5500);
    }, 900);
  };

  // Handle Quick Simulated Ad Revenue Addition
  const handleAddSimulatedAdRevenue = (title: string, amountNIO: number, type: 'ingresos_adsense' | 'publicidad_anuncio') => {
    const newRecord: PlatformEarningRecord = {
      id: `ad-${Date.now()}`,
      source: type,
      title,
      amountNIO,
      storeOrUserName: type === 'ingresos_adsense' ? 'Red de Anuncios Google' : 'Negocio Patrocinado Local',
      date: 'Justo ahora',
      status: 'liquidado',
      reference: `ADS-${Date.now().toString().slice(-6)}`,
      paymentDestination: 'paypal'
    };
    savePlatformEarning(newRecord);
    setEarningsList(getSavedPlatformEarnings());
    setActionSuccessMessage(`¡Ingreso por publicidad (+C$ ${amountNIO}) registrado en tu saldo retirable por PayPal!`);
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
                <span className="text-[10px] bg-emerald-400 text-stone-950 font-mono font-black px-2.5 py-0.5 rounded-full uppercase">
                  2% Comisión App
                </span>
                <span className="text-[10px] bg-sky-400 text-stone-950 font-mono font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <span>PayPal</span>
                </span>
              </div>
              <p className="text-xs text-stone-300">
                Modelo de ingresos para el dueño de la app: 2% comisión por venta, monetización por anuncios Google y retiros a PayPal.
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
                Las comisiones (2%), publicidad y suscripciones van destinadas directamente a:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {storeSettings.hidePersonalAccountsFromPublic ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 text-emerald-200 rounded-xl text-xs font-semibold border border-emerald-500/40">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Modo Privacidad Activo (Cuentas Ocultas)</span>
                </span>
                {storeSettings.platformPaymentLink && (
                  <a
                    href={storeSettings.platformPaymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    <span>💳 Enlace de Pago Digital</span>
                  </a>
                )}
              </div>
            ) : (
              <>
                {/* PayPal Email Account */}
                <button
                  type="button"
                  onClick={handleCopyPaypal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-950/80 hover:bg-sky-900 text-sky-200 rounded-xl text-xs font-mono font-medium border border-sky-400/40 cursor-pointer transition-colors active:scale-95"
                  title="Copiar correo de PayPal"
                >
                  <Wallet className="w-3.5 h-3.5 text-sky-400" />
                  <span>PayPal: {defaultPaypalEmail}</span>
                  {copiedPaypal ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 text-sky-300" />}
                </button>

                {/* Billetera Móvil */}
                <button
                  type="button"
                  onClick={handleCopyWallet}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 rounded-xl text-xs font-mono font-medium border border-emerald-500/40 cursor-pointer transition-colors active:scale-95"
                  title="Copiar número de Billetera Móvil"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Billetera: {storeSettings.platformOwnerWallet || PLATFORM_OWNER_CONFIG.walletPhone}</span>
                  {copiedWallet ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
                </button>

                {/* LAFISE Account */}
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 rounded-xl text-xs font-mono font-medium border border-emerald-500/40 cursor-pointer transition-colors active:scale-95"
                  title="Copiar número de cuenta bancaria"
                >
                  <CreditCard className="w-3.5 h-3.5 text-sky-200" />
                  <span>
                    {storeSettings.platformOwnerBank || 'LAFISE'}:{' '}
                    {storeSettings.platformOwnerAccount || PLATFORM_OWNER_CONFIG.lafiseAccount}
                  </span>
                  {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 text-sky-200" />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Action Success Alert */}
        {actionSuccessMessage && (
          <div className="p-3 bg-emerald-100 border-b border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-center gap-2 animate-fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 sm:px-6 pt-2 gap-2 shrink-0 overflow-x-auto scrollbar-none text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'overview' ? 'border-emerald-600 text-emerald-900' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Resumen Financiero</span>
          </button>

          <button
            onClick={() => setActiveTab('commission')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'commission' ? 'border-emerald-600 text-emerald-900' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Comisión 2% (98% Tienda)</span>
          </button>

          <button
            onClick={() => setActiveTab('bank')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'bank' ? 'border-emerald-600 text-emerald-900 bg-emerald-50/50 rounded-t-lg' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Retiro Bancario (LAFISE / ACH)</span>
          </button>

          <button
            onClick={() => setActiveTab('paypal')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'paypal' ? 'border-sky-600 text-sky-900 bg-sky-50/50 rounded-t-lg' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Wallet className="w-4 h-4 text-sky-600" />
            <span>Retiros PayPal</span>
          </button>

          <button
            onClick={() => setActiveTab('ads')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'ads' ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-lg' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Megaphone className="w-4 h-4 text-amber-600" />
            <span>Ganancias por Anuncios</span>
          </button>

          <button
            onClick={() => setActiveTab('memberships')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'memberships' ? 'border-emerald-600 text-emerald-900' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Store className="w-4 h-4 text-amber-600" />
            <span>Suscripciones Pro & VIP</span>
          </button>

          <button
            onClick={() => setActiveTab('boosts')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'boosts' ? 'border-emerald-600 text-emerald-900' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Destacar Prendas</span>
          </button>

          <button
            onClick={() => setActiveTab('verification')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'verification' ? 'border-emerald-600 text-emerald-900' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Award className="w-4 h-4 text-sky-600" />
            <span>Sello Verificado</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'history' ? 'border-emerald-600 text-emerald-900' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Layers className="w-4 h-4 text-stone-500" />
            <span>Historial ({earningsList.length})</span>
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
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">Total Ganado por la App</span>
                  <p className="font-mono text-xl sm:text-2xl font-black text-emerald-950">
                    {formatCurrency(totalPlatformEarningsAll, currency, storeSettings.exchangeRate)}
                  </p>
                  <span className="text-[10px] text-emerald-700">En todas las fuentes</span>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-teal-800 block">Comisión 2% Ventas</span>
                  <p className="font-mono text-xl sm:text-2xl font-black text-teal-950">
                    {formatCurrency(totalCommissionRevenue, currency, storeSettings.exchangeRate)}
                  </p>
                  <span className="text-[10px] text-teal-700">98% directo a tiendas</span>
                </div>

                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-sky-800 block">Saldo Retirable PayPal</span>
                  <p className="font-mono text-xl sm:text-2xl font-black text-sky-950">
                    {formatCurrency(availableWithdrawalBalanceNIO, currency, storeSettings.exchangeRate)}
                  </p>
                  <span className="text-[10px] text-sky-700">Disponible para cobrar</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-amber-800 block">Ingresos Anuncios & Ads</span>
                  <p className="font-mono text-xl sm:text-2xl font-black text-amber-950">
                    {formatCurrency(totalAdsRevenue, currency, storeSettings.exchangeRate)}
                  </p>
                  <span className="text-[10px] text-amber-700">Google Ads & Patrocinadores</span>
                </div>
              </div>

              {/* Revenue Streams Overview Grid */}
              <div className="space-y-3">
                <h3 className="font-serif text-base font-bold text-stone-900">
                  Fuentes de Ingresos Disponibles para el Dueño de la App
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Card 1: 2% Commission */}
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
                            1. Comisión del 2% por cada Venta
                          </h4>
                          <span className="text-[10px] text-stone-500">98% para el vendedor / 2% para la app</span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 transition-colors" />
                    </div>
                    <p className="text-[11px] text-stone-600">
                      El 98% del pago de la prenda va directo al vendedor y el 2% de comisión le queda al dueño para soporte y mantenimiento, listo para ser retirado por PayPal.
                    </p>
                  </div>

                  {/* Card 2: PayPal Withdrawals */}
                  <div
                    onClick={() => setActiveTab('paypal')}
                    className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-sky-400 hover:shadow-sm transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                          🅿️
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-950 text-xs sm:text-sm group-hover:text-sky-700 transition-colors">
                            2. Retiros de Dinero por PayPal
                          </h4>
                          <span className="text-[10px] text-stone-500">Directo a {defaultPaypalEmail}</span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-sky-600 transition-colors" />
                    </div>
                    <p className="text-[11px] text-stone-600">
                      Retira tus ganancias acumuladas de comisiones y anuncios directamente a tu cuenta de PayPal con registro de transacciones.
                    </p>
                  </div>

                  {/* Card 3: Anuncios y Publicidad */}
                  <div
                    onClick={() => setActiveTab('ads')}
                    className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                          📢
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-950 text-xs sm:text-sm group-hover:text-amber-700 transition-colors">
                            3. Monetización por Anuncios (Google AdSense & Banners)
                          </h4>
                          <span className="text-[10px] text-stone-500">Gana por cada visita y clic publicitario</span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-amber-600 transition-colors" />
                    </div>
                    <p className="text-[11px] text-stone-600">
                      Integra banners publicitarios en la app y el catálogo para generar ingresos pasivos adicionales por tráfico y visualizaciones en GitHub y web.
                    </p>
                  </div>

                  {/* Card 4: Membresías Pro & VIP */}
                  <div
                    onClick={() => setActiveTab('memberships')}
                    className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-violet-400 hover:shadow-sm transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                          👑
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-950 text-xs sm:text-sm group-hover:text-violet-700 transition-colors">
                            4. Planes de Suscripción Mensual
                          </h4>
                          <span className="text-[10px] text-stone-500">C$ 150 y C$ 350 / mes por tienda</span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-violet-600 transition-colors" />
                    </div>
                    <p className="text-[11px] text-stone-600">
                      Suscripciones recurrentes para tiendas y boutiques que quieren catálogo ilimitado, menor comisión o banner en portada.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. COMMISSION 2% */}
          {activeTab === 'commission' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <h3 className="font-serif text-base font-bold text-emerald-950 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span>Modelo de Comisión del 2%</span>
                </h3>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  De cada venta de ropa procesada en la plataforma, <strong>el 98% de la ganancia va destinada directamente a la tienda de ropa</strong> a su cuenta bancaria configurada, y <strong>el 2% le queda al dueño de la aplicación</strong> para sustentar la infraestructura y soporte técnico, listo para ser transferido a PayPal.
                </p>
              </div>

              {/* Live Calculator */}
              <div className="p-5 rounded-2xl bg-stone-900 text-white space-y-4 shadow-lg">
                <h4 className="font-bold text-sm text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <span>🧮 Simulador de Ganancias (98% Tienda / 2% App)</span>
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
                    <span className="text-[11px] text-stone-400 block">🏪 Ganancia para la Tienda de Ropa (98%):</span>
                    <p className="font-mono text-xl font-bold text-white mt-1">
                      {formatCurrency(simSplit.sellerAmount, currency, storeSettings.exchangeRate)}
                    </p>
                    <span className="text-[10px] text-stone-400">Transferido a la cuenta de la tienda</span>
                  </div>

                  <div className="p-3.5 bg-emerald-950/80 rounded-xl border border-emerald-600/60">
                    <span className="text-[11px] text-emerald-300 block">🛡️ Comisión para el Dueño de la App (2%):</span>
                    <p className="font-mono text-xl font-bold text-emerald-300 mt-1">
                      {formatCurrency(simSplit.platformFee, currency, storeSettings.exchangeRate)}
                    </p>
                    <span className="text-[10px] text-emerald-200">
                      Retirable a tu cuenta PayPal ({defaultPaypalEmail})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2.5 BANK WITHDRAWALS */}
          {activeTab === 'bank' && (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-900 to-stone-900 text-white space-y-3 shadow-xl border border-emerald-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-bold text-xl">
                    🏦
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold">Retiros a Cuenta Bancaria Nacional (Nicaragua)</h3>
                    <p className="text-xs text-emerald-200">
                      Retira tus comisiones de la app directamente a tu cuenta bancaria (LAFISE, BAC, Banpro, etc.) vía transferencia ACH inmediata.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <span className="text-[10px] text-emerald-300 font-bold uppercase block">
                      Saldo Disponible para Retiro
                    </span>
                    <p className="font-mono text-2xl font-black text-white mt-1">
                      C$ {availableWithdrawalBalanceNIO.toFixed(2)}
                    </p>
                    <span className="text-[10px] text-emerald-200">
                      ≈ ${(availableWithdrawalBalanceNIO / (storeSettings.exchangeRate || 36.8)).toFixed(2)} USD
                    </span>
                  </div>

                  <div className="p-3 bg-white/10 rounded-xl">
                    <span className="text-[10px] text-emerald-300 font-bold uppercase block">
                      Cuenta Bancaria Registrada
                    </span>
                    <p className="font-mono text-xs font-bold text-amber-300 mt-1 truncate">
                      {bankNameInput} · {bankAccountInput}
                    </p>
                    <span className="text-[10px] text-stone-300">Titular: {bankHolderInput}</span>
                  </div>
                </div>
              </div>

              {/* Bank Withdrawal Request Form */}
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
                  <span>Solicitar Transferencia a Cuenta Bancaria</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Banco Destino:
                    </label>
                    <select
                      value={bankNameInput}
                      onChange={(e) => setBankNameInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Banco LAFISE Bancentro">Banco LAFISE Bancentro</option>
                      <option value="BAC Credomatic">BAC Credomatic Nicaragua</option>
                      <option value="Banco de la Producción (Banpro)">Banpro Promerica</option>
                      <option value="Banco Ficohsa">Banco Ficohsa</option>
                      <option value="Banco BDF">Banco BDF</option>
                      <option value="Billetera Móvil Banpro / LAFISE">Billetera Móvil Nacional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Número de Cuenta Bancaria:
                    </label>
                    <input
                      type="text"
                      value={bankAccountInput}
                      onChange={(e) => setBankAccountInput(e.target.value)}
                      placeholder="Ej. 134082049"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Nombre del Titular:
                    </label>
                    <input
                      type="text"
                      value={bankHolderInput}
                      onChange={(e) => setBankHolderInput(e.target.value)}
                      placeholder="Nombre del dueño"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Monto a Retirar en Córdobas (C$):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max={availableWithdrawalBalanceNIO}
                        value={bankWithdrawAmountInput}
                        onChange={(e) => setBankWithdrawAmountInput(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-stone-500 font-mono">
                        ≈ ${(bankWithdrawAmountInput / (storeSettings.exchangeRate || 36.8)).toFixed(2)} USD
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className="text-stone-500">Máximo: C$ {availableWithdrawalBalanceNIO.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => setBankWithdrawAmountInput(Math.floor(availableWithdrawalBalanceNIO))}
                        className="text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        Retirar todo el saldo
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={handleRequestBankWithdrawal}
                      disabled={isProcessingBankWithdrawal || availableWithdrawalBalanceNIO <= 0}
                      className="w-full py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      {isProcessingBankWithdrawal ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Procesando transferencia bancaria...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Transferir a mi Cuenta Bancaria</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bank Withdrawal History */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">
                  Historial de Retiros a Cuentas Bancarias
                </h4>

                <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 text-stone-700 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
                      <tr>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Transacción ID</th>
                        <th className="py-2.5 px-3">Banco / Cuenta</th>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3 text-right">Monto Retirado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {bankWithdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-stone-50 transition-colors">
                          <td className="py-2.5 px-3 text-stone-500 whitespace-nowrap">{w.date}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-stone-800">{w.transactionId}</td>
                          <td className="py-2.5 px-3 text-stone-600 font-medium text-[11px]">
                            {w.bankName} ({w.accountNumber})
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Completado</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 text-right whitespace-nowrap">
                            C$ {w.amountNIO} (${w.amountUSD} USD)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. PAYPAL WITHDRAWALS */}
          {activeTab === 'paypal' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-900 via-indigo-950 to-stone-900 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center justify-center font-bold text-xl">
                      🅿️
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold">Retiros de Dinero a PayPal</h3>
                      <p className="text-xs text-sky-200">
                        Transfiere tus comisiones acumuladas (2%) y ganancias por anuncios directo a tu saldo PayPal.
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://www.paypal.com/myaccount/money/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-sky-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-sky-400/30 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir PayPal.com</span>
                  </a>
                </div>

                {/* Available Balance Box */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-sky-300 uppercase tracking-wider block font-bold">
                      Saldo Disponible para Retirar
                    </span>
                    <p className="font-mono text-2xl font-black text-emerald-400 mt-1">
                      {formatCurrency(availableWithdrawalBalanceNIO, currency, storeSettings.exchangeRate)}
                    </p>
                    <span className="text-[10px] text-stone-300">
                      ≈ ${(availableWithdrawalBalanceNIO / (storeSettings.exchangeRate || 36.8)).toFixed(2)} USD
                    </span>
                  </div>

                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-sky-300 uppercase tracking-wider block font-bold">
                      Total Retirado por PayPal
                    </span>
                    <p className="font-mono text-xl font-bold text-white mt-1">
                      {formatCurrency(totalPaypalWithdrawnNIO, currency, storeSettings.exchangeRate)}
                    </p>
                    <span className="text-[10px] text-stone-300">
                      {paypalWithdrawals.length} retiro(s) procesados
                    </span>
                  </div>

                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-sky-300 uppercase tracking-wider block font-bold">
                      Cuenta PayPal Vinculada
                    </span>
                    <p className="font-mono text-xs font-bold text-amber-300 mt-1 truncate">
                      {paypalEmailInput}
                    </p>
                    <span className="text-[10px] text-stone-300">Cuenta oficial verificada</span>
                  </div>
                </div>
              </div>

              {/* Withdrawal Request Form */}
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <ArrowDownToLine className="w-4 h-4 text-sky-600" />
                  <span>Solicitar Retiro Inmediato a PayPal</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Correo Electrónico de PayPal del Dueño:
                    </label>
                    <input
                      type="email"
                      value={paypalEmailInput}
                      onChange={(e) => setPaypalEmailInput(e.target.value)}
                      placeholder="cuenta-paypal@ejemplo.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-sky-500 font-mono"
                    />
                    <span className="text-[10px] text-stone-500 mt-1 block">
                      Los fondos se enviarán a esta cuenta de PayPal.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Monto a Retirar en Córdobas (C$):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max={availableWithdrawalBalanceNIO}
                        value={withdrawAmountInput}
                        onChange={(e) => setWithdrawAmountInput(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-sky-500 font-mono"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-stone-500 font-mono">
                        ≈ ${(withdrawAmountInput / (storeSettings.exchangeRate || 36.8)).toFixed(2)} USD
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className="text-stone-500">Máximo: C$ {availableWithdrawalBalanceNIO.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => setWithdrawAmountInput(Math.floor(availableWithdrawalBalanceNIO))}
                        className="text-sky-700 font-bold hover:underline cursor-pointer"
                      >
                        Retirar todo el saldo
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-stone-200">
                  <div className="text-xs text-stone-500">
                    Tarifa de procesamiento: <strong className="text-emerald-700">0% (Gratis)</strong>
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestPaypalWithdrawal}
                    disabled={isProcessingWithdrawal || availableWithdrawalBalanceNIO <= 0}
                    className="py-2.5 px-5 bg-gradient-to-r from-sky-600 to-indigo-700 hover:from-sky-700 hover:to-indigo-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2 active:scale-95 transition-all"
                  >
                    {isProcessingWithdrawal ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Procesando con PayPal...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Transferir a mi PayPal</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* PayPal Withdrawal History */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">
                  Historial de Retiros a PayPal
                </h4>

                <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 text-stone-700 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
                      <tr>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Transacción ID</th>
                        <th className="py-2.5 px-3">Correo Destino</th>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3 text-right">Monto Retirado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {paypalWithdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-stone-50 transition-colors">
                          <td className="py-2.5 px-3 text-stone-500 whitespace-nowrap">{w.date}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-stone-800">{w.transactionId}</td>
                          <td className="py-2.5 px-3 text-stone-600 font-mono text-[11px]">{w.paypalEmail}</td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Completado</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 text-right whitespace-nowrap">
                            C$ {w.amountNIO} (${w.amountUSD} USD)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. ADS MONETIZATION */}
          {activeTab === 'ads' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950 via-stone-900 to-amber-900 text-white space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold text-xl">
                    📢
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold">Ganar Dinero con Anuncios & Publicidad</h3>
                    <p className="text-xs text-amber-200">
                      Monetiza el tráfico de clientes mediante Google AdSense, banners de boutiques y negocios locales de Nicaragua.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-amber-300 uppercase tracking-wider block font-bold">
                      Ingresos de Publicidad Acumulados
                    </span>
                    <p className="font-mono text-2xl font-black text-amber-300 mt-1">
                      {formatCurrency(totalAdsRevenue, currency, storeSettings.exchangeRate)}
                    </p>
                    <span className="text-[10px] text-stone-300">Directo a tu saldo PayPal</span>
                  </div>

                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-amber-300 uppercase tracking-wider block font-bold">
                      Formato de Anuncios
                    </span>
                    <p className="font-mono text-xs font-bold text-white mt-1">
                      Banners en Catálogo + Intersticiales
                    </p>
                    <span className="text-[10px] text-stone-300">Optimizados para móviles</span>
                  </div>

                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-amber-300 uppercase tracking-wider block font-bold">
                      Pago al Dueño
                    </span>
                    <p className="font-mono text-xs font-bold text-emerald-400 mt-1">
                      Retirable a PayPal
                    </p>
                    <span className="text-[10px] text-stone-300">{defaultPaypalEmail}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions: Simulate or Add Ad Revenue */}
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                <h4 className="font-bold text-sm text-stone-900">
                  Opciones para Generar Ingresos por Publicidad
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-amber-600" />
                        <span>Google AdSense para Web & GitHub Pages</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                        Automático
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600">
                      Gana dinero por cada 1,000 impresiones de las personas que navegan las prendas.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAddSimulatedAdRevenue('Pago de Banners AdSense (3,500 visitas)', 350, 'ingresos_adsense')}
                      className="w-full py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      + Registrar Ganancia AdSense (+C$ 350)
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <Megaphone className="w-4 h-4 text-violet-600" />
                        <span>Anuncios Patrocinados de Negocios Locales</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-violet-100 text-violet-800 px-2 py-0.5 rounded">
                        C$ 500 - C$ 1,500
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600">
                      Boutiques, zapaterías y salones de belleza pagan por un banner fijo en el inicio de la app.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAddSimulatedAdRevenue('Banner Patrocinado Joyería & Accesorios', 650, 'publicidad_anuncio')}
                      className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      + Registrar Patrocinio Local (+C$ 650)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. MEMBERSHIPS */}
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

          {/* 6. PRODUCT BOOSTS */}
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
                      Billetera {storeSettings.platformOwnerWallet || PLATFORM_OWNER_CONFIG.walletPhone} o PayPal
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

          {/* 7. VERIFICATION */}
          {activeTab === 'verification' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-950 to-indigo-950 text-white space-y-3">
                <div className="flex items-center gap-2.5">
                  <Award className="w-6 h-6 text-sky-300" />
                  <h3 className="font-serif text-lg font-bold">Sello de Tienda Oficial Verificada</h3>
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
                    {storeSettings.hidePersonalAccountsFromPublic
                      ? 'Ingreso neto procesado mediante pasarela comercial segura sin exponer datos personales.'
                      : `Ingreso neto instantáneo pagado a Billetera ${storeSettings.platformOwnerWallet || '+505 58898311'} o cuenta bancaria sin costos recurrentes.`}
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

          {/* 8. HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-stone-900">Registro de Ganancias Recaudadas</h3>
                  <p className="text-xs text-stone-500">
                    Comisiones del 2%, suscripciones pro, publicidad y pagos destinados a las cuentas oficiales.
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
                          {item.paymentDestination === 'billetera_movil'
                            ? 'Billetera Móvil'
                            : item.paymentDestination === 'paypal'
                            ? 'PayPal'
                            : 'Cuenta LAFISE'}
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
