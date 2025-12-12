
import React, { useState } from 'react';
import type { ComponentAsset, Component, ComponentHistoryEntry } from '../types';
import { mockComponents, mockComponentAssets } from '../data/mockDatabase';
import { XMarkIcon, CubeIcon } from './Icons';

interface ComponentLogCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: ComponentAsset;
}

interface HistoryRow {
    install: ComponentHistoryEntry | null;
    remove: ComponentHistoryEntry | null;
}

export const ComponentLogCardModal: React.FC<ComponentLogCardModalProps> = ({ isOpen, onClose, asset }) => {
    const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
    
    if (!isOpen) return null;

    const componentDef = mockComponents.find(c => c.id === asset.partNumberId);
    
    // Find subcomponents currently installed on THIS asset (Parent)
    const subcomponents = mockComponentAssets.filter(a => a.parentId === asset.id);

    const processHistory = (history: ComponentHistoryEntry[]): HistoryRow[] => {
        const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const rows: HistoryRow[] = [];
        let currentInstall: ComponentHistoryEntry | null = null;

        sortedHistory.forEach(entry => {
            if (entry.action === 'Install') {
                if (currentInstall) {
                    rows.push({ install: currentInstall, remove: null });
                }
                currentInstall = entry;
            } else if (entry.action === 'Remove') {
                if (currentInstall) {
                    rows.push({ install: currentInstall, remove: entry });
                    currentInstall = null;
                } else {
                    rows.push({ install: null, remove: entry });
                }
            }
        });

        if (currentInstall) {
            rows.push({ install: currentInstall, remove: null });
        }

        return rows.reverse();
    };

    const historyRows = processHistory(asset.history || []);

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
            <div className="bg-white text-gray-900 rounded-sm shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
                
                {/* Refined Header - Strict Paper Style */}
                <header className="bg-white p-8 flex flex-col gap-6 flex-shrink-0 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-600 print:hidden"><XMarkIcon className="h-8 w-8" /></button>
                    
                    <div className="text-center border-b-2 border-black pb-2 mb-2">
                        <h2 className="text-3xl font-serif font-black tracking-widest uppercase text-black">Historical Service Record</h2>
                    </div>

                    <div className="grid grid-cols-12 gap-0 border-2 border-black">
                        {/* Nomenclature */}
                        <div className="col-span-4 p-2 border-r border-black">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">Nomenclature</span>
                            <span className="block text-lg font-bold font-mono truncate" title={componentDef?.description}>{componentDef?.description || 'N/A'}</span>
                        </div>
                        {/* Part Number */}
                        <div className="col-span-4 p-2 border-r border-black">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">Part Number</span>
                            <span className="block text-lg font-bold font-mono">{componentDef?.partNumber || asset.partNumberId}</span>
                        </div>
                        {/* Serial Number */}
                        <div className="col-span-4 p-2">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">Serial Number</span>
                            <span className="block text-lg font-bold font-mono text-blue-900">{asset.serialNumber}</span>
                        </div>
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex bg-gray-100 border-b border-gray-300 px-8 pt-2 gap-1 flex-shrink-0 print:hidden">
                    <button 
                        onClick={() => setActiveSide('front')}
                        className={`px-6 py-2 rounded-t font-bold uppercase text-xs tracking-wide border-t border-l border-r ${activeSide === 'front' ? 'bg-white text-black border-gray-400 -mb-[1px] z-10' : 'bg-gray-200 text-gray-500 hover:bg-gray-300 border-gray-300'}`}
                    >
                        Front (Installation History)
                    </button>
                    <button 
                        onClick={() => setActiveSide('back')}
                        className={`px-6 py-2 rounded-t font-bold uppercase text-xs tracking-wide border-t border-l border-r ${activeSide === 'back' ? 'bg-white text-black border-gray-400 -mb-[1px] z-10' : 'bg-gray-200 text-gray-500 hover:bg-gray-300 border-gray-300'}`}
                    >
                        Back (Configuration & ADs)
                    </button>
                </div>

                <main className="flex-1 overflow-y-auto p-8 bg-white font-mono text-sm relative">
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
                        <CubeIcon className="h-96 w-96" />
                    </div>

                    {activeSide === 'front' && (
                        <div className="border-2 border-black">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 bg-gray-200 border-b-2 border-black text-center font-bold text-[10px] uppercase divide-x divide-black">
                                <div className="col-span-6">
                                    <div className="p-1 border-b border-black bg-gray-300">Installation Data</div>
                                    <div className="grid grid-cols-4 divide-x divide-black h-full">
                                        <div className="p-2 flex items-center justify-center">Date</div>
                                        <div className="p-2 flex items-center justify-center">Installed At<br/>(A/C or Assy)</div>
                                        <div className="p-2 flex items-center justify-center">Position</div>
                                        <div className="p-2 flex items-center justify-center">Comp. Hours<br/>(TSN)</div>
                                    </div>
                                </div>
                                <div className="col-span-6">
                                    <div className="p-1 border-b border-black bg-gray-300">Removal Data</div>
                                    <div className="grid grid-cols-4 divide-x divide-black h-full">
                                        <div className="p-2 flex items-center justify-center">Date</div>
                                        <div className="p-2 flex items-center justify-center">Removed At</div>
                                        <div className="p-2 flex items-center justify-center">Comp. Hours<br/>(TSN)</div>
                                        <div className="p-2 flex items-center justify-center">Reason</div>
                                    </div>
                                </div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-black bg-white text-xs leading-relaxed">
                                {historyRows.length === 0 ? (
                                    <div className="p-12 text-center text-gray-400 italic uppercase">No historical entries recorded.</div>
                                ) : (
                                    historyRows.map((row, idx) => {
                                        const installDate = row.install ? row.install.date : '';
                                        // Cleaner extraction of location from details string
                                        const installLocRaw = row.install ? row.install.details : '';
                                        const installLoc = installLocRaw.includes('Installed on') ? installLocRaw.split('Installed on ')[1].split('.')[0] : 'Unknown';
                                        
                                        const installTSN = row.install && row.install.countersSnapshot ? row.install.countersSnapshot['FH'] || 0 : '-';
                                        
                                        const removeDate = row.remove ? row.remove.date : '';
                                        const removeLocRaw = row.remove ? row.remove.details : '';
                                        const removeLoc = removeLocRaw.includes('Removed from') ? removeLocRaw.split('Removed from ')[1].split('.')[0] : '';
                                        
                                        const removeTSN = row.remove && row.remove.countersSnapshot ? row.remove.countersSnapshot['FH'] || 0 : '-';
                                        const removeReason = row.remove ? (row.remove.details.includes('Scrapped') ? 'SCRAP' : 'Sched. Removal') : (row.install ? <span className="text-green-700 font-bold tracking-wider">ON WING</span> : '');

                                        return (
                                            <div key={idx} className="grid grid-cols-12 divide-x divide-black hover:bg-gray-50">
                                                {/* Installation Columns */}
                                                <div className="col-span-6 grid grid-cols-4 divide-x divide-black">
                                                    <div className="p-2 text-center">{installDate}</div>
                                                    <div className="p-2 font-bold text-blue-900 text-center">{installLoc}</div>
                                                    <div className="p-2 text-center text-gray-400">-</div>
                                                    <div className="p-2 text-right font-bold">{typeof installTSN === 'number' ? installTSN.toFixed(1) : installTSN}</div>
                                                </div>

                                                {/* Removal Columns */}
                                                <div className="col-span-6 grid grid-cols-4 divide-x divide-black">
                                                    <div className="p-2 text-center">{removeDate}</div>
                                                    <div className="p-2 text-center">{removeLoc}</div>
                                                    <div className="p-2 text-right">{typeof removeTSN === 'number' ? removeTSN.toFixed(1) : removeTSN}</div>
                                                    <div className="p-2 text-center uppercase text-[10px] font-semibold">{removeReason}</div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {activeSide === 'back' && (
                        <div className="space-y-8">
                            <div className="border-2 border-black">
                                <div className="bg-gray-200 border-b-2 border-black p-2 text-center font-bold text-xs uppercase tracking-wide">
                                    Installed Subcomponents (Configuration Status)
                                </div>
                                <div className="divide-y divide-black">
                                    <div className="grid grid-cols-12 bg-gray-100 font-bold text-[10px] uppercase divide-x divide-black text-center">
                                        <div className="col-span-3 p-2">Part Number</div>
                                        <div className="col-span-3 p-2">Serial Number</div>
                                        <div className="col-span-4 p-2">Description</div>
                                        <div className="col-span-2 p-2">TSN</div>
                                    </div>
                                    {subcomponents.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500 italic text-xs">No subcomponents installed (NHA is empty).</div>
                                    ) : (
                                        subcomponents.map(sub => {
                                            const subDef = mockComponents.find(c => c.id === sub.partNumberId);
                                            return (
                                                <div key={sub.id} className="grid grid-cols-12 divide-x divide-black text-xs hover:bg-gray-50">
                                                    <div className="col-span-3 p-2 font-bold">{subDef?.partNumber}</div>
                                                    <div className="col-span-3 p-2 font-mono text-blue-900">{sub.serialNumber}</div>
                                                    <div className="col-span-4 p-2 truncate">{subDef?.description}</div>
                                                    <div className="col-span-2 p-2 text-center">{sub.counters['FH'] || 0}</div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="border-2 border-black">
                                <div className="bg-gray-200 border-b-2 border-black p-2 text-center font-bold text-xs uppercase tracking-wide">
                                    Technical Directives & History of Overhaul
                                </div>
                                <div className="h-64 flex items-center justify-center text-gray-400 italic border-t border-black bg-white">
                                    (Space reserved for ADs/SBs compliance records and overhaul stamps)
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                <footer className="bg-white p-4 border-t-2 border-black text-[10px] text-gray-500 text-center uppercase tracking-widest">
                    Regulatory Tracking Suite &bull; Official Record Generation &bull; Form RTS-004 Rev. 2
                </footer>
            </div>
        </div>
    );
};
