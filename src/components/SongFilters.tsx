import React from 'react';
import Select from 'react-select';
import type { MultiValue } from 'react-select';
import type { SongFilters } from '../types/song';

interface SongFiltersProps {
    filters: SongFilters;
    onFilterChange: (filters: SongFilters) => void;
    authors: string[];
    keywords: string[];
    artists: string[];
}

interface SelectOption {
    value: string;
    label: string;
}

const SongFiltersComponent: React.FC<SongFiltersProps> = ({
    filters = {},
    onFilterChange,
    authors = [],
    keywords = [],
    artists = []
}) => {
    const handleAuthorChange = (selectedOptions: MultiValue<SelectOption>) => {
        onFilterChange({
            ...filters,
            authors: selectedOptions.map((option: SelectOption) => option.value)
        });
    };
    const handleKeywordChange = (selectedOptions: MultiValue<SelectOption>) => {
        onFilterChange({
            ...filters,
            keywords: selectedOptions.map((option: SelectOption) => option.value)
        });
    };
    const handleSearchChange = (search: string) => {
        onFilterChange({ ...filters, searchText: search })
    }
    const handleArtistChange = (selectedOptions: MultiValue<SelectOption>) => {
        onFilterChange({
            ...filters,
            artists: selectedOptions.map((option: SelectOption) => option.value)
        });
    };
    const handleClearFilters = () => {
        onFilterChange({})
    }
    

    return (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Search
                    </label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="Search by title or lyrics..."
                        value={filters?.searchText || ''}
                        onChange={e => handleSearchChange(e.target.value)}
                    />
                </div>

                {/* Authors */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Authors
                    </label>
                    <Select
                        isMulti
                        options={authors.map(a => ({ value: a, label: a }))}
                        value={filters?.authors?.map(a => ({ value: a, label: a })) || []}
                        onChange={handleAuthorChange}
                    />
                </div>

                {/* Artists */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Artists
                    </label>
                    <Select
                        isMulti
                        options={artists.map(a => ({ value: a, label: a }))}
                        value={filters?.artists?.map(a => ({ value: a, label: a })) || []}
                        onChange={handleArtistChange}
                    />
                </div>

                {/* Keywords */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Keywords
                    </label>
                    <Select
                        isMulti
                        options={keywords.map(a => ({ value: a, label: a }))}
                        value={filters?.keywords?.map(a => ({ value: a, label: a })) || []}
                        onChange={handleKeywordChange}
                    />
                </div>
            </div>
            {/* Clear Filters Button */}
            <div className="mt-4 flex justify-end">
                <button
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    onClick={handleClearFilters}
                >
                    Clear Filters
                </button>
            </div>
        </div>
    )
}

export default SongFiltersComponent;
