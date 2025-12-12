
import React, { useState, useEffect, useMemo } from 'react';
import type { ComponentAsset, Component, Aircraft, FactorDefinition } from '../types';
import { mockComponents, mockAircrafts, mockFactorDefinitions, mockFleets, mockAmps, mockComponentAssets } from '../data/mockDatabase';
import { XMarkIcon, CheckCircleIcon, TagIcon, AircraftIcon, CubeIcon, AdjustmentsHorizontalIcon } from './Icons';
import { SearchableSelector } from './SearchableSelector';

interface ComponentAssetEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (asset: ComponentAsset) => void;
    asset: ComponentAsset | null;
}

const emptyAsset: ComponentAsset = {
    id: '',
    partNumberId: '',
    serialNumber: '',
    locationType: 'Stock',
    locationReference: 'Main Store',
    condition: 'Serviceable',
    counters: {},
    lifeLimit: {},
    notes: '',
    lastModifiedDate: '',
    parentId: null
};

export const ComponentAssetEditModal: React.FC<ComponentAssetEditModalProps> = ({ isOpen, onClose, onSave, asset }) => {
    const [data, setData] = useState<ComponentAsset>(emptyAsset);
    const [installType, setInstallType] = useState<'Direct' | 'NHA'>('Direct');
    
    useEffect(() => {
        if (isOpen) {
            const initial = asset || emptyAsset;
            setData({
                ...initial,
                counters: initial.counters || {},
                lifeLimit: initial.lifeLimit || {}
            });
            // Heuristic to detect install type
            if (initial.locationType === 'Aircraft') {
                const parentIsAircraft = mockAircrafts.some(a => a.serialNumber === initial.parentId);
                setInstallType(parentIsAircraft ? 'Direct' : 'NHA');
            }
        }
    }, [asset, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
    };

    const handlePnSelect = (ids: string[]) => {
        if(ids.length > 0) setData(prev => ({...prev, partNumberId: ids[0]}));
    };

    const handleAircraftSelect = (ids: string[]) => {
        if(ids.length > 0) {
            const ac = mockAircrafts.find(a => a.registration === ids[0]);
            setData(prev => ({
                ...prev, 
                locationReference: ids[0], // Registration
                parentId: installType === 'Direct' ? ac?.serialNumber : prev.parentId // If direct, parent is AC S/N
            }));
        }
    };

    const handleNhaSelect = (ids: string[]) => {
        if (ids.length > 0) {
            setData(prev => ({ ...prev, parentId: ids[0] })); // FK to Parent Component ID
        }
    };

    const handleCounterChange = (factorId: string, value: string) => {
        const numValue = parseFloat(value);
        setData(prev => ({
            ...prev,
            counters: {
                ...prev.counters,
                [factorId]: isNaN(numValue) ? 0 : numValue
            }
        }));
    };

    const handleLimitChange = (factorId: string, value: string) => {
        const numValue = parseFloat(value);
        setData(prev => {
            const newLimits = { ...prev.lifeLimit };
            if (value === '' || isNaN(numValue)) {
                delete newLimits[factorId];
            } else {
                newLimits[factorId] = numValue;
            }
            return { ...prev, lifeLimit: newLimits };
        });
    };

    const handleSubmit = () => {
        if (!data.partNumberId || !data.serialNumber) {
            alert('P/N y S/N son obligatorios.');
            return;
        }
        onSave(data);
    };

    // --- LOGIC: Intelligent Filtering ---
    
    const selectedComponent = useMemo(() => {
        return mockComponents.find(c => c.id === data.partNumberId);
    }, [data.partNumberId]);

    const filteredAircrafts = useMemo(() => {
        if (!selectedComponent) return mockAircrafts; 
        if (!selectedComponent.ampIds || selectedComponent.ampIds.length === 0) return mockAircrafts;

        const allowedFleetIds = new Set<string>();
        selectedComponent.ampIds.forEach(ampId => {
            const amp = mockAmps.find(a => a.id === ampId);
            if (amp && amp.fleetId) allowedFleetIds.add(amp.fleetId);
        });

        return mockAircrafts.filter(ac => allowedFleetIds.has(ac.fleetId) && ac.status === 'Active');
    }, [selectedComponent]);

    // List of candidate Parent Components (NHA) installed on the selected Aircraft
    const filteredNhaComponents = useMemo(() => {
        if (installType !== 'NHA' || !data.locationReference) return [];
        // Find all components currently installed on this aircraft (by locationReference)
        // exclude self
        return mockComponentAssets.filter(a => 
            a.locationType === 'Aircraft' && 
            a.locationReference === data.locationReference && 
            a.id !== data.id
        );
    }, [installType, data.locationReference, data.id]);

    const activeCounters = useMemo(() => {
        if (!selectedComponent || !selectedComponent.allowedFactorIds) return [];
        return selectedComponent.allowedFactorIds.map(fid => mockFactorDefinitions.find(fd => fd.id === fid)).filter(Boolean) as FactorDefinition[];
    }, [selectedComponent]);


    const renderPnItem = (item: Component) => (
        <div className="flex-1 flex justify-between items-center text-sm">
            <span className="font-bold text-white">{item.partNumber}</span>
            <span className="text-xs text-gray-400 truncate max-w-[200px]">{item.description}</span>
        </div>
    );

    const renderAircraftItem = (item: Aircraft) => (
        <div className="flex-1 flex justify-between items-center text-sm">
            <div>
                <span className="font-bold text-white block">{item.registration}</span>
                <span className="text-xs text-gray-500">{item.model}</span>
            </div>
            <span className="text-xs text-sky-600 bg-sky-900/20 px-2 py-0.5 rounded border border-sky-800">
                {mockFleets.find(f => f.id === item.fleetId)?.name}
            </span>
        </div>
    );

    const renderNhaItem = (item: ComponentAsset) => {
        const pn = mockComponents.find(c => c.id === item.partNumberId);
        return (
            <div className="flex-1 flex justify-between items-center text-sm">
                <div>
                    <span className="font-bold text-white block">{pn?.partNumber}</span>
                    <span className="text-xs text-gray-500">{pn?.description}</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">{item.serialNumber}</span>
            </div>
        );
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <CubeIcon className="h-6 w-6 text-sky-400"/>
                        {asset ? 'Editar Activo' : 'Nuevo Activo'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                </header>

                <main className="p-6 overflow-y-auto space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-2">Identificación</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Part Number (Catálogo)</label>
                            <div className="border border-gray-600 rounded-md h-40 flex flex-col overflow-hidden">
                                <SearchableSelector 
                                    items={mockComponents.filter(c => c.status === 'Active')}
                                    selectedIds={data.partNumberId ? [data.partNumberId] : []}
                                    onSelectionChange={handlePnSelect}
                                    renderItem={renderPnItem}
                                    placeholder="Buscar P/N..."
                                    maxSelections={1}
                                    itemIdentifier="id"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300">Serial Number (S/N)</label>
                            <input type="text" name="serialNumber" value={data.serialNumber} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white font-mono" placeholder="Ej: 12345-ABC" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-2">Estado y Ubicación</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Estado / Condición</label>
                                <select name="condition" value={data.condition} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent">
                                    <option value="Serviceable">Serviceable (Listo)</option>
                                    <option value="Unserviceable">Unserviceable (Inop)</option>
                                    <option value="Installed">Installed (Montado)</option>
                                    <option value="Scrapped">Scrapped (Chatarra)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Tipo Ubicación</label>
                                <select name="locationType" value={data.locationType} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent">
                                    <option value="Stock">Almacén (Stock)</option>
                                    <option value="Aircraft">Aeronave</option>
                                    <option value="MRO">Taller Externo</option>
                                </select>
                            </div>
                        </div>

                        {data.locationType === 'Aircraft' ? (
                            <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                                {/* Install Type Toggle */}
                                <div className="flex gap-4 mb-4 border-b border-gray-600 pb-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="installType" 
                                            checked={installType === 'Direct'} 
                                            onChange={() => {
                                                setInstallType('Direct');
                                                // Reset Parent to Aircraft S/N if currently selected aircraft
                                                if (data.locationReference) {
                                                    const ac = mockAircrafts.find(a => a.registration === data.locationReference);
                                                    setData(prev => ({ ...prev, parentId: ac?.serialNumber }));
                                                }
                                            }}
                                            className="text-sky-500 bg-gray-700 border-gray-500"
                                        />
                                        <span className="text-sm text-gray-200">Directo en Estructura (Root)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="installType" 
                                            checked={installType === 'NHA'} 
                                            onChange={() => {
                                                setInstallType('NHA');
                                                setData(prev => ({ ...prev, parentId: null })); // Force re-select of NHA
                                            }}
                                            className="text-sky-500 bg-gray-700 border-gray-500"
                                        />
                                        <span className="text-sm text-gray-200">En Subcomponente (NHA)</span>
                                    </label>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1 flex justify-between">
                                            <span>Aeronave (Matrícula)</span>
                                            {selectedComponent && (
                                                <span className="text-xs text-sky-400">Filtrado por AMPs del componente</span>
                                            )}
                                        </label>
                                        <div className="border border-gray-600 rounded-md h-32 flex flex-col overflow-hidden">
                                            <SearchableSelector 
                                                items={filteredAircrafts}
                                                selectedIds={[data.locationReference]}
                                                onSelectionChange={handleAircraftSelect}
                                                renderItem={renderAircraftItem}
                                                placeholder="Buscar Matrícula..."
                                                maxSelections={1}
                                                itemIdentifier="registration"
                                            />
                                        </div>
                                    </div>

                                    {installType === 'NHA' && (
                                        <div className="animate-in fade-in slide-in-from-top-2">
                                            <label className="block text-sm font-medium text-yellow-400 mb-1 flex items-center gap-2">
                                                <AdjustmentsHorizontalIcon className="h-4 w-4"/>
                                                Componente Padre (NHA - Next Higher Assembly)
                                            </label>
                                            {data.locationReference ? (
                                                <div className="border border-gray-600 rounded-md h-32 flex flex-col overflow-hidden">
                                                    <SearchableSelector 
                                                        items={filteredNhaComponents}
                                                        selectedIds={data.parentId && data.parentId !== mockAircrafts.find(a=>a.registration === data.locationReference)?.serialNumber ? [data.parentId] : []}
                                                        onSelectionChange={handleNhaSelect}
                                                        renderItem={renderNhaItem}
                                                        placeholder={`Buscar NHA en ${data.locationReference}...`}
                                                        maxSelections={1}
                                                        itemIdentifier="id"
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">Seleccione una aeronave primero.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Referencia Ubicación (Estantería / Taller)</label>
                                <input type="text" name="locationReference" value={data.locationReference} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-2">Vida Acumulada & Límites (LLP)</h3>
                        {activeCounters.length > 0 ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4 border-b border-gray-700 pb-1 mb-1">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Acumulado (TSN)</span>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Límite Vida (Total)</span>
                                </div>
                                {activeCounters.map(factor => (
                                    <div key={factor.id} className="grid grid-cols-2 gap-4 items-center">
                                        <div>
                                            <label className="block text-xs text-gray-300 mb-1">{factor.name}</label>
                                            <input 
                                                type="number" 
                                                step={factor.valueType === 'float' ? "0.1" : "1"}
                                                value={data.counters[factor.id] || 0} 
                                                onChange={e => handleCounterChange(factor.id, e.target.value)} 
                                                className="w-full rounded-md bg-gray-700 text-white border border-gray-600 text-sm" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-300 mb-1">Max {factor.id}</label>
                                            <input 
                                                type="number" 
                                                step={factor.valueType === 'float' ? "0.1" : "1"}
                                                value={data.lifeLimit?.[factor.id] || ''} 
                                                onChange={e => handleLimitChange(factor.id, e.target.value)} 
                                                placeholder="Ilimitado"
                                                className="w-full rounded-md bg-gray-900 text-red-300 border border-gray-800 text-sm placeholder-gray-600" 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500 italic">No hay contadores definidos para este Part Number. Edite el componente para añadir factores.</p>
                        )}
                        
                        <div className="pt-2">
                            <label className="block text-sm font-medium text-gray-300">Fecha Fabricación</label>
                            <input type="date" name="manufactureDate" value={data.manufactureDate || ''} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-300">Notas</label>
                            <textarea name="notes" rows={2} value={data.notes} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white" />
                        </div>
                    </div>
                </main>

                <footer className="flex justify-end p-4 border-t border-gray-700 flex-shrink-0 gap-3">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">Cancelar</button>
                    <button onClick={handleSubmit} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2"><CheckCircleIcon className="h-5 w-5"/> Guardar Activo</button>
                </footer>
            </div>
        </div>
    );
};
