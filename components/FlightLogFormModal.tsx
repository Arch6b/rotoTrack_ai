
import React, { useState, useEffect, useMemo } from 'react';
import type { FlightLog, Aircraft, Fleet, FactorDefinition } from '../types';
import { mockAircrafts, mockFleets, mockFactorDefinitions } from '../data/mockDatabase';
import { XMarkIcon, CheckCircleIcon, PaperAirplaneIcon, ClockIcon, AdjustmentsHorizontalIcon } from './Icons';

interface FlightLogFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (log: FlightLog) => void;
    initialData: FlightLog | null;
    mode: 'add' | 'edit';
}

const emptyLog: FlightLog = {
    id: '',
    aircraftRegistration: '',
    date: new Date().toISOString().split('T')[0],
    flightNumber: '',
    from: '',
    to: '',
    offBlockTime: '',
    takeOffTime: '',
    landingTime: '',
    onBlockTime: '',
    blockTime: 0,
    flightTime: 0,
    landings: 1,
    pilotName: '',
    status: 'Draft',
    creationDate: '',
    notes: '',
    customReadings: {}
};

export const FlightLogFormModal: React.FC<FlightLogFormModalProps> = ({ isOpen, onClose, onSave, initialData, mode }) => {
    const [log, setLog] = useState<FlightLog>(emptyLog);
    const [errors, setErrors] = useState<Partial<Record<keyof FlightLog, string>>>({});
    
    // Dynamic Fleet Factors
    const [fleetFactors, setFleetFactors] = useState<FactorDefinition[]>([]);

    useEffect(() => {
        if (isOpen) {
            setLog(initialData || { ...emptyLog, date: new Date().toISOString().split('T')[0] });
            setErrors({});
        }
    }, [initialData, isOpen]);

    // Update fleet factors when aircraft changes
    useEffect(() => {
        if (log.aircraftRegistration) {
            const ac = mockAircrafts.find(a => a.registration === log.aircraftRegistration);
            if (ac) {
                const fleet = mockFleets.find(f => f.id === ac.fleetId);
                if (fleet) {
                    const factors = fleet.customFactors
                        .map(cf => mockFactorDefinitions.find(fd => fd.id === cf.factorId))
                        .filter((fd): fd is FactorDefinition => !!fd && fd.status === 'Active');
                    setFleetFactors(factors);
                    return;
                }
            }
        }
        setFleetFactors([]);
    }, [log.aircraftRegistration]);

    // Helper to calculate decimal hours from HH:mm
    const timeToDecimal = (time: string) => {
        if (!time) return 0;
        const [hours, minutes] = time.split(':').map(Number);
        return hours + minutes / 60;
    };

    // Helper to calculate duration
    const calculateDuration = (start: string, end: string) => {
        if (!start || !end) return 0;
        let diff = timeToDecimal(end) - timeToDecimal(start);
        if (diff < 0) diff += 24; // Handle midnight crossing simple
        return parseFloat(diff.toFixed(2));
    };

    // Sync FH and CYC from main fields to customReadings automatically
    useEffect(() => {
        setLog(prev => {
            const newReadings = { ...prev.customReadings };
            let changed = false;

            // If fleet uses 'FH', sync with flightTime
            // Match against CODE, not ID, as IDs are now UUIDs
            const fhFactor = fleetFactors.find(f => f.code === 'FH');
            if (fhFactor) {
                if (newReadings[fhFactor.id] !== prev.flightTime) {
                    newReadings[fhFactor.id] = prev.flightTime;
                    changed = true;
                }
            }

            // If fleet uses 'CYC', sync with landings
            const cycFactor = fleetFactors.find(f => f.code === 'CYC');
            if (cycFactor) {
                if (newReadings[cycFactor.id] !== prev.landings) {
                    newReadings[cycFactor.id] = prev.landings;
                    changed = true;
                }
            }

            return changed ? { ...prev, customReadings: newReadings } : prev;
        });
    }, [log.flightTime, log.landings, fleetFactors]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        setLog(prev => {
            const updates: any = { [name]: value };
            
            // Auto-calculate durations when times change
            if (['offBlockTime', 'takeOffTime', 'landingTime', 'onBlockTime'].includes(name)) {
                const tempLog = { ...prev, [name]: value };
                if (tempLog.offBlockTime && tempLog.onBlockTime) {
                    updates.blockTime = calculateDuration(tempLog.offBlockTime, tempLog.onBlockTime);
                }
                if (tempLog.takeOffTime && tempLog.landingTime) {
                    updates.flightTime = calculateDuration(tempLog.takeOffTime, tempLog.landingTime);
                }
            }
            return { ...prev, ...updates };
        });

        if (errors[name as keyof FlightLog]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleFactorChange = (factorId: string, value: string) => {
        const numVal = parseFloat(value);
        setLog(prev => ({
            ...prev,
            customReadings: {
                ...prev.customReadings,
                [factorId]: isNaN(numVal) ? 0 : numVal
            }
        }));
    };

    const validate = () => {
        const newErrors: Partial<Record<keyof FlightLog, string>> = {};
        if (!log.aircraftRegistration) newErrors.aircraftRegistration = 'Aeronave obligatoria';
        if (!log.date) newErrors.date = 'Fecha obligatoria';
        if (!log.from) newErrors.from = 'Origen obligatorio';
        if (!log.to) newErrors.to = 'Destino obligatorio';
        if (!log.offBlockTime) newErrors.offBlockTime = 'Requerido';
        if (!log.onBlockTime) newErrors.onBlockTime = 'Requerido';
        if (!log.takeOffTime) newErrors.takeOffTime = 'Requerido';
        if (!log.landingTime) newErrors.landingTime = 'Requerido';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSave(log);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh]">
                <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <PaperAirplaneIcon className="h-6 w-6 text-sky-400"/>
                        {mode === 'add' ? 'Nuevo Registro de Vuelo (TLB)' : `Editando Vuelo: ${log.id}`}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                </header>

                <main className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                    {/* General Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-2">Datos Generales</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Aeronave</label>
                            <select name="aircraftRegistration" value={log.aircraftRegistration} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500">
                                <option value="">-- Seleccionar --</option>
                                {mockAircrafts.filter(a => a.status === 'Active').map(a => (
                                    <option key={a.serialNumber} value={a.registration}>{a.registration} ({a.model})</option>
                                ))}
                            </select>
                            {errors.aircraftRegistration && <p className="text-red-400 text-xs mt-1">{errors.aircraftRegistration}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Fecha</label>
                                <input type="date" name="date" value={log.date} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500" />
                                {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Nº Vuelo (Opcional)</label>
                                <input type="text" name="flightNumber" value={log.flightNumber} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500" placeholder="Ej: V001"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Origen (ICAO)</label>
                                <input type="text" name="from" value={log.from} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500 uppercase" placeholder="LEMD"/>
                                {errors.from && <p className="text-red-400 text-xs mt-1">{errors.from}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Destino (ICAO)</label>
                                <input type="text" name="to" value={log.to} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500 uppercase" placeholder="LEBL"/>
                                {errors.to && <p className="text-red-400 text-xs mt-1">{errors.to}</p>}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Piloto al Mando</label>
                            <input type="text" name="pilotName" value={log.pilotName} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500"/>
                        </div>
                    </div>

                    {/* Operational Times & Factors */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-2 mb-4">Tiempos Operativos (OOOI)</h3>
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 uppercase font-bold">Off Block (Salida)</label>
                                        <input type="time" name="offBlockTime" value={log.offBlockTime} onChange={handleChange} className="mt-1 block w-full rounded bg-gray-800 text-white border-gray-600 focus:border-sky-500"/>
                                        {errors.offBlockTime && <p className="text-red-400 text-xs">{errors.offBlockTime}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 uppercase font-bold">On Block (Llegada)</label>
                                        <input type="time" name="onBlockTime" value={log.onBlockTime} onChange={handleChange} className="mt-1 block w-full rounded bg-gray-800 text-white border-gray-600 focus:border-sky-500"/>
                                        {errors.onBlockTime && <p className="text-red-400 text-xs">{errors.onBlockTime}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 uppercase font-bold">Take Off (Despegue)</label>
                                        <input type="time" name="takeOffTime" value={log.takeOffTime} onChange={handleChange} className="mt-1 block w-full rounded bg-gray-800 text-white border-gray-600 focus:border-sky-500"/>
                                        {errors.takeOffTime && <p className="text-red-400 text-xs">{errors.takeOffTime}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 uppercase font-bold">Landing (Aterrizaje)</label>
                                        <input type="time" name="landingTime" value={log.landingTime} onChange={handleChange} className="mt-1 block w-full rounded bg-gray-800 text-white border-gray-600 focus:border-sky-500"/>
                                        {errors.landingTime && <p className="text-red-400 text-xs">{errors.landingTime}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-3">
                                <div className="bg-sky-900/20 p-2 rounded border border-sky-800/50 text-center">
                                    <span className="block text-xs text-sky-400 uppercase">Tiempo Bloque</span>
                                    <span className="text-xl font-bold text-white">{log.blockTime} <span className="text-xs font-normal text-gray-400">h</span></span>
                                </div>
                                <div className="bg-sky-900/20 p-2 rounded border border-sky-800/50 text-center">
                                    <span className="block text-xs text-sky-400 uppercase">Tiempo Vuelo</span>
                                    <span className="text-xl font-bold text-white">{log.flightTime} <span className="text-xs font-normal text-gray-400">h</span></span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300">Aterrizajes</label>
                                    <input type="number" name="landings" value={log.landings} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500 text-center font-bold"/>
                                </div>
                            </div>
                        </div>

                        {/* Custom Fleet Factors */}
                        {fleetFactors.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-2 mb-4 flex items-center gap-2">
                                    <AdjustmentsHorizontalIcon className="h-5 w-5"/> Factores de Flota (Consumo)
                                </h3>
                                <div className="grid grid-cols-2 gap-4 bg-gray-700/30 p-4 rounded-lg">
                                    {fleetFactors.map(factor => {
                                        const isAutoCalculated = factor.code === 'FH' || factor.code === 'CYC';
                                        return (
                                            <div key={factor.id}>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">
                                                    {factor.name} ({factor.code})
                                                    {isAutoCalculated && <span className="ml-1 text-sky-500 italic">(Auto)</span>}
                                                </label>
                                                <input 
                                                    type="number" 
                                                    step={factor.valueType === 'float' ? "0.1" : "1"}
                                                    value={log.customReadings?.[factor.id] ?? 0}
                                                    onChange={e => handleFactorChange(factor.id, e.target.value)}
                                                    className={`block w-full rounded-md border-gray-600 text-white text-sm focus:ring-sky-500 focus:border-sky-500 ${isAutoCalculated ? 'bg-gray-800 text-gray-400' : 'bg-gray-700'}`}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Estado Registro</label>
                            <select name="status" value={log.status} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500">
                                <option value="Draft">Borrador</option>
                                <option value="Verified">Verificado (Sumar Contadores)</option>
                            </select>
                        </div>
                    </div>
                </main>

                <footer className="flex justify-end items-center p-4 border-t border-gray-700 flex-shrink-0 gap-3">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">Cancelar</button>
                    <button onClick={handleSubmit} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2"><CheckCircleIcon className="h-5 w-5"/> Guardar Vuelo</button>
                </footer>
            </div>
        </div>
    );
};
