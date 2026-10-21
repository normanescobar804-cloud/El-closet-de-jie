import React, { useState } from 'react';
import { Download, Github, Check, Copy, ExternalLink, X, FolderArchive, Terminal, ArrowRight, Key, ShieldCheck, Sparkles, Send } from 'lucide-react';

interface GitHubExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubExportModal: React.FC<GitHubExportModalProps> = ({ isOpen, onClose }) => {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [repoUrl, setRepoUrl] = useState<string>('https://github.com/normanescobar804-cloud/El-closet-de-ji.git');
  const [personalToken, setPersonalToken] = useState<string>('');
  const [copiedTokenCommand, setCopiedTokenCommand] = useState<boolean>(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, stepIndex: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepIndex);
    setTimeout(() => setCopiedStep(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10">
              <Github className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Pasar Tienda a GitHub</span>
                <span className="text-[10px] uppercase font-bold bg-violet-500/30 text-violet-300 px-2 py-0.5 rounded-full border border-violet-400/20">
                  Exportar
                </span>
              </h3>
              <p className="text-xs text-stone-300">
                Todo tu código fuente está listo para descargar y subir a GitHub.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-stone-800">

          {/* Direct Download Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-50 via-purple-50/50 to-amber-50/40 border border-violet-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-md shrink-0 mt-0.5">
                  <FolderArchive className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <span>1. Descargar Archivo ZIP del Proyecto</span>
                    <span className="text-[11px] font-semibold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                      102 KB (Limpio y completo)
                    </span>
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    Incluye todos los componentes React, estilos Tailwind, catálogo, configuración de WhatsApp, inDrive y panel administrativo.
                  </p>
                </div>
              </div>

              <a
                href="/el-closet-de-jie.zip"
                download="el-closet-de-jie.zip"
                className="w-full sm:w-auto px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar .ZIP Ahora</span>
              </a>
            </div>
          </div>

          {/* Step by Step GitHub instructions */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-500">
              Pasos para tenerlo en GitHub en 2 minutos:
            </h4>

            <div className="grid gap-3">
              {/* Step 1 */}
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-stone-900">
                    Crea un nuevo repositorio en GitHub
                  </p>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Repositorio vinculado: <code className="bg-stone-200 px-1.5 py-0.5 rounded text-stone-800 font-mono">normanescobar804-cloud/El-closet-de-jie</code>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a
                      href="https://github.com/normanescobar804-cloud/El-closet-de-jie"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 hover:text-violet-900 underline"
                    >
                      <span>Ver repositorio en GitHub</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-stone-900">
                    Sube los archivos arrastrándolos
                  </p>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Descomprime el archivo <strong>el-closet-de-jie.zip</strong> en tu computadora. En la página de tu repositorio de GitHub haz clic en <em>"uploading an existing file"</em> y arrastra la carpeta con los archivos.
                  </p>
                </div>
              </div>

              {/* Step 3: Or using Git Terminal */}
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-stone-900 flex items-center gap-2">
                    <span>¿Prefieres terminal / comandos Git?</span>
                    <Terminal className="w-3.5 h-3.5 text-stone-500" />
                  </p>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Si tienes Git instalado en tu computadora, solo ejecuta esto en la carpeta descomprimida:
                  </p>
                  
                  <div className="mt-2 p-2.5 bg-stone-900 text-stone-200 rounded-lg font-mono text-[11px] flex items-center justify-between gap-2 overflow-x-auto">
                    <code>git remote add origin https://github.com/normanescobar804-cloud/El-closet-de-jie.git && git branch -M main && git push -u origin main</code>
                    <button
                      onClick={() => copyToClipboard('git remote add origin https://github.com/normanescobar804-cloud/El-closet-de-jie.git && git branch -M main && git push -u origin main', 3)}
                      className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors shrink-0 cursor-pointer"
                      title="Copiar comando"
                    >
                      {copiedStep === 3 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 🔑 Token-based Push Assistant Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/60 via-stone-50 to-violet-50/50 border border-amber-200/80 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <span>Subida Directa con Personal Access Token (PAT)</span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                      Recomendado
                    </span>
                  </h4>
                  <p className="text-xs text-stone-500">
                    Sube todo el código a GitHub sin necesidad de contraseñas.
                  </p>
                </div>
              </div>

              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=El-Closet-de-Jie-Deploy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-300 hover:border-stone-400 text-stone-800 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all shrink-0 cursor-pointer"
              >
                <span>Crear Token en GitHub</span>
                <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
              </a>
            </div>

            <div className="space-y-3 pt-1">
              {/* Repo input */}
              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  URL o nombre de tu repositorio GitHub:
                </label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/tu-usuario/tu-repositorio.git"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                />
              </div>

              {/* Token input */}
              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Tu Personal Access Token de GitHub (empieza con <code>ghp_</code>):
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={personalToken}
                    onChange={(e) => setPersonalToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white pr-24"
                  />
                  {personalToken && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Token ingresado
                    </span>
                  )}
                </div>
              </div>

              {/* Generated command */}
              {(() => {
                const cleanRepo = repoUrl.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
                const authUrl = personalToken.trim()
                  ? `https://${personalToken.trim()}@${cleanRepo.endsWith('.git') ? cleanRepo : cleanRepo + '.git'}`
                  : `https://TU_TOKEN@${cleanRepo.endsWith('.git') ? cleanRepo : cleanRepo + '.git'}`;
                const cmd = `git remote add origin ${authUrl} 2>/dev/null || git remote set-url origin ${authUrl}; git branch -M main && git push -u origin main --force`;

                return (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-stone-700 flex items-center gap-1">
                        <Terminal className="w-3.5 h-3.5 text-stone-500" />
                        <span>Comando generado con tu token listo:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(cmd);
                          setCopiedTokenCommand(true);
                          setTimeout(() => setCopiedTokenCommand(false), 2500);
                        }}
                        className="text-xs font-bold text-violet-700 hover:text-violet-900 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedTokenCommand ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar comando</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-2.5 bg-stone-900 text-stone-200 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre">
                      <code>{cmd}</code>
                    </div>
                  </div>
                );
              })()}

              {/* Bot Direct Option */}
              <div className="p-3 bg-violet-100/70 border border-violet-200 rounded-xl text-xs text-violet-950 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-violet-900">¿Quieres que lo suba yo mismo automáticamente?</strong>
                  <p className="mt-0.5 text-violet-800 text-[11px] leading-relaxed">
                    Pega tu token aquí mismo en este chat (ejemplo: <code>ghp_tuToken...</code>) y yo ejecutaré el comando <code>git push</code> inmediatamente por ti desde el servidor. ¡No tendrás que abrir ninguna terminal!
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <span className="text-[11px] text-stone-500">
            Archivos listos para producción y despliegue (Vite + React + Tailwind)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
