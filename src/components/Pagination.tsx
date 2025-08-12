import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPrev: () => void;
  onNext: () => void;
  onPageSizeChange: (size: number) => void;
};

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [5, 10, 20, 50, 100],
  onPrev,
  onNext,
  onPageSizeChange,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:flex relative justify-center items-center gap-2 mt-6">
        <button className="btn btn-secondary" onClick={onPrev} disabled={currentPage === 1}>
          {t('pagination.prev')}
        </button>
        <span className="mx-2 text-sm">
          {t('pagination.page')} {currentPage} {t('pagination.of')} {totalPages}
        </span>
        <button className="btn btn-secondary" onClick={onNext} disabled={currentPage === totalPages}>
          {t('pagination.next')}
        </button>

        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          className="select-base w-24 ml-4"
        >
          {pageSizeOptions.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>

        {typeof totalItems === 'number' && (
          <div className="flex items-center gap-2 absolute left-0">
            <span className="text-sm text-gray-500">{t('pagination.total')}: {totalItems}</span>
          </div>
        )}
      </div>

      {/* Mobile bottom bar */}
      <div className="sm:hidden">
        <div className="h-16" /> {/* spacer כדי לא לכסות תוכן */}
        <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              className="btn btn-primary w-24"
              onClick={onPrev}
              disabled={currentPage === 1}
            >
              ←
            </button>

            <div className="text-sm text-gray-700">
              {t('pagination.prev')} <span className="font-semibold">{currentPage}</span> / {totalPages}
            </div>

            <div className="relative">
              <button
                className="btn btn-neutral w-12"
                onClick={() => setMenuOpen(v => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                ⋮
              </button>
              {menuOpen && (
                <div
                  className="absolute bottom-12 right-0 w-40 bg-white border border-gray-200 rounded-lg shadow-lg p-2"
                  role="menu"
                >
                  <div className="text-xs text-gray-500 px-2 mb-1">{t('pagination.rows_in_page')}</div>
                  <div className="grid grid-cols-3 gap-2 px-2 pb-2">
                    {[5, 10, 20].map(size => (
                      <button
                        key={size}
                        className={`px-2 py-1 rounded border ${pageSize === size ? 'bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-gray-200'}`}
                        onClick={() => { onPageSizeChange(size); setMenuOpen(false); }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  {typeof totalItems === 'number' && (
                    <div className="px-2 pt-2 border-t text-xs text-gray-500">
                      {t('pagination.total')} {totalItems}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              className="btn btn-primary w-24"
              onClick={onNext}
              disabled={currentPage === totalPages}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
