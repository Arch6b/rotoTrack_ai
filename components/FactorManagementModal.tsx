
import React, { useState, useEffect, useMemo } from 'react';
import type { FactorDefinition, Fleet } from '../types';
import { XMarkIcon } from './Icons';
import { FactorFormModal } from './FactorFormModal';
import { addFactorDefinition, updateFactorDefinition, mockFactorDefinitions } from '../data/mockDatabase';

interface FactorManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    factorDefinitions: FactorDefinition[];
    fleets: Fleet[];
}

const valueTypeClasses: { [key: string]: string } = {
    integer: 'bg-blue-900 text-blue-300',
    float: 'bg-purple-900 text-purple-300',
    boolean: 'bg-green-900 text-green-300',
    string: 'bg-gray-700 text-gray-300',
};

export const FactorManagementModal: React.FC<FactorManagementModalProps> = ({ isOpen, onClose, factorDefinitions, fleets }) => {
    const [localFactors, setLocalFactors] = useState<FactorDefinition[]>([]);
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingFactor, setEditingFactor] = useState<FactorDefinition | null>(null);
    const [showInactive, setShowInactive] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLocalFactors(JSON.parse(JSON.stringify(factorDefinitions)));
        }
    }, [isOpen, factorDefinitions]);

    const fleetUsageMap = useMemo(() => {
        const usage = new Map<string, number>();
        fleets.forEach(f => {
            f.customFactors.forEach(cf => {
                usage.set(cf.factorId, (usage.get(cf.factorId) || 0) + 1);
            });
        });
        return usage;
    }, [fleets]);

    const getFleetUsageCount = (factorId: string): number => {
        return fleetUsageMap.get(factorId) || 0;
    };
    
    const handleToggleStatus = (factorToToggle: FactorDefinition) => {
        const updatedFactor: FactorDefinition = {
            ...factorToToggle,
            status: factorToToggle.status === 'Active' ? 'Inactive' : 'Active',
        };
        updateFactorDefinition(updatedFactor);
        setLocalFactors(prevFactors => 
            prevFactors.map(f => f.id === updatedFactor.id ? updatedFactor : f)
        );
    };

    const handleAddNew = () => {
        setEditingFactor(null);
        setFormModalOpen(true);
    };

    const handleEdit = (factor: FactorDefinition) => {
        setEditingFactor(factor);
        setFormModalOpen(true);
    };

    const handleSaveForm = (factorData: FactorDefinition) => {
        if (editingFactor) { // Editing
            updateFactorDefinition(factorData);
        } else { // Adding
            try {
                addFactorDefinition(factorData);
            } catch (error: any) {
                alert(error.message);
                return;
            }
        }
        setLocalFactors(JSON.parse(JSON.stringify(mockFactorDefinitions)));
        setFormModalOpen(false);
        setEditingFactor(null);
    };

    const displayedFactors = useMemo(() => {
        const sorted = [...localFactors].sort((a, b) => a.code.localeCompare(b.code));
        if (showInactive) {
            return sorted;
        }
        return sorted.filter(f => f.status === 'Active');
    }, [localFactors, showInactive]);

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
                    className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
                >
                    <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                        <h2 id="modal-title" className="text-xl font-bold text-white">Gestionar Definiciones de Factores</h2>
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
                                            <th scope="col" className="px-6 py-3">Nombre del Factor</th>
                                            <th scope="col" className="px-6 py-3">Tipo de Valor</th>
                                            {showInactive && <th scope="col" className="px-6 py-3">Estado</th>}
                                            <th scope="col" className="px-6 py-3 text-center">Flotas Vinculadas</th>
                                            <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {displayedFactors.map((def) => {
                                            const usageCount = getFleetUsageCount(def.id);
                                            const isInUse = usageCount > 0;
                                            return (
                                                <tr key={def.id} className="hover:bg-gray-700/40 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-sky-400 font-bold">{def.code}</td>
                                                    <td className="px-6 py-4 font-medium text-white">{def.name}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${valueTypeClasses[def.valueType] || valueTypeClasses.string}`}>
                                                            {def.valueType}
                                                        </span>
                                                    </td>
                                                    {showInactive && (
                                                         <td className="px-6 py-4">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${def.status === 'Active' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                                                                {def.status === 'Active' ? 'Activo' : 'Inactivo'}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 text-center font-medium">{usageCount}</td>
                                                    <td className="px-6 py-4 text-right space-x-4">
                                                        <button onClick={() => handleEdit(def)} className="font-medium text-sky-400 hover:text-sky-300">Editar</button>
                                                        <button 
                                                            onClick={() => handleToggleStatus(def)} 
                                                            disabled={isInUse && def.status === 'Active'}
                                                            className={`font-medium disabled:cursor-not-allowed disabled:text-gray-600 disabled:hover:text-gray-600 ${
                                                                def.status === 'Active' 
                                                                    ? 'text-yellow-500 hover:text-yellow-400' 
                                                                    : 'text-green-500 hover:text-green-400'
                                                            }`}
                                                            title={
                                                                isInUse && def.status === 'Active' ? `No se puede desactivar. Usado por ${usageCount} flota(s).`
                                                                : def.status === 'Active' ? 'Desactivar factor' 
                                                                : 'Activar factor'
                                                            }
                                                        >
                                                            {def.status === 'Active' ? 'Desactivar' : 'Activar'}
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
                            Crear Nuevo Factor
                        </button>
                    </footer>
                </div>
            </div>
            {isFormModalOpen && (
                <FactorFormModal
                    isOpen={isFormModalOpen}
                    onClose={() => setFormModalOpen(false)}
                    onSave={handleSaveForm}
                    initialData={editingFactor}
                    mode={editingFactor ? 'edit' : 'add'}
                    existingIds={factorDefinitions.map(f => f.id)}
                />
            )}
        </>
    );
};
