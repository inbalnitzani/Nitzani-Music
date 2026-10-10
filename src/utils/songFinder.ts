import { supabase } from '../supabaseClient';
import type { ChatMessage, SongFinderResponse } from '../types/songFinder';

// Set VITE_SONG_FINDER_MOCK=true in .env.local to try the page before the
// `suggest-songs` Edge Function exists. Never enable this in production.
const USE_MOCK = import.meta.env.VITE_SONG_FINDER_MOCK === 'true';

export const MAX_MESSAGE_LENGTH = 1000;

/**
 * Sends the conversation to the `suggest-songs` Edge Function.
 * The function searches the catalog on the server and returns up to 5 songs;
 * the catalog itself is never sent to the browser.
 */
export async function askSongFinder(messages: ChatMessage[]): Promise<SongFinderResponse> {
  if (USE_MOCK) return mockResponse();

  const { data, error } = await supabase.functions.invoke<SongFinderResponse>('suggest-songs', {
    body: {
      // Only role + text go to the server; earlier song cards are not resent
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    },
  });

  if (error) throw error;
  if (!data || !Array.isArray(data.songs)) throw new Error('Unexpected response from suggest-songs');
  return data;
}

async function mockResponse(): Promise<SongFinderResponse> {
  await new Promise(resolve => setTimeout(resolve, 1200));
  return {
    reply: 'Here are 5 songs with a confident, young energy that could work for this commercial:',
    songs: [
      { title: 'Sample Song One', artist: 'Sample Artist', link: 'https://www.youtube.com/' },
      { title: 'Sample Song Two', artist: 'Another Artist', link: 'https://www.youtube.com/' },
      { title: 'Sample Song Three', artist: 'Sample Band', link: null },
      { title: 'Sample Song Four', artist: 'Sample Artist', link: 'https://www.youtube.com/' },
      { title: 'Sample Song Five', artist: 'Sample Singer', link: 'https://www.youtube.com/' },
    ],
  };
}
