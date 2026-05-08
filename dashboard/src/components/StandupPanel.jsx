import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  Button,
  Divider,
  CircularProgress,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { fetchStandup, fetchTasks, changeTaskDate } from '../api.js';
import { useBoard } from '../App.jsx';
import { useT } from '../i18n/index.jsx';

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export default function StandupPanel({ categories, onTaskMoved }) {
  const { t } = useT();
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState(null);
  const board = useBoard();

  useEffect(() => {
    loadData();
  }, []);

  const catGroupMap = {};
  for (const cat of categories) {
    catGroupMap[cat.name] = cat.group || 'work';
  }

  const loadData = async () => {
    setLoading(true);
    try {
      const yesterday = getYesterday();
      const tasksData = await fetchTasks(yesterday);
      setAllTasks(tasksData);
    } catch (err) {
      console.error('Error loading standup data:', err);
    } finally {
      setLoading(false);
    }
  };

  const boardTasks = allTasks.filter((t) => catGroupMap[t.category] === board);
  const doneTasks = boardTasks.filter((t) => t.status === 'done');
  const pendingTasks = boardTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');

  const handleMoveToToday = async (taskId) => {
    setMovingId(taskId);
    try {
      await changeTaskDate(taskId, getToday());
      setAllTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (onTaskMoved) onTaskMoved();
    } catch (err) {
      console.error('Error moving task:', err);
    } finally {
      setMovingId(null);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={24} />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, minWidth: 280 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        {t('standup_yesterday')}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Chip
          label={`${doneTasks.length}/${boardTasks.length}`}
          size="small"
          sx={{
            backgroundColor: 'rgba(81,207,102,0.15)',
            color: '#51cf66',
            fontWeight: 600,
          }}
        />
      </Box>

      {doneTasks.length > 0 && (
        <Box sx={{ mb: 1 }}>
          {doneTasks.map((task) => (
            <Typography key={task.id} variant="body2" sx={{ color: 'text.secondary', py: 0.25 }}>
              ✓ {task.title}{task.summary ? ` — ${task.summary}` : ''}
            </Typography>
          ))}
        </Box>
      )}

      {boardTasks.length === 0 && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('no_tasks_yesterday')}
        </Typography>
      )}

      {pendingTasks.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
            {t('pending_yesterday')}
          </Typography>
          {pendingTasks.map((task) => (
            <Box
              key={task.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 0.5,
              }}
            >
              <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
                {task.title}
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => handleMoveToToday(task.id)}
                disabled={movingId === task.id}
                sx={{ ml: 1, whiteSpace: 'nowrap', minWidth: 'auto' }}
              >
                {t('move_to_today')}
              </Button>
            </Box>
          ))}
        </>
      )}
    </Paper>
  );
}
