'use client';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/redux/store';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </Provider>
  );
}