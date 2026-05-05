import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', 
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: true,      // 👈 enables access via local IP (like 192.168.x.x)
    port: 3000,      // 👈 optional, choose your port
  },
});

