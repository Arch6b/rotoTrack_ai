
import React, { useState, useMemo, useEffect } from 'react';
import type { OperationType, Aircraft } from '../types';
import { XMarkIcon } from './Icons';
import { OperationTypeFormModal } from './OperationTypeFormModal';
import { addOperationType, updateOperationType, mockOperationTypes } from '../data/mockDatabase';

interface OperationTypeManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    operationTypes: OperationType[];
    aircrafts: Aircraft[];
}

export const OperationTypeManagementModal: React.FC<OperationTypeManagementModalProps> = ({ isOpen, onClose, operationTypes, aircrafts }) => {
    // Local state to manage UI changes instantly. It's synced with props when the modal opens.
    const [localOpTypes, setLocalOpTypes] = useState<OperationType[]>([]);
    const [showInactive, setShowInactive] = useState(false);
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingOpType, setEditingOpType] = useState<OperationType | null>(null);

    // Effect to synchronize local state with the main database state when the modal is opened.
    useEffect(() => {
        if (isOpen) {
            // Create a deep copy to avoid direct mutation of props
            setLocalOpTypes(JSON.parse(JSON.stringify(operationTypes)));
        }
    }, [isOpen, operationTypes]);
    
    // Memoized calculation for aircraft usage, only recalculated when data changes.
    const aircraftUsageMap = useMemo(() => {
        const usage = new Map<string, number>();
        aircrafts.forEach(ac => {
            ac.operationTypeIds.forEach(opId => {
                usage.set(opId, (usage.get(opId) || 0) + 1);
            });
        });
        return usage;
    }, [aircrafts]);

    const getAircraftUsageCount = (opTypeId: string): number => {
        return aircraftUsageMap.get(opTypeId) || 0;
    };

    /**
     * Handles toggling the status of an operation type.
     * This is now a direct action, without checks for linked aircraft.
     * It updates the mock database and then the local state for an immediate UI refresh.
     */
    const handleToggleStatus = (opTypeToToggle: OperationType) => {
        const updatedOpType: OperationType = {
            ...opTypeToToggle,
            status: opTypeToToggle.status === 'Active' ? 'Inactive' : 'Active',
        };

        // 1. Persist the change in the central data source
        updateOperationType(updatedOpType);

        // 2. Update the local state to trigger an instant re-render of the modal
        setLocalOpTypes(prevTypes => 
            prevTypes.map(ot => ot.id === updatedOpType.id ? updatedOpType : ot)
        );
    };

    const handleEdit = (opType: OperationType) => {
        setEditingOpType(opType);
        setFormModalOpen(true);
    };
    
    const handleAddNew = () => {
        setEditingOpType(null);
        setFormModalOpen(true);
    };

    const handleSaveForm = (opTypeData: OperationType) => {
        if (editingOpType) { // Editing existing
            updateOperationType(opTypeData);
        } else { // Adding new
            try {
                addOperationType(opTypeData);
            } catch (error: any) {
                alert(error.message);
                return; // Prevent closing the form on error
            }
        }
        // Refresh local state from the "source of truth" after save
        setLocalOpTypes(JSON.parse(JSON.stringify(mockOperationTypes)));
        setFormModalOpen(false);
        setEditingOpType(null);
    };
    
    // Memoized list for display, reacting to filter changes.
    const displayedOpTypes = useMemo(() => {
        const sorted = [...localOpTypes].sort((a, b) => a.id.localeCompare(b.id));
        if (showInactive) {
            return sorted;
        }
        return sorted.filter(ot => ot.status === 'Active');
    }, [localOpTypes, showInactive]);


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
                        <h2 id="modal-title" className="text-xl font-bold text-white">Gestionar Tipos de Operación</h2>
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
                                            <th scope="col" className="px-6 py-3 text-center">Aeronaves Vinculadas</th>
                                            <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {displayedOpTypes.map((opType) => (
                                            <tr key={opType.id} className="hover:bg-gray-700/40 transition-colors">
                                                <td className="px-6 py-4 font-mono text-sky-400">{opType.id}</td>
                                                <td className="px-6 py-4 font-medium text-white">{opType.name}</td>
                                                <td className="px-6 py-4 text-gray-400 max-w-sm truncate">{opType.description}</td>
                                                {showInactive && (
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${opType.status === 'Active' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                                                            {opType.status === 'Active' ? 'Activo' : 'Inactivo'}
                                                        </span>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 text-center font-medium">{getAircraftUsageCount(opType.id)}</td>
                                                <td className="px-6 py-4 text-right space-x-4">
                                                    <button onClick={() => handleEdit(opType)} className="font-medium text-sky-400 hover:text-sky-300">Editar</button>
                                                    <button 
                                                        onClick={() => handleToggleStatus(opType)} 
                                                        className={`font-medium ${
                                                            opType.status === 'Active' 
                                                                ? 'text-yellow-500 hover:text-yellow-400' 
                                                                : 'text-green-500 hover:text-green-400'
                                                        }`}
                                                        title={opType.status === 'Active' ? "Desactivar tipo" : "Activar tipo"}
                                                    >
                                                        {opType.status === 'Active' ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
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
                <OperationTypeFormModal
                    key={editingOpType ? editingOpType.id : 'add'}
                    isOpen={isFormModalOpen}
                    onClose={() => setFormModalOpen(false)}
                    onSave={handleSaveForm}
                    initialData={editingOpType}
                    mode={editingOpType ? 'edit' : 'add'}
                    existingIds={operationTypes.map(ot => ot.id)}
                />
            )}
        </>
    );
};
