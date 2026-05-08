import React from 'react';
import { Chip } from '@mui/material';
import { useT } from '../i18n/index.jsx';

const PRIORITY_STYLES = {
  high: {
    backgroundColor: 'rgba(255,107,107,0.15)',
    color: '#ff6b6b',
  },
  medium: {
    backgroundColor: 'rgba(255,212,59,0.15)',
    color: '#ffd43b',
  },
  low: {
    backgroundColor: 'rgba(81,207,102,0.15)',
    color: '#51cf66',
  },
};

export default function PriorityBadge({ priority }) {
  const { t } = useT();
  const styles = PRIORITY_STYLES[priority] || PRIORITY_STYLES.low;
  const label = t(`priority_${priority}`) || priority;

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        ...styles,
        fontWeight: 600,
        fontSize: '0.7rem',
        height: 22,
      }}
    />
  );
}
