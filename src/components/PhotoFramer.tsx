import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Move, RotateCcw, X } from 'lucide-react';
import type { PhotoFraming } from '../types/person';
import { DEFAULT_FRAMING } from '../utils/people';
import PersonPhoto from './PersonPhoto';

const MAX_ZOOM = 4;
// Matches the exit transition on .photo-dialog in App.css
const EXIT_MS = 150;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

// Admin dialog: drag (or use the arrow keys) to move the photo inside the round
// frame, and the slider to zoom. Saves a PhotoFraming; see PersonPhoto for how it renders.
export default function PhotoFramer({ name, photoUrl, initial, onSave, onReplace, onClose }: {
  name: string;
  photoUrl: string;
  initial: PhotoFraming;
  onSave: (framing: PhotoFraming) => Promise<void>;
  onReplace: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number } | null>(null);
  const [framing, setFraming] = useState(initial);
  const [aspect, setAspect] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Let the exit transition play before the dialog unmounts
  const close = () => {
    if (isClosing) return;
    setIsClosing(true);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(onClose, reduce ? 0 : EXIT_MS);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setAspect(img.naturalWidth / img.naturalHeight || 1);
    img.src = photoUrl;
  }, [photoUrl]);

  // Moving the focal point by 1 (0..1) shifts the photo by (frame - scaled photo) pixels,
  // so a drag of d pixels is a focal change of d / (scaled photo - frame).
  const moveBy = (dx: number, dy: number) => {
    const size = frameRef.current?.clientWidth ?? 1;
    setFraming(f => {
      const spareX = size * Math.max(1, aspect) * f.zoom - size;
      const spareY = size * Math.max(1, 1 / aspect) * f.zoom - size;
      return {
        ...f,
        x: spareX > 0.5 ? clamp(f.x - (dx / spareX) * 100, 0, 100) : f.x,
        y: spareY > 0.5 ? clamp(f.y - (dy / spareY) * 100, 0, 100) : f.y,
      };
    });
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    moveBy(e.clientX - drag.current.px, e.clientY - drag.current.py);
    drag.current = { px: e.clientX, py: e.clientY };
  };
  const endDrag = () => { drag.current = null; };

  // Arrow keys nudge the photo in the direction pressed
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 24 : 6;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    moveBy(...move);
  };

  const save = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onSave({ x: Math.round(framing.x * 10) / 10, y: Math.round(framing.y * 10) / 10, zoom: Math.round(framing.zoom * 100) / 100 });
      close();
    } catch (err) {
      console.error('Photo framing save error:', err);
      setError(t('people.save_error'));
      setIsSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={e => { e.preventDefault(); if (!isSaving) close(); }}
      onClick={e => { if (e.target === dialogRef.current && !isSaving) close(); }}
      data-closing={isClosing || undefined}
      aria-labelledby="photo-framer-title"
      className="photo-dialog native-flex text-start w-[calc(100vw-2rem)] max-w-[420px] rounded-[20px] p-0 bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-raised)]"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="photo-framer-title" className="text-[19px] font-medium">{t('people.frame_title')}</h2>
            <p className="text-sm text-[var(--color-muted)] truncate"><bdi>{name}</bdi></p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={isSaving}
            aria-label={t('people.cancel')}
            className="shrink-0 -m-1 p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors"
          >
            <X size={20} strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        <div className="mt-5 flex justify-center">
          <div
            ref={frameRef}
            role="application"
            tabIndex={0}
            aria-label={t('people.frame_hint')}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={onKeyDown}
            className="group relative w-60 h-60 rounded-full cursor-grab active:cursor-grabbing touch-none select-none outline-none focus-visible:shadow-[var(--focus-ring)]"
          >
            <PersonPhoto url={photoUrl} framing={framing} className="w-full h-full ring-1 ring-[var(--color-border)]" />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden>
              <span className="w-10 h-10 rounded-full flex items-center justify-center bg-black/45 text-white">
                <Move size={18} strokeWidth={1.75} />
              </span>
            </span>
          </div>
        </div>
        <p className="mt-3 text-center text-[13px] text-[var(--color-muted)]">{t('people.frame_hint')}</p>

        <label className="mt-5 block">
          <span className="flex items-center justify-between text-sm font-medium text-[var(--color-text-soft)]">
            {t('people.zoom')}
            <span className="tabular-nums text-[var(--color-muted)]">{Math.round(framing.zoom * 100)}%</span>
          </span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={framing.zoom}
            onChange={e => setFraming(f => ({ ...f, zoom: Number(e.target.value) }))}
            className="mt-2 w-full accent-[var(--color-primary)]"
          />
        </label>

        {error && <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setFraming(DEFAULT_FRAMING)} disabled={isSaving} className="refine-chip">
            <RotateCcw size={14} strokeWidth={1.75} aria-hidden />
            {t('people.reset')}
          </button>
          <button type="button" onClick={onReplace} disabled={isSaving} className="refine-chip">
            {t('people.replace_photo')}
          </button>
          <button type="button" onClick={save} disabled={isSaving} className="btn btn-primary ms-auto">
            {isSaving ? t('people.saving') : t('people.save')}
          </button>
        </div>
      </div>
    </dialog>
  );
}
