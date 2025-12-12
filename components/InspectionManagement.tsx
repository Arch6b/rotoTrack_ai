
import React, { useState, useMemo } from 'react';
import type { Inspection } from '../types';
import { mockInspections, mockDocuments, mockAmps, mockFactorDefinitions, addInspection, updateInspection } from '../data/mockDatabase';
import { InspectionsIcon, ChevronUpIcon, ChevronDownIcon, FunnelIcon } from './Icons';
import { InspectionEditModal } from './InspectionEditModal';

type SortableInspectionKeys = 'id' | 'title' | 'ampId' | 'status' | 'lastModifiedDate';

export const InspectionManagement: React.FC = () => {
    // Inspection State
    const [inspections, setInspections] = useState<Inspection[]>(mockInspections);
    const [sortConfig, setSortConfig] = useState<{ key: SortableInspectionKeys; direction: 'ascending' | 'descending' } | null>(null);
    const [showInactive, setShowInactive] = useState(false);
    
    // Column Filters
    const [filters, setFilters] = useState({
        id: '',
        title: '',
        documentReference: '',
        ampId: '',
        intervals: '',
        zone: ''
    });
    
    // Modal State
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);

    const handleOpenAdd = () => {
        setEditingInspection(null);
        setModalOpen(true);
    };

    const handleOpenEdit = (insp: Inspection) => {
        setEditingInspection(insp);
        setModalOpen(true);
    };

    const handleSave = (insp: Inspection) => {
        if (editingInspection) {
            updateInspection(insp);
        } else {
            addInspection(insp);
        }
        setInspections([...mockInspections]); // Refresh local list from DB
        setModalOpen(false);
    };

    const handleToggleStatus = (insp: Inspection) => {
        const updatedInsp = { 
            ...insp, 
            status: insp.status === 'Active' ? 'Inactive' : 'Active' as 'Active' | 'Inactive'
        };
        updateInspection(updatedInsp);
        setInspections([...mockInspections]);
    };

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const processedInspections = useMemo(() => {
        let items = showInactive ? [...inspections] : inspections.filter(i => i.status === 'Active');

        // Apply Column Filters
        items = items.filter(i => {
            // Helper for interval string matching
            const intervalString = i.intervals.map(int => {
                const def = mockFactorDefinitions.find(f => f.id === int.factorId);
                return def ? `${int.value} ${def.name}` : `${int.value} ${int.factorId}`;
            }).join(' ').toLowerCase();

            const amp = mockAmps.find(a => a.id === i.ampId);
            const ampName = amp ? amp.name.toLowerCase() : '';

            return (
                i.id.toLowerCase().includes(filters.id.toLowerCase()) &&
                (i.title.toLowerCase().includes(filters.title.toLowerCase()) || i.description.toLowerCase().includes(filters.title.toLowerCase())) &&
                i.documentReference.toLowerCase().includes(filters.documentReference.toLowerCase()) &&
                ampName.includes(filters.ampId.toLowerCase()) &&
                intervalString.includes(filters.intervals.toLowerCase()) &&
                ((i.zone || '').toLowerCase().includes(filters.zone.toLowerCase()) || (i.skillRequired || '').toLowerCase().includes(filters.zone.toLowerCase()))
            );
        });

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
    }, [inspections, filters, sortConfig, showInactive]);

    const requestSort = (key: SortableInspectionKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader: React.FC<{ 
        sortKey?: SortableInspectionKeys; 
        label: string; 
        filterKey?: keyof typeof filters;
        placeholder?: string;
    }> = ({ sortKey, label, filterKey, placeholder }) => {
        const isSorted = sortKey && sortConfig?.key === sortKey;
        const indicator = isSorted 
            ? (sortConfig?.direction === 'ascending' ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />)
            : (sortKey ? <ChevronUpIcon className="h-4 w-4 ml-1 text-gray-500" /> : null);

        return (
            <th scope="col" className="px-4 py-3 align-top">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center">
                        {sortKey ? (
                            <button onClick={() => requestSort(sortKey)} className="flex items-center group focus:outline-none font-bold text-xs uppercase tracking-wider text-gray-300 hover:text-white">
                                {label}
                                <span className={isSorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}>{indicator}</span>
                            </button>
                        ) : (
                            <span className="font-bold text-xs uppercase tracking-wider text-gray-300">{label}</span>
                        )}
                    </div>
                    {filterKey && (
                        <div className="relative">
                            <input 
                                type="text" 
                                value={filters[filterKey]}
                                onChange={(e) => handleFilterChange(filterKey, e.target.value)}
                                placeholder={placeholder || "Filtrar..."}
                                className="w-full bg-gray-800 text-xs text-white border border-gray-600 rounded px-2 py-1 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 placeholder-gray-500"
                                onClick={(e) => e.stopPropagation()}
                            />
                            {filters[filterKey] && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleFilterChange(filterKey, ''); }}
                                    className="absolute right-1 top-1 text-gray-500 hover:text-white"
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </th>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-900/30 rounded-lg border border-sky-700/50">
                        <InspectionsIcon className="h-6 w-6 text-sky-400"/>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Tareas de Inspección</h1>
                        <p className="text-xs text-gray-400">Gestiona el catálogo de tareas del AMP.</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <label className="flex items-center text-sm text-gray-300 cursor-pointer bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={() => setShowInactive(!showInactive)}
                            className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-sky-500 focus:ring-sky-600"
                        />
                        <span className="ml-2">Ver Inactivos</span>
                    </label>
                    <button onClick={handleOpenAdd} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors whitespace-nowrap">
                        + Nueva Tarea
                    </button>
                </div>
            </div>

            <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-300">
                        <thead className="bg-gray-900/50 border-b border-gray-600">
                            <tr>
                                <SortableHeader label="ID Tarea" sortKey="id" filterKey="id" placeholder="Ej: 05-20..." />
                                <SortableHeader label="Descripción / Título" sortKey="title" filterKey="title" placeholder="Buscar texto..." />
                                <SortableHeader label="Referencia Doc." filterKey="documentReference" placeholder="Ref. AMM/AD" />
                                <SortableHeader label="AMP" sortKey="ampId" filterKey="ampId" placeholder="Nombre AMP" />
                                <SortableHeader label="Intervalo(s)" filterKey="intervals" placeholder="Ej: 100 FH" />
                                <SortableHeader label="Zona / Skill" filterKey="zone" placeholder="Zona..." />
                                {showInactive && <th scope="col" className="px-4 py-3 align-top font-bold text-xs uppercase tracking-wider text-gray-300">Estado</th>}
                                <th scope="col" className="px-4 py-3 align-top"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {processedInspections.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500 italic">
                                        No se encontraron tareas que coincidan con los filtros.
                                    </td>
                                </tr>
                            ) : (
                                processedInspections.map(item => {
                                    const sourceDocs = item.sourceDocumentIds.map(id => mockDocuments.find(d => d.id === id)).filter(Boolean);
                                    const amp = mockAmps.find(a => a.id === item.ampId);
                                    
                                    const intervalDisplay = item.intervals.map(int => {
                                        const def = mockFactorDefinitions.find(f => f.id === int.factorId);
                                        return def ? `${int.value} ${def.name}` : `${int.value} ${int.factorId}`;
                                    }).join(' / ');

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-700/40 transition-colors">
                                            <td className="px-4 py-3 font-mono text-sky-400 font-medium whitespace-nowrap">{item.id}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-white">{item.title}</div>
                                                {item.description && <div className="text-xs text-gray-400 truncate max-w-xs" title={item.description}>{item.description}</div>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-xs font-mono">
                                                    <span className="block text-gray-300 font-bold mb-1">{item.documentReference}</span>
                                                    {sourceDocs.length > 0 ? (
                                                        <div className="flex flex-col gap-0.5 opacity-75">
                                                            {sourceDocs.map(doc => doc && (
                                                                <span key={doc.id}>{doc.docType}-{doc.id}</span>
                                                            ))}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                {amp ? (
                                                    <span className="bg-gray-700 px-2 py-1 rounded border border-gray-600 inline-block max-w-[120px] truncate" title={amp.name}>{amp.name}</span>
                                                ) : <span className="text-red-400">N/A</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                {intervalDisplay ? (
                                                    <span className="inline-block bg-sky-900/40 text-sky-300 px-2 py-1 rounded text-xs font-medium border border-sky-800 whitespace-nowrap">
                                                        {intervalDisplay}
                                                    </span>
                                                ) : <span className="text-gray-500 text-xs">-</span>}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-300">
                                                <div className="flex flex-col">
                                                    {item.zone && <span>Z: <span className="font-mono text-white">{item.zone}</span></span>}
                                                    {item.skillRequired && <span>Skill: <span className="font-mono text-white">{item.skillRequired}</span></span>}
                                                    {item.manHours ? <span>MH: {item.manHours}</span> : null}
                                                </div>
                                            </td>
                                            {showInactive && (
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Active' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                                                        {item.status === 'Active' ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                            )}
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleOpenEdit(item)} className="text-sky-400 hover:text-white transition-colors" title="Editar">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                        </svg>
                                                    </button>
                                                </div>
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
                <InspectionEditModal
                    isOpen={isModalOpen}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                    inspection={editingInspection}
                />
            )}
        </div>
    );
};
