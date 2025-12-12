
import React, { useState, useEffect } from 'react';
import type { Aircraft, ComponentAsset } from '../types';
import { mockFactorDefinitions } from '../data/mockDatabase';
import { XMarkIcon, ArrowPathIcon, CalendarDaysIcon, CubeIcon } from './Icons';

interface ComponentMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (date: string, counters: Record<string, number>, condition?: 'Serviceable' | 'Unserviceable' | 'Scrapped') => void;
    action: 'Install' | 'Remove';
    asset: ComponentAsset;
    targetAircraft?: Aircraft; // The aircraft involved (Target for install, Source for remove)
}

export const ComponentMovementModal: React.FC<ComponentMovementModalProps> = ({ 
    isOpen, onClose, onConfirm, action, asset, targetAircraft 
}) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [counters, setCounters] = useState<Record<string, number>>({});
    const [condition, setCondition] = useState<'Serviceable' | 'Unserviceable' | 'Scrapped'>('Serviceable');

    useEffect(() => {
        if (isOpen && targetAircraft) {
            // Initialize counters with current Aircraft values (if available) or 0
            setCounters(targetAircraft.counters || {});
        }
    }, [isOpen, targetAircraft]);

    const handleCounterChange = (factorId: string, value: string) => {
        const numVal = parseFloat(value);
        setCounters(prev => ({
            ...prev,
            [factorId]: isNaN(numVal) ? 0 : numVal
        }));
    };

    const handleConfirm = () => {
        onConfirm(date, counters, action === 'Remove' ? condition : undefined);
        onClose();
    };

    if (!isOpen) return null;

    const title = action === 'Install' ? 'Instalar Componente' : 'Desmontar Componente';
    const activeFactors = Object.keys(targetAircraft?.counters || {}).length > 0 
        ? Object.keys(targetAircraft!.counters) 
        : ['FH', 'CYC']; // Default fallback if no counters on AC yet

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <div className="bg-gray-800 border-2 border-sky-700/50 rounded-xl shadow-2xl w-full max-w-md flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <ArrowPathIcon className="h-5 w-5 text-sky-400" />
                        {title}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                </header>

                <main className="p-6 space-y-6">
                    {/* Summary */}
                    <div className="bg-gray-700/30 p-3 rounded border border-gray-600">
                        <div className="flex justify-between text-sm text-gray-300 mb-1">
                            <span>Componente:</span>
                            <span className="font-mono text-white">{asset.serialNumber}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-300">
                            <span>Aeronave:</span>
                            <span className="font-bold text-sky-400">{targetAircraft?.registration}</span>
                        </div>
                    </div>

                    {/* Date Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                            <CalendarDaysIcon className="h-4 w-4"/> Fecha del Evento
                        </label>
                        <input 
                            type="date" 
                            value={date} 
                            onChange={e => setDate(e.target.value)} 
                            className="w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white"
                        />
                    </div>

                    {/* Counters Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Contadores de la Aeronave (Al momento del evento)
                        </label>
                        <div className="space-y-3 bg-gray-900/30 p-4 rounded-lg border border-gray-700">
                            {activeFactors.map(factorId => {
                                const def = mockFactorDefinitions.find(f => f.id === factorId);
                                return (
                                    <div key={factorId} className="flex justify-between items-center">
                                        <label className="text-sm text-gray-400 w-1/2">{def?.name || factorId}</label>
                                        <input 
                                            type="number" 
                                            step={def?.valueType === 'float' ? "0.1" : "1"}
                                            value={counters[factorId] || 0}
                                            onChange={e => handleCounterChange(factorId, e.target.value)}
                                            className="w-24 rounded bg-gray-800 border-gray-600 text-white text-right focus:border-sky-500"
                                        />
                                    </div>
                                )
                            })}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {action === 'Install' 
                                ? "Estos valores se usarán como base (Snapshot) para calcular la vida futura."
                                : "Estos valores se usarán para calcular la vida consumida desde la instalación."}
                        </p>
                    </div>

                    {/* Condition (Only on Removal) */}
                    {action === 'Remove' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                                <CubeIcon className="h-4 w-4"/> Estado al Desmontar
                            </label>
                            <select 
                                value={condition} 
                                onChange={e => setCondition(e.target.value as any)} 
                                className="w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 text-white"
                            >
                                <option value="Serviceable">Serviceable (Listo para Stock/Otro Avión)</option>
                                <option value="Unserviceable">Unserviceable (A Reparación)</option>
                                <option value="Scrapped">Scrapped (Chatarra)</option>
                            </select>
                        </div>
                    )}
                </main>

                <footer className="flex justify-end p-4 border-t border-gray-700">
                    <button onClick={onClose} className="mr-3 px-4 py-2 text-gray-300 hover:text-white transition-colors">Cancelar</button>
                    <button onClick={handleConfirm} className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-colors">
                        Confirmar Movimiento
                    </button>
                </footer>
            </div>
        </div>
    );
};
