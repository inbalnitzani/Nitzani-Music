import React, { useState, useEffect } from 'react';
import type { Song } from '../types/song';
import { supabase } from '../supabaseClient';
import AsyncSelect from 'react-select/async';
import type { MultiValue } from 'react-select';
import { useTranslation } from 'react-i18next';
type SongFormProps = {
  onClose: () => void;
  onSuccess: () => void;
  song?: Song & { song_artists?: { artist_id: string }[], song_authors?: { author_id: string }[], song_keywords?: { keyword_id: string }[], song_genres?: { genre_id: string }[] };
};

type ArtistOption = { value: string; label: string };

const SongForm: React.FC<SongFormProps> = ({
  onClose,
  onSuccess,
  song
}) => {
  const { t } = useTranslation();
  const isEditMode = !!song;
  const [formData, setFormData] = useState<Partial<Song>>({
    title: song?.title || '',
    lyrics: song?.lyrics || '',
    year: song?.year || undefined,
    link: song?.link || '',
    is_free: song?.is_free || false,
    score: song?.score || 0
  });
  const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>([]);
  const [selectedArtistOptions, setSelectedArtistOptions] = useState<ArtistOption[]>([]);
  const [selectedAuthorOptions, setSelectedAuthorOptions] = useState<ArtistOption[]>([]);
  const [selectedKeywordOptions, setSelectedKeywordOptions] = useState<ArtistOption[]>([]);
  const [selectedGenreOptions, setSelectedGenreOptions] = useState<ArtistOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (isEditMode && song?.song_authors) {
      const ids = song.song_authors.map(sa => sa.author_id);
      if (ids.length > 0) {
        (async () => {
          const { data } = await supabase.from('authors').select('id, name').in('id', ids);
          setSelectedAuthorOptions((data || []).map(a => ({ value: a.id, label: a.name })));
        })();
      }
    }
    if (isEditMode && song?.song_keywords) {
      const ids = song.song_keywords.map(sk => sk.keyword_id);
      if (ids.length > 0) {
        (async () => {
          const { data } = await supabase.from('keywords').select('id, name').in('id', ids);
          setSelectedKeywordOptions((data || []).map(k => ({ value: k.id, label: k.name })));
        })();
      }
    }
    if (isEditMode && song?.song_genres) {
      const ids = (song.song_genres as { genre_id: string }[]).map(sg => sg.genre_id);
      if (ids.length > 0) {
        (async () => {
          const { data } = await supabase.from('genres').select('id, name').in('id', ids);
          setSelectedGenreOptions((data || []).map(g => ({ value: g.id, label: g.name })));
        })();
      }
    }
  }, [isEditMode, song?.id, song?.song_artists, song?.song_authors, song?.song_keywords, song?.song_genres]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formDataToSend = formData;

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

      // Handle authors through song_authors table
      await supabase.from('song_authors').delete().eq('song_id', songId);
      if (selectedAuthorOptions.length > 0) {
        const songAuthorsData = selectedAuthorOptions.map((author, idx) => ({
          song_id: songId,
          author_id: author.value,
          position: idx
        }));
        await supabase.from('song_authors').insert(songAuthorsData);
      }

      // Handle keywords through song_keywords table
      await supabase.from('song_keywords').delete().eq('song_id', songId);
      if (selectedKeywordOptions.length > 0) {
        const songKeywordsData = selectedKeywordOptions.map((keyword) => ({
          song_id: songId,
          keyword_id: keyword.value
        }));
        await supabase.from('song_keywords').insert(songKeywordsData);
      }

      // Handle genres through song_genres table
      await supabase.from('song_genres').delete().eq('song_id', songId);
      if (selectedGenreOptions.length > 0) {
        const songGenresData = selectedGenreOptions.map((genre) => ({
          song_id: songId,
          genre_id: genre.value
        }));
        await supabase.from('song_genres').insert(songGenresData);
      }

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

  const loadAuthorOptions = async (inputValue: string) => {
    if (!inputValue) return [];
    const { data } = await supabase.from('authors').select('id, name').ilike('name', `%${inputValue}%`).order('name').limit(20);
    return (data || []).map(a => ({ value: a.id, label: a.name }));
  };

  const loadKeywordOptions = async (inputValue: string) => {
    if (!inputValue) return [];
    const { data } = await supabase.from('keywords').select('id, name').ilike('name', `%${inputValue}%`).order('name').limit(20);
    return (data || []).map(k => ({ value: k.id, label: k.name }));
  };

  const loadGenreOptions = async (inputValue: string) => {
    if (!inputValue) return [];
    const { data } = await supabase.from('genres').select('id, name').ilike('name', `%${inputValue}%`).order('name').limit(20);
    return (data || []).map(g => ({ value: g.id, label: g.name }));
  };

  const handleDelete = async () => {
    try {
      await supabase.from('songs').delete().eq('id', song?.id);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error deleting song:', error);
      setError('Failed to delete song');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-3 bg-red-50 text-red-500 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Title and Link */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">{t('song_form.title')}</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3 leading-normal"
            />
          </div>
          <div>
            <label htmlFor="link" className="block text-sm font-medium text-gray-700">{t('song_form.link')}</label>
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

        {/* Each select in its own row */}
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('song_form.artists')}</label>
          <AsyncSelect
            isMulti
            loadOptions={loadArtistOptions}
            value={selectedArtistOptions}
            onChange={handleArtistsChange}
            className="mt-1"
            classNamePrefix="tagselect"
            placeholder={t('song_form.search_and_select_artists')}
            
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('song_form.authors')}</label>
          <AsyncSelect
            isMulti
            loadOptions={loadAuthorOptions}
            value={selectedAuthorOptions}
            onChange={opts => setSelectedAuthorOptions(opts as ArtistOption[])}
            className="mt-1"
            classNamePrefix="tagselect"
            placeholder={t('song_form.search_and_select_authors')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('song_form.genres')}</label>
          <AsyncSelect
            isMulti
            loadOptions={loadGenreOptions}
            value={selectedGenreOptions}
            onChange={opts => setSelectedGenreOptions(opts as ArtistOption[])}
            className="mt-1"  
            classNamePrefix="tagselect"
            placeholder={t('song_form.search_and_select_genres')}
          />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">{t('song_form.keywords')}</label>
          <AsyncSelect
            isMulti
            loadOptions={loadKeywordOptions}
            value={selectedKeywordOptions}
            onChange={opts => setSelectedKeywordOptions(opts as ArtistOption[])}
            className="mt-1"
            classNamePrefix="tagselect"
            placeholder={t('song_form.search_and_select_keywords')}
          />
        </div>

        {/* Lyrics */}
        <div>
          <label htmlFor="lyrics" className="block text-sm font-medium text-gray-700">{t('song_form.lyrics')}</label>
          <textarea
            id="lyrics"
            name="lyrics"
            value={formData.lyrics || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3 leading-normal"
          />
        </div>

        {/* Year, Score, Free */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700">{t('song_form.year')}</label>
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
            <label htmlFor="score" className="block text-sm font-medium text-gray-700">{t('song_form.score')}</label>
            <input
              type="number"
              id="score"
              name="score"
              value={formData.score || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3 leading-normal"
            />
          </div>
          <div className="flex items-center mt-6">
            <input
              type="checkbox"
              id="is_free"
              name="is_free"
              checked={formData.is_free || false}
              onChange={e => setFormData({ ...formData, is_free: e.target.checked })}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="is_free" className="ml-2 text-sm font-medium text-gray-700">{t('song_form.free')}</label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-row-reverse justify-between items-center gap-4 pt-6">
          <div className="flex gap-2">
          <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('song_form.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (isEditMode ? t('song_form.saving') : t('song_form.creating')) : (isEditMode ? t('song_form.save_changes') : t('song_form.create_song'))}
            </button>

          </div>
          {isEditMode && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-md hover:bg-red-600"
              disabled={isLoading}
            >
              {isLoading ? t('song_form.deleting') : t('song_form.delete')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SongForm;