
import type {
  Fleet,
  FactorDefinition,
  AMP,
  Aircraft,
  Organization,
  OrganizationType,
  OperationType,
  Certificate,
  Document,
  DocumentType,
  Tolerance,
  Inspection,
  Component,
  ComponentAsset,
  SystemAlert,
  DatabaseDump,
  AppSettings,
  FlightLog,
  WorkOrder,
} from '../types';

const STORAGE_KEY = 'RTS_DATABASE_V1';

/**
 * Simple UUID generator.
 */
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// --- DATA STORES ---

// Default settings
const defaultSettings: AppSettings = {
  serverUrl: 'https://demo.aerocontrol.local',
  organizationName: 'AeroControl Systems Demo',
};

// Default Data with UUIDs (not readable IDs)
const defaultFactorDefinitions: FactorDefinition[] = [
  { id: '11111111-1111-4111-a111-111111111111', code: 'FH', name: 'Horas de Vuelo', valueType: 'float', status: 'Active' },
  { id: '22222222-2222-4222-a222-222222222222', code: 'CYC', name: 'Ciclos / Aterrizajes', valueType: 'integer', status: 'Active' },
  { id: '33333333-3333-4333-a333-333333333333', code: 'DAYS', name: 'Días Calendario', valueType: 'integer', status: 'Active' },
  { id: '44444444-4444-4444-a444-444444444444', code: 'RIN', name: 'Factor RIN', valueType: 'integer', status: 'Active' },
];

const defaultOperationTypes: OperationType[] = [
  { id: 'aaaa-aaaa-aaaa-aaaa', code: 'AOC', name: 'Air Operator Certificate', description: 'Operaciones comerciales regulares', status: 'Active' },
  { id: 'bbbb-bbbb-bbbb-bbbb', code: 'SPO', name: 'Specialised Operations', description: 'Operaciones Especiales', status: 'Active' },
];

const defaultOrganizationTypes: OrganizationType[] = [
  { id: 'org-type-1', code: 'CAMO', name: 'Continuing Airworthiness Management Organisation', description: 'Organización CAMO', status: 'Active' },
  { id: 'org-type-2', code: 'MRO', name: 'Maintenance, Repair & Overhaul', description: 'Taller / organización de mantenimiento', status: 'Active' },
  { id: 'org-type-3', code: 'OWNER', name: 'Owner / Lessor', description: 'Propietario o arrendador', status: 'Active' },
];

// Initialize exports with defaults
export let mockSettings: AppSettings = { ...defaultSettings };
export let mockFactorDefinitions: FactorDefinition[] = [...defaultFactorDefinitions];
export let mockOperationTypes: OperationType[] = [...defaultOperationTypes];
export let mockOrganizationTypes: OrganizationType[] = [...defaultOrganizationTypes];

export let mockOrganizations: Organization[] = [];
export let mockFleets: Fleet[] = [];
export let mockAircrafts: Aircraft[] = [];
export let mockAmps: AMP[] = [];
export let mockCertificates: Certificate[] = [];
export let mockDocuments: Document[] = [];
export let mockDocumentTypes: DocumentType[] = [];
export let mockTolerances: Tolerance[] = [];
export let mockInspections: Inspection[] = [];
export let mockComponents: Component[] = [];
export let mockComponentAssets: ComponentAsset[] = [];
export let mockFlightLogs: FlightLog[] = [];
export let mockWorkOrders: WorkOrder[] = [];
export let mockSystemAlerts: SystemAlert[] = [];

// --- PERSISTENCE HELPERS ---

const persistData = () => {
  const dump: DatabaseDump = {
    settings: mockSettings,
    fleets: mockFleets,
    aircrafts: mockAircrafts,
    organizations: mockOrganizations,
    organizationTypes: mockOrganizationTypes,
    operationTypes: mockOperationTypes,
    factorDefinitions: mockFactorDefinitions,
    certificates: mockCertificates,
    documents: mockDocuments,
    documentTypes: mockDocumentTypes,
    amps: mockAmps,
    tolerances: mockTolerances,
    workOrders: mockWorkOrders,
    flightLogs: mockFlightLogs,
    inspections: mockInspections,
    components: mockComponents,
    componentAssets: mockComponentAssets,
    systemAlerts: mockSystemAlerts,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dump));
  } catch (e) {
    console.error("Error saving to localStorage", e);
  }
};

const loadData = () => {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (json) {
      const dump = JSON.parse(json) as DatabaseDump;
      
      mockSettings = dump.settings || defaultSettings;
      
      // Load definitions or fallback to default
      mockOrganizationTypes = (dump.organizationTypes && dump.organizationTypes.length > 0) ? dump.organizationTypes : defaultOrganizationTypes;
      mockOperationTypes = (dump.operationTypes && dump.operationTypes.length > 0) ? dump.operationTypes : defaultOperationTypes;
      mockFactorDefinitions = (dump.factorDefinitions && dump.factorDefinitions.length > 0) ? dump.factorDefinitions : defaultFactorDefinitions;

      // Load data entities
      mockFleets = dump.fleets || [];
      mockAircrafts = dump.aircrafts || [];
      mockOrganizations = dump.organizations || [];
      mockCertificates = dump.certificates || [];
      mockDocuments = dump.documents || [];
      mockDocumentTypes = dump.documentTypes || [];
      mockAmps = dump.amps || [];
      mockTolerances = dump.tolerances || [];
      mockWorkOrders = dump.workOrders || [];
      mockFlightLogs = dump.flightLogs || [];
      mockInspections = dump.inspections || [];
      mockComponents = dump.components || [];
      mockComponentAssets = dump.componentAssets || [];
      mockSystemAlerts = dump.systemAlerts || [];
    }
  } catch (e) {
    console.error("Error loading from localStorage", e);
  }
};

// Initial Load
loadData();

// --- BACKUP & RESTORE ---

export const getDatabaseDump = (): DatabaseDump => ({
  settings: mockSettings,
  fleets: mockFleets,
  aircrafts: mockAircrafts,
  organizations: mockOrganizations,
  organizationTypes: mockOrganizationTypes,
  operationTypes: mockOperationTypes,
  factorDefinitions: mockFactorDefinitions,
  certificates: mockCertificates,
  documents: mockDocuments,
  documentTypes: mockDocumentTypes,
  amps: mockAmps,
  tolerances: mockTolerances,
  workOrders: mockWorkOrders,
  flightLogs: mockFlightLogs,
  inspections: mockInspections,
  components: mockComponents,
  componentAssets: mockComponentAssets,
  systemAlerts: mockSystemAlerts,
  timestamp: new Date().toISOString(),
  version: '1.0.0',
});

/**
 * Restaura la base de datos desde un objeto DatabaseDump.
 * Sobrescribe las variables en memoria y guarda inmediatamente en localStorage.
 */
export const restoreDatabaseDump = (dump: DatabaseDump): void => {
  if (!dump) return;

  // Settings
  mockSettings = dump.settings || defaultSettings;

  // Core Data - Sobrescribimos arrays con lo que venga del JSON
  mockFleets = dump.fleets || [];
  mockAircrafts = dump.aircrafts || [];
  mockOrganizations = dump.organizations || [];
  
  // Catalogs - Si el JSON tiene datos, los usamos. Si no, dejamos arrays vacíos para evitar mezclas extrañas,
  // o defaults si queremos ser seguros. Aquí usamos lo que viene.
  mockOrganizationTypes = dump.organizationTypes || [];
  mockOperationTypes = dump.operationTypes || [];
  mockFactorDefinitions = dump.factorDefinitions || [];

  // Documents & Engineering
  mockCertificates = dump.certificates || [];
  mockDocuments = dump.documents || [];
  mockDocumentTypes = dump.documentTypes || [];
  mockAmps = dump.amps || [];
  mockTolerances = dump.tolerances || [];
  mockInspections = dump.inspections || [];
  mockComponents = dump.components || [];
  mockComponentAssets = dump.componentAssets || [];

  // Operations
  mockWorkOrders = dump.workOrders || [];
  mockFlightLogs = dump.flightLogs || [];
  mockSystemAlerts = dump.systemAlerts || [];

  // IMPORTANT: Save to disk immediately so the reload picks up the new state
  persistData();
};

export const resetDatabase = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
};

export const getSettings = (): AppSettings => ({ ...mockSettings });

export const updateSettings = (settings: AppSettings): void => {
  mockSettings = settings;
  persistData();
};

// --- CRUD OPERATIONS ---

// Helper wrapper to ensure persistence happens after every modification
// (Already implemented in individual functions below, keeping as is)

export const addFactorDefinition = (def: FactorDefinition): FactorDefinition => {
  const id = generateUUID(); 
  const newDef: FactorDefinition = { ...def, id, code: def.code.toUpperCase() };
  mockFactorDefinitions.push(newDef);
  persistData();
  return newDef;
};
export const updateFactorDefinition = (def: FactorDefinition): void => {
  const idx = mockFactorDefinitions.findIndex(f => f.id === def.id);
  if (idx !== -1) { mockFactorDefinitions[idx] = def; persistData(); }
};
export const addOperationType = (op: OperationType): OperationType => {
  const id = generateUUID();
  const newOp: OperationType = { ...op, id, code: op.code.toUpperCase() };
  mockOperationTypes.push(newOp);
  persistData();
  return newOp;
};
export const updateOperationType = (op: OperationType): void => {
  const idx = mockOperationTypes.findIndex(o => o.id === op.id);
  if (idx !== -1) { mockOperationTypes[idx] = op; persistData(); }
};
export const addOrganizationType = (ot: OrganizationType): OrganizationType => {
  const id = generateUUID();
  const newType: OrganizationType = { ...ot, id, code: ot.code.toUpperCase() };
  mockOrganizationTypes.push(newType);
  persistData();
  return newType;
};
export const updateOrganizationType = (ot: OrganizationType): void => {
  const idx = mockOrganizationTypes.findIndex(t => t.id === ot.id);
  if (idx !== -1) { mockOrganizationTypes[idx] = ot; persistData(); }
};
export const addOrganization = (org: Organization): Organization => {
  const id = org.id || generateUUID();
  const newOrg: Organization = { ...org, id };
  mockOrganizations.push(newOrg);
  persistData();
  return newOrg;
};
export const updateOrganization = (org: Organization): void => {
  const idx = mockOrganizations.findIndex(o => o.id === org.id);
  if (idx !== -1) { mockOrganizations[idx] = org; persistData(); }
};
export const addFleet = (fleet: Fleet): Fleet => {
  const id = fleet.id || generateUUID();
  const newFleet: Fleet = { ...fleet, id };
  mockFleets.push(newFleet);
  persistData();
  return newFleet;
};
export const updateFleet = (fleet: Fleet): void => {
  const idx = mockFleets.findIndex(f => f.id === fleet.id);
  if (idx !== -1) { mockFleets[idx] = fleet; persistData(); }
};
export const addAircraft = (aircraft: Aircraft): Aircraft => {
  const id = aircraft.id || generateUUID();
  const newAircraft: Aircraft = { ...aircraft, id };
  mockAircrafts.push(newAircraft);
  persistData();
  return newAircraft;
};
export const updateAircraft = (aircraft: Aircraft): void => {
  const idx = mockAircrafts.findIndex(a => a.id === aircraft.id);
  if (idx !== -1) { mockAircrafts[idx] = aircraft; persistData(); }
};
export const addAmp = (amp: AMP): AMP => {
  const id = amp.id || generateUUID();
  const newAmp: AMP = { ...amp, id };
  mockAmps.push(newAmp);
  persistData();
  return newAmp;
};
export const updateAmp = (amp: AMP): void => {
  const idx = mockAmps.findIndex(a => a.id === amp.id);
  if (idx !== -1) { mockAmps[idx] = amp; persistData(); }
};
export const linkAmpToFleet = (fleetId: string, ampId?: string, _oldAmpId?: string): void => {
  if (!ampId) return;
  const amp = mockAmps.find(a => a.id === ampId);
  if (amp) { amp.fleetId = fleetId; persistData(); }
};
export const addCertificate = (cert: Certificate): Certificate => {
  const id = cert.id || generateUUID();
  const newCert: Certificate = { ...cert, id };
  mockCertificates.push(newCert);
  persistData();
  return newCert;
};
export const updateCertificate = (cert: Certificate): void => {
  const idx = mockCertificates.findIndex(c => c.id === cert.id);
  if (idx !== -1) { mockCertificates[idx] = cert; persistData(); }
};
export const addDocumentType = (dt: DocumentType): DocumentType => {
  const id = generateUUID();
  const newDt: DocumentType = { ...dt, id, code: dt.code.toUpperCase() };
  mockDocumentTypes.push(newDt);
  persistData();
  return newDt;
};
export const updateDocumentType = (dt: DocumentType): void => {
  const idx = mockDocumentTypes.findIndex(d => d.id === dt.id);
  if (idx !== -1) { mockDocumentTypes[idx] = dt; persistData(); }
};
export const addDocument = (doc: Document): Document => {
  const id = doc.id || generateUUID();
  const newDoc: Document = { ...doc, id };
  mockDocuments.push(newDoc);
  persistData();
  return newDoc;
};
export const updateDocument = (doc: Document): void => {
  const idx = mockDocuments.findIndex(d => d.id === doc.id);
  if (idx !== -1) { mockDocuments[idx] = doc; persistData(); }
};
export const batchUpdateDocuments = (docs: Document[]): void => {
  docs.forEach(doc => {
      const idx = mockDocuments.findIndex(d => d.id === doc.id);
      if (idx !== -1) mockDocuments[idx] = doc;
  });
  persistData();
};
export const addTolerance = (t: Tolerance): Tolerance => {
  const id = t.id || generateUUID();
  const newTol: Tolerance = { ...t, id };
  mockTolerances.push(newTol);
  persistData();
  return newTol;
};
export const updateTolerance = (t: Tolerance): void => {
  const idx = mockTolerances.findIndex(x => x.id === t.id);
  if (idx !== -1) { mockTolerances[idx] = t; persistData(); }
};
export const addInspection = (insp: Inspection): Inspection => {
  const id = insp.id || generateUUID();
  const newInspection: Inspection = { ...insp, id };
  mockInspections.push(newInspection);
  persistData();
  return newInspection;
};
export const updateInspection = (insp: Inspection): void => {
  const idx = mockInspections.findIndex(i => i.id === insp.id);
  if (idx !== -1) { mockInspections[idx] = insp; persistData(); }
};
export const addComponent = (comp: Component): Component => {
  const id = comp.id || generateUUID();
  const now = new Date().toISOString().split('T')[0];
  const newComp: Component = { ...comp, id, ...(comp as any).lastModifiedDate ? {} : { lastModifiedDate: now } };
  mockComponents.push(newComp);
  persistData();
  return newComp;
};
export const updateComponent = (comp: Component): void => {
  const idx = mockComponents.findIndex(c => c.id === comp.id);
  if (idx !== -1) { mockComponents[idx] = comp; persistData(); }
};
export const addComponentAsset = (asset: ComponentAsset): ComponentAsset => {
  const id = asset.id || generateUUID();
  const now = new Date().toISOString().split('T')[0];
  const newAsset: ComponentAsset = { ...asset, id, ...(asset as any).lastModifiedDate ? {} : { lastModifiedDate: now } };
  mockComponentAssets.push(newAsset);
  persistData();
  return newAsset;
};
export const updateComponentAsset = (asset: ComponentAsset): void => {
  const idx = mockComponentAssets.findIndex(a => a.id === asset.id);
  if (idx !== -1) { mockComponentAssets[idx] = asset; persistData(); }
};
export const installComponentAsset = (assetId: string, parentId: string, date: string, counters: Record<string, number>, locationRef: string): void => {
    const assetIndex = mockComponentAssets.findIndex(a => a.id === assetId);
    if (assetIndex > -1) {
        mockComponentAssets[assetIndex] = {
            ...mockComponentAssets[assetIndex],
            locationType: 'Aircraft',
            locationReference: locationRef,
            parentId: parentId,
            condition: 'Installed',
            installationDetails: {
                date,
                parentCounters: { ...counters },
                assetCounters: { ...mockComponentAssets[assetIndex].counters }
            },
            history: [
                ...(mockComponentAssets[assetIndex].history || []),
                { date, action: 'Install', details: `Installed on ${locationRef} (Parent: ${parentId})`, countersSnapshot: { ...mockComponentAssets[assetIndex].counters } }
            ]
        };
        persistData();
    }
};
export const removeComponentAsset = (assetId: string, date: string, counters: Record<string, number>, condition: ComponentAsset['condition']): void => {
    const assetIndex = mockComponentAssets.findIndex(a => a.id === assetId);
    if (assetIndex > -1) {
        const asset = mockComponentAssets[assetIndex];
        mockComponentAssets[assetIndex] = {
            ...asset,
            locationType: 'Stock',
            locationReference: 'Main Store',
            parentId: null,
            condition: condition,
            installationDetails: null,
            history: [
                ...(asset.history || []),
                { date, action: 'Remove', details: `Removed from ${asset.locationReference}. Condition: ${condition}`, countersSnapshot: { ...asset.counters } }
            ]
        };
        persistData();
    }
};
export const addFlightLog = (log: FlightLog): FlightLog => {
  const id = log.id || generateUUID();
  const newLog: FlightLog = { ...log, id };
  mockFlightLogs.push(newLog);
  persistData();
  return newLog;
};
export const updateFlightLog = (log: FlightLog): void => {
  const idx = mockFlightLogs.findIndex(l => l.id === log.id);
  if (idx !== -1) { mockFlightLogs[idx] = log; persistData(); }
};
export const addWorkOrder = (wo: WorkOrder): WorkOrder => {
  const id = wo.id || generateUUID();
  const newWo: WorkOrder = { ...wo, id };
  mockWorkOrders.push(newWo);
  persistData();
  return newWo;
};
export const updateWorkOrder = (wo: WorkOrder): void => {
  const idx = mockWorkOrders.findIndex(w => w.id === wo.id);
  if (idx !== -1) { mockWorkOrders[idx] = wo; persistData(); }
};
export const addSystemAlert = (alert: Omit<SystemAlert, 'id' | 'creationDate'>): SystemAlert => {
  const id = generateUUID();
  const creationDate = new Date().toISOString();
  const newAlert: SystemAlert = { ...alert, id, creationDate };
  mockSystemAlerts.push(newAlert);
  persistData();
  return newAlert;
};
export const updateSystemAlert = (alert: SystemAlert): void => {
  const idx = mockSystemAlerts.findIndex(a => a.id === alert.id);
  if (idx !== -1) { mockSystemAlerts[idx] = alert; persistData(); }
};
export const removeSystemAlert = (id: string): void => {
  const idx = mockSystemAlerts.findIndex(a => a.id === id);
  if (idx !== -1) { mockSystemAlerts.splice(idx, 1); persistData(); }
};
