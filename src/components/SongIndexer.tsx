import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient.ts';

const RATE_LIMIT_WAIT_MS = 60_000;

type Status = 'idle' | 'running' | 'waiting' | 'done' | 'error';

/**
 * Admin control that fills in Song Finder embeddings for songs that don't have one,
 * one batch per call to the `embed-songs` Edge Function, pausing on Gemini rate limits.
 */
export default function SongIndexer() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>('idle');
  const [remaining, setRemaining] = useState<number | null>(null);
  const stopRef = useRef(false);

  const run = async () => {
    stopRef.current = false;
    setStatus('running');
    while (!stopRef.current) {
      const { data, error } = await supabase.functions.invoke<{ embedded: number; remaining: number }>('embed-songs', { body: {} });
      if (error) {
        if (error instanceof FunctionsHttpError && error.context.status === 429) {
          setStatus('waiting');
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_WAIT_MS));
          setStatus('running');
          continue;
        }
        console.error('Indexing songs failed:', error);
        setStatus('error');
        return;
      }
      setRemaining(data!.remaining);
      if (data!.remaining === 0 || data!.embedded === 0) {
        setStatus('done');
        return;
      }
    }
    setStatus('idle');
  };

  const busy = status === 'running' || status === 'waiting';

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 p-4 border border-[var(--color-border)] rounded-xl">
      <div className="flex-1 min-w-[200px]">
        <div className="font-medium">{t('song_indexer.title')}</div>
        <div className="text-sm text-[var(--color-muted)]">
          {status === 'waiting' && t('song_indexer.waiting')}
          {status === 'error' && t('song_indexer.error')}
          {status === 'done' && remaining === 0 && t('song_indexer.done')}
          {(status === 'running' || status === 'idle' || (status === 'done' && remaining !== 0)) &&
            (remaining === null ? t('song_indexer.description') : t('song_indexer.remaining', { count: remaining }))}
        </div>
      </div>
      {busy ? (
        <button type="button" className="btn btn-neutral" onClick={() => { stopRef.current = true; }}>
          {t('song_indexer.stop')}
        </button>
      ) : (
        <button type="button" className="btn btn-primary" onClick={run}>
          {t('song_indexer.start')}
        </button>
      )}
    </div>
  );
}
