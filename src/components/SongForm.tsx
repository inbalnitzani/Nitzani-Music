import React, { useState } from 'react';
import type { Song } from '../types/song';
import { supabase } from '../supabaseClient';

type SongFormProps = {
    onClose: () => void;
    onSuccess: () => void;
    song?: Song
};

const SongForm: React.FC<SongFormProps> = ({
    onClose,
    onSuccess,
    song
    })=> {
        const isEditMode = !!song;
        const [formData, setFormData] = useState<Partial<Song>>({
            title: song?.title || '',
            artists: song?.artists || [],
            keywords: song?.keywords || [],
            lyrics: song?.lyrics || '',
            authors: song?.authors || [],
            genres: song?.genres || [],
            year: song?.year || undefined,
            link: song?.link || '',
            is_free: song?.is_free || false,
            score: song?.score || 0
        }
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAIGenerating, setIsAIGenerating] = useState(false);
  
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
                artists: prepareArray(formData.artists),
                keywords: prepareArray(formData.keywords),
                authors: prepareArray(formData.authors),
                genres: prepareArray(formData.genres),
            };

            if(isEditMode) {
                const {error: updateError} = await supabase
                .from('songs')
                .update(formDataToSend)
                .eq('id', song?.id);
            if(updateError) 
                throw new Error('Failed to update song');
        }else {
                const {error: insertError} = await supabase
                .from('songs')
                .insert(formDataToSend);
                if(insertError) 
                    throw new Error('Failed to create song');
            }
            updateFiltersOptions(formDataToSend.authors, formDataToSend.artists, formDataToSend.keywords);
                onSuccess();
                onClose();
            } catch (err) {
                setError(isEditMode ? 'Failed to update integration' : 'Failed to create integration')
                console.error('Error:', err)
            } finally {
                setIsLoading(false);
            }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setFormData({...formData, [name]: value});
    }

    const handleDelete = async () => {
        if(!isEditMode) return;
        setIsDeleting(true);
        setError(null);
        try {
            const {error: deleteError} = await supabase
            .from('songs')
            .delete()
            .eq('id', song?.id);

            if(deleteError) throw new Error('Failed to delete song');
            onSuccess();
            onClose();
        } catch (err) {
            setError('Failed to delete song');
            console.error('Error:', err);
        } finally {
            setIsDeleting(false);
        }
    }

    const handleAIFields = async () => {
        setIsAIGenerating(true);
        setError(null);
        try {
            const {data, error: aiError} = await supabase.rpc('generate_song_fields', {
                title: formData.title || ''
            });
            if(aiError) throw new Error('Failed to generate song fields');
            setFormData({
                ...formData,
                artists: data.artists,
                keywords: data.keywords,
                lyrics: data.lyrics,
                authors: data.authors,
                genres: data.genres,
                year: data.year,
                link: data.link,
                is_free: data.is_free,
                score: data.score
            });
        } catch (err) {
            setError('Failed to generate song fields');
            console.error('Error:', err);
        } finally {
            setIsAIGenerating(false);
        }
    }

    // update filters options
    const updateFiltersOptions = async (authors: string[], artists: string[], keywords: string[]) => {
        try {
        await Promise.all([
            supabase.from('authors').upsert(authors.map(name => ({ name })), { onConflict: 'name' }),
            supabase.from('artists').upsert(artists.map(name => ({ name })), { onConflict: 'name' }),
            supabase.from('keywords').upsert(keywords.map(name => ({ name })), { onConflict: 'name' })
        ]);
        } catch (err) {
            setError('Failed to update filters options');
            console.error('Error:', err);
        }
    }

    return (
        <div className="max-w-lg mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 text-red-500 rounded-md text-sm">
                {error}
              </div>
            )}
    
            {/* title, artists, keywords, lyrics, authors, genres, year, link, is_free, score */}
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
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3 leading-normal"             
                />
              </div>
              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  onClick={handleAIFields}
                  disabled={ isAIGenerating || !formData.title}
                  className={`px-4 py-2 rounded font-semibold flex items-center gap-2
                  ${!formData.title
                      ? 'bg-green-400 text-white opacity-50 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'}
                `}          >
                  {isAIGenerating && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  Generate with AI
                </button>
              </div>
    
              <div>
                <label htmlFor="artists" className="block text-sm font-medium text-gray-700">
                  Artists
                </label>
                <input
                  type="text"
                  id="artists"
                  name="artists"
                  value={formData.artists || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
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
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3 leading-normal"              
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
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3 leading-normal"            />
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
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3 leading-normal"            />
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
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3 leading-normal"              
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
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3 leading-normal"
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
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500 text-base py-2.5 px-3 leading-normal"            />
              </div>
            </div>
    
            {/* buttons */}
            <div className="flex justify-between items-center pt-4">
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Integration'}
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
                  {isLoading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Integration')}
                </button>
              </div>
            </div>
          </form>
        </div>
      )
} 

export default SongForm;