
import React, { useState, useMemo } from 'react';
import type { FlightLog } from '../types';
import { mockFlightLogs, addFlightLog, updateFlightLog } from '../data/mockDatabase';
import { PaperAirplaneIcon, SearchIcon, CalendarDaysIcon, ClockIcon, ChevronUpIcon, ChevronDownIcon } from './Icons';
import { FlightLogFormModal } from './FlightLogFormModal';

type SortableLogKeys = 'date' | 'aircraftRegistration' | 'blockTime' | 'flightTime' | 'landings' | 'status';

export const FlightLogManagement: React.FC = () => {
    const [logs, setLogs] = useState<FlightLog[]>(mockFlightLogs);
    const [sortConfig, setSortConfig] = useState<{ key: SortableLogKeys; direction: 'ascending' | 'descending' } | null>({ key: 'date', direction: 'descending' });
    const [filter, setFilter] = useState('');
    
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState<FlightLog | null>(null);
    const [mode, setMode] = useState<'add'|'edit'>('add');

    const handleOpenAdd = () => {
        setEditingLog(null);
        setMode('add');
        setModalOpen(true);
    };

    const handleOpenEdit = (log: FlightLog) => {
        setEditingLog(log);
        setMode('edit');
        setModalOpen(true);
    };

    const handleSave = (log: FlightLog) => {
        if (mode === 'edit') {
            updateFlightLog(log);
        } else {
            addFlightLog(log);
        }
        setLogs([...mockFlightLogs]);
        setModalOpen(false);
    };

    const processedLogs = useMemo(() => {
        let items = [...logs];
        if (filter) {
            const term = filter.toLowerCase();
            items = items.filter(l => 
                l.aircraftRegistration.toLowerCase().includes(term) || 
                l.date.includes(term) ||
                l.pilotName?.toLowerCase().includes(term)
            );
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
    }, [logs, filter, sortConfig]);

    const requestSort = (key: SortableLogKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader: React.FC<{ sortKey: SortableLogKeys; children: React.ReactNode }> = ({ sortKey, children }) => {
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
                    <PaperAirplaneIcon className="h-8 w-8 text-sky-400" />
                    <div>
                        <h2 className="text-xl font-semibold text-white">Registros de Vuelo (TLB)</h2>
                        <p className="text-sm text-gray-400">Control de horas de vuelo, ciclos y tiempos bloque.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="h-5 w-5 text-gray-400" /></div>
                        <input type="text" placeholder="Matrícula, Piloto..." value={filter} onChange={e => setFilter(e.target.value)} className="block w-full rounded-md border-0 bg-gray-700 py-1.5 pl-10 pr-3 text-gray-200 ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-sky-500 sm:text-sm" />
                    </div>
                    <button onClick={handleOpenAdd} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">
                        Nuevo Registro
                    </button>
                </div>
            </div>

            <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-300">
                        <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase tracking-wider">
                            <tr>
                                <SortableHeader sortKey="date">Fecha</SortableHeader>
                                <SortableHeader sortKey="aircraftRegistration">Aeronave</SortableHeader>
                                <th scope="col" className="px-6 py-3">Ruta</th>
                                <SortableHeader sortKey="blockTime">T. Bloque</SortableHeader>
                                <SortableHeader sortKey="flightTime">T. Vuelo</SortableHeader>
                                <SortableHeader sortKey="landings">Ciclos</SortableHeader>
                                <SortableHeader sortKey="status">Estado</SortableHeader>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {processedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        No hay registros de vuelo.
                                    </td>
                                </tr>
                            ) : (
                                processedLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-700/40">
                                        <td className="px-6 py-4 font-mono text-white flex items-center gap-2">
                                            <CalendarDaysIcon className="h-4 w-4 text-gray-500"/> {log.date}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-sky-400">{log.aircraftRegistration}</td>
                                        <td className="px-6 py-4 font-mono text-xs">
                                            <span className="text-gray-300">{log.from}</span> <span className="text-gray-500">➔</span> <span className="text-gray-300">{log.to}</span>
                                        </td>
                                        <td className="px-6 py-4 font-mono">
                                            {log.blockTime.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 font-mono">
                                            {log.flightTime.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {log.landings}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.status === 'Verified' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                                                {log.status === 'Verified' ? 'Verificado' : 'Borrador'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleOpenEdit(log)} className="font-medium text-sky-400 hover:text-sky-300">Editar</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <FlightLogFormModal
                    isOpen={isModalOpen}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                    initialData={editingLog}
                    mode={mode}
                />
            )}
        </div>
    );
};
