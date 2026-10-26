-- Photo framing on the People page: admins choose which part of a photo shows
-- inside the round frame.
--
-- photo_x / photo_y: the point of the photo (0–100% across / down) that sits at
-- the same point of the frame, like CSS object-position. photo_zoom scales the
-- photo around that point (1 = just fills the frame).

alter table public.authors
  add column photo_x real not null default 50 check (photo_x between 0 and 100),
  add column photo_y real not null default 50 check (photo_y between 0 and 100),
  add column photo_zoom real not null default 1 check (photo_zoom between 1 and 4);

alter table public.artists
  add column photo_x real not null default 50 check (photo_x between 0 and 100),
  add column photo_y real not null default 50 check (photo_y between 0 and 100),
  add column photo_zoom real not null default 1 check (photo_zoom between 1 and 4);

-- The return type changes, so the function has to be dropped first
drop function public.list_people(text, boolean);

create function public.list_people(kind text, include_all boolean default false)
returns table (
  id integer,
  name text,
  photo_path text,
  photo_x real,
  photo_y real,
  photo_zoom real,
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
    select a.id, a.name, a.photo_path, a.photo_x, a.photo_y, a.photo_zoom, a.is_represented
    from public.authors a where kind = 'authors'
    union all
    select r.id, r.name, r.photo_path, r.photo_x, r.photo_y, r.photo_zoom, r.is_represented
    from public.artists r where kind = 'artists'
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
    p.photo_x,
    p.photo_y,
    p.photo_zoom,
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
