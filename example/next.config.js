/** @type {import('next').NextConfig} */
const nextConfig = {
    compiler: {
        styledComponents: true,
    },
    images: {
        remotePatterns: [
            {
                hostname: 'timellenberger.com',
                protocol: 'https',
            },
            {
                hostname: 'https://picsum.photos',
                protocol: 'https',
            },
        ],
    },
    transpilePackages: ['styled-components', 'react-spring-lightbox'],
};

module.exports = nextConfig;
