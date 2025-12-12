
import React, { useState, useMemo } from 'react';
import type { AMP, Fleet } from '../types';
import { mockAmps, mockFleets } from '../data/mockDatabase';
import { ChevronUpIcon, ChevronDownIcon, SearchIcon, BookOpenIcon, WorldIcon, LinkIcon, CalendarDaysIcon } from './Icons';

type SortableAmpKeys = 'name' | 'revision' | 'status' | 'revisionDate' | 'lastModifiedDate' | 'nextReviewDate';

const ampStatusColorMap: { [key in NonNullable<AMP['status']>]: string } = {
    Active: 'bg-green-900 text-green-300',
    Superseded: 'bg-gray-700 text-gray-400',
    Draft: 'bg-yellow-900 text-yellow-300',
};

const baseFleetColors = [ 'bg-teal-900/70 text-teal-300', 'bg-fuchsia-900/70 text-fuchsia-300', 'bg-rose-900/70 text-rose-300', 'bg-emerald-900/70 text-emerald-300', 'bg-cyan-900/70 text-cyan-300', 'bg-violet-900/70 text-violet-300' ];
const fleetColorCache: Record<string, string> = {};
let fleetColorIndex = 0;
const getFleetColor = (fleetId: string) => {
    if (!fleetColorCache[fleetId]) {
        fleetColorCache[fleetId] = baseFleetColors[fleetColorIndex % baseFleetColors.length];
        fleetColorIndex++;
    }
    return fleetColorCache[fleetId];
};

interface AmpManagementViewProps {
    onEditAmp: (amp: AMP) => void;
}

export const AmpManagementView: React.FC<AmpManagementViewProps> = ({ onEditAmp }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortableAmpKeys; direction: 'ascending' | 'descending' } | null>({key: 'nextReviewDate', direction: 'ascending'});
    const [filter, setFilter] = useState('');
    const [showInactiveAmps, setShowInactiveAmps] = useState(false);

    const processedAmps = useMemo(() => {
        let items = showInactiveAmps ? [...mockAmps] : mockAmps.filter(amp => amp.status === 'Active');

        if (filter) {
            const searchTerm = filter.toLowerCase();
            items = items.filter(amp => {
                const linkedFleet = mockFleets.find(f => f.id === amp.fleetId);
                return Object.values(amp).some(val => String(val).toLowerCase().includes(searchTerm)) ||
                       (linkedFleet && linkedFleet.name.toLowerCase().includes(searchTerm));
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
    }, [filter, sortConfig, showInactiveAmps]);

    const requestSort = (key: SortableAmpKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const SortableHeader: React.FC<{ sortKey: SortableAmpKeys; children: React.ReactNode }> = ({ sortKey, children }) => {
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
    
    const isDateApproaching = (dateString?: string) => {
        if (!dateString) return { soon: false, overdue: false };
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0,0,0,0); // Compare dates only
        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
            soon: diffDays >= 0 && diffDays <= 30,
            overdue: diffDays < 0
        };
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center gap-4 flex-wrap bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                    <BookOpenIcon className="h-8 w-8 text-sky-400" />
                    <div>
                        <h2 className="text-xl font-semibold text-white">Programas de Mantenimiento de Aeronaves (AMP)</h2>
                        <p className="text-sm text-gray-400">Define y gestiona los programas que rigen el mantenimiento de cada flota.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center text-sm text-gray-300 cursor-pointer whitespace-nowrap">
                        <input
                            type="checkbox"
                            checked={showInactiveAmps}
                            onChange={() => setShowInactiveAmps(prev => !prev)}
                            className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-sky-500 focus:ring-sky-600"
                        />
                        <span className="ml-2">Ver Inactivos y Borradores</span>
                    </label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="h-5 w-5 text-gray-400" /></div>
                        <input type="text" placeholder="Filtrar AMPs..." value={filter} onChange={e => setFilter(e.target.value)} className="block w-full rounded-md border-0 bg-gray-700 py-1.5 pl-10 pr-3 text-gray-200 ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-sky-500 sm:text-sm" />
                    </div>
                </div>
            </div>

            <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-300">
                        <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase tracking-wider">
                            <tr>
                                <SortableHeader sortKey="name">Nombre</SortableHeader>
                                <SortableHeader sortKey="revision">Rev.</SortableHeader>
                                <SortableHeader sortKey="revisionDate">Fecha Rev.</SortableHeader>
                                <SortableHeader sortKey="nextReviewDate">Próx. Revisión</SortableHeader>
                                <th scope="col" className="px-6 py-3">Links</th>
                                {showInactiveAmps && <SortableHeader sortKey="status">Estado</SortableHeader>}
                                <th scope="col" className="px-6 py-3">Flota Vinculada</th>
                                <th scope="col" className="px-6 py-3">Notas</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {processedAmps.map(amp => {
                                const linkedFleet = mockFleets.find(f => f.id === amp.fleetId);
                                const dateStatus = isDateApproaching(amp.nextReviewDate);
                                return (
                                    <tr key={amp.id} className="hover:bg-gray-700/40">
                                        <td className="px-6 py-4 font-medium text-white">{amp.name}</td>
                                        <td className="px-6 py-4 text-center">{amp.revision}</td>
                                        <td className="px-6 py-4">{amp.revisionDate}</td>
                                        <td className={`px-6 py-4 font-medium ${dateStatus.overdue ? 'text-red-400' : dateStatus.soon ? 'text-yellow-300' : ''}`}>
                                            <div className="flex items-center gap-2">
                                                {amp.nextReviewDate ? <CalendarDaysIcon className="h-4 w-4" /> : null}
                                                {amp.nextReviewDate || <span className="text-gray-500">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                {amp.officialLink && <a href={amp.officialLink} target="_blank" rel="noopener noreferrer" title="Ver Aprobación AMP"><WorldIcon className="h-5 w-5 text-gray-400 hover:text-sky-400"/></a>}
                                                {amp.internalLink && <a href={amp.internalLink} target="_blank" rel="noopener noreferrer" title="Enlace Interno (Documento)"><LinkIcon className="h-5 w-5 text-gray-400 hover:text-sky-400"/></a>}
                                            </div>
                                        </td>
                                        {showInactiveAmps && (
                                            <td className="px-6 py-4">
                                                {amp.status && <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ampStatusColorMap[amp.status]}`}>{amp.status}</span>}
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            {linkedFleet ? (
                                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getFleetColor(linkedFleet.id)}`}>{linkedFleet.name}</span>
                                            ) : <span className="text-xs text-gray-500">Ninguna</span>}
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate" title={amp.notes}>{amp.notes}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => onEditAmp(amp)} className="font-medium text-sky-400 hover:text-sky-300">Editar</button>
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
