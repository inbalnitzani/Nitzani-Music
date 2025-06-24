import { useState, useEffect, useCallback } from 'react';
import type { Song, SongFilters } from '../types/song';
import { supabase } from '../supabaseClient';
import SongFiltersComponent from '../components/SongFilters';
import Modal from '../components/Modal';
import SongForm from '../components/SongForm';
import Export from '../components/Export';
import { Tooltip } from 'react-tooltip';
import TagList from '../components/TagList';
import ManageSite from '../components/ManageSite';

const AdminPage: React.FC = () => {
  const [songsPerPage, setSongsPerPage] = useState(5); // default 5
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditSongModalOpen, setIsEditSongModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [totalSongs, setTotalSongs] = useState(0);
  const [selectedSongForEdit, setSelectedSongForEdit] = useState<Song | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [currentFilters, setCurrentFilters] = useState<SongFilters>({
    authors: [],
    keywords: [],
    artists: [],
    searchText: ''
  });
  const [isManageSiteModalOpen, setIsManageSiteModalOpen] = useState(false);

  // Fetch authors and artists for filters
  const fetchFilterData = useCallback(async () => {
    try {
      const artistsResponse = await supabase.from('artists').select('id, name').order('name').range(0, 2000);

      // Debug: log total, first and last 10 artist names
      const allArtists = artistsResponse.data || [];
      console.log('Total artists fetched:', allArtists.length);
      console.log('First 10:', allArtists.slice(0, 10).map(a => a.name));
      console.log('Last 10:', allArtists.slice(-10).map(a => a.name));
    } catch (err) {
      console.error('Error fetching filter data:', err);
    }
  }, []);

  useEffect(() => {
    fetchFilterData();
  }, [fetchFilterData]);

  // Fetch songs
  const fetchSongs = async (filters: SongFilters, page: number, pageSize = songsPerPage) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate range for pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let songIdsByArtist: string[] | null = null;
      if (filters.artists?.length && filters.artists.length > 0) {
        // 1. Get artist ids by name
        const { data: artistRows, error: artistError } = await supabase
          .from('artists')
          .select('id')
          .in('name', filters.artists);
        if (artistError) throw artistError;
        const artistIds = (artistRows || []).map(a => a.id);

        if (artistIds.length > 0) {
          // 2. Get song_ids from song_artists
          const { data: songArtistRows, error: songArtistError } = await supabase
            .from('song_artists')
            .select('song_id')
            .in('artist_id', artistIds);
          if (songArtistError) throw songArtistError;
          songIdsByArtist = [...new Set((songArtistRows || []).map(sa => sa.song_id))];
          if (songIdsByArtist.length === 0) {
            setSongs([]);
            setTotalSongs(0);
            setIsLoading(false);
            return;
          }
        }
      }

      let query = supabase
        .from('songs')
        .select(`*,
          song_artists (position, artist_id, artists (id, name)),
          song_authors (position, author_id, authors (id, name)),
          song_keywords (keyword_id, keywords (id, name)),
          song_genres (genre_id, genres (id, name))
        `, { count: 'exact' });

      if (filters.authors?.length && filters.authors.length > 0) {
        query = query.contains('authors', filters.authors!);
      }

      if (filters.keywords?.length && filters.keywords.length > 0) {
        query = query.contains('keywords', filters.keywords!);
      }

      // 3. Filter by song IDs if artist filter is active
      if (songIdsByArtist) {
        query = query.in('id', songIdsByArtist);
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
      if (songsData && songsData.length > 0) {
        const songsWithDetails = songsData.map(song => ({
          ...song,
          artists: (song.song_artists || [])
            .map((sa: { artists?: { name?: string } | null }) => sa.artists?.name)
            .filter(Boolean),
          authors: (song.song_authors || [])
            .map((sa: { authors?: { name?: string } | null }) => sa.authors?.name)
            .filter(Boolean),
          keywords: (song.song_keywords || [])
            .map((sk: { keywords?: { name?: string } | null }) => sk.keywords?.name)
            .filter(Boolean),
          genres: (song.song_genres || [])
            .map((sg: { genres?: { name?: string } | null }) => sg.genres?.name)
            .filter(Boolean),
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

  // Initial fetch
  useEffect(() => {
    fetchSongs({}, 1, songsPerPage);
  }, []);

  // handle filters change
  const handleFiltersChange = (filters: SongFilters) => {
    setCurrentFilters(filters)
    setCurrentPage(1);
    fetchSongs(filters, 1, songsPerPage);
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
    fetchFilterData() // Refresh filters lists
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

  const totalPages = Math.ceil(totalSongs / songsPerPage)

  return (
    <div className="p-4 sm:p-8">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Admin - Songs Table</h1>

        <div className="flex gap-2">
          {/* Export button */}
          <button
            data-tooltip-id="exportTip"
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Export
          </button>
          <Tooltip id="exportTip" place="top" content="יצא את השירים שבחרת לקובץ" />
          {/* Add Song Button */}
          <button
            onClick={() => setIsEditSongModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add Song
          </button>
          <button
            onClick={() => setIsManageSiteModalOpen(true)}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Manage Site
          </button>
        </div>
      </div>
      <SongFiltersComponent
        filters={currentFilters}
        onFilterChange={handleFiltersChange}
      />
      {/* Edit Song Modal */}
      <Modal
        size="md"
        isOpen={isEditSongModalOpen}
        onClose={handleCloseModal}
        title={selectedSongForEdit ? 'Edit Song' : 'Create Song'}
      >
        <SongForm
          onClose={handleCloseModal}
          onSuccess={handleCreateSuccess}
          song={selectedSongForEdit || undefined}
        />
      </Modal>
      {/* Export Modal */}
      <Modal
        size="lg"
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Songs"
      >
        <Export songsForExport={selectedSongs} />
      </Modal>
      {/* Manage Site Modal */}
      <Modal
        size="xl"
        isOpen={isManageSiteModalOpen}
        onClose={() => setIsManageSiteModalOpen(false)}
        title="Manage Site"
      >
        <ManageSite onSave={() => {
          setIsManageSiteModalOpen(false);
          fetchFilterData();
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
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Title</th>
              <th scope="col" className="px-6 py-3">Artists</th>
              <th scope="col" className="px-6 py-3">Authors</th>
              <th scope="col" className="px-6 py-3">Keywords</th>
              <th scope="col" className="px-6 py-3">Genres</th>
              <th scope="col" className="px-6 py-3">Lyrics</th>
              <th scope="col" className="px-6 py-3">Year</th>
              <th scope="col" className="px-6 py-3">Link</th>
              <th scope="col" className="px-6 py-3">Select</th>
            </tr>
          </thead>
          <tbody>
            {songs.map(song => (
              <tr
                key={song.id}
                className="bg-white border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => handleEditSong(song)}
              >                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{song.title}</td>
                <td className="px-6 py-4">
                  <TagList items={song.artists} />
                </td>
                <td className="px-6 py-4">
                  <TagList items={song.authors} colorClass="bg-green-100 text-green-800" />
                </td>
                <td className="px-6 py-4">
                  <TagList items={song.keywords} colorClass="bg-pink-100 text-pink-800" />
                </td>
                <td className="px-6 py-4">
                  <TagList items={song.genres} colorClass="bg-yellow-100 text-yellow-800" />
                </td>
                <td className="px-6 py-4 truncate max-w-xs">{song.lyrics}</td>
                <td className="px-6 py-4">{song.year}</td>
                <td className="px-6 py-4"><a href={song.link} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{song.link ? 'Link' : ''}</a></td>
                <td className="px-6 py-4">

                  <label key={song.id} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox text-blue-600"
                      checked={selectedSongs.some(s => s.id === song.id)}
                      onClick={e => e.stopPropagation()}
                      onChange={() => handleSelectSong(song)}
                    />

                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="relative flex justify-center items-center gap-2 mt-6">
  {/* Pagination controls (centered) */}
  <button
    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
    onClick={() => handlePageChange(currentPage - 1)}
    disabled={currentPage === 1}
  >
    Prev
  </button>
  <span className="mx-2">Page {currentPage} of {totalPages}</span>
  <button
    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
    onClick={() => handlePageChange(currentPage + 1)}
    disabled={currentPage === totalPages}
  >
    Next
  </button>

{/* page size */}
  <select
      value={songsPerPage}
      onChange={e => {
        const newSize = Number(e.target.value);
        setSongsPerPage(newSize);
        setCurrentPage(1);
        fetchSongs(currentFilters, 1, newSize);
      }}
      className="border rounded px-2 py-1 w-24"
    >
      {[5, 10, 20, 50, 100].map(size => (
        <option key={size} value={size}>{size}</option>
      ))}
    </select>

  {/*  total songs on the left */}
  <div className="flex items-center gap-2 absolute left-0">

    <span className="text-sm text-gray-500">שירים בטבלה: {totalSongs}</span>
  </div>
</div>

    </div>
  );
}

export default AdminPage;