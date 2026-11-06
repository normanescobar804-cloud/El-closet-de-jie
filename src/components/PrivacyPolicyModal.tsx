import React from 'react';
import { ShieldCheck, X, Lock, Trash2, Mail, Phone, MapPin, CheckCircle } from 'lucide-react';
import { StoreSettings } from '../types';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSettings: StoreSettings;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  storeSettings
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-violet-900 via-purple-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300 border border-white/15">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Política de Privacidad y Términos</span>
                <span className="text-[10px] uppercase font-bold bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/20">
                  Google Play Ready
                </span>
              </h3>
              <p className="text-xs text-stone-300">
                {storeSettings.storeName} • Protección de Datos en Nicaragua
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-stone-700 text-xs leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-violet-50 border border-violet-200 text-violet-900 flex items-start gap-3">
            <Lock className="w-5 h-5 text-violet-700 shrink-0 mt-0.5" />
            <p>
              Esta política cumple con los requisitos del <strong>Google Play Developer Distribution Agreement</strong> y las normativas de protección de datos personales. Tu privacidad es fundamental para nosotros.
            </p>
          </div>

          <section className="space-y-2">
            <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              1. Datos que recopilamos
            </h4>
            <p>
              Para prestar los servicios de compra, entrega a domicilio y atención personalizada, recopilamos únicamente los datos necesarios que tú proporcionas voluntariamente:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-600">
              <li><strong>Nombre y Apellido:</strong> Para identificar al destinatario de las prendas.</li>
              <li><strong>Número de WhatsApp / Teléfono o Correo:</strong> Para coordinar el envío, confirmar pedidos y responder dudas.</li>
              <li><strong>Dirección de entrega y puntos de referencia:</strong> Para el chofer de inDrive o empresa de mensajería (CargoTrans).</li>
              <li><strong>Preferencia de pago:</strong> Registro de método elegido (Transferencia bancaria LAFISE, tarjeta o contra entrega).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              2. Uso y Finalidad de los Datos
            </h4>
            <p>
              Tus datos se utilizan con el único propósito de:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-600">
              <li>Procesar tus solicitudes y coordinar la entrega de tus pedidos.</li>
              <li>Permitirte iniciar sesión y mantener tu historial de compras y puntos de lealtad.</li>
              <li>Facilitar la comunicación directa mediante WhatsApp y chat comunitario de la app.</li>
              <li><strong>Nunca vendemos, alquilamos ni compartimos tus datos personales con terceros para fines comerciales o publicitarios no autorizados.</strong></li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              3. Seguridad y Almacenamiento
            </h4>
            <p>
              La información se almacena localmente de forma segura en tu dispositivo y sincronizada de forma cifrada mediante Google Firebase / Firestore bajo protocolos HTTPS/SSL estándar en la industria.
            </p>
          </section>

          <section className="space-y-2 p-4 rounded-2xl bg-rose-50/70 border border-rose-200">
            <h4 className="font-bold text-rose-950 text-sm flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-rose-600" />
              4. Derecho de Eliminación de Cuenta y Datos (Google Play Policy)
            </h4>
            <p className="text-rose-900">
              Tienes el derecho absoluto e irrestricto de solicitar la eliminación total de tu cuenta y todos tus datos personales en cualquier momento.
            </p>
            <p className="text-stone-600">
              Puedes hacerlo directamente desde la sección <strong>"Mi Cuenta &gt; Eliminar mi Cuenta y Datos"</strong> dentro de la aplicación, o escribiéndonos a nuestro correo de contacto o WhatsApp de atención al cliente. Al solicitarlo, todos tus registros, direcciones y datos de sesión son eliminados de forma inmediata y permanente.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="font-bold text-stone-900 text-sm">5. Contacto para Privacidad y Soporte</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <Mail className="w-4 h-4 text-violet-600 shrink-0" />
                <span className="truncate">normanescobar804@gmail.com</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Managua, Nicaragua</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <span className="text-[11px] text-stone-500">
            Última actualización: Noviembre 2026 • Versión 2.0
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
