import React, { useState, useMemo } from 'react';
import type { Organization } from '../types';
import { mockOrganizations, mockOrganizationTypes } from '../data/mockDatabase';
import { ChevronUpIcon, ChevronDownIcon, SearchIcon, BriefcaseIcon, LinkIcon } from './Icons';

type SortableOrgKeys = 'id' | 'name' | 'typeId' | 'approval' | 'status';

const typeColorMap: { [key: string]: string } = {
    CAMO: 'bg-green-900 text-green-300',
    OWNER: 'bg-blue-900 text-blue-300',
    MRO: 'bg-purple-900 text-purple-300',
    LESSOR: 'bg-yellow-900 text-yellow-300',
    default: 'bg-gray-700 text-gray-300',
};

interface OrganizationManagementProps {
    onEditOrganization: (organization: Organization) => void;
    onManageOrgTypes: () => void;
}


export const OrganizationManagement: React.FC<OrganizationManagementProps> = ({ onEditOrganization, onManageOrgTypes }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortableOrgKeys; direction: 'ascending' | 'descending' } | null>(null);
    const [filter, setFilter] = useState('');
    const [showInactive, setShowInactive] = useState(false);

     const processedOrgs = useMemo(() => {
        let filteredItems = showInactive ? [...mockOrganizations] : mockOrganizations.filter(o => o.status === 'Active');

        if (filter) {
            const searchTerm = filter.toLowerCase();
            filteredItems = filteredItems.filter(org =>
                Object.values(org).some(value =>
                    String(value).toLowerCase().includes(searchTerm)
                ) || mockOrganizationTypes.find(ot => ot.id === org.typeId)?.name.toLowerCase().includes(searchTerm)
            );
        }

        let sortableItems = filteredItems;
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aVal = a[sortConfig.key] ?? '';
                const bVal = b[sortConfig.key] ?? '';
                if (aVal < bVal) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aVal > bVal) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filter, sortConfig, showInactive]);

    const requestSort = (key: SortableOrgKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const SortableHeader: React.FC<{ sortKey: SortableOrgKeys; children: React.ReactNode; }> = ({ sortKey, children }) => {
        const isSorted = sortConfig?.key === sortKey;
        const indicator = isSorted 
            ? (sortConfig?.direction === 'ascending' ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />)
            : <ChevronUpIcon className="h-4 w-4 ml-1 text-gray-500" />;

        return (
            <th scope="col" className="px-6 py-3">
                <button onClick={() => requestSort(sortKey)} className="flex items-center group focus:outline-none">
                    {children}
                    <span className={isSorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>
                        {indicator}
                    </span>
                </button>
            </th>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <button 
                    onClick={onManageOrgTypes}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2">
                    <BriefcaseIcon className="h-5 w-5" />
                    Gestionar Tipos de Org.
                </button>
                <div className="flex items-center gap-4">
                    <label className="flex items-center text-sm text-gray-300 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={() => setShowInactive(prev => !prev)}
                            className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-sky-500 focus:ring-sky-600"
                        />
                        <span className="ml-2">Ver inactivas</span>
                    </label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Filtrar organizaciones..."
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
                                <SortableHeader sortKey="id">ID</SortableHeader>
                                <SortableHeader sortKey="name">Nombre</SortableHeader>
                                <SortableHeader sortKey="typeId">Tipo</SortableHeader>
                                <SortableHeader sortKey="approval">Aprobación</SortableHeader>
                                {showInactive && <SortableHeader sortKey="status">Estado</SortableHeader>}
                                <th scope="col" className="px-6 py-3">Notas</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {processedOrgs.map((org) => {
                                const orgType = mockOrganizationTypes.find(ot => ot.id === org.typeId);
                                const colorClass = orgType ? typeColorMap[orgType.id] || typeColorMap.default : typeColorMap.default;
                                return (
                                <tr key={org.id} className="hover:bg-gray-700/40 transition-colors">
                                    <td className="px-6 py-4 font-mono text-sky-400">{org.id}</td>
                                    <td className="px-6 py-4 font-medium text-white">{org.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
                                            {orgType?.name || org.typeId}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span>{org.approval}</span>
                                            {org.approvalLink && (
                                                <a href={org.approvalLink} target="_blank" rel="noopener noreferrer" title="Ver documento de aprobación">
                                                    <LinkIcon className="h-4 w-4 text-gray-400 hover:text-sky-400" />
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    {showInactive && (
                                         <td className="px-6 py-4">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${org.status === 'Active' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                                                {org.status === 'Active' ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 max-w-sm text-gray-400">
                                        <pre className="whitespace-pre-wrap font-sans text-xs">{org.notes}</pre>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => onEditOrganization(org)} className="font-medium text-sky-400 hover:text-sky-300">Editar</button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};