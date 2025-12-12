
import React from 'react';
import { CubeIcon } from './Icons';
import { ComponentAssetManagement } from './ComponentAssetManagement';

export const InventoryManagement: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Activos y Stock</h1>
            </div>

            <div className="border-b border-gray-700">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm border-sky-400 text-sky-400`}
                    >
                        <CubeIcon className={`-ml-0.5 mr-2 h-5 w-5 text-sky-400`} />
                        <span>Inventario Físico (S/N)</span>
                    </button>
                </nav>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <ComponentAssetManagement />
            </div>
        </div>
    );
};
