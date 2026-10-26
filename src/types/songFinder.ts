// What the client sees for each suggested song
export interface SuggestedSong {
  title: string;
  artist: string;
  link: string | null;
  reason: string; // why the song fits the brief, in the brief's language
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
