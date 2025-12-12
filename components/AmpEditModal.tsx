
import React, { useState, useMemo, useEffect } from 'react';
import type { AMP, Aircraft, Document, Fleet, AmpIncludedDocument } from '../types';
import { mockFleets, mockCertificates, mockAircrafts, mockDocuments } from '../data/mockDatabase';
import { XMarkIcon, AircraftIcon, DocsIcon, CheckCircleIcon, BookOpenIcon, LinkIcon, WorldIcon } from './Icons';
import { SearchableSelector } from './SearchableSelector';

interface AmpEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (amp: AMP) => void;
    amp: AMP;
    mode: 'add' | 'edit';
}

export const AmpEditModal: React.FC<AmpEditModalProps> = ({ isOpen, onClose, onSave, amp, mode }) => {
    const [editedAmp, setEditedAmp] = useState<AMP>(amp);
    const [filterDocsByFleet, setFilterDocsByFleet] = useState(true);
    
    const allAircrafts: Aircraft[] = mockAircrafts;
    const allDocuments: Document[] = mockDocuments;
    const allFleets: Fleet[] = mockFleets;
    const allCertificates = mockCertificates;

    useEffect(() => {
        setEditedAmp(amp);
    }, [amp]);

    // -- Handlers for General Info --
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        setEditedAmp(prev => {
            const newData = { ...prev, [name]: value };
            
            // CRITICAL FIX: If the fleet changes, we must clear the selected aircraft 
            // to prevent aircraft from Fleet A being assigned to an AMP for Fleet B.
            if (name === 'fleetId' && value !== prev.fleetId) {
                newData.includedAircraftSNs = [];
            }
            
            return newData;
        });
    };
    
    // -- Computed Data --
    const linkedFleet = useMemo(() => {
        return allFleets.find(f => f.id === editedAmp.fleetId);
    }, [editedAmp.fleetId, allFleets]);

    const fleetAircraft = useMemo(() => {
        // If a fleet is selected, filter aircraft. Otherwise show all (or empty if you prefer strictness).
        if (linkedFleet) {
            return allAircrafts.filter(ac => ac.fleetId === linkedFleet.id);
        }
        return allAircrafts; 
    }, [linkedFleet, allAircrafts]);

    const relevantDocuments = useMemo(() => {
        const activeDocs = allDocuments.filter(d => d.status === 'Active');
        
        if (filterDocsByFleet && linkedFleet) {
            const applicableCertIds = allCertificates
                .filter(c => c.applicableFleetIds.includes(linkedFleet.id))
                .map(c => c.id);
            
            return activeDocs.filter(d => 
                d.certificateIds.some(certId => applicableCertIds.includes(certId))
            );
        }
        return activeDocs;
    }, [allDocuments, allCertificates, linkedFleet, filterDocsByFleet]);

    // -- Handlers for Aircraft (Using SearchableSelector now) --
    const handleAircraftSelectionChange = (selectedSNs: string[]) => {
        setEditedAmp(prev => ({ ...prev, includedAircraftSNs: selectedSNs }));
    };
    
    // -- Handlers for Documents --
    const handleDocumentSelectionChange = (selectedDocIds: string[]) => {
        const newIncludedDocs: AmpIncludedDocument[] = selectedDocIds.map(docId => {
            const existing = editedAmp.includedDocuments.find(d => d.documentId === docId);
            if (existing) return existing;
            
            const doc = allDocuments.find(d => d.id === docId);
            return { documentId: docId, revisionUsed: doc?.revision || 'N/A' };
        });
        setEditedAmp(prev => ({ ...prev, includedDocuments: newIncludedDocs }));
    };
    
    const handleRevisionChange = (docId: string, newRevision: string) => {
        const newIncludedDocs = editedAmp.includedDocuments.map(d =>
            d.documentId === docId ? { ...d, revisionUsed: newRevision } : d
        );
        setEditedAmp({ ...editedAmp, includedDocuments: newIncludedDocs });
    };

    const handleSaveChanges = () => {
        const deadlines = editedAmp.includedDocuments
            .map(incDoc => allDocuments.find(d => d.id === incDoc.documentId)?.implementationDeadline)
            .filter((d): d is string => !!d)
            .map(d => new Date(d));
        const nextReviewDate = deadlines.length > 0 ? new Date(Math.min(...deadlines.map(d => d.getTime()))).toISOString().split('T')[0] : editedAmp.nextReviewDate;
        
        onSave({ ...editedAmp, nextReviewDate });
    };

    const renderAircraftItem = (ac: Aircraft, isSelected: boolean) => (
        <div className="flex-1 flex justify-between items-center">
            <span className="font-bold text-white">{ac.registration}</span>
            <span className="text-xs text-gray-400 font-mono">{ac.serialNumber}</span>
        </div>
    );

    const renderDocumentItem = (doc: Document, isSelected: boolean) => {
        const includedDoc = isSelected ? editedAmp.includedDocuments.find(d => d.documentId === doc.id) : null;
        const isRevisionMismatch = isSelected && includedDoc?.revisionUsed !== doc.revision;

        return (
            <div className="flex-1">
                <div className="flex justify-between items-baseline">
                        <p className="font-medium text-white truncate max-w-[200px]" title={doc.title}>{doc.title}</p>
                        <span className="text-xs font-mono text-gray-400 whitespace-nowrap">{doc.docType} ({doc.revision})</span>
                </div>
                <p className="text-xs text-gray-500">{doc.id}</p>
                {isSelected && (
                    <div className="mt-2 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <label htmlFor={`rev-${doc.id}`} className="text-xs font-medium text-sky-300 whitespace-nowrap">Rev. AMP:</label>
                        <input 
                            id={`rev-${doc.id}`} 
                            type="text" 
                            value={includedDoc?.revisionUsed || ''} 
                            onChange={(e) => handleRevisionChange(doc.id, e.target.value)}
                            className={`w-16 rounded-md border-0 bg-gray-600 py-0.5 px-2 text-white text-xs shadow-sm ring-1 ring-inset ring-gray-500 focus:ring-2 focus:ring-sky-500 ${isRevisionMismatch ? 'ring-yellow-500 ring-2' : ''}`}
                        />
                        {isRevisionMismatch && (
                            <span className="text-xs text-yellow-400" title={`La revisión actual del documento es ${doc.revision}`}>⚠️</span>
                        )}
                    </div>
                )}
            </div>
        )
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 id="modal-title" className="text-xl font-bold text-white">
                        {mode === 'add' ? 'Crear Nuevo AMP' : 'Editando AMP: '} 
                        <span className="text-sky-400">{editedAmp.name || 'Sin Título'}</span>
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                </header>

                <main className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0 overflow-y-auto">
                    
                    {/* Column 1: General Information */}
                    <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2">
                        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2 border-b border-gray-700 pb-2">
                            <BookOpenIcon className="h-5 w-5 text-sky-400"/> Datos Generales
                        </h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Nombre del Programa</label>
                            <input type="text" name="name" value={editedAmp.name} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Revisión</label>
                                <input type="text" name="revision" value={editedAmp.revision} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Fecha Rev.</label>
                                <input type="date" name="revisionDate" value={editedAmp.revisionDate} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white" />
                            </div>
                        </div>
                        <div>
                             <label htmlFor="fleetId" className="block text-sm font-medium text-gray-300">Flota Vinculada</label>
                             <select id="fleetId" name="fleetId" value={editedAmp.fleetId || ''} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white">
                                <option value="">-- Seleccionar Flota --</option>
                                {allFleets.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                        <div>
                             <label htmlFor="status" className="block text-sm font-medium text-gray-300">Estado</label>
                             <select id="status" name="status" value={editedAmp.status} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white">
                                <option value="Draft">Borrador</option>
                                <option value="Active">Activo</option>
                                <option value="Superseded">Obsoleto</option>
                            </select>
                        </div>
                        
                         <h3 className="text-sm font-semibold text-gray-400 mt-6 mb-2 border-b border-gray-700 pb-1">Enlaces y Referencias</h3>
                         <div>
                            <label className="block text-sm font-medium text-gray-300 flex items-center gap-2"><WorldIcon className="h-4 w-4 text-gray-500"/> Link Aprobación (Autoridad)</label>
                            <input type="url" name="officialLink" value={editedAmp.officialLink || ''} onChange={handleChange} placeholder="https://easa..." className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white text-xs" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-300 flex items-center gap-2"><LinkIcon className="h-4 w-4 text-gray-500"/> Link Interno (PDF)</label>
                            <input type="text" name="internalLink" value={editedAmp.internalLink || ''} onChange={handleChange} placeholder="/path/to/doc..." className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white text-xs" />
                        </div>

                         <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-300">Descripción / Notas</label>
                            <textarea name="notes" value={editedAmp.notes} onChange={handleChange} rows={4} className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white text-sm" />
                        </div>
                    </div>

                    {/* Column 2: Aircraft Selection */}
                    <div className="lg:col-span-1 bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col">
                        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><AircraftIcon className="h-5 w-5 text-sky-400"/> Aeronaves</h3>
                        {linkedFleet || !editedAmp.fleetId ? (
                            <div className="flex-grow flex flex-col min-h-0">
                                <SearchableSelector
                                    items={fleetAircraft}
                                    selectedIds={editedAmp.includedAircraftSNs}
                                    onSelectionChange={handleAircraftSelectionChange}
                                    renderItem={renderAircraftItem}
                                    placeholder="Buscar por matrícula..."
                                    maxSelections={100}
                                    itemIdentifier="serialNumber"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    {linkedFleet ? `Filtrado por flota: ${linkedFleet.name}` : 'Mostrando todas las aeronaves'}
                                </p>
                            </div>
                        ) : <p className="text-gray-500 text-sm">Seleccione una flota primero para añadir aeronaves.</p>}
                    </div>

                    {/* Column 3 & 4: Document Selection (Expanded) */}
                    <div className="lg:col-span-2 bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><DocsIcon className="h-5 w-5 text-sky-400"/> Documentación Base</h3>
                            {linkedFleet && (
                                <label className="flex items-center text-xs text-gray-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filterDocsByFleet}
                                        onChange={() => setFilterDocsByFleet(prev => !prev)}
                                        className="h-3.5 w-3.5 rounded border-gray-500 bg-gray-700 text-sky-500 focus:ring-sky-600 mr-2"
                                    />
                                    Solo Docs de Flota ({linkedFleet.name})
                                </label>
                            )}
                        </div>
                        <div className="flex-grow flex flex-col min-h-0">
                            <SearchableSelector
                                items={relevantDocuments}
                                selectedIds={editedAmp.includedDocuments.map(d => d.documentId)}
                                onSelectionChange={handleDocumentSelectionChange}
                                renderItem={renderDocumentItem}
                                placeholder="Filtrar manuales, ADs, SBs..."
                                maxSelections={1000}
                                itemIdentifier="id"
                            />
                        </div>
                    </div>
                </main>

                <footer className="flex justify-between items-center p-4 border-t border-gray-700 flex-shrink-0">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">Cancelar</button>
                    <button onClick={handleSaveChanges} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2"><CheckCircleIcon className="h-5 w-5"/> Guardar Cambios</button>
                </footer>
            </div>
        </div>
    );
};
