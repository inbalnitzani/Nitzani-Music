import React from 'react';
import AsyncSelect from 'react-select/async';
import type { MultiValue } from 'react-select';
import type { SongFilters } from '../types/song';
import { supabase } from '../supabaseClient';

interface SongFiltersProps {
    filters: SongFilters;
    onFilterChange: (filters: SongFilters) => void;
}

interface SelectOption {
    value: string;
    label: string;
}

const SongFiltersComponent: React.FC<SongFiltersProps> = ({
    filters = {},
    onFilterChange,
}) => {
    const [selectedAuthorOptions, setSelectedAuthorOptions] = React.useState<SelectOption[]>([]);
    const [selectedKeywordOptions, setSelectedKeywordOptions] = React.useState<SelectOption[]>([]);
    // const [selectedGenreOptions, setSelectedGenreOptions] = React.useState<SelectOption[]>([]);

    const handleAuthorChange = (selected: MultiValue<SelectOption>) => {
        setSelectedAuthorOptions(selected as SelectOption[]);
        onFilterChange({ ...filters, authors: selected.map(opt => opt.label) });
    };
    const handleKeywordChange = (selected: MultiValue<SelectOption>) => {
        setSelectedKeywordOptions(selected as SelectOption[]);
        onFilterChange({ ...filters, keywords: selected.map(opt => opt.label) });
    };
    const handleSearchChange = (search: string) => {
        onFilterChange({ ...filters, searchText: search })
    }
    const handleClearFilters = () => {
        onFilterChange({})
    }
    
    // Async load options for artist search
    const loadArtistOptions = async (inputValue: string) => {
        if (!inputValue) return [];
        const { data, error } = await supabase
            .from('artists')
            .select('id, name')
            .ilike('name', `%${inputValue}%`)
            .order('name')
            .limit(20);
        if (error) return [];
        return (data || []).map((a: { id: string; name: string }) => ({ value: a.id, label: a.name }));
    };

    const handleArtistChange = (selectedOptions: MultiValue<SelectOption>) => {
        onFilterChange({
            ...filters,
            artists: selectedOptions.map((option: SelectOption) => option.label)
        });
    };

    const loadAuthorOptions = async (inputValue: string) => {
        if (!inputValue) return [];
        const { data, error } = await supabase
            .from('authors')
            .select('id, name')
            .ilike('name', `%${inputValue}%`)
            .order('name')
            .limit(20);
        if (error) return [];
        return (data || []).map((a: { id: string; name: string }) => ({ value: a.id, label: a.name }));
    };

    const loadKeywordOptions = async (inputValue: string) => {
        if (!inputValue) return [];
        const { data, error } = await supabase
            .from('keywords')
            .select('id, name')
            .ilike('name', `%${inputValue}%`)
            .order('name')
            .limit(20);
        if (error) return [];
        return (data || []).map((k: { id: string; name: string }) => ({ value: k.id, label: k.name }));
    };

    // const loadGenreOptions = async (inputValue: string) => {
    //     if (!inputValue) return [];
    //     const { data, error } = await supabase
    //         .from('genres')
    //         .select('id, name')
    //         .ilike('name', `%${inputValue}%`)
    //         .order('name')
    //         .limit(20);
    //     if (error) return [];
    //     return (data || []).map((g: { id: string; name: string }) => ({ value: g.id, label: g.name }));
    // };

    // const handleGenreChange = (selected: MultiValue<SelectOption>) => {
    //     setSelectedGenreOptions(selected as SelectOption[]);
    //     onFilterChange({ ...filters, genres: selected.map(opt => opt.label) });
    // };

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
                    <AsyncSelect
                        isMulti
                        cacheOptions
                        defaultOptions={false}
                        loadOptions={loadAuthorOptions}
                        value={selectedAuthorOptions}
                        onChange={handleAuthorChange}
                        placeholder="Search and select authors..."
                    />
                </div>

                {/* Artists */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Artists
                    </label>
                    <AsyncSelect
                        isMulti
                        cacheOptions
                        defaultOptions={false}
                        loadOptions={loadArtistOptions}
                        value={filters?.artists?.map(a => ({ value: a, label: a })) || []}
                        onChange={handleArtistChange}
                        placeholder="Search and select artists..."
                    />
                </div>

                {/* Keywords */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Keywords
                    </label>
                    <AsyncSelect
                        isMulti
                        cacheOptions
                        defaultOptions={false}
                        loadOptions={loadKeywordOptions}
                        value={selectedKeywordOptions}
                        onChange={handleKeywordChange}
                        placeholder="Search and select keywords..."
                        classNamePrefix="tagselect"

                        
                    />
                </div>

                {/* Genres */}
                {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Genres
                    </label>
                    <AsyncSelect
                        isMulti
                        cacheOptions
                        defaultOptions={false}
                        loadOptions={loadGenreOptions}
                        value={selectedGenreOptions}
                        onChange={handleGenreChange}
                        placeholder="Search and select genres..."
                    />
                </div> */}
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
