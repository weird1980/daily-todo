import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Box, Fab, TextField, Select, MenuItem, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ProgressBar from '../components/ProgressBar.jsx';
import TaskList from '../components/TaskList.jsx';
import TaskDialog from '../components/TaskDialog.jsx';
import StandupPanel from '../components/StandupPanel.jsx';
import UpdateGenerator from '../components/UpdateGenerator.jsx';
import { useBoard } from '../App.jsx';
import { useT } from '../i18n/index.jsx';
import {
  fetchTasks,
  fetchCategories,
  createTask,
  updateTaskStatus,
  moveTask,
  changeTaskDate,
  connectWebSocket,
} from '../api.js';

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export default function TodayPage() {
  const { t } = useT();
  const [allTasks, setAllTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState('');
  const wsRef = useRef(null);
  const board = useBoard();

  const loadTasks = useCallback(async () => {
    try {
      const data = await fetchTasks(getToday(), { includeCarryOver: true });
      setAllTasks(data);
    } catch (err) {
      console.error('Error loading tasks:', err);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadCategories();
  }, [loadTasks, loadCategories]);

  useEffect(() => {
    wsRef.current = connectWebSocket((data) => {
      if (data.type === 'tasks:changed') {
        loadTasks();
      }
    });
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, [loadTasks]);

  const catGroupMap = useMemo(() => {
    const map = {};
    for (const cat of categories) {
      map[cat.name] = cat.group || 'work';
    }
    return map;
  }, [categories]);

  const tasks = useMemo(
    () => allTasks.filter((t) => catGroupMap[t.category] === board),
    [allTasks, catGroupMap, board]
  );

  const boardCategories = useMemo(
    () => categories.filter((c) => (c.group || 'work') === board),
    [categories, board]
  );

  const handleStatusChange = async (id, status, summary) => {
    try {
      await updateTaskStatus(id, status, summary);
      await loadTasks();
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleReorder = async (activeId, overId) => {
    const oldIndex = tasks.findIndex((t) => t.id === activeId);
    const newIndex = tasks.findIndex((t) => t.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const direction = newIndex > oldIndex ? 'down' : 'up';
    const steps = Math.abs(newIndex - oldIndex);

    try {
      for (let i = 0; i < steps; i++) {
        await moveTask(activeId, direction);
      }
      await loadTasks();
    } catch (err) {
      console.error('Error reordering task:', err);
      await loadTasks();
    }
  };

  const handleDateChange = async (id, newDate) => {
    try {
      await changeTaskDate(id, newDate);
      await loadTasks();
    } catch (err) {
      console.error('Error changing task date:', err);
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    const cat = quickCategory || boardCategories[0]?.name;
    if (!cat) return;
    try {
      await createTask({ title, category: cat, priority: 'medium', date: getToday() });
      setQuickTitle('');
      await loadTasks();
    } catch (err) {
      console.error('Error quick adding task:', err);
    }
  };

  const handleAddTask = async (taskData) => {
    try {
      await createTask(taskData);
      await loadTasks();
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <ProgressBar date={getToday()} tasks={tasks} />
        <TaskList
          tasks={tasks}
          categories={categories}
          onStatusChange={handleStatusChange}
          onDateChange={handleDateChange}
          onReorder={handleReorder}
        />
        <Paper
          component="form"
          onSubmit={handleQuickAdd}
          sx={{
            display: 'flex',
            gap: 1,
            p: 1.5,
            mt: 1,
            mb: 2,
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            placeholder={t('add_placeholder')}
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            sx={{ flex: 1 }}
            autoComplete="off"
          />
          <Select
            size="small"
            value={quickCategory || boardCategories[0]?.name || ''}
            onChange={(e) => setQuickCategory(e.target.value)}
            sx={{ minWidth: 130 }}
          >
            {boardCategories.map((c) => (
              <MenuItem key={c.name} value={c.name}>{c.name}</MenuItem>
            ))}
          </Select>
          <button type="submit" style={{ display: 'none' }} />
        </Paper>
        {board === 'work' && <UpdateGenerator />}
      </Box>

      <Box sx={{ width: 320, flexShrink: 0 }}>
        <StandupPanel categories={categories} onTaskMoved={loadTasks} />
      </Box>

      <Fab
        color="primary"
        onClick={() => setDialogOpen(true)}
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
      >
        <AddIcon />
      </Fab>

      <TaskDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleAddTask}
        categories={boardCategories}
      />
    </Box>
  );
}
