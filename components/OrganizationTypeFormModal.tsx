
import React, { useState } from 'react';
import type { OrganizationType } from '../types';
import { XMarkIcon, CheckCircleIcon } from './Icons';

interface OrganizationTypeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (orgType: OrganizationType) => void;
    initialData: OrganizationType | null;
    mode: 'add' | 'edit';
    existingIds: string[];
}

const emptyState: OrganizationType = { id: '', code: '', name: '', description: '', status: 'Active' };

export const OrganizationTypeFormModal: React.FC<OrganizationTypeFormModalProps> = ({ isOpen, onClose, onSave, initialData, mode, existingIds }) => {
    const [orgType, setOrgType] = useState<OrganizationType>(initialData || emptyState);
    const [errors, setErrors] = useState<Partial<Record<keyof OrganizationType, string>>>({});

    const validate = () => {
        const newErrors: Partial<Record<keyof OrganizationType, string>> = {};
        if (!orgType.code) {
            newErrors.code = 'El Código es obligatorio.';
        }
        if (!orgType.name) {
            newErrors.name = 'El nombre es obligatorio.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            onSave(orgType);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'code') {
             setOrgType(prev => ({ ...prev, code: value.toUpperCase() }));
        } else {
             setOrgType(prev => ({ ...prev, [name]: value }));
        }
        if (errors[name as keyof OrganizationType]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    if (!isOpen) return null;

    const title = mode === 'add' ? 'Crear Nuevo Tipo de Organización' : `Editando: ${initialData?.name}`;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-gray-800 border-2 border-sky-700 rounded-xl shadow-2xl w-full max-w-lg flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                </header>

                <main className="p-6 space-y-4">
                    {/* User enters Code (Business Key), System handles ID (UUID) */}
                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-gray-300">Código (Ej. CAMO, MRO)</label>
                        <input
                            type="text"
                            name="code"
                            id="code"
                            value={orgType.code}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white uppercase ${errors.code ? 'border-red-500 ring-red-500' : ''}`}
                            placeholder="Ej: CAMO"
                        />
                        {errors.code && <p className="text-red-400 text-xs mt-1">{errors.code}</p>}
                    </div>

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nombre</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={orgType.name}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white ${errors.name ? 'border-red-500 ring-red-500' : ''}`}
                            placeholder="Ej: Continuing Airworthiness Management Org"
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300">Descripción</label>
                        <textarea
                            id="description"
                            name="description"
                            value={orgType.description}
                            onChange={handleChange}
                            rows={3}
                            className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white"
                        />
                    </div>
                </main>
                
                <footer className="flex justify-end p-4 border-t border-gray-700">
                    <button onClick={handleSave} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5"/> Guardar Cambios
                    </button>
                </footer>
            </div>
        </div>
    );
};
