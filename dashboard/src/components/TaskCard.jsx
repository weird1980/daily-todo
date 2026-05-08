import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  TextField,
  Stack,
  Popover,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CategoryChip from './CategoryChip.jsx';
import PriorityBadge from './PriorityBadge.jsx';
import { useT } from '../i18n/index.jsx';

const FINISHED_STATUSES = ['done', 'cancelled'];

export default function TaskCard({ task, categories, onStatusChange, onDateChange, dragHandleProps }) {
  const { t } = useT();
  const [pendingSummary, setPendingSummary] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [dateAnchor, setDateAnchor] = useState(null);

  const isFinished = FINISHED_STATUSES.includes(task.status);
  const category = categories.find((c) => c.name === task.category);
  const categoryColor = category?.color || '#748ffc';

  const handleActionClick = (status) => {
    if (status === 'cancelled') {
      onStatusChange(task.id, status, null);
      return;
    }
    setPendingAction(status);
    setPendingSummary('');
  };

  const handleConfirm = () => {
    if (pendingAction) {
      onStatusChange(task.id, pendingAction, pendingSummary || null);
      setPendingAction(null);
      setPendingSummary('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
    if (e.key === 'Escape') {
      setPendingAction(null);
      setPendingSummary('');
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    if (newDate && onDateChange) {
      onDateChange(task.id, newDate);
    }
    setDateAnchor(null);
  };

  return (
    <Paper
      sx={{
        p: 2,
        mb: 1,
        opacity: isFinished ? 0.6 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box {...dragHandleProps} sx={{ cursor: 'grab', mt: 0.5, color: 'text.secondary' }}>
          <DragIndicatorIcon fontSize="small" />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 500,
                textDecoration: isFinished ? 'line-through' : 'none',
                color: isFinished ? 'text.secondary' : 'text.primary',
              }}
            >
              {task.title}
            </Typography>
            <CategoryChip name={task.category} color={categoryColor} />
            <PriorityBadge priority={task.priority} />
          </Box>

          {task.summary && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {task.summary}
            </Typography>
          )}

          {pendingAction && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder={t('summary_optional')}
                value={pendingSummary}
                onChange={(e) => setPendingSummary(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                sx={{ flex: 1 }}
              />
              <IconButton size="small" color="primary" onClick={handleConfirm}>
                <CheckIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => {
                  setPendingAction(null);
                  setPendingSummary('');
                }}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>

        {!pendingAction && (
          <Stack direction="row" spacing={0.5}>
            <IconButton
              size="small"
              title={t('move_date_tooltip')}
              onClick={(e) => setDateAnchor(e.currentTarget)}
              sx={{ color: 'text.secondary' }}
            >
              <CalendarMonthIcon fontSize="small" />
            </IconButton>
            <Popover
              open={Boolean(dateAnchor)}
              anchorEl={dateAnchor}
              onClose={() => setDateAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
              <Box sx={{ p: 1.5, bgcolor: '#16213e' }}>
                <input
                  type="date"
                  defaultValue={task.date}
                  onChange={handleDateChange}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 4,
                    color: '#e6edf3',
                    padding: '6px 8px',
                    fontSize: 14,
                    colorScheme: 'dark',
                  }}
                />
              </Box>
            </Popover>
            {!isFinished && (
              <>
                {task.status !== 'in_progress' && (
                  <IconButton
                    size="small"
                    title={t('in_progress_tooltip')}
                    onClick={() => handleActionClick('in_progress')}
                    sx={{ color: '#748ffc' }}
                  >
                    <PlayArrowIcon fontSize="small" />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  title={t('completed_tooltip')}
                  onClick={() => handleActionClick('done')}
                  sx={{ color: '#51cf66' }}
                >
                  <CheckIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  title={t('cancel_tooltip')}
                  onClick={() => handleActionClick('cancelled')}
                  sx={{ color: '#ff6b6b' }}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
