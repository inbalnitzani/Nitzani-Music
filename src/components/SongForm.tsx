import React, { useState, useEffect } from 'react';
import type { Song } from '../types/song';
import { supabase } from '../supabaseClient';
import AsyncSelect from 'react-select/async';
import type { MultiValue } from 'react-select';

type SongFormProps = {
    onClose: () => void;
    onSuccess: () => void;
    song?: Song & { song_artists?: { artist_id: string }[] };
};

type ArtistOption = { value: string; label: string };

const SongForm: React.FC<SongFormProps> = ({
    onClose,
    onSuccess,
    song
}) => {
    const isEditMode = !!song;
    const [formData, setFormData] = useState<Partial<Song>>({
        title: song?.title || '',
        keywords: song?.keywords || [],
        lyrics: song?.lyrics || '',
        authors: song?.authors || [],
        genres: song?.genres || [],
        year: song?.year || undefined,
        link: song?.link || '',
        is_free: song?.is_free || false,
        score: song?.score || 0
    });
    const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>([]);
    const [selectedArtistOptions, setSelectedArtistOptions] = useState<ArtistOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Set selected artists for edit mode
    useEffect(() => {
        if (isEditMode && song?.song_artists) {
            const ids = song.song_artists.map(sa => sa.artist_id);
            setSelectedArtistIds(ids);
            // Preload selected artist options for display
            if (ids.length > 0) {
                (async () => {
                    const { data } = await supabase
                        .from('artists')
                        .select('id, name')
                        .in('id', ids);
                    setSelectedArtistOptions(
                        (data || []).map((a: { id: string; name: string }) => ({ value: a.id, label: a.name }))
                    );
                })();
            }
        }
    }, [isEditMode, song?.id, song?.song_artists]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const prepareArray = (value: string | string[] | undefined) =>
                typeof value === 'string'
                    ? value.split(',').map(s => s.trim()).filter(Boolean)
                    : Array.isArray(value)
                        ? value
                        : [];

            const formDataToSend = {
                ...formData,
                keywords: prepareArray(formData.keywords),
                authors: prepareArray(formData.authors),
                genres: prepareArray(formData.genres),
            };

            let songId: string;

            if (isEditMode) {
                const { data, error: updateError } = await supabase
                    .from('songs')
                    .update(formDataToSend)
                    .eq('id', song?.id)
                    .select('id')
                    .single();
                if (updateError)
                    throw new Error('Failed to update song');
                songId = data.id;
            } else {
                const { data, error: insertError } = await supabase
                    .from('songs')
                    .insert(formDataToSend)
                    .select('id')
                    .single();
                if (insertError)
                    throw new Error('Failed to create song');
                songId = data.id;
            }

            // Handle artists through song_artists table
            await handleSongArtists(songId, selectedArtistIds);

            updateFiltersOptions(formDataToSend.authors, selectedArtistIds, formDataToSend.keywords);
            onSuccess();
            onClose();
        } catch (err) {
            setError(isEditMode ? 'Failed to update song' : 'Failed to create song');
            console.error('Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSongArtists = async (songId: string, artistIds: string[]) => {
        try {
            // Delete existing artist associations
            await supabase
                .from('song_artists')
                .delete()
                .eq('song_id', songId);

            // Insert new artist associations
            if (artistIds.length > 0) {
                const songArtistsData = artistIds.map((artistId, idx) => ({
                    song_id: songId,
                    artist_id: artistId,
                    position: idx
                }));
                await supabase
                    .from('song_artists')
                    .insert(songArtistsData);
            }
        } catch (error) {
            console.error('Error handling song artists:', error);
            throw error;
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleArtistsChange = (selected: MultiValue<ArtistOption>) => {
        const options = (selected as ArtistOption[]).filter(Boolean);
        setSelectedArtistIds(options.map(opt => opt.value));
        setSelectedArtistOptions(options);
    };

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

    const handleDelete = async () => {
        if (!isEditMode) return;
        setIsDeleting(true);
        setError(null);
        try {
            // Delete song_artists associations first
            await supabase
                .from('song_artists')
                .delete()
                .eq('song_id', song?.id);

            // Delete the song
            const { error: deleteError } = await supabase
                .from('songs')
                .delete()
                .eq('id', song?.id);

            if (deleteError) throw new Error('Failed to delete song');
            onSuccess();
            onClose();
        } catch (err) {
            setError('Failed to delete song');
            console.error('Error:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    // update filters options
    const updateFiltersOptions = async (authors: string[], artistIds: string[], keywords: string[]) => {
        try {
            await Promise.all([
                supabase.from('authors').upsert(authors.map(name => ({ name })), { onConflict: 'name' }),
                supabase.from('keywords').upsert(keywords.map(name => ({ name })), { onConflict: 'name' })
            ]);
        } catch (err) {
            setError('Failed to update filters options');
            console.error('Error:', err);
        }
    };

    return (
        <div className="max-w-lg mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-3 bg-red-50 text-red-500 rounded-md text-sm">
                        {error}
                    </div>
                )}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3 leading-normal"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Artists
                        </label>
                        <AsyncSelect
                            isMulti
                            cacheOptions
                            defaultOptions={false}
                            loadOptions={loadArtistOptions}
                            value={selectedArtistOptions}
                            onChange={handleArtistsChange}
                            className="mt-1"
                            placeholder="Search and select artists..."
                        />
                    </div>
                    <div>
                        <label htmlFor="keywords" className="block text-sm font-medium text-gray-700">
                            Keywords
                        </label>
                        <input
                            type="text"
                            id="keywords"
                            name="keywords"
                            value={formData.keywords || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3 leading-normal"
                        />
                    </div>
                    <div>
                        <label htmlFor="genres" className="block text-sm font-medium text-gray-700">
                            Genres
                        </label>
                        <input
                            type="text"
                            id="genres"
                            name="genres"
                            value={formData.genres || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3 leading-normal"
                        />
                    </div>
                    <div>
                        <label htmlFor="authors" className="block text-sm font-medium text-gray-700">
                            Authors
                        </label>
                        <input
                            type="text"
                            id="authors"
                            name="authors"
                            value={formData.authors || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3 leading-normal"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="lyrics" className="block text-sm font-medium text-gray-700">
                        Lyrics
                    </label>
                    <textarea
                        id="lyrics"
                        name="lyrics"
                        value={formData.lyrics || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3 leading-normal"
                    />
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                            Year
                        </label>
                        <input
                            type="number"
                            id="year"
                            name="year"
                            value={formData.year || ''}
                            onChange={handleChange}
                            min="1900"
                            max="2030"
                            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3 leading-normal"
                        />
                    </div>
                    <div>
                        <label htmlFor="link" className="block text-sm font-medium text-gray-700">
                            Link
                        </label>
                        <input
                            type="url"
                            id="link"
                            name="link"
                            value={formData.link || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3 leading-normal"
                        />
                    </div>
                </div>
                <div className="flex justify-between items-center pt-4">
                    {isEditMode && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Song'}
                        </button>
                    )}
                    <div className={`flex gap-3 ${!isEditMode ? 'ml-auto' : ''}`}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Song')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SongForm;