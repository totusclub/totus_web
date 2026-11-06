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

/**
 * Заголовки безопасности (SECURITY_AUDIT_2026-11_RU.md, H8).
 * CSP по умолчанию в режиме Report-Only (CSP_MODE=report-only): браузер только пишет нарушения в консоль,
 * ничего не блокируя. После недели без ложных срабатываний — CSP_MODE=enforce. CSP_MODE=off — без CSP.
 * Дополнительные источники (виджеты, аналитика) — CSP_EXTRA_SOURCES=https://a.example,https://b.example.
 */
function securityHeaders() {
    const mode = String(process.env.CSP_MODE || 'report-only').toLowerCase();
    const extra = String(process.env.CSP_EXTRA_SOURCES || '').split(',').map((s) => s.trim()).filter(Boolean).join(' ');
    const yandex = 'https://mc.yandex.ru https://*.yandex.ru https://yastatic.net https://*.yastatic.net';
    const csp = [
        "default-src 'self'",
        `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${yandex} ${extra}`.trim(),
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data: https://fonts.gstatic.com",
        `connect-src 'self' https://*.totus.club wss://*.totus.club ${yandex} ${extra}`.trim(),
        "media-src 'self' blob: data: https:",
        `frame-src 'self' ${yandex}`,
        "frame-ancestors 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "worker-src 'self' blob:",
    ].join('; ');
    const headers = [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(), payment=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
    ];
    if (mode === 'enforce') headers.push({ key: 'Content-Security-Policy', value: csp });
    else if (mode !== 'off') headers.push({ key: 'Content-Security-Policy-Report-Only', value: csp });
    return headers;
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
            // H8 аудита: заголовки безопасности на все ответы (см. securityHeaders выше).
            {
                source: '/:path*',
                headers: securityHeaders(),
            },
            {
                source: '/countries/:file*',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }],
            },
            // Картинки hero главной (public/hero, src/config/homeHero.ts): кеш браузера на год без проверки.
            // Файл с тем же именем не меняется — новая картинка = новое имя (public/hero/README.md).
            {
                source: '/hero/:file*',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
            },
        ];
    },
};

export default nextConfig;
