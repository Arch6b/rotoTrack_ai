
import React, { useState, useMemo, useEffect } from 'react';
import type { OrganizationType, Organization } from '../types';
import { XMarkIcon } from './Icons';
import { OrganizationTypeFormModal } from './OrganizationTypeFormModal';
import { addOrganizationType, updateOrganizationType, mockOrganizationTypes } from '../data/mockDatabase';

interface OrganizationTypeManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    organizationTypes: OrganizationType[];
    organizations: Organization[];
}

export const OrganizationTypeManagementModal: React.FC<OrganizationTypeManagementModalProps> = ({ isOpen, onClose, organizationTypes, organizations }) => {
    const [localOrgTypes, setLocalOrgTypes] = useState<OrganizationType[]>([]);
    const [showInactive, setShowInactive] = useState(false);
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingOrgType, setEditingOrgType] = useState<OrganizationType | null>(null);

    useEffect(() => {
        if (isOpen) {
            setLocalOrgTypes(JSON.parse(JSON.stringify(organizationTypes)));
        }
    }, [isOpen, organizationTypes]);
    
    const usageMap = useMemo(() => {
        const usage = new Map<string, number>();
        organizations.forEach(org => {
            usage.set(org.typeId, (usage.get(org.typeId) || 0) + 1);
        });
        return usage;
    }, [organizations]);

    const getUsageCount = (typeId: string): number => {
        return usageMap.get(typeId) || 0;
    };
    
    const handleToggleStatus = (typeToToggle: OrganizationType) => {
        const usageCount = getUsageCount(typeToToggle.id);
        if (usageCount > 0 && typeToToggle.status === 'Active') {
            alert(`No se puede desactivar. Usado por ${usageCount} organización(es).`);
            return;
        }

        const updatedType: OrganizationType = {
            ...typeToToggle,
            status: typeToToggle.status === 'Active' ? 'Inactive' : 'Active',
        };
        updateOrganizationType(updatedType);
        setLocalOrgTypes(prevTypes => 
            prevTypes.map(ot => ot.id === updatedType.id ? updatedType : ot)
        );
    };
    
    const handleAddNew = () => {
        setEditingOrgType(null);
        setFormModalOpen(true);
    };

    const handleEdit = (orgType: OrganizationType) => {
        setEditingOrgType(orgType);
        setFormModalOpen(true);
    };

    const handleSaveForm = (orgTypeData: OrganizationType) => {
        if (editingOrgType) {
            updateOrganizationType(orgTypeData);
        } else {
             try {
                addOrganizationType(orgTypeData);
            } catch (error: any) {
                alert(error.message);
                return;
            }
        }
        setLocalOrgTypes(JSON.parse(JSON.stringify(mockOrganizationTypes)));
        setFormModalOpen(false);
        setEditingOrgType(null);
    };


    const displayedOpTypes = useMemo(() => {
        const sorted = [...localOrgTypes].sort((a, b) => a.id.localeCompare(b.id));
        if (showInactive) {
            return sorted;
        }
        return sorted.filter(ot => ot.status === 'Active');
    }, [localOrgTypes, showInactive]);


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
                        <h2 id="modal-title" className="text-xl font-bold text-white">Gestionar Tipos de Organización</h2>
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
                                            <th scope="col" className="px-6 py-3">ID (Clave)</th>
                                            <th scope="col" className="px-6 py-3">Nombre</th>
                                            <th scope="col" className="px-6 py-3">Descripción</th>
                                            {showInactive && <th scope="col" className="px-6 py-3">Estado</th>}
                                            <th scope="col" className="px-6 py-3 text-center">Organizaciones Vinculadas</th>
                                            <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {displayedOpTypes.map((orgType) => {
                                            const usageCount = getUsageCount(orgType.id);
                                            const isInUse = usageCount > 0;
                                            return (
                                                <tr key={orgType.id} className="hover:bg-gray-700/40 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-sky-400">{orgType.id}</td>
                                                    <td className="px-6 py-4 font-medium text-white">{orgType.name}</td>
                                                    <td className="px-6 py-4 text-gray-400 max-w-sm truncate">{orgType.description}</td>
                                                    {showInactive && (
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${orgType.status === 'Active' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                                                                {orgType.status === 'Active' ? 'Activo' : 'Inactivo'}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 text-center font-medium">{usageCount}</td>
                                                    <td className="px-6 py-4 text-right space-x-4">
                                                        <button onClick={() => handleEdit(orgType)} className="font-medium text-sky-400 hover:text-sky-300">Editar</button>
                                                        <button 
                                                            onClick={() => handleToggleStatus(orgType)}
                                                            disabled={isInUse && orgType.status === 'Active'}
                                                            className={`font-medium disabled:cursor-not-allowed disabled:text-gray-600 disabled:hover:text-gray-600 ${
                                                                orgType.status === 'Active' 
                                                                    ? 'text-yellow-500 hover:text-yellow-400' 
                                                                    : 'text-green-500 hover:text-green-400'
                                                            }`}
                                                            title={
                                                                isInUse && orgType.status === 'Active' ? `No se puede desactivar. Usado por ${usageCount} organización(es).`
                                                                : orgType.status === 'Active' ? 'Desactivar tipo' 
                                                                : 'Activar tipo'
                                                            }
                                                        >
                                                            {orgType.status === 'Active' ? 'Desactivar' : 'Activar'}
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
                 <OrganizationTypeFormModal
                    key={editingOrgType ? editingOrgType.id : 'add'}
                    isOpen={isFormModalOpen}
                    onClose={() => setFormModalOpen(false)}
                    onSave={handleSaveForm}
                    initialData={editingOrgType}
                    mode={editingOrgType ? 'edit' : 'add'}
                    existingIds={organizationTypes.map(ot => ot.id)}
                />
            )}
        </>
    );
};
