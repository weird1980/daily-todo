import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { generateUpdate } from '../api.js';
import { useBoard } from '../App.jsx';
import { useT } from '../i18n/index.jsx';

export default function UpdateGenerator() {
  const { t } = useT();
  const board = useBoard();
  const [update, setUpdate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const today = new Date().toISOString().slice(0, 10);
      const result = await generateUpdate(today, board);
      setUpdate(result.content || result);
    } catch (err) {
      setError(err.message || t('error_generating_update'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!update) return;
    try {
      const text = typeof update === 'string' ? update : JSON.stringify(update);
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Button
        variant="outlined"
        startIcon={loading ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
        onClick={handleGenerate}
        disabled={loading}
      >
        {t('generate_update')}
      </Button>

      {error && (
        <Typography variant="body2" sx={{ color: 'error.main', mt: 1 }}>
          {error}
        </Typography>
      )}

      {update && (
        <Paper
          sx={{
            mt: 2,
            p: 2,
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {typeof update === 'string' ? update : JSON.stringify(update, null, 2)}
        </Paper>
      )}

      {update && (
        <Button
          variant="text"
          size="small"
          startIcon={<ContentCopyIcon />}
          onClick={handleCopy}
          sx={{ mt: 1 }}
        >
          {t('copy_clipboard')}
        </Button>
      )}

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message={t('copied')}
      />
    </Box>
  );
}
