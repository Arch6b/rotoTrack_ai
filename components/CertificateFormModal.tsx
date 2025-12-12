
import React, { useState, useEffect } from 'react';
import type { Certificate, Fleet } from '../types';
import { XMarkIcon, CheckCircleIcon } from './Icons';

interface CertificateFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (cert: Certificate) => void;
    initialData: Certificate | null;
    mode: 'add' | 'edit';
    fleets: Fleet[];
}

const emptyCertificate: Omit<Certificate, 'lastModifiedBy' | 'lastModifiedDate'> = {
    id: '',
    type: 'TC',
    holder: '',
    tcds: '',
    applicableFleetIds: [],
    revision: '',
    revisionDate: '',
    lastWebCheckDate: '',
    notes: '',
    officialLink: '',
    internalLink: '',
    status: 'Active',
};

export const CertificateFormModal: React.FC<CertificateFormModalProps> = ({ isOpen, onClose, onSave, initialData, mode, fleets }) => {
    const [cert, setCert] = useState<Omit<Certificate, 'lastModifiedBy' | 'lastModifiedDate'>>(emptyCertificate);
    const [errors, setErrors] = useState<Partial<Record<keyof Certificate, string>>>({});

    useEffect(() => {
        if (isOpen) {
            setCert(initialData || emptyCertificate);
            setErrors({});
        }
    }, [initialData, isOpen]);

    const validate = () => {
        const newErrors: Partial<Record<keyof Certificate, string>> = {};
        if (!cert.type) newErrors.type = 'El tipo es obligatorio.';
        if (!cert.holder) newErrors.holder = 'El titular es obligatorio.';
        if (!cert.tcds) newErrors.tcds = 'La referencia TCDS es obligatoria.';
        if (!cert.revision) newErrors.revision = 'La revisión es obligatoria.';
        if (!cert.revisionDate) newErrors.revisionDate = 'La fecha de revisión es obligatoria.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            onSave(cert as Certificate);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCert(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof Certificate]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleFleetToggle = (fleetId: string) => {
        setCert(prev => {
            const currentFleets = prev.applicableFleetIds;
            if (currentFleets.includes(fleetId)) {
                return { ...prev, applicableFleetIds: currentFleets.filter(id => id !== fleetId) };
            } else {
                return { ...prev, applicableFleetIds: [...currentFleets, fleetId] };
            }
        });
    };

    if (!isOpen) return null;

    const title = mode === 'add' ? 'Añadir Nuevo Certificado' : `Editando: ${initialData?.tcds}`;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                </header>

                <main className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                     {/* Column 1 */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-2">Detalles Generales</h3>
                        
                         <div>
                            <label htmlFor="type" className="block font-medium text-gray-300">Tipo</label>
                            <select id="type" name="type" value={cert.type} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white">
                                <option value="TC">TC (Type Certificate)</option>
                                <option value="STC">STC (Supplemental Type Certificate)</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="tcds" className="block font-medium text-gray-300">Referencia (TCDS)</label>
                            <input type="text" name="tcds" id="tcds" value={cert.tcds} onChange={handleChange} className={`mt-1 block w-full rounded-md bg-gray-700 text-white ${errors.tcds ? 'border-red-500 ring-red-500' : 'border-transparent focus:border-sky-500 focus:ring-sky-500'}`}/>
                            {errors.tcds && <p className="text-red-400 text-xs mt-1">{errors.tcds}</p>}
                        </div>
                        <div>
                            <label htmlFor="holder" className="block font-medium text-gray-300">Titular (Holder)</label>
                            <input type="text" name="holder" id="holder" value={cert.holder} onChange={handleChange} className={`mt-1 block w-full rounded-md bg-gray-700 text-white ${errors.holder ? 'border-red-500 ring-red-500' : 'border-transparent focus:border-sky-500 focus:ring-sky-500'}`}/>
                            {errors.holder && <p className="text-red-400 text-xs mt-1">{errors.holder}</p>}
                        </div>
                        
                        <div>
                            <label htmlFor="status" className="block font-medium text-gray-300">Estado</label>
                            <select id="status" name="status" value={cert.status} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 border-transparent focus:border-sky-500 focus:ring-sky-500 text-white">
                                <option value="Active">Activo</option>
                                <option value="Inactive">Inactiva</option>
                            </select>
                        </div>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-2">Control de Revisiones</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="revision" className="block font-medium text-gray-300">Nº Revisión</label>
                                <input type="text" name="revision" id="revision" value={cert.revision} onChange={handleChange} className={`mt-1 block w-full rounded-md bg-gray-700 text-white ${errors.revision ? 'border-red-500 ring-red-500' : 'border-transparent focus:border-sky-500 focus:ring-sky-500'}`}/>
                                {errors.revision && <p className="text-red-400 text-xs mt-1">{errors.revision}</p>}
                            </div>
                             <div>
                                <label htmlFor="revisionDate" className="block font-medium text-gray-300">Fecha Revisión</label>
                                <input type="date" name="revisionDate" id="revisionDate" value={cert.revisionDate} onChange={handleChange} className={`mt-1 block w-full rounded-md bg-gray-700 text-white ${errors.revisionDate ? 'border-red-500 ring-red-500' : 'border-transparent focus:border-sky-500 focus:ring-sky-500'}`}/>
                                {errors.revisionDate && <p className="text-red-400 text-xs mt-1">{errors.revisionDate}</p>}
                            </div>
                        </div>
                         <div>
                            <label htmlFor="lastWebCheckDate" className="block font-medium text-gray-300">Última Comprobación Web</label>
                            <input type="date" name="lastWebCheckDate" id="lastWebCheckDate" value={cert.lastWebCheckDate || ''} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500 focus:ring-sky-500"/>
                        </div>
                        
                         <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-2 pt-2">Enlaces</h3>
                         <div>
                            <label htmlFor="officialLink" className="block font-medium text-gray-300">Enlace Oficial</label>
                            <input type="url" name="officialLink" id="officialLink" value={cert.officialLink || ''} onChange={handleChange} placeholder="https://..." className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500 focus:ring-sky-500"/>
                        </div>
                        <div>
                            <label htmlFor="internalLink" className="block font-medium text-gray-300">Enlace Interno</label>
                            <input type="text" name="internalLink" id="internalLink" value={cert.internalLink || ''} onChange={handleChange} placeholder="/path/to/doc" className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500 focus:ring-sky-500"/>
                        </div>
                    </div>

                    {/* Full Width */}
                    <div className="md:col-span-2 space-y-4">
                         <h3 className="text-lg font-semibold text-sky-400 border-b border-gray-600 pb-2">Aplicabilidad</h3>
                         <div>
                            <label className="block font-medium text-gray-300 mb-2">Flotas Aplicables</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 border border-gray-600 rounded-md max-h-32 overflow-y-auto">
                                {fleets.map(fleet => (
                                    <label key={fleet.id} className="flex items-center space-x-3 cursor-pointer p-1 rounded hover:bg-gray-700/50">
                                        <input 
                                            type="checkbox" 
                                            checked={cert.applicableFleetIds.includes(fleet.id)} 
                                            onChange={() => handleFleetToggle(fleet.id)}
                                            className="h-4 w-4 rounded border-gray-500 bg-gray-600 text-sky-500 focus:ring-sky-600"
                                        />
                                        <span className="text-gray-200">{fleet.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="notes" className="block font-medium text-gray-300">Notas</label>
                            <textarea name="notes" id="notes" value={cert.notes} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-transparent focus:border-sky-500 focus:ring-sky-500"/>
                        </div>
                    </div>
                </main>

                <footer className="flex justify-end p-4 border-t border-gray-700 flex-shrink-0">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors mr-3">Cancelar</button>
                    <button onClick={handleSave} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5"/> Guardar Certificado
                    </button>
                </footer>
            </div>
        </div>
    );
};
