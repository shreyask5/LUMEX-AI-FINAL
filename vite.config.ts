import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React and ReactDOM into separate chunk
          'react-vendor': ['react', 'react-dom'],
          // Split Google GenAI into separate chunk (likely large)
          'genai-vendor': ['@google/genai'],
          // Split tsparticles into separate chunk
          'particles-vendor': ['react-tsparticles', 'tsparticles-slim'],
        },
      },
    },
    // Increase chunk size warning limit to 600kb
    chunkSizeWarningLimit: 600,
  },
});
