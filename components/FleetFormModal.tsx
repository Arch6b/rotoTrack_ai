
import React, { useState, useEffect } from 'react';
import type { Fleet, FactorDefinition, CustomFactor, AMP, Certificate } from '../types';
import { mockFactorDefinitions, mockAmps, mockCertificates } from '../data/mockDatabase';
import { XMarkIcon, CheckCircleIcon, AdjustmentsHorizontalIcon } from './Icons';

interface FleetFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (fleet: Fleet, selectedAmpId: string | undefined) => void;
    initialData: Fleet | null;
    mode: 'add' | 'edit';
    onManageFactors: () => void;
    onAddNewCertificate: (callback: (newCertId: string) => void) => void;
}

const emptyFleet: Omit<Fleet, 'lastModifiedBy' | 'lastModifiedDate'> = {
    id: '',
    name: '',
    typeCertificateId: '',
    numMotors: 1,
    customFactors: [],
    notes: '',
    status: 'Active',
};

export const FleetFormModal: React.FC<FleetFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData,
    onAddNewCertificate,
    mode,
    onManageFactors,
}) => {
    const [fleet, setFleet] = useState<Fleet>(initialData || { ...emptyFleet, lastModifiedBy: '', lastModifiedDate: '' });
    const [selectedAmpId, setSelectedAmpId] = useState<string | undefined>(undefined);
    const [errors, setErrors] = useState<Partial<Record<keyof Fleet, string>>>({});
    
    useEffect(() => {
        if (isOpen) {
            const initialFleet = initialData || { ...emptyFleet, lastModifiedBy: '', lastModifiedDate: '' };
            setFleet(initialFleet);
            const associatedAmp = mockAmps.find(a => a.fleetId === initialFleet.id);
            setSelectedAmpId(associatedAmp?.id);
            setErrors({});
        }
    }, [initialData, isOpen]);
    
    const availableAmps = mockAmps.filter(amp => amp.status !== 'Superseded' && (!amp.fleetId || amp.fleetId === fleet.id));
    const availableTCs = mockCertificates.filter(c => c.type === 'TC' && c.status === 'Active');

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof Fleet, string>> = {};
        if (!fleet.name) newErrors.name = 'El nombre es obligatorio.';
        if (!fleet.typeCertificateId) newErrors.typeCertificateId = 'El Certificado Tipo (TC) es obligatorio.';
        if (fleet.numMotors < 0) newErrors.numMotors = 'El número de motores no puede ser negativo.';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            onSave(fleet, selectedAmpId);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? parseInt(value, 10) : value;
        setFleet(prev => ({ ...prev, [name]: finalValue }));
        if (errors[name as keyof Fleet]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleFactorChange = (factor: CustomFactor) => {
        const index = fleet.customFactors.findIndex(f => f.factorId === factor.factorId);
        if (index > -1) {
            const newFactors = [...fleet.customFactors];
            newFactors[index] = factor;
            setFleet(prev => ({ ...prev, customFactors: newFactors }));
        }
    };
    
    const handleFactorToggle = (factorDef: FactorDefinition) => {
        const isEnabled = fleet.customFactors.some(f => f.factorId === factorDef.id);
        let newFactors: CustomFactor[];
        if (isEnabled) {
            newFactors = fleet.customFactors.filter(f => f.factorId !== factorDef.id);
        } else {
            // Default boolean to 'true' directly when enabled
            const defaultValue = factorDef.valueType === 'boolean' ? 'true' : factorDef.valueType === 'string' ? '' : '0';
            newFactors = [...fleet.customFactors, { factorId: factorDef.id, value: defaultValue }];
        }
        setFleet(prev => ({ ...prev, customFactors: newFactors }));
    };

    const handleNewCertificateCreated = (newCertId: string) => {
        setFleet(prev => ({ ...prev, typeCertificateId: newCertId }));
    };

    const handleCertificateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = e.target;

        if (value === '__ADD_NEW__') {
            onAddNewCertificate(handleNewCertificateCreated);
        } else {
            setFleet(prev => ({ ...prev, typeCertificateId: value }));
            if (errors.typeCertificateId) {
                setErrors(prev => ({ ...prev, typeCertificateId: undefined }));
            }
        }
    };

    if (!isOpen) return null;

    const title = mode === 'add' ? 'Añadir Nueva Flota' : `Editando Flota: ${initialData?.name}`;
    
    const renderFactorInput = (factorDef: FactorDefinition, customFactor: CustomFactor) => {
        switch (factorDef.valueType) {
            case 'integer':
                return <input type="number" step="1" value={customFactor.value} onChange={e => handleFactorChange({ ...customFactor, value: e.target.value })} className="w-24 rounded-md bg-gray-600 py-1 px-2 text-white ring-1 ring-inset ring-gray-500 focus:ring-2 focus:ring-sky-500 text-sm" />;
            case 'float':
                return <input type="number" step="0.1" value={customFactor.value} onChange={e => handleFactorChange({ ...customFactor, value: e.target.value })} className="w-24 rounded-md bg-gray-600 py-1 px-2 text-white ring-1 ring-inset ring-gray-500 focus:ring-2 focus:ring-sky-500 text-sm" />;
            default: // string
                return <input type="text" value={customFactor.value} onChange={e => handleFactorChange({ ...customFactor, value: e.target.value })} className="w-full rounded-md bg-gray-600 py-1 px-2 text-white ring-1 ring-inset ring-gray-500 focus:ring-2 focus:ring-sky-500 text-sm" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                </header>

                <main className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    {/* Column 1 */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-2">Información General</h3>

                        <div>
                            <label htmlFor="name" className="block font-medium text-gray-300">Nombre</label>
                            <input type="text" name="name" id="name" value={fleet.name} onChange={handleChange} className={`mt-1 block w-full rounded-md bg-gray-700 ${errors.name ? 'border-red-500 ring-red-500' : 'border-transparent focus:border-sky-500 focus:ring-sky-500'} text-white`} />
                            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label htmlFor="typeCertificateId" className="block font-medium text-gray-300">Certificado Tipo (TC)</label>
                            <select id="typeCertificateId" name="typeCertificateId" value={fleet.typeCertificateId || ''} onChange={handleCertificateChange} className={`mt-1 block w-full rounded-md bg-gray-700 ${errors.typeCertificateId ? 'border-red-500 ring-red-500' : 'border-transparent focus:border-sky-500 focus:ring-sky-500'} text-white`}>
                                <option value="">-- Seleccionar TC --</option>
                                {availableTCs.map(tc => <option key={tc.id} value={tc.id}>{tc.tcds} - {tc.holder}</option>)}
                                <option value="__ADD_NEW__" className="text-sky-300 bg-gray-600 font-semibold">... Añadir Nuevo TC</option>
                            </select>
                            {errors.typeCertificateId && <p className="text-red-400 text-xs mt-1">{errors.typeCertificateId}</p>}
                        </div>
                         <div>
                            <label htmlFor="ampId" className="block font-medium text-gray-300">Programa de Mantenimiento (AMP)</label>
                            <select id="ampId" name="ampId" value={selectedAmpId || ''} onChange={(e) => setSelectedAmpId(e.target.value || undefined)} className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white">
                                <option value="">-- Ninguno --</option>
                                {availableAmps.map(a => <option key={a.id} value={a.id}>{a.name} (Rev. {a.revision})</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="numMotors" className="block font-medium text-gray-300">Nº Motores</label>
                            <input type="number" name="numMotors" id="numMotors" value={fleet.numMotors} onChange={handleChange} min="0" className={`mt-1 block w-full rounded-md bg-gray-700 ${errors.numMotors ? 'border-red-500 ring-red-500' : 'border-transparent focus:border-sky-500 focus:ring-sky-500'} text-white`} />
                            {errors.numMotors && <p className="text-red-400 text-xs mt-1">{errors.numMotors}</p>}
                        </div>
                        <div>
                             <label htmlFor="status" className="block font-medium text-gray-300">Estado</label>
                            <select id="status" name="status" value={fleet.status} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white">
                                <option value="Active">Activa</option>
                                <option value="Inactive">Inactiva</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="notes" className="block font-medium text-gray-300">Notas</label>
                            <textarea id="notes" name="notes" value={fleet.notes} onChange={handleChange} rows={4} className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white" />
                        </div>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-600 pb-2">
                             <h3 className="text-lg font-semibold text-sky-400">Factores Personalizados</h3>
                             <button onClick={onManageFactors} className="text-sky-400 hover:text-sky-300 transition-colors" title="Gestionar Definiciones de Factores">
                                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                            </button>
                        </div>
                         <div className="space-y-3 p-3 border border-gray-600 rounded-md max-h-[28rem] overflow-y-auto">
                            {mockFactorDefinitions.filter(f => f.status === 'Active').map(def => {
                                const isEnabled = fleet.customFactors.some(f => f.factorId === def.id);
                                const customFactor = fleet.customFactors.find(f => f.factorId === def.id);
                                return (
                                    <div key={def.id} className={`p-2 rounded-md transition-colors ${isEnabled ? 'bg-gray-700/70' : 'bg-gray-800/50'}`}>
                                        <div className="flex items-center justify-between">
                                            <label htmlFor={`toggle-${def.id}`} className="font-medium text-gray-200 cursor-pointer select-none">
                                                {def.name}
                                            </label>
                                            <input
                                                id={`toggle-${def.id}`}
                                                type="checkbox"
                                                checked={isEnabled}
                                                onChange={() => handleFactorToggle(def)}
                                                className="h-4 w-4 rounded border-gray-500 bg-gray-600 text-sky-500 focus:ring-sky-600"
                                            />
                                        </div>
                                        {/* Only render input if NOT boolean */}
                                        {isEnabled && customFactor && def.valueType !== 'boolean' && (
                                            <div className="mt-2 flex items-center gap-2 pl-2 border-l-2 border-sky-500/50">
                                                <label className="text-xs text-gray-400">Valor:</label>
                                                {renderFactorInput(def, customFactor)}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                         </div>
                    </div>
                </main>

                <footer className="flex justify-end p-4 border-t border-gray-700 flex-shrink-0">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors mr-3">Cancelar</button>
                    <button onClick={handleSave} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5"/> Guardar Flota
                    </button>
                </footer>
            </div>
        </div>
    );
};
