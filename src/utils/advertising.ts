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
  publisherId: 'ca-pub-8544467281217488',
  headerSlotId: '',
  inFeedSlotId: '',
  footerSlotId: '',
  autoAdsEnabled: true,
  showFallbackSponsorPrompt: true
};

export const INITIAL_BUSINESS_ADS: BusinessAd[] = [];

const LEGACY_AI_AD_IDS = new Set(['ad-nic-1', 'ad-nic-2', 'ad-nic-3']);

export function getSavedBusinessAds(): BusinessAd[] {
  try {
    const raw = localStorage.getItem(BUSINESS_ADS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cleaned = parsed.filter(
      (ad: BusinessAd) => ad && !LEGACY_AI_AD_IDS.has(ad.id)
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(BUSINESS_ADS_STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function saveBusinessAds(ads: BusinessAd[]): void {
  try {
    const cleaned = ads.filter((ad) => ad && !LEGACY_AI_AD_IDS.has(ad.id));
    localStorage.setItem(BUSINESS_ADS_STORAGE_KEY, JSON.stringify(cleaned));
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
