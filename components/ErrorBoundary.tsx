import React, { Component, ErrorInfo, ReactNode } from 'react';
import { resetDatabase } from '../data/mockDatabase';
import { ArrowPathIcon } from './Icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-white font-sans">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-lg w-full text-center border border-gray-700">
            <h1 className="text-3xl font-bold text-red-500 mb-4 flex justify-center items-center gap-3">
               <span>⚠️</span> ¡Algo salió mal!
            </h1>
            <p className="mb-6 text-gray-300">
              Se ha producido un error crítico al cargar los datos de la aplicación. Es posible que el archivo importado tenga un formato incompatible o esté corrupto.
            </p>
            
            {this.state.error && (
              <div className="bg-gray-900/50 p-4 rounded text-xs font-mono text-red-300 mb-6 text-left overflow-auto max-h-32 border border-red-900/30">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={() => resetDatabase()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Resetear Base de Datos (Restaurar Fábrica)
            </button>
            <p className="text-xs text-gray-500 mt-4">
              Esta acción borrará los datos locales y recargará la aplicación en su estado original.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}