import { useState, useMemo } from 'react';

export interface SortConfig<T extends string> {
    key: T;
    direction: 'ascending' | 'descending';
}

export function useSortableTable<T, K extends keyof T & string>(
    items: T[],
    initialSortKey?: K
) {
    const [sortConfig, setSortConfig] = useState<SortConfig<K> | null>(
        initialSortKey ? { key: initialSortKey, direction: 'ascending' } : null
    );

    const sortedItems = useMemo(() => {
        if (!sortConfig) return items;

        const sorted = [...items].sort((a, b) => {
            const aVal = a[sortConfig.key] || '';
            const bVal = b[sortConfig.key] || '';

            if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [items, sortConfig]);

    const requestSort = (key: K) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return { sortedItems, sortConfig, requestSort };
}