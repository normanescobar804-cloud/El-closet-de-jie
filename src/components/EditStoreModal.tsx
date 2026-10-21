import React, { useState, useEffect } from 'react';
import {
  X,
  Store,
  Phone,
  CreditCard,
  MapPin,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Building,
  User,
  Info
} from 'lucide-react';
import { StoreSettings, UserAccount } from '../types';
import { NICARAGUA_DEPARTMENTS } from '../utils/advertising';
import { PLATFORM_OWNER_CONFIG } from '../utils/monetization';

interface EditStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSettings: StoreSettings;
  currentUser: UserAccount | null;
  onSaveSettings: (settings: StoreSettings) => void;
  onUpdateUser: (user: UserAccount) => void;
}

export const EditStoreModal: React.FC<EditStoreModalProps> = ({
  isOpen,
  onClose,
  storeSettings,
  currentUser,
  onSaveSettings,
  onUpdateUser
}) => {
  const [storeName, setStoreName] = useState(
    currentUser?.storeName || storeSettings.storeName || ''
  );
  const [tagline, setTagline] = useState(
    currentUser?.storeBio || storeSettings.tagline || ''
  );
  const [whatsappNumber, setWhatsappNumber] = useState(
    currentUser?.storeWhatsapp || storeSettings.whatsappNumber || ''
  );
  const [whatsappCustomGreeting, setWhatsappCustomGreeting] = useState(
    storeSettings.whatsappCustomGreeting || '¡Hola! 👋 Me gustaría realizar el siguiente pedido:'
  );
  const [bankName, setBankName] = useState(
    storeSettings.bankName || 'Banco LAFISE'
  );
  const [bankAccount, setBankAccount] = useState(
    currentUser?.storeBankAccount || storeSettings.bankAccount || ''
  );
  const [bankAccountHolder, setBankAccountHolder] = useState(
    currentUser?.storeBankAccountHolder || storeSettings.bankAccountHolder || ''
  );
  const [sellerWalletPhone, setSellerWalletPhone] = useState(
    storeSettings.sellerWalletPhone || ''
  );
  const [department, setDepartment] = useState(
    currentUser?.department || currentUser?.city || 'Managua'
  );
  const [address, setAddress] = useState(
    currentUser?.address || storeSettings.address || ''
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStoreName(currentUser?.storeName || storeSettings.storeName || '');
      setTagline(currentUser?.storeBio || storeSettings.tagline || '');
      setWhatsappNumber(currentUser?.storeWhatsapp || storeSettings.whatsappNumber || '');
      setBankAccount(currentUser?.storeBankAccount || storeSettings.bankAccount || '');
      setBankAccountHolder(currentUser?.storeBankAccountHolder || storeSettings.bankAccountHolder || '');
      setSellerWalletPhone(storeSettings.sellerWalletPhone || '');
      setDepartment(currentUser?.department || currentUser?.city || 'Managua');
      setAddress(currentUser?.address || storeSettings.address || '');
      setSavedSuccess(false);
      setError('');
    }
  }, [isOpen, currentUser, storeSettings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setError('Por favor ingresa el nombre de tu tienda de ropa.');
      return;
    }
    if (!whatsappNumber.trim()) {
      setError('Ingresa tu número de WhatsApp para que tus clientes te contacten y envíen sus pedidos.');
      return;
    }

    const updatedSettings: StoreSettings = {
      ...storeSettings,
      storeName: storeName.trim(),
      tagline: tagline.trim() || 'Ropa y Moda para toda la familia en Nicaragua',
      whatsappNumber: whatsappNumber.trim(),
      whatsappCustomGreeting: whatsappCustomGreeting.trim(),
      bankName: bankName.trim(),
      bankAccount: bankAccount.trim(),
      bankAccountHolder: bankAccountHolder.trim(),
      sellerWalletPhone: sellerWalletPhone.trim(),
      address: address.trim() || `${department}, Nicaragua`,
      platformFeePercent: 3,
      platformOwnerWallet: PLATFORM_OWNER_CONFIG.walletPhone,
      platformOwnerAccount: PLATFORM_OWNER_CONFIG.lafiseAccount,
      platformOwnerBank: 'LAFISE'
    };

    onSaveSettings(updatedSettings);

    // Also sync to current user account if logged in
    const updatedUser: UserAccount = {
      ...(currentUser || {
        isLoggedIn: true,
        name: bankAccountHolder.trim() || storeName.trim(),
        phone: whatsappNumber.trim(),
        createdAt: Date.now()
      }),
      storeName: storeName.trim(),
      storeWhatsapp: whatsappNumber.trim(),
      storeBankAccount: bankAccount.trim(),
      storeBankAccountHolder: bankAccountHolder.trim(),
      storeBio: tagline.trim(),
      department: department,
      city: department,
      address: address.trim(),
      role: currentUser?.role === 'admin' ? 'admin' : 'seller',
      isLoggedIn: true,
      updatedAt: Date.now()
    };
    onUpdateUser(updatedUser);

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold leading-tight flex items-center gap-2">
                <span>Editar Mi Tienda de Ropa</span>
                <span className="text-[10px] bg-emerald-500 text-stone-950 font-sans font-black px-2 py-0.5 rounded-full">
                  Plataforma Abierta
                </span>
              </h3>
              <p className="text-xs text-stone-300">
                Configura tu WhatsApp y cuentas bancarias donde recibirás los pedidos y tus ganancias (97%).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto max-h-[80vh] space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 font-semibold flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-2 animate-scale-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>¡Tienda de ropa guardada con éxito! Tus clientes te contactarán y pagarán a tus datos.</span>
            </div>
          )}

          {/* Transparent 97% / 3% Commission Notice */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-1">
            <div className="flex items-center justify-between font-bold text-xs">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Modelo de Ganancias de la Plataforma</span>
              </span>
              <span className="bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full text-[10px]">
                97% para ti / 3% para la app
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Tú como dueño de tu tienda de ropa recibes el <strong>97% de cada venta</strong> directo a tu cuenta bancaria o billetera. La plataforma cobra un <strong>3% de comisión</strong> destinado al soporte, mantenimiento y desarrollo continuo de la app.
            </p>
          </div>

          {/* Store Name & Slogan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Nombre de tu Tienda de Ropa *
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ej: Boutique Elegancia, Clóset Urbano"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Slogan / Especialidad de Ropa
              </label>
              <input
                type="text"
                placeholder="Ej: Ropa infantil, vintage, juvenil y accesorios"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* WhatsApp Direct Orders */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-300 rounded-2xl space-y-2">
            <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>📱 Tu WhatsApp para Recibir Pedidos *</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-normal">Sin números fijos ajenos</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: 88889999 o 50588889999"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-emerald-300 rounded-xl text-stone-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <p className="text-[10px] text-stone-500">
              Cuando un cliente presione «Comprar por WhatsApp», el mensaje se enviará exactamente a este número.
            </p>
          </div>

          {/* Bank Accounts Section */}
          <div className="p-4 bg-sky-50/60 border border-sky-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-700" />
                <h4 className="font-bold text-sky-950 uppercase tracking-wider text-xs">
                  Tus Datos Bancarios (Para recibir el 97% de tus ventas)
                </h4>
              </div>
              <span className="text-[10px] text-sky-700 bg-white px-2 py-0.5 rounded border border-sky-200 font-semibold">
                Tus Cuentas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-sky-950 mb-1">
                  Banco o Entidad Financiera
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-stone-900 font-medium"
                >
                  <option value="Banco LAFISE">Banco LAFISE Bancentro</option>
                  <option value="BAC Credomatic">BAC Credomatic</option>
                  <option value="Banco Banpro">Banpro Grupo Promerica</option>
                  <option value="Banco BDF">Banco BDF</option>
                  <option value="Banco Ficohsa">Banco Ficohsa</option>
                  <option value="Billetera Móvil / Kash">Billetera Móvil / Kash</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sky-950 mb-1">
                  Número de Cuenta Bancaria
                </label>
                <input
                  type="text"
                  placeholder="Ej: 100234567 o 0012345678"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-stone-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sky-950 mb-1">
                  Titular de la Cuenta Bancaria
                </label>
                <input
                  type="text"
                  placeholder="Nombre y Apellidos del titular"
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-stone-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sky-950 mb-1">
                  Billetera Móvil Adicional (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: +505 88990011"
                  value={sellerWalletPhone}
                  onChange={(e) => setSellerWalletPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-stone-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Location & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Departamento *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium"
              >
                {NICARAGUA_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Dirección Física o Punto de Entrega
              </label>
              <input
                type="text"
                placeholder="Ej: Reparto Schick, Ciudad Jardín, o Envíos Nacionales"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
              />
            </div>
          </div>

          {/* Footer CTA */}
          <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Datos de Mi Tienda de Ropa</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
