
import React, { useState, useMemo } from 'react';
import type { Tolerance, Document, AMP } from '../types';
import { mockTolerances, mockDocuments, mockAmps } from '../data/mockDatabase';
import { ChevronUpIcon, ChevronDownIcon, SearchIcon, LinkIcon, AdjustmentsHorizontalIcon } from './Icons';

// FIX: Removed 'sourceDocumentId' as it's not a valid sortable key for a list of IDs.
type SortableToleranceKeys = 'id' | 'title' | 'tolerance' | 'lastModifiedDate';

const baseAmpColors = [ 'bg-gray-700 text-gray-300', 'bg-slate-700 text-slate-300', 'bg-zinc-700 text-zinc-300', 'bg-neutral-700 text-neutral-300' ];
const ampColorCache: Record<string, string> = {};
let ampColorIndex = 0;

const getAmpColor = (ampId: string) => {
    if (!ampColorCache[ampId]) {
        ampColorCache[ampId] = baseAmpColors[ampColorIndex % baseAmpColors.length];
        ampColorIndex++;
    }
    return ampColorCache[ampId];
};

export const ToleranceManagement: React.FC = () => {
    const [sortConfig, setSortConfig] = useState<{ key: SortableToleranceKeys; direction: 'ascending' | 'descending' } | null>(null);
    const [filter, setFilter] = useState('');

    const processedTolerances = useMemo(() => {
        let items = [...mockTolerances];

        if (filter) {
            const searchTerm = filter.toLowerCase();
            items = items.filter(tol => {
                // FIX: Changed from 'sourceDocumentId' to 'sourceDocumentIds' and handle multiple documents.
                const docs = tol.sourceDocumentIds.map(did => mockDocuments.find(d => d.id === did)?.title).join(' ');
                const amps = tol.applicableAmpIds.map(aid => mockAmps.find(a => a.id === aid)?.name).join(' ');
                return Object.values(tol).some(val => String(val).toLowerCase().includes(searchTerm)) ||
                       (docs && docs.toLowerCase().includes(searchTerm)) ||
                       (amps && amps.toLowerCase().includes(searchTerm));
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
    }, [filter, sortConfig]);

    const requestSort = (key: SortableToleranceKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader: React.FC<{ sortKey: SortableToleranceKeys; children: React.ReactNode }> = ({ sortKey, children }) => {
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
        <div className="space-y-4">
            <div className="flex justify-between items-center gap-4 flex-wrap bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                    <AdjustmentsHorizontalIcon className="h-8 w-8 text-sky-400" />
                    <div>
                        <h2 className="text-xl font-semibold text-white">Gestión de Tolerancias de Mantenimiento</h2>
                        <p className="text-sm text-gray-400">Define las tolerancias permitidas para las tareas de mantenimiento según la documentación oficial.</p>
                    </div>
                </div>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="h-5 w-5 text-gray-400" /></div>
                    <input type="text" placeholder="Filtrar tolerancias..." value={filter} onChange={e => setFilter(e.target.value)} className="block w-full rounded-md border-0 bg-gray-700 py-1.5 pl-10 pr-3 text-gray-200 ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-sky-500 sm:text-sm" />
                </div>
            </div>

            <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-300">
                        <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase tracking-wider">
                            <tr>
                                <SortableHeader sortKey="id">ID</SortableHeader>
                                <SortableHeader sortKey="title">Título</SortableHeader>
                                <SortableHeader sortKey="tolerance">Tolerancia</SortableHeader>
                                <th scope="col" className="px-6 py-3">Documento Origen</th>
                                <th scope="col" className="px-6 py-3">AMPs Aplicables</th>
                                <th scope="col" className="px-6 py-3">Notas</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {processedTolerances.map(tol => {
                                // FIX: Changed from 'sourceDocumentId' to 'sourceDocumentIds' and handle multiple documents.
                                const sourceDocs = tol.sourceDocumentIds.map(did => mockDocuments.find(d => d.id === did)).filter(d => d);
                                return (
                                    <tr key={tol.id} className="hover:bg-gray-700/40">
                                        <td className="px-6 py-4 font-mono text-cyan-400">{tol.id}</td>
                                        <td className="px-6 py-4 font-medium text-white max-w-sm" title={tol.description}>{tol.title}</td>
                                        <td className="px-6 py-4 font-mono">{tol.tolerance}</td>
                                        <td className="px-6 py-4 text-xs font-mono">
                                            {sourceDocs.length > 0 && sourceDocs[0] ? (
                                                <div className="flex items-center gap-2">
                                                    <a href="#" className="flex items-center gap-1 text-sky-400 hover:underline" title={sourceDocs[0].title}>
                                                        <LinkIcon className="h-4 w-4" /> {sourceDocs[0].docType}-{sourceDocs[0].id}
                                                    </a>
                                                    {sourceDocs.length > 1 && (
                                                        <span className="text-gray-400 bg-gray-700 px-1.5 py-0.5 rounded-full text-xs" title={sourceDocs.slice(1).map(d => d?.title).join(', ')}>
                                                          +{sourceDocs.length - 1}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : <span className="text-gray-500">N/A</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {tol.applicableAmpIds.map(ampId => {
                                                    const amp = mockAmps.find(a => a.id === ampId);
                                                    return amp ? <span key={ampId} className={`text-xs font-medium px-2 py-1 rounded-full ${getAmpColor(ampId)}`}>{amp.name}</span> : null;
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate" title={tol.notes}>{tol.notes}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="font-medium text-sky-400 hover:text-sky-300">Editar</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
