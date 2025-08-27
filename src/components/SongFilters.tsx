import React from 'react';
import type { SongFilters } from '../types/song.ts';
import { supabase } from '../supabaseClient.ts';
import { useTranslation } from 'react-i18next';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

interface SongFiltersProps {
    filters: SongFilters;
    onFilterChange: (filters: SongFilters) => void;
}

const SongFiltersComponent: React.FC<SongFiltersProps> = ({
    filters = {},
    onFilterChange,
}) => {
    const { t } = useTranslation();

    // Artists Autocomplete state
    type Artist = { id: string; name: string };
    const [artistOptions, setArtistOptions] = React.useState<Artist[]>([]);
    const [artistLoading, setArtistLoading] = React.useState(false);
    const artistDebounceRef = React.useRef<number | null>(null);

    const fetchTopArtists = React.useCallback(async () => {
        setArtistLoading(true);
        const { data, error } = await supabase
            .from('artists')
            .select('id, name')
            .order('name')
            .limit(20);
        if (!error) setArtistOptions((data as Artist[]) || []);
        setArtistLoading(false);
    }, []);

    // Authors Autocomplete state
    type Author = { id: string; name: string };
    const [authorOptions, setAuthorOptions] = React.useState<Author[]>([]);
    const [authorLoading, setAuthorLoading] = React.useState(false);
    const authorDebounceRef = React.useRef<number | null>(null);

    const fetchTopAuthors = React.useCallback(async () => {
        setAuthorLoading(true);
        const { data, error } = await supabase
            .from('authors')
            .select('id, name')
            .order('name')
            .limit(20);
        if (!error) setAuthorOptions((data as Author[]) || []);
        setAuthorLoading(false);
    }, []);

    // Keywords Autocomplete state
    type Keyword = { id: string; name: string };
    const [keywordOptions, setKeywordOptions] = React.useState<Keyword[]>([]);
    const [keywordLoading, setKeywordLoading] = React.useState(false);
    const keywordDebounceRef = React.useRef<number | null>(null);

    const fetchTopKeywords = React.useCallback(async () => {
        setKeywordLoading(true);
        const { data, error } = await supabase
            .from('keywords')
            .select('id, name')
            .order('name')
            .limit(20);
        if (!error) setKeywordOptions((data as Keyword[]) || []);
        setKeywordLoading(false);
    }, []);

    const handleSearchChange = (search: string) => {
        onFilterChange({ ...filters, searchText: search })
    }

    const handleClearFilters = () => {
        onFilterChange({})
    }

    // Loaders for Autocomplete are defined inline in onInputChange

    return (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className='pt-4'>
                    <TextField
                        fullWidth
                        variant="standard"
                        placeholder={t('filters.search_placeholder')}
                        value={filters?.searchText || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
                    />
                </div>

                {/* Authors */}
                <div >
                    <Autocomplete
                        multiple
                        freeSolo
                        id="authors-autocomplete"
                        options={authorOptions}
                        loading={authorLoading}
                        value={filters?.authors?.map((n: string) => ({ id: '', name: n })) || []}
                        onChange={(_e, newValue) => {
                            onFilterChange({
                                ...filters,
                                authors: newValue.map(v => (typeof v === 'string' ? v : v.name))
                            });
                        }}
                        onOpen={fetchTopAuthors}
                        onInputChange={(_e, newInputValue, reason) => {
                            if (reason !== 'input') return;
                            if (authorDebounceRef.current) globalThis.clearTimeout(authorDebounceRef.current);
                            authorDebounceRef.current = globalThis.setTimeout(async () => {
                                if (!newInputValue) {
                                    setAuthorOptions([]);
                                    return;
                                }
                                setAuthorLoading(true);
                                const { data, error } = await supabase
                                    .from('authors')
                                    .select('id, name')
                                    .ilike('name', `%${newInputValue}%`)
                                    .order('name')
                                    .limit(20);
                                if (!error) setAuthorOptions((data as { id: string; name: string }[]) || []);
                                setAuthorLoading(false);
                            }, 250);
                        }}
                        getOptionLabel={(opt: string | { id: string; name: string }) => (typeof opt === 'string' ? opt : opt.name)}
                        isOptionEqualToValue={(opt, val) =>
                            (typeof opt === 'string' ? opt : opt.name) === (typeof val === 'string' ? val : val.name)
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="standard"
                                label={t('filters.search_and_select_authors')}
                            />
                        )}
                    />
                </div>
                

                {/* Artists */}
                <div className="hidden sm:block">
                    <Autocomplete
                        multiple
                        freeSolo
                        id="artists-autocomplete"
                        options={artistOptions}
                        loading={artistLoading}
                        value={filters?.artists?.map((n: string) => ({ id: '', name: n })) || []}
                        onChange={(_e, newValue) => {
                            onFilterChange({
                                ...filters,
                                artists: newValue.map(v => (typeof v === 'string' ? v : v.name))
                            });
                        }}
                        onOpen={fetchTopArtists}
                        onInputChange={(_e, newInputValue, reason) => {
                            if (reason !== 'input') return;
                            if (artistDebounceRef.current) globalThis.clearTimeout(artistDebounceRef.current);
                            artistDebounceRef.current = globalThis.setTimeout(async () => {
                                if (!newInputValue) {
                                    setArtistOptions([]);
                                    return;
                                }
                                setArtistLoading(true);
                                const { data, error } = await supabase
                                    .from('artists')
                                    .select('id, name')
                                    .ilike('name', `%${newInputValue}%`)
                                    .order('name')
                                    .limit(20);
                                if (!error) setArtistOptions((data as { id: string; name: string }[]) || []);
                                setArtistLoading(false);
                            }, 250);
                        }}
                        getOptionLabel={(opt: string | { id: string; name: string }) => (typeof opt === 'string' ? opt : opt.name)}
                        isOptionEqualToValue={(opt, val) =>
                            (typeof opt === 'string' ? opt : opt.name) === (typeof val === 'string' ? val : val.name)
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="standard"
                                label={t('filters.search_and_select_artists')}
                                placeholder="Favorites"
                            />
                        )}
                    />
                </div>

                {/* Keywords */}
                <div className="hidden sm:block">
                    <Autocomplete
                        multiple
                        freeSolo
                        id="keywords-autocomplete"
                        options={keywordOptions}
                        loading={keywordLoading}
                        value={filters?.keywords?.map((n: string) => ({ id: '', name: n })) || []}
                        onChange={(_e, newValue) => {
                            onFilterChange({
                                ...filters,
                                keywords: newValue.map(v => (typeof v === 'string' ? v : v.name))
                            });
                        }}
                        onOpen={fetchTopKeywords}
                        onInputChange={(_e, newInputValue, reason) => {
                            if (reason !== 'input') return;
                            if (keywordDebounceRef.current) globalThis.clearTimeout(keywordDebounceRef.current);
                            keywordDebounceRef.current = globalThis.setTimeout(async () => {
                                if (!newInputValue) {
                                    setKeywordOptions([]);
                                    return;
                                }
                                setKeywordLoading(true);
                                const { data, error } = await supabase
                                    .from('keywords')
                                    .select('id, name')
                                    .ilike('name', `%${newInputValue}%`)
                                    .order('name')
                                    .limit(20);
                                if (!error) setKeywordOptions((data as { id: string; name: string }[]) || []);
                                setKeywordLoading(false);
                            }, 250);
                        }}
                        getOptionLabel={(opt: string | { id: string; name: string }) => (typeof opt === 'string' ? opt : opt.name)}
                        isOptionEqualToValue={(opt, val) =>
                            (typeof opt === 'string' ? opt : opt.name) === (typeof val === 'string' ? val : val.name)
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="standard"
                                label={t('filters.search_and_select_keywords')}
                            />
                        )}
                    />
                </div>
            </div>
            {/* Clear Filters Button */}
            <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    onClick={handleClearFilters}
                >
                    {t('filters.clear_filters')}
                </button>
            </div>
        </div>
    )
}

export default SongFiltersComponent;
