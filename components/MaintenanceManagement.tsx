
import React, { useState } from 'react';
import type { AMP, Tolerance } from '../types';
import { mockAmps, mockDocuments, updateAmp, updateTolerance, addAmp, addTolerance } from '../data/mockDatabase';
import { BookOpenIcon, AdjustmentsHorizontalIcon } from './Icons';
import { AmpEditModal } from './AmpEditModal';
import { AmpManagementView } from './AmpManagementView';
import { ToleranceManagement } from './ToleranceManagement';
import { ToleranceEditModal } from './ToleranceEditModal';

type View = 'amps' | 'tolerances';

// Empty AMP template for new creations
const emptyAmp: AMP = {
    id: '',
    name: '',
    revision: '',
    status: 'Draft',
    revisionDate: '',
    description: '',
    notes: '',
    includedAircraftSNs: [],
    includedDocuments: [],
    officialLink: '',
    internalLink: ''
};

const emptyTolerance: Tolerance = {
    id: '',
    title: '',
    description: '',
    tolerance: '',
    sourceDocumentIds: [],
    applicableAmpIds: [],
    status: 'Active',
    notes: '',
    lastModifiedBy: '',
    lastModifiedDate: ''
};

export const MaintenanceManagement: React.FC = () => {
    const [activeView, setActiveView] = useState<View>('amps');
    const [editingAmp, setEditingAmp] = useState<AMP | null>(null);
    const [editingTolerance, setEditingTolerance] = useState<Tolerance | null>(null);
    const [isAmpModalOpen, setAmpModalOpen] = useState(false);
    const [ampMode, setAmpMode] = useState<'add' | 'edit'>('add');
    const [refreshKey, setRefreshKey] = useState(0);

    const handleOpenAddAmp = () => {
        setEditingAmp({ ...emptyAmp });
        setAmpMode('add');
        setAmpModalOpen(true);
    };

    const handleOpenEditAmp = (amp: AMP) => {
        setEditingAmp(amp);
        setAmpMode('edit');
        setAmpModalOpen(true);
    };

    const handleSaveAmp = (ampData: AMP) => {
        if (ampMode === 'edit') {
            updateAmp(ampData);
        } else {
            addAmp(ampData);
        }
        setAmpModalOpen(false);
        setEditingAmp(null);
        setRefreshKey(prev => prev + 1); // Force re-render of the list
    };

    const handleOpenAddTolerance = () => {
        setEditingTolerance({ ...emptyTolerance });
    };

    const handleSaveTolerance = (toleranceData: Tolerance) => {
        if (toleranceData.id && mockAmps.some(t => t.id === toleranceData.id)) { // Basic check, better to have mode like AMP
             // In this simple implementation, if ID exists in mockTolerances (checked inside updateTolerance roughly), we update.
             // But since IDs are generated on add, usually an empty ID means add.
             // Let's use the ID presence from the empty template (empty string) to decide.
        }
        
        // A simple check: if the passed tolerance has an ID that matches an existing one in the *current* DB state, it's an edit.
        // However, since we might be editing a freshly added one, we rely on whether we started with an empty ID or not.
        // For simplicity here:
        if (toleranceData.id && toleranceData.id.startsWith('TOL')) {
             updateTolerance(toleranceData);
        } else {
             addTolerance(toleranceData);
        }
        
        setEditingTolerance(null);
        setRefreshKey(prev => prev + 1);
    };

    const viewConfig = {
        amps: {
            label: 'Programas (AMPs)',
            icon: BookOpenIcon,
            addButtonLabel: 'Añadir AMP',
            onAdd: handleOpenAddAmp,
            component: <AmpManagementView key={`amps-${refreshKey}`} onEditAmp={handleOpenEditAmp} />,
        },
        tolerances: {
            label: 'Tolerancias',
            icon: AdjustmentsHorizontalIcon,
            addButtonLabel: 'Añadir Tolerancia',
            onAdd: handleOpenAddTolerance,
            component: <ToleranceManagement key={`tols-${refreshKey}`} onEditTolerance={setEditingTolerance} />,
        }
    };
    
    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-wrap gap-4 justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">Gestión de Mantenimiento</h1>
                    <button 
                        onClick={viewConfig[activeView].onAdd}
                        className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
                    >
                        {viewConfig[activeView].addButtonLabel}
                    </button>
                </div>

                <div className="border-b border-gray-700">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {(Object.keys(viewConfig) as View[]).map((view) => {
                            const { label, icon: Icon } = viewConfig[view];
                            const isActive = activeView === view;
                            return (
                                <button
                                    key={view}
                                    onClick={() => setActiveView(view)}
                                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                                        isActive
                                            ? 'border-sky-400 text-sky-400'
                                            : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                                    }`}
                                >
                                    <Icon className={`-ml-0.5 mr-2 h-5 w-5 ${
                                        isActive
                                            ? 'text-sky-400'
                                            : 'text-gray-500 group-hover:text-gray-300'
                                    }`} />
                                    <span>{label}</span>
                                </button>
                            )
                        })}
                    </nav>
                </div>
                
                <div>
                    {viewConfig[activeView].component}
                </div>

            </div>
            {isAmpModalOpen && editingAmp && (
                <AmpEditModal
                    amp={editingAmp}
                    isOpen={isAmpModalOpen}
                    onClose={() => setAmpModalOpen(false)}
                    onSave={handleSaveAmp}
                    mode={ampMode}
                />
            )}
            {editingTolerance && (
                <ToleranceEditModal
                    tolerance={editingTolerance}
                    isOpen={!!editingTolerance}
                    onClose={() => setEditingTolerance(null)}
                    onSave={handleSaveTolerance}
                />
            )}
        </>
    );
};