import { AnalyticsData, DailyTrafficStat } from '../types';

const ANALYTICS_STORAGE_KEY = 'tienda_jiet_analytics_real_v4';
const SESSION_KEY = 'tienda_jiet_session_visited_today';

// Helper to format date in Spanish
function formatDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function getSpanishFriendlyDate(d: Date): { formatted: string; dayName: string } {
  const day = d.getDate();
  const month = MONTHS_ES[d.getMonth()];
  return {
    formatted: `${day} ${month}`,
    dayName: DAYS_ES[d.getDay()]
  };
}

/**
 * Initializes clean, zero-baseline analytics so only real visits and real clicks are counted.
 */
function createDefaultAnalytics(): AnalyticsData {
  const today = new Date();
  const todayStr = formatDateStr(today);
  const { formatted, dayName } = getSpanishFriendlyDate(today);

  return {
    totalViews: 0,
    totalUniqueVisitors: 0,
    todayViews: 0,
    todayUniqueVisitors: 0,
    yesterdayViews: 0,
    whatsappInquiriesClicks: 0,
    deviceBreakdown: {
      mobile: 0,
      desktop: 0
    },
    referrerBreakdown: {
      direct: 0,
      whatsapp: 0,
      facebook: 0,
      instagram: 0,
      tiktok: 0,
      other: 0
    },
    hourlyBreakdown: {},
    dailyHistory: [
      {
        date: todayStr,
        formattedDate: formatted,
        dayName,
        pageViews: 0,
        uniqueVisitors: 0,
        whatsappClicks: 0
      }
    ],
    lastUpdated: new Date().toISOString()
  };
}

export function getAnalyticsData(): AnalyticsData {
  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!raw) {
      const initial = createDefaultAnalytics();
      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed: AnalyticsData = JSON.parse(raw);
    
    // Ensure today's slot exists in history
    const today = new Date();
    const todayStr = formatDateStr(today);
    let todayItem = parsed.dailyHistory.find(h => h.date === todayStr);
    
    if (!todayItem) {
      const { formatted, dayName } = getSpanishFriendlyDate(today);
      todayItem = {
        date: todayStr,
        formattedDate: formatted,
        dayName,
        pageViews: 0,
        uniqueVisitors: 0,
        whatsappClicks: 0
      };
      parsed.dailyHistory.push(todayItem);
      // Keep only last 30 days
      if (parsed.dailyHistory.length > 30) {
        parsed.dailyHistory.shift();
      }
      parsed.todayViews = 0;
      parsed.todayUniqueVisitors = 0;
      
      // Update yesterday views
      const yesterdayDate = new Date(today);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = formatDateStr(yesterdayDate);
      const yItem = parsed.dailyHistory.find(h => h.date === yesterdayStr);
      parsed.yesterdayViews = yItem ? yItem.pageViews : 0;

      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(parsed));
    }

    return parsed;
  } catch (err) {
    console.error('Error getting analytics:', err);
    return createDefaultAnalytics();
  }
}

export function saveAnalyticsData(data: AnalyticsData): void {
  try {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving analytics data:', err);
  }
}

/**
 * Registers a real visit when a user opens or navigates the site
 */
export function recordPageView(): AnalyticsData {
  const current = getAnalyticsData();
  const today = new Date();
  const todayStr = formatDateStr(today);
  const hourKey = String(today.getHours()).padStart(2, '0');

  // Check if this browser session already counted as unique today
  const sessionVisitedToday = sessionStorage.getItem(SESSION_KEY);
  const isNewUniqueVisitor = sessionVisitedToday !== todayStr;

  // Increment total views
  current.totalViews += 1;
  current.todayViews += 1;

  if (isNewUniqueVisitor) {
    current.totalUniqueVisitors += 1;
    current.todayUniqueVisitors += 1;
    sessionStorage.setItem(SESSION_KEY, todayStr);
  }

  // Update hourly distribution
  current.hourlyBreakdown[hourKey] = (current.hourlyBreakdown[hourKey] || 0) + 1;

  // Update device stats
  const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  if (isMobile) {
    current.deviceBreakdown.mobile += 1;
  } else {
    current.deviceBreakdown.desktop += 1;
  }

  // Update referrer stats
  if (typeof document !== 'undefined') {
    const ref = (document.referrer || '').toLowerCase();
    if (ref.includes('whatsapp') || window.location.search.includes('wa')) {
      current.referrerBreakdown.whatsapp += 1;
    } else if (ref.includes('facebook') || ref.includes('fb.')) {
      current.referrerBreakdown.facebook += 1;
    } else if (ref.includes('instagram')) {
      current.referrerBreakdown.instagram += 1;
    } else if (ref.includes('tiktok')) {
      current.referrerBreakdown.tiktok += 1;
    } else if (!ref) {
      current.referrerBreakdown.direct += 1;
    } else {
      current.referrerBreakdown.other += 1;
    }
  }

  // Update daily history
  let todayRecord = current.dailyHistory.find(h => h.date === todayStr);
  if (!todayRecord) {
    const { formatted, dayName } = getSpanishFriendlyDate(today);
    todayRecord = {
      date: todayStr,
      formattedDate: formatted,
      dayName,
      pageViews: 1,
      uniqueVisitors: isNewUniqueVisitor ? 1 : 0,
      whatsappClicks: 0
    };
    current.dailyHistory.push(todayRecord);
  } else {
    todayRecord.pageViews += 1;
    if (isNewUniqueVisitor) {
      todayRecord.uniqueVisitors += 1;
    }
  }

  current.lastUpdated = new Date().toISOString();
  saveAnalyticsData(current);

  return current;
}

/**
 * Registers clicks on WhatsApp buttons to measure real conversions
 */
export function recordWhatsAppAction(): void {
  try {
    const current = getAnalyticsData();
    current.whatsappInquiriesClicks += 1;
    
    const today = new Date();
    const todayStr = formatDateStr(today);
    const todayRecord = current.dailyHistory.find(h => h.date === todayStr);
    if (todayRecord) {
      todayRecord.whatsappClicks = (todayRecord.whatsappClicks || 0) + 1;
    }

    current.lastUpdated = new Date().toISOString();
    saveAnalyticsData(current);
  } catch (err) {
    console.warn('Could not record WhatsApp click:', err);
  }
}

/**
 * Session duration and real-time visit tracking
 */
const SESSION_START_KEY = 'tienda_jiet_session_start_time';
const TOTAL_VISIT_SECONDS_KEY = 'tienda_jiet_accumulated_visit_seconds_real_v2';

export function initSessionTimer(): void {
  try {
    if (!sessionStorage.getItem(SESSION_START_KEY)) {
      sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
    }
  } catch {}
}

export function getCurrentSessionDurationSeconds(): number {
  try {
    const start = sessionStorage.getItem(SESSION_START_KEY);
    if (!start) return 0;
    const diff = Math.floor((Date.now() - Number(start)) / 1000);
    return Math.max(0, diff);
  } catch {
    return 0;
  }
}

export function recordHeartbeatVisit(seconds: number = 10): number {
  try {
    const raw = localStorage.getItem(TOTAL_VISIT_SECONDS_KEY);
    const prev = raw ? Number(raw) : 0;
    const updated = prev + seconds;
    localStorage.setItem(TOTAL_VISIT_SECONDS_KEY, String(updated));
    return updated;
  } catch {
    return 0;
  }
}

export function getTotalAccumulatedVisitSeconds(): number {
  try {
    const raw = localStorage.getItem(TOTAL_VISIT_SECONDS_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export function formatVisitDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Reset or recalculate metrics
 */
export function resetAnalytics(): AnalyticsData {
  const fresh = createDefaultAnalytics();
  saveAnalyticsData(fresh);
  return fresh;
}
