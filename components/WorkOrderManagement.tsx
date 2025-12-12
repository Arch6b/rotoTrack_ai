
import React, { useState, useMemo } from 'react';
import type { WorkOrder } from '../types';
import { mockWorkOrders, mockOrganizations, mockDocuments, addWorkOrder, updateWorkOrder } from '../data/mockDatabase';
import { ChevronUpIcon, ChevronDownIcon, SearchIcon, ClipboardDocumentListIcon, LinkIcon } from './Icons';
import { WorkOrderFormModal } from './WorkOrderFormModal';

type SortableWorkOrderKeys = 'id' | 'title' | 'aircraftRegistration' | 'status' | 'type' | 'priority' | 'creationDate' | 'dueDate';

const statusColorMap: { [key in WorkOrder['status']]: string } = {
    Open: 'bg-blue-900 text-blue-300',
    'In Progress': 'bg-yellow-800 text-yellow-200',
    Completed: 'bg-green-900 text-green-300',
    Deferred: 'bg-gray-700 text-gray-400',
};

const priorityColorMap: { [key in WorkOrder['priority']]: string } = {
    Low: 'bg-gray-600 text-gray-200',
    Normal: 'bg-sky-800 text-sky-200',
    High: 'bg-orange-800 text-orange-200',
    Urgent: 'bg-red-800 text-red-200',
};

export const WorkOrderManagement: React.FC = () => {
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>(mockWorkOrders);
    const [sortConfig, setSortConfig] = useState<{ key: SortableWorkOrderKeys; direction: 'ascending' | 'descending' } | null>({ key: 'dueDate', direction: 'ascending' });
    const [filter, setFilter] = useState('');
    
    // Modal State
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
    const [mode, setMode] = useState<'add'|'edit'>('add');

    const handleOpenAdd = () => {
        setEditingOrder(null);
        setMode('add');
        setModalOpen(true);
    };

    const handleOpenEdit = (wo: WorkOrder) => {
        setEditingOrder(wo);
        setMode('edit');
        setModalOpen(true);
    };

    const handleSave = (wo: WorkOrder) => {
        if (mode === 'edit') {
            updateWorkOrder(wo);
        } else {
            addWorkOrder(wo);
        }
        setWorkOrders([...mockWorkOrders]); // Force refresh
        setModalOpen(false);
    };

    const processedWorkOrders = useMemo(() => {
        let items = [...workOrders];

        if (filter) {
            const searchTerm = filter.toLowerCase();
            items = items.filter(wo => {
                const doc = mockDocuments.find(d => d.id === wo.sourceDocumentId);
                const assignedOrg = mockOrganizations.find(o => o.id === wo.assignedToId);
                return Object.values(wo).some(val => String(val).toLowerCase().includes(searchTerm)) ||
                       (doc && doc.title.toLowerCase().includes(searchTerm)) ||
                       (assignedOrg && assignedOrg.name.toLowerCase().includes(searchTerm));
            });
        }
        if (sortConfig) {
            items.sort((a, b) => {
                const aVal = a[sortConfig.key] || '';
                const bVal = b[sortConfig.key] || '';
                if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [workOrders, filter, sortConfig]);

    const requestSort = (key: SortableWorkOrderKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader: React.FC<{ sortKey: SortableWorkOrderKeys; children: React.ReactNode }> = ({ sortKey, children }) => {
        const isSorted = sortConfig?.key === sortKey;
        const indicator = isSorted 
            ? (sortConfig?.direction === 'ascending' ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />)
            : <ChevronUpIcon className="h-4 w-4 ml-1 text-gray-500" />;
        return (
            <th scope="col" className="px-6 py-3">
                <button onClick={() => requestSort(sortKey)} className="flex items-center group focus:outline-none">
                    {children}
                    <span className={isSorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}>{indicator}</span>
                </button>
            </th>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 justify-between items-center bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                    <ClipboardDocumentListIcon className="h-8 w-8 text-sky-400" />
                    <div>
                        <h2 className="text-xl font-semibold text-white">Órdenes de Trabajo (Work Orders)</h2>
                        <p className="text-sm text-gray-400">Gestión de tareas de mantenimiento planificadas y correctivas.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="h-5 w-5 text-gray-400" /></div>
                        <input type="text" placeholder="Filtrar órdenes..." value={filter} onChange={e => setFilter(e.target.value)} className="block w-full rounded-md border-0 bg-gray-700 py-1.5 pl-10 pr-3 text-gray-200 ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-sky-500 sm:text-sm" />
                    </div>
                    <button onClick={handleOpenAdd} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors whitespace-nowrap">
                        Crear Orden
                    </button>
                </div>
            </div>

            <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-300">
                        <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase tracking-wider">
                            <tr>
                                <SortableHeader sortKey="id">ID OT</SortableHeader>
                                <SortableHeader sortKey="status">Estado</SortableHeader>
                                <SortableHeader sortKey="priority">Prioridad</SortableHeader>
                                <SortableHeader sortKey="title">Título / Tarea</SortableHeader>
                                <SortableHeader sortKey="aircraftRegistration">Aeronave</SortableHeader>
                                <th scope="col" className="px-6 py-3">Asignado A</th>
                                <SortableHeader sortKey="dueDate">Vencimiento</SortableHeader>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {processedWorkOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        No hay órdenes de trabajo registradas. Crea una nueva para comenzar.
                                    </td>
                                </tr>
                            ) : (
                                processedWorkOrders.map(wo => {
                                    const assignedOrg = mockOrganizations.find(o => o.id === wo.assignedToId);
                                    const sourceDoc = mockDocuments.find(d => d.id === wo.sourceDocumentId);

                                    return (
                                        <tr key={wo.id} className="hover:bg-gray-700/40">
                                            <td className="px-6 py-4 font-mono text-sky-400">{wo.id}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[wo.status]}`}>
                                                    {wo.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityColorMap[wo.priority]}`}>
                                                    {wo.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-white">{wo.title}</div>
                                                <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                                    <span className="bg-gray-700 px-1 rounded">{wo.type}</span>
                                                    {sourceDoc && (
                                                        <span className="flex items-center gap-1 text-sky-400" title={`Ref: ${sourceDoc.title}`}>
                                                            <LinkIcon className="h-3 w-3"/> {sourceDoc.docType}-{sourceDoc.id}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-white">{wo.aircraftRegistration}</td>
                                            <td className="px-6 py-4 text-xs">
                                                {assignedOrg ? assignedOrg.name : <span className="text-gray-500">-</span>}
                                            </td>
                                            <td className="px-6 py-4 font-mono">
                                                {wo.dueDate}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleOpenEdit(wo)} className="font-medium text-sky-400 hover:text-sky-300">Editar</button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <WorkOrderFormModal 
                    isOpen={isModalOpen}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                    initialData={editingOrder}
                    mode={mode}
                />
            )}
        </div>
    );
};
