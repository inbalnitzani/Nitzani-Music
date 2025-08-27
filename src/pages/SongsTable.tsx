import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Song, SongFilters, RawSongFromSupabase } from '../types/song.ts';
import { supabase } from '../supabaseClient.ts';
import SongFiltersComponent from '../components/SongFilters.tsx';
import Modal from '../components/Modal.tsx';
import SongForm from '../components/SongForm.tsx';
import Export from '../components/Export.tsx';
import { Tooltip } from 'react-tooltip';
import TagList from '../components/TagList.tsx';
import ManageSite from '../components/ManageSite.tsx';
import { useTranslation } from 'react-i18next';
import Pagination from '../components/Pagination';
import Checkbox from '../components/Checkbox.tsx'
import YouTubeIcon from '@mui/icons-material/YouTube';

const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [songsPerPage, setSongsPerPage] = useState(5); // default 5
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditSongModalOpen, setIsEditSongModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [totalSongs, setTotalSongs] = useState(0);
  const [selectedSongForEdit, setSelectedSongForEdit] = useState<Song | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Song[]>(() => {
    const saved = localStorage.getItem('selectedSongs');
    return saved ? JSON.parse(saved) : [];
  });
  const getFiltersFromParams = () => {
    return {
      authors: searchParams.get('authors') ? searchParams.get('authors')!.split(',').filter(Boolean) : [],
      keywords: searchParams.get('keywords') ? searchParams.get('keywords')!.split(',').filter(Boolean) : [],
      artists: searchParams.get('artists') ? searchParams.get('artists')!.split(',').filter(Boolean) : [],
      searchText: searchParams.get('searchText') || ''
    };
  };
  const [currentFilters, setCurrentFilters] = useState<SongFilters>(getFiltersFromParams());
  const [isManageSiteModalOpen, setIsManageSiteModalOpen] = useState(false);

  // Fetch songs
  const fetchSongs = async (filters: SongFilters, page: number, pageSize = songsPerPage) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate range for pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Dynamically build the select string based on active filters
      const artistJoin = (filters.artists?.length)
        ? 'song_artists!inner(artist_id, artists (id, name))'
        : 'song_artists(artist_id, artists (id, name))';

      const authorJoin = (filters.authors?.length)
        ? 'song_authors!inner(author_id, authors (id, name))'
        : 'song_authors(author_id, authors (id, name))';

      const keywordJoin = (filters.keywords?.length)
        ? 'song_keywords!inner(keyword_id, keywords (id, name))'
        : 'song_keywords(keyword_id, keywords (id, name))';

      // Genres are not filtered, so it's always a left join
      const genreJoin = 'song_genres(genre_id, genres (id, name))';

      const selectString = `*, ${artistJoin}, ${authorJoin}, ${keywordJoin}, ${genreJoin}`;


      let query = supabase
        .from('songs')
        .select(selectString, { count: 'exact' });

      // Filter by artists
      if (filters.artists?.length && filters.artists.length > 0) {
        // Get artist ids by name
        const { data: artistRows, error: artistError } = await supabase
          .from('artists')
          .select('id')
          .in('name', filters.artists);
        if (artistError) throw artistError;
        const artistIds = (artistRows || []).map((a: { id: string }) => a.id);
        if (artistIds.length > 0) {
          query = query.in('song_artists.artist_id', artistIds);
        } else {
          setSongs([]);
          setTotalSongs(0);
          setIsLoading(false);
          return;
        }
      }

      // Filter by authors
      if (filters.authors?.length && filters.authors.length > 0) {
        // Get author ids by name
        const { data: authorRows, error: authorError } = await supabase
          .from('authors')
          .select('id')
          .in('name', filters.authors);
        if (authorError) throw authorError;
        const authorIds = (authorRows || []).map((a: { id: string }) => a.id);
        if (authorIds.length > 0) {
          query = query.in('song_authors.author_id', authorIds);
        } else {
          setSongs([]);
          setTotalSongs(0);
          setIsLoading(false);
          return;
        }
      }

      // Filter by keywords
      if (filters.keywords?.length && filters.keywords.length > 0) {
        // Get keyword ids by name
        const { data: keywordRows, error: keywordError } = await supabase
          .from('keywords')
          .select('id')
          .in('name', filters.keywords);
        if (keywordError) throw keywordError;
        const keywordIds = (keywordRows || []).map((k: { id: string }) => k.id); if (keywordIds.length > 0) {
          query = query.in('song_keywords.keyword_id', keywordIds);
        } else {
          setSongs([]);
          setTotalSongs(0);
          setIsLoading(false);
          return;
        }
      }

      if (filters.searchText) {
        query = query.or(`title.ilike.%${filters.searchText}%,lyrics.ilike.%${filters.searchText}%`);
      }

      const { data: songsData, error: songsError, count: totalSongs } = await query
        .range(from, to)
        .order('score', { ascending: false });

      if (songsError) {
        console.error('Error fetching songs:', songsError);
      }

      // Map artists for display
      if (Array.isArray(songsData) && songsData.length > 0) {
        const songsWithDetails: Song[] = (songsData as unknown as RawSongFromSupabase[]).map(song => ({
          id: song.id,
          title: song.title,
          lyrics: song.lyrics,
          year: Number(song.year),
          link: song.link,
          is_free: song.is_free === true,
          score: Number(song.score),

          artists: (song.song_artists || [])
            .map((sa: { artists?: { name?: string } | null }) => sa.artists?.name)
            .filter((name: string | undefined): name is string => Boolean(name)),

          authors: (song.song_authors || [])
            .map((sa: { authors?: { name?: string } | null }) => sa.authors?.name)
            .filter((name: string | undefined): name is string => Boolean(name)),

          keywords: (song.song_keywords || [])
            .map((sk: { keywords?: { name?: string } | null }) => sk.keywords?.name)
            .filter((name: string | undefined): name is string => Boolean(name)),

          genres: (song.song_genres || [])
            .map((sg: { genres?: { name?: string } | null }) => sg.genres?.name)
            .filter((name: string | undefined): name is string => Boolean(name))
        }));

        setSongs(songsWithDetails);
      } else {
        setSongs([]);
      }
      setTotalSongs(totalSongs || 0);
    } catch (err) {
      console.error('Error fetching songs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Restore selected songs on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedSongs');
    if (saved) {
      setSelectedSongs(JSON.parse(saved));
    }
  }, []);

  // Save selected songs on change
  useEffect(() => {
    localStorage.setItem('selectedSongs', JSON.stringify(selectedSongs));
  }, [selectedSongs]);

  // On mount or when searchParams change, update filters and fetch
  useEffect(() => {
    const filters = getFiltersFromParams();
    setCurrentFilters(filters);
    fetchSongs(filters, 1, songsPerPage);
  }, [searchParams, songsPerPage]);

  const handleFiltersChange = (filters: SongFilters) => {
    setCurrentFilters(filters);
    setCurrentPage(1);
    // Update URL params
    const params: Record<string, string> = {};
    if ((filters.authors ?? []).length) params.authors = (filters.authors ?? []).join(',');
    if ((filters.keywords ?? []).length) params.keywords = (filters.keywords ?? []).join(',');
    if ((filters.artists ?? []).length) params.artists = (filters.artists ?? []).join(',');
    if (filters.searchText) params.searchText = filters.searchText;
    setSearchParams(params);
    // fetchSongs will be called by useEffect
  };

  // handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
    fetchSongs(currentFilters, newPage, songsPerPage);
  };

  // handle close modal
  const handleCloseModal = () => {
    setIsEditSongModalOpen(false)
    setSelectedSongForEdit(null)
  }

  // handle create success
  const handleCreateSuccess = () => {
    fetchSongs(currentFilters, currentPage, songsPerPage)
    setIsEditSongModalOpen(false) // Close Create song Modal
    setSelectedSongForEdit(null)
  }

  // handle edit song
  const handleEditSong = (song: Song) => {
    setSelectedSongForEdit(song)
    setIsEditSongModalOpen(true)
  }

  // handle select song
  const handleSelectSong = (song: Song) => {
    if (selectedSongs.some(s => s.id === song.id)) {
      setSelectedSongs(selectedSongs.filter(s => s.id !== song.id))
    } else {
      setSelectedSongs([...selectedSongs, song])
    }
  }

  // handle select all songs
  const handleSelectAllSongs = () => {
    if (selectedSongs.length === songs.length) {
      setSelectedSongs([])
    } else {
      setSelectedSongs(songs)
    }
  }


  const totalPages = Math.ceil(totalSongs / songsPerPage)

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6">
        {/* כותרת */}
        <h1 className="text-xl sm:text-2xl font-bold hidden sm:block">
          {t('songs.songs_table')}
        </h1>

        {/* כפתורים */}
        <div className="flex flex-wrap justify-center gap-2 mt-2 sm:mt-0 sm:justify-end">
          {/* Export button */}
          <button
            data-tooltip-id="exportTip"
            onClick={() => setIsExportModalOpen(true)}
            className="btn btn-secondary sm:w-auto">
            {t('songs.export')}
          </button>
          <Tooltip id="exportTip" place="top" content={t('songs.export_tooltip')} />
          {/* Add Song Button */}
          <button
            onClick={() => setIsEditSongModalOpen(true)}
            className="btn btn-secondary">
            {t('songs.add_song')}
          </button>
          <button
            onClick={() => setIsManageSiteModalOpen(true)}
            className="btn btn-secondary">
            {t('songs.manage_site')}
          </button>
        </div>
      </div>
      <SongFiltersComponent
        filters={currentFilters}
        onFilterChange={handleFiltersChange}
      />
      {/* Edit Song Modal */}
      <Modal
        isOpen={isEditSongModalOpen}
        onClose={handleCloseModal}
        title={selectedSongForEdit ? t('songs.edit_song') : t('songs.create_song')}
      >
        <SongForm
          onClose={handleCloseModal}
          onSuccess={handleCreateSuccess}
          song={selectedSongForEdit || undefined}
        />
      </Modal>
      {/* Export Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={t('songs.export_songs')}
      >
        <Export songsForExport={selectedSongs} />
      </Modal>
      {/* Manage Site Modal */}
      <Modal
        isOpen={isManageSiteModalOpen}
        onClose={() => setIsManageSiteModalOpen(false)}
        title={t('songs.manage_site')}
      >
        <ManageSite onSave={() => {
          setIsManageSiteModalOpen(false);
          fetchSongs(currentFilters, currentPage, songsPerPage);
        }} />
      </Modal>
      {/* Modern Tailwind Table */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="min-w-full table-auto text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">{t('songs.title')}</th>
              <th scope="col" className="hidden sm:table-cell px-6 py-3">{t('songs.artists')}</th>
              <th scope="col" className="hidden sm:table-cell px-6 py-3">{t('songs.authors')}</th>
              <th scope="col" className="hidden sm:table-cell px-6 py-3">{t('songs.keywords')}</th>
              <th scope="col" className="hidden sm:table-cell px-6 py-3">{t('songs.genres')}</th>
              <th scope="col" className="hidden sm:table-cell px-6 py-3">{t('songs.lyrics')}</th>
              <th scope="col" className="hidden sm:table-cell px-6 py-3">{t('songs.year')}</th>
              <th scope="col" className="px-6 py-3">{t('songs.link')}</th>
              <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-gray-100 hover:text-blue-600" data-tooltip-id="selectAllTip" onClick={() => handleSelectAllSongs()}>{t('songs.select')}</th>
            </tr>
          </thead>

          <tbody>
            {songs.map(song => (
              <tr
                key={song.id}
                className="bg-white border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => handleEditSong(song)}
              >                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{song.title}</td>
                <td className="px-6 py-4 hidden sm:table-cell">
                  <TagList items={song.artists} />
                </td>
                <td className="hidden sm:table-cell px-6 py-4">
                  <TagList items={song.authors} colorClass="bg-green-100 text-green-800" />
                </td>
                <td className="px-6 py-4 hidden sm:table-cell">
                  <TagList items={song.keywords} colorClass="bg-pink-100 text-pink-800" />
                </td>
                <td className="px-6 py-4 hidden sm:table-cell">
                  <TagList items={song.genres} colorClass="bg-yellow-100 text-yellow-800" />
                </td>
                <td className="px-6 py-4 truncate max-w-xs hidden sm:table-cell">{song.lyrics}</td>
                <td className="px-6 py-4 hidden sm:table-cell">{song.year}</td>
                <td className="px-6 py-4"><a href={song.link}
                 className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  {song.link ? <YouTubeIcon style={{color: 'red'}} /> : ''}</a></td>
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
  <Checkbox
    id={`song-${song.id}`}
    checked={selectedSongs.some((s) => s.id === song.id)}
    onChange={() => handleSelectSong(song)}
  />



                  {/* <label key={song.id} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="checkbox-base"
                      checked={selectedSongs.some(s => s.id === song.id)}
                      onClick={e => e.stopPropagation()}
                      onChange={() => handleSelectSong(song)}
                    />

                  </label> */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Tooltip id="selectAllTip" place="top" content={selectedSongs.length === songs.length ? t('songs.cancel_selection') : t('songs.select_all_songs')} />

      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalSongs}
        pageSize={songsPerPage}
        onPrev={() => handlePageChange(currentPage - 1)}
        onNext={() => handlePageChange(currentPage + 1)}
        onPageSizeChange={(newSize) => {
          setSongsPerPage(newSize);
          setCurrentPage(1);
          fetchSongs(currentFilters, 1, newSize);
        }}
      />

    </div>
  );
}

export default AdminPage;