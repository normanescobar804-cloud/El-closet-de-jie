import React, { useState, useId } from 'react';
import { X, MessageCircle, Send, Sparkles, MapPin, Phone, User, CheckCircle2, HeartHandshake } from 'lucide-react';
import { CustomerInquiry, StoreSettings, UserAccount } from '../types';
import { saveInquiry } from '../utils/storage';
import { recordWhatsAppAction } from '../utils/analytics';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSettings: StoreSettings;
  currentUser: UserAccount | null;
  initialProductInterest?: string;
  onInquirySubmitted?: (inquiry: CustomerInquiry) => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  storeSettings,
  currentUser,
  initialProductInterest = '',
  onInquirySubmitted,
}) => {
  const nameId = useId();
  const phoneId = useId();
  const cityId = useId();
  const inquiryTypeId = useId();
  const productInterestId = useId();
  const messageId = useId();

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phoneOrEmail || '');
  const [city, setCity] = useState(currentUser?.city || 'Managua');
  const [inquiryType, setInquiryType] = useState<CustomerInquiry['inquiryType']>(
    initialProductInterest ? 'prenda' : 'consulta_general'
  );
  const [productInterest, setProductInterest] = useState(initialProductInterest);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Por favor escribe tu nombre.');
      return;
    }

    if (!phone.trim()) {
      setError('Por favor indica tu número de WhatsApp para poder contactarte.');
      return;
    }

    const newInquiry: CustomerInquiry = {
      id: `lead-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      customerName: name.trim(),
      customerPhone: phone.trim(),
      customerCity: city.trim() || 'Nicaragua',
      inquiryType,
      productName: productInterest.trim() || undefined,
      message: message.trim() || (inquiryType === 'inscripcion_ofertas' ? 'Deseo inscribirme para recibir novedades y ofertas por WhatsApp.' : 'Consulta general desde la web.'),
      status: 'nuevo'
    };

    saveInquiry(newInquiry);
    if (onInquirySubmitted) {
      onInquirySubmitted(newInquiry);
    }

    // Format WhatsApp message to notify the owner immediately
    let typeLabel = 'Consulta General';
    if (inquiryType === 'prenda') typeLabel = '👗 Pregunta sobre Prenda / Ropa';
    else if (inquiryType === 'talla_stock') typeLabel = '📏 Consulta de Tallas y Disponibilidad';
    else if (inquiryType === 'envio_indrive') typeLabel = '🛵 Consulta sobre Envío con inDrive';
    else if (inquiryType === 'inscripcion_ofertas') typeLabel = '✨ Inscripción a Novedades y Ofertas 20% OFF';

    let waText = `*¡Hola ${storeSettings.storeName}!* 👋💌\n\n`;
    waText += `He dejado un mensaje / inscripción desde su tienda web:\n\n`;
    waText += `📌 *Asunto:* ${typeLabel}\n`;
    waText += `👤 *Nombre:* ${name.trim()}\n`;
    waText += `📱 *WhatsApp de contacto:* ${phone.trim()}\n`;
    if (city.trim()) {
      waText += `📍 *Ciudad / Zona:* ${city.trim()}\n`;
    }
    if (productInterest.trim()) {
      waText += `👗 *Prenda de interés:* ${productInterest.trim()}\n`;
    }
    waText += `💬 *Mensaje:* ${newInquiry.message}\n\n`;
    waText += `¿Me podrían brindar información? ¡Quedo atento/a!`;

    // Clean phone number
    let rawNumber = storeSettings.whatsappNumber.replace(/\D/g, '');
    if (rawNumber.length === 8) {
      rawNumber = `505${rawNumber}`;
    }
    if (!rawNumber) rawNumber = '50558898311';

    const waUrl = `https://wa.me/${rawNumber}?text=${encodeURIComponent(waText)}`;
    recordWhatsAppAction();
    setSubmitted(true);

    // Open WhatsApp in new tab after slight delay
    setTimeout(() => {
      window.open(waUrl, '_blank');
    }, 600);
  };

  const handleResetForm = () => {
    setSubmitted(false);
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div
        className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-800 via-purple-700 to-indigo-800 p-5 sm:p-6 text-white relative">
          <button
            id="btn-close-contact-modal"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-amber-300">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-purple-200 block">
                Comunicación directa
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold leading-tight">
                Contáctanos o Déjanos un Mensaje
              </h3>
            </div>
          </div>
          <p className="text-xs text-purple-100 mt-2 leading-relaxed">
            Escríbenos para consultar tallas, telas, envíos por inDrive o inscríbete para recibir nuevas prendas antes que nadie.
          </p>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto">
          {submitted ? (
            <div className="py-8 text-center space-y-4 animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10 stroke-[2]" />
              </div>

              <div>
                <h4 className="font-serif text-xl font-bold text-stone-900">
                  ¡Mensaje Enviado con Éxito!
                </h4>
                <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto leading-relaxed">
                  Tu mensaje fue registrado en la tienda y enviado al WhatsApp de <strong className="text-stone-900">{storeSettings.storeName}</strong> ({storeSettings.whatsappNumber}). Te responderemos de inmediato.
                </p>
              </div>

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-left text-xs space-y-1.5 max-w-sm mx-auto">
                <div className="flex justify-between">
                  <span className="text-stone-500">A nombre de:</span>
                  <span className="font-bold text-stone-800">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Teléfono:</span>
                  <span className="font-mono font-bold text-emerald-700">{phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Zona / Ciudad:</span>
                  <span className="font-medium text-stone-800">{city}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  id="btn-contact-done"
                  onClick={handleResetForm}
                  className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-sm transition-transform active:scale-95 cursor-pointer"
                >
                  Regresar a la Tienda
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Inquiry Type Selector */}
              <div>
                <label htmlFor={inquiryTypeId} className="block text-xs font-bold text-stone-700 mb-1.5">
                  ¿En qué te podemos ayudar? *
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'prenda', label: '👗 Prenda o ropa' },
                    { id: 'envio_indrive', label: '🛵 Envío con inDrive' },
                    { id: 'talla_stock', label: '📏 Tallas y Stock' },
                    { id: 'inscripcion_ofertas', label: '✨ Inscripción / 20% OFF' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setInquiryType(option.id as CustomerInquiry['inquiryType'])}
                      className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                        inquiryType === option.id
                          ? 'bg-violet-50 text-violet-900 border-violet-500 ring-2 ring-violet-200'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={nameId} className="block text-xs font-bold text-stone-700 mb-1">
                    Tu Nombre Completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      id={nameId}
                      type="text"
                      required
                      placeholder="Ej: Laura Gutiérrez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={phoneId} className="block text-xs font-bold text-stone-700 mb-1">
                    Número de WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      id={phoneId}
                      type="tel"
                      required
                      placeholder="Ej: 83702337"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* City / Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={cityId} className="block text-xs font-bold text-stone-700 mb-1">
                    Ciudad / Municipio
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      id={cityId}
                      type="text"
                      placeholder="Ej: Managua, Reparto Chick, etc."
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={productInterestId} className="block text-xs font-bold text-stone-700 mb-1">
                    Prenda de interés (Opcional)
                  </label>
                  <input
                    id={productInterestId}
                    type="text"
                    placeholder="Ej: Vestido Floral, Jeans..."
                    value={productInterest}
                    onChange={(e) => setProductInterest(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Detailed Message */}
              <div>
                <label htmlFor={messageId} className="block text-xs font-bold text-stone-700 mb-1">
                  Tu Mensaje o Consulta
                </label>
                <textarea
                  id={messageId}
                  rows={3}
                  placeholder={
                    inquiryType === 'envio_indrive'
                      ? '¿Cómo funciona la entrega con inDrive y cuánto costaría llevarlo a mi ubicación?'
                      : inquiryType === 'inscripcion_ofertas'
                      ? 'Quiero que me avisen por WhatsApp cuando lleguen prendas nuevas y promociones.'
                      : 'Escribe aquí tu consulta o lo que deseas preguntarle al dueño...'
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-violet-500 focus:bg-white resize-none"
                />
              </div>

              {/* inDrive Banner Note */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <span className="text-base leading-none">🛵</span>
                <div>
                  <strong className="font-bold">¿Deseas entrega hoy mismo con inDrive?</strong>
                  <p className="text-amber-800 mt-0.5">
                    Coordinamos envíos con conductores de inDrive Moto o Auto para entregarte en minutos en Managua.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  id="btn-submit-contact-form"
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Mensaje al Dueño por WhatsApp</span>
                </button>
              </div>

              <p className="text-[10px] text-stone-400 text-center">
                🔒 Tus datos se enviarán directamente al dueño de la boutique para brindarte atención personalizada.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
