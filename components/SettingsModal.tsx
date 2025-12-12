
import React, { useState } from 'react';
import type { AppSettings, DatabaseDump } from '../types';
import { getSettings, updateSettings, getDatabaseDump, restoreDatabaseDump, resetDatabase } from '../data/mockDatabase';
import { XMarkIcon, CheckCircleIcon, CloudArrowUpIcon, ArrowPathIcon } from './Icons';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [settings, setSettings] = useState<AppSettings>(getSettings());
    const [activeTab, setActiveTab] = useState<'general' | 'data'>('general');

    const handleSave = () => {
        updateSettings(settings);
        onClose();
        // Force reload to apply changes globally
        window.location.reload();
    };

    const handleExportDB = () => {
        const dump = getDatabaseDump();
        const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `rts_backup_${new Date().toISOString().split('T')[0]}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    const handleImportDB = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const jsonStr = event.target?.result as string;
                if (!jsonStr) throw new Error("Archivo vacío");
                
                const json = JSON.parse(jsonStr);
                
                if (json && typeof json === 'object') {
                    if(confirm("Esto sobrescribirá todos los datos actuales. El sistema convertirá automáticamente IDs antiguos a UUIDs si es necesario. ¿Continuar?")) {
                        restoreDatabaseDump(json as DatabaseDump);
                        alert('Base de datos restaurada correctamente. La aplicación se reiniciará ahora.');
                        window.location.reload();
                    }
                } else { 
                    alert('El archivo JSON no tiene un formato válido.'); 
                }
            } catch (error: any) { 
                console.error(error);
                alert(`Error crítico al importar: ${error.message || 'Formato inválido'}`); 
            }
        };
        reader.onerror = () => {
            alert('Error de lectura del archivo.');
        }
        reader.readAsText(file);
        // Clear value to allow re-selecting the same file if it failed previously
        e.target.value = '';
    };

    const handleReset = () => {
        if(confirm("¿Estás seguro de que quieres borrar todos los datos y reiniciar la aplicación? Esta acción no se puede deshacer.")) {
            resetDatabase();
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-gray-800 border border-gray-600 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Configuración del Sistema</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                </header>

                <div className="flex border-b border-gray-700">
                    <button 
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'general' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        General & Servidor
                    </button>
                    <button 
                        onClick={() => setActiveTab('data')}
                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'data' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        Gestión de Datos
                    </button>
                </div>

                <main className="p-6 space-y-6">
                    {activeTab === 'general' && (
                        <div className="space-y-4 animate-in fade-in">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre de la Organización</label>
                                <input 
                                    type="text" 
                                    value={settings.organizationName}
                                    onChange={e => setSettings({...settings, organizationName: e.target.value})}
                                    className="w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white"
                                />
                                <p className="text-xs text-gray-500 mt-1">Este nombre aparecerá en los encabezados de los informes.</p>
                            </div>
                            
                            <div className="pt-4 border-t border-gray-700">
                                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                                    <CloudArrowUpIcon className="h-5 w-5 text-sky-400"/> URL del Servidor de Archivos
                                </label>
                                <input 
                                    type="url" 
                                    value={settings.serverUrl}
                                    onChange={e => setSettings({...settings, serverUrl: e.target.value})}
                                    placeholder="https://mi-bucket-s3.amazonaws.com/uploads"
                                    className="w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white font-mono text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Base URL para la generación de enlaces de subida de archivos (Job Cards, Manuales, etc.).
                                    <br/>
                                    <span className="text-yellow-500">Nota:</span> En este prototipo, las subidas generan enlaces simulados usando esta base.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                <h3 className="text-sm font-bold text-white mb-2">Copia de Seguridad</h3>
                                <p className="text-xs text-gray-400 mb-4">Descarga o restaura una copia completa de la base de datos (JSON).</p>
                                <div className="flex gap-4">
                                    <button onClick={handleExportDB} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded text-sm font-medium transition-colors">
                                        Exportar Datos
                                    </button>
                                    <label className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-2 px-4 rounded text-sm font-medium cursor-pointer text-center transition-colors shadow-lg hover:shadow-sky-900/20">
                                        Importar Datos
                                        <input type="file" accept=".json" onChange={handleImportDB} className="hidden" />
                                    </label>
                                </div>
                            </div>

                            <div className="bg-red-900/20 p-4 rounded-lg border border-red-900/50">
                                <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                                    <ArrowPathIcon className="h-4 w-4"/> Zona de Peligro
                                </h3>
                                <p className="text-xs text-gray-400 mb-4">Elimina todos los datos actuales y restaura el estado inicial de la aplicación.</p>
                                <button onClick={handleReset} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors shadow-lg">
                                    Resetear a Valores de Fábrica
                                </button>
                            </div>
                        </div>
                    )}
                </main>
                
                <footer className="flex justify-end p-4 border-t border-gray-700">
                    <button onClick={handleSave} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5"/> Guardar Configuración
                    </button>
                </footer>
            </div>
        </div>
    );
};
