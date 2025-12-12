
import React from 'react';
import type { Page } from '../App';
import { DashboardIcon, OperationsIcon, DocsIcon, MaintenanceIcon, PaperAirplaneIcon, CubeIcon } from './Icons';

interface SidebarProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
        { id: 'operations', label: 'Operaciones', icon: OperationsIcon },
        { id: 'flight-logs', label: 'Registros Vuelo', icon: PaperAirplaneIcon },
        { id: 'documentation', label: 'Documentación', icon: DocsIcon },
        { id: 'maintenance', label: 'AMPs', icon: MaintenanceIcon },
        { id: 'inventory', label: 'Activos / Stock', icon: CubeIcon },
    ];

    return (
        <aside className="w-16 sm:w-64 bg-gray-900 border-r border-gray-700 flex flex-col">
            <div className="flex items-center justify-center sm:justify-start sm:px-6 h-20 border-b border-gray-700">
                <div className="text-xl font-bold text-sky-400">
                    <span className="sm:hidden">RTS</span>
                    <span className="hidden sm:inline">Regulatory Tracking Suite</span>
                </div>
            </div>
            <nav className="flex-1 px-2 sm:px-4 py-6 space-y-2">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setCurrentPage(item.id as Page)}
                        className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 ${
                            currentPage === item.id
                                ? 'bg-sky-500 text-white shadow-lg'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                    >
                        <item.icon className="h-6 w-6" />
                        <span className="hidden sm:inline ml-4 font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>
            <div className="px-4 py-6 border-t border-gray-700">
                <p className="hidden sm:block text-xs text-center text-gray-500">© 2024 AeroControl Systems</p>
            </div>
        </aside>
    );
};
