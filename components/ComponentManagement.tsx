
import React, { useState, useMemo } from 'react';
import type { Component } from '../types';
import { mockComponents, addComponent, updateComponent, mockDocuments, mockAmps } from '../data/mockDatabase';
import { TagIcon, SearchIcon, ChevronUpIcon, ChevronDownIcon, LinkIcon, BookOpenIcon, FunnelIcon } from './Icons';
import { ComponentEditModal } from './ComponentEditModal';

type SortableComponentKeys = 'partNumber' | 'description' | 'status' | 'lastModifiedDate';

export const ComponentManagement: React.FC = () => {
    const [components, setComponents] = useState<Component[]>(mockComponents);
    const [sortConfig, setSortConfig] = useState<{ key: SortableComponentKeys; direction: 'ascending' | 'descending' } | null>(null);
    const [showInactive, setShowInactive] = useState(false);
    
    // Column Filters
    const [filters, setFilters] = useState({
        partNumber: '',
        description: '',
        ampIds: '',
        sourceDocumentIds: ''
    });

    // Modal State
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingComponent, setEditingComponent] = useState<Component | null>(null);

    const handleOpenAdd = () => {
        setEditingComponent(null);
        setModalOpen(true);
    };

    const handleOpenEdit = (comp: Component) => {
        setEditingComponent(comp);
        setModalOpen(true);
    };

    const handleSave = (comp: Component) => {
        if (editingComponent) {
            updateComponent(comp);
        } else {
            addComponent(comp);
        }
        setComponents([...mockComponents]);
        setModalOpen(false);
    };

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const processedComponents = useMemo(() => {
        let items = showInactive ? [...components] : components.filter(c => c.status === 'Active');

        // Apply Column Filters
        items = items.filter(c => {
            const ampsString = (c.ampIds || []).map(id => mockAmps.find(a => a.id === id)?.name || id).join(' ').toLowerCase();
            const docsString = (c.sourceDocumentIds || []).map(id => mockDocuments.find(d => d.id === id)?.title || id).join(' ').toLowerCase();

            return (
                c.partNumber.toLowerCase().includes(filters.partNumber.toLowerCase()) &&
                (c.description.toLowerCase().includes(filters.description.toLowerCase()) || c.notes.toLowerCase().includes(filters.description.toLowerCase())) &&
                ampsString.includes(filters.ampIds.toLowerCase()) &&
                docsString.includes(filters.sourceDocumentIds.toLowerCase())
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
    }, [components, filters, sortConfig, showInactive]);

    const requestSort = (key: SortableComponentKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader: React.FC<{ 
        sortKey?: SortableComponentKeys; 
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
                        <TagIcon className="h-6 w-6 text-sky-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Catálogo de Componentes (P/N)</h2>
                        <p className="text-xs text-gray-400">Base de datos de ingeniería de partes aprobadas.</p>
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
                            + Crear Componente
                        </button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-gray-300">
                            <thead className="bg-gray-900/50 border-b border-gray-600">
                                <tr>
                                    <SortableHeader label="Part Number" sortKey="partNumber" filterKey="partNumber" placeholder="Buscar P/N..." />
                                    <SortableHeader label="Descripción / Notas" sortKey="description" filterKey="description" placeholder="Buscar texto..." />
                                    <SortableHeader label="AMPs Asignados" filterKey="ampIds" placeholder="Nombre AMP" />
                                    <SortableHeader label="Doc. Origen" filterKey="sourceDocumentIds" placeholder="Ref. Doc" />
                                    {showInactive && <th scope="col" className="px-4 py-3 align-top font-bold text-xs uppercase tracking-wider text-gray-300">Estado</th>}
                                    <th scope="col" className="px-4 py-3 align-top"><span className="sr-only">Acciones</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {processedComponents.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500 italic">
                                            No se encontraron componentes que coincidan con los filtros.
                                        </td>
                                    </tr>
                                ) : (
                                    processedComponents.map((item) => {
                                        const sourceDocs = item.sourceDocumentIds.map(id => mockDocuments.find(d => d.id === id)).filter(Boolean);
                                        const assignedAmps = (item.ampIds || []).map(id => mockAmps.find(a => a.id === id)).filter(Boolean);

                                        return <tr key={item.id} className="hover:bg-gray-700/40 transition-colors">
                                            <td className="px-4 py-3 font-bold text-sky-400 font-mono whitespace-nowrap">{item.partNumber}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-white">{item.description}</div>
                                                {item.notes && <div className="text-xs text-gray-500 truncate max-w-xs">{item.notes}</div>}
                                            </td>
                                            <td className="px-4 py-3">
                                                {assignedAmps.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {assignedAmps.filter(amp => amp).map(amp => <span key={amp.id} className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-300 border border-gray-600 truncate max-w-[100px]" title={amp.name}>{amp.name}</span>)}
                                                    </div>
                                                ) : <span className="text-gray-500 text-xs">N/A</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                {sourceDocs.length > 0 ? (
                                                    <div className="flex flex-col gap-1">
                                                        {sourceDocs.map(doc => {
                                                            if (!doc) return null;
                                                            const hasLink = doc.internalLink || doc.officialLink;
                                                            if (hasLink) {
                                                                return <a key={doc.id} href={doc.internalLink || doc.officialLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 hover:underline cursor-pointer" title={doc.title}><LinkIcon className="h-3 w-3" /><span>{doc.docType}-{doc.id} (R{doc.revision})</span></a>;
                                                            }
                                                            return <div key={doc.id} className="flex items-center gap-1 text-xs text-gray-300" title={doc.title}><LinkIcon className="h-3 w-3" /><span>{doc.docType}-{doc.id} (R{doc.revision})</span></div>;
                                                        })}
                                                    </div>
                                                ) : <span className="text-gray-500 text-xs">N/A</span>}
                                            </td>
                                            {showInactive && (
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Active' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                                                        {item.status === 'Active' ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                            )}
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => handleOpenEdit(item)} className="text-sky-400 hover:text-white transition-colors" title="Editar">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>;
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <ComponentEditModal
                    isOpen={isModalOpen}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                    component={editingComponent}
                />
            )}
        </div>
    );
};
