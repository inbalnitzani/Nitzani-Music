import React, { useState, useEffect, useCallback } from 'react';
import TagList from './TagList.tsx';
import { supabase } from '../supabaseClient.ts';
import TagSection from './tagSection.tsx';
// import jsPDF from 'jspdf';
import { useInView } from 'react-intersection-observer';
import { useTranslation } from 'react-i18next';
interface ManageSiteProps {
  onSave?: () => void; // Callback to refresh data in parent
}

interface Tag {
  id: string;
  name: string;
}

interface Song {
  id: string;
  title: string;
}

interface AffectedTag {
  type: 'author' | 'artist' | 'keyword' | 'genre';
  tag: Tag;
  affectedSongs: Song[];
}

const PAGE_SIZE = 50;

function useInfiniteTags(tableName: string, search: string) {
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  // Fetch tags (infinite scroll or search)
  const fetchTags = useCallback(async (pageToFetch = page, searchTerm = search) => {
    if (loading || !hasMore) return;
    setLoading(true);
    const from = pageToFetch * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let query = supabase.from(tableName).select('id, name').order('name');
    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }
    const { data, error } = await query.range(from, to);
    if (error) {
      setLoading(false);
      return;
    }
    setTags(prev => pageToFetch === 0 ? (data || []) : [...prev, ...(data || [])]);
    setHasMore((data || []).length === PAGE_SIZE);
    setLoading(false);
    setStarted(true);
  }, [page, tableName, loading, hasMore, search]);

  // Fetch on search change or page change
  useEffect(() => {
    setTags([]);
    setPage(0);
    setHasMore(true);
    setStarted(false);
    if (search) {
      fetchTags(0, search);
    }
    // eslint-disable-next-line
  }, [tableName, search]);

  // No auto-fetch on mount for infinite scroll

  const fetchNext = () => {
    if (!started) {
      fetchTags(0, search);
      setPage(0);
    } else if (hasMore && !loading) {
      fetchTags(page + 1, search);
      setPage(p => p + 1);
    }
  };

  return { tags, fetchNext, hasMore, loading };
}

const ManageSite: React.FC<ManageSiteProps> = ({ onSave }) => {
  const { t } = useTranslation();
  // Tag states
  const [authors, setAuthors] = useState<Tag[]>([]);
  const [artists, setArtists] = useState<Tag[]>([]);
  const [keywords, setKeywords] = useState<Tag[]>([]);
  const [genres, setGenres] = useState<Tag[]>([]);

  // New tag input states
  const [newAuthorInput, setNewAuthorInput] = useState('');
  const [newArtistInput, setNewArtistInput] = useState('');
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [newGenreInput, setNewGenreInput] = useState('');

  // New tags to add
  const [newAuthors, setNewAuthors] = useState<string[]>([]);
  const [newArtists, setNewArtists] = useState<string[]>([]);
  const [newKeywords, setNewKeywords] = useState<string[]>([]);
  const [newGenres, setNewGenres] = useState<string[]>([]);

  // Tags to delete (by id)
  const [deletedAuthors, setDeletedAuthors] = useState<Tag[]>([]);
  const [deletedArtists, setDeletedArtists] = useState<Tag[]>([]);
  const [deletedKeywords, setDeletedKeywords] = useState<Tag[]>([]);
  const [deletedGenres, setDeletedGenres] = useState<Tag[]>([]);

  // Modal/confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmData, setDeleteConfirmData] = useState<AffectedTag[]>([]);

  const [isSaving, setIsSaving] = useState(false);

  // Search state for each tag type
  const [searchAuthor, setSearchAuthor] = useState('');
  const [searchArtist, setSearchArtist] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchGenre, setSearchGenre] = useState('');

  // Infinite scroll/search hooks for each tag type
  const {
    tags: authorsTags,
    fetchNext: fetchNextAuthors,
    hasMore: hasMoreAuthors,
    loading: loadingAuthors
  } = useInfiniteTags('authors', searchAuthor);
  const { ref: authorsRef, inView: authorsInView } = useInView();

  const {
    tags: artistsTags,
    fetchNext: fetchNextArtists,
    hasMore: hasMoreArtists,
    loading: loadingArtists
  } = useInfiniteTags('artists', searchArtist);
  const { ref: artistsRef, inView: artistsInView } = useInView();

  const {
    tags: keywordsTags,
    fetchNext: fetchNextKeywords,
    hasMore: hasMoreKeywords,
    loading: loadingKeywords
  } = useInfiniteTags('keywords', searchKeyword);
  const { ref: keywordsRef, inView: keywordsInView } = useInView();

  const {
    tags: genresTags,
    fetchNext: fetchNextGenres,
    hasMore: hasMoreGenres,
    loading: loadingGenres
  } = useInfiniteTags('genres', searchGenre);
  const { ref: genresRef, inView: genresInView } = useInView();

  // Infinite scroll triggers (only if not searching)
  useEffect(() => { if (authorsInView && !searchAuthor) fetchNextAuthors(); }, [authorsInView, searchAuthor]);
  useEffect(() => { if (artistsInView && !searchArtist) fetchNextArtists(); }, [artistsInView, searchArtist]);
  useEffect(() => { if (keywordsInView && !searchKeyword) fetchNextKeywords(); }, [keywordsInView, searchKeyword]);
  useEffect(() => { if (genresInView && !searchGenre) fetchNextGenres(); }, [genresInView, searchGenre]);

  // Reset all state when tags change
  useEffect(() => {
    setDeletedAuthors([]);
    setDeletedArtists([]);
    setDeletedKeywords([]);
    setDeletedGenres([]);
    setNewAuthors([]);
    setNewArtists([]);
    setNewKeywords([]);
    setNewGenres([]);
    setNewAuthorInput('');
    setNewArtistInput('');
    setNewKeywordInput('');
    setNewGenreInput('');
  }, [authors, artists, keywords, genres]);

  // Helper: fetch affected songs for a tag
  const fetchAffectedSongs = async (type: 'author' | 'artist' | 'keyword' | 'genre', tag: Tag): Promise<Song[]> => {
    let joinTable, joinColumn;
    switch (type) {
      case 'author':
        joinTable = 'song_authors';
        joinColumn = 'author_id';
        break;
      case 'artist':
        joinTable = 'song_artists';
        joinColumn = 'artist_id';
        break;
      case 'keyword':
        joinTable = 'song_keywords';
        joinColumn = 'keyword_id';
        break;
      case 'genre':
        joinTable = 'song_genres';
        joinColumn = 'genre_id';
        break;
    }
    const { data: joinRows } = await supabase.from(joinTable).select('song_id').eq(joinColumn, tag.id);
    if (!joinRows) return [];
    const songIds = joinRows.map(row => row.song_id);
    if (songIds.length === 0) return [];
    const { data: songs } = await supabase.from('songs').select('id, title').in('id', songIds);
    return songs || [];
  };

  // Save all tag types in one go, with single alert
  const handleSaveAllTags = async () => {
    setIsSaving(true);
    const tagTypes: ('author' | 'artist' | 'keyword' | 'genre')[] = ['author', 'artist', 'keyword', 'genre'];
    try {
      for (const type of tagTypes) {
        await handleSaveTags(type, false); // pass false to suppress per-type alerts
      }
      //   alert('All tag changes saved successfully!');
      onSave?.(); // Close modal after save
    } catch (error) {
      console.error('Error saving tags:', error);
      alert('Failed to save tag changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Update handleSaveTags to accept a suppressAlert param
  const handleSaveTags = async (type: 'author' | 'artist' | 'keyword' | 'genre', showAlert = true) => {
    setIsSaving(true);
    try {
      let deleted, added, table, setDeleted, setAdded, fetchTags;
      switch (type) {
        case 'author':
          deleted = deletedAuthors;
          added = newAuthors;
          table = 'authors';
          setDeleted = setDeletedAuthors;
          setAdded = setNewAuthors;
          fetchTags = async () => {
            const { data } = await supabase.from('authors').select('id, name').order('name');
            setAuthors(data || []);
          };
          break;
        case 'artist':
          deleted = deletedArtists;
          added = newArtists;
          table = 'artists';
          setDeleted = setDeletedArtists;
          setAdded = setNewArtists;
          fetchTags = async () => {
            const { data } = await supabase.from('artists').select('id, name').order('name');
            setArtists(data || []);
          };
          break;
        case 'keyword':
          deleted = deletedKeywords;
          added = newKeywords;
          table = 'keywords';
          setDeleted = setDeletedKeywords;
          setAdded = setNewKeywords;
          fetchTags = async () => {
            const { data } = await supabase.from('keywords').select('id, name').order('name');
            setKeywords(data || []);
          };
          break;
        case 'genre':
          deleted = deletedGenres;
          added = newGenres;
          table = 'genres';
          setDeleted = setDeletedGenres;
          setAdded = setNewGenres;
          fetchTags = async () => {
            const { data } = await supabase.from('genres').select('id, name').order('name');
            setGenres(data || []);
          };
          break;
      }
      // Delete
      if (deleted.length > 0) {
        await supabase.from(table).delete().in('id', deleted.map(t => t.id));
      }
      // Add
      if (added.length > 0) {
        await supabase.from(table).insert(added.map(name => ({ name })));
      }
      setDeleted([]);
      setAdded([]);
      await fetchTags();
      if (showAlert) alert(`${type.charAt(0).toUpperCase() + type.slice(1)}s saved successfully!`);
    } catch (error) {
      console.error(`Error saving ${type}s:`, error);
      if (showAlert) alert(`Failed to save ${type}s`);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Save all changes handler (shows confirmation first)
  const handleSaveAll = async () => {
    setIsSaving(true);
    // Gather all tags to be deleted
    const allToDelete: { type: 'author' | 'artist' | 'keyword' | 'genre'; tag: Tag }[] = [];
    deletedAuthors.forEach(tag => allToDelete.push({ type: 'author', tag }));
    deletedArtists.forEach(tag => allToDelete.push({ type: 'artist', tag }));
    deletedKeywords.forEach(tag => allToDelete.push({ type: 'keyword', tag }));
    deletedGenres.forEach(tag => allToDelete.push({ type: 'genre', tag }));
    // For each, fetch affected songs
    const affected: AffectedTag[] = [];
    for (const { type, tag } of allToDelete) {
      const affectedSongs = await fetchAffectedSongs(type, tag);
      affected.push({ type, tag, affectedSongs });
    }
    setDeleteConfirmData(affected);
    if (affected.length > 0) {
      setShowDeleteConfirm(true);
      setIsSaving(false);
    } else {
      // No deletions, just save additions/updates immediately
      await handleSaveAllTags();
      setIsSaving(false);
    }
  };

  // Actually perform deletions after confirmation
  const confirmDeleteAll = async () => {
    setIsSaving(true);
    try {
      await handleSaveAllTags();
      setShowDeleteConfirm(false);
      setDeleteConfirmData([]);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper: get deleted names for grey-out
  const deletedNames = (tags: { id: string; name: string }[], deletedArr: string[]) => tags.filter((a) => deletedArr.includes(a.id)).map((a) => a.name);

  // Add new tag
  const addNewTag = (type: 'author' | 'artist' | 'keyword' | 'genre') => {
    switch (type) {
      case 'author':
        if (
          newAuthorInput.trim() &&
          !authors.some(a => a.name === newAuthorInput.trim()) &&
          !newAuthors.includes(newAuthorInput.trim())
        ) {
          setNewAuthors(prev => [...prev, newAuthorInput.trim()]);
          setNewAuthorInput('');
        }
        break;
      case 'artist':
        if (
          newArtistInput.trim() &&
          !artists.some(a => a.name === newArtistInput.trim()) &&
          !newArtists.includes(newArtistInput.trim())
        ) {
          setNewArtists(prev => [...prev, newArtistInput.trim()]);
          setNewArtistInput('');
        }
        break;
      case 'keyword':
        if (
          newKeywordInput.trim() &&
          !keywords.some(a => a.name === newKeywordInput.trim()) &&
          !newKeywords.includes(newKeywordInput.trim())
        ) {
          setNewKeywords(prev => [...prev, newKeywordInput.trim()]);
          setNewKeywordInput('');
        }
        break;
      case 'genre':
        if (
          newGenreInput.trim() &&
          !genres.some(a => a.name === newGenreInput.trim()) &&
          !newGenres.includes(newGenreInput.trim())
        ) {
          setNewGenres(prev => [...prev, newGenreInput.trim()]);
          setNewGenreInput('');
        }
        break;
    }
  };

  // Render
  return (
    <div>
      {/* Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{t('manage_site.delete_confirmation')}</h3>
            <p className="mb-4">{t('manage_site.delete_confirmation_text')}</p>
            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {deleteConfirmData.map(({ type, tag, affectedSongs }) => (
                <div key={type + tag.id} className="border rounded p-3">
                  <div className="font-semibold mb-2">
                    {type.charAt(0).toUpperCase() + type.slice(1)}: <span className="text-red-600">{tag.name}</span>
                  </div>
                  {affectedSongs.length > 0 ? (
                    <div className="text-sm text-gray-700">
                      <div className="mb-1">{t('manage_site.affected_songs')} ({affectedSongs.length}):</div>
                      <ul className="list-disc ml-6">
                        {affectedSongs.map(song => (
                          <li key={song.id}>{song.title}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">{t('manage_site.no_songs_affected')}</div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-neutral"
                disabled={isSaving}
              >
                {t('manage_site.cancel')}
              </button>
              <button
                onClick={confirmDeleteAll}
                className="btn btn-danger"
                disabled={isSaving}
              >
                {isSaving ? t('manage_site.deleting') : t('manage_site.delete_anyway')}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="btn btn-primary"
        >
          {isSaving ? t('manage_site.saving') : t('manage_site.save')}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Authors */}
        <TagSection
          typeKey="author"
          searchValue={searchAuthor}
          onSearchChange={setSearchAuthor}
          newInput={newAuthorInput}
          onNewInputChange={setNewAuthorInput}
          onAddNew={(type) => addNewTag(type ?? "author")}
          newItems={newAuthors}
          onDeleteNewItem={(deletedItem) =>
            setNewAuthors((prev) => prev.filter((item) => item !== deletedItem))
          }
          items={authorsTags} // [{id,name}]
          deletedNames={deletedNames(authorsTags, deletedAuthors.map((a) => a.id))}
          onDeleteExisting={(name) => {
            const tag = authorsTags.find((a) => a.name === name);
            if (tag) setDeletedAuthors((prev) => [...prev, tag]);
          }}
          sentinelRef={authorsRef}
          loading={loadingAuthors}
          hasMore={hasMoreAuthors}
          texts={{
            searchPlaceholder: t("manage_site.search_authors"),
            addPlaceholder: t("manage_site.add_new_author"),
            newItemsTitle: t("manage_site.new_authors_to_add"),
            loadingText: t("manage_site.loading"),
            noMoreText: t("manage_site.no_more_authors"),
            addButtonLabel: "Add",
          }}
        />

        {/* Artists */}
        <TagSection
          typeKey="artist"
          searchValue={searchArtist}
          onSearchChange={setSearchArtist}
          newInput={newArtistInput}
          onNewInputChange={setNewArtistInput}
          onAddNew={(type) => addNewTag(type ?? "artist")}
          newItems={newArtists}
          onDeleteNewItem={(deletedItem) =>
            setNewArtists((prev) => prev.filter((item) => item !== deletedItem))
          }
          items={artistsTags} // [{id,name}]
          deletedNames={deletedNames(artistsTags, deletedArtists.map((a) => a.id))}
          onDeleteExisting={(name) => {
            const tag = artistsTags.find((a) => a.name === name);
            if (tag) setDeletedArtists((prev) => [...prev, tag]);
          }}
          sentinelRef={artistsRef}
          loading={loadingArtists}
          hasMore={hasMoreArtists}
          texts={{
            searchPlaceholder: t("manage_site.search_artists"),
            addPlaceholder: t("manage_site.add_new_artist"),
            newItemsTitle: t("manage_site.new_artists_to_add"),
            loadingText: t("manage_site.loading"),
            noMoreText: t("manage_site.no_more_artists"),
            addButtonLabel: "Add",
          }}
        />

        {/* Keywords */}
        <TagSection
          typeKey="keyword"
          searchValue={searchKeyword}
          onSearchChange={setSearchKeyword}
          newInput={newKeywordInput}
          onNewInputChange={setNewKeywordInput}
          onAddNew={(type) => addNewTag(type ?? "keyword")}
          newItems={newKeywords}
          onDeleteNewItem={(deletedItem) =>
            setNewKeywords((prev) => prev.filter((item) => item !== deletedItem))
          }
          items={keywordsTags} // [{id,name}]
          deletedNames={deletedNames(keywordsTags, deletedKeywords.map((a) => a.id))}
          onDeleteExisting={(name) => {
            const tag = keywordsTags.find((a) => a.name === name);
            if (tag) setDeletedKeywords((prev) => [...prev, tag]);
          }}
          sentinelRef={keywordsRef}
          loading={loadingKeywords}
          hasMore={hasMoreKeywords}
          texts={{
            searchPlaceholder: t("manage_site.search_keywords"),
            addPlaceholder: t("manage_site.add_new_keyword"),
            newItemsTitle: t("manage_site.new_keywords_to_add"),
            loadingText: t("manage_site.loading"),
            noMoreText: t("manage_site.no_more_keywords"),
            addButtonLabel: "Add",
          }}
        />
   
        {/* Genres */}

        <TagSection
          typeKey="artist"
          searchValue={searchGenre}
          onSearchChange={setSearchGenre}
          newInput={newGenreInput}
          onNewInputChange={setNewGenreInput}
          onAddNew={(type) => addNewTag(type ?? "Genre")}
          newItems={newGenres}
          onDeleteNewItem={(deletedItem) =>
            setNewGenres((prev) => prev.filter((item) => item !== deletedItem))
          }
          items={genresTags} // [{id,name}]
          deletedNames={deletedNames(genresTags, deletedGenres.map((a) => a.id))}
          onDeleteExisting={(name) => {
            const tag = genresTags.find((a) => a.name === name);
            if (tag) setDeletedGenres((prev) => [...prev, tag]);
          }}
          sentinelRef={genresRef}
          loading={loadingGenres}
          hasMore={hasMoreGenres}
          texts={{
            searchPlaceholder: t("manage_site.genres"),
            addPlaceholder: t("manage_site.add_new_genre"),
            newItemsTitle: t("manage_site.new_genres_to_add"),
            loadingText: t("manage_site.loading"),
            noMoreText: t("manage_site.no_more_genres"),
            addButtonLabel: "Add",
          }}
        />
  
      </div>
    </div>
  );
};

export default ManageSite;