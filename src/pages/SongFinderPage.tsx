import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Music, ExternalLink, Sparkles, ChevronRight } from 'lucide-react';
import type { ChatMessage, SuggestedSong } from '../types/songFinder';
import { askSongFinder, MAX_MESSAGE_LENGTH } from '../utils/songFinder';

const EXAMPLE_KEYS = ['example_1', 'example_2', 'example_3'] as const;

export default function SongFinderPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
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

  return (
    <div className="song-finder native-flex min-h-[calc(100vh-4.5rem)] bg-[var(--color-bg)] flex flex-col">
      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col px-4 py-6 sm:py-10">
        {/* Title */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[26px] sm:text-[32px] leading-tight font-semibold text-[var(--color-text)]">
              {t('song_finder.title')}
            </h1>
            <p className="mt-1.5 sm:text-[17px] text-[var(--color-muted)]">{t('song_finder.subtitle')}</p>
          </div>
          {messages.length > 0 && (
            <button type="button" onClick={startOver} className="btn btn-secondary text-sm shrink-0">
              {t('song_finder.new_search')}
            </button>
          )}
        </div>

        {/* Conversation */}
        <div className="flex-1 space-y-5" aria-live="polite">
          {messages.length === 0 && !isLoading && (
            <div className="enter-up bg-white border border-[var(--color-border)] rounded-2xl p-5 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2.5 mb-3 text-[17px] font-medium text-[var(--color-text)]">
                <span className="w-7 h-7 shrink-0 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
                  <Sparkles size={16} aria-hidden />
                </span>
                {t('song_finder.how_it_works_title')}
              </div>
              <p className="text-[var(--color-text)] leading-[1.65]">{t('song_finder.how_it_works')}</p>

              <hr className="my-5 border-[var(--color-border)]" />
              <p className="mb-3 text-[13px] font-medium text-[var(--color-muted)]">
                {t('song_finder.try_example')}
              </p>
              <div className="flex flex-col gap-2">
                {EXAMPLE_KEYS.map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => send(t(`song_finder.${key}`))}
                    className="example-prompt flex items-center justify-between gap-3 text-start text-[15px] px-4 py-3.5 rounded-xl text-[var(--color-text)]"
                  >
                    <span>{t(`song_finder.${key}`)}</span>
                    <ChevronRight size={16} className="example-chevron shrink-0 text-[#a8a29e] rtl:-scale-x-100 transition-colors" aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, i) =>
            message.role === 'user' ? (
              <div key={i} className="enter-up flex justify-end">
                <div className="max-w-[85%] bg-[var(--color-primary)] text-white rounded-[18px] rounded-ee-md px-4 py-3 leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            ) : (
              <div key={i} className="enter-up max-w-[95%]">
                <div className="bg-white border border-[var(--color-border)] rounded-[18px] rounded-es-md px-4 py-3 leading-relaxed text-[var(--color-text)] whitespace-pre-wrap">
                  {message.content}
                </div>
                {message.songs && message.songs.length > 0 && (
                  <ol className="mt-3 grid gap-2">
                    {message.songs.map((song, j) => (
                      <SongCard key={j} song={song} index={j + 1} delay={60 + j * 40} />
                    ))}
                  </ol>
                )}
              </div>
            )
          )}

          {isLoading && (
            <div className="enter-up flex items-center gap-3 text-[var(--color-muted)]">
              <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-[spin_0.6s_linear_infinite]" />
              {t('song_finder.thinking')}
            </div>
          )}

          {error && (
            <div role="alert" className="bg-[var(--color-danger-bg)] text-[var(--color-danger)] px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={e => {
            e.preventDefault();
            send(input);
          }}
          className="sticky bottom-0 mt-6 pt-3 pb-2 bg-[var(--color-bg)]"
        >
          <div className="flex items-end gap-2 bg-white border border-[var(--color-border)] rounded-[18px] p-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-[border-color,box-shadow] duration-150 focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_0_3px_rgb(226_10_23/0.15),0_4px_16px_rgba(0,0,0,0.06)]">
            <label htmlFor="song-brief" className="sr-only">{t('song_finder.placeholder')}</label>
            <textarea
              id="song-brief"
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={messages.length === 0 ? t('song_finder.placeholder') : t('song_finder.placeholder_followup')}
              maxLength={MAX_MESSAGE_LENGTH}
              rows={2}
              disabled={isLoading}
              className="flex-1 resize-none border-0 focus:ring-0 bg-transparent text-base text-[var(--color-text)] placeholder:text-[var(--color-muted)] px-2 py-1"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label={t('song_finder.send')}
              className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--color-primary)] text-white transition-[transform,background-color] duration-150 active:scale-95 enabled:hover:bg-[var(--color-primary-dark)] disabled:bg-[var(--color-border)] disabled:cursor-not-allowed"
            >
              <Send size={18} className="rtl:-scale-x-100" aria-hidden />
            </button>
          </div>
          <p className="mt-1 px-2 text-xs text-[var(--color-muted)]">{t('song_finder.disclaimer')}</p>
        </form>
      </div>
    </div>
  );
}

function SongCard({ song, index, delay }: { song: SuggestedSong; index: number; delay: number }) {
  const { t } = useTranslation();
  return (
    <li
      className="enter-up flex items-center gap-3.5 bg-white border border-[var(--color-border)] rounded-[14px] ps-3 pe-4 py-3"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="shrink-0 w-9 h-9 rounded-[10px] bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-[15px] font-semibold">
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-[var(--color-text)] truncate">{song.title}</div>
        <div className="text-sm text-[var(--color-muted)] truncate">{song.artist}</div>
      </div>
      {song.link ? (
        <a
          href={song.link}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-primary-light)] text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[#fbd9dc] hover:text-[var(--color-primary-dark)]"
        >
          <ExternalLink size={14} aria-hidden />
          {t('song_finder.listen')}
        </a>
      ) : (
        <Music size={18} className="shrink-0 text-[#d6d3d1]" aria-hidden />
      )}
    </li>
  );
}
