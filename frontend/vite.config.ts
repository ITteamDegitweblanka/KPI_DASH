import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      'process.env': {
        ...env,
        API_KEY: JSON.stringify(env.GEMINI_API_KEY),
        GEMINI_API_KEY: JSON.stringify(env.GEMINI_API_KEY)
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    root: path.resolve(__dirname, '.'),
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html')
        }
      }
    },
    server: {
      port: 5173,
      open: true,
      strictPort: true
    }
    };
});
