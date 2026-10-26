-- Song finder: vector search over the catalog.
-- Embeddings are 1536-dim vectors from Gemini (gemini-embedding-2), written by the
-- embed-songs Edge Function and searched by the suggest-songs Edge Function.

-- The ivfflat index was built on an empty column, so its lists are meaningless.
-- HNSW needs no training data and keeps recall as songs are added.
drop index if exists public.songs_embedding_ivfflat;
create index songs_embedding_hnsw on public.songs using hnsw (embedding vector_cosine_ops);

-- A song's embedding goes stale when its text changes. Clear it so the backfill
-- picks the song up again; SongForm also re-embeds right after saving.
create or replace function public.clear_song_embedding()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.title is distinct from old.title or new.lyrics is distinct from old.lyrics
     or new.year is distinct from old.year then
    new.embedding := null;
  end if;
  return new;
end;
$$;
revoke execute on function public.clear_song_embedding() from public, anon, authenticated;

create trigger songs_clear_embedding
  before update on public.songs
  for each row execute function public.clear_song_embedding();

-- Closest songs to a query embedding, with their names flattened for the prompt.
-- Only the Edge Functions (service role) call this: clients never see the catalog.
create or replace function public.match_songs(query_embedding vector(1536), match_count integer default 40)
returns table (
  id integer,
  title text,
  lyrics text,
  year integer,
  link text,
  artists text,
  authors text,
  genres text,
  keywords text,
  similarity double precision
)
language sql
stable
set search_path = public, extensions
as $$
  select
    s.id, s.title, s.lyrics, s.year, s.link,
    (select string_agg(a.name, ', ') from song_artists sa join artists a on a.id = sa.artist_id where sa.song_id = s.id),
    (select string_agg(a.name, ', ') from song_authors sa join authors a on a.id = sa.author_id where sa.song_id = s.id),
    (select string_agg(g.name, ', ') from song_genres sg join genres g on g.id = sg.genre_id where sg.song_id = s.id),
    (select string_agg(k.name, ', ') from song_keywords sk join keywords k on k.id = sk.keyword_id where sk.song_id = s.id),
    1 - (s.embedding <=> query_embedding)
  from (
    select * from songs
    where embedding is not null
    order by embedding <=> query_embedding
    limit least(match_count, 100)
  ) s
  order by s.embedding <=> query_embedding;
$$;
revoke execute on function public.match_songs(vector, integer) from public, anon, authenticated;
grant execute on function public.match_songs(vector, integer) to service_role;
