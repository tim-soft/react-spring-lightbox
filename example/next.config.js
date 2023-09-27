/** @type {import('next').NextConfig} */
const nextConfig = {
    compiler: {
        styledComponents: true,
    },
    transpilePackages: ['styled-components'],
};

module.exports = nextConfig;
