/**
 * Данные главной для первого HTML (getServerSideProps в pages/index.tsx).
 *
 * Раньше hero, баннеры, партнёры и блоки главной запрашивались браузером уже после загрузки JS:
 * картинка hero (LCP) появлялась на телефоне через ~10 с (PageSpeed), блоки «вставлялись»
 * и сдвигали страницу (CLS 0,17). Теперь сервер берёт их параллельно и отдаёт в HTML.
 *
 * Любая ошибка или таймаут → null для этого блока: компонент запросит данные в браузере,
 * как раньше (страница не ломается и не ждёт API дольше HOME_SSR_TIMEOUT_MS).
 */
import { API_BASE_URL } from '@/config/api';
import type { HomeHero } from '@/api/homeHeroApi';
import type { HomeBanner } from '@/api/homeBannersApi';
import type { HomePartner } from '@/api/homePartnersApi';
import type { HomeDataPayload } from '@/hooks/loadHomeData';

export const HOME_SSR_TIMEOUT_MS = 1200;
const DEFAULT_HERO_TITLE = 'Путешествия начинаются здесь';

export type HomeSsrData = {
    homeHero: HomeHero | null;
    homeData: HomeDataPayload | null;
    homeBanners: HomeBanner[] | null;
    homePartners: HomePartner[] | null;
};

/** Сервер может ходить в API напрямую (API_INTERNAL_URL), иначе — тем же адресом, что браузер. */
function apiBase(): string {
    return (process.env.API_INTERNAL_URL || API_BASE_URL).replace(/\/+$/, '');
}

async function fetchJson(path: string, timeoutMs = HOME_SSR_TIMEOUT_MS): Promise<any | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(`${apiBase()}${path}`, {
            headers: { Accept: 'application/json' },
            cache: 'no-store',
            signal: controller.signal,
        });
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

/** Пропсы Next должны быть JSON без undefined. */
function plain<T>(value: T): T | null {
    if (value === undefined || value === null) return null;
    try {
        return JSON.parse(JSON.stringify(value)) as T;
    } catch {
        return null;
    }
}

export function toHomeHero(body: any): HomeHero | null {
    if (!body || typeof body !== 'object') return null;
    return {
        title: body?.data?.title || DEFAULT_HERO_TITLE,
        image: body?.data?.image || '',
    };
}

export function toList<T>(body: any): T[] | null {
    if (!body || typeof body !== 'object') return null;
    return Array.isArray(body?.data) ? (body.data as T[]) : [];
}

export function toHomeData(body: any): HomeDataPayload | null {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
    return body as HomeDataPayload;
}

export async function loadHomeSsrData(): Promise<HomeSsrData> {
    // home-hero: бэкенд выбирает случайную картинку на каждый запрос — как и раньше, на каждый заход.
    const [hero, data, banners, partners] = await Promise.all([
        fetchJson('/api/home-hero'),
        fetchJson('/home/data'),
        fetchJson('/api/home-banners'),
        fetchJson('/api/home-partners'),
    ]);
    return {
        homeHero: plain(toHomeHero(hero)),
        homeData: plain(toHomeData(data)),
        homeBanners: plain(toList<HomeBanner>(banners)),
        homePartners: plain(toList<HomePartner>(partners)),
    };
}
