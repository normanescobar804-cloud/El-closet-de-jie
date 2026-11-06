import React, { useState, useMemo } from 'react';
import {
  X,
  Bell,
  CheckCheck,
  Package,
  CreditCard,
  Truck,
  Clock,
  Volume2,
  VolumeX,
  CheckCircle2,
  ExternalLink,
  Trash2,
  TrendingDown
} from 'lucide-react';
import { OrderNotification } from '../types';
import {
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
  playNotificationChime,
  requestBrowserNotificationPermission
} from '../utils/notifications';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: OrderNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
  onSelectOrderFromNotification?: (orderId: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotifications,
  onSelectOrderFromNotification
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'orders' | 'payments' | 'offers'>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(isNotificationSoundEnabled);
  const [browserPermStatus, setBrowserPermStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'unread') return !n.read;
      if (filter === 'orders') return n.type === 'nuevo_pedido' || n.type === 'cambio_estado';
      if (filter === 'payments') return n.type === 'pago_actualizado';
      if (filter === 'offers') return n.type === 'price_drop';
      return true;
    });
  }, [notifications, filter]);

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setNotificationSoundEnabled(next);
    if (next) {
      playNotificationChime();
    }
  };

  const handleEnableBrowserAlerts = async () => {
    const granted = await requestBrowserNotificationPermission();
    setBrowserPermStatus(granted ? 'granted' : 'denied');
    if (granted) {
      playNotificationChime();
    }
  };

  const formatTimeAgo = (iso: string) => {
    try {
      const diffMs = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Hace unos segundos';
      if (mins < 60) return `Hace ${mins} min`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `Hace ${hours} h`;
      return new Date(iso).toLocaleDateString('es-NI', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div
      id="modal-notifications"
      className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end p-2 sm:p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col max-h-[90vh] sm:h-[86vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-900 text-white px-5 py-4 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-white leading-tight">
                  Notificaciones de Pedidos
                </h2>
                {unreadCount > 0 && (
                  <span className="text-xs font-mono tabular-nums font-bold text-amber-300">
                    · {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400">
                Alertas en tiempo real sobre compras, envíos y pagos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar notificaciones"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls & Alert Preferences Bar */}
        <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-stone-200/70 rounded-xl text-xs">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'unread', label: `No leídas (${unreadCount})` },
              { id: 'orders', label: 'Pedidos' },
              { id: 'payments', label: 'Pagos' },
              { id: 'offers', label: 'Bajas de Precio' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as typeof filter)}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filter === tab.id
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleSound}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                soundEnabled
                  ? 'bg-white text-stone-800 border-stone-200 hover:bg-stone-100'
                  : 'bg-stone-100 text-stone-400 border-stone-200'
              }`}
              title="Activar o silenciar sonido de notificación"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-stone-400" />
              )}
              <span>{soundEnabled ? 'Sonido Activo' : 'Silenciado'}</span>
            </button>

            {browserPermStatus === 'default' && (
              <button
                type="button"
                onClick={handleEnableBrowserAlerts}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-violet-50 text-violet-800 border border-violet-200 hover:bg-violet-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Activar Alertas
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 px-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <Bell className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-stone-900">
                  No hay notificaciones en esta vista
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                  Cuando realices un pedido o cambie el estado de envío o verificación de pago, recibirás un aviso instantáneo aquí.
                </p>
              </div>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isPayment = notif.type === 'pago_actualizado';
              const isNewOrder = notif.type === 'nuevo_pedido';
              const isPriceDrop = notif.type === 'price_drop';

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) onMarkAsRead(notif.id);
                  }}
                  className={`p-4 transition-colors cursor-pointer hover:bg-stone-50 ${
                    !notif.read ? 'bg-amber-50/40' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isPriceDrop
                          ? 'bg-amber-100 text-amber-700'
                          : isPayment
                          ? 'bg-emerald-100 text-emerald-700'
                          : isNewOrder
                          ? 'bg-violet-100 text-violet-700'
                          : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      {isPriceDrop ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : isPayment ? (
                        <CreditCard className="w-4 h-4" />
                      ) : isNewOrder ? (
                        <Package className="w-4 h-4" />
                      ) : (
                        <Truck className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`text-xs sm:text-sm leading-snug ${
                            !notif.read ? 'font-bold text-stone-950' : 'font-semibold text-stone-800'
                          }`}
                        >
                          {notif.title}
                        </h4>
                        <span className="text-[11px] text-stone-400 whitespace-nowrap shrink-0 flex items-center gap-1 tabular-nums">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-stone-500">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-stone-700">
                            Pedido #{notif.orderId}
                          </span>
                          <span>·</span>
                          <span>{!notif.read ? 'Sin leer' : 'Leída'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {onSelectOrderFromNotification && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsRead(notif.id);
                                onSelectOrderFromNotification(notif.orderId);
                              }}
                              className="text-violet-700 hover:text-violet-900 font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                            >
                              <span>Ver pedido</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}

                          {!notif.read && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsRead(notif.id);
                              }}
                              className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Marcar leída</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="px-3 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Marcar todas leídas</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onClearNotifications}
                className="px-3 py-2 rounded-xl text-stone-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
