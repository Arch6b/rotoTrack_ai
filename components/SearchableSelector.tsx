import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SearchIcon } from './Icons';

interface SearchableSelectorProps<T> {
    items: T[];
    selectedIds: string[];
    onSelectionChange: (selectedIds: string[]) => void;
    renderItem: (item: T, isSelected: boolean) => React.ReactNode;
    placeholder: string;
    maxSelections?: number;
    itemIdentifier: keyof T;
}

export const SearchableSelector = <T extends { [key: string]: any }>({
    items,
    selectedIds,
    onSelectionChange,
    renderItem,
    placeholder,
    maxSelections = 1,
    itemIdentifier
}: SearchableSelectorProps<T>) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setFocusedIndex(-1);
    }, [searchTerm]);

    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;
        const lowercasedFilter = searchTerm.toLowerCase();
        return items.filter(item => 
            Object.values(item).some(value => 
                String(value).toLowerCase().includes(lowercasedFilter)
            )
        );
    }, [items, searchTerm]);

    const handleItemClick = (itemId: string) => {
        let newSelectedIds: string[];
        
        if (maxSelections === 1) {
            newSelectedIds = selectedIds[0] === itemId ? [] : [itemId];
        } else {
            if (selectedIds.includes(itemId)) {
                newSelectedIds = selectedIds.filter(id => id !== itemId);
            } else if (selectedIds.length < maxSelections) {
                newSelectedIds = [...selectedIds, itemId];
            } else {
                newSelectedIds = selectedIds; // Limit reached, do nothing
            }
        }

        onSelectionChange(newSelectedIds);

        if (maxSelections === 1) {
            setSearchTerm('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const newIndex = Math.min(focusedIndex + 1, filteredItems.length - 1);
            setFocusedIndex(newIndex);
            listRef.current?.children[newIndex]?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const newIndex = Math.max(focusedIndex - 1, 0);
            setFocusedIndex(newIndex);
            listRef.current?.children[newIndex]?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter' && focusedIndex > -1) {
            e.preventDefault();
            const item = filteredItems[focusedIndex];
            if (item) {
                handleItemClick(item[itemIdentifier]);
            }
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="relative mb-2 flex-shrink-0">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full rounded-md border-0 bg-gray-700 py-1.5 pl-10 pr-3 text-gray-200 ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-sky-500"
                />
            </div>
            <div ref={listRef} className="space-y-2 overflow-y-auto pr-2 flex-grow border border-gray-700 rounded-md p-2">
                {filteredItems.map((item, index) => {
                    const itemId = item[itemIdentifier];
                    const isSelected = selectedIds.includes(itemId);
                    const isFocused = index === focusedIndex;
                    
                    return (
                        <div
                            key={itemId}
                            onMouseEnter={() => setFocusedIndex(index)}
                            onClick={() => handleItemClick(itemId)}
                            className={`p-3 rounded-lg transition-colors cursor-pointer flex items-start gap-4 ${
                                isSelected ? 'bg-gray-700/80 border-l-4 border-sky-500' : 'bg-gray-800/60 hover:bg-gray-700/90'
                            } ${isFocused ? 'bg-sky-900/50 ring-2 ring-sky-500' : ''}`}
                        >
                            {maxSelections > 1 && (
                                 <input 
                                    type="checkbox" 
                                    checked={isSelected} 
                                    onChange={() => {}} // State handled by parent div's onClick
                                    className="mt-1 h-4 w-4 rounded border-gray-500 bg-gray-600 text-sky-500 focus:ring-sky-600 cursor-pointer"
                                />
                            )}
                            {renderItem(item, isSelected)}
                        </div>
                    );
                })}
                 {filteredItems.length === 0 && <p className="text-center text-sm text-gray-500 py-4">No se encontraron resultados.</p>}
            </div>
        </div>
    );
};