
import React, { useState, useMemo, useEffect } from 'react';
import type { ComponentAsset, Aircraft } from '../types';
import { mockComponentAssets, mockComponents, addComponentAsset, updateComponentAsset, installComponentAsset, removeComponentAsset, mockAircrafts } from '../data/mockDatabase';
import { SearchIcon, ChevronUpIcon, ChevronDownIcon, CubeIcon, AircraftIcon, BuildingOfficeIcon, AdjustmentsHorizontalIcon, BookOpenIcon, ArrowPathIcon } from './Icons';
import { ComponentAssetEditModal } from './ComponentAssetEditModal';
import { AircraftStructureView } from './AircraftStructureView';
import { ComponentLogCardModal } from './ComponentLogCardModal';
import { ComponentMovementModal } from './ComponentMovementModal';

type SortableAssetKeys = 'serialNumber' | 'locationReference' | 'accumulatedFH' | 'condition' | 'lastModifiedDate';
type ViewMode = 'list' | 'tree';

const conditionColorMap: { [key in ComponentAsset['condition']]: string } = {
    Serviceable: 'bg-green-900 text-green-300',
    Unserviceable: 'bg-red-900 text-red-300',
    Installed: 'bg-blue-900 text-blue-300',
    Scrapped: 'bg-gray-700 text-gray-500 line-through',
};

export const ComponentAssetManagement: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('tree');
    // Master State: This component owns the data for both views
    const [assets, setAssets] = useState<ComponentAsset[]>([]);
    
    // Initial Load
    useEffect(() => {
        setAssets([...mockComponentAssets]);
    }, []);

    const [sortConfig, setSortConfig] = useState<{ key: SortableAssetKeys; direction: 'ascending' | 'descending' } | null>(null);
    const [filter, setFilter] = useState('');
    const [hideBadStatus, setHideBadStatus] = useState(true);
    
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<ComponentAsset | null>(null);
    
    // Log Card & Movement Modals
    const [logCardAsset, setLogCardAsset] = useState<ComponentAsset | null>(null);
    const [movementModalOpen, setMovementModalOpen] = useState(false);
    const [movementAsset, setMovementAsset] = useState<ComponentAsset | null>(null);

    // Refresh function passed to children
    const refreshData = () => {
        setAssets([...mockComponentAssets]);
    };

    const handleOpenAdd = () => {
        setEditingAsset(null);
        setModalOpen(true);
    };

    const handleOpenEdit = (asset: ComponentAsset) => {
        setEditingAsset(asset);
        setModalOpen(true);
    };

    const handleSave = (asset: ComponentAsset) => {
        if (editingAsset) {
            updateComponentAsset(asset);
        } else {
            addComponentAsset(asset);
        }
        refreshData();
        setModalOpen(false);
    };

    // Logic for Movement Button in List View
    const handleOpenMovement = (asset: ComponentAsset) => {
        setMovementAsset(asset);
        setMovementModalOpen(true);
    };

    const handleConfirmMovement = (date: string, counters: Record<string, number>, condition?: 'Serviceable' | 'Unserviceable' | 'Scrapped') => {
        if (!movementAsset) return;

        // If it's installed, we are Removing it.
        // If it's not installed, we can't really "Install" it from list view easily without selecting a target parent.
        // For simplicity in list view, the button will primarily serve "Remove" if installed, or we could implement a simplified install.
        // Given the requirement "desmonto desde la lista plana", we focus on Removal.
        
        if (movementAsset.locationType === 'Aircraft') {
             removeComponentAsset(
                movementAsset.id,
                date,
                counters,
                condition || 'Serviceable'
            );
        } else {
            // Future: Implement Install from List (requires selecting Target Parent in modal)
            alert("Para instalar un componente, por favor use la vista de Árbol (Drag & Drop) para asegurar la jerarquía correcta.");
        }
        refreshData();
        setMovementModalOpen(false);
        setMovementAsset(null);
    };

    const processedAssets = useMemo(() => {
        let items = [...assets];

        // Filter by Status
        if (hideBadStatus) {
            items = items.filter(a => a.condition !== 'Scrapped' && a.condition !== 'Unserviceable');
        }

        if (filter) {
            const searchTerm = filter.toLowerCase();
            items = items.filter(a => {
                const pn = mockComponents.find(c => c.id === a.partNumberId);
                return (
                    a.serialNumber.toLowerCase().includes(searchTerm) ||
                    a.locationReference.toLowerCase().includes(searchTerm) ||
                    (pn && pn.partNumber.toLowerCase().includes(searchTerm)) ||
                    (pn && pn.description.toLowerCase().includes(searchTerm))
                );
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
    }, [assets, filter, sortConfig, hideBadStatus]);

    const requestSort = (key: SortableAssetKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader: React.FC<{ sortKey: SortableAssetKeys; children: React.ReactNode }> = ({ sortKey, children }) => {
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

    // Helper to find the aircraft an asset is installed on (for the modal)
    const findSourceAircraft = (asset: ComponentAsset): Aircraft | undefined => {
        if (asset.locationType === 'Aircraft') {
            return mockAircrafts.find(a => a.registration === asset.locationReference);
        }
        return undefined;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 justify-between items-center bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                    <CubeIcon className="h-8 w-8 text-sky-400" />
                    <div>
                        <h2 className="text-xl font-semibold text-white">Estructura / Activos</h2>
                        <p className="text-sm text-gray-400">Control de componentes instalados, stock y jerarquía de montaje.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                        <div className="flex bg-gray-700 rounded-lg p-1 mr-4">
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                Lista Plana
                            </button>
                            <button 
                                onClick={() => setViewMode('tree')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${viewMode === 'tree' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                <AdjustmentsHorizontalIcon className="h-4 w-4" /> Árbol de Montaje
                            </button>
                        </div>

                        {viewMode === 'list' && (
                            <>
                                <label className="flex items-center text-xs text-gray-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hideBadStatus}
                                        onChange={() => setHideBadStatus(!hideBadStatus)}
                                        className="h-3.5 w-3.5 rounded border-gray-500 bg-gray-700 text-sky-500 focus:ring-sky-600 mr-2"
                                    />
                                    Ocultar Inop/Scrap
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="h-5 w-5 text-gray-400" /></div>
                                    <input type="text" placeholder="S/N, P/N, Matrícula..." value={filter} onChange={e => setFilter(e.target.value)} className="block w-full rounded-md border-0 bg-gray-700 py-1.5 pl-10 pr-3 text-gray-200 ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-sky-500 sm:text-sm" />
                                </div>
                            </>
                        )}
                        <button onClick={handleOpenAdd} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors whitespace-nowrap">
                            Registrar Activo
                        </button>
                </div>
            </div>

            {viewMode === 'tree' ? (
                <AircraftStructureView 
                    assets={assets} 
                    onRefresh={refreshData} 
                />
            ) : (
                <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-gray-300">
                            <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase tracking-wider">
                                <tr>
                                    <SortableHeader sortKey="serialNumber">Serial Number</SortableHeader>
                                    <th scope="col" className="px-6 py-3">Part Number</th>
                                    <th scope="col" className="px-6 py-3">Descripción</th>
                                    <SortableHeader sortKey="locationReference">Ubicación</SortableHeader>
                                    <SortableHeader sortKey="condition">Condición</SortableHeader>
                                    <th scope="col" className="px-6 py-3">Contadores (Vida)</th>
                                    <th scope="col" className="px-6 py-3"><span className="sr-only">Acciones</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {processedAssets.map(asset => {
                                    const pn = mockComponents.find(c => c.id === asset.partNumberId);
                                    
                                    return (
                                        <tr key={asset.id} className="hover:bg-gray-700/40">
                                            <td className="px-6 py-4 font-mono font-bold text-white">{asset.serialNumber}</td>
                                            <td className="px-6 py-4 font-mono text-sky-400">{pn?.partNumber || asset.partNumberId}</td>
                                            <td className="px-6 py-4 text-gray-300 truncate max-w-[200px]">{pn?.description || 'Desconocido'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {asset.locationType === 'Aircraft' ? <AircraftIcon className="h-4 w-4 text-gray-400"/> : <BuildingOfficeIcon className="h-4 w-4 text-gray-400"/>}
                                                    <span className="font-medium text-white">{asset.locationReference}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${conditionColorMap[asset.condition]}`}>
                                                    {asset.condition}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono">
                                                {Object.entries(asset.counters || {}).map(([key, val]) => (
                                                    <div key={key} className="text-gray-300">{key}: {val}</div>
                                                ))}
                                                {Object.keys(asset.counters || {}).length === 0 && <span className="text-gray-500">-</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                {asset.locationType === 'Aircraft' && (
                                                    <button 
                                                        onClick={() => handleOpenMovement(asset)} 
                                                        className="text-red-400 hover:text-red-300 p-1 border border-red-900 rounded bg-red-900/20" 
                                                        title="Desmontar / Mover"
                                                    >
                                                        <ArrowPathIcon className="h-4 w-4"/>
                                                    </button>
                                                )}
                                                <button onClick={() => setLogCardAsset(asset)} className="font-medium text-gray-400 hover:text-white p-1" title="Log Card"><BookOpenIcon className="h-5 w-5"/></button>
                                                <button onClick={() => handleOpenEdit(asset)} className="font-medium text-sky-400 hover:text-sky-300 p-1">Editar</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <ComponentAssetEditModal
                    isOpen={isModalOpen}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                    asset={editingAsset}
                />
            )}

            {movementModalOpen && movementAsset && (
                <ComponentMovementModal
                    isOpen={movementModalOpen}
                    onClose={() => setMovementModalOpen(false)}
                    onConfirm={handleConfirmMovement}
                    action='Remove' // Default action from list view for now
                    asset={movementAsset}
                    targetAircraft={findSourceAircraft(movementAsset)}
                />
            )}

            {logCardAsset && (
                <ComponentLogCardModal
                    isOpen={!!logCardAsset}
                    onClose={() => setLogCardAsset(null)}
                    asset={logCardAsset}
                />
            )}
        </div>
    );
};
