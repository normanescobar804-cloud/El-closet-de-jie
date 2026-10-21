import React, { useState, useRef } from 'react';
import {
  X,
  Megaphone,
  CheckCircle2,
  Sparkles,
  Upload,
  MapPin,
  MessageCircle,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import {
  AdPlanId,
  BusinessAd,
  CurrencyType,
  PaymentMethodType,
  StoreSettings
} from '../types';
import {
  AD_PLANS,
  BUSINESS_CATEGORIES,
  NICARAGUA_DEPARTMENTS
} from '../utils/advertising';
import { formatCurrency, processHighResImage } from '../utils/storage';
import { getActivePaymentGateways } from '../utils/paymentGateways';

interface AdvertiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSettings: StoreSettings;
  currency: CurrencyType;
  onSubmitAd: (newAd: BusinessAd) => void;
}

export const AdvertiseModal: React.FC<AdvertiseModalProps> = ({
  isOpen,
  onClose,
  storeSettings,
  currency,
  onSubmitAd
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPlanId, setSelectedPlanId] = useState<AdPlanId>('comunidad_gratis');

  // Business Details State
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [category, setCategory] = useState(BUSINESS_CATEGORIES[0]);
  const [department, setDepartment] = useState('Managua');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [websiteOrSocialUrl, setWebsiteOrSocialUrl] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [promoText, setPromoText] = useState('');
  const [ctaText, setCtaText] = useState('Contactar por WhatsApp');
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80'
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('transferencia_lafise');
  const [paymentReference, setPaymentReference] = useState('');
  const [copiedBank, setCopiedBank] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const selectedPlan = AD_PLANS.find((p) => p.id === selectedPlanId) || AD_PLANS[0];
  const isFreePlan = selectedPlan.priceNIO === 0;
  const activeGateways = getActivePaymentGateways(storeSettings.paymentGateways).filter(
    (g) => g.id !== 'efectivo_contra_entrega'
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const highRes = await processHighResImage(file);
      setImageUrl(highRes);
    } catch (err) {
      console.error('Error processing ad image:', err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCopyAccount = () => {
    const accountNum = '134082049';
    navigator.clipboard.writeText(accountNum);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2500);
  };

  const handleCompleteSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !whatsappPhone.trim() || !headline.trim()) return;

    const now = new Date();
    const expires = new Date(now.getTime() + selectedPlan.durationDays * 86400000);

    const newAd: BusinessAd = {
      id: `ad-nic-${Date.now().toString().slice(-6)}`,
      businessName: businessName.trim(),
      ownerName: ownerName.trim() || businessName.trim(),
      category,
      department,
      headline: headline.trim(),
      description: description.trim() || headline.trim(),
      promoText: promoText.trim() || undefined,
      imageUrl,
      whatsappPhone: whatsappPhone.trim(),
      websiteOrSocialUrl: websiteOrSocialUrl.trim() || undefined,
      ctaText: ctaText.trim() || 'Contactar por WhatsApp',
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      pricePaid: selectedPlan.priceNIO,
      currency,
      paymentMethod,
      paymentReference: isFreePlan ? 'GRATIS-COMUNIDAD' : paymentReference.trim() || undefined,
      paymentStatus: isFreePlan
        ? 'pagado'
        : paymentReference.trim()
        ? 'en_verificacion'
        : 'pendiente',
      status: 'activo',
      impressions: 1,
      clicks: 0,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString()
    };

    onSubmitAd(newAd);
    setSubmittedSuccess(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-stone-950 via-stone-900 to-indigo-950 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center shadow-md shrink-0">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif text-lg sm:text-2xl font-bold text-white">
                  Portal de Negocios y Emprendedores de Nicaragua
                </h2>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  🇳🇮 Plan Libre Gratis + Planes Destacados
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Publica tu negocio gratis en el directorio comunitario o elige un plan patrocinado de máxima visibilidad.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Bar */}
        <div className="bg-stone-100 px-4 sm:px-6 py-3 border-b border-stone-200 flex items-center justify-between text-xs font-bold">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-1.5 cursor-pointer ${
              step === 1 ? 'text-violet-700' : 'text-stone-500'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-violet-700 text-white' : 'bg-stone-300 text-stone-700'}`}>1</span>
            <span>1. Elegir Plan (Gratis o VIP)</span>
          </button>
          <div className="h-0.5 flex-1 mx-3 bg-stone-300" />
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex items-center gap-1.5 cursor-pointer ${
              step === 2 ? 'text-violet-700' : 'text-stone-500'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-violet-700 text-white' : 'bg-stone-300 text-stone-700'}`}>2</span>
            <span>2. Diseñar Anuncio</span>
          </button>
          <div className="h-0.5 flex-1 mx-3 bg-stone-300" />
          <button
            type="button"
            onClick={() => {
              if (businessName && whatsappPhone && headline) setStep(3);
            }}
            className={`flex items-center gap-1.5 cursor-pointer ${
              step === 3 ? 'text-violet-700' : 'text-stone-500'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-violet-700 text-white' : 'bg-stone-300 text-stone-700'}`}>3</span>
            <span>3. {isFreePlan ? 'Activar Gratis' : 'Pago Electrónico'}</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {submittedSuccess ? (
            <div className="py-10 px-4 text-center max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-stone-900">
                ¡Tu Negocio ya está Activo en la Plataforma!
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Hemos publicado el anuncio de <strong>{businessName}</strong> en el plan <strong>{selectedPlan.name}</strong> sincronizado con la base de datos en tiempo real.
              </p>
              <div className="pt-3 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedSuccess(false);
                    onClose();
                  }}
                  className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Ver mi Anuncio en la Página
                </button>
              </div>
            </div>
          ) : step === 1 ? (
            /* STEP 1: CHOOSE ADVERTISING PLAN */
            <div className="space-y-6">
              <div className="text-center max-w-2xl mx-auto">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                  Elige tu Plan: Uso Libre Gratis o Posicionamiento Destacado
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Todos los usuarios pueden registrarse gratis en el Directorio Comunitario o impulsar su marca con banners patrocinados.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {AD_PLANS.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  const isFree = plan.priceNIO === 0;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`rounded-3xl p-4 sm:p-5 border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                        isSelected
                          ? isFree
                            ? 'border-emerald-600 bg-emerald-50/30 ring-2 ring-emerald-200 shadow-lg'
                            : 'border-violet-600 bg-violet-50/30 ring-2 ring-violet-200 shadow-lg'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 text-[10px] font-black px-3 py-0.5 rounded-full shadow-xs">
                          ⭐ MÁS ELEGIDO
                        </div>
                      )}
                      {isFree && (
                        <div className="absolute -top-3 left-4 bg-emerald-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow-xs">
                          USO LIBRE
                        </div>
                      )}

                      <div className="space-y-3">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
                          {plan.badge}
                        </span>
                        <h4 className="font-serif text-base sm:text-lg font-bold text-stone-900">
                          {plan.name}
                        </h4>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-serif text-2xl sm:text-3xl font-black text-stone-950">
                            {isFree ? 'GRATIS' : `C$ ${plan.priceNIO.toLocaleString()}`}
                          </span>
                          {!isFree && (
                            <span className="text-xs font-bold text-stone-500">
                              / ${plan.priceUSD} USD
                            </span>
                          )}
                        </div>

                        <ul className="space-y-2 pt-2 border-t border-stone-100 text-xs text-stone-700">
                          {plan.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlanId(plan.id);
                          setStep(2);
                        }}
                        className={`mt-5 w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isFree
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                            : isSelected
                            ? 'bg-violet-700 hover:bg-violet-800 text-white shadow-sm'
                            : 'bg-stone-900 hover:bg-stone-800 text-white'
                        }`}
                      >
                        <span>{isFree ? 'Publicar Gratis' : 'Elegir Plan'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : step === 2 ? (
            /* STEP 2: DESIGN YOUR AD + LIVE PREVIEW */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-violet-700" />
                  <span>Datos y Diseño de tu Anuncio</span>
                </h3>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                      Nombre de tu Negocio *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Cafetería y Pastelería Delicias"
                      value={businessName}
                      onChange={(e) => {
                        setBusinessName(e.target.value);
                        setFormError('');
                      }}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                      Tu Nombre (Responsable) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Andrea Morales"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                      Categoría del Negocio
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900"
                    >
                      {BUSINESS_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                      Departamento en Nicaragua
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900"
                    >
                      {NICARAGUA_DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                      WhatsApp de Ventas del Negocio *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej: 8888-8888"
                      value={whatsappPhone}
                      onChange={(e) => {
                        setWhatsappPhone(e.target.value);
                        setFormError('');
                      }}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                      Enlace Instagram / Facebook / Web
                    </label>
                    <input
                      type="url"
                      placeholder="https://instagram.com/tu_negocio"
                      value={websiteOrSocialUrl}
                      onChange={(e) => setWebsiteOrSocialUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                      Título Principal del Anuncio *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Calzado 100% cuero hecho en Masaya con envío a toda Nicaragua"
                      value={headline}
                      onChange={(e) => {
                        setHeadline(e.target.value);
                        setFormError('');
                      }}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                      Descripción de tus Productos o Servicios
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Describe lo que ofreces, horarios o cobertura de delivery..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                      Promoción o Descuento Especial (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 🎁 15% de descuento mencionando El Clóset de Jié"
                      value={promoText}
                      onChange={(e) => setPromoText(e.target.value)}
                      className="w-full px-3 py-2 bg-amber-50/60 border border-amber-300 rounded-xl text-xs text-stone-900"
                    />
                  </div>

                  {/* Upload Banner / Photo */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                      Foto o Banner de tu Negocio
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        <Upload className="w-4 h-4 text-amber-300" />
                        <span>{isUploadingImage ? 'Subiendo...' : 'Subir Foto desde Celular/PC'}</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="O pega URL de imagen..."
                        className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 cursor-pointer"
                  >
                    ← Cambiar Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!businessName.trim() || !whatsappPhone.trim() || !headline.trim()) {
                        setFormError(
                          'Por favor completa el nombre del negocio, WhatsApp y título del anuncio.'
                        );
                        return;
                      }
                      setFormError('');
                      setStep(3);
                    }}
                    className="px-6 py-2.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <span>
                      {isFreePlan
                        ? 'Continuar a Publicación Gratis'
                        : `Continuar al Pago (${formatCurrency(selectedPlan.priceNIO, currency, storeSettings.exchangeRate)})`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* LIVE AD PREVIEW */}
              <div className="lg:col-span-5 bg-stone-100 p-4 rounded-3xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-stone-600 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Vista Previa en Vivo</span>
                  </span>
                  <span className="text-[10px] font-bold bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full">
                    {selectedPlan.name}
                  </span>
                </div>

                <div className="rounded-2xl border-2 border-amber-300 bg-white overflow-hidden shadow-md">
                  <div className="relative h-44 bg-stone-900">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-stone-950/85 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{department}</span>
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase text-violet-700">
                      {category} • {isFreePlan ? 'Comunidad Nicaragua' : 'Patrocinado'}
                    </span>
                    <h4 className="font-serif font-bold text-base text-stone-900">
                      {businessName || 'Nombre de tu Negocio'}
                    </h4>
                    <p className="text-xs font-bold text-stone-800">
                      {headline || 'Tu título promocional aparecerá aquí destacando tus productos o servicios.'}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      {description || 'Descripción breve de tu negocio para atraer clientes en toda Nicaragua.'}
                    </p>
                    {promoText && (
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900">
                        {promoText}
                      </div>
                    )}
                    <div className="pt-2">
                      <div className="w-full py-2 px-3 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{ctaText}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 3: FREE ACTIVATION OR ELECTRONIC PAYMENT */
            <form onSubmit={handleCompleteSubmission} className="max-w-2xl mx-auto space-y-5">
              <div className="p-4 rounded-2xl bg-stone-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-amber-300 font-bold block">
                    Resumen de Publicación
                  </span>
                  <h4 className="font-serif text-lg font-bold">
                    {businessName} — {selectedPlan.name}
                  </h4>
                  <p className="text-xs text-stone-300">
                    Duración: {selectedPlan.durationDays} días activos • Ubicación: {department}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-400 block">Total</span>
                  <span className="font-serif text-2xl font-black text-emerald-400">
                    {isFreePlan ? 'GRATIS (C$ 0)' : `C$ ${selectedPlan.priceNIO.toLocaleString()}`}
                  </span>
                  {!isFreePlan && (
                    <span className="block text-[10px] text-stone-300">
                      (${selectedPlan.priceUSD} USD)
                    </span>
                  )}
                </div>
              </div>

              {isFreePlan ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-emerald-950">
                  <div className="flex items-center gap-2 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Publicación Comunitaria 100% Libre y Gratuita</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Tu negocio aparecerá inmediatamente en el Directorio de Negocios de Nicaragua con botón directo a tu WhatsApp <strong>({whatsappPhone})</strong> sin ningún cobro ni comisión.
                  </p>
                </div>
              ) : (
                <>
                  {/* Electronic Payment Method Selector */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                      Selecciona tu Método de Pago Electrónico
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeGateways.map((gw) => (
                        <button
                          key={gw.id}
                          type="button"
                          onClick={() => setPaymentMethod(gw.id)}
                          className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                            paymentMethod === gw.id
                              ? 'border-violet-600 bg-violet-50/40'
                              : 'border-stone-200 bg-white hover:border-stone-300'
                          }`}
                        >
                          <span className="text-xl">{gw.icon}</span>
                          <div>
                            <p className="text-xs font-bold text-stone-900">{gw.shortName}</p>
                            <p className="text-[10px] text-stone-500">{gw.providerName}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bank LAFISE / Gateway Details */}
                  {paymentMethod === 'transferencia_lafise' && (
                    <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase text-sky-900 block">
                            Cuenta Bancaria Oficial de la Plataforma
                          </span>
                          <p className="font-mono text-base font-black text-sky-950">
                            LAFISE 134082049
                          </p>
                          <p className="text-xs text-sky-900">
                            Billetera Móvil: <strong className="font-mono">+505 58898311</strong>
                          </p>
                          <p className="text-xs text-stone-500">
                            Beneficiario: <strong>Dueño de la App / Administración</strong>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyAccount}
                          className="px-3 py-2 bg-white hover:bg-sky-100 text-sky-900 border border-sky-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedBank ? 'Copiada' : 'Copiar Cuenta'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                      Número de Comprobante o Referencia de Pago (Opcional)
                    </label>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="Ej: Ref LAFISE #849201 o últimos 4 dígitos"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 cursor-pointer"
                >
                  ← Volver a Editar
                </button>

                <button
                  type="submit"
                  className="flex-1 py-3 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isFreePlan ? 'Publicar mi Negocio Gratis Ahora' : 'Publicar Anuncio en la Plataforma'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
