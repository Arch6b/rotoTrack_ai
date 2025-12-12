
import React, { useState, useMemo } from 'react';
import type { Fleet, CustomFactor, FactorDefinition, AMP, ValueType } from '../types';
import { mockFactorDefinitions, mockAmps, mockFleets, mockCertificates } from '../data/mockDatabase';
import { CheckIcon, XMarkIcon, TagIcon, ChevronUpIcon, ChevronDownIcon, SearchIcon } from './Icons';

type SortableFleetKeys = 'id' | 'name' | 'numMotors' | 'status' | 'lastModifiedDate';

interface FleetManagementProps {
    onEditFleet: (fleet: Fleet) => void;
    onManageFactors: () => void;
}

const factorTypeColorMap: { [key in ValueType]: string } = {
    integer: 'bg-blue-900/70 text-blue-300',
    float: 'bg-purple-900/70 text-purple-300',
    boolean: 'bg-green-900/70 text-green-300',
    string: 'bg-gray-700/60 text-gray-300',
};

const FactorDisplay: React.FC<{ factor: CustomFactor, definitions: FactorDefinition[] }> = ({ factor, definitions }) => {
    const definition = definitions.find(d => d.id === factor.factorId);
    if (!definition) return null;

    let displayValue: React.ReactNode;
    const colorClass = factorTypeColorMap[definition.valueType] || factorTypeColorMap.string;

    if (definition.valueType === 'boolean') {
        if (factor.value.toLowerCase() === 'true') {
            displayValue = <CheckIcon className="h-5 w-5 text-green-400" />;
        } else {
            displayValue = <XMarkIcon className="h-5 w-5 text-gray-500" />;
        }
    } else {
        displayValue = <span className="font-mono text-cyan-300">{factor.value}</span>;
    }

    return (
        <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs ${colorClass}`}>
            <span className="font-medium">{definition.name}:</span>
            {displayValue}
        </div>
    )
}

export const FleetManagement: React.FC<FleetManagementProps> = ({ onEditFleet, onManageFactors }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortableFleetKeys; direction: 'ascending' | 'descending' } | null>(null);
    const [filter, setFilter] = useState('');
    const [showAll, setShowAll] = useState(false);

    const processedFleets = useMemo(() => {
        let filteredItems = showAll ? [...mockFleets] : mockFleets.filter(f => f.status === 'Active');

        if (filter) {
            const searchTerm = filter.toLowerCase();
            filteredItems = filteredItems.filter(fleet => {
                const amp = mockAmps.find(a => a.fleetId === fleet.id);
                const factorMatch = fleet.customFactors.some(cf => {
                    const def = mockFactorDefinitions.find(d => d.id === cf.factorId);
                    return def && def.name.toLowerCase().includes(searchTerm);
                });

                return (
                    fleet.id.toLowerCase().includes(searchTerm) ||
                    fleet.name.toLowerCase().includes(searchTerm) ||
                    (amp && amp.name.toLowerCase().includes(searchTerm)) ||
                    fleet.notes.toLowerCase().includes(searchTerm) ||
                    factorMatch
                );
            });
        }

        let sortableItems = filteredItems;
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filter, sortConfig, showAll]);

    const requestSort = (key: SortableFleetKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: SortableFleetKeys) => {
        if (!sortConfig || sortConfig.key !== key) {
            return null;
        }
        if (sortConfig.direction === 'ascending') {
            return <ChevronUpIcon className="h-4 w-4 ml-1" />;
        }
        return <ChevronDownIcon className="h-4 w-4 ml-1" />;
    };

    const SortableHeader: React.FC<{ sortKey: SortableFleetKeys; children: React.ReactNode; className?: string; }> = ({ sortKey, children, className }) => (
        <th scope="col" className={`px-6 py-3 ${className}`}>
            <button onClick={() => requestSort(sortKey)} className="flex items-center group focus:outline-none">
                {children}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {getSortIndicator(sortKey) || <ChevronUpIcon className="h-4 w-4 ml-1 text-gray-500" />}
                </span>
            </button>
        </th>
    );

    return (
        <div className="space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-4">
                <button 
                    onClick={onManageFactors}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2">
                    <TagIcon className="h-5 w-5" />
                    Gestionar Factores
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
                            placeholder="Filtrar flotas..."
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
                                <SortableHeader sortKey="id">ID Flota</SortableHeader>
                                <SortableHeader sortKey="name">Nombre</SortableHeader>
                                <th scope="col" className="px-6 py-3">Certificado Tipo (TC)</th>
                                <th scope="col" className="px-6 py-3">AMP Aplicable</th>
                                <SortableHeader sortKey="numMotors" className="text-center">Nº Motores</SortableHeader>
                                <th scope="col" className="px-6 py-3">Factores Específicos</th>
                                {showAll && <SortableHeader sortKey="status">Estado</SortableHeader>}
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {processedFleets.map((fleet) => {
                                const amp = mockAmps.find(a => a.fleetId === fleet.id);
                                // Prefer the direct link, fallback to finding by applicableFleetIds
                                const tc = fleet.typeCertificateId 
                                    ? mockCertificates.find(c => c.id === fleet.typeCertificateId)
                                    : mockCertificates.find(c => c.type === 'TC' && c.applicableFleetIds.includes(fleet.id));

                                return (
                                    <tr key={fleet.id} className="hover:bg-gray-700/40 transition-colors">
                                        <td className="px-6 py-4 font-mono text-sky-400">{fleet.id}</td>
                                        <td className="px-6 py-4 font-medium text-white">{fleet.name}</td>
                                        <td className={`px-6 py-4 font-mono transition-colors ${tc ? 'text-emerald-400' : 'text-red-400 font-semibold'}`}>
                                            {tc ? tc.tcds : 'Sin Asignar'}
                                        </td>
                                        <td className={`px-6 py-4 transition-colors ${amp ? 'text-cyan-400' : 'bg-yellow-900/40 text-yellow-300 font-semibold'}`}>
                                            {amp?.name || 'No asignado'}
                                        </td>
                                        <td className="px-6 py-4 text-center">{fleet.numMotors}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {fleet.customFactors.length > 0 ? (
                                                    fleet.customFactors.map(factor => <FactorDisplay key={factor.factorId} factor={factor} definitions={mockFactorDefinitions} />)
                                                ) : (
                                                    <span className="text-gray-500">N/A</span>
                                                )}
                                            </div>
                                        </td>
                                        {showAll && (
                                            <td className="px-6 py-4">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${fleet.status === 'Active' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                                                    {fleet.status === 'Active' ? 'Activa' : 'Inactiva'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => onEditFleet(fleet)} className="font-medium text-sky-400 hover:text-sky-300">Editar</button>
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
