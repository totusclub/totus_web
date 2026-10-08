import type { NextConfig } from 'next';

/**
 * Критический CSS прямо в HTML (PageSpeed mobile: 3 CSS-файла блокировали первую отрисовку,
 * ~1,5 с на «медленном 4G», и задерживали показ hero — Element render delay 1,8 с).
 * Next (pages router) с experimental.optimizeCss встраивает нужные первому экрану правила
 * в <style>, а полные CSS-файлы подгружает без блокировки. Next 15.3 использует пакет `critters`
 * (`npm install critters`; пакет beasties эта версия Next не использует); пока он не установлен — настройка выключена, сайт работает как раньше.
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
        optimizeCss: hasPackage('critters'),
    },
    // Картинки стран в списке «Куда» (src/utils/countryImages.ts): кеш браузера на 30 дней.
    // Заменили картинку — меняйте и имя файла (или ждите 30 дней).
    async headers() {
        return [
            {
                source: '/countries/:file*',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }],
            },
        ];
    },
};

export default nextConfig;
