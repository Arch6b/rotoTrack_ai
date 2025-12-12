
import React, { useState, useMemo } from 'react';
import type { Aircraft } from '../types';
import { mockFleets, mockAmps, mockOrganizations, mockOperationTypes, mockAircrafts, mockFactorDefinitions } from '../data/mockDatabase';
import { ChevronUpIcon, ChevronDownIcon, SearchIcon, BriefcaseIcon, AdjustmentsHorizontalIcon } from './Icons';

type SortableAircraftKeys = 'serialNumber' | 'registration' | 'model' | 'fleetId' | 'ownerId' | 'camoId' | 'status' | 'contractEndDate';

interface AircraftManagementProps {
    onEditAircraft: (aircraft: Aircraft) => void;
    onManageOpTypes: () => void;
}

const opTypeColorMap: { [key: string]: string } = {
    AOC: 'bg-teal-900/70 text-teal-300',
    SPO: 'bg-fuchsia-900/70 text-fuchsia-300',
    ATO: 'bg-orange-900/70 text-orange-300',
    LCI: 'bg-rose-900/70 text-rose-300',
    default: 'bg-indigo-900/70 text-indigo-300',
};

const OperationTypeDisplay: React.FC<{ opTypeId: string }> = ({ opTypeId }) => {
    const opType = mockOperationTypes.find(ot => ot.id === opTypeId);
    if (!opType) return null;
    const colorClass = opTypeColorMap[opTypeId] || opTypeColorMap.default;
    return (
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colorClass}`}>{opType.name}</span>
    );
};

export const AircraftManagement: React.FC<AircraftManagementProps> = ({ onEditAircraft, onManageOpTypes }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortableAircraftKeys; direction: 'ascending' | 'descending' } | null>(null);
    const [filter, setFilter] = useState('');
    const [showAll, setShowAll] = useState(false);

    const getContractDateStatusClass = (dateString: string): string => {
        if (!dateString) return '';
    
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(dateString);
        
        const timeDiff = endDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
        if (daysDiff <= 30) {
            return 'bg-red-900/40 text-red-300 font-bold'; 
        } else if (daysDiff <= 100) {
            return 'bg-yellow-900/40 text-yellow-300 font-semibold';
        }
        
        return ''; 
    };

    const processedAircrafts = useMemo(() => {
        let filteredItems = showAll ? [...mockAircrafts] : mockAircrafts.filter(ac => ac.status === 'Active');

        if (filter) {
            const searchTerm = filter.toLowerCase();
            filteredItems = filteredItems.filter(ac => {
                const owner = mockOrganizations.find(o => o.id === ac.ownerId);
                const camo = mockOrganizations.find(c => c.id === ac.camoId);
                const opTypes = ac.operationTypeIds.map(id => mockOperationTypes.find(ot => ot.id === id)?.name || '').join(' ');
                
                return (
                    ac.serialNumber.toLowerCase().includes(searchTerm) ||
                    ac.registration.toLowerCase().includes(searchTerm) ||
                    ac.model.toLowerCase().includes(searchTerm) ||
                    (owner && owner.name.toLowerCase().includes(searchTerm)) ||
                    ac.notes.toLowerCase().includes(searchTerm) ||
                    (camo && camo.name.toLowerCase().includes(searchTerm)) ||
                    opTypes.toLowerCase().includes(searchTerm)
                );
            });
        }
        
        let sortableItems = filteredItems;
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];
                if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;

    }, [filter, sortConfig, showAll]);

    const requestSort = (key: SortableAircraftKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: SortableAircraftKeys) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' 
            ? <ChevronUpIcon className="h-4 w-4 ml-1" /> 
            : <ChevronDownIcon className="h-4 w-4 ml-1" />;
    };

    const SortableHeader: React.FC<{ sortKey: SortableAircraftKeys; children: React.ReactNode; }> = ({ sortKey, children }) => (
        <th scope="col" className="px-6 py-3">
            <button onClick={() => requestSort(sortKey)} className="flex items-center group focus:outline-none">
                {children}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {getSortIndicator(sortKey) || <ChevronUpIcon className="h-4 w-4 ml-1 text-gray-500" />}
                </span>
            </button>
        </th>
    );

    return (
        <>
            <div className="space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <button 
                        onClick={onManageOpTypes}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2">
                        <BriefcaseIcon className="h-5 w-5" />
                        Gestionar Tipos de Op.
                    </button>
                    <div className="flex items-center gap-4">
                         <label className="flex items-center text-sm text-gray-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showAll}
                                onChange={() => setShowAll(prev => !prev)}
                                className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-sky-500 focus:ring-sky-600"
                            />
                            <span className="ml-2">Ver todos</span>
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <SearchIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Filtrar aeronaves..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="block w-full rounded-md border-0 bg-gray-700 py-1.5 pl-10 pr-3 text-gray-200 ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm sm:leading-6 transition"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-gray-300">
                            <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase tracking-wider">
                                <tr>
                                    <SortableHeader sortKey="serialNumber">N/S</SortableHeader>
                                    <SortableHeader sortKey="registration">Matrícula</SortableHeader>
                                    <SortableHeader sortKey="model">Modelo</SortableHeader>
                                    <th scope="col" className="px-6 py-3">Contadores Actuales</th>
                                    <th scope="col" className="px-6 py-3">AMP Aplicable</th>
                                    <th scope="col" className="px-6 py-3">Tipos de Operación</th>
                                    <SortableHeader sortKey="ownerId">Propietario</SortableHeader>
                                    <SortableHeader sortKey="contractEndDate">Fin Contrato</SortableHeader>
                                    {showAll && <SortableHeader sortKey="status">Estado</SortableHeader>}
                                    <th scope="col" className="px-6 py-3"><span className="sr-only">Acciones</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {processedAircrafts.map((ac) => {
                                    const fleet = mockFleets.find(f => f.id === ac.fleetId);
                                    const amp = fleet ? mockAmps.find(a => a.fleetId === fleet.id) : undefined;
                                    const owner = mockOrganizations.find(o => o.id === ac.ownerId);
                                    const contractDateClass = getContractDateStatusClass(ac.contractEndDate);
                                    
                                    // Determine active factors from Fleet
                                    const activeFactors = fleet?.customFactors.map(cf => {
                                        return mockFactorDefinitions.find(fd => fd.id === cf.factorId);
                                    }).filter(Boolean) || [];

                                    return (
                                    <tr key={ac.id} className="hover:bg-gray-700/40 transition-colors">
                                        <td className="px-6 py-4 font-mono text-white">{ac.serialNumber}</td>
                                        <td className="px-6 py-4 font-mono font-bold text-sky-400">{ac.registration}</td>
                                        <td className="px-6 py-4 font-medium">{ac.model}</td>
                                        <td className="px-6 py-4">
                                            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                                {activeFactors.length > 0 ? activeFactors.map(factor => (
                                                    <div key={factor!.id} className="text-xs">
                                                        <span className="text-gray-400">{factor!.name}:</span> 
                                                        <span className="ml-1 font-mono text-white">
                                                            {ac.counters[factor!.id] !== undefined ? ac.counters[factor!.id] : '-'}
                                                        </span>
                                                    </div>
                                                )) : <span className="text-gray-500 text-xs">Sin Factores</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-cyan-400">{amp?.name || <span className="text-yellow-500">No asignado</span>}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {ac.operationTypeIds.map(id => <OperationTypeDisplay key={id} opTypeId={id} />)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate">{owner?.name}</td>
                                        <td className={`px-6 py-4 transition-colors ${contractDateClass}`}>{ac.contractEndDate}</td>
                                        {showAll && (
                                            <td className="px-6 py-4">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ac.status === 'Active' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                                                    {ac.status === 'Active' ? 'Activa' : 'Inactiva'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => onEditAircraft(ac)} className="font-medium text-sky-400 hover:text-sky-300">Editar</button>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};
