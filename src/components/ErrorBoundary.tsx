import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { clearDraft } from '../utils/draft';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Shows a message with a way out instead of a blank page when the app fails to render.
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Erro ao exibir o formulário:', error);
  }

  private reload = () => window.location.reload();

  private clearAndReload = () => {
    clearDraft();
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans text-gray-900">
        <div role="alert" className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" aria-hidden="true" />
            <div>
              <h1 className="text-lg font-bold">Não foi possível exibir o formulário</h1>
              <p className="mt-1 text-sm text-gray-700">
                Tente recarregar a página. Se o erro continuar, apague o rascunho salvo neste navegador e comece de novo.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={this.reload}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-bold text-gray-800 hover:bg-gray-50 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-brand-200"
            >
              Recarregar
            </button>
            <button
              type="button"
              onClick={this.clearAndReload}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-brand-300"
            >
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
              Apagar rascunho e recarregar
            </button>
          </div>
        </div>
      </main>
    );
  }
}
