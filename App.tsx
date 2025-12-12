
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { OperationsManagement } from './components/OperationsManagement';
import { DocumentationManagement } from './components/DocumentationManagement';
import { MaintenanceManagement } from './components/MaintenanceManagement';
import { FlightLogManagement } from './components/FlightLogManagement';
import { InventoryManagement } from './components/InventoryManagement';
import { ToastProvider } from './components/ui/Toast';

export type Page = 'dashboard' | 'operations' | 'flight-logs' | 'documentation' | 'maintenance' | 'inventory';

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard />;
            case 'operations':
                return <OperationsManagement />;
            case 'flight-logs':
                return <FlightLogManagement />;
            case 'documentation':
                return <DocumentationManagement />;
            case 'maintenance':
                return <MaintenanceManagement />;
            case 'inventory':
                return <InventoryManagement />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <ToastProvider>
            <div className="flex h-screen bg-gray-900 text-gray-100">
                <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {renderPage()}
                </main>
            </div>
        </ToastProvider>
    );
};

export default App;
