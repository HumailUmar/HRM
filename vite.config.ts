import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
              return 'react-vendor';
            }
            if (id.includes('/recharts/') || id.includes('/d3-')) {
              return 'charts-vendor';
            }
            if (id.includes('/firebase/')) {
              return 'firebase-vendor';
            }
            if (id.includes('/jspdf/') || id.includes('/jspdf-autotable/') || id.includes('/html2canvas/')) {
              return 'pdf-vendor';
            }
            if (id.includes('/exceljs/') || id.includes('/papaparse/')) {
              return 'import-vendor';
            }
            return 'vendor';
          },
        },
      },
    },
    server: {
      // HMR is disabled via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
