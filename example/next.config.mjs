import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['react-spring-lightbox'],
    // react-spring-lightbox and the React it shares are symlinked from the
    // parent folder, so Turbopack needs it as the root
    turbopack: {
        root: fileURLToPath(new URL('..', import.meta.url)),
    },
};

export default nextConfig;
