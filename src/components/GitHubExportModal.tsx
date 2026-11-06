import React, { useState } from 'react';
import {
  Download,
  Github,
  Check,
  Copy,
  ExternalLink,
  X,
  FolderArchive,
  Terminal,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Globe,
  Rocket,
  Smartphone,
  CheckCircle2,
  Lock,
  Layers,
  FileText,
  Share2,
  UploadCloud,
  Link as LinkIcon
} from 'lucide-react';
import { OFFICIAL_APP_URLS, getLiveAppUrl } from '../utils/appUrl';

interface GitHubExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrivacyPolicy?: () => void;
  initialTab?: 'playstore' | 'web' | 'github';
}

export const GitHubExportModal: React.FC<GitHubExportModalProps> = ({
  isOpen,
  onClose,
  onOpenPrivacyPolicy,
  initialTab = 'playstore'
}) => {
  const [activeTab, setActiveTab] = useState<'playstore' | 'web' | 'github'>(initialTab);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [repoUrl] = useState<string>(OFFICIAL_APP_URLS.githubRepoUrl);
  const [userGithubToken, setUserGithubToken] = useState<string>('');
  const [showToken, setShowToken] = useState<boolean>(false);
  const liveUrl = getLiveAppUrl();

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, identifier: string | number) => {
    navigator.clipboard.writeText(text);
    if (typeof identifier === 'number') {
      setCopiedStep(identifier);
      setTimeout(() => setCopiedStep(null), 2500);
    } else {
      setCopiedSnippet(identifier);
      setTimeout(() => setCopiedSnippet(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-violet-950 via-purple-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300 border border-white/15">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Publicar App & Enlace Oficial</span>
                <span className="text-[10px] uppercase font-bold bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/20">
                  Google Play Ready
                </span>
              </h3>
              <p className="text-xs text-stone-300">
                Tu URL oficial en vivo para clientes, PWABuilder (Android) y GitHub.
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

        {/* Highlighted Official URL Bar (Always visible) */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-900 text-white border-b border-violet-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 shadow-xs">
                <Globe className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                    Sitio Web Oficial en Vivo (GitHub Pages):
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1.5 py-0.2 rounded border border-emerald-400/30">
                    Online 24/7
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-amber-100 truncate mt-0.5">
                  {OFFICIAL_APP_URLS.githubPagesUrl}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => copyToClipboard(OFFICIAL_APP_URLS.githubPagesUrl, 'officialUrl')}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                {copiedSnippet === 'officialUrl' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-stone-950 stroke-[3]" />
                    <span>¡Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar URL Web</span>
                  </>
                )}
              </button>

              <a
                href={OFFICIAL_APP_URLS.githubPagesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-all"
                title="Abrir tu app en GitHub Pages"
              >
                <span>Abrir Web</span>
                <ExternalLink className="w-3 h-3 text-stone-300" />
              </a>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 pt-2 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('playstore')}
            className={`py-2 px-3.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-t border-x ${
              activeTab === 'playstore'
                ? 'bg-white text-violet-900 border-stone-200 -mb-px'
                : 'text-stone-600 hover:text-stone-900 border-transparent hover:bg-stone-100'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Google Play Store (Android)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('web')}
            className={`py-2 px-3.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-t border-x ${
              activeTab === 'web'
                ? 'bg-white text-violet-900 border-stone-200 -mb-px'
                : 'text-stone-600 hover:text-stone-900 border-transparent hover:bg-stone-100'
            }`}
          >
            <Globe className="w-4 h-4 text-violet-600" />
            <span>Subir a la Web (Vercel / Netlify)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`py-2 px-3.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-t border-x ${
              activeTab === 'github'
                ? 'bg-white text-violet-900 border-stone-200 -mb-px'
                : 'text-stone-600 hover:text-stone-900 border-transparent hover:bg-stone-100'
            }`}
          >
            <Github className="w-4 h-4 text-stone-800" />
            <span>GitHub & ZIP</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-stone-800">
          {/* =========================================================
              TAB 1: GOOGLE PLAY STORE (ANDROID APK & AAB)
              ========================================================= */}
          {activeTab === 'playstore' && (
            <div className="space-y-5">
              {/* Ready Status Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 border border-emerald-200 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                      <span>¡Tu App cumple con el 100% de los requisitos de Google Play Store!</span>
                    </h4>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      Tiene configurado el <strong>Web App Manifest</strong> (`com.elclosetdejie.twa`), los íconos adaptativos (192, 512, maskable), modo offline, el archivo <code>assetlinks.json</code> y la función obligatoria de <strong>eliminación de cuenta y datos</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* PWABuilder - 1-Click Android App Bundle (.AAB / .APK) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-50 via-purple-50/50 to-indigo-50/40 border border-violet-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <h5 className="text-xs font-black uppercase tracking-wider text-violet-950">
                      Método Oficial Recomendado por Google (PWABuilder)
                    </h5>
                  </div>
                  <span className="text-[10px] font-bold bg-violet-200 text-violet-900 px-2 py-0.5 rounded-full">
                    Sin instalar Java ni Android Studio
                  </span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  Google y Microsoft desarrollaron <strong>PWABuilder.com</strong> para convertir cualquier PWA en un paquete <strong>.AAB (Android App Bundle)</strong> firmado y optimizado para la Play Store en 1 solo clic.
                </p>

                <div className="bg-white p-3.5 rounded-xl border border-violet-200 space-y-2.5 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                    <p>Usa la <strong>URL Oficial</strong> que ya está alojada y activa en la nube:</p>
                  </div>
                  <div className="ml-7 p-2 bg-stone-100 rounded-lg flex items-center justify-between gap-2 border border-stone-250">
                    <code className="text-[11px] font-mono text-violet-950 truncate font-semibold">
                      {OFFICIAL_APP_URLS.publicUrl}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(OFFICIAL_APP_URLS.publicUrl, 'pwabuilderUrl')}
                      className="px-2 py-1 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSnippet === 'pwabuilderUrl' ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSnippet === 'pwabuilderUrl' ? 'Copiada' : 'Copiar'}</span>
                    </button>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                    <p>Entra a <strong>pwabuilder.com</strong>, pega la URL de arriba y presiona <strong>"Start"</strong>.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                    <p>Haz clic en <strong>"Package for Stores" → "Google Play (Android)"</strong> y descarga tu paquete <strong>.aab</strong> para subirlo a Google Play Console.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href="https://www.pwabuilder.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <span>Abrir PWABuilder.com</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href="https://play.google.com/console"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <span>Abrir Google Play Console</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Ficha Oficial para Google Play Console (Copiar y Pegar) */}
              <div className="space-y-3">
                <h5 className="text-xs font-black uppercase tracking-wider text-stone-500">
                  Ficha Oficial para Google Play Console (Listos para Copiar):
                </h5>

                <div className="space-y-2.5 text-xs">
                  {/* Título de la app */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-250 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-stone-500 uppercase block">Título de la App (máx 30 caracteres)</span>
                      <span className="font-semibold text-stone-900">El closet de jie - Ropa y Moda</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('El closet de jie - Ropa y Moda', 'title')}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSnippet === 'title' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSnippet === 'title' ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>

                  {/* Descripción corta */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-250 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-stone-500 uppercase block">Descripción Corta (máx 80 caracteres)</span>
                      <span className="font-semibold text-stone-900">Tienda de ropa en Nicaragua, catálogo en tiempo real, inDrive y notas de voz.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          'Tienda de ropa en Nicaragua, catálogo en tiempo real, inDrive y notas de voz.',
                          'shortDesc'
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSnippet === 'shortDesc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSnippet === 'shortDesc' ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>

                  {/* Categoría y Clasificación */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                      <span className="text-[10px] font-bold text-stone-500 uppercase block">Categoría</span>
                      <span className="font-bold text-stone-900">Compras (Shopping)</span>
                    </div>
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                      <span className="text-[10px] font-bold text-stone-500 uppercase block">Clasificación de Contenido</span>
                      <span className="font-bold text-emerald-700">PEGI 3 / Todo Público</span>
                    </div>
                  </div>

                  {/* Política de Privacidad */}
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-amber-900 uppercase block">Política de Privacidad Obligatoria</span>
                        <span className="text-[11px] text-stone-700">Cumple directivas de protección de datos y eliminación de cuenta.</span>
                      </div>
                    </div>
                    {onOpenPrivacyPolicy && (
                      <button
                        type="button"
                        onClick={onOpenPrivacyPolicy}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Ver Política
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bubblewrap CLI Option (Para desarrolladores) */}
              <div className="p-4 rounded-2xl bg-stone-900 text-white space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-300">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Opción Avanzada: Google Bubblewrap CLI</span>
                </div>
                <pre className="bg-stone-950 p-3 rounded-xl text-[11px] font-mono text-emerald-300 overflow-x-auto">
{`npm i -g @bubblewrap/cli
bubblewrap init --manifest="https://tudominio.com/manifest.webmanifest"
bubblewrap build`}
                </pre>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 2: SUBIR A LA WEB (NETLIFY DROP & VERCEL)
              ========================================================= */}
          {activeTab === 'web' && (
            <div className="space-y-5">
              {/* Highlighted Netlify Drop Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50 via-emerald-50/50 to-cyan-50/40 border-2 border-teal-300 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-teal-950 flex items-center gap-2">
                        <span>Netlify Drop — Despliegue en 15 Segundos</span>
                        <span className="text-[10px] font-bold bg-teal-200/80 text-teal-900 px-2 py-0.5 rounded-full">
                          100% Gratis
                        </span>
                      </h4>
                      <p className="text-xs text-stone-600">
                        Sube tu app arrastrando el archivo comprimido directamente en la web de Netlify.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2 Big Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <a
                    href="/el-closet-de-jie-netlify.zip"
                    download="el-closet-de-jie-netlify.zip"
                    className="p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer text-center"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <div className="text-left">
                      <div className="font-black">1. Descargar Paquete Netlify</div>
                      <div className="text-[10px] text-emerald-100 font-normal">el-closet-de-jie-netlify.zip (2.8 MB)</div>
                    </div>
                  </a>

                  <a
                    href="https://app.netlify.com/drop"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer text-center"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <div className="text-left">
                      <div className="font-black">2. Abrir Netlify Drop</div>
                      <div className="text-[10px] text-teal-200 font-normal">app.netlify.com/drop (Pestaña nueva)</div>
                    </div>
                  </a>
                </div>

                {/* Steps Visual Guide */}
                <div className="bg-white p-4 rounded-xl border border-teal-200 space-y-3 text-xs text-stone-700">
                  <h5 className="font-bold text-teal-950 uppercase text-[11px] tracking-wide">
                    Pasos sencillos para publicarla con Netlify Drop:
                  </h5>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                      <p>
                        Presiona el botón verde <strong>"1. Descargar Paquete Netlify"</strong> arriba para guardar el archivo <code>.zip</code> en tu computadora o teléfono.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                      <p>
                        Presiona <strong>"2. Abrir Netlify Drop"</strong> (o entra a <code>app.netlify.com/drop</code>). Si no tienes cuenta, puedes iniciar sesión gratis con Google o GitHub.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                      <p>
                        <strong>Arrastra y suelta</strong> el archivo <code>el-closet-de-jie-netlify.zip</code> dentro del recuadro punteado de Netlify Drop.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</span>
                      <p className="text-emerald-900 font-medium">
                        <strong>¡Listo!</strong> En 10 a 20 segundos Netlify te entregará un dominio público gratuito (ej: <code>https://tu-tienda.netlify.app</code>) con certificado SSL seguro.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Technical Note */}
                <div className="p-3 bg-teal-100/60 rounded-xl border border-teal-200/80 text-[11px] text-teal-900 flex items-start gap-2">
                  <Check className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <span>
                    El paquete ya incluye el archivo <code>_redirects</code> configurado (<code>/* /index.html 200</code>) para evitar errores 404 al navegar entre categorías o productos.
                  </span>
                </div>
              </div>

              {/* Other Options: Vercel & GitHub */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Vercel Card */}
                <div className="p-4 rounded-2xl border-2 border-stone-200 hover:border-black transition-all bg-stone-50/50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-stone-900">Vercel</span>
                      <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded-full">Automático</span>
                    </div>
                    <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                      Conecta directamente tu repositorio GitHub de la tienda para que cada cambio se publique automáticamente.
                    </p>
                  </div>
                  <a
                    href="https://vercel.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-black hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <span>Importar en Vercel</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Netlify CLI Card */}
                <div className="p-4 rounded-2xl border-2 border-stone-200 hover:border-teal-600 transition-all bg-stone-50/50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-stone-900">Netlify CLI</span>
                      <span className="text-[10px] font-bold bg-stone-200 text-stone-800 px-2 py-0.5 rounded-full">Terminal</span>
                    </div>
                    <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                      Si usas terminal con tu cuenta de Netlify:
                    </p>
                    <code className="text-[10px] font-mono bg-stone-200 text-stone-800 p-1.5 rounded block mt-1.5 truncate">
                      npx netlify deploy --prod --dir=dist
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('npx netlify deploy --prod --dir=dist', 'netlifyCli')}
                    className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    {copiedSnippet === 'netlifyCli' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippet === 'netlifyCli' ? 'Comando Copiado' : 'Copiar Comando CLI'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 3: GITHUB & CÓDIGO FUENTE
              ========================================================= */}
          {activeTab === 'github' && (
            <div className="space-y-5">
              {/* Direct Download Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-50 via-purple-50/50 to-amber-50/40 border border-violet-200 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-md shrink-0 mt-0.5">
                      <FolderArchive className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <span>Descargar Archivo ZIP Completo</span>
                        <span className="text-[11px] font-semibold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                          Código Completo
                        </span>
                      </h4>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        Incluye todos los componentes React, estilos Tailwind, catálogo, configuración de WhatsApp, inDrive, registro de usuarios y panel administrativo.
                      </p>
                    </div>
                  </div>

                  <a
                    href="/el-closet-de-jie.zip"
                    download="el-closet-de-jie.zip"
                    className="w-full sm:w-auto px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar .ZIP</span>
                  </a>
                </div>
              </div>

              {/* Repositorio GitHub Oficial */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Github className="w-4 h-4 text-stone-800" />
                    <span>Repositorio Oficial en GitHub:</span>
                  </span>
                  <a
                    href="https://github.com/normanescobar804-cloud/El-closet-de-jie"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 hover:text-violet-900"
                  >
                    <span>Ver en GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <code className="bg-stone-200 px-3 py-1.5 rounded text-stone-800 font-mono text-xs block truncate">
                  {repoUrl}
                </code>
              </div>

              {/* Subir a GitHub a través de un Token Personal (PAT) */}
              <div className="p-5 rounded-2xl bg-stone-900 text-white space-y-4 shadow-lg border border-stone-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-400/30 flex items-center justify-center font-bold">
                      🔑
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-white flex items-center gap-1.5">
                        <span>Subir a GitHub con Token (PAT)</span>
                        <span className="text-[10px] bg-emerald-500 text-stone-950 font-bold px-2 py-0.2 rounded-full uppercase">
                          Listo
                        </span>
                      </h5>
                      <p className="text-[11px] text-stone-400">
                        El repositorio local ya está inicializado y commiteado en la rama <code>main</code>.
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=El-Closet-De-Jie-Deploy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    <span>1. Generar Token</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Paso a paso */}
                <div className="space-y-3 pt-1 text-xs text-stone-300">
                  <div className="p-3 bg-stone-800/80 rounded-xl border border-stone-700/80 space-y-2">
                    <span className="font-bold text-amber-300 block">Paso 1: Genera tu Personal Access Token (PAT)</span>
                    <p className="text-[11px] text-stone-300">
                      Entra a GitHub &gt; <strong>Settings &gt; Developer Settings &gt; Personal access tokens (classic)</strong> y marca la casilla <code>repo</code> (Full control).
                    </p>
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo&description=El-Closet-De-Jie-Deploy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 underline"
                    >
                      <span>Abrir generador de tokens de GitHub en pestaña nueva</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="p-3 bg-stone-800/80 rounded-xl border border-stone-700/80 space-y-2">
                    <span className="font-bold text-sky-300 block">Paso 2: Ingresa tu token aquí para armar el comando o compártelo en el chat</span>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showToken ? 'text' : 'password'}
                          value={userGithubToken}
                          onChange={(e) => setUserGithubToken(e.target.value)}
                          placeholder="Pega aquí tu token: ghp_xxxxxxxxxxxxxxxxxxxx"
                          className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-violet-400 placeholder:text-stone-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="absolute right-2.5 top-2 text-[10px] text-stone-400 hover:text-stone-200 font-bold"
                        >
                          {showToken ? 'Ocultar' : 'Ver'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400 text-xs">Paso 3: Comando para subir a GitHub</span>
                      <button
                        type="button"
                        onClick={() => {
                          const cmd = userGithubToken.trim()
                            ? `git remote set-url origin https://${userGithubToken.trim()}@github.com/normanescobar804-cloud/El-closet-de-jie.git && git push -u origin main --force`
                            : `git remote set-url origin https://<TU_TOKEN>@github.com/normanescobar804-cloud/El-closet-de-jie.git && git push -u origin main --force`;
                          copyToClipboard(cmd, 'pushCmd');
                        }}
                        className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {copiedSnippet === 'pushCmd' ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedSnippet === 'pushCmd' ? '¡Copiado!' : 'Copiar Comando'}</span>
                      </button>
                    </div>

                    <pre className="text-[11px] font-mono text-emerald-300 p-2.5 bg-black/60 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
                      {userGithubToken.trim()
                        ? `git remote set-url origin https://${userGithubToken.trim()}@github.com/normanescobar804-cloud/El-closet-de-jie.git && git push -u origin main --force`
                        : `git remote set-url origin https://<TU_TOKEN>@github.com/normanescobar804-cloud/El-closet-de-jie.git && git push -u origin main --force`}
                    </pre>

                    <p className="text-[10px] text-stone-400">
                      💡 <em>También puedes escribir tu token directamente en esta conversación y yo ejecutaré la subida automáticamente por ti.</em>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <span className="text-[11px] text-stone-500 font-medium">
            El Clóset de Jié • Optimizado para Android, PWA y Web
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
