// How a song is described to the embedding model. embed-songs and suggest-songs
// must agree on this, so it lives in one place.
export interface SongFields {
  title: string | null;
  lyrics: string | null;
  year: number | null;
  artists: string | null;
  authors: string | null;
  genres: string | null;
  keywords: string | null;
}

const LYRICS_LIMIT = 3000;

export function songDocument(s: SongFields): string {
  const lines = [
    s.artists && `Artist: ${s.artists}`,
    s.authors && `Writers: ${s.authors}`,
    s.genres && `Genres: ${s.genres}`,
    s.keywords && `Keywords: ${s.keywords}`,
    s.year && `Year: ${s.year}`,
    s.lyrics && `Lyrics: ${s.lyrics.slice(0, LYRICS_LIMIT)}`,
  ].filter(Boolean);
  return lines.join('\n');
}
