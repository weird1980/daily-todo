import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box,
  Tabs,
  Tab,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Select,
  MenuItem,
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Park';
import { workTheme, personalTheme } from './theme.js';
import TodayPage from './pages/TodayPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import { useT, LOCALES, SUPPORTED_LOCALES } from './i18n/index.jsx';

const BoardContext = createContext('work');
export const useBoard = () => useContext(BoardContext);

function NavBar({ board, onBoardChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, locale, setLocale } = useT();

  const navItems = [
    { label: t('nav_today'), path: '/' },
    { label: t('nav_history'), path: '/history' },
    { label: t('nav_categories'), path: '/categories' },
  ];

  const currentTab = navItems.findIndex((item) => item.path === location.pathname);
  const tabValue = currentTab === -1 ? 0 : currentTab;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider', mb: 2, pb: 0, gap: 1, flexWrap: 'wrap' }}>
      <Tabs value={tabValue} onChange={(_, v) => navigate(navItems[v].path)}>
        {navItems.map((item) => (
          <Tab key={item.path} label={item.label} />
        ))}
      </Tabs>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <ToggleButtonGroup
          value={board}
          exclusive
          onChange={(_, v) => { if (v) onBoardChange(v); }}
          size="small"
        >
          <ToggleButton
            value="work"
            sx={{
              px: 2,
              color: board === 'work' ? '#748ffc !important' : 'text.secondary',
              borderColor: board === 'work' ? '#748ffc' : 'rgba(255,255,255,0.1)',
              bgcolor: board === 'work' ? 'rgba(116,143,252,0.12) !important' : 'transparent',
            }}
          >
            <WorkIcon sx={{ mr: 0.5, fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600 }}>{t('board_work')}</Typography>
          </ToggleButton>
          <ToggleButton
            value="personal"
            sx={{
              px: 2,
              color: board === 'personal' ? '#51cf66 !important' : 'text.secondary',
              borderColor: board === 'personal' ? '#51cf66' : 'rgba(255,255,255,0.1)',
              bgcolor: board === 'personal' ? 'rgba(81,207,102,0.12) !important' : 'transparent',
            }}
          >
            <PersonIcon sx={{ mr: 0.5, fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600 }}>{t('board_personal')}</Typography>
          </ToggleButton>
        </ToggleButtonGroup>

        <Select
          size="small"
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          sx={{ minWidth: 120 }}
        >
          {SUPPORTED_LOCALES.map((code) => (
            <MenuItem key={code} value={code}>
              {LOCALES[code].name}
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Box>
  );
}

export default function App() {
  const [board, setBoard] = useState('work');
  const theme = board === 'personal' ? personalTheme : workTheme;

  useEffect(() => {
    const bg = board === 'personal'
      ? 'linear-gradient(135deg, #0f2419, #133326, #0a3d2a)'
      : 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)';
    document.body.style.transition = 'background 0.4s ease';
    document.body.style.background = bg;
  }, [board]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BoardContext.Provider value={board}>
        <BrowserRouter>
          <Box
            sx={{
              maxWidth: 1200,
              mx: 'auto',
              p: 3,
              minHeight: '100vh',
            }}
          >
            <NavBar board={board} onBoardChange={setBoard} />
            <Routes>
              <Route path="/" element={<TodayPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
            </Routes>
          </Box>
        </BrowserRouter>
      </BoardContext.Provider>
    </ThemeProvider>
  );
}
