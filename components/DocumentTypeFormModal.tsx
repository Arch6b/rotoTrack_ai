import React, { useState } from 'react';
import type { DocumentType } from '../types';
import { XMarkIcon, CheckCircleIcon } from './Icons';

interface DocumentTypeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (docType: DocumentType) => void;
    initialData: DocumentType | null;
    mode: 'add' | 'edit';
    existingIds: string[];
}

const emptyState: DocumentType = { id: '', code: '', name: '', description: '', status: 'Active' };

export const DocumentTypeFormModal: React.FC<DocumentTypeFormModalProps> = ({ isOpen, onClose, onSave, initialData, mode, existingIds }) => {
    const [docType, setDocType] = useState<DocumentType>(initialData || emptyState);
    const [errors, setErrors] = useState<Partial<Record<keyof DocumentType, string>>>({});

    const validate = () => {
        const newErrors: Partial<Record<keyof DocumentType, string>> = {};
        if (!docType.code) {
            newErrors.code = 'El Código es obligatorio.';
        } else if (mode === 'add' && existingIds.some(id => id.toLowerCase() === docType.code.toLowerCase())) {
            newErrors.code = 'Este Código ya existe.';
        }
        if (!docType.name) {
            newErrors.name = 'El nombre es obligatorio.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            onSave(docType);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        // Auto-uppercase Code for consistency
        const finalValue = name === 'code' ? value.toUpperCase() : value;
        setDocType(prev => ({ ...prev, [name]: finalValue }));
        if (errors[name as keyof DocumentType]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    if (!isOpen) return null;

    const title = mode === 'add' ? 'Crear Nuevo Tipo de Documento' : `Editando: ${initialData?.name}`;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <div className="bg-gray-800 border-2 border-sky-700 rounded-xl shadow-2xl w-full max-w-lg flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                </header>

                <main className="p-6 space-y-4">
                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-gray-300">Código (Ej. AMM, AFM)</label>
                        <input
                            type="text"
                            name="code"
                            id="code"
                            value={docType.code}
                            onChange={handleChange}
                            readOnly={mode === 'edit'}
                            className={`mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white uppercase ${errors.code ? 'border-red-500 ring-red-500' : ''} ${mode === 'edit' ? 'bg-gray-600 cursor-not-allowed' : ''}`}
                            placeholder="Ej: AFM"
                        />
                        {errors.code && <p className="text-red-400 text-xs mt-1">{errors.code}</p>}
                    </div>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nombre Completo</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={docType.name}
                            onChange={handleChange}
                            className={`mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white ${errors.name ? 'border-red-500 ring-red-500' : ''}`}
                            placeholder="Ej: Aircraft Flight Manual"
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300">Descripción</label>
                        <textarea
                            id="description"
                            name="description"
                            value={docType.description}
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