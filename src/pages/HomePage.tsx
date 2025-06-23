import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Song } from '../types/song';

export default function HomePage() {
  const [searchPrompt, setSearchPrompt] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const searchSongsByPrompt = async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First, try to extract keywords and context from the prompt
      const { data: aiResponse, error: aiError } = await supabase.rpc('analyze_search_prompt', {
        user_prompt: prompt
      });

      if (aiError) {
        console.error('AI analysis error:', aiError);
        // Fallback to basic search
        const { data: fallbackSongs, error: fallbackError } = await supabase
          .from('songs')
          .select('*')
          .or(`title.ilike.%${prompt}%,lyrics.ilike.%${prompt}%`)
          .limit(10);

        if (fallbackError) throw fallbackError;
        setSongs(fallbackSongs || []);
        return;
      }

      // Use AI-extracted criteria to search
      const { keywords, mood, genre, year_range } = aiResponse;
      
      let query = supabase.from('songs').select('*');
      
      // Build search query based on AI analysis
      if (keywords && keywords.length > 0) {
        query = query.overlaps('Keywords', keywords);
      }
      
      if (genre && genre.length > 0) {
        query = query.overlaps('Genres', genre);
      }
      
      if (mood) {
        query = query.or(`title.ilike.%${mood}%,lyrics.ilike.%${mood}%`);
      }
      
      if (year_range && year_range.length === 2) {
        query = query.gte('year', year_range[0]).lte('year', year_range[1]);
      }

      const { data: songsData, error: songsError } = await query.limit(10);
      
      if (songsError) throw songsError;
      setSongs(songsData || []);

    } catch (err) {
      console.error('Search error:', err);
      setError('נכשל בחיפוש שירים. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchPrompt.trim()) {
      searchSongsByPrompt(searchPrompt.trim());
    }
  };

  const examplePrompts = [
    "אני צריך שיר לפרסומת למכוניות",
    "מחפש מוזיקה קצבית לאימון",
    "צריך שיר רומנטי לחתונה",
    "חפש שירים על חופש והרפתקאות",
    "מצא שירים מתאימים למסיבת ילדים"
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">חיפוש שירים</h1>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">מצא את השיר המושלם</h2>
          <p className="text-gray-600 mb-6 text-right">
            תאר מה אתה מחפש בשפה טבעית. הבינה המלאכותית שלנו תעזור למצוא את השירים המושלמים לצרכים שלך.
          </p>
          
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-4 flex-row-reverse">
              <input
                type="text"
                value={searchPrompt}
                onChange={(e) => setSearchPrompt(e.target.value)}
                placeholder="למשל: אני צריך שיר לפרסומת למכוניות"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !searchPrompt.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'מחפש...' : 'חפש'}
              </button>
            </div>
          </form>

          {/* Example Prompts */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2 text-right">נסה דוגמאות אלה:</h3>
            <div className="flex flex-wrap gap-2 justify-end">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setSearchPrompt(prompt)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Section */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-right">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {songs.length > 0 && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-right">נמצאו {songs.length} שירים</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {songs.map((song) => (
                <div key={song.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start flex-row-reverse">
                    <div className="flex-1 text-right">
                      <h4 className="text-lg font-medium text-gray-900 mb-2">{song.title}</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">אמנים:</span> {song.artists?.join(', ') || 'לא ידוע'}</p>
                        <p><span className="font-medium">מחברים:</span> {song.authors?.join(', ') || 'לא ידוע'}</p>
                        <p><span className="font-medium">שנה:</span> {song.year || 'לא ידוע'}</p>
                        <p><span className="font-medium">ז'אנרים:</span> {song.genres?.join(', ') || 'לא ידוע'}</p>
                        <p><span className="font-medium">מילות מפתח:</span> {song.keywords?.join(', ') || 'אין'}</p>
                        {song.lyrics && (
                          <p className="mt-2 text-gray-700 line-clamp-2">
                            <span className="font-medium">מילים:</span> {song.lyrics.substring(0, 200)}...
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mr-4 flex flex-col items-start space-y-2">
                      {song.link && (
                        <a
                          href={song.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          האזן →
                        </a>
                      )}
                      <div className="text-xs text-gray-500">
                        <StarRating score={song.score || 0} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && songs.length === 0 && searchPrompt && !error && (
          <div className="text-center py-12 text-gray-500">
            <p>לא נמצאו שירים התואמים לקריטריונים שלך.</p>
            <p className="text-sm mt-2">נסה לשנות את מונחי החיפוש או להיות יותר ספציפי.</p>
          </div>
        )}
      </div>
    </div>
  );
} 