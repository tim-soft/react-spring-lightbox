import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Serves the test harness page, which renders the lightbox from src/
export default defineConfig({
    root: fileURLToPath(new URL('./harness', import.meta.url)),
    server: { port: 5174, strictPort: true },
});
