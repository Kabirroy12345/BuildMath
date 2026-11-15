import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import preact from '@astrojs/preact';

export default defineConfig({
  site: 'https://buildmath.com',
  trailingSlash: 'always',
  output: 'static',
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    preact({ compat: true }),
  ],
  build: {
    format: 'directory',
    inlineStylesheets: 'always',
  },
});
