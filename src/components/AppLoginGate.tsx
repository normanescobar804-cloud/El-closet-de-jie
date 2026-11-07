import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { UserAccount } from '../types';
import { NICARAGUA_DEPARTMENTS } from '../utils/advertising';
import { registerCustomerAccount, loginCustomerAccount } from '../utils/storage';

interface AppLoginGateProps {
  onLoginSuccess: (user: UserAccount) => void;
  onGoogleLogin?: () => Promise<void>;
  onExploreAsGuest?: () => void;
}

export const AppLoginGate: React.FC<AppLoginGateProps> = ({
  onLoginSuccess,
  onGoogleLogin,
  onExploreAsGuest
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Managua');
  const [city, setCity] = useState('Managua');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setErrorMessage('Por favor ingresa tu correo electrónico o número de WhatsApp.');
      return;
    }
    if (!cleanPass) {
      setErrorMessage('Por favor ingresa tu contraseña de acceso.');
      return;
    }
    if (cleanPass.length < 4) {
      setErrorMessage('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      const res = loginCustomerAccount(cleanId, cleanPass);
      if (res.success && res.user) {
        setSuccessMessage(`¡Bienvenido(a), ${res.user.name}!`);
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 500);
      } else {
        setErrorMessage(res.message || 'Credenciales incorrectas. Verifica tu correo y contraseña.');
      }
    } catch (err: any) {
      setErrorMessage('Ocurrió un error al verificar tu cuenta. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanPass = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanName) {
      setErrorMessage('Por favor escribe tu nombre completo.');
      return;
    }

    if (!cleanEmail && !cleanPhone) {
      setErrorMessage('Por favor ingresa tu correo o número de WhatsApp.');
      return;
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Por favor introduce un correo electrónico válido (ej: usuario@gmail.com).');
      return;
    }

    if (!cleanPass || cleanPass.length < 6) {
      setErrorMessage('La contraseña debe tener un mínimo de 6 caracteres para mayor seguridad.');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setErrorMessage('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setIsLoading(true);
    try {
      const res = registerCustomerAccount(
        {
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone || '50558898311',
          phoneOrEmail: cleanEmail || cleanPhone,
          city: city.trim() || 'Managua',
          department: department.trim() || 'Managua',
          address: '',
          preferredPaymentMethod: 'transferencia_lafise',
          role: 'customer'
        },
        cleanPass
      );

      if (res.success && res.user) {
        setSuccessMessage(`¡Cuenta creada con éxito! Bienvenido(a), ${res.user.name}.`);
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 600);
      } else {
        setErrorMessage(res.message || 'No se pudo crear la cuenta.');
      }
    } catch (err: any) {
      setErrorMessage('Error al registrar la cuenta. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    if (!onGoogleLogin) return;
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      await onGoogleLogin();
    } catch (err: any) {
      if (!err?.message?.includes('popup-closed-by-user')) {
        setErrorMessage('No se pudo iniciar sesión con Google.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-gradient-to-br from-stone-950 via-purple-950 to-indigo-950 overflow-y-auto">
      {/* Background Glow Orbs */}
      <div className="fixed top-1/4 left-1/4 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md my-auto relative z-10">
        {/* Top Brand Identity Card */}
        <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-stone-800 overflow-hidden">
          {/* Brand Header Banner */}
          <div className="bg-gradient-to-r from-violet-900 via-purple-900 to-pink-900 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl" />
            
            <div className="relative flex flex-col items-center">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-amber-300/80 shadow-lg bg-gradient-to-br from-violet-800 to-pink-600 mb-3">
                <img
                  src="/icon.svg"
                  alt="El Clóset de Jié V2"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 right-0 bg-amber-400 text-stone-950 font-black text-[9px] px-1 rounded-tl-md">
                  V2
                </span>
              </div>

              <h2 className="font-serif text-2xl font-black tracking-tight text-white">
                EL CLÓSET DE JIÉ
              </h2>
              <p className="text-xs font-semibold text-pink-200 mt-0.5">
                Boutique & Peluches · Nicaragua
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-bold text-amber-200 mt-2.5 border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Acceso Seguro con Correo y Contraseña</span>
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-stone-100 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 text-xs font-bold">
            <button
              type="button"
              id="tab-btn-login-gate"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`py-2.5 rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-stone-900 text-violet-900 dark:text-violet-300 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </button>
            <button
              type="button"
              id="tab-btn-register-gate"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`py-2.5 rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-stone-900 text-violet-900 dark:text-violet-300 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Crear Cuenta</span>
            </button>
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-4">
            {/* Feedback Notifications */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{successMessage}</span>
              </div>
            )}

            {/* TAB 1: LOGIN FORM */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                    Correo Electrónico o Teléfono
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      id="input-login-identifier"
                      required
                      placeholder="ej: cliente@gmail.com o 8888-8888"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200/50"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                      Contraseña de Acceso
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="input-login-password"
                      required
                      placeholder="Tu contraseña o PIN"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-submit-login"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-700 hover:from-violet-800 hover:to-indigo-800 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>{isLoading ? 'Verificando...' : 'Iniciar Sesión Seguro'}</span>
                </button>
              </form>
            ) : (
              /* TAB 2: REGISTER FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Nombre Completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      id="input-reg-name"
                      required
                      placeholder="Ej: María José Escobar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Correo Electrónico *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="email"
                        id="input-reg-email"
                        required
                        placeholder="tu@correo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      WhatsApp / Celular *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="tel"
                        id="input-reg-phone"
                        required
                        placeholder="8888-8888"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Departamento
                    </label>
                    <select
                      id="select-reg-dept"
                      value={department}
                      onChange={(e) => {
                        setDepartment(e.target.value);
                        setCity(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-violet-500"
                    >
                      {NICARAGUA_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Ciudad / Municipio
                    </label>
                    <input
                      type="text"
                      id="input-reg-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ciudad"
                      className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Contraseña *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="input-reg-password"
                        required
                        placeholder="Mín. 6 letras o números"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-violet-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Confirmar Contraseña *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="input-reg-confirm"
                        required
                        placeholder="Repite la contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-violet-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-submit-register"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 hover:from-emerald-700 hover:to-indigo-800 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isLoading ? 'Registrando...' : 'Crear Cuenta y Entrar'}</span>
                </button>
              </form>
            )}

            {/* Google Fast Sign-In */}
            {onGoogleLogin && (
              <div className="space-y-3 pt-2">
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-stone-200 dark:border-stone-700 w-full" />
                  <span className="bg-white dark:bg-stone-900 px-3 text-[11px] font-bold text-stone-400 uppercase tracking-wider absolute">
                    O también
                  </span>
                </div>

                <button
                  type="button"
                  id="btn-google-login-gate"
                  onClick={handleGoogleClick}
                  disabled={isGoogleLoading}
                  className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 rounded-xl text-xs font-bold border border-stone-300 dark:border-stone-600 transition-all shadow-2xs flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isGoogleLoading ? 'Conectando con Google...' : 'Continuar con Google'}</span>
                </button>
              </div>
            )}

            {/* Optional Guest Explorer */}
            {onExploreAsGuest && (
              <div className="pt-2 text-center border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  id="btn-guest-explore-gate"
                  onClick={onExploreAsGuest}
                  className="text-xs text-stone-500 hover:text-violet-600 dark:hover:text-violet-400 font-semibold cursor-pointer py-1"
                >
                  Explorar catálogo como invitado →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security Trust Badges */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-violet-200/80">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Encriptación de Sesión</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-amber-300" />
            <span>Firebase Auth Seguro</span>
          </span>
        </div>
      </div>
    </div>
  );
};
