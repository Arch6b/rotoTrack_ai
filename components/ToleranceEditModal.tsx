
import React, { useState, useEffect, useMemo } from 'react';
import type { Tolerance, Document, AMP } from '../types';
import { mockDocuments, mockAmps } from '../data/mockDatabase';
import { XMarkIcon, DocsIcon, BookOpenIcon, CheckCircleIcon } from './Icons';
import { SearchableSelector } from './SearchableSelector';

interface ToleranceEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (tolerance: Tolerance) => void;
    tolerance: Tolerance;
}

export const ToleranceEditModal: React.FC<ToleranceEditModalProps> = ({ isOpen, onClose, onSave, tolerance }) => {
    const [editedTolerance, setEditedTolerance] = useState<Tolerance>(tolerance);
    
    useEffect(() => {
        setEditedTolerance(tolerance);
    }, [tolerance]);

    const handleFieldChange = (field: keyof Tolerance, value: string | string[]) => {
        setEditedTolerance(prev => ({ ...prev, [field]: value }));
    };

    const allActiveDocuments = useMemo(() => mockDocuments.filter(d => d.status === 'Active'), []);
    const allActiveAmps = useMemo(() => mockAmps.filter(a => a.status === 'Active' || a.status === 'Draft'), []);

    const selectedDocuments = useMemo(() => {
        return allActiveDocuments.filter(d => editedTolerance.sourceDocumentIds.includes(d.id));
    }, [editedTolerance.sourceDocumentIds, allActiveDocuments]);

    const handleSaveChanges = () => {
        onSave({ ...editedTolerance, lastModifiedDate: new Date().toISOString().split('T')[0], lastModifiedBy: 'user.edit' });
    };
    
    const renderDocumentItem = (doc: Document) => (
        <div className="flex-1 flex justify-between items-center text-sm">
            <div>
                <p className="font-medium">{doc.title}</p>
                <p className="text-xs text-gray-400">{doc.id}</p>
            </div>
            <span className="text-xs font-mono text-gray-400">Rev. {doc.revision}</span>
        </div>
    );

    const renderAmpItem = (amp: AMP) => (
         <div className="flex-1 flex justify-between items-center text-sm">
            <div>
                <p className="font-medium">{amp.name}</p>
                <p className="text-xs text-gray-400">{amp.id}</p>
            </div>
            <span className="text-xs font-mono text-gray-400">Rev. {amp.revision}</span>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 id="modal-title" className="text-xl font-bold text-white">
                        {tolerance.id ? `Editando Tolerancia: ` : `Crear Nueva Tolerancia`}
                        <span className="text-sky-400">{tolerance.title}</span>
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                </header>

                <main className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 overflow-y-auto">
                    {/* Left Column: Main Info & AMPs */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Título</label>
                            <input type="text" id="title" value={editedTolerance.title} onChange={e => handleFieldChange('title', e.target.value)} className="w-full rounded-md border-0 bg-gray-700 py-1.5 px-3 text-white ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-sky-500" />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                            <textarea id="description" value={editedTolerance.description} onChange={e => handleFieldChange('description', e.target.value)} rows={3} className="w-full rounded-md border-0 bg-gray-700 py-1.5 px-3 text-white ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-sky-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="tolerance" className="block text-sm font-medium text-gray-300 mb-1">Tolerancia (texto)</label>
                                <input type="text" id="tolerance" value={editedTolerance.tolerance} onChange={e => handleFieldChange('tolerance', e.target.value)} className="w-full rounded-md border-0 bg-gray-700 py-1.5 px-3 text-white ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-sky-500" placeholder='Ej: 10% o 300h'/>
                            </div>
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                                <select id="status" value={editedTolerance.status} onChange={e => handleFieldChange('status', e.target.value)} className="w-full rounded-md border-0 bg-gray-700 py-1.5 px-3 text-white ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-sky-500">
                                    <option value="Active">Activa</option>
                                    <option value="Inactive">Inactiva</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">Notas</label>
                            <textarea id="notes" value={editedTolerance.notes} onChange={e => handleFieldChange('notes', e.target.value)} rows={3} className="w-full rounded-md border-0 bg-gray-700 py-1.5 px-3 text-white ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-sky-500" />
                        </div>
                        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex-grow flex flex-col min-h-[150px]">
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><BookOpenIcon className="h-6 w-6 text-sky-400"/> AMPs Aplicables</h3>
                            <div className="flex-grow flex flex-col min-h-0">
                                <SearchableSelector
                                    items={allActiveAmps}
                                    selectedIds={editedTolerance.applicableAmpIds}
                                    onSelectionChange={(newIds) => handleFieldChange('applicableAmpIds', newIds)}
                                    renderItem={renderAmpItem}
                                    placeholder="Buscar AMPs para añadir..."
                                    maxSelections={1000}
                                    itemIdentifier="id"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Source Document */}
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col min-h-[400px]">
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><DocsIcon className="h-6 w-6 text-sky-400"/> Documento(s) de Origen</h3>
                        <div className="flex-grow flex flex-col min-h-0">
                             <SearchableSelector
                                items={allActiveDocuments}
                                selectedIds={editedTolerance.sourceDocumentIds}
                                onSelectionChange={(newIds) => handleFieldChange('sourceDocumentIds', newIds)}
                                renderItem={renderDocumentItem}
                                placeholder="Buscar documento de origen..."
                                maxSelections={1000}
                                itemIdentifier="id"
                            />
                            {selectedDocuments.length > 0 && (
                                <div className="mt-2 text-xs text-gray-400 flex-shrink-0">
                                    {selectedDocuments.length} documento(s) seleccionado(s).
                                </div>
                            )}
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
