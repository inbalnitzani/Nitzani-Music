// Writes Gemini embeddings into songs.embedding. Admin only.
//   { song_ids: [1, 2] }  re-embeds those songs (SongForm calls this after a save)
//   {}                    embeds the next batch of songs that have no embedding yet
// Returns { embedded, remaining }; the admin page keeps calling until remaining is 0.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/http.ts';
import { documentText, embedMany, GeminiRateLimitError } from '../_shared/gemini.ts';
import { songDocument } from '../_shared/songs.ts';

const BATCH_SIZE = 50;

type Named = { name?: string } | null;
interface SongRow {
  id: number;
  title: string | null;
  lyrics: string | null;
  year: number | null;
  song_artists: { artists: Named }[];
  song_authors: { authors: Named }[];
  song_genres: { genres: Named }[];
  song_keywords: { keywords: Named }[];
}

const names = (rows: Named[]) => rows.map(r => r?.name).filter(Boolean).join(', ') || null;

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // Check the caller is an admin, using their own token (RLS lets them read their profile)
  const asUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user } } = await asUser.auth.getUser();
  if (!user) return json({ error: 'Not signed in' }, 401);
  const { data: profile } = await asUser.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return json({ error: 'Admins only' }, 403);

  const body = await req.json().catch(() => ({}));
  const songIds: unknown = body?.song_ids;
  if (songIds !== undefined && (!Array.isArray(songIds) || !songIds.every(Number.isInteger) || songIds.length > BATCH_SIZE)) {
    return json({ error: `song_ids must be up to ${BATCH_SIZE} integers` }, 400);
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    let query = admin
      .from('songs')
      .select('id, title, lyrics, year, song_artists(artists(name)), song_authors(authors(name)), song_genres(genres(name)), song_keywords(keywords(name))');
    query = Array.isArray(songIds)
      ? query.in('id', songIds)
      : query.is('embedding', null).order('id').limit(BATCH_SIZE);
    const { data, error } = await query;
    if (error) throw error;
    const songs = (data ?? []) as unknown as SongRow[];

    if (songs.length > 0) {
      const vectors = await embedMany(songs.map(s => documentText(s.title, songDocument({
        title: s.title,
        lyrics: s.lyrics,
        year: s.year,
        artists: names(s.song_artists.map(r => r.artists)),
        authors: names(s.song_authors.map(r => r.authors)),
        genres: names(s.song_genres.map(r => r.genres)),
        keywords: names(s.song_keywords.map(r => r.keywords)),
      }))));

      for (let i = 0; i < songs.length; i++) {
        const { error: updateError } = await admin
          .from('songs')
          .update({ embedding: JSON.stringify(vectors[i]) })
          .eq('id', songs[i].id);
        if (updateError) throw updateError;
      }
    }

    const { count } = await admin.from('songs').select('id', { count: 'exact', head: true }).is('embedding', null);
    return json({ embedded: songs.length, remaining: count ?? 0 });
  } catch (err) {
    if (err instanceof GeminiRateLimitError) return json({ error: 'Gemini rate limit, wait a minute', rate_limited: true }, 429);
    console.error('embed-songs failed:', err);
    return json({ error: 'Something went wrong' }, 500);
  }
});
