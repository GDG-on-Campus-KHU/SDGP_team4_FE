// src/theme/theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#90a4c8', // 파란색
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#D2E0FB', // 보라색
      contrastText: '#ffffff',
    },
    error: {
      main: '#f44336', // 빨간색
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ff9800', // 주황색
      contrastText: '#000000',
    },
    info: {
      main: '#2196f3', // 밝은 파랑
      contrastText: '#ffffff',
    },
    success: {
      main: '#4caf50', // 초록색
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#9A9A9A',
      secondary: '#555555',
    },
  },
});

export default theme;