import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Alias for qcjs package from parent directory
      'qcjs': path.resolve(__dirname, '../qcjs'),
    },
  },
  optimizeDeps: {
    // Include qcjs in dependency optimization
    include: ['react', 'react-dom', 'lucide-react'],
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
