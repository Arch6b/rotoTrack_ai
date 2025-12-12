
import React, { useState, useEffect, useMemo } from 'react';
import type { WorkOrder, Aircraft, Organization, Document, Inspection } from '../types';
import { mockAircrafts, mockOrganizations, mockDocuments, mockInspections } from '../data/mockDatabase';
import { XMarkIcon, CheckCircleIcon, CalendarDaysIcon, AircraftIcon, DocsIcon, MaintenanceIcon } from './Icons';
import { SearchableSelector } from './SearchableSelector';

interface WorkOrderFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (workOrder: WorkOrder) => void;
    initialData: WorkOrder | null;
    mode: 'add' | 'edit';
}

const emptyWorkOrder: WorkOrder = {
    id: '',
    title: '',
    aircraftRegistration: '',
    status: 'Open',
    type: 'Unscheduled',
    priority: 'Normal',
    creationDate: '',
    dueDate: '',
    assignedToId: '',
    notes: '',
};

export const WorkOrderFormModal: React.FC<WorkOrderFormModalProps> = ({ isOpen, onClose, onSave, initialData, mode }) => {
    const [data, setData] = useState<WorkOrder>(emptyWorkOrder);
    const [errors, setErrors] = useState<Partial<Record<keyof WorkOrder, string>>>({});

    useEffect(() => {
        if (isOpen) {
            setData(initialData || { ...emptyWorkOrder, creationDate: new Date().toISOString().split('T')[0] });
            setErrors({});
        }
    }, [initialData, isOpen]);

    const handleFieldChange = (field: keyof WorkOrder, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validate = () => {
        const newErrors: Partial<Record<keyof WorkOrder, string>> = {};
        if (!data.title) newErrors.title = 'El título es obligatorio.';
        if (!data.aircraftRegistration) newErrors.aircraftRegistration = 'La aeronave es obligatoria.';
        if (!data.dueDate) newErrors.dueDate = 'La fecha de vencimiento es obligatoria.';
        if (data.status === 'Completed' && !data.completionDate) {
             // Optional logic: auto-set completion date if status changes to completed
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSave(data);
        }
    };

    const renderAircraftItem = (ac: Aircraft) => (
        <div className="flex-1 flex justify-between items-center text-sm">
            <span className="font-bold text-white">{ac.registration}</span>
            <span className="text-xs text-gray-400">{ac.model}</span>
        </div>
    );

    const renderOrgItem = (org: Organization) => (
        <div className="flex-1 flex justify-between items-center text-sm">
            <span className="font-medium text-white">{org.name}</span>
            <span className="text-xs text-gray-400">{org.approval || 'N/A'}</span>
        </div>
    );

    const renderDocItem = (doc: Document) => (
        <div className="flex-1 flex justify-between items-center text-sm">
            <span className="font-medium text-white truncate max-w-[200px]">{doc.title}</span>
            <span className="text-xs text-gray-400 font-mono">{doc.docType}-{doc.id}</span>
        </div>
    );

    const renderTaskItem = (task: Inspection) => (
        <div className="flex-1 flex justify-between items-center text-sm">
            <div className="truncate">
                <span className="font-medium text-white block">{task.title}</span>
                <span className="text-xs text-gray-400">{task.id}</span>
            </div>
        </div>
    );

    // Filter Organizations to show only MROs or Maintenance providers
    const maintenanceOrgs = useMemo(() => mockOrganizations.filter(o => o.typeId === 'MRO'), []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">
                        {mode === 'add' ? 'Crear Orden de Trabajo' : `Editar OT: ${data.id}`}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                </header>

                <main className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                    {/* Left Column: Core Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-2">Detalles Principales</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Título / Descripción Corta</label>
                            <input 
                                type="text" 
                                value={data.title} 
                                onChange={e => handleFieldChange('title', e.target.value)} 
                                className={`mt-1 block w-full rounded-md bg-gray-700 text-white ${errors.title ? 'border-red-500 ring-red-500' : 'border-transparent focus:border-sky-500'}`} 
                            />
                            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2"><AircraftIcon className="h-4 w-4"/> Aeronave</label>
                            <div className={`border rounded-md ${errors.aircraftRegistration ? 'border-red-500' : 'border-gray-600'}`}>
                                <SearchableSelector 
                                    items={mockAircrafts.filter(a => a.status === 'Active')}
                                    selectedIds={data.aircraftRegistration ? [data.aircraftRegistration] : []}
                                    onSelectionChange={(ids) => handleFieldChange('aircraftRegistration', ids[0] || '')}
                                    renderItem={renderAircraftItem}
                                    placeholder="Buscar por matrícula..."
                                    maxSelections={1}
                                    itemIdentifier="registration"
                                />
                            </div>
                            {errors.aircraftRegistration && <p className="text-red-400 text-xs mt-1">{errors.aircraftRegistration}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Tipo</label>
                                <select value={data.type} onChange={e => handleFieldChange('type', e.target.value)} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500">
                                    <option value="Scheduled">Programado</option>
                                    <option value="Unscheduled">No Programado</option>
                                    <option value="AD/SB">AD / SB</option>
                                    <option value="Component Change">Cambio Comp.</option>
                                    <option value="Inspection">Inspección</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Prioridad</label>
                                <select value={data.priority} onChange={e => handleFieldChange('priority', e.target.value)} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500">
                                    <option value="Low">Baja</option>
                                    <option value="Normal">Normal</option>
                                    <option value="High">Alta</option>
                                    <option value="Urgent">Urgente (AOG)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Estado</label>
                                <select value={data.status} onChange={e => handleFieldChange('status', e.target.value)} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500">
                                    <option value="Open">Abierta</option>
                                    <option value="In Progress">En Progreso</option>
                                    <option value="Completed">Completada</option>
                                    <option value="Deferred">Diferida</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Vencimiento</label>
                                <input 
                                    type="date" 
                                    value={data.dueDate} 
                                    onChange={e => handleFieldChange('dueDate', e.target.value)} 
                                    className={`mt-1 block w-full rounded-md bg-gray-700 text-white ${errors.dueDate ? 'border-red-500' : 'border-transparent'}`}
                                />
                                {errors.dueDate && <p className="text-red-400 text-xs mt-1">{errors.dueDate}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: References & Assignment */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-2">Referencias y Asignación</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Centro de Mantenimiento (MRO)</label>
                            <div className="h-32 border border-gray-600 rounded-md overflow-hidden flex flex-col">
                                <SearchableSelector 
                                    items={maintenanceOrgs}
                                    selectedIds={data.assignedToId ? [data.assignedToId] : []}
                                    onSelectionChange={(ids) => handleFieldChange('assignedToId', ids[0] || '')}
                                    renderItem={renderOrgItem}
                                    placeholder="Asignar a..."
                                    maxSelections={1}
                                    itemIdentifier="id"
                                />
                            </div>
                        </div>

                        {/* Source Document Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2"><DocsIcon className="h-4 w-4"/> Documento Origen (AD/SB/Manual)</label>
                            <div className="h-32 border border-gray-600 rounded-md overflow-hidden flex flex-col">
                                <SearchableSelector 
                                    items={mockDocuments.filter(d => d.status === 'Active')}
                                    selectedIds={data.sourceDocumentId ? [data.sourceDocumentId] : []}
                                    onSelectionChange={(ids) => handleFieldChange('sourceDocumentId', ids[0])}
                                    renderItem={renderDocItem}
                                    placeholder="Buscar documento..."
                                    maxSelections={1}
                                    itemIdentifier="id"
                                />
                            </div>
                        </div>

                        {/* Task Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2"><MaintenanceIcon className="h-4 w-4"/> Tarea de Mantenimiento (AMP)</label>
                            <div className="h-32 border border-gray-600 rounded-md overflow-hidden flex flex-col">
                                <SearchableSelector 
                                    items={mockInspections.filter(i => i.status === 'Active')}
                                    selectedIds={data.ampTaskId ? [data.ampTaskId] : []}
                                    onSelectionChange={(ids) => handleFieldChange('ampTaskId', ids[0])}
                                    renderItem={renderTaskItem}
                                    placeholder="Buscar tarea..."
                                    maxSelections={1}
                                    itemIdentifier="id"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300">Notas</label>
                            <textarea rows={3} value={data.notes} onChange={e => handleFieldChange('notes', e.target.value)} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500" />
                        </div>
                    </div>
                </main>

                <footer className="flex justify-end items-center p-4 border-t border-gray-700 flex-shrink-0 gap-3">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">Cancelar</button>
                    <button onClick={handleSubmit} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2"><CheckCircleIcon className="h-5 w-5"/> Guardar OT</button>
                </footer>
            </div>
        </div>
    );
};
