
import React, { useState, useMemo } from 'react';
import type { Document } from '../types';
import { SearchIcon, WorldIcon, CheckCircleIcon, ClipboardDocumentCheckIcon } from './Icons';

interface DocumentationReviewViewProps {
    onUpdateDocument: (docs: Document[]) => void;
    documents: Document[];
}

export const DocumentationReviewView: React.FC<DocumentationReviewViewProps> = ({ onUpdateDocument, documents }) => {
    const [filter, setFilter] = useState('');
    
    // Set of IDs selected for bulk update
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

    // Local state to handle edits before saving
    const [pendingChanges, setPendingChanges] = useState<Record<string, { revision: string; revisionDate: string }>>({});

    const activeDocuments = useMemo(() => {
        let docs = documents.filter(d => d.status === 'Active');
        if (filter) {
            const lowerFilter = filter.toLowerCase();
            docs = docs.filter(d => d.title.toLowerCase().includes(lowerFilter) || d.docType.toLowerCase().includes(lowerFilter) || d.id.toLowerCase().includes(lowerFilter));
        }
        return docs;
    }, [filter, documents]);

    const handleInputChange = (docId: string, field: 'revision' | 'revisionDate', value: string) => {
        setPendingChanges(prev => {
            const current = prev[docId] || { 
                revision: documents.find(d => d.id === docId)?.revision || '', 
                revisionDate: documents.find(d => d.id === docId)?.revisionDate || '' 
            };
            return {
                ...prev,
                [docId]: { ...current, [field]: value }
            };
        });
        
        // Auto-check the row when data is modified
        if (!checkedIds.has(docId)) {
            const newSet = new Set(checkedIds);
            newSet.add(docId);
            setCheckedIds(newSet);
        }
    };

    const handleCheckboxChange = (docId: string) => {
        const newSet = new Set(checkedIds);
        if (newSet.has(docId)) {
            newSet.delete(docId);
        } else {
            newSet.add(docId);
        }
        setCheckedIds(newSet);
    };

    const handleSelectAll = () => {
        if (checkedIds.size === activeDocuments.length) {
            setCheckedIds(new Set());
        } else {
            setCheckedIds(new Set(activeDocuments.map(d => d.id)));
        }
    };

    const handleBulkSave = () => {
        const today = new Date().toISOString().split('T')[0];
        const updates: Document[] = [];

        checkedIds.forEach(docId => {
            const originalDoc = documents.find(d => d.id === docId);
            if (!originalDoc) return;

            const changes = pendingChanges[docId];
            
            const updatedDoc: Document = {
                ...originalDoc,
                revision: changes ? changes.revision : originalDoc.revision,
                revisionDate: changes ? changes.revisionDate : originalDoc.revisionDate,
                lastWebCheckDate: today,
                lastModifiedBy: 'user.audit',
                lastModifiedDate: today
            };
            updates.push(updatedDoc);
        });

        // Trigger single bulk update
        onUpdateDocument(updates);

        // Clear state
        setCheckedIds(new Set());
        setPendingChanges({});
    };

    const isToday = (dateString?: string) => {
        if (!dateString) return false;
        const today = new Date().toISOString().split('T')[0];
        return dateString === today;
    };

    return (
        <div className="space-y-4">
             <div className="flex justify-between items-center gap-4 flex-wrap bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <div>
                    <h2 className="text-xl font-semibold text-white">Auditoría Masiva de Documentación</h2>
                    <p className="text-sm text-gray-400">Marca los documentos verificados. Los cambios se guardarán en lote.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="h-5 w-5 text-gray-400" /></div>
                        <input type="text" placeholder="Filtrar por título o ID..." value={filter} onChange={e => setFilter(e.target.value)} className="block w-full rounded-md border-0 bg-gray-700 py-1.5 pl-10 pr-3 text-gray-200 ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-sky-500 sm:text-sm" />
                    </div>
                    {checkedIds.size > 0 && (
                        <button 
                            onClick={handleBulkSave}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all flex items-center gap-2 animate-in fade-in slide-in-from-right-4"
                        >
                            <ClipboardDocumentCheckIcon className="h-5 w-5" />
                            Guardar Selección ({checkedIds.size})
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-300">
                        <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase tracking-wider">
                            <tr>
                                <th scope="col" className="px-6 py-3 w-10 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={activeDocuments.length > 0 && checkedIds.size === activeDocuments.length}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-sky-500 focus:ring-sky-600 cursor-pointer"
                                    />
                                </th>
                                <th scope="col" className="px-6 py-3">Documento</th>
                                <th scope="col" className="px-6 py-3 w-32 text-center">Web</th>
                                <th scope="col" className="px-6 py-3 w-40">Revisión</th>
                                <th scope="col" className="px-6 py-3 w-48">Fecha Rev.</th>
                                <th scope="col" className="px-6 py-3 w-48 text-center">Últ. Comprobación</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {activeDocuments.map(doc => {
                                const changes = pendingChanges[doc.id];
                                const currentRev = changes ? changes.revision : doc.revision;
                                const currentRevDate = changes ? changes.revisionDate : doc.revisionDate;
                                const isCheckedToday = isToday(doc.lastWebCheckDate);
                                const isSelected = checkedIds.has(doc.id);
                                const hasUnsavedChanges = !!changes;

                                return (
                                    <tr key={doc.id} className={`transition-colors ${isSelected ? 'bg-sky-900/10' : 'hover:bg-gray-700/40'} ${isCheckedToday && !isSelected ? 'bg-green-900/5' : ''}`}>
                                        <td className="px-6 py-4 text-center">
                                             <input 
                                                type="checkbox" 
                                                checked={isSelected}
                                                onChange={() => handleCheckboxChange(doc.id)}
                                                className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-sky-500 focus:ring-sky-600 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{doc.title}</div>
                                            <div className="text-xs text-sky-400 font-mono mt-1">{doc.docType} - {doc.id}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {doc.officialLink ? (
                                                <a 
                                                    href={doc.officialLink} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="inline-flex items-center justify-center p-2 rounded-full bg-gray-700 hover:bg-sky-600 text-sky-400 hover:text-white transition-colors"
                                                    title="Abrir Web Oficial"
                                                >
                                                    <WorldIcon className="h-5 w-5" />
                                                </a>
                                            ) : (
                                                <span className="text-gray-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <input 
                                                type="text" 
                                                value={currentRev} 
                                                onChange={(e) => handleInputChange(doc.id, 'revision', e.target.value)}
                                                className={`w-full bg-gray-900 border ${changes && changes.revision !== doc.revision ? 'border-yellow-500 text-yellow-300' : 'border-gray-600 text-gray-300'} rounded px-2 py-1 text-sm focus:ring-2 focus:ring-sky-500`}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                             <input 
                                                type="date" 
                                                value={currentRevDate} 
                                                onChange={(e) => handleInputChange(doc.id, 'revisionDate', e.target.value)}
                                                className={`w-full bg-gray-900 border ${changes && changes.revisionDate !== doc.revisionDate ? 'border-yellow-500 text-yellow-300' : 'border-gray-600 text-gray-300'} rounded px-2 py-1 text-sm focus:ring-2 focus:ring-sky-500`}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {isCheckedToday && !hasUnsavedChanges ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-900/50 text-green-400 text-xs font-medium border border-green-700">
                                                    <CheckCircleIcon className="h-3 w-3" /> Hoy
                                                </span>
                                            ) : (
                                                <span className={`${!doc.lastWebCheckDate ? 'text-red-400' : 'text-gray-400'} text-xs`}>
                                                    {doc.lastWebCheckDate || 'Nunca'}
                                                </span>
                                            )}
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
