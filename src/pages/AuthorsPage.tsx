import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Camera, Check, Music, Search } from 'lucide-react';
import PersonPhoto from '../components/PersonPhoto';
import PhotoFramer from '../components/PhotoFramer';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import type { Person, PersonKind } from '../types/person';
import { fetchPeople, MAX_PHOTO_BYTES, PHOTO_TYPES, savePhotoFraming, setRepresented, uploadPhoto } from '../utils/people';

const TABS: { kind: PersonKind; labelKey: string }[] = [
  { kind: 'authors', labelKey: 'people.tab_writers' },
  { kind: 'artists', labelKey: 'people.tab_performers' },
];

// Admins viewing everyone can have 1,000+ cards; draw them a batch at a time
const BATCH_SIZE = 60;

// Admin-only: which people to list. Regular users always get represented people.
type RepresentedView = 'represented' | 'not_represented' | 'all';
const VIEWS: { view: RepresentedView; labelKey: string }[] = [
  { view: 'represented', labelKey: 'people.view_represented' },
  { view: 'not_represented', labelKey: 'people.view_not_represented' },
  { view: 'all', labelKey: 'people.view_all' },
];

export default function AuthorsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { role } = useProfile(user);
  const isAdmin = role === 'admin';

  const [kind, setKind] = useState<PersonKind>('authors');
  const [adminView, setAdminView] = useState<RepresentedView>('represented');
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Holds a translation key so switching language doesn't refetch
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState(BATCH_SIZE);

  const view: RepresentedView = isAdmin ? adminView : 'represented';

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchPeople(kind, view !== 'represented')
      // Filtered once per load, so a card toggled here stays put until the view changes
      .then(data => { if (!cancelled) setPeople(view === 'not_represented' ? data.filter(p => !p.is_represented) : data); })
      .catch(err => {
        console.error('People load error:', err);
        if (!cancelled) setError('people.load_error');
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [kind, view]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? people.filter(p => p.name.toLowerCase().includes(q)) : people;
  }, [people, query]);

  // Start from the first batch whenever the list or filter changes
  useEffect(() => setShown(BATCH_SIZE), [kind, view, query]);

  const updatePerson = (id: number, patch: Partial<Person>) =>
    setPeople(list => list.map(p => (p.id === id ? { ...p, ...patch } : p)));

  return (
    <div className="native-flex min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-68px)]">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-10 lg:px-[120px] pt-12 lg:pt-16 pb-16">
        <div className="enter-up max-w-[640px]">
          <span className="eyebrow">{t('people.eyebrow')}</span>
          <h1 className="display-title mt-5 text-[40px] sm:text-[52px] text-[var(--color-text)]">{t('people.title')}</h1>
          <p className="mt-4 text-[17px] sm:text-[19px] leading-[1.55] text-[var(--color-text-soft)]">{t('people.subtitle')}</p>
        </div>

        {/* Tabs, name filter and admin view switch */}
        {/* Wrapping rows, not flex-col + sm:flex-row: the global `.rtl .native-flex .flex.flex-col` rule would keep them stacked */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <div role="tablist" aria-label={t('people.title')} className="flex gap-1 p-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] self-start">
            {TABS.map(tab => (
              <button
                key={tab.kind}
                type="button"
                role="tab"
                aria-selected={kind === tab.kind}
                onClick={() => setKind(tab.kind)}
                className={`px-4 py-2 rounded-lg text-[15px] font-medium transition-[transform,background-color,color] duration-150 active:scale-[0.97] ${
                  kind === tab.kind
                    ? 'bg-[var(--color-text)] text-white'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {isAdmin && (
              <div role="radiogroup" aria-label={t('people.admin_view')} className="flex gap-0.5 p-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
                {VIEWS.map(v => (
                  <button
                    key={v.view}
                    type="button"
                    role="radio"
                    aria-checked={adminView === v.view}
                    onClick={() => setAdminView(v.view)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-[transform,background-color,color] duration-150 active:scale-[0.97] ${
                      adminView === v.view
                        ? 'bg-[var(--color-surface)] text-[var(--color-text)] font-medium shadow-[0_1px_2px_rgb(23_20_18/0.08)]'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {t(v.labelKey)}
                  </button>
                ))}
              </div>
            )}
            <label className="relative block w-full sm:w-72">
              <span className="sr-only">{t('people.filter_name')}</span>
              <Search size={18} strokeWidth={1.75} className="absolute top-1/2 -translate-y-1/2 start-4 text-[var(--color-muted)] pointer-events-none" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('people.filter_name')}
                className="input-base w-full ps-11"
              />
            </label>
          </div>
        </div>

        {error && (
          <div role="alert" className="mt-6 bg-[var(--color-danger-bg)] text-[var(--color-danger)] px-4 py-3 rounded-xl">{t(error)}</div>
        )}

        <div className="mt-8" aria-live="polite" aria-busy={isLoading}>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex flex-col items-center rounded-[20px] bg-[var(--color-surface)] border border-[var(--color-border)] p-6" style={{ opacity: 1 - i * 0.12 }}>
                  <div className="skeleton w-28 h-28" />
                  <div className="skeleton mt-5 h-4 w-36" />
                  <div className="skeleton mt-2.5 h-2.5 w-16" />
                  <div className="mt-6 w-full space-y-3.5">
                    {[170, 130, 190, 120, 150].map(w => <div key={w} className="skeleton h-2.5" style={{ width: w }} />)}
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length === 0 && !error ? (
            <p className="py-16 text-center text-[17px] text-[var(--color-muted)]">
              {query.trim() ? t('people.no_match') : isAdmin && view === 'represented' ? t('people.empty_admin') : t('people.empty')}
            </p>
          ) : (
            <>
              <p className="mb-4 text-xs font-medium text-[var(--color-muted)]">{t('people.count', { count: visible.length })}</p>
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visible.slice(0, shown).map((person, i) => (
                  <PersonCard
                    key={`${kind}-${person.id}`}
                    kind={kind}
                    person={person}
                    isAdmin={isAdmin}
                    delay={Math.min(i, 8) * 40}
                    onChange={patch => updatePerson(person.id, patch)}
                  />
                ))}
              </ul>
              {visible.length > shown && (
                <div className="mt-8 flex justify-center">
                  <button type="button" onClick={() => setShown(n => n + BATCH_SIZE)} className="btn btn-secondary">
                    {t('people.show_more', { count: Math.min(BATCH_SIZE, visible.length - shown) })}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PersonCard({ kind, person, isAdmin, delay, onChange }: {
  kind: PersonKind;
  person: Person;
  isAdmin: boolean;
  delay: number;
  onChange: (patch: Partial<Person>) => void;
}) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'photo' | 'represented' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFraming, setIsFraming] = useState(false);

  const framing = { x: person.photo_x, y: person.photo_y, zoom: person.photo_zoom };

  // First letter of the first two words, skipping punctuation (some names start with ":" or quotes)
  const initials = person.name.split(/\s+/).map(w => w.match(/\p{L}/u)?.[0]).filter(Boolean).slice(0, 2).join('').toLocaleUpperCase();
  const extra = person.song_count - person.top_songs.length;

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) return setError(t('people.photo_type_error'));
    if (file.size > MAX_PHOTO_BYTES) return setError(t('people.photo_size_error'));
    setBusy('photo');
    setError(null);
    try {
      const { path, url } = await uploadPhoto(kind, person, file);
      onChange({ photo_path: path, photo_url: url, photo_x: 50, photo_y: 50, photo_zoom: 1 });
      // Straight into framing, since a new photo is rarely centred right
      setIsFraming(true);
    } catch (err) {
      console.error('Photo upload error:', err);
      setError(t('people.photo_error'));
    } finally {
      setBusy(null);
    }
  };

  const toggleRepresented = async () => {
    const next = !person.is_represented;
    setBusy('represented');
    setError(null);
    try {
      await setRepresented(kind, person.id, next);
      onChange({ is_represented: next });
    } catch (err) {
      console.error('Represented update error:', err);
      setError(t('people.save_error'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <li className="person-card enter-up flex flex-col rounded-[20px] bg-[var(--color-surface)] border border-[var(--color-border)] p-6" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          {person.photo_url ? (
            <PersonPhoto url={person.photo_url} framing={framing} className="w-28 h-28" />
          ) : (
            <div className="w-28 h-28 rounded-full flex items-center justify-center bg-[var(--color-primary-light)] text-[var(--color-primary)] text-[34px] font-semibold" aria-hidden>
              {initials}
            </div>
          )}
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => (person.photo_url ? setIsFraming(true) : fileRef.current?.click())}
                disabled={busy !== null}
                aria-label={t(person.photo_url ? 'people.edit_photo' : 'people.upload_photo', { name: person.name })}
                className="absolute bottom-0.5 end-0.5 w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-soft)] hover:text-[var(--color-primary)] transition-[transform,color] duration-150 active:scale-[0.94] disabled:opacity-60"
              >
                {busy === 'photo'
                  ? <span className="w-3.5 h-3.5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-[spin_0.6s_linear_infinite]" aria-hidden />
                  : <Camera size={15} strokeWidth={1.75} aria-hidden />}
              </button>
              <input ref={fileRef} type="file" accept={PHOTO_TYPES.join(',')} onChange={handleFile} className="hidden" />
              {isFraming && person.photo_url && (
                <PhotoFramer
                  name={person.name}
                  photoUrl={person.photo_url}
                  initial={framing}
                  onSave={async f => {
                    await savePhotoFraming(kind, person.id, f);
                    onChange({ photo_x: f.x, photo_y: f.y, photo_zoom: f.zoom });
                  }}
                  onReplace={() => { setIsFraming(false); fileRef.current?.click(); }}
                  onClose={() => setIsFraming(false)}
                />
              )}
            </>
          )}
        </div>
        <h2 className="mt-4 w-full text-[20px] font-medium leading-tight text-[var(--color-text)] truncate"><bdi>{person.name}</bdi></h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{t('people.song_count', { count: person.song_count })}</p>
      </div>

      {person.top_songs.length > 0 ? (
        <ol className="mt-5 border-t border-[var(--color-border)]">
          {person.top_songs.map((song, i) => (
            <li key={song.id} className="border-b border-[var(--color-border)] last:border-b-0">
              {song.link ? (
                <a
                  href={song.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="song-link flex items-center gap-3 py-2.5 text-[15px] text-[var(--color-text-soft)]"
                >
                  <SongIndex n={i + 1} />
                  <span className="min-w-0 flex-1 truncate"><bdi>{song.title}</bdi></span>
                  <ArrowUpRight size={15} strokeWidth={1.75} className="song-arrow shrink-0 rtl:-scale-x-100" aria-hidden />
                </a>
              ) : (
                <div className="flex items-center gap-3 py-2.5 text-[15px] text-[var(--color-text-soft)]">
                  <SongIndex n={i + 1} />
                  <span className="min-w-0 flex-1 truncate"><bdi>{song.title}</bdi></span>
                  <Music size={15} strokeWidth={1.5} className="shrink-0 text-[var(--color-border)]" aria-hidden />
                </div>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-5 pt-4 border-t border-[var(--color-border)] text-center text-sm text-[var(--color-muted)]">{t('people.no_songs')}</p>
      )}
      {extra > 0 && <p className="mt-2 text-xs text-[var(--color-muted)]">{t('people.more_songs', { count: extra })}</p>}

      {error && <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>}

      {isAdmin && (
        <div className="mt-auto pt-5 flex justify-center">
          <button
            type="button"
            aria-pressed={person.is_represented}
            onClick={toggleRepresented}
            disabled={busy !== null}
            className={`refine-chip ${person.is_represented ? '!border-[var(--color-primary)] !text-[var(--color-primary)]' : ''}`}
          >
            {person.is_represented && <Check size={14} strokeWidth={2} aria-hidden />}
            {person.is_represented ? t('people.represented') : t('people.mark_represented')}
          </button>
        </div>
      )}
    </li>
  );
}

function SongIndex({ n }: { n: number }) {
  return <span className="shrink-0 w-5 text-xs text-[var(--color-muted)] tabular-nums">{String(n).padStart(2, '0')}</span>;
}
