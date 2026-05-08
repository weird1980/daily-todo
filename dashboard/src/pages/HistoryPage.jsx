import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip as MuiTooltip,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { fetchTasks, fetchUpdates, fetchCompletedHistory, reopenTask, fetchCategories } from '../api.js';
import { useBoard } from '../App.jsx';
import { useT } from '../i18n/index.jsx';

function formatDate(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}-${dd}`;
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function getLast30Days() {
  const days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function buildTrendData(tasksByDate) {
  return Object.entries(tasksByDate).map(([date, tasks]) => {
    const done = tasks.filter((t) => t.status === 'done').length;
    return { date, done, total: tasks.length };
  });
}

function buildCategoryData(tasksByDate) {
  const counts = {};
  Object.values(tasksByDate).forEach((tasks) => {
    tasks.forEach((task) => {
      const cat = task.category || '—';
      counts[cat] = (counts[cat] || 0) + 1;
    });
  });
  return Object.entries(counts).map(([name, count]) => ({ name, count }));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <Box
      sx={{
        background: '#16213e',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 1,
        px: 1.5,
        py: 1,
      }}
    >
      <Typography variant="caption" sx={{ color: '#ccc' }}>
        {label}
      </Typography>
      {payload.map((entry) => (
        <Typography
          key={entry.dataKey}
          variant="body2"
          sx={{ color: entry.color }}
        >
          {entry.name}: {entry.value}
        </Typography>
      ))}
    </Box>
  );
};

export default function HistoryPage() {
  const { t } = useT();
  const board = useBoard();
  const [trendData, setTrendData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [cats] = await Promise.all([fetchCategories()]);
      setCategories(cats);
      const boardCategories = new Set(
        cats.filter((c) => c.group === board).map((c) => c.name)
      );

      const days = getLast30Days();
      const taskResults = await Promise.all(
        days.map((d) => fetchTasks(toISODate(d)).catch(() => [])),
      );

      const tasksByDate = {};
      days.forEach((d, i) => {
        const filtered = (taskResults[i] || []).filter((t) => boardCategories.has(t.category));
        tasksByDate[formatDate(d)] = filtered;
      });

      setTrendData(buildTrendData(tasksByDate));
      setCategoryData(buildCategoryData(tasksByDate));

      try {
        const updatesData = await fetchUpdates();
        const sorted = [...updatesData]
          .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
          .slice(0, 30);
        setUpdates(sorted);
      } catch {
        setUpdates([]);
      }

      try {
        const history = await fetchCompletedHistory(30);
        setCompletedTasks(history);
      } catch {
        setCompletedTasks([]);
      }
    } catch (err) {
      console.error('Error loading history:', err);
      setError(t('error_loading_data'));
    } finally {
      setLoading(false);
    }
  }, [board]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReopen = async (taskId) => {
    try {
      await reopenTask(taskId);
      setCompletedTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error('Error reopening task:', err);
    }
  };

  const filteredTasks = completedTasks.filter((t) => t.category_group === board);

  const tasksByDay = filteredTasks.reduce((acc, task) => {
    const day = task.date;
    return { ...acc, [day]: [...(acc[day] || []), task] };
  }, {});

  const sortedDays = Object.keys(tasksByDay).sort((a, b) => b.localeCompare(a));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h4" fontWeight={700}>
        {t('history_heading')}
      </Typography>

      {/* Trend chart */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('completed_vs_total')}
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <XAxis dataKey="date" stroke="#aaa" fontSize={12} />
            <YAxis stroke="#aaa" fontSize={12} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="done"
              name="done"
              stroke="#51cf66"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="total"
              name="total"
              stroke="#748ffc"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Category distribution */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('distribution_by_category')}
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData}>
            <XAxis dataKey="name" stroke="#aaa" fontSize={12} />
            <YAxis stroke="#aaa" fontSize={12} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="count"
              name="tasques"
              fill="#748ffc"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Updates list */}
      <Typography variant="h6">{t('recent_updates')}</Typography>
      {updates.length === 0 && (
        <Typography color="text.secondary">
          {t('no_recent_updates')}
        </Typography>
      )}
      {updates.map((update) => (
        <Paper key={update.id || update.date} sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {update.date}
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
          >
            {update.content || update.text || ''}
          </Typography>
        </Paper>
      ))}

      {/* Completed tasks history */}
      <Typography variant="h6" sx={{ mt: 2 }}>
        {t('closed_tasks_per_day')}
      </Typography>
      {sortedDays.length === 0 && (
        <Typography color="text.secondary">
          {t('no_closed_tasks')}
        </Typography>
      )}
      {sortedDays.map((day) => (
        <Paper key={day} sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#aaa' }}>
            {day}
          </Typography>
          {tasksByDay[day].map((task) => (
            <Box
              key={task.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 0.5,
                '&:not(:last-child)': { borderBottom: '1px solid rgba(255,255,255,0.05)' },
              }}
            >
              {task.status === 'done' ? (
                <CheckCircleIcon sx={{ fontSize: 18, color: '#51cf66' }} />
              ) : (
                <CancelIcon sx={{ fontSize: 18, color: '#ff6b6b' }} />
              )}
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  textDecoration: task.status === 'cancelled' ? 'line-through' : 'none',
                  color: task.status === 'cancelled' ? '#888' : 'inherit',
                }}
              >
                {task.title}
              </Typography>
              {task.summary && (
                <Typography variant="caption" sx={{ color: '#888', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.summary}
                </Typography>
              )}
              <Chip
                label={task.category}
                size="small"
                sx={{
                  bgcolor: task.category_color || '#748ffc',
                  color: '#fff',
                  fontSize: '0.7rem',
                  height: 22,
                }}
              />
              <MuiTooltip title={t('reopen_tooltip')}>
                <IconButton
                  size="small"
                  onClick={() => handleReopen(task.id)}
                  sx={{ color: '#748ffc', '&:hover': { color: '#91a7ff' } }}
                >
                  <ReplayIcon fontSize="small" />
                </IconButton>
              </MuiTooltip>
            </Box>
          ))}
        </Paper>
      ))}
    </Box>
  );
}
