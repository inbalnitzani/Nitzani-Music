-- People page (/authors): writers and performers the company represents, each
-- with a photo and their top songs.
--
-- 1. songs.score becomes numeric. It was text, so "9" sorted above "10".
--    Values that aren't plain numbers become null.
-- 2. authors/artists get is_represented (only represented people are listed
--    for regular users) and photo_path (an object in the people-photos bucket).
-- 3. list_people() returns one tab of the page in a single call. The catalog
--    tables are admin-only, so it runs as security definer and exposes only
--    represented people unless an admin asks for everyone.

-- ============================================================
-- Score as a number
-- ============================================================
alter table public.songs
  alter column score type numeric
  using (case when trim(score) ~ '^-?[0-9]+(\.[0-9]+)?$' then trim(score)::numeric end);

-- ============================================================
-- Represented flag and photo
-- ============================================================
alter table public.authors
  add column is_represented boolean not null default false,
  add column photo_path text;

alter table public.artists
  add column is_represented boolean not null default false,
  add column photo_path text;

-- ============================================================
-- Photo storage: signed-in users view, admins upload
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('people-photos', 'people-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "people-photos read" on storage.objects
  for select to authenticated using (bucket_id = 'people-photos');
create policy "people-photos admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'people-photos' and (select private.is_admin()));
create policy "people-photos admin update" on storage.objects
  for update to authenticated using (bucket_id = 'people-photos' and (select private.is_admin()))
  with check (bucket_id = 'people-photos' and (select private.is_admin()));
create policy "people-photos admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'people-photos' and (select private.is_admin()));

-- ============================================================
-- One tab of the page
-- ============================================================
-- kind: 'authors' (writers) or 'artists' (performers).
-- include_all: admins only; also returns people who aren't represented.
create or replace function public.list_people(kind text, include_all boolean default false)
returns table (
  id integer,
  name text,
  photo_path text,
  is_represented boolean,
  song_count integer,
  top_songs jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with people as (
    select a.id, a.name, a.photo_path, a.is_represented from public.authors a where kind = 'authors'
    union all
    select r.id, r.name, r.photo_path, r.is_represented from public.artists r where kind = 'artists'
  ),
  links as (
    select sa.author_id as person_id, sa.song_id from public.song_authors sa where kind = 'authors'
    union all
    select sr.artist_id, sr.song_id from public.song_artists sr where kind = 'artists'
  )
  select
    p.id,
    p.name,
    p.photo_path,
    p.is_represented,
    (select count(*)::integer from links l where l.person_id = p.id),
    coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'title', s.title, 'link', s.link, 'score', s.score)
                       order by s.score desc nulls last, s.title)
      from (
        select s.id, s.title, s.link, s.score
        from links l
        join public.songs s on s.id = l.song_id
        where l.person_id = p.id
        order by s.score desc nulls last, s.title
        limit 5
      ) s
    ), '[]'::jsonb)
  from people p
  where p.is_represented or (include_all and (select private.is_admin()))
  order by p.name;
$$;
revoke all on function public.list_people(text, boolean) from public, anon;
grant execute on function public.list_people(text, boolean) to authenticated;
