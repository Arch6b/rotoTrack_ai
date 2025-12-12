
import React, { useState, useEffect, useMemo } from 'react';
import type { Document, Certificate, Inspection, Component } from '../types';
import { mockDocumentTypes } from '../data/mockDatabase';
import { XMarkIcon, CheckCircleIcon, AdjustmentsHorizontalIcon, DocsIcon, InspectionsIcon, TagIcon } from './Icons';
import { SearchableSelector } from './SearchableSelector';

interface DocumentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (doc: Document) => void;
    initialData: Document | null;
    mode: 'add' | 'edit';
    certificates: Certificate[];
    onManageTypes: () => void;
    onAddSupersedingDoc?: (callback: (newDocId: string) => void) => void;
    zIndex?: number;
    availableDocuments: Document[];
    // New props for extraction workflow
    linkedInspections?: Inspection[];
    linkedComponents?: Component[];
    onCreateInspectionFromDoc?: (docId: string) => void;
    onCreateComponentFromDoc?: (docId: string) => void;
}

const emptyDocument: Omit<Document, 'lastModifiedBy' | 'lastModifiedDate'> = {
    id: '',
    docType: '',
    title: '',
    revision: '',
    revisionDate: '',
    lastWebCheckDate: '',
    analysisFormRef: '',
    implementationDeadline: '',
    status: 'Active',
    certificateIds: [],
    notes: '',
    officialLink: '',
    internalLink: '',
};

type Tab = 'metadata' | 'breakdown';

export const DocumentFormModal: React.FC<DocumentFormModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    initialData, 
    mode, 
    certificates, 
    onManageTypes,
    onAddSupersedingDoc,
    zIndex = 50,
    availableDocuments,
    linkedInspections = [],
    linkedComponents = [],
    onCreateInspectionFromDoc,
    onCreateComponentFromDoc
}) => {
    const [doc, setDoc] = useState<Omit<Document, 'lastModifiedBy' | 'lastModifiedDate'>>(emptyDocument);
    const [errors, setErrors] = useState<Partial<Record<keyof Document, string>>>({});
    const [activeTab, setActiveTab] = useState<Tab>('metadata');

    useEffect(() => {
        if (isOpen) {
            const initial = initialData || emptyDocument;
            const safeInitial = {
                ...initial,
                certificateIds: (initial as any).certificateId ? [(initial as any).certificateId] : (initial.certificateIds || [])
            };
            setDoc(safeInitial);
            setErrors({});
            // Reset tab on open
            setActiveTab('metadata');
        }
    }, [initialData, isOpen]);

    const validate = () => {
        const newErrors: Partial<Record<keyof Document, string>> = {};
        if (!doc.title) newErrors.title = 'El título es obligatorio.';
        if (!doc.docType) newErrors.docType = 'El tipo es obligatorio.';
        if (!doc.certificateIds || doc.certificateIds.length === 0) newErrors.certificateIds = 'Debe vincularse al menos a un certificado.';
        if (!doc.revision) newErrors.revision = 'La revisión es obligatoria.';
        if (!doc.revisionDate) newErrors.revisionDate = 'La fecha de revisión es obligatoria.';

        if (doc.status === 'Superseded' && !doc.supersededByDocId) {
            newErrors.supersededByDocId = 'Debe seleccionar el documento que reemplaza a este.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            onSave(doc as Document);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDoc(prev => ({ ...prev, [name]: value }));
        
        if (errors[name as keyof Document]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }

        if (name === 'status' && value !== 'Superseded') {
             setDoc(prev => ({ ...prev, supersededByDocId: undefined }));
        }
    };
    
    const handleCertificateSelect = (ids: string[]) => {
        setDoc(prev => ({ ...prev, certificateIds: ids }));
        if (ids.length > 0 && errors.certificateIds) {
            setErrors(prev => ({...prev, certificateIds: undefined}));
        }
    };

    const handleSupersedingDocSelect = (ids: string[]) => {
        if (ids.length > 0) {
            setDoc(prev => ({ ...prev, supersededByDocId: ids[0] }));
            if (errors.supersededByDocId) setErrors(prev => ({...prev, supersededByDocId: undefined}));
        } else {
             setDoc(prev => ({ ...prev, supersededByDocId: undefined }));
        }
    };
    
    const handleCreateNewSupersedingDoc = () => {
        if (onAddSupersedingDoc) {
            onAddSupersedingDoc((newDocId) => {
                 setDoc(prev => ({ ...prev, supersededByDocId: newDocId }));
                 if (errors.supersededByDocId) setErrors(prev => ({...prev, supersededByDocId: undefined}));
            });
        }
    };

    const renderCertificateItem = (cert: Certificate) => (
        <div className="flex-1">
            <div className="flex justify-between items-baseline">
                <p className="font-medium text-white">{cert.tcds}</p>
                <span className="text-xs font-mono text-gray-400">{cert.type}</span>
            </div>
            <p className="text-xs text-gray-400">{cert.holder}</p>
        </div>
    );

    const renderSupersedingDocItem = (d: Document) => (
        <div className="flex-1">
            <div className="flex justify-between items-baseline">
                <p className="font-medium text-white">{d.title}</p>
                <span className="text-xs font-mono text-gray-400">{d.docType}</span>
            </div>
            <p className="text-xs text-gray-400">{d.id}</p>
        </div>
    );

    const availableSupersedingDocs = useMemo(() => {
        return availableDocuments.filter(d => d.id !== doc.id && d.status === 'Active');
    }, [doc.id, availableDocuments]);

    const selectedSupersedingDoc = useMemo(() => {
        return availableDocuments.find(d => d.id === doc.supersededByDocId);
    }, [availableDocuments, doc.supersededByDocId]);

    const activeDocTypes = mockDocumentTypes.filter(dt => dt.status === 'Active');

    if (!isOpen) return null;

    const title = mode === 'add' ? 'Añadir Nuevo Documento' : `Editando: ${initialData?.id || 'Nuevo Doc'}`;
    const zIndexClass = `z-[${zIndex}]`;

    return (
        <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center ${zIndexClass} p-4`} style={{ zIndex: zIndex }}>
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <DocsIcon className="h-6 w-6 text-sky-400"/>
                        {title}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                </header>

                <div className="flex border-b border-gray-700 px-6 pt-2 space-x-4 flex-shrink-0">
                    <button 
                        onClick={() => setActiveTab('metadata')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'metadata' ? 'border-sky-500 text-sky-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                    >
                        Metadatos y Estado
                    </button>
                    {mode === 'edit' && (
                        <button 
                            onClick={() => setActiveTab('breakdown')}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'breakdown' ? 'border-sky-500 text-sky-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                        >
                            Desglose Técnico 
                            <span className="bg-gray-700 text-xs px-1.5 py-0.5 rounded-full text-gray-300">
                                {linkedInspections.length + linkedComponents.length}
                            </span>
                        </button>
                    )}
                </div>

                <main className="p-6 overflow-y-auto flex-1 min-h-0">
                    {activeTab === 'metadata' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                {/* Column 1 */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-2">Información del Documento</h3>
                                    
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="docType" className="block font-medium text-gray-300">Tipo</label>
                                            <button onClick={onManageTypes} className="text-sky-400 hover:text-sky-300 transition-colors" title="Gestionar Tipos de Documento">
                                                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                        <select id="docType" name="docType" value={doc.docType} onChange={handleChange} className={`mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white ${errors.docType ? 'border-red-500 ring-red-500' : ''}`}>
                                            <option value="">-- Seleccionar Tipo --</option>
                                            {activeDocTypes.map(dt => (
                                                <option key={dt.id} value={dt.id}>{dt.id} ({dt.name})</option>
                                            ))}
                                        </select>
                                        {errors.docType && <p className="text-red-400 text-xs mt-1">{errors.docType}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="title" className="block font-medium text-gray-300">Título</label>
                                        <input type="text" name="title" id="title" value={doc.title} onChange={handleChange} className={`mt-1 block w-full rounded-md bg-gray-700 text-white ${errors.title ? 'border-red-500 ring-red-500' : 'border-transparent focus:border-sky-500 focus:ring-sky-500'}`}/>
                                        {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                                    </div>
                                    
                                    <div>
                                        <label className="block font-medium text-gray-300 mb-2">Certificado(s) Vinculado(s)</label>
                                        <div className={`p-2 border rounded-md max-h-48 overflow-y-auto ${errors.certificateIds ? 'border-red-500' : 'border-gray-600'}`}>
                                            <SearchableSelector
                                                items={certificates}
                                                selectedIds={doc.certificateIds}
                                                onSelectionChange={handleCertificateSelect}
                                                renderItem={renderCertificateItem}
                                                placeholder="Buscar por TCDS, tipo o titular..."
                                                maxSelections={100}
                                                itemIdentifier="id"
                                            />
                                        </div>
                                        {errors.certificateIds && <p className="text-red-400 text-xs mt-1">{errors.certificateIds}</p>}
                                        {doc.certificateIds.length > 0 && (
                                            <p className="text-xs text-sky-400 mt-1">{doc.certificateIds.length} certificado(s) seleccionado(s).</p>
                                        )}
                                    </div>
                                </div>

                                {/* Column 2 */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-2">Control y Estado</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="revision" className="block font-medium text-gray-300">Nº Revisión</label>
                                            <input type="text" name="revision" id="revision" value={doc.revision} onChange={handleChange} className={`mt-1 block w-full rounded-md bg-gray-700 text-white ${errors.revision ? 'border-red-500 ring-red-500' : 'border-transparent focus:border-sky-500 focus:ring-sky-500'}`}/>
                                            {errors.revision && <p className="text-red-400 text-xs mt-1">{errors.revision}</p>}
                                        </div>
                                        <div>
                                            <label htmlFor="revisionDate" className="block font-medium text-gray-300">Fecha Revisión</label>
                                            <input type="date" name="revisionDate" id="revisionDate" value={doc.revisionDate} onChange={handleChange} className={`mt-1 block w-full rounded-md bg-gray-700 text-white ${errors.revisionDate ? 'border-red-500 ring-red-500' : 'border-transparent focus:border-sky-500 focus:ring-sky-500'}`}/>
                                            {errors.revisionDate && <p className="text-red-400 text-xs mt-1">{errors.revisionDate}</p>}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="status" className="block font-medium text-gray-300">Estado</label>
                                        <select id="status" name="status" value={doc.status} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white">
                                            <option value="Active">Active</option>
                                            <option value="Superseded">Superseded</option>
                                            <option value="Draft">Draft</option>
                                        </select>
                                    </div>

                                    {/* Superseded Logic */}
                                    {doc.status === 'Superseded' && (
                                        <div className="p-3 bg-gray-900/50 border border-gray-600 rounded-md animate-in fade-in slide-in-from-top-1 duration-200">
                                            <label className="block font-medium text-yellow-400 mb-2">Reemplazado por (Documento Nuevo)</label>
                                            
                                            {selectedSupersedingDoc ? (
                                                <div className="flex items-center justify-between p-3 bg-gray-800/80 border border-sky-500/50 rounded-md shadow-sm">
                                                    <div className="flex-1">
                                                        <div className="flex items-baseline gap-2">
                                                            <p className="font-medium text-white">{selectedSupersedingDoc.title}</p>
                                                            <span className="text-xs font-mono text-sky-400 bg-sky-900/30 px-1.5 rounded">{selectedSupersedingDoc.id}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                                                            <span>Tipo: {selectedSupersedingDoc.docType}</span>
                                                            <span>Rev: {selectedSupersedingDoc.revision}</span>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setDoc(prev => ({ ...prev, supersededByDocId: undefined }))}
                                                        className="ml-4 p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-full transition-colors"
                                                        title="Cambiar documento"
                                                    >
                                                        <XMarkIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className={`p-2 border rounded-md max-h-48 overflow-y-auto ${errors.supersededByDocId ? 'border-red-500' : 'border-gray-600'}`}>
                                                        <SearchableSelector
                                                            items={availableSupersedingDocs}
                                                            selectedIds={[]}
                                                            onSelectionChange={handleSupersedingDocSelect}
                                                            renderItem={renderSupersedingDocItem}
                                                            placeholder="Buscar documento que reemplaza..."
                                                            maxSelections={1}
                                                            itemIdentifier="id"
                                                        />
                                                    </div>
                                                    <div className="mt-2 text-right">
                                                        <button 
                                                            type="button" 
                                                            onClick={handleCreateNewSupersedingDoc} 
                                                            className="text-xs text-sky-400 hover:text-sky-300 underline flex items-center justify-end gap-1 ml-auto"
                                                        >
                                                            <DocsIcon className="h-3 w-3" />
                                                            ¿No está en la lista? Crear nuevo
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                            {errors.supersededByDocId && <p className="text-red-400 text-xs mt-1">{errors.supersededByDocId}</p>}
                                        </div>
                                    )}

                                    <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-2 pt-2">Cumplimiento</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="analysisFormRef" className="block font-medium text-gray-300">Ref. Análisis</label>
                                            <input type="text" name="analysisFormRef" id="analysisFormRef" value={doc.analysisFormRef || ''} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500 focus:ring-sky-500" placeholder="Ej. ING-2024-01"/>
                                        </div>
                                        <div>
                                            <label htmlFor="implementationDeadline" className="block font-medium text-gray-300">Plazo Implement.</label>
                                            <input type="date" name="implementationDeadline" id="implementationDeadline" value={doc.implementationDeadline || ''} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500 focus:ring-sky-500"/>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Full Width Bottom Section */}
                            <div className="pt-4 border-t border-gray-700/50 space-y-4">
                                <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-2">Enlaces y Notas</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="officialLink" className="block font-medium text-gray-300">Enlace Oficial</label>
                                        <input type="url" name="officialLink" id="officialLink" value={doc.officialLink || ''} onChange={handleChange} placeholder="https://..." className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500 focus:ring-sky-500"/>
                                    </div>
                                    <div>
                                        <label htmlFor="internalLink" className="block font-medium text-gray-300">Enlace Interno</label>
                                        <input type="text" name="internalLink" id="internalLink" value={doc.internalLink || ''} onChange={handleChange} placeholder="/path/to/doc" className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500 focus:ring-sky-500"/>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="notes" className="block font-medium text-gray-300">Notas</label>
                                    <textarea name="notes" id="notes" value={doc.notes} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500 focus:ring-sky-500"/>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'breakdown' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                            {/* Extracted Tasks/Inspections */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-gray-600 pb-2">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <InspectionsIcon className="h-5 w-5 text-sky-400"/>
                                        Tareas de Inspección Extraídas
                                    </h3>
                                    {onCreateInspectionFromDoc && doc.id && (
                                        <button 
                                            onClick={() => onCreateInspectionFromDoc(doc.id)}
                                            className="text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold py-1.5 px-3 rounded shadow transition-colors flex items-center gap-1"
                                        >
                                            + Extraer Nueva Tarea
                                        </button>
                                    )}
                                </div>
                                {linkedInspections.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-2">
                                        {linkedInspections.map(insp => (
                                            <div key={insp.id} className="bg-gray-700/50 p-3 rounded-md flex justify-between items-center border border-gray-600">
                                                <div>
                                                    <span className="block font-bold text-sky-300 text-sm">{insp.id}</span>
                                                    <span className="text-white text-sm">{insp.title}</span>
                                                </div>
                                                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">Ref: {insp.documentReference}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm italic py-4 text-center bg-gray-900/30 rounded border border-dashed border-gray-700">No hay tareas vinculadas a este documento aún.</p>
                                )}
                            </div>

                            {/* Extracted Components */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-gray-600 pb-2">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <TagIcon className="h-5 w-5 text-sky-400"/>
                                        Componentes Afectados (Catálogo)
                                    </h3>
                                    {onCreateComponentFromDoc && doc.id && (
                                        <button 
                                            onClick={() => onCreateComponentFromDoc(doc.id)}
                                            className="text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold py-1.5 px-3 rounded shadow transition-colors flex items-center gap-1"
                                        >
                                            + Extraer Nuevo Componente
                                        </button>
                                    )}
                                </div>
                                {linkedComponents.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-2">
                                        {linkedComponents.map(comp => (
                                            <div key={comp.id} className="bg-gray-700/50 p-3 rounded-md flex justify-between items-center border border-gray-600">
                                                <div>
                                                    <span className="block font-bold text-sky-300 text-sm">{comp.partNumber}</span>
                                                    <span className="text-white text-sm">{comp.description}</span>
                                                </div>
                                                <span className="text-xs text-gray-400">{comp.id}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm italic py-4 text-center bg-gray-900/30 rounded border border-dashed border-gray-700">No hay componentes vinculados a este documento aún.</p>
                                )}
                            </div>
                        </div>
                    )}
                </main>

                <footer className="flex justify-end p-4 border-t border-gray-700 flex-shrink-0">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors mr-3">Cancelar</button>
                    <button onClick={handleSave} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5"/> Guardar Documento
                    </button>
                </footer>
            </div>
        </div>
    );
};
