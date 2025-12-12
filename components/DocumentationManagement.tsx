
import React, { useState, useMemo } from 'react';
import type { Certificate, Document, Fleet, AMP, Inspection, Component } from '../types';
import { 
    mockFleets, mockAmps, mockCertificates, mockDocuments, mockDocumentTypes, mockInspections, mockComponents,
    addCertificate, updateCertificate, addDocument, updateDocument, batchUpdateDocuments, addInspection, updateInspection, addComponent, updateComponent
} from '../data/mockDatabase';
import { ChevronUpIcon, ChevronDownIcon, SearchIcon, CertificateIcon, DocsIcon, WorldIcon, LinkIcon, CalendarDaysIcon, ClipboardDocumentCheckIcon, InspectionsIcon, TagIcon } from './Icons';
import { CertificateFormModal } from './CertificateFormModal';
import { DocumentFormModal } from './DocumentFormModal';
import { DocumentTypeManagementModal } from './DocumentTypeManagementModal';
import { DocumentationReviewView } from './DocumentationReviewView';
import { InspectionManagement } from './InspectionManagement';
import { ComponentManagement } from './ComponentManagement';
import { InspectionEditModal } from './InspectionEditModal';
import { ComponentEditModal } from './ComponentEditModal';

type View = 'documents' | 'inspections' | 'catalog' | 'certificates' | 'review';
type SortableCertificateKeys = 'type' | 'holder' | 'tcds' | 'revision' | 'revisionDate' | 'lastWebCheckDate';
type SortableDocumentKeys = 'docType' | 'title' | 'revision' | 'revisionDate' | 'status' | 'lastWebCheckDate' | 'implementationDeadline';

const certificateTypeColorMap = { TC: 'bg-sky-900 text-sky-300', STC: 'bg-amber-900 text-amber-300', };
const documentStatusColorMap = { Active: 'bg-green-900 text-green-300', Superseded: 'bg-gray-700 text-gray-400', Draft: 'bg-yellow-900 text-yellow-300',};
const baseFleetColors = [ 'bg-teal-900/70 text-teal-300', 'bg-fuchsia-900/70 text-fuchsia-300', 'bg-rose-900/70 text-rose-300', 'bg-emerald-900/70 text-emerald-300', 'bg-cyan-900/70 text-cyan-300', 'bg-violet-900/70 text-violet-300' ];
const baseAmpColors = [ 'bg-gray-700 text-gray-300', 'bg-slate-700 text-slate-300', 'bg-zinc-700 text-zinc-300' ];

const fleetColorCache: Record<string, string> = {};
const ampColorCache: Record<string, string> = {};
let fleetColorIndex = 0;
let ampColorIndex = 0;

const getFleetColor = (fleetId: string) => {
    if (!fleetColorCache[fleetId]) {
        fleetColorCache[fleetId] = baseFleetColors[fleetColorIndex % baseFleetColors.length];
        fleetColorIndex++;
    }
    return fleetColorCache[fleetId];
};

const getAmpColor = (ampId: string) => {
    if (!ampColorCache[ampId]) {
        ampColorCache[ampId] = baseAmpColors[ampColorIndex % baseAmpColors.length];
        ampColorIndex++;
    }
    return ampColorCache[ampId];
};

export const DocumentationManagement: React.FC = () => {
    const [activeView, setActiveView] = useState<View>('documents');
    const [certSortConfig, setCertSortConfig] = useState<{ key: SortableCertificateKeys; direction: string } | null>(null);
    const [docSortConfig, setDocSortConfig] = useState<{ key: SortableDocumentKeys; direction: string } | null>(null);
    const [certFilter, setCertFilter] = useState('');
    const [docFilter, setDocFilter] = useState('');
    const [showInactiveDocuments, setShowInactiveDocuments] = useState(false);
    const [showInactiveCertificates, setShowInactiveCertificates] = useState(false);

    // Modal States
    const [isCertModalOpen, setCertModalOpen] = useState(false);
    const [editingCert, setEditingCert] = useState<Certificate | null>(null);
    
    // Document Modal State
    const [isDocModalOpen, setDocModalOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<Document | null>(null);

    // Nested Document Modal State (For "Superseded By")
    const [isSupersedingDocModalOpen, setSupersedingDocModalOpen] = useState(false);
    const [supersedingCallback, setSupersedingCallback] = useState<{ fn: ((id: string) => void) | null }>({ fn: null });

    // Nested Extraction Modals (Inspection & Component from Document)
    const [isNestedInspectionModalOpen, setNestedInspectionModalOpen] = useState(false);
    const [nestedInspectionInitialData, setNestedInspectionInitialData] = useState<Partial<Inspection> | null>(null);
    
    const [isNestedComponentModalOpen, setNestedComponentModalOpen] = useState(false);
    const [nestedComponentInitialData, setNestedComponentInitialData] = useState<Partial<Component> | null>(null);

    const [isDocTypeModalOpen, setDocTypeModalOpen] = useState(false);

    const [key, setKey] = useState(0); // Force re-render

    const forceUpdate = () => setKey(prev => prev + 1);

    // IMPORTANT: Create a fresh reference of documents when key changes
    const currentDocuments = useMemo(() => [...mockDocuments], [key]);

    // -- Handlers for Certificates --
    const handleOpenAddCert = () => {
        setEditingCert(null);
        setCertModalOpen(true);
    };

    const handleEditCert = (cert: Certificate) => {
        setEditingCert(cert);
        setCertModalOpen(true);
    };

    const handleSaveCert = (certData: Certificate) => {
        if (editingCert) {
            updateCertificate(certData);
        } else {
            addCertificate(certData);
        }
        setCertModalOpen(false);
        setEditingCert(null);
        forceUpdate();
    };

    // -- Handlers for Documents --
    const handleOpenAddDoc = () => {
        setEditingDoc(null);
        setDocModalOpen(true);
    };

    const handleEditDoc = (doc: Document) => {
        setEditingDoc(doc);
        setDocModalOpen(true);
    };

    const handleSaveDoc = (docData: Document) => {
        if (editingDoc) {
            updateDocument(docData);
        } else {
            addDocument(docData);
        }
        setDocModalOpen(false);
        setEditingDoc(null);
        forceUpdate();
    };

    // -- Handlers for Nested Superseding Document --
    const handleRequestNewSupersedingDoc = (callback: (newDocId: string) => void) => {
        setSupersedingCallback({ fn: callback });
        setSupersedingDocModalOpen(true);
    };

    const handleSaveSupersedingDoc = (docData: Document) => {
        const newDoc = addDocument(docData);
        if (supersedingCallback.fn) {
            supersedingCallback.fn(newDoc.id);
        }
        setSupersedingDocModalOpen(false);
        setSupersedingCallback({ fn: null });
        forceUpdate();
    };

    // -- Handlers for Nested Extraction (Inspection/Component) --
    const handleCreateInspectionFromDoc = (sourceDocId: string) => {
        setNestedInspectionInitialData({
            sourceDocumentIds: [sourceDocId],
            status: 'Active'
        });
        setNestedInspectionModalOpen(true);
    };

    const handleSaveNestedInspection = (insp: Inspection) => {
        addInspection(insp);
        setNestedInspectionModalOpen(false);
        setNestedInspectionInitialData(null);
        forceUpdate(); // Update lists in Document Modal
    };

    const handleCreateComponentFromDoc = (sourceDocId: string) => {
        setNestedComponentInitialData({
            sourceDocumentIds: [sourceDocId],
            status: 'Active'
        });
        setNestedComponentModalOpen(true);
    };

    const handleSaveNestedComponent = (comp: Component) => {
        addComponent(comp);
        setNestedComponentModalOpen(false);
        setNestedComponentInitialData(null);
        forceUpdate(); // Update lists in Document Modal
    };


    // -- Handler for Bulk Update --
    const handleBulkUpdateDocuments = (docs: Document[]) => {
        batchUpdateDocuments(docs);
        forceUpdate();
    };

    const processedCertificates = useMemo(() => {
        let items = showInactiveCertificates ? [...mockCertificates] : mockCertificates.filter(c => c.status === 'Active');
        if (certFilter) {
            const searchTerm = certFilter.toLowerCase();
            items = items.filter(c => Object.values(c).some(val => String(val).toLowerCase().includes(searchTerm)));
        }
        if (certSortConfig) {
            items.sort((a, b) => {
                const aVal = a[certSortConfig.key] || '';
                const bVal = b[certSortConfig.key] || '';
                if (aVal < bVal) return certSortConfig.direction === 'ascending' ? -1 : 1;
                if (aVal > bVal) return certSortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [certFilter, certSortConfig, showInactiveCertificates, key]);
    
    const processedDocuments = useMemo(() => {
        let items = showInactiveDocuments ? [...currentDocuments] : currentDocuments.filter(d => d.status === 'Active' || d.status === 'Draft');
        if (docFilter) {
            const searchTerm = docFilter.toLowerCase();
            items = items.filter(d => {
                const certs = d.certificateIds.map(cid => mockCertificates.find(c => c.id === cid));
                const certTexts = certs.map(c => c ? `${c.tcds} ${c.holder}` : '').join(' ');
                const fleets = certs.flatMap(c => c?.applicableFleetIds.map(fid => mockFleets.find(f=>f.id === fid)?.name)).join(' ');
                return Object.values(d).some(val => String(val).toLowerCase().includes(searchTerm)) ||
                       certTexts.toLowerCase().includes(searchTerm) ||
                       fleets.toLowerCase().includes(searchTerm);
            });
        }
        if (docSortConfig) {
            items.sort((a, b) => {
                const aVal = a[docSortConfig.key] || '';
                const bVal = b[docSortConfig.key] || '';
                if (aVal < bVal) return docSortConfig.direction === 'ascending' ? -1 : 1;
                if (aVal > bVal) return docSortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [docFilter, docSortConfig, showInactiveDocuments, currentDocuments]);

    const requestSort = (key: any, type: 'certificates' | 'documents') => {
        const isCert = type === 'certificates';
        const config = isCert ? certSortConfig : docSortConfig;
        const setConfig = isCert ? setCertSortConfig : setDocSortConfig;
        let direction = 'ascending';
        if (config && config.key === key && config.direction === 'ascending') {
            direction = 'descending';
        }
        setConfig({ key, direction });
    };

    const SortableHeader: React.FC<{ sortKey: any; type: 'certificates' | 'documents'; children: React.ReactNode }> = ({ sortKey, type, children }) => {
        const config = type === 'certificates' ? certSortConfig : docSortConfig;
        const isSorted = config?.key === sortKey;
        const indicator = isSorted ? (config.direction === 'ascending' ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />)
                                   : <ChevronUpIcon className="h-4 w-4 ml-1 text-gray-500" />;
        return (
            <th scope="col" className="px-6 py-3">
                <button onClick={() => requestSort(sortKey, type)} className="flex items-center group focus:outline-none">
                    {children}
                    <span className={isSorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}>{indicator}</span>
                </button>
            </th>
        );
    };

    const renderCertificatesTable = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
             <div className="flex justify-between items-center gap-4 flex-wrap">
                <h2 className="text-2xl font-semibold text-white">Certificados (TC / STC)</h2>
                <div className="flex items-center gap-4">
                    <label className="flex items-center text-sm text-gray-300 cursor-pointer">
                        <input type="checkbox" checked={showInactiveCertificates} onChange={() => setShowInactiveCertificates(prev => !prev)} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-sky-500 focus:ring-sky-600" />
                        <span className="ml-2">Ver inactivos</span>
                    </label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="h-5 w-5 text-gray-400" /></div>
                        <input type="text" placeholder="Filtrar certificados..." value={certFilter} onChange={e => setCertFilter(e.target.value)} className="block w-full rounded-md border-0 bg-gray-700 py-1.5 pl-10 pr-3 text-gray-200 ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-sky-500 sm:text-sm" />
                    </div>
                </div>
            </div>
            <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-300">
                        <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase tracking-wider">
                            <tr>
                                <SortableHeader sortKey="tcds" type="certificates">Referencia</SortableHeader>
                                <SortableHeader sortKey="type" type="certificates">Tipo</SortableHeader>
                                <SortableHeader sortKey="revision" type="certificates">Rev.</SortableHeader>
                                <SortableHeader sortKey="revisionDate" type="certificates">Fecha Rev.</SortableHeader>
                                <th scope="col" className="px-6 py-3">Links</th>
                                <SortableHeader sortKey="holder" type="certificates">Titular</SortableHeader>
                                <th scope="col" className="px-6 py-3">Flotas Aplicables</th>
                                <SortableHeader sortKey="lastWebCheckDate" type="certificates">Últ. Comprobación</SortableHeader>
                                {showInactiveCertificates && <th scope="col" className="px-6 py-3">Estado</th>}
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {processedCertificates.map(cert => (
                                <tr key={cert.id} className="hover:bg-gray-700/40 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-sky-400">{cert.tcds}</td>
                                    <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${certificateTypeColorMap[cert.type]}`}>{cert.type}</span></td>
                                    <td className="px-6 py-4 text-center">{cert.revision}</td>
                                    <td className="px-6 py-4">{cert.revisionDate}</td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-4">{cert.officialLink && <a href={cert.officialLink} target="_blank" rel="noopener noreferrer" title="Enlace Oficial (Web)"><WorldIcon className="h-5 w-5 text-gray-400 hover:text-sky-400"/></a>}{cert.internalLink && <a href={cert.internalLink} target="_blank" rel="noopener noreferrer" title="Enlace Interno (Documento)"><LinkIcon className="h-5 w-5 text-gray-400 hover:text-sky-400"/></a>}</div></td>
                                    <td className="px-6 py-4 font-medium text-white max-w-xs truncate" title={cert.holder}>{cert.holder}</td>
                                    <td className="px-6 py-4"><div className="flex flex-wrap gap-1">{cert.applicableFleetIds.map((fid) => { const fleet = mockFleets.find(f => f.id === fid); return <span key={fid} className={`text-xs font-medium px-2.5 py-1 rounded-full ${getFleetColor(fid)}`}>{fleet?.name || fid}</span>; })}</div></td>
                                    <td className="px-6 py-4">{cert.lastWebCheckDate}</td>
                                    {showInactiveCertificates && (
                                         <td className="px-6 py-4">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cert.status === 'Active' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                                                {cert.status === 'Active' ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleEditCert(cert)} className="font-medium text-sky-400 hover:text-sky-300">Editar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderDocumentsTable = () => {
        const isDeadlineApproaching = (dateString?: string) => {
            if (!dateString) return false;
            const deadline = new Date(dateString);
            const today = new Date();
            const diffTime = deadline.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays < 15;
        };

        return (
         <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center gap-4 flex-wrap">
                <h2 className="text-2xl font-semibold text-white">Documentos (Manuales, ADs, SBs)</h2>
                <div className="flex items-center gap-4">
                     <label className="flex items-center text-sm text-gray-300 cursor-pointer">
                        <input type="checkbox" checked={showInactiveDocuments} onChange={() => setShowInactiveDocuments(prev => !prev)} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-sky-500 focus:ring-sky-600" />
                        <span className="ml-2">Ver todo</span>
                    </label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="h-5 w-5 text-gray-400" /></div>
                        <input type="text" placeholder="Filtrar documentos..." value={docFilter} onChange={e => setDocFilter(e.target.value)} className="block w-full rounded-md border-0 bg-gray-700 py-1.5 pl-10 pr-3 text-gray-200 ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-sky-500 sm:text-sm" />
                    </div>
                </div>
            </div>
            <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-300">
                        <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase tracking-wider">
                            <tr>
                                <SortableHeader sortKey="docType" type="documents">Tipo</SortableHeader>
                                <SortableHeader sortKey="title" type="documents">Título</SortableHeader>
                                <SortableHeader sortKey="revision" type="documents">Rev.</SortableHeader>
                                <SortableHeader sortKey="revisionDate" type="documents">Fecha Rev.</SortableHeader>
                                <th scope="col" className="px-6 py-3">Links</th>
                                <th scope="col" className="px-6 py-3">Certs. Vinculados</th>
                                <th scope="col" className="px-6 py-3">Flotas</th>
                                <SortableHeader sortKey="lastWebCheckDate" type="documents">Últ. Check</SortableHeader>
                                <SortableHeader sortKey="status" type="documents">Estado</SortableHeader>
                                <th scope="col" className="px-6 py-3">Plazo</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {processedDocuments.map(doc => {
                                const certs = doc.certificateIds.map(cid => mockCertificates.find(c => c.id === cid)).filter(Boolean) as Certificate[];
                                const uniqueFleetIds = Array.from(new Set(certs.flatMap(c => c.applicableFleetIds)));
                                const fleets = uniqueFleetIds.map(fid => mockFleets.find(f => f.id === fid));
                                const deadlineAlert = isDeadlineApproaching(doc.implementationDeadline);
                                const typeDef = mockDocumentTypes.find(t => t.id === doc.docType);

                                return (
                                <tr key={doc.id} className="hover:bg-gray-700/40 transition-colors">
                                    <td className="px-6 py-4"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900 text-blue-300" title={typeDef?.name}>{doc.docType}</span></td>
                                    <td className="px-6 py-4 font-medium text-white max-w-xs truncate" title={doc.title}>{doc.title}</td>
                                    <td className="px-6 py-4 text-center">{doc.revision}</td>
                                    <td className="px-6 py-4">{doc.revisionDate}</td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-4">{doc.officialLink && <a href={doc.officialLink} target="_blank" rel="noopener noreferrer" title="Enlace Oficial (Web)"><WorldIcon className="h-5 w-5 text-gray-400 hover:text-sky-400"/></a>}{doc.internalLink && <a href={doc.internalLink} target="_blank" rel="noopener noreferrer" title="Enlace Interno (Documento)"><LinkIcon className="h-5 w-5 text-gray-400 hover:text-sky-400"/></a>}</div></td>
                                    <td className="px-6 py-4 font-mono text-sky-400">
                                        <div className="flex flex-col gap-1">
                                            {certs.length > 0 ? certs.map(c => <span key={c.id} title={c.holder}>{c.tcds}</span>) : <span className="text-red-400">Sin Cert.</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><div className="flex flex-wrap gap-1">{fleets?.map((f) => f ? <span key={f.id} className={`text-xs font-medium px-2.5 py-1 rounded-full ${getFleetColor(f.id)}`}>{f.name}</span> : null) || <span className="text-gray-500 text-xs">N/A</span>}</div></td>
                                    <td className="px-6 py-4">{doc.lastWebCheckDate}</td>
                                    <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${documentStatusColorMap[doc.status]}`}>{doc.status}</span></td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-xs">
                                            {doc.implementationDeadline && <div className={`flex items-center gap-1.5 ${deadlineAlert ? 'text-red-400 font-semibold' : ''}`} title="Plazo Límite"><CalendarDaysIcon className="h-4 w-4"/><span>{doc.implementationDeadline}</span></div>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleEditDoc(doc)} className="font-medium text-sky-400 hover:text-sky-300">Editar</button>
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

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-wrap gap-4 justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">Ingeniería y Documentación</h1>
                    
                    {/* Action Buttons based on View */}
                    {(activeView === 'certificates') && <button onClick={handleOpenAddCert} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">Añadir Certificado</button>}
                    {(activeView === 'documents') && <button onClick={handleOpenAddDoc} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">Añadir Documento</button>}
                </div>
                
                <div className="border-b border-gray-700">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveView('documents')} className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeView === 'documents' ? 'border-sky-400 text-sky-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                            <DocsIcon className={`-ml-0.5 mr-2 h-5 w-5 ${activeView === 'documents' ? 'text-sky-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                            <span>Documentos Base</span>
                        </button>
                        <button onClick={() => setActiveView('inspections')} className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeView === 'inspections' ? 'border-sky-400 text-sky-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                            <InspectionsIcon className={`-ml-0.5 mr-2 h-5 w-5 ${activeView === 'inspections' ? 'text-sky-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                            <span>Tareas / Inspecciones</span>
                        </button>
                        <button onClick={() => setActiveView('catalog')} className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeView === 'catalog' ? 'border-sky-400 text-sky-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                            <TagIcon className={`-ml-0.5 mr-2 h-5 w-5 ${activeView === 'catalog' ? 'text-sky-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                            <span>Catálogo de Partes (P/N)</span>
                        </button>
                        <button onClick={() => setActiveView('certificates')} className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeView === 'certificates' ? 'border-sky-400 text-sky-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                            <CertificateIcon className={`-ml-0.5 mr-2 h-5 w-5 ${activeView === 'certificates' ? 'text-sky-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                            <span>Certificados (TC)</span>
                        </button>
                         <button onClick={() => setActiveView('review')} className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeView === 'review' ? 'border-sky-400 text-sky-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                            <ClipboardDocumentCheckIcon className={`-ml-0.5 mr-2 h-5 w-5 ${activeView === 'review' ? 'text-sky-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                            <span>Auditoría</span>
                        </button>
                    </nav>
                </div>

                <div>
                    {activeView === 'documents' && renderDocumentsTable()}
                    {activeView === 'inspections' && <div className="animate-in fade-in slide-in-from-bottom-2"><InspectionManagement /></div>}
                    {activeView === 'catalog' && <div className="animate-in fade-in slide-in-from-bottom-2"><ComponentManagement /></div>}
                    {activeView === 'certificates' && renderCertificatesTable()}
                    {activeView === 'review' && <DocumentationReviewView documents={currentDocuments} onUpdateDocument={handleBulkUpdateDocuments} />}
                </div>
            </div>

            {/* Modals */}
            {isCertModalOpen && (
                <CertificateFormModal
                    key={`cert-form-${editingCert ? editingCert.id : 'add'}`}
                    isOpen={isCertModalOpen}
                    onClose={() => setCertModalOpen(false)}
                    onSave={handleSaveCert}
                    initialData={editingCert}
                    mode={editingCert ? 'edit' : 'add'}
                    fleets={mockFleets}
                />
            )}
            
            {isDocModalOpen && (
                <DocumentFormModal
                    key={`doc-form-${editingDoc ? editingDoc.id : 'add'}`}
                    isOpen={isDocModalOpen}
                    onClose={() => setDocModalOpen(false)}
                    onSave={handleSaveDoc}
                    initialData={editingDoc}
                    mode={editingDoc ? 'edit' : 'add'}
                    certificates={mockCertificates}
                    onManageTypes={() => setDocTypeModalOpen(true)}
                    onAddSupersedingDoc={handleRequestNewSupersedingDoc}
                    zIndex={50}
                    availableDocuments={currentDocuments}
                    // Pass current inspections/components to show extracted data in the modal
                    linkedInspections={mockInspections.filter(i => editingDoc && i.sourceDocumentIds.includes(editingDoc.id))}
                    linkedComponents={mockComponents.filter(c => editingDoc && c.sourceDocumentIds.includes(editingDoc.id))}
                    onCreateInspectionFromDoc={handleCreateInspectionFromDoc}
                    onCreateComponentFromDoc={handleCreateComponentFromDoc}
                />
            )}

            {/* Nested Superseding Document Modal */}
            {isSupersedingDocModalOpen && (
                 <DocumentFormModal
                    key={`doc-form-superseding`}
                    isOpen={isSupersedingDocModalOpen}
                    onClose={() => setSupersedingDocModalOpen(false)}
                    onSave={handleSaveSupersedingDoc}
                    initialData={null}
                    mode='add'
                    certificates={mockCertificates}
                    onManageTypes={() => setDocTypeModalOpen(true)}
                    zIndex={60}
                    availableDocuments={currentDocuments}
                    linkedInspections={[]}
                    linkedComponents={[]}
                />
            )}

            {isDocTypeModalOpen && (
                <DocumentTypeManagementModal
                    isOpen={isDocTypeModalOpen}
                    onClose={() => setDocTypeModalOpen(false)}
                    documentTypes={mockDocumentTypes}
                    documents={currentDocuments}
                />
            )}

            {/* Stacked Inspection Create Modal */}
            {isNestedInspectionModalOpen && (
                <div style={{ position: 'relative', zIndex: 60 }}>
                    <InspectionEditModal 
                        key="nested-insp-create"
                        isOpen={true}
                        onClose={() => { setNestedInspectionModalOpen(false); setNestedInspectionInitialData(null); }}
                        onSave={handleSaveNestedInspection}
                        inspection={nestedInspectionInitialData as any} // Cast as we are passing partial data
                    />
                </div>
            )}

            {/* Stacked Component Create Modal */}
            {isNestedComponentModalOpen && (
                <div style={{ position: 'relative', zIndex: 60 }}>
                    <ComponentEditModal
                        key="nested-comp-create"
                        isOpen={true}
                        onClose={() => { setNestedComponentModalOpen(false); setNestedComponentInitialData(null); }}
                        onSave={handleSaveNestedComponent}
                        component={nestedComponentInitialData as any}
                    />
                </div>
            )}
        </>
    );
};
