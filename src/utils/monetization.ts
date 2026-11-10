import { CurrencyType } from '../types';

/**
 * 💰 CENTRO DE MONETIZACIÓN Y GANANCIAS DEL DUEÑO DE LA APP
 * Datos oficiales de recaudación para comisiones (2%), publicidad y retiros PayPal.
 */
export const PLATFORM_OWNER_CONFIG = {
  walletPhone: '+505 58898311', // Billetera Móvil del Dueño
  lafiseAccount: '134082049',    // Cuenta Bancaria LAFISE del Dueño
  bankName: 'Banco LAFISE Bancentro',
  beneficiaryName: 'Dueño de la App / Administración Central',
  paypalEmail: 'normanescobar804@gmail.com', // Cuenta PayPal oficial para retiros
  commissionRate: 0.02, // 2% sobre cada venta
  sellerShareRate: 0.98  // 98% ganancia directa para la tienda de ropa
};

/**
 * Calcula la partición de ganancias de una venta (98% tienda / 2% plataforma)
 */
export function calculateEarningsSplit(totalAmount: number): {
  total: number;
  sellerAmount: number;
  platformFee: number;
} {
  const numeric = Math.max(0, totalAmount);
  // 2% exacto de comisión para la plataforma
  const platformFee = Math.max(1, Math.round(numeric * PLATFORM_OWNER_CONFIG.commissionRate));
  const sellerAmount = Math.max(0, numeric - platformFee);
  return {
    total: numeric,
    sellerAmount,
    platformFee
  };
}

/**
 * Modelos de ingresos complementarios para la plataforma
 */
export interface MonetizationPlan {
  id: string;
  type: 'membership' | 'boost' | 'verification' | 'shipping_fee' | 'advertising';
  title: string;
  badge: string;
  priceNIO: number;
  priceUSD: number;
  durationLabel: string;
  description: string;
  benefits: string[];
  recommended?: boolean;
}

export const STORE_MEMBERSHIP_TIERS: MonetizationPlan[] = [
  {
    id: 'plan_gratis',
    type: 'membership',
    title: 'Plan Tienda Básica',
    badge: 'Gratis Siempre',
    priceNIO: 0,
    priceUSD: 0,
    durationLabel: 'Gratis',
    description: 'Para personas o emprendedores que quieren probar vendiendo hasta 10 prendas.',
    benefits: [
      'Hasta 10 productos activos',
      'Comisión estándar del 2% por venta',
      'Pedidos directos a tu WhatsApp',
      'Pagos a tu cuenta bancaria o billetera'
    ]
  },
  {
    id: 'plan_tienda_pro',
    type: 'membership',
    title: 'Plan Tienda Pro',
    badge: 'Más Popular ⭐',
    priceNIO: 150,
    priceUSD: 4.10,
    durationLabel: 'C$ 150 / mes',
    recommended: true,
    description: 'Para boutiques y clósets activos que quieren publicar sin límites y destacar.',
    benefits: [
      'Prendas ilimitadas en catálogo',
      'Comisión reducida al 1.5% por venta',
      'Insignia dorada "Tienda Pro Verificada"',
      'Aparición prioritaria en búsquedas y filtros',
      'Estadísticas de visualizaciones de tu tienda'
    ]
  },
  {
    id: 'plan_boutique_vip',
    type: 'membership',
    title: 'Plan Boutique VIP / Elite',
    badge: 'Máximo Impacto 👑',
    priceNIO: 350,
    priceUSD: 9.50,
    durationLabel: 'C$ 350 / mes',
    description: 'Para marcas y tiendas consolidadas que buscan máxima exposición en toda Nicaragua.',
    benefits: [
      '0% de comisión en todas tus ventas (100% tuyo)',
      'Prendas ilimitadas y catálogo destacado',
      'Banner promocional en la portada principal',
      'Notificaciones push a compradores interesados',
      'Soporte técnico prioritario 24/7'
    ]
  }
];

export const PRODUCT_BOOST_TIERS: MonetizationPlan[] = [
  {
    id: 'boost_3_dias',
    type: 'boost',
    title: 'Impulso Flash (3 Días)',
    badge: 'Rápido',
    priceNIO: 35,
    priceUSD: 1.0,
    durationLabel: '3 Días',
    description: 'Pon tu prenda en la cima de la portada para ventas rápidas de fin de semana.',
    benefits: [
      'Posición #1 en prendas recomendadas',
      'Etiqueta visual "🔥 Prenda Destacada"',
      'Hasta 4x más clics a tu WhatsApp'
    ]
  },
  {
    id: 'boost_7_dias',
    type: 'boost',
    title: 'Impulso Semanal (7 Días)',
    badge: 'Recomendado ⭐',
    priceNIO: 70,
    priceUSD: 1.90,
    durationLabel: '7 Días',
    recommended: true,
    description: 'Una semana completa con visibilidad prioritaria en búsquedas y categorías.',
    benefits: [
      'Prenda fijada en carrusel de inicio por 7 días',
      'Etiqueta dorada de oferta destacada',
      'Aparición en resultados de búsqueda por voz'
    ]
  },
  {
    id: 'boost_15_dias',
    type: 'boost',
    title: 'Impulso Quincenal (15 Días)',
    badge: 'Mejor Valor',
    priceNIO: 120,
    priceUSD: 3.30,
    durationLabel: '15 Días',
    description: 'Ideal para liquidaciones de temporada o prendas de alta gama.',
    benefits: [
      'Máxima exposición durante toda la quincena',
      'Mención en historias y recomendaciones',
      'Prioridad en búsquedas de tallas y marcas'
    ]
  }
];

export const STORE_VERIFICATION_PLAN: MonetizationPlan = {
  id: 'sello_verificado',
  type: 'verification',
  title: 'Sello de Tienda Oficial Verificada',
  badge: 'Confianza 100%',
  priceNIO: 75,
  priceUSD: 2.05,
  durationLabel: 'Pago Único',
  description: 'Verificación oficial de identidad que aumenta la tasa de cierre y confianza en compras en línea.',
  benefits: [
    'Badge azul/dorado de Verificado en tu perfil',
    'Insignia de "Vendedor Confiable" en cada producto',
    'Mayor preferencia frente a vendedores sin verificar',
    'Válido de por vida para tu tienda'
  ]
};

export interface PlatformEarningRecord {
  id: string;
  authorId?: string;
  source:
    | 'comision_2_porciento'
    | 'comision_3_porciento'
    | 'plan_tienda_pro'
    | 'plan_boutique_vip'
    | 'destacado_producto'
    | 'verificacion_tienda'
    | 'publicidad_anuncio'
    | 'ingresos_adsense';
  title: string;
  amountNIO: number;
  storeOrUserName: string;
  date: string;
  status: 'liquidado' | 'pendiente_confirmacion' | 'rechazado';
  reference?: string;
  paymentDestination: 'billetera_movil' | 'cuenta_lafise' | 'paypal' | 'digital_link';
  targetId?: string;
}

export interface PaypalWithdrawalRecord {
  id: string;
  paypalEmail: string;
  amountNIO: number;
  amountUSD: number;
  date: string;
  status: 'completado' | 'solicitado';
  transactionId: string;
  sourceBreakdown?: string;
  note?: string;
}

export interface BankWithdrawalRecord {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  amountNIO: number;
  amountUSD: number;
  date: string;
  status: 'completado' | 'solicitado';
  transactionId: string;
  sourceBreakdown?: string;
  note?: string;
}

const STORAGE_KEY_EARNINGS = 'tienda_jiet_platform_earnings_v3';
const STORAGE_KEY_PAYPAL_WITHDRAWALS = 'tienda_jiet_paypal_withdrawals_v1';
const STORAGE_KEY_BANK_WITHDRAWALS = 'tienda_jiet_bank_withdrawals_v1';

// Legacy AI/demo IDs and store names to automatically purge from localStorage/Firestore caches
export const LEGACY_SIMULATED_EARNING_IDS = new Set([
  'earn-1',
  'earn-2',
  'earn-3',
  'earn-4',
  'earn-5',
  'earn-6'
]);

export const LEGACY_SIMULATED_PAYPAL_IDS = new Set(['pp-with-1']);
export const LEGACY_SIMULATED_BANK_IDS = new Set(['bank-wd-1']);

export const LEGACY_SIMULATED_MONETIZATION_NAMES = new Set([
  'boutique san judas managua',
  'calzado artesanal masaya',
  'moda urbana estelí',
  'moda urbana esteli',
  'red de anuncios google',
  'clóset infantil masaya',
  'closet infantil masaya',
  'chic & vintage león',
  'chic & vintage leon',
  'negocio patrocinado local'
]);

export function isLegacySimulatedEarning(record: PlatformEarningRecord): boolean {
  if (!record || !record.id) return true;
  if (LEGACY_SIMULATED_EARNING_IDS.has(record.id)) return true;
  const storeLower = (record.storeOrUserName || '').trim().toLowerCase();
  if (storeLower && LEGACY_SIMULATED_MONETIZATION_NAMES.has(storeLower)) return true;
  const titleLower = (record.title || '').trim().toLowerCase();
  if (titleLower === 'pago de banners adsense (3,500 visitas)') return true;
  if (titleLower === 'banner patrocinado joyería & accesorios') return true;
  return false;
}

export const INITIAL_BANK_WITHDRAWALS: BankWithdrawalRecord[] = [];

export function getSavedBankWithdrawals(): BankWithdrawalRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BANK_WITHDRAWALS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cleaned = parsed.filter(
      (w: BankWithdrawalRecord) => w && !LEGACY_SIMULATED_BANK_IDS.has(w.id)
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY_BANK_WITHDRAWALS, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function saveBankWithdrawal(record: BankWithdrawalRecord): void {
  try {
    if (LEGACY_SIMULATED_BANK_IDS.has(record.id)) return;
    const list = getSavedBankWithdrawals().filter((w) => w.id !== record.id);
    const updated = [record, ...list];
    localStorage.setItem(STORAGE_KEY_BANK_WITHDRAWALS, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving bank withdrawal:', err);
  }
}

export function updateBankWithdrawalStatus(
  id: string,
  status: 'solicitado' | 'completado',
  transactionId?: string
): BankWithdrawalRecord[] {
  const current = getSavedBankWithdrawals();
  const updated = current.map((w) =>
    w.id === id
      ? {
          ...w,
          status,
          transactionId: transactionId?.trim() ? transactionId.trim() : w.transactionId
        }
      : w
  );
  localStorage.setItem(STORAGE_KEY_BANK_WITHDRAWALS, JSON.stringify(updated));
  return updated;
}

export const INITIAL_PLATFORM_EARNINGS: PlatformEarningRecord[] = [];

export const INITIAL_PAYPAL_WITHDRAWALS: PaypalWithdrawalRecord[] = [];

export function getSavedPlatformEarnings(): PlatformEarningRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EARNINGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cleaned = parsed.filter(
      (e: PlatformEarningRecord) => !isLegacySimulatedEarning(e)
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY_EARNINGS, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function savePlatformEarning(record: PlatformEarningRecord): void {
  try {
    if (isLegacySimulatedEarning(record)) return;
    const list = getSavedPlatformEarnings().filter((e) => e.id !== record.id);
    const updated = [record, ...list];
    localStorage.setItem(STORAGE_KEY_EARNINGS, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving platform earning:', err);
  }
}

export function updatePlatformEarningStatus(
  idOrTargetId: string,
  status: 'liquidado' | 'pendiente_confirmacion' | 'rechazado',
  reference?: string
): PlatformEarningRecord[] {
  const list = getSavedPlatformEarnings();
  const updated = list.map((e) =>
    e.id === idOrTargetId || e.targetId === idOrTargetId || e.reference === idOrTargetId
      ? {
          ...e,
          status,
          reference: reference?.trim() ? reference.trim() : e.reference
        }
      : e
  );
  localStorage.setItem(STORAGE_KEY_EARNINGS, JSON.stringify(updated));
  return updated;
}

export function saveAllPlatformEarnings(records: PlatformEarningRecord[]): PlatformEarningRecord[] {
  const cleaned = records.filter((e) => !isLegacySimulatedEarning(e));
  localStorage.setItem(STORAGE_KEY_EARNINGS, JSON.stringify(cleaned));
  return cleaned;
}

export function getSavedPaypalWithdrawals(): PaypalWithdrawalRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PAYPAL_WITHDRAWALS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cleaned = parsed.filter(
      (w: PaypalWithdrawalRecord) => w && !LEGACY_SIMULATED_PAYPAL_IDS.has(w.id)
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY_PAYPAL_WITHDRAWALS, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function savePaypalWithdrawal(record: PaypalWithdrawalRecord): void {
  try {
    if (LEGACY_SIMULATED_PAYPAL_IDS.has(record.id)) return;
    const list = getSavedPaypalWithdrawals().filter((w) => w.id !== record.id);
    const updated = [record, ...list];
    localStorage.setItem(STORAGE_KEY_PAYPAL_WITHDRAWALS, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving paypal withdrawal:', err);
  }
}

export function updatePaypalWithdrawalStatus(
  id: string,
  status: 'solicitado' | 'completado',
  transactionId?: string
): PaypalWithdrawalRecord[] {
  const current = getSavedPaypalWithdrawals();
  const updated = current.map((w) =>
    w.id === id
      ? {
          ...w,
          status,
          transactionId: transactionId?.trim() ? transactionId.trim() : w.transactionId
        }
      : w
  );
  localStorage.setItem(STORAGE_KEY_PAYPAL_WITHDRAWALS, JSON.stringify(updated));
  return updated;
}

export function saveAllPaypalWithdrawals(records: PaypalWithdrawalRecord[]): PaypalWithdrawalRecord[] {
  const cleaned = records.filter((w) => w && !LEGACY_SIMULATED_PAYPAL_IDS.has(w.id));
  localStorage.setItem(STORAGE_KEY_PAYPAL_WITHDRAWALS, JSON.stringify(cleaned));
  return cleaned;
}

export function saveAllBankWithdrawals(records: BankWithdrawalRecord[]): BankWithdrawalRecord[] {
  const cleaned = records.filter((w) => w && !LEGACY_SIMULATED_BANK_IDS.has(w.id));
  localStorage.setItem(STORAGE_KEY_BANK_WITHDRAWALS, JSON.stringify(cleaned));
  return cleaned;
}

