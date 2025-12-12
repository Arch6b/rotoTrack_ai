
import React, { useState, useEffect } from 'react';
import type { Organization } from '../types';
import { mockOrganizationTypes, mockOrganizations } from '../data/mockDatabase';
import { XMarkIcon, CheckCircleIcon, AdjustmentsHorizontalIcon } from './Icons';

interface OrganizationFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (organization: Organization) => void;
    initialData: Organization | null;
    mode: 'add' | 'edit';
    predefinedTypeId?: string;
    onManageOrgTypes: () => void;
}

const emptyOrganization: Omit<Organization, 'id'> = {
    name: '',
    typeId: '',
    approval: '',
    approvalLink: '',
    notes: '',
    linkTlb: '',
    status: 'Active',
};

export const OrganizationFormModal: React.FC<OrganizationFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData,
    mode,
    predefinedTypeId,
    onManageOrgTypes,
}) => {
    const [organization, setOrganization] = useState<Omit<Organization, 'id'>>({ ...emptyOrganization });
    const [errors, setErrors] = useState<Partial<Record<keyof Organization, string>>>({});
    
    useEffect(() => {
        if (isOpen) {
            const data = initialData ? { ...initialData } : { ...emptyOrganization };
            if (mode === 'add' && predefinedTypeId) {
                data.typeId = predefinedTypeId;
            } else if (mode === 'add') {
                // Default to the first active type if none is predefined
                const firstActiveType = mockOrganizationTypes.find(t => t.status === 'Active');
                if (firstActiveType) data.typeId = firstActiveType.id;
            }
            setOrganization(data);
            setErrors({});
        }
    }, [initialData, isOpen, mode, predefinedTypeId]);

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof Organization, string>> = {};
        if (!organization.name) newErrors.name = 'El nombre es obligatorio.';
        if (!organization.typeId) newErrors.typeId = 'El tipo es obligatorio.';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            // In add mode, the ID is not part of the form state, so we pass the object as is.
            // The database function is responsible for creating an ID.
            // In edit mode, we merge the state with the original ID.
            const dataToSave = mode === 'edit' 
                ? { ...initialData, ...organization, id: initialData!.id } as Organization
                : { ...organization } as Organization; // The DB will assign an ID
            onSave(dataToSave);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setOrganization(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof Organization]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };
    
    if (!isOpen) return null;

    const activeOrganizationTypes = mockOrganizationTypes.filter(ot => ot.status === 'Active');
    const title = mode === 'add' ? 'Añadir Nueva Organización' : `Editando: ${initialData?.name}`;
    
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                </header>

                <main className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div className="md:col-span-2">
                        <label htmlFor="name" className="block font-medium text-gray-300">Nombre</label>
                        <input type="text" name="name" id="name" value={organization.name} onChange={handleChange} className={`mt-1 block w-full rounded-md bg-gray-700 text-white ${errors.name ? 'border-red-500 ring-red-500' : 'border-transparent focus:border-sky-500 focus:ring-sky-500'}`}/>
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                    </div>
                     <div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="typeId" className="block font-medium text-gray-300">Tipo</label>
                            <button onClick={onManageOrgTypes} className="text-sky-400 hover:text-sky-300 transition-colors" title="Gestionar Tipos de Organización">
                                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <select id="typeId" name="typeId" value={organization.typeId} onChange={handleChange} disabled={!!predefinedTypeId} className={`mt-1 block w-full rounded-md bg-gray-700 text-white ${predefinedTypeId ? 'cursor-not-allowed bg-gray-600' : ''} ${errors.typeId ? 'border-red-500 ring-red-500' : 'border-transparent focus:border-sky-500 focus:ring-sky-500'}`}>
                            <option value="">-- Seleccionar Tipo --</option>
                            {activeOrganizationTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        {errors.typeId && <p className="text-red-400 text-xs mt-1">{errors.typeId}</p>}
                    </div>
                     <div>
                        <label htmlFor="status" className="block font-medium text-gray-300">Estado</label>
                        <select id="status" name="status" value={organization.status} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white">
                            <option value="Active">Activa</option>
                            <option value="Inactive">Inactiva</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="approval" className="block font-medium text-gray-300">Aprobación (ej. ES.MG.123)</label>
                        <input type="text" name="approval" id="approval" value={organization.approval} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white"/>
                    </div>
                     <div>
                        <label htmlFor="approvalLink" className="block font-medium text-gray-300">Enlace Aprobación</label>
                        <input type="url" name="approvalLink" id="approvalLink" value={organization.approvalLink || ''} onChange={handleChange} placeholder="https://..." className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white"/>
                    </div>
                     <div className="md:col-span-2">
                        <label htmlFor="notes" className="block font-medium text-gray-300">Notas</label>
                        <textarea id="notes" name="notes" value={organization.notes} onChange={handleChange} rows={8} className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white" />
                    </div>
                </main>

                <footer className="flex justify-end p-4 border-t border-gray-700 flex-shrink-0">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors mr-3">Cancelar</button>
                    <button onClick={handleSave} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5"/> Guardar Organización
                    </button>
                </footer>
            </div>
        </div>
    );
};
