import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Button,
  CircularProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { fetchCategories } from '../api.js';
import { useT } from '../i18n/index.jsx';

const API_BASE = '/api';

async function createCategory(data) {
  const response = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

export default function CategoriesPage() {
  const { t } = useT();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#748ffc');
  const [group, setGroup] = useState('work');
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(t('error_loading_categories'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      setSubmitting(true);
      await createCategory({ name: trimmed, color, group });
      setName('');
      setColor('#748ffc');
      await loadCategories();
    } catch (err) {
      console.error('Error creating category:', err);
      setError(t('error_creating_category'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h4" fontWeight={700}>
        {t('categories_heading')}
      </Typography>

      {error && (
        <Typography color="error">{error}</Typography>
      )}

      <Paper sx={{ p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Color</TableCell>
              <TableCell>{t('name_label')}</TableCell>
              <TableCell>{t('group_label')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography color="text.secondary" align="center">
                    {t('no_categories')}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {categories.map((cat) => (
              <TableRow key={cat.id || cat.name}>
                <TableCell>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: cat.color || '#748ffc',
                    }}
                  />
                </TableCell>
                <TableCell>{cat.name}</TableCell>
                <TableCell>
                  <Chip
                    label={cat.group === 'personal' ? t('group_personal') : t('group_work')}
                    size="small"
                    sx={{
                      bgcolor: cat.group === 'personal' ? 'rgba(167,139,250,0.15)' : 'rgba(116,143,252,0.15)',
                      color: cat.group === 'personal' ? '#a78bfa' : '#748ffc',
                      fontSize: 11,
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('add_category_heading')}
        </Typography>
        <Box
          component="form"
          onSubmit={handleAdd}
          sx={{ display: 'flex', gap: 2, alignItems: 'center' }}
        >
          <TextField
            label={t('name_label')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            required
            sx={{ flex: 1 }}
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{
              width: 48,
              height: 40,
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              background: 'transparent',
            }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>{t('group_label')}</InputLabel>
            <Select value={group} label={t('group_label')} onChange={(e) => setGroup(e.target.value)}>
              <MenuItem value="work">{t('group_work')}</MenuItem>
              <MenuItem value="personal">{t('group_personal')}</MenuItem>
            </Select>
          </FormControl>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !name.trim()}
          >
            {t('add')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
