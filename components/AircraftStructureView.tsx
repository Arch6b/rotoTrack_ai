
import React, { useState } from 'react';
import type { ComponentAsset, Aircraft } from '../types';
import { mockAircrafts, mockComponents, updateComponentAsset, installComponentAsset, removeComponentAsset } from '../data/mockDatabase';
import { AircraftIcon, CubeIcon, ChevronDownIcon, ChevronUpIcon, SearchIcon, CheckCircleIcon, XMarkIcon, BookOpenIcon } from './Icons';
import { ComponentMovementModal } from './ComponentMovementModal';
import { ComponentLogCardModal } from './ComponentLogCardModal';

// Sub-component for the Status Menu
const StatusQuickAction: React.FC<{ 
    currentStatus: ComponentAsset['condition'], 
    onStatusChange: (status: ComponentAsset['condition']) => void 
}> = ({ currentStatus, onStatusChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    let colorClass = 'text-gray-400';
    if (currentStatus === 'Installed') colorClass = 'text-green-400';
    else if (currentStatus === 'Unserviceable') colorClass = 'text-red-400';
    else if (currentStatus === 'Serviceable') colorClass = 'text-gray-300';
    else if (currentStatus === 'Scrapped') colorClass = 'text-gray-600 line-through';

    return (
        <div className="relative">
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className={`p-1 rounded hover:bg-gray-700 ${colorClass}`}
                title={`Estado actual: ${currentStatus}. Click para cambiar.`}
            >
                <CubeIcon className="h-4 w-4" />
            </button>
            
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}></div>
                    <div className="absolute top-6 right-0 z-50 w-36 bg-gray-800 border border-gray-600 rounded-md shadow-xl py-1">
                        <div className="px-2 py-1 text-xs text-gray-500 border-b border-gray-700 uppercase font-bold">Cambiar Estado</div>
                        <button onClick={(e) => { e.stopPropagation(); onStatusChange('Serviceable'); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-gray-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gray-400"></span> Serviceable
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onStatusChange('Unserviceable'); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-xs text-red-300 hover:bg-gray-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Unserviceable
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onStatusChange('Scrapped'); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-gray-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gray-600"></span> Scrapped
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

interface TreeItemProps {
    item: ComponentAsset | Aircraft;
    type: 'Aircraft' | 'Asset';
    childrenAssets: ComponentAsset[];
    onDragStart: (e: React.DragEvent, id: string, type: 'Aircraft' | 'Asset') => void;
    onDrop: (e: React.DragEvent, targetId: string, targetType: 'Aircraft' | 'Asset') => void;
    onUpdateStatus: (id: string, newStatus: ComponentAsset['condition']) => void;
    onViewLogCard: (asset: ComponentAsset) => void;
    level: number;
    parentAircraft?: Aircraft; 
    allAssets: ComponentAsset[]; // Need all assets to find children recursively
}

const TreeItem: React.FC<TreeItemProps> = ({ item, type, childrenAssets, onDragStart, onDrop, onUpdateStatus, onViewLogCard, level, parentAircraft, allAssets }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragStart = (e: React.DragEvent) => {
        if (type === 'Aircraft') {
            e.preventDefault(); 
            return;
        }
        e.stopPropagation();
        onDragStart(e, (item as ComponentAsset).id, type);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const targetId = type === 'Aircraft' ? (item as Aircraft).serialNumber : (item as ComponentAsset).id;
        onDrop(e, targetId, type);
    };

    let mainLabel = '';
    let subLabel = '';
    let extraInfo = null;
    let icon = null;

    if (type === 'Aircraft') {
        const ac = item as Aircraft;
        mainLabel = `${ac.registration} (${ac.model})`;
        subLabel = `S/N: ${ac.serialNumber}`;
        extraInfo = <span className="text-xs text-sky-500 font-mono ml-2">TSN: {ac.counters['FH'] || 0} FH</span>
        icon = <AircraftIcon className="h-5 w-5 text-sky-400" />;
    } else {
        const asset = item as ComponentAsset;
        const pn = mockComponents.find(c => c.id === asset.partNumberId);
        mainLabel = `${pn?.description || 'Desconocido'}`;
        subLabel = `P/N: ${pn?.partNumber} | S/N: ${asset.serialNumber}`;
        
        let liveUsageDisplay = null;
        if (asset.installationDetails && parentAircraft && parentAircraft.counters) {
            const installParentFH = asset.installationDetails.parentCounters['FH'] || 0;
            const currentParentFH = parentAircraft.counters['FH'] || 0;
            const delta = Math.max(0, currentParentFH - installParentFH);
            const installAssetFH = asset.installationDetails.assetCounters['FH'] || 0;
            const liveFH = installAssetFH + delta;
            
            liveUsageDisplay = (
                <span className="text-xs text-emerald-400 font-mono ml-auto mr-2" title={`Instalado a ${installParentFH} AC FH. Delta: +${delta}`}>
                    {liveFH.toFixed(1)} FH
                </span>
            );
        } else {
             const storedFH = asset.counters['FH'] || 0;
             liveUsageDisplay = <span className="text-xs text-gray-500 font-mono ml-auto mr-2">{storedFH} FH</span>
        }

        extraInfo = liveUsageDisplay;
        icon = <StatusQuickAction currentStatus={asset.condition} onStatusChange={(s) => onUpdateStatus(asset.id, s)} />;
    }

    return (
        <div className={`ml-${level > 0 ? 4 : 0} mt-1`}>
            <div 
                draggable={type === 'Asset'}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    flex items-center gap-2 p-2 rounded-md transition-colors border group/item
                    ${isDragOver ? 'bg-sky-900/50 border-sky-500' : 'bg-gray-800/60 border-gray-700 hover:bg-gray-700/60'}
                    ${type === 'Asset' ? 'cursor-move' : ''}
                `}
            >
                <button 
                    onClick={() => setIsExpanded(!isExpanded)} 
                    className={`p-1 rounded hover:bg-gray-600 ${childrenAssets.length === 0 ? 'invisible' : ''}`}
                >
                    {isExpanded ? <ChevronDownIcon className="h-3 w-3 text-gray-400" /> : <ChevronUpIcon className="h-3 w-3 text-gray-400" />}
                </button>
                
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex-shrink-0">{icon}</div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-white truncate">{mainLabel}</span>
                            <div className="flex items-center">
                                {extraInfo}
                                {type === 'Asset' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onViewLogCard(item as ComponentAsset); }}
                                        className="p-1 text-gray-500 hover:text-sky-400 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                        title="Ver Log Card"
                                    >
                                        <BookOpenIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <span className="text-xs text-gray-400 font-mono truncate">{subLabel}</span>
                    </div>
                </div>
            </div>

            {isExpanded && childrenAssets.length > 0 && (
                <div className="border-l border-gray-700 ml-4 pl-2">
                    {childrenAssets.map(child => (
                        <ConnectedTreeItem 
                            key={child.id} 
                            item={child} 
                            level={level + 1} 
                            onDragStart={onDragStart}
                            onDrop={onDrop}
                            onUpdateStatus={onUpdateStatus}
                            onViewLogCard={onViewLogCard}
                            parentAircraft={parentAircraft} 
                            allAssets={allAssets}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const ConnectedTreeItem: React.FC<Omit<TreeItemProps, 'childrenAssets' | 'type'> & { item: ComponentAsset }> = (props) => {
    // Filter from the full list passed down props
    const children = props.allAssets.filter(a => a.parentId === props.item.id);
    return <TreeItem {...props} type="Asset" childrenAssets={children} />;
};

interface AircraftStructureViewProps {
    assets: ComponentAsset[];
    onRefresh: () => void;
}

export const AircraftStructureView: React.FC<AircraftStructureViewProps> = ({ assets, onRefresh }) => {
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [filter, setFilter] = useState('');
    const [hideUnserviceable, setHideUnserviceable] = useState(true);

    // Modal State
    const [movementModalOpen, setMovementModalOpen] = useState(false);
    const [movementData, setMovementData] = useState<{ 
        assetId: string; 
        targetId: string; 
        action: 'Install' | 'Remove';
        targetAircraft?: Aircraft; 
    } | null>(null);

    // Log Card Modal State
    const [logCardAsset, setLogCardAsset] = useState<ComponentAsset | null>(null);

    const handleUpdateStatus = (id: string, newStatus: ComponentAsset['condition']) => {
        const asset = assets.find(a => a.id === id);
        if (asset) {
            updateComponentAsset({ ...asset, condition: newStatus });
            onRefresh();
        }
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const isDescendant = (potentialParentId: string, potentialChildId: string): boolean => {
        const potentialParent = assets.find(a => a.id === potentialParentId);
        if (!potentialParent) return false;
        if (potentialParent.parentId === potentialChildId) return true;
        if (!potentialParent.parentId) return false;
        return isDescendant(potentialParent.parentId, potentialChildId);
    };

    const handleDrop = (e: React.DragEvent, targetId: string, targetType: 'Aircraft' | 'Asset') => {
        e.preventDefault();
        if (!draggedId) return;
        if (draggedId === targetId) return;

        if (targetType === 'Asset' && isDescendant(targetId, draggedId)) {
            alert("No se puede mover un componente dentro de uno de sus descendientes.");
            return;
        }

        const movedAsset = assets.find(a => a.id === draggedId);
        if (!movedAsset) return;

        let targetAircraft: Aircraft | undefined;
        if (targetType === 'Aircraft') {
            targetAircraft = mockAircrafts.find(a => a.serialNumber === targetId);
        } else {
            const findRoot = (id: string): Aircraft | undefined => {
                const pAsset = assets.find(a => a.id === id);
                if (pAsset && pAsset.parentId) return findRoot(pAsset.parentId);
                return mockAircrafts.find(a => a.serialNumber === (pAsset?.parentId || id));
            }
            targetAircraft = findRoot(targetId);
        }

        setMovementData({
            assetId: draggedId,
            targetId: targetId,
            action: 'Install',
            targetAircraft: targetAircraft
        });
        setMovementModalOpen(true);
        setDraggedId(null);
    };

    const handleDropToStock = (e: React.DragEvent) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        if (!id) return;

        const movedAsset = assets.find(a => a.id === id);
        if (!movedAsset) return;

        const findSourceAircraft = (asset: ComponentAsset): Aircraft | undefined => {
            if (asset.locationType === 'Aircraft') {
                return mockAircrafts.find(a => a.registration === asset.locationReference);
            }
            return undefined;
        };
        const sourceAircraft = findSourceAircraft(movedAsset);

        setMovementData({
            assetId: id,
            targetId: '', 
            action: 'Remove',
            targetAircraft: sourceAircraft
        });
        setMovementModalOpen(true);
    };

    const handleConfirmMovement = (date: string, counters: Record<string, number>, condition?: 'Serviceable' | 'Unserviceable' | 'Scrapped') => {
        if (!movementData) return;

        if (movementData.action === 'Install') {
            const targetAC = movementData.targetAircraft;
            installComponentAsset(
                movementData.assetId,
                movementData.targetId,
                date,
                counters,
                targetAC?.registration || 'Unknown AC'
            );
        } else {
            removeComponentAsset(
                movementData.assetId,
                date,
                counters,
                condition || 'Serviceable'
            );
        }
        onRefresh(); // Trigger parent refresh
        setMovementModalOpen(false);
        setMovementData(null);
    };

    const rootAircrafts = mockAircrafts.filter(a => a.status === 'Active');
    
    // Logic for Root Stock Items (loose items)
    const looseAssets = assets.filter(a => {
        // Must be uninstalled (location not aircraft OR no parent if hierarchy exists)
        // If it has a parentId, it's a child of something (maybe another stock item), so we don't show it at root level.
        const isLoose = !a.parentId && a.locationType !== 'Aircraft';
        if (!isLoose) return false;

        const pn = mockComponents.find(c => c.id === a.partNumberId);
        const matchesText = !filter || (
            (pn?.partNumber.toLowerCase().includes(filter.toLowerCase()) ?? false) ||
            (pn?.description.toLowerCase().includes(filter.toLowerCase()) ?? false) ||
            a.serialNumber.toLowerCase().includes(filter.toLowerCase())
        );

        const matchesStatus = !hideUnserviceable || (a.condition !== 'Unserviceable' && a.condition !== 'Scrapped');

        return matchesText && matchesStatus;
    });

    return (
        <div className="flex flex-col h-[calc(100vh-340px)] min-h-[500px]">
            
            {/* Toolbar */}
            <div className="flex items-center gap-4 mb-4 bg-gray-900/30 p-2 rounded-lg border border-gray-700 flex-shrink-0">
                <div className="relative flex-1 max-w-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="h-4 w-4 text-gray-400" /></div>
                    <input type="text" placeholder="Filtrar componentes (Stock)..." value={filter} onChange={e => setFilter(e.target.value)} className="block w-full rounded-md border-0 bg-gray-800 py-1.5 pl-9 pr-3 text-gray-200 ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-sky-500 sm:text-xs" />
                </div>
                <label className="flex items-center text-xs text-gray-300 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={hideUnserviceable}
                        onChange={() => setHideUnserviceable(!hideUnserviceable)}
                        className="h-3.5 w-3.5 rounded border-gray-500 bg-gray-700 text-sky-500 focus:ring-sky-600 mr-2"
                    />
                    Ocultar No-Serviciables / Scrap
                </label>
            </div>

            <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
                {/* Left: Aircraft Assembly Tree */}
                <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 p-4 flex flex-col min-w-0">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 flex-shrink-0">
                        <AircraftIcon className="h-5 w-5 text-sky-400"/> Flota Instalada (Montaje)
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                        {rootAircrafts.map(ac => {
                            const installedAssets = assets.filter(a => a.parentId === ac.serialNumber);
                            return (
                                <TreeItem 
                                    key={ac.serialNumber} 
                                    item={ac} 
                                    type="Aircraft" 
                                    childrenAssets={installedAssets}
                                    onDragStart={handleDragStart}
                                    onDrop={handleDrop}
                                    onUpdateStatus={handleUpdateStatus}
                                    onViewLogCard={setLogCardAsset}
                                    level={0}
                                    parentAircraft={ac}
                                    allAssets={assets} // Pass the full list down
                                />
                            );
                        })}
                    </div>
                    
                    {/* Legend */}
                    <div className="mt-4 pt-4 border-t border-gray-700 flex gap-4 text-xs text-gray-400 flex-shrink-0">
                        <div className="flex items-center gap-1"><CubeIcon className="h-3 w-3 text-green-400"/> Instalado</div>
                        <div className="flex items-center gap-1"><CubeIcon className="h-3 w-3 text-gray-300"/> Stock</div>
                        <div className="flex items-center gap-1"><CubeIcon className="h-3 w-3 text-red-400"/> Inop</div>
                    </div>
                </div>

                {/* Right: Stock / Uninstalled Tree */}
                <div 
                    className="w-1/3 bg-gray-900/50 rounded-lg border border-gray-700 p-4 flex flex-col min-w-0"
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDropToStock}
                >
                    <h3 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2 flex-shrink-0">
                        <CubeIcon className="h-5 w-5 text-gray-500"/> Almacén / Stock
                    </h3>
                    <p className="text-xs text-gray-500 mb-4 flex-shrink-0">Arrastra aquí para desmontar.</p>
                    
                    <div className="space-y-2 overflow-y-auto flex-1 pr-2">
                        {looseAssets.map(asset => {
                            // Find immediate children of this stock item
                            const children = assets.filter(child => child.parentId === asset.id);
                            
                            return (
                                <TreeItem 
                                    key={asset.id} 
                                    item={asset} 
                                    type="Asset" 
                                    childrenAssets={children}
                                    onDragStart={handleDragStart}
                                    onDrop={handleDrop}
                                    onUpdateStatus={handleUpdateStatus}
                                    onViewLogCard={setLogCardAsset}
                                    level={0}
                                    parentAircraft={undefined} // No parent aircraft for stock
                                    allAssets={assets}
                                />
                            )
                        })}
                        {looseAssets.length === 0 && <p className="text-gray-600 text-center text-sm py-10">No hay componentes en stock que coincidan.</p>}
                    </div>
                </div>
            </div>

            {movementModalOpen && movementData && (
                <ComponentMovementModal
                    isOpen={movementModalOpen}
                    onClose={() => setMovementModalOpen(false)}
                    onConfirm={handleConfirmMovement}
                    action={movementData.action}
                    asset={assets.find(a => a.id === movementData.assetId)!}
                    targetAircraft={movementData.targetAircraft}
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
