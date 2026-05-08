import { createTheme } from '@mui/material/styles';

const baseTheme = {
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      },
    },
  },
};

export const workTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    background: {
      default: '#1a1a2e',
      paper: 'rgba(255,255,255,0.08)',
    },
    primary: { main: '#748ffc' },
    error: { main: '#ff6b6b' },
    warning: { main: '#ffd43b' },
    success: { main: '#51cf66' },
    text: {
      primary: '#e6edf3',
      secondary: '#aaaaaa',
    },
  },
  components: {
    ...baseTheme.components,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
          minHeight: '100vh',
          transition: 'background 0.4s ease',
        },
      },
    },
  },
});

export const personalTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    background: {
      default: '#0f2419',
      paper: 'rgba(255,255,255,0.08)',
    },
    primary: { main: '#51cf66' },
    error: { main: '#ff6b6b' },
    warning: { main: '#ffd43b' },
    success: { main: '#51cf66' },
    text: {
      primary: '#e6edf3',
      secondary: '#aaaaaa',
    },
  },
  components: {
    ...baseTheme.components,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #0f2419, #133326, #0a3d2a)',
          minHeight: '100vh',
          transition: 'background 0.4s ease',
        },
      },
    },
  },
});

// Keep default export for backwards compat
export default workTheme;
