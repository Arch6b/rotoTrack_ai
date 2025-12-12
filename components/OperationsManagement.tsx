
import React, { useState } from 'react';
import { FleetManagement } from './FleetManagement';
import { AircraftManagement } from './AircraftManagement';
import { OrganizationManagement } from './OrganizationManagement';
import { FleetIcon, AircraftIcon, BuildingOfficeIcon } from './Icons';
import type { Aircraft, Organization, Fleet, OrganizationType, Certificate } from '../types';
import {
    addAircraft, updateAircraft, addOrganization, updateOrganization, mockOperationTypes, mockAircrafts,
    addFleet, updateFleet, mockFleets, mockFactorDefinitions, mockAmps, linkAmpToFleet,
    mockOrganizations, mockOrganizationTypes, addCertificate, updateCertificate
} from '../data/mockDatabase';
import { AircraftFormModal } from './AircraftFormModal';
import { OperationTypeManagementModal } from './OperationTypeManagementModal';
import { FleetFormModal } from './FleetFormModal';
import { FactorManagementModal } from './FactorManagementModal';
import { OrganizationFormModal } from './OrganizationFormModal';
import { OrganizationTypeManagementModal } from './OrganizationTypeManagementModal';
import { CertificateFormModal } from './CertificateFormModal';

type View = 'fleets' | 'aircraft' | 'organizations';

const viewConfig = {
    fleets: {
        label: 'Flotas',
        component: FleetManagement,
        icon: FleetIcon,
        addButtonLabel: 'Añadir Flota',
    },
    aircraft: {
        label: 'Aeronaves',
        component: AircraftManagement,
        icon: AircraftIcon,
        addButtonLabel: 'Añadir Aeronave',
    },
    organizations: {
        label: 'Organizaciones',
        component: OrganizationManagement,
        icon: BuildingOfficeIcon,
        addButtonLabel: 'Añadir Organización',
    }
};

export const OperationsManagement: React.FC = () => {
    const [activeView, setActiveView] = useState<View>('organizations');
    
    // State for modals
    const [isAircraftModalOpen, setAircraftModalOpen] = useState(false);
    const [editingAircraft, setEditingAircraft] = useState<Aircraft | null>(null);
    const [isFleetModalOpen, setFleetModalOpen] = useState(false);
    const [editingFleet, setEditingFleet] = useState<Fleet | null>(null);
    const [isOrgFormModalOpen, setOrgFormModalOpen] = useState(false);
    const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
    const [predefinedOrgTypeId, setPredefinedOrgTypeId] = useState<string | undefined>(undefined);
    const [isOpTypeModalOpen, setOpTypeModalOpen] = useState(false);
    const [isFactorModalOpen, setFactorModalOpen] = useState(false);
    const [isOrgTypeModalOpen, setOrgTypeModalOpen] = useState(false);
    const [isCertificateModalOpen, setCertificateModalOpen] = useState(false);
    const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);

    const [newOrgCallback, setNewOrgCallback] = useState<{ fn: ((newOrgId: string) => void) | null }>({ fn: null });
    const [newFleetCallback, setNewFleetCallback] = useState<{ fn: ((newFleetId: string) => void) | null }>({ fn: null });
    const [newCertificateCallback, setNewCertificateCallback] = useState<{ fn: ((newCertId: string) => void) | null }>({ fn: null });
    const [key, setKey] = useState(0); // Used to force re-render

    const forceUpdate = () => setKey(prevKey => prevKey + 1);

    // Aircraft Modal Handlers
    const handleOpenAddAircraftModal = () => {
        setEditingAircraft(null);
        setAircraftModalOpen(true);
    };
    const handleOpenEditAircraftModal = (aircraft: Aircraft) => {
        setEditingAircraft(aircraft);
        setAircraftModalOpen(true);
    };
    const handleSaveAircraft = (aircraftData: Aircraft) => {
        if (editingAircraft) {
            updateAircraft(aircraftData);
        } else {
            addAircraft(aircraftData);
        }
        setAircraftModalOpen(false);
        setEditingAircraft(null);
        forceUpdate();
    };

    // Fleet Modal Handlers
    const handleOpenAddFleetModal = () => {
        setEditingFleet(null);
        setFleetModalOpen(true);
    };
    const handleOpenEditFleetModal = (fleet: Fleet) => {
        setEditingFleet(fleet);
        setFleetModalOpen(true);
    };
    const handleSaveFleet = (fleetData: Fleet, selectedAmpId: string | undefined) => {
        const oldAmpId = mockAmps.find(a => a.fleetId === fleetData.id)?.id;

        if (editingFleet) {
            updateFleet(fleetData);
        } else {
            addFleet(fleetData);
            if (newFleetCallback.fn) {
                newFleetCallback.fn(fleetData.id);
                setNewFleetCallback({ fn: null });
            }
        }

        linkAmpToFleet(fleetData.id, selectedAmpId, oldAmpId);

        setFleetModalOpen(false);
        setEditingFleet(null);
        forceUpdate();
    };

    // Organization Modal Handlers
    const handleOpenAddOrgModal = () => {
        setEditingOrganization(null);
        setPredefinedOrgTypeId(undefined);
        setOrgFormModalOpen(true);
    };
    const handleOpenEditOrgModal = (org: Organization) => {
        setEditingOrganization(org);
        setPredefinedOrgTypeId(undefined);
        setOrgFormModalOpen(true);
    };
    const handleSaveOrganization = (orgData: Organization) => {
        if (editingOrganization) {
            updateOrganization(orgData);
        } else {
            const newOrg = addOrganization(orgData);
            if (newOrgCallback.fn) {
                newOrgCallback.fn(newOrg.id);
                setNewOrgCallback({ fn: null });
            }
        }
        setOrgFormModalOpen(false);
        setEditingOrganization(null);
        forceUpdate();
    };
     const handleRequestNewOrganization = (typeId: string, callback: (newOrgId: string) => void) => {
        setNewOrgCallback({ fn: callback });
        setEditingOrganization(null);
        setPredefinedOrgTypeId(typeId);
        setOrgFormModalOpen(true);
    };

    const handleRequestNewFleet = (callback: (newFleetId: string) => void) => {
        setNewFleetCallback({ fn: callback });
        setEditingFleet(null);
        setFleetModalOpen(true);
    };

    // Certificate Modal Handlers
    const handleSaveCertificate = (certData: Certificate) => {
        if (editingCertificate) {
            updateCertificate(certData);
        } else {
            addCertificate(certData);
            if (newCertificateCallback.fn) {
                newCertificateCallback.fn(certData.id);
                setNewCertificateCallback({ fn: null });
            }
        }
        setCertificateModalOpen(false);
        setEditingCertificate(null);
        forceUpdate();
    };

    const handleRequestNewCertificate = (callback: (newCertId: string) => void) => {
        setNewCertificateCallback({ fn: callback });
        setEditingCertificate(null);
        setCertificateModalOpen(true);
    };

    // Shared Modals Handlers
    const handleCloseOpTypeModal = () => {
        setOpTypeModalOpen(false);
        forceUpdate();
    };
    const handleCloseFactorModal = () => {
        setFactorModalOpen(false);
        forceUpdate();
    };
    const handleCloseOrgTypeModal = () => {
        setOrgTypeModalOpen(false);
        forceUpdate();
    };

    const onAddButtonClick = () => {
        if (activeView === 'aircraft') handleOpenAddAircraftModal();
        if (activeView === 'fleets') handleOpenAddFleetModal();
        if (activeView === 'organizations') handleOpenAddOrgModal();
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-wrap gap-4 justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">Gestión de Operaciones</h1>
                    <button 
                        onClick={onAddButtonClick}
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
                    {activeView === 'fleets' ? <FleetManagement key={key} onEditFleet={handleOpenEditFleetModal} onManageFactors={() => setFactorModalOpen(true)} />
                        : activeView === 'aircraft' ? <AircraftManagement key={key} onEditAircraft={handleOpenEditAircraftModal} onManageOpTypes={() => setOpTypeModalOpen(true)} />
                        : activeView === 'organizations' ? <OrganizationManagement key={key} onEditOrganization={handleOpenEditOrgModal} onManageOrgTypes={() => setOrgTypeModalOpen(true)} />
                        : null
                    }
                </div>
            </div>

            {isAircraftModalOpen && (
                 <AircraftFormModal
                    key={`ac-form-${editingAircraft ? editingAircraft.serialNumber : 'add'}`}
                    isOpen={isAircraftModalOpen}
                    onClose={() => setAircraftModalOpen(false)}
                    onSave={handleSaveAircraft}
                    initialData={editingAircraft}
                    mode={editingAircraft ? 'edit' : 'add'}
                    onAddNewOrganization={handleRequestNewOrganization}
                    onAddNewFleet={handleRequestNewFleet}
                    onManageOpTypes={() => setOpTypeModalOpen(true)}
                />
            )}
            
            {isFleetModalOpen && (
                 <FleetFormModal
                    key={`fl-form-${editingFleet ? editingFleet.id : 'add'}`}
                    isOpen={isFleetModalOpen}
                    onClose={() => setFleetModalOpen(false)}
                    onSave={handleSaveFleet}
                    initialData={editingFleet}
                    mode={editingFleet ? 'edit' : 'add'}
                    onManageFactors={() => setFactorModalOpen(true)}
                    onAddNewCertificate={handleRequestNewCertificate}
                />
            )}

            {isOrgFormModalOpen && (
                <OrganizationFormModal
                    key={`org-form-${editingOrganization ? editingOrganization.id : 'add'}`}
                    isOpen={isOrgFormModalOpen}
                    onClose={() => setOrgFormModalOpen(false)}
                    onSave={handleSaveOrganization}
                    initialData={editingOrganization}
                    mode={editingOrganization ? 'edit' : 'add'}
                    predefinedTypeId={predefinedOrgTypeId}
                    onManageOrgTypes={() => setOrgTypeModalOpen(true)}
                />
            )}
           
           {isOpTypeModalOpen && (
                <OperationTypeManagementModal
                    key={`op-type-modal`}
                    isOpen={isOpTypeModalOpen}
                    onClose={handleCloseOpTypeModal}
                    operationTypes={mockOperationTypes}
                    aircrafts={mockAircrafts}
                />
            )}

            {isFactorModalOpen && (
                 <FactorManagementModal
                    key={`factor-modal`}
                    isOpen={isFactorModalOpen}
                    onClose={handleCloseFactorModal}
                    factorDefinitions={mockFactorDefinitions}
                    fleets={mockFleets}
                />
            )}

             {isOrgTypeModalOpen && (
                <OrganizationTypeManagementModal
                    key={`org-type-modal`}
                    isOpen={isOrgTypeModalOpen}
                    onClose={handleCloseOrgTypeModal}
                    organizationTypes={mockOrganizationTypes}
                    organizations={mockOrganizations}
                />
            )}

            {isCertificateModalOpen && (
                <CertificateFormModal
                    key={`cert-form-${editingCertificate ? editingCertificate.id : 'add'}`}
                    isOpen={isCertificateModalOpen}
                    onClose={() => setCertificateModalOpen(false)}
                    onSave={handleSaveCertificate}
                    initialData={editingCertificate}
                    mode={editingCertificate ? 'edit' : 'add'}
                    fleets={mockFleets}
                />
            )}
        </>
    );
};
