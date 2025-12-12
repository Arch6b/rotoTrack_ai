
import React, { useState, useEffect } from 'react';
import type { Aircraft, Organization, Fleet, OperationType } from '../types';
import { mockOrganizations, mockFleets, mockOperationTypes, mockOrganizationTypes } from '../data/mockDatabase';
import { XMarkIcon, CheckCircleIcon, AdjustmentsHorizontalIcon } from './Icons';

interface AircraftFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (aircraft: Aircraft) => void;
    initialData: Aircraft | null;
    mode: 'add' | 'edit';
    onAddNewOrganization: (typeId: string, callback: (newOrgId: string) => void) => void;
    onAddNewFleet: (callback: (newFleetId: string) => void) => void;
    onManageOpTypes: () => void;
}

const emptyAircraft: Omit<Aircraft, 'lastModifiedBy' | 'lastModifiedDate'> = {
    id: '',
    serialNumber: '',
    registration: '',
    model: '',
    ownerId: '',
    camoId: '',
    fleetId: '',
    status: 'Active',
    notes: '',
    operationStartDate: '',
    contractEndDate: '',
    operationTypeIds: [],
    counters: {},
    manufactureDate: '',
};

export const AircraftFormModal: React.FC<AircraftFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData,
    mode,
    onAddNewOrganization,
    onAddNewFleet,
    onManageOpTypes,
}) => {
    // We use a full Aircraft object for state to simplify typing, even for new aircraft.
    // The unused fields will be empty strings and will be populated by the mock DB functions on save.
    const [aircraft, setAircraft] = useState<Aircraft>(initialData || { ...emptyAircraft, lastModifiedBy: '', lastModifiedDate: '' });
    const [errors, setErrors] = useState<Partial<Record<keyof Aircraft, string>>>({});
    
    useEffect(() => {
        if (isOpen) {
            setAircraft(initialData || { ...emptyAircraft, lastModifiedBy: '', lastModifiedDate: '' });
            setErrors({});
        }
    }, [initialData, isOpen]);

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof Aircraft, string>> = {};
        if (!aircraft.serialNumber) newErrors.serialNumber = 'El N/S es obligatorio.';
        if (!aircraft.registration) newErrors.registration = 'La matrícula es obligatoria.';
        if (!aircraft.model) newErrors.model = 'El modelo es obligatorio.';
        if (!aircraft.fleetId) newErrors.fleetId = 'Se debe seleccionar una flota.';
        if (!aircraft.ownerId) newErrors.ownerId = 'Se debe seleccionar un propietario.';
        if (!aircraft.camoId) newErrors.camoId = 'Se debe seleccionar una CAMO.';
        if (!aircraft.operationStartDate) newErrors.operationStartDate = 'La fecha de inicio es obligatoria.';
        if (!aircraft.contractEndDate) newErrors.contractEndDate = 'La fecha de fin de contrato es obligatoria.';

        if (aircraft.operationStartDate && aircraft.contractEndDate && aircraft.operationStartDate > aircraft.contractEndDate) {
            newErrors.contractEndDate = 'La fecha de fin debe ser posterior a la de inicio.';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            onSave(aircraft);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setAircraft(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof Aircraft]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };
    
    const handleOpTypeChange = (opTypeId: string) => {
        const newOpTypeIds = aircraft.operationTypeIds.includes(opTypeId)
            ? aircraft.operationTypeIds.filter(id => id !== opTypeId)
            : [...aircraft.operationTypeIds, opTypeId];
        setAircraft(prev => ({ ...prev, operationTypeIds: newOpTypeIds }));
    };

    // Creates a callback function that updates the correct field (ownerId or camoId)
    // when a new organization is created via the OrganizationAddModal.
    const handleNewOrgCreated = (field: 'ownerId' | 'camoId') => (newOrgId: string) => {
        setAircraft(prev => ({ ...prev, [field]: newOrgId }));
    };

    const handleOrgChange = (e: React.ChangeEvent<HTMLSelectElement>, orgTypeId: string) => {
        const { name, value } = e.target;
        const field = name as 'ownerId' | 'camoId';

        if (value === '__ADD_NEW__') {
            onAddNewOrganization(orgTypeId, handleNewOrgCreated(field));
        } else {
            setAircraft(prev => ({ ...prev, [name]: value }));
            if (errors[field]) {
                setErrors(prev => ({ ...prev, [field]: undefined }));
            }
        }
    };

    const handleNewFleetCreated = (newFleetId: string) => {
        setAircraft(prev => ({ ...prev, fleetId: newFleetId }));
    };

    const handleFleetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = e.target;

        if (value === '__ADD_NEW__') {
            onAddNewFleet(handleNewFleetCreated);
        } else {
            setAircraft(prev => ({ ...prev, fleetId: value }));
            if (errors.fleetId) {
                setErrors(prev => ({ ...prev, fleetId: undefined }));
            }
        }
    };

    if (!isOpen) return null;

    const owners = mockOrganizations.filter(o => ['OWNER', 'LESSOR'].includes(o.typeId));
    const camos = mockOrganizations.filter(o => o.typeId === 'CAMO');
    const fleets = mockFleets;
    const activeOperationTypes = mockOperationTypes.filter(ot => ot.status === 'Active');
    const title = mode === 'add' ? 'Añadir Nueva Aeronave' : `Editando Aeronave: ${initialData?.registration}`;
    
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                </header>

                <main className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    {/* Column 1 */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-2">Identificación</h3>
                        <div>
                            <label htmlFor="serialNumber" className="block font-medium text-gray-300">N/S (Serial Number)</label>
                            <input type="text" name="serialNumber" id="serialNumber" value={aircraft.serialNumber} onChange={handleChange} className={`mt-1 block w-full rounded-md bg-gray-700 ${errors.serialNumber ? 'border-red-500 ring-red-500' : 'border-transparent focus:border-sky-500 focus:ring-sky-500'} text-white`} />
                            {errors.serialNumber && <p className="text-red-400 text-xs mt-1">{errors.serialNumber}</p>}
                        </div>
                        <div>
                            <label htmlFor="registration" className="block font-medium text-gray-300">Matrícula</label>
                            <input type="text" name="registration" id="registration" value={aircraft.registration} onChange={handleChange} className={`mt-1 block w-full rounded-md bg-gray-700 ${errors.registration ? 'border-red-500 ring-red-500' : 'border-transparent focus:border-sky-500 focus:ring-sky-500'} text-white`} />
                            {errors.registration && <p className="text-red-400 text-xs mt-1">{errors.registration}</p>}
                        </div>
                        <div>
                            <label htmlFor="model" className="block font-medium text-gray-300">Modelo</label>
                            <input type="text" name="model" id="model" value={aircraft.model} onChange={handleChange} className={`mt-1 block w-full rounded-md bg-gray-700 ${errors.model ? 'border-red-500 ring-red-500' : 'border-transparent focus:border-sky-500 focus:ring-sky-500'} text-white`} />
                            {errors.model && <p className="text-red-400 text-xs mt-1">{errors.model}</p>}
                        </div>
                         <div>
                            <label htmlFor="fleetId" className="block font-medium text-gray-300">Flota</label>
                            <select id="fleetId" name="fleetId" value={aircraft.fleetId} onChange={handleFleetChange} className={`mt-1 block w-full rounded-md bg-gray-700 ${errors.fleetId ? 'border-red-500 ring-red-500' : 'border-transparent focus:border-sky-500 focus:ring-sky-500'} text-white`}>
                                <option value="">-- Seleccionar Flota --</option>
                                {fleets.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                <option value="__ADD_NEW__" className="text-sky-300 bg-gray-600 font-semibold">... Añadir Nueva Flota</option>
                            </select>
                            {errors.fleetId && <p className="text-red-400 text-xs mt-1">{errors.fleetId}</p>}
                        </div>
                        
                        <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-2 pt-4">Responsables</h3>
                        <div>
                            <label htmlFor="ownerId" className="block font-medium text-gray-300">Propietario</label>
                            <select id="ownerId" name="ownerId" value={aircraft.ownerId} onChange={e => handleOrgChange(e, 'OWNER')} className={`mt-1 block w-full rounded-md bg-gray-700 ${errors.ownerId ? 'border-red-500 ring-red-500' : 'border-transparent focus:border-sky-500 focus:ring-sky-500'} text-white`}>
                                <option value="">-- Seleccionar Propietario --</option>
                                {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                <option value="__ADD_NEW__" className="text-sky-300 bg-gray-600 font-semibold">... Añadir Nuevo Propietario</option>
                            </select>
                            {errors.ownerId && <p className="text-red-400 text-xs mt-1">{errors.ownerId}</p>}
                        </div>
                        <div>
                            <label htmlFor="camoId" className="block font-medium text-gray-300">CAMO</label>
                            <select id="camoId" name="camoId" value={aircraft.camoId} onChange={e => handleOrgChange(e, 'CAMO')} className={`mt-1 block w-full rounded-md bg-gray-700 ${errors.camoId ? 'border-red-500 ring-red-500' : 'border-transparent focus:border-sky-500 focus:ring-sky-500'} text-white`}>
                                <option value="">-- Seleccionar CAMO --</option>
                                {camos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                <option value="__ADD_NEW__" className="text-sky-300 bg-gray-600 font-semibold">... Añadir Nuevo CAMO</option>
                            </select>
                            {errors.camoId && <p className="text-red-400 text-xs mt-1">{errors.camoId}</p>}
                        </div>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-2">Operacional</h3>
                        <div>
                             <label htmlFor="status" className="block font-medium text-gray-300">Estado</label>
                            <select id="status" name="status" value={aircraft.status} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white">
                                <option value="Active">Activa</option>
                                <option value="Inactive">Inactiva</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="manufactureDate" className="block font-medium text-gray-300">Fecha Fabricación</label>
                            <input type="date" name="manufactureDate" id="manufactureDate" value={aircraft.manufactureDate || ''} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500 focus:ring-sky-500" />
                        </div>
                         <div>
                            <label htmlFor="operationStartDate" className="block font-medium text-gray-300">Fecha Inicio Operación</label>
                            <input type="date" name="operationStartDate" id="operationStartDate" value={aircraft.operationStartDate} onChange={handleChange} className={`mt-1 block w-full rounded-md bg-gray-700 ${errors.operationStartDate ? 'border-red-500 ring-red-500' : 'border-transparent focus:border-sky-500 focus:ring-sky-500'} text-white`} />
                            {errors.operationStartDate && <p className="text-red-400 text-xs mt-1">{errors.operationStartDate}</p>}
                        </div>
                        <div>
                            <label htmlFor="contractEndDate" className="block font-medium text-gray-300">Fecha Fin Contrato</label>
                            <input type="date" name="contractEndDate" id="contractEndDate" value={aircraft.contractEndDate} onChange={handleChange} className={`mt-1 block w-full rounded-md bg-gray-700 ${errors.contractEndDate ? 'border-red-500 ring-red-500' : 'border-transparent focus:border-sky-500 focus:ring-sky-500'} text-white`} />
                            {errors.contractEndDate && <p className="text-red-400 text-xs mt-1">{errors.contractEndDate}</p>}
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <label className="block font-medium text-gray-300">Tipos de Operación</label>
                                <button onClick={onManageOpTypes} className="text-sky-400 hover:text-sky-300 transition-colors" title="Gestionar Tipos de Operación">
                                    <AdjustmentsHorizontalIcon className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 p-3 border border-gray-600 rounded-md max-h-36 overflow-y-auto">
                                {activeOperationTypes.map(ot => (
                                    <label key={ot.id} className="flex items-center space-x-3 text-gray-200 cursor-pointer p-1 rounded-md hover:bg-gray-600/50 transition-colors">
                                        <input type="checkbox" checked={aircraft.operationTypeIds.includes(ot.id)} onChange={() => handleOpTypeChange(ot.id)} className="h-4 w-4 rounded border-gray-500 bg-gray-600 text-sky-500 focus:ring-offset-gray-800 focus:ring-sky-600"/>
                                        <span className="flex-1 truncate" title={`${ot.name}: ${ot.description}`}>{ot.name} <span className="text-gray-400 truncate hidden sm:inline">- {ot.description}</span></span>
                                    </label>
                                ))}
                            </div>
                        </div>
                         <div>
                            <label htmlFor="notes" className="block font-medium text-gray-300">Notas</label>
                            <textarea id="notes" name="notes" value={aircraft.notes} onChange={handleChange} rows={4} className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white" />
                        </div>
                    </div>
                </main>

                <footer className="flex justify-end p-4 border-t border-gray-700 flex-shrink-0">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors mr-3">Cancelar</button>
                    <button onClick={handleSave} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5"/> Guardar Cambios
                    </button>
                </footer>
            </div>
        </div>
    );
};
