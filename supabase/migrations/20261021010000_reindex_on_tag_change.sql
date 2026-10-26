-- Song Finder embeddings include a song's artists, writers, genres and keywords.
-- When those links or names change, clear the affected songs' embeddings so the
-- "Index songs" backfill picks them up again. Deleting a tag cascades to the link
-- tables, so the link triggers cover deletes too.

create or replace function public.clear_embedding_for_link()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.songs set embedding = null
  where id = coalesce(new.song_id, old.song_id) and embedding is not null;
  return null;
end;
$$;
revoke execute on function public.clear_embedding_for_link() from public, anon, authenticated;

create or replace function public.clear_embedding_for_tag_rename()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.name is distinct from old.name then
    execute format(
      'update public.songs set embedding = null where embedding is not null and id in (select song_id from public.%I where %I = $1)',
      tg_argv[0], tg_argv[1]
    ) using new.id;
  end if;
  return null;
end;
$$;
revoke execute on function public.clear_embedding_for_tag_rename() from public, anon, authenticated;

create trigger song_artists_clear_embedding  after insert or delete on public.song_artists  for each row execute function public.clear_embedding_for_link();
create trigger song_authors_clear_embedding  after insert or delete on public.song_authors  for each row execute function public.clear_embedding_for_link();
create trigger song_genres_clear_embedding   after insert or delete on public.song_genres   for each row execute function public.clear_embedding_for_link();
create trigger song_keywords_clear_embedding after insert or delete on public.song_keywords for each row execute function public.clear_embedding_for_link();

create trigger artists_clear_embedding  after update on public.artists  for each row execute function public.clear_embedding_for_tag_rename('song_artists', 'artist_id');
create trigger authors_clear_embedding  after update on public.authors  for each row execute function public.clear_embedding_for_tag_rename('song_authors', 'author_id');
create trigger genres_clear_embedding   after update on public.genres   for each row execute function public.clear_embedding_for_tag_rename('song_genres', 'genre_id');
create trigger keywords_clear_embedding after update on public.keywords for each row execute function public.clear_embedding_for_tag_rename('song_keywords', 'keyword_id');
