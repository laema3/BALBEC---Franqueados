import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
    this.handleReset = this.handleReset.bind(this);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[BALBEC ErrorBoundary] Erro capturado:', error, errorInfo);
  }

  public handleReset() {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50/50 border border-red-200 rounded-3xl text-slate-800 max-w-2xl mx-auto my-8 shadow-sm">
          <div className="flex items-center gap-3 text-red-600 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {this.props.fallbackTitle || 'Ocorreu um imprevisto nesta seção'}
              </h3>
              <p className="text-xs text-slate-500">
                O painel foi protegido contra falhas em branco para não interromper sua navegação.
              </p>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-red-200 text-xs font-mono text-red-700 overflow-x-auto my-4 max-h-36">
            {this.state.error?.message || 'Erro desconhecido na renderização.'}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tentar Novamente</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition border border-slate-300 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Recarregar Página</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
