import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import { useT } from '../i18n/index.jsx';

const PRIORITY_VALUES = ['high', 'medium', 'low'];

const INITIAL_STATE = {
  title: '',
  category: '',
  priority: 'medium',
};

export default function TaskDialog({ open, onClose, onSubmit, categories }) {
  const { t } = useT();
  const [form, setForm] = useState(INITIAL_STATE);
  const [error, setError] = useState('');

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      setError(t('title_required'));
      return;
    }
    if (!form.category) {
      setError(t('category_required'));
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    onSubmit({
      title: form.title.trim(),
      category: form.category,
      priority: form.priority,
      date: today,
    });
    setForm(INITIAL_STATE);
    setError('');
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClose = () => {
    setForm(INITIAL_STATE);
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: '#16213e',
            backgroundImage: 'none',
          },
        },
      }}
    >
      <DialogTitle>{t('new_task_title')}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label={t('title_label')}
            value={form.title}
            onChange={handleChange('title')}
            onKeyDown={handleKeyDown}
            autoFocus
            fullWidth
            error={!!error && !form.title.trim()}
            helperText={error && !form.title.trim() ? error : ''}
          />

          <FormControl fullWidth error={!!error && !form.category}>
            <InputLabel>{t('category_label')}</InputLabel>
            <Select
              value={form.category}
              onChange={handleChange('category')}
              label={t('category_label')}
            >
              {categories.map((cat) => (
                <MenuItem key={cat.name} value={cat.name}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>{t('priority_label')}</InputLabel>
            <Select
              value={form.priority}
              onChange={handleChange('priority')}
              label={t('priority_label')}
            >
              {PRIORITY_VALUES.map((value) => (
                <MenuItem key={value} value={value}>
                  {t(`priority_${value}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {error && form.title.trim() && (
            <Box sx={{ color: 'error.main', fontSize: '0.85rem' }}>{error}</Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('cancel')}</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {t('add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
