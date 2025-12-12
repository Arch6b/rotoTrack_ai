import type { ComponentAsset } from '../types';

export const conditionColorMap: { [key in ComponentAsset['condition']]: string } = {
    Serviceable: 'bg-green-900 text-green-300',
    Unserviceable: 'bg-red-900 text-red-300',
    Installed: 'bg-blue-900 text-blue-300',
    Scrapped: 'bg-gray-700 text-gray-500 line-through',
};

export const statusColorMap = {
    Active: 'bg-green-900 text-green-300',
    Inactive: 'bg-yellow-900 text-yellow-300',
    Draft: 'bg-gray-700 text-gray-300',
    Superseded: 'bg-orange-900 text-orange-300',
};

export const workOrderStatusColorMap = {
    Open: 'bg-blue-900 text-blue-300',
    'In Progress': 'bg-yellow-900 text-yellow-300',
    Completed: 'bg-green-900 text-green-300',
    Deferred: 'bg-gray-700 text-gray-300',
};

export const priorityColorMap = {
    Low: 'bg-gray-700 text-gray-300',
    Normal: 'bg-blue-900 text-blue-300',
    High: 'bg-orange-900 text-orange-300',
    Urgent: 'bg-red-900 text-red-300',
};

export const ampColors = [
    'bg-gray-700 text-gray-300',
    'bg-slate-700 text-slate-300',
    'bg-zinc-700 text-zinc-300',
    'bg-neutral-700 text-neutral-300'
];

const ampColorCache: Record<string, string> = {};
let ampColorIndex = 0;

export const getAmpColor = (ampId: string) => {
    if (!ampColorCache[ampId]) {
        ampColorCache[ampId] = ampColors[ampColorIndex % ampColors.length];
        ampColorIndex++;
    }
    return ampColorCache[ampId];
};

export const zIndex = {
    base: 0,
    dropdown: 10,
    sticky: 20,
    overlay: 30,
    modal: 40,
    popover: 50,
    toast: 60,
};
