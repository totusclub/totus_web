import type { NextConfig } from 'next';

/**
 * Критический CSS прямо в HTML (PageSpeed mobile: 3 CSS-файла блокировали первую отрисовку,
 * ~1,5 с на «медленном 4G», и задерживали показ hero — Element render delay 1,8 с).
 * Next (pages router) с experimental.optimizeCss встраивает нужные первому экрану правила
 * в <style>, а полные CSS-файлы подгружает без блокировки. Нужен пакет `beasties`
 * (`npm install beasties`); пока он не установлен — настройка выключена, сайт работает как раньше.
 */
function hasPackage(name: string): boolean {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return typeof require === 'function' && Boolean(require.resolve(name));
    } catch {
        return false;
    }
}

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
    experimental: {
        optimizeCss: hasPackage('beasties'),
    },
};

export default nextConfig;
