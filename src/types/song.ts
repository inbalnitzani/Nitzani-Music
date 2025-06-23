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
}