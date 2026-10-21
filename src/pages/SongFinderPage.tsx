import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowUpRight, Music, Plus } from 'lucide-react';
import type { ChatMessage, SuggestedSong } from '../types/songFinder';
import { askSongFinder, MAX_MESSAGE_LENGTH } from '../utils/songFinder';
import BrandArc from '../components/BrandArc';

const EXAMPLE_KEYS = ['example_1', 'example_2', 'example_3'] as const;
const REFINE_KEYS = ['refine_upbeat', 'refine_hebrew', 'refine_calmer', 'refine_newer'] as const;

export default function SongFinderPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isEmpty = messages.length === 0;
  const hasResults = messages.some(m => m.role === 'assistant');

  useEffect(() => {
    if (messages.length === 0 && !isLoading) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const send = async (text: string) => {
    const brief = text.trim();
    if (!brief || isLoading) return;

    const next: ChatMessage[] = [...messages, { role: 'user', content: brief }];
    setMessages(next);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      const { reply, songs } = await askSongFinder(next);
      setMessages([...next, { role: 'assistant', content: reply, songs: songs.slice(0, 5) }]);
    } catch (err) {
      console.error('Song finder error:', err);
      setError(t('song_finder.error'));
      // Put the brief back so the client can retry without retyping
      setMessages(messages);
      setInput(brief);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const startOver = () => {
    setMessages([]);
    setError(null);
    setInput('');
    inputRef.current?.focus();
  };

  const errorAlert = error && (
    <div role="alert" className="mt-4 bg-[var(--color-danger-bg)] text-[var(--color-danger)] px-4 py-3 rounded-xl">
      {error}
    </div>
  );

  const sendButton = (
    <button
      type="submit"
      disabled={isLoading || !input.trim()}
      aria-label={t('song_finder.send')}
      className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--color-primary)] text-white transition-[transform,background-color] duration-150 active:scale-95 enabled:hover:bg-[var(--color-primary-dark)] disabled:bg-[var(--color-border)] disabled:cursor-not-allowed"
    >
      <ArrowRight size={20} strokeWidth={2} className="rtl:-scale-x-100" aria-hidden />
    </button>
  );

  const textarea = (rows: number, className: string) => (
    <>
      <label htmlFor="song-brief" className="sr-only">{t('song_finder.placeholder')}</label>
      <textarea
        id="song-brief"
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isEmpty ? t('song_finder.placeholder') : t('song_finder.placeholder_followup')}
        maxLength={MAX_MESSAGE_LENGTH}
        rows={rows}
        disabled={isLoading}
        className={`resize-none border-0 p-0 focus:ring-0 bg-transparent text-[var(--color-text)] placeholder:text-[var(--color-muted)] ${className}`}
      />
    </>
  );

  // ===== Empty state: the composer is the page =====
  if (isEmpty && !isLoading) {
    return (
      <div className="song-finder native-flex relative overflow-hidden min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-68px)]">
        <BrandArc
          strokeWidth={3.5}
          className="ltr:-scale-x-100 hidden lg:block absolute pointer-events-none w-[900px] h-[900px] -end-[300px] top-[440px]"
        />
        <div className="relative max-w-[1280px] mx-auto px-5 sm:px-10 lg:px-[120px] pt-12 lg:pt-20 pb-12">
          <div className="enter-up max-w-[640px]">
            <span className="eyebrow">{t('song_finder.eyebrow')}</span>
            <h1 className="display-title mt-5 text-[40px] sm:text-[56px] lg:text-[64px] text-[var(--color-text)]">
              {t('song_finder.hero_title_1')}
              <br />
              {t('song_finder.hero_title_2')}
            </h1>
            <p className="mt-5 max-w-[600px] text-[17px] sm:text-[19px] leading-[1.55] text-[var(--color-text-soft)]">
              {t('song_finder.hero_subtitle')}
            </p>

            <form
              onSubmit={e => { e.preventDefault(); send(input); }}
              className="mt-10 rounded-[20px] bg-[var(--color-surface)] border border-[var(--color-border)] px-5 pt-5 pb-3.5 shadow-[var(--shadow-raised)] transition-[border-color,box-shadow] duration-150 focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_0_3px_rgb(226_10_23/0.15),0_14px_36px_rgb(23_20_18/0.08)]"
            >
              {textarea(3, 'w-full text-[17px] sm:text-[19px] leading-[1.5]')}
              <div className="mt-4 flex items-center justify-between gap-4">
                <span className="hidden sm:block text-[13px] text-[var(--color-muted)]">{t('song_finder.send_hint')}</span>
                <span className="ms-auto">{sendButton}</span>
              </div>
            </form>
            {errorAlert}

            <p className="mt-11 text-sm font-medium text-[var(--color-muted)]">{t('song_finder.examples_label')}</p>
            <div className="mt-1.5">
              {EXAMPLE_KEYS.map(key => (
                <button key={key} type="button" onClick={() => send(t(`song_finder.${key}`))} className="example-row">
                  <span>{t(`song_finder.${key}`)}</span>
                  <span className="row-arrow shrink-0">
                    <ArrowRight size={18} strokeWidth={1.5} className="rtl:-scale-x-100" aria-hidden />
                  </span>
                </button>
              ))}
            </div>

            <p className="mt-10 text-xs text-[var(--color-muted)]">{t('song_finder.disclaimer')}</p>
          </div>
        </div>
      </div>
    );
  }

  // ===== Conversation: brief, reply, tracklist; refine on the side =====
  const firstUserIndex = messages.findIndex(m => m.role === 'user');
  const refineChips = REFINE_KEYS.map(key => (
    <button key={key} type="button" disabled={isLoading} onClick={() => send(t(`song_finder.${key}`))} className="refine-chip">
      {t(`song_finder.${key}`)}
      <Plus size={14} strokeWidth={1.75} className="text-[var(--color-muted)]" aria-hidden />
    </button>
  ));

  return (
    <div className="song-finder native-flex min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-68px)] flex flex-col">
      <div className="w-full max-w-[1280px] mx-auto flex-1 px-5 sm:px-10 lg:px-[120px] pt-8 lg:pt-12 lg:grid lg:grid-cols-[minmax(0,720px)_240px] lg:justify-between lg:gap-16">
        <div className="flex flex-col min-h-full">
          <div className="flex-1 space-y-7" aria-live="polite">
            {messages.map((message, i) =>
              message.role === 'user' ? (
                <figure key={i} className="enter-up border-s-[3px] border-[var(--color-primary)] ps-5">
                  {i === firstUserIndex && (
                    <figcaption className="mb-2 text-[13px] font-medium text-[var(--color-muted)]">{t('song_finder.brief_label')}</figcaption>
                  )}
                  <blockquote className="text-[22px] sm:text-[28px] leading-[1.35] tracking-[-0.01em] text-[var(--color-text)] whitespace-pre-wrap">
                    {message.content}
                  </blockquote>
                </figure>
              ) : (
                <div key={i} className="enter-up">
                  <p className="text-[17px] sm:text-[18px] leading-[1.55] text-[var(--color-text-soft)] whitespace-pre-wrap">
                    {message.content}
                  </p>
                  {message.songs && message.songs.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between px-2 sm:px-4 pb-2.5 text-xs font-medium text-[var(--color-muted)]">
                        <span>{t('song_finder.results_count', { count: message.songs.length })}</span>
                        <span aria-hidden>{t('song_finder.listen')}</span>
                      </div>
                      <ol className="border-t border-[var(--color-border)]">
                        {message.songs.map((song, j) => (
                          <TrackRow key={j} song={song} index={j + 1} delay={60 + j * 40} />
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )
            )}

            {isLoading && (
              <div className="enter-up">
                <div className="flex items-center gap-3 text-[17px] sm:text-[18px] text-[var(--color-text-soft)]" role="status">
                  {t('song_finder.thinking')}
                  <span className="equaliser" aria-hidden><span /><span /><span /><span /></span>
                </div>
                <ol className="mt-6 border-t border-[var(--color-border)]" aria-hidden>
                  {[180, 140, 210, 160, 120].map((w, j) => (
                    <li key={j} className="flex items-center gap-4 sm:gap-6 px-2 sm:px-4 py-4 border-b border-[var(--color-border)]" style={{ opacity: 1 - j * 0.15 }}>
                      <span className="track-index !text-[var(--color-border)]">{String(j + 1).padStart(2, '0')}</span>
                      <div className="flex-1 space-y-2.5">
                        <div className="skeleton h-3.5" style={{ width: w }} />
                        <div className="skeleton h-2.5" style={{ width: w * 0.6 }} />
                      </div>
                      <div className="skeleton h-2.5 w-14" />
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {errorAlert}

            {/* Refine on phones: one scrolling row under the results */}
            {hasResults && (
              <div className="lg:hidden -mx-5 px-5 sm:-mx-10 sm:px-10 flex gap-2 overflow-x-auto pb-1">
                {refineChips}
                <button type="button" onClick={startOver} className="refine-chip">
                  {t('song_finder.new_search')}
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Follow-up composer */}
          <form
            onSubmit={e => { e.preventDefault(); send(input); }}
            className="sticky bottom-0 mt-8 pt-3 pb-4 bg-[var(--color-bg)]"
          >
            <div className="flex items-end gap-2 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-2.5 shadow-[var(--shadow-raised)] transition-[border-color,box-shadow] duration-150 focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_0_3px_rgb(226_10_23/0.15),0_14px_36px_rgb(23_20_18/0.08)]">
              {textarea(1, 'flex-1 text-base px-2 py-2.5')}
              {sendButton}
            </div>
            <p className="lg:hidden mt-2 px-1 text-xs text-[var(--color-muted)]">{t('song_finder.disclaimer')}</p>
          </form>
        </div>

        {/* Refine on desktop */}
        <aside className="hidden lg:block sticky top-8 self-start pt-6">
          <p className="text-[13px] font-medium text-[var(--color-muted)]">{t('song_finder.refine_title')}</p>
          <div className="mt-3.5 flex flex-col items-start gap-2.5">{refineChips}</div>
          <button
            type="button"
            onClick={startOver}
            className="mt-8 inline-flex items-center gap-2 text-[15px] font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
          >
            {t('song_finder.new_search')}
            <Plus size={16} strokeWidth={1.75} aria-hidden />
          </button>
          <p className="mt-8 text-xs leading-[1.5] text-[var(--color-muted)]">{t('song_finder.disclaimer')}</p>
        </aside>
      </div>
    </div>
  );
}

function TrackRow({ song, index, delay }: { song: SuggestedSong; index: number; delay: number }) {
  const { t } = useTranslation();
  return (
    <li className="track-row enter-up" style={{ animationDelay: `${delay}ms` }}>
      <span className="track-index">{String(index).padStart(2, '0')}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[17px] sm:text-[19px] font-medium text-[var(--color-text)] truncate">{song.title}</div>
        <div className="text-sm sm:text-[15px] text-[var(--color-muted)] truncate">{song.artist}</div>
        {song.reason && (
          <p className="mt-1.5 text-sm sm:text-[15px] leading-[1.5] text-[var(--color-text-soft)]">{song.reason}</p>
        )}
      </div>
      {song.link ? (
        <a
          href={song.link}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 text-[15px] font-medium text-[var(--color-text-soft)] hover:text-[var(--color-primary)] transition-colors"
        >
          <ArrowUpRight size={16} strokeWidth={1.75} className="rtl:-scale-x-100" aria-hidden />
          {t('song_finder.listen')}
        </a>
      ) : (
        <Music size={18} strokeWidth={1.5} className="shrink-0 text-[var(--color-border)]" aria-hidden />
      )}
    </li>
  );
}
