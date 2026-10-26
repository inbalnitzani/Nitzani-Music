// Writers live in the authors table, performers in artists
export type PersonKind = 'authors' | 'artists';

export interface PersonSong {
  id: number;
  title: string;
  link: string | null;
  score: number | null;
}

/** Which part of the photo shows in the round frame; see PersonPhoto */
export interface PhotoFraming {
  x: number;
  y: number;
  zoom: number;
}

export interface Person {
  id: number;
  name: string;
  photo_path: string | null;
  photo_x: number;
  photo_y: number;
  photo_zoom: number;
  is_represented: boolean;
  song_count: number;
  top_songs: PersonSong[];
  /** Signed URL for photo_path, filled in on the client */
  photo_url?: string;
}
