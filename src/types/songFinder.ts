// What the client sees for each suggested song
export interface SuggestedSong {
  title: string;
  artist: string;
  link: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  songs?: SuggestedSong[];
}

// Response from the `suggest-songs` Edge Function
export interface SongFinderResponse {
  reply: string;
  songs: SuggestedSong[];
}
