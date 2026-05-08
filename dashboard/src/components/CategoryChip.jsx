import React from 'react';
import { Chip } from '@mui/material';

export default function CategoryChip({ name, color }) {
  return (
    <Chip
      label={name}
      size="small"
      sx={{
        backgroundColor: `${color}21`,
        color,
        fontWeight: 600,
        fontSize: '0.7rem',
        height: 22,
      }}
    />
  );
}
