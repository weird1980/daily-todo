import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { useT } from '../i18n/index.jsx';

function formatLocaleDate(dateStr, months) {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate();
  const month = months[date.getMonth()];
  return `${day} ${month}`;
}

export default function ProgressBar({ date, tasks }) {
  const { t, months } = useT();
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === 'done').length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'baseline' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t('today_heading')} — {formatLocaleDate(date, months)}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('completed_count', { done, total, percent })}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: 'rgba(255,255,255,0.08)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            background: 'linear-gradient(90deg, #51cf66, #748ffc)',
          },
        }}
      />
    </Box>
  );
}
