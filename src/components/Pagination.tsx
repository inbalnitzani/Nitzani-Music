import React from 'react';
import TablePagination from '@mui/material/TablePagination';
import { useTranslation } from 'react-i18next';

type Props = {
  currentPage: number; // 1-based
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
  const { t } = useTranslation();

  // MUI TablePagination expects:
  // - page: zero-based
  // - rowsPerPage: page size
  // - count: total items (unknown => -1 for unknown)
  const zeroBasedPage = Math.max(0, (currentPage || 1) - 1);
  const count = typeof totalItems === 'number' ? totalItems : totalPages * pageSize;

  const handleChangePage = (_event: unknown, newZeroBasedPage: number) => {
    const delta = newZeroBasedPage - zeroBasedPage;
    if (delta === 0) return;
    // Call the provided next/prev handlers the required number of times
    const steps = Math.abs(delta);
    const fn = delta > 0 ? onNext : onPrev;
    for (let i = 0; i < steps; i += 1) fn();
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = (event.target as HTMLInputElement).value;
    const newSize = Number(value);
    onPageSizeChange(newSize);
  };

  return (
    <TablePagination
      component="div"
      page={zeroBasedPage}
      count={count}
      rowsPerPage={pageSize}
      onPageChange={handleChangePage}
      rowsPerPageOptions={pageSizeOptions}
      onRowsPerPageChange={handleChangeRowsPerPage}
      labelRowsPerPage={t('pagination.rows_in_page')}
      labelDisplayedRows={({ from, to, count: c }) =>
        `${t('pagination.page')} ${currentPage} ${t('pagination.of')} ${totalPages} • ${from}-${to} / ${c === -1 ? `≥${to}` : c}`}
      sx={{
        '& .MuiTablePagination-displayedRows': {
          display: { xs: 'none', sm: 'block' }, // hide on mobile, show ≥640px
        },
      }}
    />
    
  );
}
