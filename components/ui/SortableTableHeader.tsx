import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '../Icons';
import type { SortConfig } from '../../hooks/useSortableTable';

interface SortableTableHeaderProps<T extends string> {
    sortKey?: T;
    label: string;
    sortConfig: SortConfig<T> | null;
    onSort: (key: T) => void;
    filterValue?: string;
    onFilterChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function SortableTableHeader<T extends string>({
    sortKey,
    label,
    sortConfig,
    onSort,
    filterValue,
    onFilterChange,
    placeholder = "Filtrar...",
    className = "px-4 py-3 align-top"
}: SortableTableHeaderProps<T>) {
    const isSorted = sortKey && sortConfig?.key === sortKey;
    const showFilter = filterValue !== undefined && onFilterChange;

    const indicator = isSorted
        ? (sortConfig?.direction === 'ascending'
            ? <ChevronUpIcon className="h-4 w-4 ml-1" />
            : <ChevronDownIcon className="h-4 w-4 ml-1" />)
        : (sortKey ? <ChevronUpIcon className="h-4 w-4 ml-1 text-gray-500" /> : null);

    return (
        <th scope="col" className={className}>
            <div className="flex flex-col gap-2">
                <div className="flex items-center">
                    {sortKey ? (
                        <button
                            onClick={() => onSort(sortKey)}
                            className="flex items-center group focus:outline-none font-bold text-xs uppercase tracking-wider text-gray-300 hover:text-white"
                        >
                            {label}
                            <span className={isSorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}>
                                {indicator}
                            </span>
                        </button>
                    ) : (
                        <span className="font-bold text-xs uppercase tracking-wider text-gray-300">
                            {label}
                        </span>
                    )}
                </div>
                {showFilter && (
                    <div className="relative">
                        <input
                            type="text"
                            value={filterValue}
                            onChange={(e) => onFilterChange(e.target.value)}
                            placeholder={placeholder}
                            className="w-full bg-gray-800 text-xs text-white border border-gray-600 rounded px-2 py-1 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 placeholder-gray-500"
                            onClick={(e) => e.stopPropagation()}
                        />
                        {filterValue && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFilterChange('');
                                }}
                                className="absolute right-1 top-1 text-gray-500 hover:text-white"
                            >
                                &times;
                            </button>
                        )}
                    </div>
                )}
            </div>
        </th>
    );
}

export function SimpleSortableHeader<T extends string>({
    sortKey,
    label,
    sortConfig,
    onSort,
    className = "px-6 py-3"
}: Pick<SortableTableHeaderProps<T>, 'sortKey' | 'label' | 'sortConfig' | 'onSort' | 'className'>) {
    const isSorted = sortConfig?.key === sortKey;
    const indicator = isSorted
        ? (sortConfig?.direction === 'ascending'
            ? <ChevronUpIcon className="h-4 w-4 ml-1" />
            : <ChevronDownIcon className="h-4 w-4 ml-1" />)
        : <ChevronUpIcon className="h-4 w-4 ml-1 text-gray-500" />;

    return (
        <th scope="col" className={className}>
            <button
                onClick={() => onSort(sortKey)}
                className="flex items-center group focus:outline-none"
            >
                {label}
                <span className={isSorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}>
                    {indicator}
                </span>
            </button>
        </th>
    );
}
