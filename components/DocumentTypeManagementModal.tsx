
import React, { useState, useMemo, useEffect } from 'react';
import type { DocumentType, Document } from '../types';
import { XMarkIcon } from './Icons';
import { DocumentTypeFormModal } from './DocumentTypeFormModal';
import { addDocumentType, updateDocumentType, mockDocumentTypes } from '../data/mockDatabase';

interface DocumentTypeManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentTypes: DocumentType[];
    documents: Document[];
}

export const DocumentTypeManagementModal: React.FC<DocumentTypeManagementModalProps> = ({ isOpen, onClose, documentTypes, documents }) => {
    const [localTypes, setLocalTypes] = useState<DocumentType[]>([]);
    const [showInactive, setShowInactive] = useState(false);
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<DocumentType | null>(null);

    useEffect(() => {
        if (isOpen) {
            setLocalTypes(JSON.parse(JSON.stringify(documentTypes)));
        }
    }, [isOpen, documentTypes]);
    
    const usageMap = useMemo(() => {
        const usage = new Map<string, number>();
        documents.forEach(doc => {
            usage.set(doc.docType, (usage.get(doc.docType) || 0) + 1);
        });
        return usage;
    }, [documents]);

    const getUsageCount = (typeId: string): number => {
        return usageMap.get(typeId) || 0;
    };
    
    const handleToggleStatus = (typeToToggle: DocumentType) => {
        const usageCount = getUsageCount(typeToToggle.id);
        if (usageCount > 0 && typeToToggle.status === 'Active') {
            alert(`No se puede desactivar. Usado por ${usageCount} documento(s).`);
            return;
        }

        const updatedType: DocumentType = {
            ...typeToToggle,
            status: typeToToggle.status === 'Active' ? 'Inactive' : 'Active',
        };
        updateDocumentType(updatedType);
        setLocalTypes(prev => 
            prev.map(t => t.id === updatedType.id ? updatedType : t)
        );
    };
    
    const handleAddNew = () => {
        setEditingType(null);
        setFormModalOpen(true);
    };

    const handleEdit = (type: DocumentType) => {
        setEditingType(type);
        setFormModalOpen(true);
    };

    const handleSaveForm = (typeData: DocumentType) => {
        if (editingType) {
            updateDocumentType(typeData);
        } else {
             try {
                addDocumentType(typeData);
            } catch (error: any) {
                alert(error.message);
                return;
            }
        }
        setLocalTypes(JSON.parse(JSON.stringify(mockDocumentTypes)));
        setFormModalOpen(false);
        setEditingType(null);
    };

    const displayedTypes = useMemo(() => {
        const sorted = [...localTypes].sort((a, b) => a.code.localeCompare(b.code));
        if (showInactive) {
            return sorted;
        }
        return sorted.filter(t => t.status === 'Active');
    }, [localTypes, showInactive]);

    if (!isOpen) return null;

    return (
        <>
            <div 
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                aria-labelledby="modal-title"
                role="dialog"
                aria-modal="true"
            >
                <div 
                    className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col"
                >
                    <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                        <h2 id="modal-title" className="text-xl font-bold text-white">Gestionar Tipos de Documento</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </header>

                    <main className="p-6 overflow-y-auto space-y-4">
                         <div className="flex justify-end">
                            <label className="flex items-center text-sm text-gray-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showInactive}
                                    onChange={() => setShowInactive(prev => !prev)}
                                    className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-sky-500 focus:ring-sky-600"
                                />
                                <span className="ml-2">Ver inactivos</span>
                            </label>
                        </div>
                         <div className="bg-gray-900/50 shadow-xl rounded-lg overflow-hidden border border-gray-700">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-left text-gray-300">
                                    <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase tracking-wider">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Código</th>
                                            <th scope="col" className="px-6 py-3">Nombre</th>
                                            <th scope="col" className="px-6 py-3">Descripción</th>
                                            {showInactive && <th scope="col" className="px-6 py-3">Estado</th>}
                                            <th scope="col" className="px-6 py-3 text-center">Docs. Vinculados</th>
                                            <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {displayedTypes.map((type) => {
                                            const usageCount = getUsageCount(type.id);
                                            const isInUse = usageCount > 0;
                                            return (
                                                <tr key={type.id} className="hover:bg-gray-700/40 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-sky-400 font-bold">{type.code}</td>
                                                    <td className="px-6 py-4 font-medium text-white">{type.name}</td>
                                                    <td className="px-6 py-4 text-gray-400 max-w-sm truncate">{type.description}</td>
                                                    {showInactive && (
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${type.status === 'Active' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                                                                {type.status === 'Active' ? 'Activo' : 'Inactivo'}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 text-center font-medium">{usageCount}</td>
                                                    <td className="px-6 py-4 text-right space-x-4">
                                                        <button onClick={() => handleEdit(type)} className="font-medium text-sky-400 hover:text-sky-300">Editar</button>
                                                        <button 
                                                            onClick={() => handleToggleStatus(type)}
                                                            disabled={isInUse && type.status === 'Active'}
                                                            className={`font-medium disabled:cursor-not-allowed disabled:text-gray-600 disabled:hover:text-gray-600 ${
                                                                type.status === 'Active' 
                                                                    ? 'text-yellow-500 hover:text-yellow-400' 
                                                                    : 'text-green-500 hover:text-green-400'
                                                            }`}
                                                            title={
                                                                isInUse && type.status === 'Active' ? `No se puede desactivar. Usado por ${usageCount} docs.`
                                                                : type.status === 'Active' ? 'Desactivar tipo' 
                                                                : 'Activar tipo'
                                                            }
                                                        >
                                                            {type.status === 'Active' ? 'Desactivar' : 'Activar'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </main>

                    <footer className="flex justify-end p-4 border-t border-gray-700 flex-shrink-0">
                        <button onClick={handleAddNew} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">
                            Crear Nuevo Tipo
                        </button>
                    </footer>
                </div>
            </div>
            {isFormModalOpen && (
                 <DocumentTypeFormModal
                    key={editingType ? editingType.id : 'add'}
                    isOpen={isFormModalOpen}
                    onClose={() => setFormModalOpen(false)}
                    onSave={handleSaveForm}
                    initialData={editingType}
                    mode={editingType ? 'edit' : 'add'}
                    existingIds={documentTypes.map(t => t.id)}
                />
            )}
        </>
    );
};
