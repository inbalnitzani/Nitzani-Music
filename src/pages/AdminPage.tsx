import { useState, useEffect, useCallback } from 'react';
import type { Song, SongFilters } from '../types/song';
import { supabase } from '../supabaseClient';
import SongFiltersComponent from '../components/SongFilters';
import Modal from '../components/Modal';
import SongForm from '../components/SongForm';
import Export from '../components/Export';

const AdminPage: React.FC = () => {
  const [songsPerPage, setSongsPerPage] = useState(5); // default 5
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authors, setAuthors] = useState<string[] | null>(null);
  const [artists, setArtists] = useState<string[] | null>(null);
  const [keywords, setKeywords] = useState<string[] | null>(null);
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



  // Fetch authors and artists for filters
  const fetchFilterData = useCallback(async () => {
    try {
      const [authorsResponse, artistsResponse, keywordsResponse] = await Promise.all([
        supabase.from('authors').select('name').order('name'),
        supabase.from('artists').select('name').order('name'),
        supabase.from('keywords').select('name').order('name')
      ]);

      setAuthors(authorsResponse.data?.map(author => author.name) || []);
      setArtists(artistsResponse.data?.map(artist => artist.name) || []);
      setKeywords(keywordsResponse.data?.map(keyword => keyword.name) || []);
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

      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Calculate range for pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('songs')
        .select('*', { count: 'exact' })

      if (filters.authors?.length && filters.authors.length > 0) {
        query = query.contains('authors', filters.authors!);
      }

      if (filters.keywords?.length && filters.keywords.length > 0) {
        query = query.contains('keywords', filters.keywords!);
      }

      if (filters.artists?.length && filters.artists.length > 0) {
        query = query.contains('artists', filters.artists!);
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

      setSongs(songsData || []);
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
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Export
          </button>

          {/* Add Song Button */}
          <button
            onClick={() => setIsEditSongModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add Song
          </button>
        </div>
      </div>
      <SongFiltersComponent
        filters={currentFilters}
        onFilterChange={handleFiltersChange}
        authors={authors || []}
        keywords={keywords || []}
        artists={artists || []}
      />
      {/* Edit Song Modal */}
      <Modal
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
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Songs"
      >
        <Export songsForExport={selectedSongs} />
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
                <td className="px-6 py-4">{song.artists?.join(', ')}</td>
                <td className="px-6 py-4">{song.authors?.join(', ')}</td>
                <td className="px-6 py-4">{song.keywords?.join(', ')}</td>
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
      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-2 mt-6">
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
        <div className=" ml-4 flex items-center gap-2">
          {/* <label htmlFor="songs-per-page" className="text-sm font-medium text-gray-700">שירים בעמוד:</label> */}
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
        </div>
      </div>
    </div>
  );
}

export default AdminPage;