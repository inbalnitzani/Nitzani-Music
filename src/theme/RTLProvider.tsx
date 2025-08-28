import React from 'react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from '@mui/stylis-plugin-rtl';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Create rtl cache
const rtlCache = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// Create ltr cache
const ltrCache = createCache({
  key: 'muiltr',
  stylisPlugins: [prefixer],
});

// Create RTL theme
const rtlTheme = createTheme({
  direction: 'rtl',
});

// Create LTR theme
const ltrTheme = createTheme({
  direction: 'ltr',
});

interface RTLProviderProps {
  children: React.ReactNode;
  isRTL: boolean;
}

export function RTLProvider({ children, isRTL }: RTLProviderProps) {
  const cache = isRTL ? rtlCache : ltrCache;
  const theme = isRTL ? rtlTheme : ltrTheme;

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
