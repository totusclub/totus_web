import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    transpilePackages: ['@tosmedia/ai-assistant'],
    images: {
        unoptimized: true, // This disables Next.js image optimization entirely
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
