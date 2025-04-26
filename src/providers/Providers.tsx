'use client';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
}