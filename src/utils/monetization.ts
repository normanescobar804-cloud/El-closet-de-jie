import { CurrencyType } from '../types';

/**
 * 💰 CENTRO DE MONETIZACIÓN Y GANANCIAS DEL DUEÑO DE LA APP
 * Datos oficiales de recaudación para comisiones y servicios de la plataforma.
 */
export const PLATFORM_OWNER_CONFIG = {
  walletPhone: '+505 58898311', // Billetera Móvil del Dueño
  lafiseAccount: '134082049',    // Cuenta Bancaria LAFISE del Dueño
  bankName: 'Banco LAFISE Bancentro',
  beneficiaryName: 'Dueño de la App / Administración Central',
  commissionRate: 0.03, // 3% sobre cada venta
  sellerShareRate: 0.97 // 97% ganancia directa para la tienda de ropa
};

/**
 * Calcula la partición de ganancias de una venta (97% tienda / 3% plataforma)
 */
export function calculateEarningsSplit(totalAmount: number): {
  total: number;
  sellerAmount: number;
  platformFee: number;
} {
  const numeric = Math.max(0, totalAmount);
  const platformFee = Math.round(numeric * PLATFORM_OWNER_CONFIG.commissionRate);
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
  type: 'membership' | 'boost' | 'verification' | 'shipping_fee';
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
      'Comisión estándar del 3% por venta',
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
      'Comisión reducida al 2.5% por venta',
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
  source: 'comision_3_porciento' | 'plan_tienda_pro' | 'plan_boutique_vip' | 'destacado_producto' | 'verificacion_tienda' | 'publicidad_anuncio';
  title: string;
  amountNIO: number;
  storeOrUserName: string;
  date: string;
  status: 'liquidado' | 'pendiente_confirmacion';
  reference?: string;
  paymentDestination: 'billetera_movil' | 'cuenta_lafise';
}

const STORAGE_KEY_EARNINGS = 'tienda_jiet_platform_earnings_v2';

export const INITIAL_PLATFORM_EARNINGS: PlatformEarningRecord[] = [
  {
    id: 'earn-1',
    source: 'comision_3_porciento',
    title: 'Comisión 3% Pedido #JIET-94821',
    amountNIO: 45,
    storeOrUserName: 'Boutique San Judas Managua',
    date: 'Hoy, hace 2 horas',
    status: 'liquidado',
    reference: 'BILLETERA-58898311-9482',
    paymentDestination: 'billetera_movil'
  },
  {
    id: 'earn-2',
    source: 'plan_tienda_pro',
    title: 'Suscripción Mensual Tienda Pro',
    amountNIO: 150,
    storeOrUserName: 'Moda Urbana Estelí',
    date: 'Ayer',
    status: 'liquidado',
    reference: 'LAFISE-134082049-3891',
    paymentDestination: 'cuenta_lafise'
  },
  {
    id: 'earn-3',
    source: 'destacado_producto',
    title: 'Impulso Semanal (7 Días) de Prenda',
    amountNIO: 70,
    storeOrUserName: 'Clóset Infantil Masaya',
    date: 'Hace 2 días',
    status: 'liquidado',
    reference: 'BILLETERA-58898311-1029',
    paymentDestination: 'billetera_movil'
  },
  {
    id: 'earn-4',
    source: 'verificacion_tienda',
    title: 'Sello de Tienda Oficial Verificada',
    amountNIO: 75,
    storeOrUserName: 'Chic & Vintage León',
    date: 'Hace 3 días',
    status: 'liquidado',
    reference: 'LAFISE-134082049-7712',
    paymentDestination: 'cuenta_lafise'
  },
  {
    id: 'earn-5',
    source: 'publicidad_anuncio',
    title: 'Banner Publicitario en Directorio',
    amountNIO: 650,
    storeOrUserName: 'Calzado Artesanal Masaya',
    date: 'Esta semana',
    status: 'liquidado',
    reference: 'LAFISE-134082049-6500',
    paymentDestination: 'cuenta_lafise'
  }
];

export function getSavedPlatformEarnings(): PlatformEarningRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EARNINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_EARNINGS, JSON.stringify(INITIAL_PLATFORM_EARNINGS));
      return INITIAL_PLATFORM_EARNINGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PLATFORM_EARNINGS;
  }
}

export function savePlatformEarning(record: PlatformEarningRecord): void {
  try {
    const list = getSavedPlatformEarnings();
    const updated = [record, ...list];
    localStorage.setItem(STORAGE_KEY_EARNINGS, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving platform earning:', err);
  }
}
