import React from 'react';
import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare props: Props;
  declare state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in El Closet de Jie:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      window.location.reload();
    } catch {
      window.location.href = './';
    }
  };

  private handleClearAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch {
      window.location.href = './';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4 text-stone-800">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-200 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>

            <div className="space-y-2">
              <h1 className="font-serif text-2xl font-black text-stone-900">
                El Clóset de Jié
              </h1>
              <p className="text-xs text-stone-600 leading-relaxed">
                Hubo una pequeña interrupción al cargar los datos en el navegador. Haz clic abajo para recargar la tienda.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar Tienda</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearAndReload}
                className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-stone-500" />
                <span>Restablecer memoria local</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
