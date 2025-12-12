
import React, { useState, useEffect, useMemo } from 'react';
import type { DatabaseSchemaAnalysis, SystemAlert, DatabaseDump } from '../types';
import { geminiService } from '../services/geminiService';
import { mockSystemAlerts, addSystemAlert, updateSystemAlert, removeSystemAlert } from '../data/mockDatabase';
import { CheckCircleIcon, LightBulbIcon, RocketLaunchIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon, SearchIcon, AdjustmentsHorizontalIcon, CalendarDaysIcon, Cog6ToothIcon } from './Icons';
import { SettingsModal } from './SettingsModal';

// --- Components ---

const AlertItem: React.FC<{ alert: SystemAlert; onDismiss: (id: string) => void; onEdit: (alert: SystemAlert) => void }> = ({ alert, onDismiss, onEdit }) => {
    const severityClasses = {
        info: 'border-l-4 border-blue-500 bg-blue-900/20',
        warning: 'border-l-4 border-yellow-500 bg-yellow-900/20',
        critical: 'border-l-4 border-red-500 bg-red-900/20',
    };

    const severityIconColor = {
        info: 'text-blue-400',
        warning: 'text-yellow-400',
        critical: 'text-red-400',
    };

    return (
        <div 
            className={`p-4 rounded-r-lg shadow-md mb-3 flex justify-between items-start transition-all hover:bg-gray-800 cursor-pointer ${severityClasses[alert.severity]}`}
            onClick={() => onEdit(alert)}
        >
            <div>
                <div className="flex items-center gap-2">
                    <h4 className={`font-bold ${severityIconColor[alert.severity]}`}>{alert.title}</h4>
                    {alert.dueDate && (
                        <span className="text-xs text-gray-400 bg-gray-900/50 px-2 py-0.5 rounded-full font-mono">
                            Vence: {alert.dueDate}
                        </span>
                    )}
                </div>
                <p className="text-gray-300 text-sm mt-1">{alert.message}</p>
            </div>
            <button 
                onClick={(e) => { e.stopPropagation(); onDismiss(alert.id); }}
                className="text-gray-500 hover:text-white transition-colors p-1"
                title="Descartar aviso"
            >
                <XMarkIcon className="h-5 w-5" />
            </button>
        </div>
    );
};

export const Dashboard: React.FC = () => {
    const [analysis, setAnalysis] = useState<DatabaseSchemaAnalysis | null>(null);
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(true);
    
    // Alert State
    const [alerts, setAlerts] = useState<SystemAlert[]>([]);
    const [isAlertModalOpen, setAlertModalOpen] = useState(false);
    const [editingAlert, setEditingAlert] = useState<SystemAlert | null>(null);
    const [alertFormData, setAlertFormData] = useState<{title: string, message: string, severity: 'info'|'warning'|'critical', dueDate: string}>({
        title: '', message: '', severity: 'info', dueDate: ''
    });

    // Settings Modal
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);

    // Alert Filters
    const [alertFilterText, setAlertFilterText] = useState('');
    const [alertFilterSeverity, setAlertFilterSeverity] = useState<'all'|'info'|'warning'|'critical'>('all');
    // Renamed and repurposed filter state
    const [filterDate, setFilterDate] = useState('');

    // Toggle Analysis Visibility
    const [showAnalysis, setShowAnalysis] = useState(true);

    useEffect(() => {
        setAlerts([...mockSystemAlerts]);
        // Simulate load
        const fetchAnalysis = async () => {
            try {
                setIsLoadingAnalysis(true);
                const result = await geminiService.analyzeDatabaseSchema("Analiza esta BBDD", true);
                setAnalysis(result);
            } catch (err) { console.error(err); } finally { setIsLoadingAnalysis(false); }
        };
        fetchAnalysis();
    }, []);

    // Filter Logic
    const processedAlerts = useMemo(() => {
        let items = [...alerts];
        
        // 1. Text Filter
        if (alertFilterText) {
            items = items.filter(a => a.title.toLowerCase().includes(alertFilterText.toLowerCase()) || a.message.toLowerCase().includes(alertFilterText.toLowerCase()));
        }

        // 2. Severity Filter
        if (alertFilterSeverity !== 'all') {
            items = items.filter(a => a.severity === alertFilterSeverity);
        }

        // 3. Date Filter
        if (filterDate) {
            // Show alerts expiring on or before the selected date
            const selectedTimestamp = new Date(filterDate).getTime();
            items = items.filter(a => {
                if (!a.dueDate) return false;
                const dueTimestamp = new Date(a.dueDate).getTime();
                return dueTimestamp <= selectedTimestamp;
            });
        } else {
            // Default behavior: Next 7 days + Overdue
            const today = new Date();
            today.setHours(0,0,0,0);
            const sevenDaysFromNow = new Date(today);
            sevenDaysFromNow.setDate(today.getDate() + 7);

            items = items.filter(a => {
                if (!a.dueDate) return false;
                const due = new Date(a.dueDate);
                return due <= sevenDaysFromNow;
            });
        }

        // Sort by date (ascending) then severity (critical first)
        items.sort((a, b) => {
            const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
            const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
            return dateA - dateB;
        });

        return items;
    }, [alerts, alertFilterText, alertFilterSeverity, filterDate]);

    // Modal Handlers
    const handleOpenAdd = () => {
        setEditingAlert(null);
        setAlertFormData({ title: '', message: '', severity: 'info', dueDate: '' });
        setAlertModalOpen(true);
    };

    const handleOpenEdit = (alert: SystemAlert) => {
        setEditingAlert(alert);
        setAlertFormData({
            title: alert.title,
            message: alert.message,
            severity: alert.severity,
            dueDate: alert.dueDate
        });
        setAlertModalOpen(true);
    };

    const handleSaveAlert = () => {
        if(!alertFormData.title || !alertFormData.message) return;
        
        if (editingAlert) {
            const updated: SystemAlert = { ...editingAlert, ...alertFormData };
            updateSystemAlert(updated);
        } else {
            addSystemAlert(alertFormData);
        }
        setAlerts([...mockSystemAlerts]); // Refresh
        setAlertModalOpen(false);
    };

    const handleDismissAlert = (id: string) => {
        removeSystemAlert(id);
        setAlerts([...mockSystemAlerts]);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <header className="flex justify-between items-end border-b border-gray-700 pb-4">
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">Dashboard</h1>
                    <p className="mt-2 text-lg text-gray-400">Resumen operativo y herramientas de gestión.</p>
                </div>
                <button 
                    onClick={() => setSettingsModalOpen(true)}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white p-2 rounded-lg transition-colors border border-gray-600"
                    title="Configuración del Sistema"
                >
                    <Cog6ToothIcon className="h-6 w-6" />
                </button>
            </header>

            {/* System Alerts Section */}
            <section className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${processedAlerts.some(a => a.severity === 'critical') ? 'bg-red-400' : 'bg-green-400'}`}></span>
                          <span className={`relative inline-flex rounded-full h-3 w-3 ${processedAlerts.some(a => a.severity === 'critical') ? 'bg-red-500' : 'bg-green-500'}`}></span>
                        </span>
                        Avisos del Sistema
                    </h2>
                    
                    {/* Alert Toolbar */}
                    <div className="flex items-center gap-3 bg-gray-900/50 p-2 rounded-lg border border-gray-700 flex-wrap">
                        <div className="relative">
                            <SearchIcon className="absolute left-2 top-1.5 h-4 w-4 text-gray-500" />
                            <input 
                                type="text" 
                                placeholder="Buscar..." 
                                value={alertFilterText}
                                onChange={e => setAlertFilterText(e.target.value)}
                                className="pl-8 py-1 bg-gray-800 border-none rounded text-sm text-white w-32 focus:ring-1 focus:ring-sky-500"
                            />
                        </div>
                        <select 
                            value={alertFilterSeverity}
                            onChange={e => setAlertFilterSeverity(e.target.value as any)}
                            className="py-1 px-2 bg-gray-800 border-none rounded text-sm text-gray-300 focus:ring-1 focus:ring-sky-500"
                        >
                            <option value="all">Todas</option>
                            <option value="info">Info</option>
                            <option value="warning">Aviso</option>
                            <option value="critical">Crítico</option>
                        </select>
                        <div className="h-6 w-px bg-gray-700 mx-1"></div>
                        
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-400 whitespace-nowrap">Vence antes de:</label>
                            <input 
                                type="date"
                                value={filterDate}
                                onChange={e => setFilterDate(e.target.value)}
                                className="py-1 px-2 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:ring-1 focus:ring-sky-500"
                            />
                            {filterDate && (
                                <button onClick={() => setFilterDate('')} className="text-xs text-sky-400 hover:text-sky-300 hover:underline">
                                    (Reset 7 días)
                                </button>
                            )}
                        </div>

                        <button onClick={handleOpenAdd} className="ml-2 text-sky-400 hover:text-sky-300 text-sm font-bold hover:underline px-2">+ Nuevo</button>
                    </div>
                </div>
                
                {processedAlerts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-900/30 rounded-lg border border-dashed border-gray-700">
                        <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500/30 mb-3"/>
                        <p className="text-lg font-medium text-gray-400">Sin avisos pendientes.</p>
                        <p className="text-sm">No hay alertas {filterDate ? `para antes del ${filterDate}` : 'para los próximos 7 días'} que coincidan con los filtros.</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {processedAlerts.map(alert => (
                            <AlertItem key={alert.id} alert={alert} onDismiss={handleDismissAlert} onEdit={handleOpenEdit} />
                        ))}
                    </div>
                )}
            </section>

            {/* AI Analysis Section */}
            <section className="border-t border-gray-700 pt-6">
                <button onClick={() => setShowAnalysis(!showAnalysis)} className="flex items-center justify-between w-full text-left mb-4 group">
                    <h2 className="text-xl font-semibold text-gray-300 group-hover:text-white transition-colors">Análisis de Estructura (IA)</h2>
                    {showAnalysis ? <ChevronUpIcon className="h-6 w-6 text-gray-500"/> : <ChevronDownIcon className="h-6 w-6 text-gray-500"/>}
                </button>
                {showAnalysis && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                        {isLoadingAnalysis ? (
                            <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-400 mr-3"></div><span className="text-gray-400">Cargando...</span></div>
                        ) : analysis ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 col-span-1 md:col-span-2">
                                    <h3 className="text-lg font-bold mb-4 text-sky-400">{analysis.summary.title}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {analysis.summary.blocks.map(block => (
                                            <div key={block.name} className="bg-gray-900/50 p-4 rounded-md">
                                                <h4 className="font-bold text-gray-200">{block.name}</h4>
                                                <p className="text-xs text-gray-400 mt-1">{block.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
                                    <h3 className="text-lg font-bold mb-4 text-white flex items-center"><LightBulbIcon className="h-5 w-5 mr-2 text-yellow-300"/>{analysis.suggestions.title}</h3>
                                    <ul className="space-y-2 list-disc list-inside text-sm text-gray-300">{analysis.suggestions.points.map((point, i) => <li key={i}>{point}</li>)}</ul>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </section>

            {/* Alert Modal */}
            {isAlertModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-white mb-4">{editingAlert ? 'Editar Aviso' : 'Crear Nuevo Aviso'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Título</label>
                                <input type="text" value={alertFormData.title} onChange={e => setAlertFormData({...alertFormData, title: e.target.value})} className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Mensaje</label>
                                <textarea value={alertFormData.message} onChange={e => setAlertFormData({...alertFormData, message: e.target.value})} rows={3} className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300">Severidad</label>
                                    <select value={alertFormData.severity} onChange={e => setAlertFormData({...alertFormData, severity: e.target.value as any})} className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white">
                                        <option value="info">Información</option>
                                        <option value="warning">Advertencia</option>
                                        <option value="critical">Crítico</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300">Fecha Vencimiento</label>
                                    <input type="date" value={alertFormData.dueDate} onChange={e => setAlertFormData({...alertFormData, dueDate: e.target.value})} className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setAlertModalOpen(false)} className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors">Cancelar</button>
                            <button onClick={handleSaveAlert} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md font-bold shadow-md transition-colors">{editingAlert ? 'Guardar Cambios' : 'Crear Aviso'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
        </div>
    );
};
