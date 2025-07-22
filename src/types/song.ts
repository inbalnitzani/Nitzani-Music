export interface Song {
  id: string;
  title: string;
  artists: string[];
  authors: string[];
  keywords: string[];
  lyrics: string;
  genres: string[];
  year: number;
  link: string;
  is_free: boolean;
  score: number;
}; 

export interface SongFilters {
  keywords?: string[];
  authors?: string[];
  artists?: string[];
  searchText?: string;
  genres?: string[];
}

export interface RawSongFromSupabase {
  id: string;
  title: string;
  lyrics: string;
  year: number;
  link: string;
  is_free: boolean;
  score: number;
  song_artists?: { artists?: { name?: string } | null }[];
  song_authors?: { authors?: { name?: string } | null }[];
  song_keywords?: { keywords?: { name?: string } | null }[];
  song_genres?: { genres?: { name?: string } | null }[];
}
