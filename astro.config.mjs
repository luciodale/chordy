import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  devToolbar: { enabled: false },
  integrations: [react()],
  adapter: cloudflare({
    platformProxy: { enabled: true, remoteBindings: false },
    imageService: 'passthrough',
  }),
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // React 19 SSR on Workers needs the edge build of react-dom/server; the
      // browser build references MessageChannel, which Workers lacks.
      alias: import.meta.env.PROD ? { 'react-dom/server': 'react-dom/server.edge' } : {},
    },
  },
});
