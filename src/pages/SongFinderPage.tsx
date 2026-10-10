import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Music, ExternalLink, Sparkles } from 'lucide-react';
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
    <div className="min-h-[calc(100vh-7rem)] bg-[var(--color-bg)] flex flex-col">
      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col px-4 py-6 sm:py-10">
        {/* Title */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">
              {t('song_finder.title')}
            </h1>
            <p className="mt-1 text-[var(--color-muted)]">{t('song_finder.subtitle')}</p>
          </div>
          {messages.length > 0 && (
            <button type="button" onClick={startOver} className="btn btn-neutral text-sm shrink-0">
              {t('song_finder.new_search')}
            </button>
          )}
        </div>

        {/* Conversation */}
        <div className="flex-1 space-y-5" aria-live="polite">
          {messages.length === 0 && !isLoading && (
            <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 sm:p-8">
              <div className="flex items-center gap-2 text-[var(--color-primary)] font-semibold mb-2">
                <Sparkles size={18} aria-hidden />
                {t('song_finder.how_it_works_title')}
              </div>
              <p className="text-[var(--color-text)] leading-relaxed">{t('song_finder.how_it_works')}</p>

              <p className="mt-6 mb-2 text-sm font-medium text-[var(--color-muted)]">
                {t('song_finder.try_example')}
              </p>
              <div className="flex flex-col gap-2">
                {EXAMPLE_KEYS.map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => send(t(`song_finder.${key}`))}
                    className="text-start text-sm px-4 py-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors"
                  >
                    {t(`song_finder.${key}`)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, i) =>
            message.role === 'user' ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] bg-[var(--color-primary)] text-white rounded-2xl rounded-ee-sm px-4 py-3 whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            ) : (
              <div key={i} className="max-w-[95%]">
                <div className="bg-white border border-[var(--color-border)] rounded-2xl rounded-es-sm px-4 py-3 text-[var(--color-text)] whitespace-pre-wrap">
                  {message.content}
                </div>
                {message.songs && message.songs.length > 0 && (
                  <ol className="mt-3 grid gap-2">
                    {message.songs.map((song, j) => (
                      <SongCard key={j} song={song} index={j + 1} />
                    ))}
                  </ol>
                )}
              </div>
            )
          )}

          {isLoading && (
            <div className="flex items-center gap-3 text-[var(--color-muted)]">
              <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              {t('song_finder.thinking')}
            </div>
          )}

          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
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
          <div className="flex items-end gap-2 bg-white border border-[var(--color-border)] rounded-2xl p-2 focus-within:ring-2 focus-within:ring-[var(--color-primary)]">
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
              className="flex-1 resize-none border-0 focus:ring-0 bg-transparent text-[var(--color-text)] px-2 py-1"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label={t('song_finder.send')}
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-primary)] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
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

function SongCard({ song, index }: { song: SuggestedSong; index: number }) {
  const { t } = useTranslation();
  return (
    <li className="flex items-center gap-3 bg-white border border-[var(--color-border)] rounded-xl px-4 py-3">
      <span className="shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-sm font-semibold">
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
          className="shrink-0 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {t('song_finder.listen')}
          <ExternalLink size={14} aria-hidden />
        </a>
      ) : (
        <Music size={18} className="shrink-0 text-gray-300" aria-hidden />
      )}
    </li>
  );
}
