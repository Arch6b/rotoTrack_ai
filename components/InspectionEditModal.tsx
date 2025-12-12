
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Inspection, Document, AMP, Aircraft, Component } from '../types';
import { mockDocuments, mockAmps, mockTolerances, mockFleets, mockFactorDefinitions, mockAircrafts, mockComponents, getSettings } from '../data/mockDatabase';
import { XMarkIcon, CheckCircleIcon, BookOpenIcon, DocsIcon, AircraftIcon, TagIcon, ClipboardDocumentListIcon } from './Icons';
import { SearchableSelector } from './SearchableSelector';

interface InspectionEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (inspection: Inspection) => void;
    inspection: Inspection | null;
}

const emptyInspection: Omit<Inspection, 'lastModifiedBy' | 'lastModifiedDate'> = {
    id: '',
    title: '',
    description: '',
    sourceDocumentIds: [],
    documentReference: '',
    ampId: '',
    toleranceId: '',
    intervals: [],
    zone: '',
    skillRequired: 'B1',
    manHours: 0,
    status: 'Active',
    notes: '',
    applicableAircraftSNs: [],
    applicablePartNumbers: [],
    jobCardLink: ''
};

type ModalTab = 'definition' | 'applicability';

export const InspectionEditModal: React.FC<InspectionEditModalProps> = ({ isOpen, onClose, onSave, inspection }) => {
    const [data, setData] = useState<Omit<Inspection, 'lastModifiedBy' | 'lastModifiedDate'>>(emptyInspection);
    const [activeTab, setActiveTab] = useState<ModalTab>('definition');
    
    // File Upload State
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Derived State
    const [applicableFactors, setApplicableFactors] = useState<{id: string, name: string, type: string}[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Ensure array fields exist when editing legacy data
            const initial = inspection || emptyInspection;
            setData({
                ...initial,
                sourceDocumentIds: initial.sourceDocumentIds || [],
                applicableAircraftSNs: initial.applicableAircraftSNs || [],
                applicablePartNumbers: initial.applicablePartNumbers || [],
            });
        }
    }, [inspection, isOpen]);

    // Effect: When AMP changes, find the Fleet, then find the Factors enabled for that Fleet
    useEffect(() => {
        if (data.ampId) {
            const amp = mockAmps.find(a => a.id === data.ampId);
            if (amp && amp.fleetId) {
                const fleet = mockFleets.find(f => f.id === amp.fleetId);
                if (fleet) {
                    const factors = fleet.customFactors
                        .map(cf => mockFactorDefinitions.find(fd => fd.id === cf.factorId))
                        .filter((fd): fd is typeof fd => !!fd) 
                        .map(fd => ({ id: fd.id, name: fd.name, type: fd.valueType }));
                    
                    setApplicableFactors(factors);
                    return; 
                }
            }
        }
        setApplicableFactors([]); 
    }, [data.ampId]);

    const handleFieldChange = (field: keyof Inspection, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const handleIntervalChange = (factorId: string, value: string) => {
        const numValue = value === '' ? null : parseFloat(value);
        setData(prev => {
            const currentIntervals = [...prev.intervals];
            const idx = currentIntervals.findIndex(i => i.factorId === factorId);
            if (numValue === null || isNaN(numValue)) {
                if (idx !== -1) currentIntervals.splice(idx, 1);
            } else {
                if (idx !== -1) {
                    currentIntervals[idx] = { factorId, value: numValue };
                } else {
                    currentIntervals.push({ factorId, value: numValue });
                }
            }
            return { ...prev, intervals: currentIntervals };
        });
    };

    const getIntervalValue = (factorId: string): string => {
        const interval = data.intervals.find(i => i.factorId === factorId);
        return interval ? interval.value.toString() : '';
    };

    const filteredTolerances = useMemo(() => {
        if (!data.ampId) return [];
        return mockTolerances.filter(t => t.applicableAmpIds.includes(data.ampId) && t.status === 'Active');
    }, [data.ampId]);

    // ** Filtering Logic based on selected AMP **
    const { filteredAircraft, filteredComponents, linkedFleetName } = useMemo(() => {
        const amp = mockAmps.find(a => a.id === data.ampId);
        if (!amp) return { filteredAircraft: [], filteredComponents: [], linkedFleetName: null };

        const fleet = mockFleets.find(f => f.id === amp.fleetId);
        const linkedFleetName = fleet ? fleet.name : null;

        // Filter Aircraft: Only show those belonging to the fleet linked to the AMP
        const aircraft = fleet ? mockAircrafts.filter(ac => ac.fleetId === fleet.id) : [];

        // Filter Components: Only show those linked to this AMP ID
        const components = mockComponents.filter(c => c.ampIds && c.ampIds.includes(amp.id));

        return { filteredAircraft: aircraft, filteredComponents: components, linkedFleetName };
    }, [data.ampId]);

    // ** File Upload Handlers **
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = (file: File) => {
        // Use the server URL configured in settings
        const settings = getSettings();
        const baseUrl = settings.serverUrl.replace(/\/$/, ""); // Remove trailing slash if present
        const simulatedUrl = `${baseUrl}/${file.name}`;
        
        // Simulating upload delay
        handleFieldChange('jobCardLink', simulatedUrl);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleFieldChange('jobCardLink', '');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };


    // -- Renderers for Selectors --
    const renderDocumentItem = (doc: Document) => (
        <div className="flex-1 flex justify-between items-center text-sm">
            <div className="truncate pr-2">
                <span className="text-white font-medium">{doc.title}</span>
            </div>
            <div className="flex flex-col items-end text-xs text-gray-400 whitespace-nowrap">
                <span>{doc.docType}</span>
                <span>{doc.id}</span>
            </div>
        </div>
    );

    const renderAmpItem = (amp: AMP) => (
        <div className="flex-1 flex justify-between items-center text-sm">
            <span className="text-white font-medium">{amp.name}</span>
            <span className="text-xs text-gray-400">{mockFleets.find(f => f.id === amp.fleetId)?.name || 'Sin Flota'}</span>
        </div>
    );

    const renderAircraftItem = (ac: Aircraft) => (
        <div className="flex-1 flex justify-between items-center text-sm">
            <span className="text-white font-bold">{ac.registration}</span>
            <span className="text-xs text-gray-400">{ac.model}</span>
        </div>
    );

    const renderComponentItem = (comp: Component) => (
        <div className="flex-1 flex justify-between items-center text-sm">
            <span className="text-white font-mono">{comp.partNumber}</span>
            <span className="text-xs text-gray-400 truncate max-w-[150px]">{comp.description}</span>
        </div>
    );

    const handleSubmit = () => {
        if (!data.id || !data.title || !data.ampId || !data.sourceDocumentIds || data.sourceDocumentIds.length === 0) {
            alert("Por favor complete los campos obligatorios (ID, Título, Documento, AMP).");
            return;
        }
        const selectedAmp = mockAmps.find(a => a.id === data.ampId);
        const finalInspection: Inspection = {
            ...data as Inspection,
            ampRevisionSnapshot: selectedAmp?.revision || ''
        };
        onSave(finalInspection);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">
                        {inspection ? 'Editar Tarea / Inspección' : 'Nueva Tarea / Inspección'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                </header>

                {/* Tabs */}
                <div className="border-b border-gray-700 px-6 pt-2 flex space-x-6 flex-shrink-0">
                    <button 
                        onClick={() => setActiveTab('definition')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'definition' ? 'border-sky-500 text-sky-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                    >
                        Definición y Planificación
                    </button>
                    <button 
                        onClick={() => setActiveTab('applicability')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'applicability' ? 'border-sky-500 text-sky-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                    >
                        Aplicabilidad y Recursos
                    </button>
                </div>

                <main className="p-6 flex-1 min-h-0 overflow-y-auto">
                    {activeTab === 'definition' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                            {/* Left: Basic Info */}
                            <div className="space-y-5 flex flex-col">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300">ID Tarea (Task Number)</label>
                                    <input type="text" value={data.id} onChange={e => handleFieldChange('id', e.target.value)} readOnly={!!inspection} className={`mt-1 block w-full rounded-md bg-gray-700 text-white ${inspection ? 'cursor-not-allowed bg-gray-600' : ''}`} placeholder="Ej: 05-20-00-201" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300">Título / Descripción Corta</label>
                                    <input type="text" value={data.title} onChange={e => handleFieldChange('title', e.target.value)} className="mt-1 block w-full rounded-md bg-gray-700 text-white" />
                                </div>
                                <div className="flex-grow flex flex-col">
                                    <label className="block text-sm font-medium text-gray-300">Descripción Detallada</label>
                                    <textarea value={data.description} onChange={e => handleFieldChange('description', e.target.value)} className="mt-1 block w-full h-32 rounded-md bg-gray-700 text-white resize-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300">Referencia Específica (Cap./Párrafo)</label>
                                    <input type="text" value={data.documentReference} onChange={e => handleFieldChange('documentReference', e.target.value)} className="mt-1 block w-full rounded-md bg-gray-700 text-white" placeholder="Ej: AMM 05-20-00, Table 1" />
                                </div>
                            </div>

                            {/* Right: Interval & Plan */}
                            <div className="space-y-5 flex flex-col">
                                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col flex-grow min-h-[200px]">
                                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2"><BookOpenIcon className="h-4 w-4 text-sky-400"/> Programa (AMP)</label>
                                    <div className="flex-grow min-h-0">
                                        <SearchableSelector 
                                            items={mockAmps.filter(a => a.status === 'Active')}
                                            selectedIds={data.ampId ? [data.ampId] : []}
                                            onSelectionChange={(ids) => handleFieldChange('ampId', ids[0] || '')}
                                            renderItem={renderAmpItem}
                                            placeholder="Seleccionar AMP..."
                                            maxSelections={1}
                                            itemIdentifier="id"
                                        />
                                    </div>
                                </div>

                                {/* Dynamic Intervals */}
                                <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                                    <h4 className="text-sm font-bold text-white mb-3">Intervalos de Inspección</h4>
                                    {applicableFactors.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            {applicableFactors.map(f => (
                                                <div key={f.id}>
                                                    <label className="block text-xs font-medium text-gray-400 mb-1">{f.name} ({f.id})</label>
                                                    <input 
                                                        type="number" 
                                                        placeholder="N/A"
                                                        value={getIntervalValue(f.id)} 
                                                        onChange={e => handleIntervalChange(f.id, e.target.value)}
                                                        className="block w-full rounded-md bg-gray-800 border-gray-600 text-white text-sm focus:ring-sky-500 focus:border-sky-500" 
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-yellow-500 italic">Seleccione un AMP vinculado a una flota para ver los factores disponibles.</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300">Tolerancia</label>
                                        <select 
                                            value={data.toleranceId || ''} 
                                            onChange={e => handleFieldChange('toleranceId', e.target.value)}
                                            disabled={filteredTolerances.length === 0}
                                            className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white disabled:opacity-50"
                                        >
                                            <option value="">-- Ninguna --</option>
                                            {filteredTolerances.map(t => (
                                                <option key={t.id} value={t.id}>{t.title} ({t.tolerance})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300">Estado</label>
                                        <select value={data.status} onChange={e => handleFieldChange('status', e.target.value)} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500 focus:ring-sky-500">
                                            <option value="Active">Activo</option>
                                            <option value="Inactive">Inactivo</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'applicability' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                            {/* Left: References & Resources */}
                            <div className="space-y-6 flex flex-col">
                                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col flex-grow min-h-[200px]">
                                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2"><DocsIcon className="h-4 w-4 text-sky-400"/> Documento(s) de Origen</label>
                                    <div className="flex-grow min-h-0">
                                        <SearchableSelector 
                                            items={mockDocuments.filter(d => d.status === 'Active')}
                                            selectedIds={data.sourceDocumentIds || []}
                                            onSelectionChange={(ids) => handleFieldChange('sourceDocumentIds', ids)}
                                            renderItem={renderDocumentItem}
                                            placeholder="Buscar manual, AD, SB..."
                                            maxSelections={100}
                                            itemIdentifier="id"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">{(data.sourceDocumentIds || []).length} documento(s) seleccionado(s).</p>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300">Zona</label>
                                        <input type="text" value={data.zone || ''} onChange={e => handleFieldChange('zone', e.target.value)} className="mt-1 block w-full rounded-md bg-gray-700 text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300">Skill</label>
                                        <select value={data.skillRequired || 'B1'} onChange={e => handleFieldChange('skillRequired', e.target.value)} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent">
                                            <option value="B1">B1</option>
                                            <option value="B2">B2</option>
                                            <option value="NDT">NDT</option>
                                            <option value="General">General</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300">Horas Est.</label>
                                        <input type="number" step="0.5" value={data.manHours || 0} onChange={e => handleFieldChange('manHours', parseFloat(e.target.value))} className="mt-1 block w-full rounded-md bg-gray-700 text-white" />
                                    </div>
                                </div>

                                {/* Job Card Upload Section */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Tarjeta de Trabajo (Job Card)</label>
                                    <div 
                                        className={`relative p-6 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-colors
                                            ${isDragging ? 'border-sky-500 bg-sky-900/20' : 'border-gray-600 bg-gray-800 hover:bg-gray-700/50'}
                                        `}
                                        onDragEnter={handleDragEnter}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={triggerFileInput}
                                    >
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            ref={fileInputRef} 
                                            onChange={handleFileSelect} 
                                            accept=".pdf,.doc,.docx"
                                        />
                                        
                                        {data.jobCardLink ? (
                                            <div className="w-full flex items-center justify-between bg-green-900/30 p-2 rounded border border-green-700/50">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <ClipboardDocumentListIcon className="h-6 w-6 text-green-400 flex-shrink-0" />
                                                    <div className="text-left overflow-hidden">
                                                        <p className="text-sm font-medium text-white truncate max-w-[200px]" title={data.jobCardLink}>
                                                            {data.jobCardLink.split('/').pop()}
                                                        </p>
                                                        <p className="text-xs text-green-400">Listo para vincular</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={removeFile}
                                                    className="p-1 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white"
                                                    title="Eliminar archivo"
                                                >
                                                    <XMarkIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <ClipboardDocumentListIcon className={`h-10 w-10 mb-2 ${isDragging ? 'text-sky-400' : 'text-gray-400'}`} />
                                                <p className="text-sm font-medium text-white">
                                                    {isDragging ? 'Suelta el archivo aquí' : 'Arrastra un PDF o haz clic para subir'}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">Soporta PDF, DOCX (Máx 10MB)</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Specific Applicability (Optional) */}
                            <div className="space-y-6 flex flex-col">
                                <div className="bg-gray-800 p-4 rounded-lg border border-gray-600 flex flex-col flex-1">
                                    <h4 className="text-sm font-bold text-white mb-2 border-b border-gray-600 pb-2">Restricción de Aplicabilidad (Opcional)</h4>
                                    <p className="text-xs text-gray-400 mb-4">
                                        Si no selecciona nada, la tarea aplica a toda la flota definida en el AMP.
                                        {linkedFleetName && <span className="text-sky-400 block mt-1">Mostrando recursos vinculados a la flota: {linkedFleetName}</span>}
                                    </p>
                                    
                                    <div className="flex-1 flex flex-col gap-4">
                                        <div className="flex-1 flex flex-col min-h-0 bg-gray-900/30 p-2 rounded">
                                            <label className="text-xs font-medium text-sky-300 mb-1 flex items-center gap-1"><AircraftIcon className="h-3 w-3"/> Aeronaves Específicas</label>
                                            <div className="flex-grow min-h-0">
                                                <SearchableSelector
                                                    items={filteredAircraft}
                                                    selectedIds={data.applicableAircraftSNs || []}
                                                    onSelectionChange={(ids) => handleFieldChange('applicableAircraftSNs', ids)}
                                                    renderItem={renderAircraftItem}
                                                    placeholder={filteredAircraft.length ? "Buscar matrículas..." : "Seleccione AMP primero"}
                                                    maxSelections={100}
                                                    itemIdentifier="serialNumber"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex-1 flex flex-col min-h-0 bg-gray-900/30 p-2 rounded">
                                            <label className="text-xs font-medium text-sky-300 mb-1 flex items-center gap-1"><TagIcon className="h-3 w-3"/> Componentes (P/N)</label>
                                            <div className="flex-grow min-h-0">
                                                <SearchableSelector
                                                    items={filteredComponents}
                                                    selectedIds={data.applicablePartNumbers || []}
                                                    onSelectionChange={(ids) => handleFieldChange('applicablePartNumbers', ids)}
                                                    renderItem={renderComponentItem}
                                                    placeholder={filteredComponents.length ? "Buscar Part Numbers..." : "Ningún componente asociado a este AMP"}
                                                    maxSelections={100}
                                                    itemIdentifier="id" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                <footer className="flex justify-between items-center p-4 border-t border-gray-700 flex-shrink-0">
                    <div className="text-xs text-gray-500">
                        {inspection ? `Modificado: ${inspection.lastModifiedDate}` : ''}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">Cancelar</button>
                        <button onClick={handleSubmit} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2"><CheckCircleIcon className="h-5 w-5"/> Guardar Tarea</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};
