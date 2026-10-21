import { AdPlanConfig, BusinessAd, GoogleAdSenseConfig } from '../types';

const BUSINESS_ADS_STORAGE_KEY = 'tienda_jiet_business_ads_v1';

export const NICARAGUA_DEPARTMENTS = [
  'Managua',
  'León',
  'Masaya',
  'Granada',
  'Chinandega',
  'Carazo',
  'Estelí',
  'Matagalpa',
  'Jinotega',
  'Rivas',
  'Chontales',
  'Boaco',
  'Madriz',
  'Nueva Segovia',
  'Río San Juan',
  'RACCS (Bluefields)',
  'RACCN (Bilwi)'
];

export const BUSINESS_CATEGORIES = [
  'Ropa, Calzado y Moda',
  'Restaurante y Cafetería',
  'Calzado y Marroquinería',
  'Belleza, Salón y Barbería',
  'Tecnología y Celulares',
  'Juguetería y Eventos Infantiles',
  'Pastelería y Repostería',
  'Transporte y Encomiendas',
  'Salud, Clínica y Farmacia',
  'Hogar y Decoración',
  'Servicios Profesionales'
];

export const AD_PLANS: AdPlanConfig[] = [
  {
    id: 'comunidad_gratis',
    name: 'Plan Comunidad Libre (Gratis)',
    durationDays: 14,
    priceNIO: 0,
    priceUSD: 0,
    badge: '100% Gratis • 14 Días',
    placement: 'directory_featured',
    features: [
      'Publicación 100% libre y gratuita en el Directorio de Negocios de Nicaragua',
      'Botón directo a tu WhatsApp de ventas sin comisiones',
      'Visible en computadoras y celulares de toda la comunidad',
      'Activación inmediata en la base de datos de la plataforma'
    ]
  },
  {
    id: 'basico_semanal',
    name: 'Plan Emprendedor Semanal',
    durationDays: 7,
    priceNIO: 250,
    priceUSD: 7,
    badge: '7 Días Destacado',
    placement: 'directory_featured',
    features: [
      'Tarjeta patrocinada prioritaria en Directorio de Negocios de Nicaragua',
      'Botón directo a tu WhatsApp de ventas y redes sociales',
      'Insignia "Negocio Verificado Nicaragua"',
      'Adaptado para celulares y computadoras'
    ]
  },
  {
    id: 'destacado_mensual',
    name: 'Plan Negocio Destacado (30 Días)',
    durationDays: 30,
    priceNIO: 650,
    priceUSD: 18,
    badge: 'Más Popular • 30 Días',
    placement: 'catalog_infeed',
    popular: true,
    features: [
      'Anuncio intercalado directamente dentro del Catálogo de Productos',
      'Presencia destacada en el Directorio de Negocios por 30 días',
      'Etiqueta de Cupón o Promoción Especial para clientes',
      'Estadísticas en vivo de vistas y clics a tu WhatsApp'
    ]
  },
  {
    id: 'vip_patrocinador',
    name: 'Plan Patrocinador Oficial VIP (60 Días)',
    durationDays: 60,
    priceNIO: 1200,
    priceUSD: 33,
    badge: 'Máxima Exposición • 60 Días',
    placement: 'hero_banner',
    features: [
      'Banner Principal Superior en la Portada de la Plataforma',
      'Aparición VIP en el Catálogo + Directorio de Negocios',
      'Diseño de alto impacto en Computadoras y Celulares',
      'Prioridad máxima y botón directo a WhatsApp o Sitio Web'
    ]
  }
];

export const DEFAULT_ADSENSE_CONFIG: GoogleAdSenseConfig = {
  enabled: true,
  publisherId: 'ca-pub-0000000000000000',
  headerSlotId: '1029384756',
  inFeedSlotId: '5647382910',
  footerSlotId: '9081726354',
  autoAdsEnabled: true,
  showFallbackSponsorPrompt: true
};

export const INITIAL_BUSINESS_ADS: BusinessAd[] = [
  {
    id: 'ad-nic-1',
    businessName: 'Dulce Encanto Pastelería & Café',
    category: 'Pastelería y Repostería',
    department: 'Managua',
    headline: 'Pasteles personalizados para cumpleaños infantiles y eventos en Managua',
    description: 'Endulzamos las celebraciones de tus peques con pasteles temáticos, cupcakes y postres artesanales recién horneados.',
    promoText: '🎁 10% OFF en tu pastel mencionando El Clóset de Jié',
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80',
    whatsappPhone: '50588887711',
    websiteOrSocialUrl: 'https://instagram.com',
    ctaText: 'Cotizar Pastel por WhatsApp',
    planId: 'vip_patrocinador',
    planName: 'Plan Patrocinador Oficial VIP (60 Días)',
    pricePaid: 1200,
    currency: 'NIO',
    paymentMethod: 'transferencia_lafise',
    paymentStatus: 'pagado',
    status: 'activo',
    impressions: 342,
    clicks: 48,
    ownerName: 'María Fernanda Rivas',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 57 * 86400000).toISOString()
  },
  {
    id: 'ad-nic-2',
    businessName: 'Calzado Artesanal Masaya Kids',
    category: 'Calzado y Marroquinería',
    department: 'Masaya',
    headline: 'Zapatos, sandalias y botas 100% cuero nicaragüense para niños y adultos',
    description: 'Calidad garantizada hecha por manos artesanas de Masaya. Envíos rápidos a toda Nicaragua y precios de taller.',
    promoText: '🛵 Envío gratis en Managua y Masaya por 2 pares',
    imageUrl: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?auto=format&fit=crop&w=900&q=80',
    whatsappPhone: '50589992233',
    ctaText: 'Ver Catálogo en WhatsApp',
    planId: 'destacado_mensual',
    planName: 'Plan Negocio Destacado (30 Días)',
    pricePaid: 650,
    currency: 'NIO',
    paymentMethod: 'transferencia_lafise',
    paymentStatus: 'pagado',
    status: 'activo',
    impressions: 215,
    clicks: 31,
    ownerName: 'Carlos Humberto Membreño',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 25 * 86400000).toISOString()
  },
  {
    id: 'ad-nic-3',
    businessName: 'Mundo Fiesta & Piñatas Pinoleras',
    category: 'Juguetería y Eventos Infantiles',
    department: 'León',
    headline: 'Decoración con globos, piñatas personalizadas y alquiler de brinca-brinca',
    description: 'Armamos el paquete completo para fiestas infantiles en León, Chinandega y Managua. ¡Precios especiales de temporada!',
    promoText: '🎈 Piñata gratis al contratar paquete de decoración',
    imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&q=80',
    whatsappPhone: '50587774455',
    ctaText: 'Reservar Fecha por WhatsApp',
    planId: 'destacado_mensual',
    planName: 'Plan Negocio Destacado (30 Días)',
    pricePaid: 650,
    currency: 'NIO',
    paymentMethod: 'tarjeta_credito_debito',
    paymentStatus: 'pagado',
    status: 'activo',
    impressions: 189,
    clicks: 24,
    ownerName: 'Lucía Castellón',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 28 * 86400000).toISOString()
  }
];

export function getSavedBusinessAds(): BusinessAd[] {
  try {
    const raw = localStorage.getItem(BUSINESS_ADS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BUSINESS_ADS_STORAGE_KEY, JSON.stringify(INITIAL_BUSINESS_ADS));
      return INITIAL_BUSINESS_ADS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_BUSINESS_ADS;
  } catch {
    return INITIAL_BUSINESS_ADS;
  }
}

export function saveBusinessAds(ads: BusinessAd[]): void {
  try {
    localStorage.setItem(BUSINESS_ADS_STORAGE_KEY, JSON.stringify(ads));
  } catch (e) {
    console.error('Error saving business ads:', e);
  }
}

export function recordAdClickLocal(adId: string): BusinessAd[] {
  const current = getSavedBusinessAds();
  const updated = current.map((ad) =>
    ad.id === adId ? { ...ad, clicks: (ad.clicks || 0) + 1 } : ad
  );
  saveBusinessAds(updated);
  return updated;
}
