/** @type {import('next').NextConfig} */
const nextConfig = {
    compiler: {
        styledComponents: true,
    },
    transpilePackages: ['styled-components', 'react-spring-lightbox'],
};

module.exports = nextConfig;
