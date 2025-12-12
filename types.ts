
export interface DatabaseSchemaAnalysis {
    confirmation: string;
    summary: {
        title: string;
        blocks: {
            name: string;
            description: string;
            tables: string[];
        }[];
    };
    feedback: {
        title:string;
        points: string[];
    };
    suggestions: {
        title: string;
        points: string[];
    };
    nextSteps: {
        title: string;
        action: string;
    };
}

export type ValueType = 'integer' | 'float' | 'boolean' | 'string';

export interface AppSettings {
    serverUrl: string;
    organizationName: string;
}

export interface FactorDefinition {
    id: string;           // UUID interno, lo gestiona el sistema
    code: string;         // Clave de negocio, ej: 'FH', 'CYC', 'RIN'
    name: string;         // Nombre legible, ej: 'Horas de Vuelo'
    valueType: ValueType;
    status: 'Active' | 'Inactive';
}

export interface CustomFactor {
    factorId: string; // Enlaza con FactorDefinition.id
    value: string;
}

export interface AmpIncludedDocument {
    documentId: string;
    revisionUsed: string;
}

export interface AMP {
    id:string;
    name: string;
    fleetId?: string; // Link to Fleet.id (1-to-1 relationship)
    revision: string;
    status?: 'Draft' | 'Active' | 'Superseded';
    revisionDate?: string; // ISO date string
    description?: string;
    notes?: string;
    lastModifiedBy?: string;
    lastModifiedDate?: string;
    officialLink?: string;
    internalLink?: string;
    includedAircraftSNs: string[];
    includedDocuments: AmpIncludedDocument[];
    nextReviewDate?: string; // ISO date string, calculated from document deadlines
}

export interface Fleet {
    id: string;
    name: string;
    // STRONG RELATIONSHIP: The governing Type Certificate
    typeCertificateId?: string; // Link to Certificate.id (Must be type='TC')
    numMotors: number;
    customFactors: CustomFactor[];
    notes: string;
    lastModifiedBy: string;
    lastModifiedDate: string;
    status: 'Active' | 'Inactive';
}

export interface OperationType {
    id: string;           // UUID interno
    code: string;         // Código de negocio, ej: 'AOC', 'SPO'
    name: string;         // Ej: 'Air Operator Certificate'
    description: string;
    status: 'Active' | 'Inactive';
}


export interface Aircraft {
    id: string; // Internal UUID (Immutable)
    serialNumber: string; // Business Key (Manufacturer S/N)
    registration: string;
    model: string;
    ownerId: string; // Link to Organization.id
    camoId: string; // Link to Organization.id
    fleetId: string; // Link to Fleet.id
    status: 'Active' | 'Inactive';
    notes: string;
    operationStartDate: string; // ISO date string e.g., '2022-01-15'
    contractEndDate: string; // ISO date string e.g., '2025-01-14'
    operationTypeIds: string[]; // Link to OperationType.id
    lastModifiedBy: string;
    lastModifiedDate: string; // ISO date string
    // Current counters of the aircraft (updated via Flight Logs)
    counters: Record<string, number>; 
    manufactureDate?: string; // ISO date string
}

export interface OrganizationType {
    id: string;           // Internal UUID (immutable, system-managed)
    code: string;         // Ej: 'CAMO', 'MRO', 'AOC_HOLDER'
    name: string;         // Nombre largo legible
    description: string;
    status: 'Active' | 'Inactive';
}


export interface Organization {
    id: string;
    name: string;
    typeId: string; // Link to OrganizationType.id
    approval: string; // e.g., ES.MG.123
    approvalLink?: string;
    notes: string;
    linkTlb?: string;
    status: 'Active' | 'Inactive';
}

export interface Certificate {
    id: string;
    type: 'TC' | 'STC';
    holder: string; // e.g., 'Airbus S.A.S.'
    tcds: string; // e.g., 'EASA.A.064'
    // Backward compatibility or for STCs applying to many fleets
    applicableFleetIds: string[]; // Link to Fleet.id
    revision: string;
    revisionDate: string; // ISO date string
    lastWebCheckDate?: string; // ISO date string
    notes: string;
    officialLink?: string;
    internalLink?: string;
    lastModifiedBy: string;
    lastModifiedDate: string;
    status: 'Active' | 'Inactive';
}

export interface DocumentType {
    id: string;           // UUID interno
    code: string;         // Ej: 'AMM', 'AFM', 'IPC'
    name: string;         // Ej: 'Aircraft Maintenance Manual'
    description: string;
    status: 'Active' | 'Inactive';
}


export interface Document {
    id: string;
    docType: string; // Link to DocumentType.id
    title: string;
    revision: string;
    revisionDate: string; // ISO date string
    lastWebCheckDate?: string; // ISO date string
    analysisFormRef?: string; // e.g., RT35A-2024-012
    implementationDeadline?: string; // ISO date string
    status: 'Active' | 'Superseded' | 'Draft';
    supersededByDocId?: string; // Link to Document.id, mandatory if status is Superseded
    certificateIds: string[]; // Link to Certificate.id (Many-to-Many)
    notes: string;
    officialLink?: string;
    internalLink?: string;
    lastModifiedBy: string;
    lastModifiedDate: string;
}

export interface Tolerance {
    id: string;
    title: string;
    description: string;
    tolerance: string; // e.g. "10%", "50 Horas", "10% o 300h (el menor)"
    sourceDocumentIds: string[]; // Link to Document.id
    applicableAmpIds: string[]; // Link to AMP.id
    status: 'Active' | 'Inactive';
    notes: string;
    lastModifiedBy: string;
    lastModifiedDate: string;
}

export interface WorkOrder {
    id: string;
    title: string;
    aircraftRegistration: string; // Link to Aircraft.registration
    status: 'Open' | 'In Progress' | 'Completed' | 'Deferred';
    type: 'Scheduled' | 'Unscheduled' | 'AD/SB' | 'Component Change' | 'Inspection';
    priority: 'Low' | 'Normal' | 'High' | 'Urgent';
    sourceDocumentId?: string; // Link to Document.id (for AD/SB compliance)
    ampTaskId?: string; // Link to a specific task within an AMP
    creationDate: string; // ISO date string
    dueDate: string; // ISO date string
    completionDate?: string; // ISO date string
    assignedToId?: string; // Link to Organization.id (e.g., MRO) or a user ID
    notes?: string;
}

export interface FlightLog {
    id: string;
    aircraftRegistration: string; // Link to Aircraft.registration
    date: string; // ISO date string
    flightNumber?: string;
    from: string; // ICAO/IATA code
    to: string; // ICAO/IATA code
    
    // OOOI Times (HH:mm)
    offBlockTime: string; 
    takeOffTime: string;
    landingTime: string;
    onBlockTime: string;
    
    // Calculated Durations (Decimal Hours)
    blockTime: number; 
    flightTime: number;
    
    landings: number; // Cycles
    pilotName?: string;
    status: 'Draft' | 'Verified';
    notes?: string;
    
    // Dynamic factors readings (Delta values for this flight)
    // e.g., { 'RIN': 12, 'ENG_CYC': 1 }
    customReadings?: Record<string, number>;

    creationDate: string;
}

export interface InspectionInterval {
    factorId: string; // Matches a FactorDefinition.id (e.g., 'FH', 'CYC', 'DAYS')
    value: number;
}

export interface Inspection {
    id: string; // Internal UUID
    taskNumber: string; // Business Key: e.g., "05-20-00-201" - Editable by user
    title: string;
    description: string;
    
    // References & Traceability
    sourceDocumentIds: string[]; // Link to Document.id (Multiple)
    documentReference: string; // e.g., "AMM 28-10-01, Step 4.A."
    
    ampId: string; // Link to AMP.id
    ampRevisionSnapshot?: string; 
    
    jobCardLink?: string; // Link to uploaded PDF/File

    // Applicability
    applicableAircraftSNs: string[]; // Specific Aircraft SNs (Optional, overrides AMP fleet if present, or for specific modifications)
    applicablePartNumbers: string[]; // Specific Component PNs (For component-level tasks)

    toleranceId?: string; // Link to Tolerance.id
    
    intervals: InspectionInterval[]; // Dynamic array of intervals based on fleet factors
    
    zone?: string; // e.g. "211" (Left Main Fuselage)
    skillRequired?: 'B1' | 'B2' | 'NDT' | 'General';
    manHours?: number;
    
    status: 'Active' | 'Inactive';
    notes: string;
    lastModifiedBy: string;
    lastModifiedDate: string;
}

// THIS IS THE CATALOG DEFINITION (P/N)
export interface Component {
    id: string; // Internal ID
    partNumber: string;
    description: string;
    sourceDocumentIds: string[]; // Link to Document.id (Multiple)
    ampIds: string[]; // Link to AMP.id (Replaces certificateIds)
    
    // What factors DOES this component support PHYSICALLY? (Whitelist)
    // E.g. A blade can accumulate FH, RIN, and CYC physically.
    allowedFactorIds: string[]; 

    status: 'Active' | 'Inactive'; // Catalog Status
    notes: string;
    lastModifiedBy: string;
    lastModifiedDate: string;
}

export interface InstallationSnapshot {
    date: string; // ISO Date of installation
    parentCounters: Record<string, number>; // The aircraft/parent counters at the moment of install (TSN_AC)
    assetCounters: Record<string, number>; // The component counters at the moment of install (TSN_Comp)
}

export interface ComponentHistoryEntry {
    date: string;
    action: 'Install' | 'Remove' | 'Maintenance' | 'Creation';
    details: string;
    countersSnapshot?: Record<string, number>; // Counters at the time of event
}

// THIS IS THE PHYSICAL ASSET (S/N)
export interface ComponentAsset {
    id: string; // Unique Asset ID
    partNumberId: string; // Link to Component.id (The P/N definition)
    serialNumber: string;
    
    // Location & Hierarchy
    locationType: 'Aircraft' | 'Stock' | 'MRO';
    
    // GLOBAL CONTEXT: The physical container (Aircraft Registration or Warehouse Name).
    // This allows fast queries like "Show everything on EC-123" without recursion.
    locationReference: string; 
    
    // PARENT FK (Structural): The immediate parent this is attached to.
    // - If attached to Airframe directly: Aircraft Serial Number.
    // - If attached to another Component (NHA): The Parent ComponentAsset.id.
    // - If loose in stock: null.
    parentId?: string | null; 

    // Status
    condition: 'Serviceable' | 'Unserviceable' | 'Scrapped' | 'Installed';
    
    // Life (Dynamic Counters - Current Accumulated Value)
    // Key is factorId (e.g. 'FH', 'CYC'), value is the current count
    counters: Record<string, number>; 
    
    // Specific Life Limit for THIS Asset (LLP)
    // This overrides generic inspection intervals if present.
    // e.g., { 'FH': 2500 }
    lifeLimit?: Record<string, number>;

    // Installation Data (For calculating current life on-wing)
    // If null, it means it's not installed or we don't have the data.
    installationDetails?: InstallationSnapshot | null;

    history?: ComponentHistoryEntry[];

    manufactureDate?: string;
    installationDate?: string;
    
    notes: string;
    lastModifiedDate: string;
}

export interface SystemAlert {
    id: string;
    title: string;
    message: string;
    dueDate: string; // ISO date string or empty
    severity: 'info' | 'warning' | 'critical';
    creationDate: string;
}

export interface DatabaseDump {
    settings: AppSettings;
    fleets: Fleet[];
    aircrafts: Aircraft[];
    organizations: Organization[];
    organizationTypes: OrganizationType[];
    operationTypes: OperationType[];
    factorDefinitions: FactorDefinition[];
    certificates: Certificate[];
    documents: Document[];
    documentTypes: DocumentType[];
    amps: AMP[];
    tolerances: Tolerance[];
    workOrders: WorkOrder[];
    flightLogs: FlightLog[]; 
    inspections: Inspection[];
    components: Component[];
    componentAssets: ComponentAsset[]; // Added Asset dump
    systemAlerts: SystemAlert[];
    timestamp: string;
    version: string;
}

export interface AuditLogEntry {
    id: string; // Unique log entry ID
    timestamp: string; // ISO date string
    userId: string; // User who made the change
    recordType: 'Fleet' | 'Aircraft' | 'Organization'; // The type of record changed
    recordId: string; // The ID of the record that was changed
    fieldName: string; // The specific field that was modified
    oldValue: string;
    newValue: string;
    changeReason?: string; // Optional reason for the change
}
