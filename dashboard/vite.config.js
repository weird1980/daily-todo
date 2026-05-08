import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.TODO_DASHBOARD_PORT || '7848', 10),
    proxy: {
      '/api': {
        target: 'http://localhost:7847',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:7847',
        ws: true,
      },
    },
  },
});
