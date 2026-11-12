import React, { useEffect, useMemo, useState } from 'react';
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
  Wallet,
  Send,
  Megaphone,
  Globe,
  ExternalLink,
  Clock,
  ArrowDownToLine,
  RefreshCw,
  Settings,
  XCircle,
  AlertCircle
} from 'lucide-react';
import {
  BusinessAd,
  CurrencyType,
  GoogleAdSenseConfig,
  Product,
  StoreSettings,
  UserAccount
} from '../types';
import {
  PLATFORM_OWNER_CONFIG,
  STORE_MEMBERSHIP_TIERS,
  PRODUCT_BOOST_TIERS,
  STORE_VERIFICATION_PLAN,
  getSavedPlatformEarnings,
  savePlatformEarning,
  updatePlatformEarningStatus,
  saveAllPlatformEarnings,
  PlatformEarningRecord,
  calculateEarningsSplit,
  PaypalWithdrawalRecord,
  getSavedPaypalWithdrawals,
  savePaypalWithdrawal,
  updatePaypalWithdrawalStatus,
  saveAllPaypalWithdrawals,
  BankWithdrawalRecord,
  getSavedBankWithdrawals,
  saveBankWithdrawal,
  updateBankWithdrawalStatus,
  saveAllBankWithdrawals
} from '../utils/monetization';
import { DEFAULT_ADSENSE_CONFIG } from '../utils/advertising';
import { OFFICIAL_APP_URLS } from '../utils/appUrl';
import { formatCurrency } from '../utils/storage';
import {
  savePlatformEarningToCloud,
  updatePlatformEarningStatusInCloud,
  savePlatformWithdrawalToCloud,
  updatePlatformWithdrawalInCloud
} from '../firebase';

type MonetizationTab =
  | 'overview'
  | 'config'
  | 'commission'
  | 'bank'
  | 'paypal'
  | 'ads'
  | 'memberships'
  | 'boosts'
  | 'verification'
  | 'history';

interface PendingCheckoutItem {
  kind: 'membership' | 'boost' | 'verification';
  source: PlatformEarningRecord['source'];
  title: string;
  amountNIO: number;
  planId?: string;
  productId?: string;
  boostDays?: number;
}

interface MonetizationHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSettings: StoreSettings;
  currency: CurrencyType;
  products: Product[];
  businessAds?: BusinessAd[];
  currentUser: UserAccount | null;
  isOwnerCreator?: boolean;
  initialTab?: MonetizationTab;
  cloudEarnings?: PlatformEarningRecord[];
  cloudPaypalWithdrawals?: PaypalWithdrawalRecord[];
  cloudBankWithdrawals?: BankWithdrawalRecord[];
  onUpdateProduct?: (product: Product) => void;
  onUpdateUser?: (user: UserAccount) => void;
  onSaveSettings?: (settings: StoreSettings) => void;
  onUpdateBusinessAd?: (ad: BusinessAd) => void;
  onOpenAdvertiseModal?: () => void;
}

export const MonetizationHubModal: React.FC<MonetizationHubModalProps> = ({
  isOpen,
  onClose,
  storeSettings,
  currency,
  products,
  businessAds = [],
  currentUser,
  isOwnerCreator = false,
  initialTab,
  cloudEarnings,
  cloudPaypalWithdrawals,
  cloudBankWithdrawals,
  onUpdateProduct,
  onUpdateUser,
  onSaveSettings,
  onUpdateBusinessAd,
  onOpenAdvertiseModal
}) => {
  const defaultTab: MonetizationTab = isOwnerCreator
    ? initialTab || 'overview'
    : initialTab === 'boosts' || initialTab === 'verification'
    ? initialTab
    : 'memberships';

  const [activeTab, setActiveTab] = useState<MonetizationTab>(defaultTab);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedPaypal, setCopiedPaypal] = useState(false);

  const [earningsList, setEarningsList] = useState<PlatformEarningRecord[]>(getSavedPlatformEarnings);
  const [paypalWithdrawals, setPaypalWithdrawals] = useState<PaypalWithdrawalRecord[]>(
    getSavedPaypalWithdrawals
  );
  const [bankWithdrawals, setBankWithdrawals] = useState<BankWithdrawalRecord[]>(
    getSavedBankWithdrawals
  );

  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Real Calculator Input
  const [calcSaleAmount, setCalcSaleAmount] = useState<number>(1000);

  // Boost Selection State
  const [selectedProductToBoost, setSelectedProductToBoost] = useState<string>(
    products[0]?.id || ''
  );
  const [selectedBoostTier, setSelectedBoostTier] = useState<string>('boost_7_dias');

  // Seller Payment Checkout Modal State (for real Subscriptions / Boosts / Verification)
  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckoutItem | null>(null);
  const [checkoutDestination, setCheckoutDestination] =
    useState<PlatformEarningRecord['paymentDestination']>('paypal');
  const [checkoutReference, setCheckoutReference] = useState<string>('');
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);

  // Owner Google AdSense Real Config & Real Payout Entry State
  const [adSenseForm, setAdSenseForm] = useState<GoogleAdSenseConfig>(
    storeSettings.adSenseConfig || DEFAULT_ADSENSE_CONFIG
  );
  const [realAdSenseAmount, setRealAdSenseAmount] = useState<string>('');
  const [realAdSenseRef, setRealAdSenseRef] = useState<string>('');

  // Payout Configuration State (Owner Configuration for Withdrawals)
  const defaultPaypalEmail =
    storeSettings.platformOwnerPaypalEmail || PLATFORM_OWNER_CONFIG.paypalEmail || '';
  const [cfgPaypalEmail, setCfgPaypalEmail] = useState<string>(defaultPaypalEmail);
  const [cfgPaymentLink, setCfgPaymentLink] = useState<string>(
    storeSettings.platformPaymentLink || 'https://paypal.me/elclosetdejie'
  );
  const [cfgBankName, setCfgBankName] = useState<string>(
    storeSettings.platformOwnerBank || 'Banco LAFISE Bancentro'
  );
  const [cfgBankAccount, setCfgBankAccount] = useState<string>(
    storeSettings.platformOwnerAccount || ''
  );
  const [cfgBankHolder, setCfgBankHolder] = useState<string>(
    storeSettings.bankAccountHolder || 'Administración Central'
  );
  const [cfgWalletPhone, setCfgWalletPhone] = useState<string>(
    storeSettings.platformOwnerWallet || ''
  );
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // PayPal Withdrawal State
  const [paypalEmailInput, setPaypalEmailInput] = useState<string>(defaultPaypalEmail);
  const [withdrawAmountInput, setWithdrawAmountInput] = useState<number>(0);
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);

  // Bank Withdrawal State
  const [bankNameInput, setBankNameInput] = useState<string>(
    storeSettings.platformOwnerBank || 'Banco LAFISE Bancentro'
  );
  const [bankAccountInput, setBankAccountInput] = useState<string>(
    storeSettings.platformOwnerAccount || ''
  );
  const [bankHolderInput, setBankHolderInput] = useState<string>(
    storeSettings.bankAccountHolder || 'Administración El Clóset de Jié'
  );
  const [bankWithdrawAmountInput, setBankWithdrawAmountInput] = useState<number>(0);
  const [isProcessingBankWithdrawal, setIsProcessingBankWithdrawal] = useState(false);

  // Confirming Requested Withdrawal Transaction ID State
  const [confirmingWithdrawalId, setConfirmingWithdrawalId] = useState<string | null>(null);
  const [confirmTxInput, setConfirmTxInput] = useState<string>('');

  // Sync tab when opened
  useEffect(() => {
    if (!isOpen) return;
    if (!isOwnerCreator) {
      setActiveTab(
        initialTab === 'boosts' || initialTab === 'verification' ? initialTab : 'memberships'
      );
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
    setAdSenseForm(storeSettings.adSenseConfig || DEFAULT_ADSENSE_CONFIG);
    setCfgPaypalEmail(storeSettings.platformOwnerPaypalEmail || PLATFORM_OWNER_CONFIG.paypalEmail || '');
    setCfgPaymentLink(storeSettings.platformPaymentLink || 'https://paypal.me/elclosetdejie');
    setCfgBankName(storeSettings.platformOwnerBank || 'Banco LAFISE Bancentro');
    setCfgBankAccount(storeSettings.platformOwnerAccount || '');
    setCfgBankHolder(storeSettings.bankAccountHolder || 'Administración Central');
    setCfgWalletPhone(storeSettings.platformOwnerWallet || '');
    setPaypalEmailInput(storeSettings.platformOwnerPaypalEmail || PLATFORM_OWNER_CONFIG.paypalEmail || '');
    setBankNameInput(storeSettings.platformOwnerBank || 'Banco LAFISE Bancentro');
    setBankAccountInput(storeSettings.platformOwnerAccount || '');
    setBankHolderInput(storeSettings.bankAccountHolder || 'Administración El Clóset de Jié');
    if (products.length > 0 && !selectedProductToBoost) {
      setSelectedProductToBoost(products[0].id);
    }
  }, [isOpen, isOwnerCreator, initialTab, storeSettings, products, selectedProductToBoost]);

  // Merge cloud + local earnings/withdrawals whenever updated
  useEffect(() => {
    const localEarn = getSavedPlatformEarnings();
    if (cloudEarnings && cloudEarnings.length > 0) {
      const map = new Map<string, PlatformEarningRecord>();
      localEarn.forEach((e) => map.set(e.id, e));
      cloudEarnings.forEach((ce) => map.set(ce.id, ce));
      const merged = Array.from(map.values());
      saveAllPlatformEarnings(merged);
      setEarningsList(merged);
    } else {
      setEarningsList(localEarn);
    }
  }, [cloudEarnings, isOpen]);

  useEffect(() => {
    const localPp = getSavedPaypalWithdrawals();
    if (cloudPaypalWithdrawals && cloudPaypalWithdrawals.length > 0) {
      const map = new Map<string, PaypalWithdrawalRecord>();
      localPp.forEach((w) => map.set(w.id, w));
      cloudPaypalWithdrawals.forEach((cw) => map.set(cw.id, cw));
      const merged = Array.from(map.values());
      saveAllPaypalWithdrawals(merged);
      setPaypalWithdrawals(merged);
    } else {
      setPaypalWithdrawals(localPp);
    }
  }, [cloudPaypalWithdrawals, isOpen]);

  useEffect(() => {
    const localBk = getSavedBankWithdrawals();
    if (cloudBankWithdrawals && cloudBankWithdrawals.length > 0) {
      const map = new Map<string, BankWithdrawalRecord>();
      localBk.forEach((w) => map.set(w.id, w));
      cloudBankWithdrawals.forEach((cw) => map.set(cw.id, cw));
      const merged = Array.from(map.values());
      saveAllBankWithdrawals(merged);
      setBankWithdrawals(merged);
    } else {
      setBankWithdrawals(localBk);
    }
  }, [cloudBankWithdrawals, isOpen]);

  // Confirmed & Pending Real Earnings Aggregation
  const confirmedEarnings = useMemo(
    () => earningsList.filter((e) => e.status === 'liquidado'),
    [earningsList]
  );

  const pendingEarnings = useMemo(
    () => earningsList.filter((e) => e.status === 'pendiente_confirmacion'),
    [earningsList]
  );

  const totalCommissionRevenue = useMemo(
    () =>
      confirmedEarnings
        .filter((e) => e.source === 'comision_2_porciento' || e.source === 'comision_3_porciento')
        .reduce((sum, e) => sum + e.amountNIO, 0),
    [confirmedEarnings]
  );

  const totalPendingCommissionRevenue = useMemo(
    () =>
      pendingEarnings
        .filter((e) => e.source === 'comision_2_porciento' || e.source === 'comision_3_porciento')
        .reduce((sum, e) => sum + e.amountNIO, 0),
    [pendingEarnings]
  );

  const totalMembershipsRevenue = useMemo(
    () =>
      confirmedEarnings
        .filter((e) => e.source === 'plan_tienda_pro' || e.source === 'plan_boutique_vip')
        .reduce((sum, e) => sum + e.amountNIO, 0),
    [confirmedEarnings]
  );

  const totalBoostsRevenue = useMemo(
    () =>
      confirmedEarnings
        .filter((e) => e.source === 'destacado_producto')
        .reduce((sum, e) => sum + e.amountNIO, 0),
    [confirmedEarnings]
  );

  const totalAdsRevenue = useMemo(
    () =>
      confirmedEarnings
        .filter((e) => e.source === 'publicidad_anuncio' || e.source === 'ingresos_adsense')
        .reduce((sum, e) => sum + e.amountNIO, 0),
    [confirmedEarnings]
  );

  const totalOtherRevenue = useMemo(
    () =>
      confirmedEarnings
        .filter((e) => e.source === 'verificacion_tienda')
        .reduce((sum, e) => sum + e.amountNIO, 0),
    [confirmedEarnings]
  );

  const totalConfirmedEarningsNIO =
    totalCommissionRevenue +
    totalMembershipsRevenue +
    totalBoostsRevenue +
    totalAdsRevenue +
    totalOtherRevenue;

  const totalPendingEarningsNIO = useMemo(
    () => pendingEarnings.reduce((sum, e) => sum + e.amountNIO, 0),
    [pendingEarnings]
  );

  const totalPaypalReservedNIO = useMemo(
    () => paypalWithdrawals.reduce((sum, w) => sum + w.amountNIO, 0),
    [paypalWithdrawals]
  );

  const totalBankReservedNIO = useMemo(
    () => bankWithdrawals.reduce((sum, w) => sum + w.amountNIO, 0),
    [bankWithdrawals]
  );

  const availableWithdrawalBalanceNIO = Math.max(
    0,
    totalConfirmedEarningsNIO - totalPaypalReservedNIO - totalBankReservedNIO
  );

  const paidBusinessAds = useMemo(
    () => businessAds.filter((ad) => ad.pricePaid > 0),
    [businessAds]
  );

  const isAdSenseActive = Boolean(
    adSenseForm.enabled &&
      /^ca-pub-\d{10,20}$/.test((adSenseForm.publisherId || '').trim()) &&
      adSenseForm.publisherId.trim() !== 'ca-pub-0000000000000000'
  );

  if (!isOpen) return null;

  const showBanner = (type: 'success' | 'error', message: string) => {
    setFeedbackBanner({ type, message });
    setTimeout(() => setFeedbackBanner(null), 5500);
  };

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

  const calcSplit = calculateEarningsSplit(calcSaleAmount);

  // Open Real Checkout Step for Paid Seller Plans / Boosts / Verification
  const handleStartMembership = (planId: string, planTitle: string, priceNIO: number) => {
    if (priceNIO === 0) {
      showBanner('success', 'El Plan Tienda Básica Gratuito ya se encuentra activo en tu cuenta.');
      return;
    }
    setCheckoutReference('');
    setPendingCheckout({
      kind: 'membership',
      source: planId === 'plan_boutique_vip' ? 'plan_boutique_vip' : 'plan_tienda_pro',
      title: `Pago Suscripción ${planTitle}`,
      amountNIO: priceNIO,
      planId
    });
  };

  const handleStartBoost = () => {
    const tier = PRODUCT_BOOST_TIERS.find((b) => b.id === selectedBoostTier) || PRODUCT_BOOST_TIERS[1];
    const prod = products.find((p) => p.id === selectedProductToBoost);
    if (!prod) {
      showBanner('error', 'Primero debes tener al menos un producto publicado para poder impulsarlo.');
      return;
    }
    setCheckoutReference('');
    setPendingCheckout({
      kind: 'boost',
      source: 'destacado_producto',
      title: `${tier.title}: ${prod.name}`,
      amountNIO: tier.priceNIO,
      productId: prod.id,
      boostDays: tier.priceNIO === 35 ? 3 : tier.priceNIO === 70 ? 7 : 15
    });
  };

  const handleStartVerification = () => {
    setCheckoutReference('');
    setPendingCheckout({
      kind: 'verification',
      source: 'verificacion_tienda',
      title: 'Sello de Tienda Oficial Verificada',
      amountNIO: STORE_VERIFICATION_PLAN.priceNIO
    });
  };

  // Submit Real Payment Record with Mandatory Voucher/Transaction Reference
  const handleSubmitCheckoutPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCheckout) return;

    const cleanRef = checkoutReference.trim();
    if (cleanRef.length < 4) {
      showBanner(
        'error',
        'Por favor ingresa el número de comprobante o ID de transacción real (mínimo 4 caracteres).'
      );
      return;
    }

    setIsSubmittingCheckout(true);
    try {
      const storeOrUserName =
        currentUser?.storeName || currentUser?.name || storeSettings.storeName || 'Tienda';
      const earningId = `${pendingCheckout.kind}-${Date.now()}`;
      const newRecord: PlatformEarningRecord = {
        id: earningId,
        authorId: currentUser?.uid,
        source: pendingCheckout.source,
        title: pendingCheckout.title,
        amountNIO: pendingCheckout.amountNIO,
        storeOrUserName,
        date: new Date().toLocaleDateString('es-NI'),
        status: isOwnerCreator ? 'liquidado' : 'pendiente_confirmacion',
        reference: cleanRef,
        paymentDestination: checkoutDestination,
        targetId: pendingCheckout.productId || pendingCheckout.planId
      };

      savePlatformEarning(newRecord);
      setEarningsList(getSavedPlatformEarnings());
      await savePlatformEarningToCloud(newRecord).catch((err) =>
        console.warn('Cloud earning sync notice:', err)
      );

      // Apply immediate effect ONLY when owner directly verifies/activates, otherwise notify pending
      if (isOwnerCreator) {
        if (pendingCheckout.kind === 'membership' && currentUser && onUpdateUser) {
          onUpdateUser({
            ...currentUser,
            storePlan: pendingCheckout.planId === 'plan_boutique_vip' ? 'vip' : 'pro',
            storePlanExpiresAt: Date.now() + 30 * 86400000
          });
        } else if (pendingCheckout.kind === 'boost' && pendingCheckout.productId && onUpdateProduct) {
          const targetProd = products.find((p) => p.id === pendingCheckout.productId);
          if (targetProd) {
            onUpdateProduct({
              ...targetProd,
              isBoosted: true,
              boostDays: pendingCheckout.boostDays || 7,
              featured: true
            });
          }
        } else if (pendingCheckout.kind === 'verification' && currentUser && onUpdateUser) {
          onUpdateUser({ ...currentUser, role: 'seller' });
        }
        showBanner('success', `Pago verificado (${cleanRef}) y servicio activado en tiempo real.`);
      } else {
        showBanner(
          'success',
          `¡Solicitud enviada con comprobante ${cleanRef}! El propietario confirmará la recepción del pago para activar tu servicio.`
        );
      }

      setPendingCheckout(null);
      setCheckoutReference('');
    } finally {
      setIsSubmittingCheckout(false);
    }
  };

  // Owner Confirms / Rejects Pending Payment in Real Time
  const handleConfirmEarning = async (record: PlatformEarningRecord) => {
    if (!isOwnerCreator) return;
    const updated = updatePlatformEarningStatus(record.id, 'liquidado');
    setEarningsList(updated);
    await updatePlatformEarningStatusInCloud(record.id, 'liquidado', record.reference).catch((e) =>
      console.warn('Cloud status confirm notice:', e)
    );

    if (record.source === 'destacado_producto' && record.targetId && onUpdateProduct) {
      const targetProd = products.find((p) => p.id === record.targetId);
      if (targetProd) {
        onUpdateProduct({ ...targetProd, isBoosted: true, featured: true });
      }
    }
    showBanner(
      'success',
      `Pago confirmado (+C$ ${record.amountNIO}). El saldo ya está acreditado para retiro.`
    );
  };

  const handleRejectEarning = async (record: PlatformEarningRecord) => {
    if (!isOwnerCreator) return;
    const updated = updatePlatformEarningStatus(record.id, 'rechazado');
    setEarningsList(updated);
    await updatePlatformEarningStatusInCloud(record.id, 'rechazado', record.reference).catch((e) =>
      console.warn('Cloud status reject notice:', e)
    );
    showBanner('success', `Registro "${record.title}" marcado como rechazado y excluido del saldo.`);
  };

  // Owner Approves Paid Business Ad Directly
  const handleApproveBusinessAdPayment = async (ad: BusinessAd) => {
    if (!isOwnerCreator) return;
    if (onUpdateBusinessAd) {
      onUpdateBusinessAd({
        ...ad,
        paymentStatus: 'pagado',
        status: 'activo'
      });
    }
    const earningId = `earn-ad-${ad.id}`;
    const existing = earningsList.find((e) => e.id === earningId || e.targetId === ad.id);
    if (existing) {
      const updated = updatePlatformEarningStatus(existing.id, 'liquidado');
      setEarningsList(updated);
      await updatePlatformEarningStatusInCloud(existing.id, 'liquidado', ad.paymentReference).catch(
        () => {}
      );
    } else if (ad.pricePaid > 0) {
      const newRecord: PlatformEarningRecord = {
        id: earningId,
        authorId: ad.authorId || currentUser?.uid,
        source: 'publicidad_anuncio',
        title: `Publicidad ${ad.planName}: ${ad.businessName}`,
        amountNIO: ad.pricePaid,
        storeOrUserName: ad.businessName,
        date: new Date().toLocaleDateString('es-NI'),
        status: 'liquidado',
        reference: ad.paymentReference || ad.id,
        paymentDestination: 'digital_link',
        targetId: ad.id
      };
      savePlatformEarning(newRecord);
      setEarningsList(getSavedPlatformEarnings());
      await savePlatformEarningToCloud(newRecord).catch(() => {});
    }
    showBanner('success', `Anuncio "${ad.businessName}" confirmado como pagado y activo.`);
  };

  // Save Google AdSense Real Configuration
  const handleSaveAdSenseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerCreator) return;
    const cleanedPub = adSenseForm.publisherId.trim();
    if (cleanedPub && !/^ca-pub-\d{10,20}$/.test(cleanedPub)) {
      showBanner(
        'error',
        'El ID de Publicador de Google AdSense debe tener el formato real ca-pub- seguido de 10 a 20 dígitos (ej. ca-pub-1234567890123456).'
      );
      return;
    }

    const updatedSettings: StoreSettings = {
      ...storeSettings,
      adSenseConfig: {
        ...adSenseForm,
        publisherId: cleanedPub,
        headerSlotId: (adSenseForm.headerSlotId || '').trim(),
        inFeedSlotId: (adSenseForm.inFeedSlotId || '').trim(),
        footerSlotId: (adSenseForm.footerSlotId || '').trim()
      }
    };
    onSaveSettings?.(updatedSettings);
    showBanner(
      'success',
      cleanedPub
        ? `Google AdSense (${cleanedPub}) guardado y sincronizado en vivo para todos los visitantes.`
        : 'Configuración de Google AdSense actualizada.'
    );
  };

  // Owner Records Real Confirmed Google AdSense Payout Settlement (Manual Real Entry)
  const handleRecordRealAdSenseSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerCreator) return;
    const numericAmount = Number(realAdSenseAmount);
    const cleanRef = realAdSenseRef.trim();
    if (!numericAmount || numericAmount <= 0) {
      showBanner('error', 'Ingresa un monto real mayor a C$ 0.');
      return;
    }
    if (cleanRef.length < 4) {
      showBanner('error', 'Ingresa el número real de comprobante o pago de Google AdSense.');
      return;
    }

    const record: PlatformEarningRecord = {
      id: `adsense-${Date.now()}`,
      authorId: currentUser?.uid,
      source: 'ingresos_adsense',
      title: 'Liquidación Real Google AdSense',
      amountNIO: numericAmount,
      storeOrUserName: 'Google AdSense',
      date: new Date().toLocaleDateString('es-NI'),
      status: 'liquidado',
      reference: cleanRef,
      paymentDestination: 'paypal'
    };

    savePlatformEarning(record);
    setEarningsList(getSavedPlatformEarnings());
    await savePlatformEarningToCloud(record).catch((err) =>
      console.warn('Cloud adsense save notice:', err)
    );
    setRealAdSenseAmount('');
    setRealAdSenseRef('');
    showBanner(
      'success',
      `Liquidación real de Google AdSense (+C$ ${numericAmount.toFixed(2)}) registrada con referencia ${cleanRef}.`
    );
  };

  // Request Real PayPal Withdrawal (Persists as 'solicitado' until confirmed with real PayPal TX ID)
  const handleRequestPaypalWithdrawal = async () => {
    if (!isOwnerCreator) return;
    if (withdrawAmountInput <= 0) {
      showBanner('error', 'Ingresa un monto válido mayor a C$ 0 para retirar.');
      return;
    }
    if (withdrawAmountInput > availableWithdrawalBalanceNIO) {
      showBanner(
        'error',
        `El monto solicitado (C$ ${withdrawAmountInput}) supera tu saldo real confirmado disponible (C$ ${availableWithdrawalBalanceNIO.toFixed(2)}).`
      );
      return;
    }
    if (!paypalEmailInput.includes('@')) {
      showBanner('error', 'Ingresa un correo electrónico de PayPal válido.');
      return;
    }

    setIsProcessingWithdrawal(true);
    try {
      const exchangeRate = storeSettings.exchangeRate || 36.5;
      const amountUSD = Number((withdrawAmountInput / exchangeRate).toFixed(2));
      const reqId = `pp-wd-${Date.now()}`;
      const newRecord: PaypalWithdrawalRecord = {
        id: reqId,
        paypalEmail: paypalEmailInput.trim(),
        amountNIO: withdrawAmountInput,
        amountUSD,
        date: new Date().toLocaleDateString('es-NI'),
        status: 'solicitado',
        transactionId: `SOLICITADO-${Date.now().toString().slice(-6)}`,
        sourceBreakdown: 'Ingresos reales confirmados',
        note: 'Pendiente de confirmar con ID de transacción PayPal real'
      };

      savePaypalWithdrawal(newRecord);
      setPaypalWithdrawals(getSavedPaypalWithdrawals());
      await savePlatformWithdrawalToCloud('paypal', newRecord).catch((err) =>
        console.warn('Cloud PayPal withdrawal notice:', err)
      );
      setWithdrawAmountInput(0);
      showBanner(
        'success',
        `Solicitud de retiro a PayPal por C$ ${newRecord.amountNIO} ($${amountUSD} USD) registrada. Transfiere desde PayPal y confirma con tu ID de transacción real.`
      );
    } finally {
      setIsProcessingWithdrawal(false);
    }
  };

  // Request Real Bank Withdrawal
  const handleRequestBankWithdrawal = async () => {
    if (!isOwnerCreator) return;
    if (bankWithdrawAmountInput <= 0) {
      showBanner('error', 'Ingresa un monto válido mayor a C$ 0 para transferir.');
      return;
    }
    if (bankWithdrawAmountInput > availableWithdrawalBalanceNIO) {
      showBanner(
        'error',
        `El monto solicitado (C$ ${bankWithdrawAmountInput}) supera tu saldo real confirmado disponible (C$ ${availableWithdrawalBalanceNIO.toFixed(2)}).`
      );
      return;
    }
    if (!bankAccountInput.trim()) {
      showBanner('error', 'Ingresa el número de cuenta bancaria nacional.');
      return;
    }

    setIsProcessingBankWithdrawal(true);
    try {
      const exchangeRate = storeSettings.exchangeRate || 36.5;
      const amountUSD = Number((bankWithdrawAmountInput / exchangeRate).toFixed(2));
      const reqId = `bank-wd-${Date.now()}`;
      const newRecord: BankWithdrawalRecord = {
        id: reqId,
        bankName: bankNameInput.trim() || 'Banco LAFISE Bancentro',
        accountNumber: bankAccountInput.trim(),
        accountHolder: bankHolderInput.trim() || 'Propietario',
        amountNIO: bankWithdrawAmountInput,
        amountUSD,
        date: new Date().toLocaleDateString('es-NI'),
        status: 'solicitado',
        transactionId: `ACH-PEND-${Date.now().toString().slice(-6)}`,
        sourceBreakdown: 'Ingresos reales confirmados',
        note: `Pendiente de confirmar referencia ACH hacia ${bankNameInput}`
      };

      saveBankWithdrawal(newRecord);
      setBankWithdrawals(getSavedBankWithdrawals());
      await savePlatformWithdrawalToCloud('bank', newRecord).catch((err) =>
        console.warn('Cloud bank withdrawal notice:', err)
      );
      setBankWithdrawAmountInput(0);
      showBanner(
        'success',
        `Solicitud de transferencia bancaria por C$ ${newRecord.amountNIO} registrada. Confírmala ingresando tu referencia ACH real.`
      );
    } finally {
      setIsProcessingBankWithdrawal(false);
    }
  };

  // Complete Requested Withdrawal with Real Transaction ID
  const handleCompleteWithdrawalWithTx = async (method: 'paypal' | 'bank', id: string) => {
    const cleanTx = confirmTxInput.trim();
    if (cleanTx.length < 4) {
      showBanner('error', 'Ingresa el ID de transacción real de PayPal o transferencia ACH.');
      return;
    }
    if (method === 'paypal') {
      const updated = updatePaypalWithdrawalStatus(id, 'completado', cleanTx);
      setPaypalWithdrawals(updated);
    } else {
      const updated = updateBankWithdrawalStatus(id, 'completado', cleanTx);
      setBankWithdrawals(updated);
    }
    await updatePlatformWithdrawalInCloud(id, 'completado', cleanTx).catch(() => {});
    setConfirmingWithdrawalId(null);
    setConfirmTxInput('');
    showBanner('success', `Retiro marcado como completado con referencia real ${cleanTx}.`);
  };

  // Save Configured Payout Accounts + Payment Link
  const handleSavePayoutSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerCreator) return;

    setIsSavingConfig(true);
    const updatedSettings: StoreSettings = {
      ...storeSettings,
      platformOwnerPaypalEmail: cfgPaypalEmail.trim(),
      platformPaymentLink: cfgPaymentLink.trim(),
      platformOwnerBank: cfgBankName.trim(),
      platformOwnerAccount: cfgBankAccount.trim(),
      platformOwnerWallet: cfgWalletPhone.trim(),
      bankAccountHolder: cfgBankHolder.trim()
    };

    onSaveSettings?.(updatedSettings);
    setPaypalEmailInput(cfgPaypalEmail.trim());
    setBankNameInput(cfgBankName.trim());
    setBankAccountInput(cfgBankAccount.trim());
    setBankHolderInput(cfgBankHolder.trim());
    setIsSavingConfig(false);
    showBanner(
      'success',
      '¡Cuentas reales de cobro y retiro guardadas! Se sincronizaron en tu configuración.'
    );
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
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif text-xl sm:text-2xl font-black tracking-tight">
                  {isOwnerCreator
                    ? 'Monetización Real & Ingresos de la App'
                    : 'Planes Pro, Impulsos & Verificación de Tienda'}
                </h2>
                <span className="text-[10px] bg-emerald-400 text-stone-950 font-mono font-black px-2.5 py-0.5 rounded-full uppercase">
                  100% Real
                </span>
              </div>
              <p className="text-xs text-stone-300">
                {isOwnerCreator
                  ? 'Ingresos reales en tiempo real por Google AdSense, anuncios locales, suscripciones y comisiones del 2%.'
                  : 'Impulsa tus prendas, suscríbete a Tienda Pro/VIP u obtén el sello oficial verificado.'}
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

        {/* Official Revenue Accounts Banner (Owner only when not hidden, or Payment Link) */}
        {isOwnerCreator && (
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white p-3.5 sm:p-4 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-emerald-800/60 shrink-0">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold block">
                  Canales Reales de Cobro y Retiro del Propietario
                </span>
                <p className="text-xs text-emerald-100 font-medium">
                  Confirmado: <strong>C$ {totalConfirmedEarningsNIO.toFixed(2)}</strong> • Por confirmar:{' '}
                  <strong>C$ {totalPendingEarningsNIO.toFixed(2)}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyPaypal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-950/80 hover:bg-sky-900 text-sky-200 rounded-xl text-xs font-mono font-medium border border-sky-400/40 cursor-pointer transition-colors"
              >
                <Wallet className="w-3.5 h-3.5 text-sky-400" />
                <span>PayPal: {defaultPaypalEmail || 'Sin configurar'}</span>
                {copiedPaypal ? (
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-sky-300" />
                )}
              </button>

              {storeSettings.platformOwnerWallet && (
                <button
                  type="button"
                  onClick={handleCopyWallet}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 rounded-xl text-xs font-mono font-medium border border-emerald-500/40 cursor-pointer transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{storeSettings.platformOwnerWallet}</span>
                  {copiedWallet ? (
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </button>
              )}

              {storeSettings.platformOwnerAccount && (
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 rounded-xl text-xs font-mono font-medium border border-emerald-500/40 cursor-pointer transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5 text-sky-200" />
                  <span>
                    {storeSettings.platformOwnerBank || 'Banco'}: {storeSettings.platformOwnerAccount}
                  </span>
                  {copiedAccount ? (
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-sky-200" />
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Feedback Alert */}
        {feedbackBanner && (
          <div
            className={`p-3 border-b text-xs font-bold flex items-center justify-center gap-2 shrink-0 ${
              feedbackBanner.type === 'error'
                ? 'bg-rose-100 border-rose-300 text-rose-900'
                : 'bg-emerald-100 border-emerald-300 text-emerald-900'
            }`}
          >
            {feedbackBanner.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            )}
            <span>{feedbackBanner.message}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 sm:px-6 pt-2 gap-2 shrink-0 overflow-x-auto scrollbar-none text-xs font-bold">
          {isOwnerCreator && (
            <>
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === 'overview'
                    ? 'border-emerald-600 text-emerald-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Resumen Real</span>
              </button>

              <button
                onClick={() => setActiveTab('config')}
                className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === 'config'
                    ? 'border-violet-600 text-violet-900 bg-violet-50/50 rounded-t-lg'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Settings className="w-4 h-4 text-violet-600" />
                <span>Configurar Cuentas & Link</span>
              </button>

              <button
                onClick={() => setActiveTab('ads')}
                className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === 'ads'
                    ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-lg'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Megaphone className="w-4 h-4 text-amber-600" />
                <span>Google AdSense & Anuncios</span>
              </button>

              <button
                onClick={() => setActiveTab('paypal')}
                className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === 'paypal'
                    ? 'border-sky-600 text-sky-900 bg-sky-50/50 rounded-t-lg'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Wallet className="w-4 h-4 text-sky-600" />
                <span>Retiros PayPal</span>
              </button>

              <button
                onClick={() => setActiveTab('bank')}
                className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === 'bank'
                    ? 'border-emerald-600 text-emerald-900 bg-emerald-50/50 rounded-t-lg'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Retiro Bancario</span>
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
                <span>Comisión 2%</span>
              </button>
            </>
          )}

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
            <span>Impulsar Prendas</span>
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

          {isOwnerCreator && (
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'history'
                  ? 'border-emerald-600 text-emerald-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Layers className="w-4 h-4 text-stone-500" />
              <span>
                Historial Real ({earningsList.length}
                {pendingEarnings.length > 0 ? ` • ${pendingEarnings.length} pend.` : ''})
              </span>
            </button>
          )}
        </div>

        {/* Real Seller Payment Checkout Box (when user clicks a paid Subscription, Boost, or Verification) */}
        {pendingCheckout && (
          <div className="p-4 sm:p-5 bg-amber-50 border-b border-amber-300 shrink-0">
            <form onSubmit={handleSubmitCheckoutPayment} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                    Confirmación de Pago Real Requerida
                  </span>
                  <h4 className="font-bold text-sm text-stone-950">
                    {pendingCheckout.title} —{' '}
                    <span className="text-emerald-800 font-mono">
                      C$ {pendingCheckout.amountNIO.toFixed(2)} (≈ $
                      {(pendingCheckout.amountNIO / (storeSettings.exchangeRate || 36.5)).toFixed(2)} USD)
                    </span>
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingCheckout(null)}
                  className="text-xs font-bold text-stone-600 hover:text-stone-900 px-2 py-1 rounded-lg bg-white border border-stone-300 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Canal de Pago Utilizado:</label>
                  <select
                    value={checkoutDestination}
                    onChange={(e) =>
                      setCheckoutDestination(
                        e.target.value as PlatformEarningRecord['paymentDestination']
                      )
                    }
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-semibold text-stone-900"
                  >
                    <option value="paypal">PayPal / Enlace Digital</option>
                    <option value="digital_link">Enlace de Pago Directo</option>
                    <option value="cuenta_lafise">Transferencia Bancaria</option>
                    <option value="billetera_movil">Billetera Móvil</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Nº Comprobante o Referencia Real *:
                  </label>
                  <input
                    type="text"
                    required
                    value={checkoutReference}
                    onChange={(e) => setCheckoutReference(e.target.value)}
                    placeholder="Ej. PayPal #94821 o Ref Banco #1204"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono text-stone-900"
                  />
                </div>

                <div className="flex items-end gap-2">
                  {storeSettings.platformPaymentLink && (
                    <a
                      href={storeSettings.platformPaymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Pagar en PayPal</span>
                    </a>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmittingCheckout}
                    className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl cursor-pointer"
                  >
                    {isSubmittingCheckout ? 'Enviando...' : 'Enviar Comprobante'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs text-stone-800">
          {/* 1. REAL OVERVIEW (Owner Only) */}
          {activeTab === 'overview' && isOwnerCreator && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                    Ingresos Reales Confirmados
                  </span>
                  <p className="font-mono text-xl sm:text-2xl font-black text-emerald-950">
                    {formatCurrency(totalConfirmedEarningsNIO, currency, storeSettings.exchangeRate)}
                  </p>
                  <span className="text-[10px] text-emerald-700">
                    {confirmedEarnings.length} pago(s) liquidado(s)
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-teal-800 block">
                    Por Confirmar (Pendientes)
                  </span>
                  <p className="font-mono text-xl sm:text-2xl font-black text-teal-950">
                    {formatCurrency(totalPendingEarningsNIO, currency, storeSettings.exchangeRate)}
                  </p>
                  <span className="text-[10px] text-teal-700">
                    {pendingEarnings.length} pago(s) por verificar
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab('paypal')}
                  className="p-4 rounded-2xl bg-sky-50 border border-sky-200 hover:border-sky-400 space-y-1 cursor-pointer transition-all"
                >
                  <span className="text-[10px] font-bold uppercase text-sky-800 block">
                    Saldo Disponible Retiro
                  </span>
                  <p className="font-mono text-xl sm:text-2xl font-black text-sky-950">
                    {formatCurrency(availableWithdrawalBalanceNIO, currency, storeSettings.exchangeRate)}
                  </p>
                  <span className="text-[10px] text-sky-700 font-semibold underline">
                    Retirar a PayPal o Banco →
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab('ads')}
                  className="p-4 rounded-2xl bg-amber-50 border border-amber-200 hover:border-amber-400 space-y-1 cursor-pointer transition-all"
                >
                  <span className="text-[10px] font-bold uppercase text-amber-800 block">
                    Estado Google AdSense
                  </span>
                  <p className="font-mono text-base sm:text-lg font-black text-amber-950 mt-1">
                    {isAdSenseActive ? 'Activo en Vivo' : 'Sin ID ca-pub'}
                  </p>
                  <span className="text-[10px] text-amber-700 underline">
                    {isAdSenseActive ? adSenseForm.publisherId : 'Configurar AdSense →'}
                  </span>
                </div>
              </div>

              {pendingEarnings.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-amber-950 text-xs sm:text-sm">
                      Tienes {pendingEarnings.length} pago(s) pendientes de verificación (C${' '}
                      {totalPendingEarningsNIO.toFixed(2)})
                    </h4>
                    <p className="text-[11px] text-amber-800">
                      Revisa los comprobantes en la pestaña "Historial Real" para confirmarlos y acreditarlos a tu saldo disponible.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black rounded-xl text-xs cursor-pointer shrink-0"
                  >
                    Verificar Pagos →
                  </button>
                </div>
              )}

              {/* Real Streams Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div
                  onClick={() => setActiveTab('ads')}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-amber-400 cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-stone-950 text-sm">
                      1. Google AdSense & Anuncios de Negocios
                    </h4>
                    <ArrowUpRight className="w-4 h-4 text-stone-400" />
                  </div>
                  <p className="font-mono font-bold text-emerald-700">
                    Confirmado: {formatCurrency(totalAdsRevenue, currency, storeSettings.exchangeRate)}
                  </p>
                  <p className="text-[11px] text-stone-600">
                    Conecta tu cuenta real de Google AdSense (<code>ca-pub-...</code>) y recibe pagos por anuncios patrocinados de negocios en Nicaragua.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('memberships')}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-violet-400 cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-stone-950 text-sm">
                      2. Suscripciones Pro & VIP de Tiendas
                    </h4>
                    <ArrowUpRight className="w-4 h-4 text-stone-400" />
                  </div>
                  <p className="font-mono font-bold text-emerald-700">
                    Confirmado:{' '}
                    {formatCurrency(totalMembershipsRevenue, currency, storeSettings.exchangeRate)}
                  </p>
                  <p className="text-[11px] text-stone-600">
                    Las tiendas pagan C$ 150/mes (Pro) o C$ 350/mes (VIP) enviando su comprobante real de PayPal o transferencia.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('commission')}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-emerald-400 cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-stone-950 text-sm">
                      3. Comisión del 2% por Pedidos Reales
                    </h4>
                    <ArrowUpRight className="w-4 h-4 text-stone-400" />
                  </div>
                  <p className="font-mono font-bold text-emerald-700">
                    Confirmado:{' '}
                    {formatCurrency(totalCommissionRevenue, currency, storeSettings.exchangeRate)} •
                    Pendiente:{' '}
                    {formatCurrency(
                      totalPendingCommissionRevenue,
                      currency,
                      storeSettings.exchangeRate
                    )}
                  </p>
                  <p className="text-[11px] text-stone-600">
                    Cada pedido real registrado en el carrito genera automáticamente su registro de comisión del 2% en Firestore.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('boosts')}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-sky-400 cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-stone-950 text-sm">
                      4. Impulso de Prendas & Sello Verificado
                    </h4>
                    <ArrowUpRight className="w-4 h-4 text-stone-400" />
                  </div>
                  <p className="font-mono font-bold text-emerald-700">
                    Confirmado:{' '}
                    {formatCurrency(
                      totalBoostsRevenue + totalOtherRevenue,
                      currency,
                      storeSettings.exchangeRate
                    )}
                  </p>
                  <p className="text-[11px] text-stone-600">
                    Los vendedores destacan prendas en portada (C$ 35–120) o adquieren verificación oficial (C$ 75).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. PAYOUT ACCOUNTS & DIGITAL CHECKOUT LINK CONFIG (Owner Only) */}
          {activeTab === 'config' && isOwnerCreator && (
            <form onSubmit={handleSavePayoutSettings} className="space-y-5">
              <div className="p-5 rounded-3xl bg-gradient-to-r from-violet-950 via-purple-900 to-indigo-950 text-white space-y-2 shadow-lg">
                <h3 className="font-serif text-lg font-black">
                  Configuración Real de Cuentas de Cobro y Retiro
                </h3>
                <p className="text-xs text-purple-200">
                  Configura tu correo PayPal, enlace real de cobro (PayPal.me / Tilopay / BAC CompraClick) y cuenta bancaria nacional para recibir pagos reales de suscripciones, anuncios y retiros.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-4">
                <h4 className="font-bold text-stone-900 text-sm">1. Cuenta PayPal y Enlace de Cobro Digital</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Correo Electrónico de PayPal:
                    </label>
                    <input
                      type="email"
                      required
                      value={cfgPaypalEmail}
                      onChange={(e) => setCfgPaypalEmail(e.target.value)}
                      placeholder="tu-paypal@correo.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl font-mono text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Enlace Público de Cobro (PayPal.me / Pasarela):
                    </label>
                    <input
                      type="url"
                      value={cfgPaymentLink}
                      onChange={(e) => setCfgPaymentLink(e.target.value)}
                      placeholder="https://paypal.me/tuusuario"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl font-mono text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-4">
                <h4 className="font-bold text-stone-900 text-sm">2. Cuenta Bancaria Nacional (Nicaragua)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Banco Nacional:</label>
                    <select
                      value={cfgBankName}
                      onChange={(e) => setCfgBankName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl font-semibold"
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
                      value={cfgBankAccount}
                      onChange={(e) => setCfgBankAccount(e.target.value)}
                      placeholder="Ej. 134082049"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Titular de la Cuenta:</label>
                    <input
                      type="text"
                      value={cfgBankHolder}
                      onChange={(e) => setCfgBankHolder(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Billetera Móvil:</label>
                    <input
                      type="tel"
                      value={cfgWalletPhone}
                      onChange={(e) => setCfgWalletPhone(e.target.value)}
                      placeholder="Ej. +505 58898311"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-6 py-3 bg-gradient-to-r from-violet-700 to-indigo-700 hover:from-violet-800 hover:to-indigo-800 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                >
                  {isSavingConfig ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Guardar Cuentas de Retiro y Enlace</span>
                </button>
              </div>
            </form>
          )}

          {/* 3. REAL GOOGLE ADSENSE & PAID NICARAGUAN BUSINESS ADS (Owner Only) */}
          {activeTab === 'ads' && isOwnerCreator && (
            <div className="space-y-6">
              {/* Real AdSense Configuration Form */}
              <form
                onSubmit={handleSaveAdSenseConfig}
                className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-bold text-stone-900">
                        Conexión Real con Google AdSense
                      </h3>
                      <p className="text-[11px] text-stone-600">
                        Ingresa tu Publisher ID real de Google AdSense (<code>ca-pub-...</code>) y tus Slot IDs para mostrar anuncios reales de Google y monetizar las visitas automáticamente.
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full border shrink-0 ${
                      isAdSenseActive
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-stone-100 text-stone-600 border-stone-300'
                    }`}
                  >
                    {isAdSenseActive ? 'AdSense Activo' : 'Pendiente de ID ca-pub'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">
                      Publisher ID (Google AdSense):
                    </label>
                    <input
                      type="text"
                      value={adSenseForm.publisherId}
                      onChange={(e) =>
                        setAdSenseForm({ ...adSenseForm, publisherId: e.target.value })
                      }
                      placeholder="ca-pub-1234567890123456"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">
                      Slot ID Encabezado:
                    </label>
                    <input
                      type="text"
                      value={adSenseForm.headerSlotId || ''}
                      onChange={(e) =>
                        setAdSenseForm({ ...adSenseForm, headerSlotId: e.target.value })
                      }
                      placeholder="Ej. 1234567890"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">
                      Slot ID Catálogo (In-Feed):
                    </label>
                    <input
                      type="text"
                      value={adSenseForm.inFeedSlotId || ''}
                      onChange={(e) =>
                        setAdSenseForm({ ...adSenseForm, inFeedSlotId: e.target.value })
                      }
                      placeholder="Ej. 2345678901"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-600 mb-1">
                      Slot ID Pie de Página:
                    </label>
                    <input
                      type="text"
                      value={adSenseForm.footerSlotId || ''}
                      onChange={(e) =>
                        setAdSenseForm({ ...adSenseForm, footerSlotId: e.target.value })
                      }
                      placeholder="Ej. 3456789012"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adSenseForm.enabled}
                      onChange={(e) =>
                        setAdSenseForm({ ...adSenseForm, enabled: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-sky-600"
                    />
                    <span>Mostrar bloques de anuncios en la plataforma</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <a
                      href="https://www.google.com/adsense/start/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 font-bold text-xs rounded-xl flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ir a Google AdSense</span>
                    </a>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Guardar Google AdSense
                    </button>
                  </div>
                </div>
              </form>

              {/* Google AdSense Submission & Verification Assistant */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 text-white space-y-4 shadow-md border border-sky-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-serif text-base font-black text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Guía para Registrar y Verificar en Google AdSense</span>
                    </h4>
                    <p className="text-[11px] text-sky-200 mt-0.5">
                      La app ya incluye <code>robots.txt</code> para <code>Mediapartners-Google</code>, divulgación de cookies en Privacidad e inyección automática de etiqueta <code>google-adsense-account</code>.
                    </p>
                  </div>
                </div>

                {/* Readiness Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Política de Privacidad y Cookies AdSense lista</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Rastreador AdSense habilitado en robots.txt</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 flex items-center gap-2">
                    {isAdSenseActive ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
                    )}
                    <span>
                      {isAdSenseActive
                        ? 'Publisher ID ca-pub conectado'
                        : 'Falta ingresar tu ID ca-pub-...'}
                    </span>
                  </div>
                </div>

                {/* Live Public Site URL + ads.txt Generator */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 block">
                      1. URL pública para registrar en Google AdSense:
                    </span>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-black/40 px-2.5 py-1.5 rounded-lg font-mono text-[11px] text-amber-300 truncate">
                        {OFFICIAL_APP_URLS.githubPagesUrl}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(OFFICIAL_APP_URLS.githubPagesUrl);
                          showBanner('success', 'URL pública copiada para pegarla en Google AdSense.');
                        }}
                        className="px-2.5 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 block">
                      2. Archivo ads.txt autorizado (cuando tengas tu ca-pub):
                    </span>
                    {(() => {
                      const pubNumeric = (adSenseForm.publisherId || '')
                        .trim()
                        .replace(/^ca-pub-/, 'pub-');
                      const isPubReady = /^pub-\d{10,20}$/.test(pubNumeric);
                      const adsTxtLine = isPubReady
                        ? `google.com, ${pubNumeric}, DIRECT, f08c47fec0942fa0`
                        : 'google.com, pub-TU_ID_AQUI, DIRECT, f08c47fec0942fa0';

                      return (
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-black/40 px-2.5 py-1.5 rounded-lg font-mono text-[10px] text-emerald-300 truncate">
                            {adsTxtLine}
                          </code>
                          <button
                            type="button"
                            disabled={!isPubReady}
                            onClick={() => {
                              const blob = new Blob([`${adsTxtLine}\n`], {
                                type: 'text/plain;charset=utf-8'
                              });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'ads.txt';
                              a.click();
                              URL.revokeObjectURL(url);
                              showBanner('success', 'Archivo ads.txt descargado correctamente.');
                            }}
                            className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-stone-950 rounded-lg font-black text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5" />
                            <span>ads.txt</span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <p className="text-[11px] text-sky-100/90 leading-relaxed">
                  <strong>Importante:</strong> Por políticas de seguridad de Google, debes iniciar sesión con tu cuenta de Google en{' '}
                  <a
                    href="https://www.google.com/adsense/start/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-bold text-amber-300"
                  >
                    adsense.google.com
                  </a>{' '}
                  para dar de alta el sitio y obtener tu código <code>ca-pub-...</code>. Una vez que Google te lo entregue, pégalo arriba y pulsa <strong>Guardar Google AdSense</strong>. (Nota: para que el bot de Google apruebe el sitio más rápido durante la revisión, asegúrate de que la portada/contenido pueda revisarse o verifica mediante etiqueta meta/HTML).
                </p>
              </div>

              {/* Real AdSense Settlement Entry (strictly real confirmed payouts) */}
              <form
                onSubmit={handleRecordRealAdSenseSettlement}
                className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h4 className="font-bold text-sm text-stone-900">
                      Registrar Pago Real Liquidado por Google AdSense
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Cuando Google AdSense te emita un pago real a tu cuenta, regístralo aquí con su número de comprobante oficial para sumarlo a tu balance.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={realAdSenseAmount}
                    onChange={(e) => setRealAdSenseAmount(e.target.value)}
                    placeholder="Monto real en C$ (ej. 3650)"
                    className="px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono text-xs"
                  />
                  <input
                    type="text"
                    value={realAdSenseRef}
                    onChange={(e) => setRealAdSenseRef(e.target.value)}
                    placeholder="Nº de pago / recibo oficial Google AdSense"
                    className="px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono text-xs"
                  />
                  <button
                    type="submit"
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Registrar Liquidación Real
                  </button>
                </div>
              </form>

              {/* Real Paid Business Ads Queue */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h4 className="font-bold text-sm text-stone-900">
                      Anuncios Pagados de Negocios en la Plataforma ({paidBusinessAds.length})
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Negocios que contrataron planes pagados (C$ 250 / C$ 650 / C$ 1,200).
                    </p>
                  </div>
                  {onOpenAdvertiseModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAdvertiseModal();
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black rounded-xl text-xs cursor-pointer"
                    >
                      + Nuevo Anuncio
                    </button>
                  )}
                </div>

                {paidBusinessAds.length === 0 ? (
                  <p className="text-xs text-stone-500 p-4 text-center bg-stone-50 rounded-xl border border-dashed border-stone-300">
                    No hay anuncios pagados registrados todavía.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {paidBusinessAds.map((ad) => (
                      <div
                        key={ad.id}
                        className="p-3 rounded-xl border border-stone-200 bg-stone-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <p className="font-bold text-stone-900">
                            {ad.businessName} — <span className="text-amber-700">{ad.planName}</span>
                          </p>
                          <p className="text-[11px] text-stone-500 font-mono">
                            Monto: C$ {ad.pricePaid} • Ref: {ad.paymentReference || 'Sin ref'} • Estado:{' '}
                            {ad.paymentStatus}
                          </p>
                        </div>
                        {ad.paymentStatus !== 'pagado' ? (
                          <button
                            type="button"
                            onClick={() => handleApproveBusinessAdPayment(ad)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer shrink-0"
                          >
                            Confirmar Pago Recibido
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                            Pago Confirmado
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. COMMISSION 2% REAL CALCULATOR & LIVE STATS (Owner Only) */}
          {activeTab === 'commission' && isOwnerCreator && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <h3 className="font-serif text-base font-bold text-emerald-950 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span>Modelo Real de Comisión del 2%</span>
                </h3>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  De cada venta real procesada en la app, <strong>el 98% pertenece a la tienda vendedora</strong> y{' '}
                  <strong>el 2% se registra en tiempo real como comisión de plataforma</strong> (pendiente hasta que confirmes el pago del pedido).
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white rounded-xl border border-emerald-200">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                      Comisiones 2% Confirmadas
                    </span>
                    <span className="font-mono text-lg font-black text-emerald-900">
                      {formatCurrency(totalCommissionRevenue, currency, storeSettings.exchangeRate)}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">
                      Comisiones 2% Por Confirmar
                    </span>
                    <span className="font-mono text-lg font-black text-amber-900">
                      {formatCurrency(
                        totalPendingCommissionRevenue,
                        currency,
                        storeSettings.exchangeRate
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-stone-900 text-white space-y-4 shadow-lg">
                <h4 className="font-bold text-sm text-amber-300 uppercase tracking-wider">
                  Calculadora de Desglose (98% Tienda / 2% Plataforma)
                </h4>

                <div>
                  <label className="block text-xs text-stone-300 mb-1">
                    Monto de venta en Córdobas (C$):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={calcSaleAmount}
                    onChange={(e) => setCalcSaleAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-white font-mono font-bold text-base"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 bg-stone-800/80 rounded-xl border border-stone-700">
                    <span className="text-[11px] text-stone-400 block">Para la Tienda (98%):</span>
                    <p className="font-mono text-xl font-bold text-white mt-1">
                      {formatCurrency(calcSplit.sellerAmount, currency, storeSettings.exchangeRate)}
                    </p>
                  </div>
                  <div className="p-3.5 bg-emerald-950/80 rounded-xl border border-emerald-600/60">
                    <span className="text-[11px] text-emerald-300 block">Comisión App (2%):</span>
                    <p className="font-mono text-xl font-bold text-emerald-300 mt-1">
                      {formatCurrency(calcSplit.platformFee, currency, storeSettings.exchangeRate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. REAL BANK WITHDRAWALS (Owner Only) */}
          {activeTab === 'bank' && isOwnerCreator && (
            <div className="space-y-6">
              <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-900 to-stone-900 text-white space-y-3 shadow-xl">
                <h3 className="font-serif text-lg font-bold">
                  Retiros Reales a Cuenta Bancaria Nacional
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <span className="text-[10px] text-emerald-300 font-bold uppercase block">
                      Saldo Real Confirmado Disponible
                    </span>
                    <p className="font-mono text-2xl font-black text-white mt-1">
                      C$ {availableWithdrawalBalanceNIO.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl">
                    <span className="text-[10px] text-emerald-300 font-bold uppercase block">
                      Cuenta Registrada
                    </span>
                    <p className="font-mono text-xs font-bold text-amber-300 mt-1 truncate">
                      {bankNameInput} • {bankAccountInput || 'Sin configurar'}
                    </p>
                    <span className="text-[10px] text-stone-300">Titular: {bankHolderInput}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
                  <span>Registrar Solicitud de Retiro Bancario</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={bankNameInput}
                    onChange={(e) => setBankNameInput(e.target.value)}
                    placeholder="Banco"
                    className="px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold"
                  />
                  <input
                    type="text"
                    value={bankAccountInput}
                    onChange={(e) => setBankAccountInput(e.target.value)}
                    placeholder="Número de Cuenta Bancaria"
                    className="px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-mono"
                  />
                  <input
                    type="text"
                    value={bankHolderInput}
                    onChange={(e) => setBankHolderInput(e.target.value)}
                    placeholder="Nombre del Titular"
                    className="px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      min="1"
                      max={availableWithdrawalBalanceNIO}
                      value={bankWithdrawAmountInput || ''}
                      onChange={(e) => setBankWithdrawAmountInput(Number(e.target.value))}
                      placeholder="Monto en Córdobas (C$)"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold font-mono"
                    />
                    <div className="flex justify-between mt-1 text-[10px]">
                      <span className="text-stone-500">
                        Disponible: C$ {availableWithdrawalBalanceNIO.toFixed(2)}
                      </span>
                      {availableWithdrawalBalanceNIO > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setBankWithdrawAmountInput(
                              Number(availableWithdrawalBalanceNIO.toFixed(2))
                            )
                          }
                          className="text-emerald-700 font-bold hover:underline cursor-pointer"
                        >
                          Usar todo el saldo
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestBankWithdrawal}
                    disabled={isProcessingBankWithdrawal || availableWithdrawalBalanceNIO <= 0}
                    className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Registrar Solicitud de Retiro Bancario</span>
                  </button>
                </div>
              </div>

              <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white">
                {bankWithdrawals.length === 0 ? (
                  <p className="p-6 text-center text-xs text-stone-500">
                    No hay retiros bancarios registrados todavía.
                  </p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 text-stone-700 font-bold uppercase text-[10px] border-b border-stone-200">
                      <tr>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Referencia</th>
                        <th className="py-2.5 px-3">Banco / Cuenta</th>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {bankWithdrawals.map((w) => (
                        <tr key={w.id}>
                          <td className="py-2.5 px-3 text-stone-500">{w.date}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px]">{w.transactionId}</td>
                          <td className="py-2.5 px-3 text-[11px]">
                            {w.bankName} ({w.accountNumber})
                          </td>
                          <td className="py-2.5 px-3">
                            {w.status === 'completado' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Completado</span>
                              </span>
                            ) : confirmingWithdrawalId === w.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={confirmTxInput}
                                  onChange={(e) => setConfirmTxInput(e.target.value)}
                                  placeholder="Ref ACH real"
                                  className="px-2 py-1 border border-stone-300 rounded text-[11px] font-mono w-28"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleCompleteWithdrawalWithTx('bank', w.id)}
                                  className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer"
                                >
                                  OK
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmingWithdrawalId(w.id);
                                  setConfirmTxInput('');
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full cursor-pointer hover:bg-amber-200"
                              >
                                <Clock className="w-3 h-3" />
                                <span>Solicitado • Confirmar Ref</span>
                              </button>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 text-right">
                            C$ {w.amountNIO} (${w.amountUSD} USD)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* 6. REAL PAYPAL WITHDRAWALS (Owner Only) */}
          {activeTab === 'paypal' && isOwnerCreator && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-900 via-indigo-950 to-stone-900 text-white space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-lg font-bold">Retiros Reales a PayPal</h3>
                    <p className="text-xs text-sky-200">
                      Solo retiras saldo de ingresos reales confirmados.
                    </p>
                  </div>
                  <a
                    href="https://www.paypal.com/myaccount/money/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-sky-200 rounded-xl text-xs font-bold border border-sky-400/30"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir PayPal.com</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-sky-300 uppercase font-bold block">
                      Saldo Disponible Real
                    </span>
                    <p className="font-mono text-2xl font-black text-emerald-400 mt-1">
                      {formatCurrency(availableWithdrawalBalanceNIO, currency, storeSettings.exchangeRate)}
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-sky-300 uppercase font-bold block">
                      Retiros PayPal Registrados
                    </span>
                    <p className="font-mono text-xl font-bold text-white mt-1">
                      {formatCurrency(totalPaypalReservedNIO, currency, storeSettings.exchangeRate)}
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-sky-300 uppercase font-bold block">
                      Correo PayPal Destino
                    </span>
                    <p className="font-mono text-xs font-bold text-amber-300 mt-1 truncate">
                      {paypalEmailInput || 'Sin configurar'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <ArrowDownToLine className="w-4 h-4 text-sky-600" />
                  <span>Solicitar Retiro a PayPal</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Correo Electrónico de PayPal:
                    </label>
                    <input
                      type="email"
                      value={paypalEmailInput}
                      onChange={(e) => setPaypalEmailInput(e.target.value)}
                      placeholder="cuenta@paypal.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Monto a Retirar (C$):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={availableWithdrawalBalanceNIO}
                      value={withdrawAmountInput || ''}
                      onChange={(e) => setWithdrawAmountInput(Number(e.target.value))}
                      placeholder="Monto en Córdobas"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-mono font-bold"
                    />
                    <div className="flex justify-between mt-1 text-[10px]">
                      <span className="text-stone-500">
                        Disponible: C$ {availableWithdrawalBalanceNIO.toFixed(2)}
                      </span>
                      {availableWithdrawalBalanceNIO > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setWithdrawAmountInput(Number(availableWithdrawalBalanceNIO.toFixed(2)))
                          }
                          className="text-sky-700 font-bold hover:underline cursor-pointer"
                        >
                          Usar todo el saldo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleRequestPaypalWithdrawal}
                    disabled={isProcessingWithdrawal || availableWithdrawalBalanceNIO <= 0}
                    className="py-2.5 px-5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Registrar Retiro a PayPal</span>
                  </button>
                </div>
              </div>

              <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white">
                {paypalWithdrawals.length === 0 ? (
                  <p className="p-6 text-center text-xs text-stone-500">
                    No hay retiros a PayPal registrados todavía.
                  </p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 text-stone-700 font-bold uppercase text-[10px] border-b border-stone-200">
                      <tr>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Referencia</th>
                        <th className="py-2.5 px-3">Correo PayPal</th>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {paypalWithdrawals.map((w) => (
                        <tr key={w.id}>
                          <td className="py-2.5 px-3 text-stone-500">{w.date}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px]">{w.transactionId}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px]">{w.paypalEmail}</td>
                          <td className="py-2.5 px-3">
                            {w.status === 'completado' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Completado</span>
                              </span>
                            ) : confirmingWithdrawalId === w.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={confirmTxInput}
                                  onChange={(e) => setConfirmTxInput(e.target.value)}
                                  placeholder="ID PayPal real"
                                  className="px-2 py-1 border border-stone-300 rounded text-[11px] font-mono w-28"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleCompleteWithdrawalWithTx('paypal', w.id)}
                                  className="px-2 py-1 bg-sky-600 text-white rounded text-[10px] font-bold cursor-pointer"
                                >
                                  OK
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmingWithdrawalId(w.id);
                                  setConfirmTxInput('');
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full cursor-pointer hover:bg-amber-200"
                              >
                                <Clock className="w-3 h-3" />
                                <span>Solicitado • Confirmar ID</span>
                              </button>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 text-right">
                            C$ {w.amountNIO} (${w.amountUSD} USD)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* 7. REAL SELLER MEMBERSHIPS (Sellers & Owner) */}
          {activeTab === 'memberships' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Planes de Suscripción Mensual para Tiendas
                </h3>
                <p className="text-xs text-stone-500">
                  Elige el plan ideal para tu tienda. Los planes de pago requieren envío de comprobante real para activarse.
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
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-stone-900 text-white inline-block">
                        {tier.badge}
                      </span>
                      <div>
                        <h4 className="font-bold text-base text-stone-900">{tier.title}</h4>
                        <p className="font-mono text-2xl font-black text-stone-950 mt-1">
                          {tier.priceNIO === 0 ? 'Gratis' : `C$ ${tier.priceNIO}`}
                          {tier.priceNIO > 0 && (
                            <span className="text-xs font-normal text-stone-500"> / mes</span>
                          )}
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
                      onClick={() => handleStartMembership(tier.id, tier.title, tier.priceNIO)}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs cursor-pointer ${
                        tier.recommended
                          ? 'bg-amber-500 hover:bg-amber-600 text-stone-950'
                          : tier.priceNIO === 0
                          ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          : 'bg-stone-900 hover:bg-stone-800 text-white'
                      }`}
                    >
                      {tier.priceNIO === 0
                        ? 'Plan Gratuito Activo'
                        : `Adquirir ${tier.title} (C$ ${tier.priceNIO})`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. REAL PRODUCT BOOSTS (Sellers & Owner) */}
          {activeTab === 'boosts' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Impulso Real de Prendas en Portada
                </h3>
                <p className="text-xs text-stone-500">
                  Selecciona un producto publicado y el paquete de visibilidad. Confirmado el pago real, tu prenda queda destacada en portada.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      1. Selecciona tu producto:
                    </label>
                    <select
                      value={selectedProductToBoost}
                      onChange={(e) => setSelectedProductToBoost(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold"
                    >
                      {products.length === 0 ? (
                        <option value="">No hay productos publicados todavía</option>
                      ) : (
                        products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} - C$ {p.price} ({p.sellerName || 'Tienda'})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      2. Duración del impulso:
                    </label>
                    <select
                      value={selectedBoostTier}
                      onChange={(e) => setSelectedBoostTier(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold"
                    >
                      {PRODUCT_BOOST_TIERS.map((tier) => (
                        <option key={tier.id} value={tier.id}>
                          {tier.title} - C$ {tier.priceNIO}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleStartBoost}
                    disabled={products.length === 0}
                    className="py-2.5 px-5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-stone-950 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Continuar al Pago del Impulso</span>
                  </button>
                </div>
              </div>

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

          {/* 9. REAL STORE VERIFICATION (Sellers & Owner) */}
          {activeTab === 'verification' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-950 to-indigo-950 text-white space-y-3">
                <div className="flex items-center gap-2.5">
                  <Award className="w-6 h-6 text-sky-300" />
                  <h3 className="font-serif text-lg font-bold">Sello de Tienda Oficial Verificada</h3>
                </div>
                <p className="text-xs text-sky-100 leading-relaxed max-w-xl">
                  Verifica oficialmente tu tienda por pago único de <strong>C$ 75</strong> para obtener la insignia de vendedor verificado en la plataforma.
                </p>

                <button
                  type="button"
                  onClick={handleStartVerification}
                  className="py-2.5 px-5 bg-sky-400 hover:bg-sky-300 text-sky-950 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Solicitar Verificación Real (C$ 75)</span>
                </button>
              </div>
            </div>
          )}

          {/* 10. REAL EARNINGS HISTORY & OWNER VERIFICATION CONTROLS */}
          {activeTab === 'history' && isOwnerCreator && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-stone-900">
                    Libro Contable Real de Ingresos
                  </h3>
                  <p className="text-xs text-stone-500">
                    Solo los pagos confirmados (liquidados) se acreditan a tu saldo disponible para retirar.
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-stone-500 block">Confirmado Real:</span>
                  <span className="font-mono text-base font-black text-emerald-800">
                    {formatCurrency(totalConfirmedEarningsNIO, currency, storeSettings.exchangeRate)}
                  </span>
                </div>
              </div>

              <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white">
                {earningsList.length === 0 ? (
                  <p className="p-8 text-center text-xs text-stone-500">
                    No hay ingresos reales registrados todavía. Los ingresos aparecerán automáticamente cuando haya pedidos, anuncios pagados, suscripciones Pro/VIP o liquidaciones de Google AdSense.
                  </p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 text-stone-700 font-bold uppercase text-[10px] border-b border-stone-200">
                      <tr>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Concepto</th>
                        <th className="py-2.5 px-3">Tienda / Usuario</th>
                        <th className="py-2.5 px-3">Comprobante</th>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {earningsList.map((item) => (
                        <tr key={item.id} className="hover:bg-stone-50">
                          <td className="py-2.5 px-3 text-stone-500 whitespace-nowrap">{item.date}</td>
                          <td className="py-2.5 px-3 font-semibold text-stone-900">{item.title}</td>
                          <td className="py-2.5 px-3 text-stone-600">{item.storeOrUserName}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-stone-500">
                            {item.reference || '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            {item.status === 'liquidado' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Confirmado</span>
                              </span>
                            ) : item.status === 'rechazado' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                                <XCircle className="w-3 h-3" />
                                <span>Rechazado</span>
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleConfirmEarning(item)}
                                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Confirmar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectEarning(item)}
                                  className="px-2 py-0.5 bg-stone-200 hover:bg-rose-200 text-stone-800 rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Rechazar
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 text-right whitespace-nowrap">
                            {formatCurrency(item.amountNIO, currency, storeSettings.exchangeRate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
