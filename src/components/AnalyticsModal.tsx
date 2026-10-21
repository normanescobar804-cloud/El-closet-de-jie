import React from 'react';
import { X, BarChart3, RefreshCw } from 'lucide-react';
import { AnalyticsData, CurrencyType, OrderRecord, Product } from '../types';
import { AnalyticsView } from './AnalyticsView';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: AnalyticsData;
  orders?: OrderRecord[];
  products?: Product[];
  currency?: CurrencyType;
  exchangeRate?: number;
  isCloudConnected?: boolean;
  onRefresh: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  analytics,
  orders = [],
  products = [],
  currency = 'cordobas',
  exchangeRate = 36.5,
  isCloudConnected = true,
  onRefresh,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-analytics"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl max-h-[92vh] bg-stone-50 rounded-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="bg-stone-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-base sm:text-lg font-bold text-amber-200 leading-tight">
                Panel de Estadísticas • El Clóset de Jié
              </h2>
              <p className="text-xs text-stone-400">
                Métricas de ventas, pedidos, métodos de pago y visitas en tiempo real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="p-2 text-stone-400 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-xl transition-colors cursor-pointer"
              title="Actualizar datos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AnalyticsView
            analytics={analytics}
            orders={orders}
            products={products}
            currency={currency}
            exchangeRate={exchangeRate}
            isCloudConnected={isCloudConnected}
            onRefresh={onRefresh}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-white border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <span>
            Actualizado: {new Date(analytics.lastUpdated).toLocaleTimeString()}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Cerrar Panel
          </button>
        </div>
      </div>
    </div>
  );
};
