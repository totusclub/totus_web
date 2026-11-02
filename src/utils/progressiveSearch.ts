/**
 * Постепенная выдача поиска (план claude/HOTEL_SEARCH_PROGRESSIVE_PLAN_RU.md, этап 2, 02.11.2026).
 *
 * Как было: опрос статуса раз в 3 с, на первом готовом операторе — ОДИН запрос выдачи с
 * readyOperators этих операторов; список операторов замораживался для фильтров, сортировки и
 * следующих страниц. Замер 02.11: тур показывал навсегда 41–73 % отелей, поиск отелей (один
 * оператор, ~28 с в performing) — пустой экран ~30 с, хотя отели в выдаче LT уже с 3-й секунды.
 *
 * Как стало (флаг NEXT_PUBLIC_PROGRESSIVE_SEARCH, по умолчанию включено; «0» — прежнее поведение):
 *   - первая страница выдачи запрашивается с первого опроса статуса, БЕЗ operator_ids:
 *     LT сам отдаёт всё, что уже нашли операторы (и те, что ещё performing);
 *   - статус: раз в 1 с, пока нет карточек, потом 2 с (до 15-й секунды) и 3 с;
 *   - пока поиск идёт, выдача дозапрашивается: вырос completeness или число готовых операторов,
 *     и не реже раза в 4 с; одновременно не больше одного запроса; финальный — на 100 %;
 *   - новые отели вливаются в список без мигания: карточки, которые человек уже видел
 *     (до нижнего края экрана), не двигаются; остальные идут в порядке выдачи LT, при
 *     сортировке по цене — по цене (решение владельца Р1);
 *   - «Ищем ещё у N операторов» — число операторов в pending / performing (Р4);
 *   - ответы старого поиска выбрасываются (isCurrent), опрос не дольше 90 с.
 *
 * Модуль без импортов: проверка scripts/check-search-progressive.mjs грузит его в Node напрямую.
 */

export const PROGRESSIVE_SEARCH_ENABLED: boolean =
    String(process.env.NEXT_PUBLIC_PROGRESSIVE_SEARCH ?? '1').trim() !== '0';

export const PROGRESSIVE_MAX_SEARCH_MS = 90_000;
export const PROGRESSIVE_REFRESH_EVERY_MS = 4_000;

type StatusMap = Record<string, string>;

const SEARCHING = new Set(['pending', 'performing']);
const READY = new Set(['completed', 'cached']);

function norm(status: unknown): string {
    return String(status ?? '').trim().toLowerCase();
}

/**
 * Опрос: пока нет ни одной карточки — раз в секунду (первые отели у LT появляются через 2–3 с),
 * дальше каждые 2 с до 15-й секунды поиска, потом каждые 3 с.
 */
export function pollDelayMs(elapsedMs: number, hasHotels = true): number {
    if (!hasHotels && elapsedMs < 15_000) return 1_000;
    return elapsedMs < 15_000 ? 2_000 : 3_000;
}

/** Сколько операторов ещё ищут (pending / performing) — для строки «Ищем ещё у N операторов». */
export function countSearchingOperators(statusMap: StatusMap | null | undefined): number {
    if (!statusMap) return 0;
    return Object.values(statusMap).filter((s) => SEARCHING.has(norm(s))).length;
}

export function countReadyOperators(statusMap: StatusMap | null | undefined): number {
    if (!statusMap) return 0;
    return Object.values(statusMap).filter((s) => READY.has(norm(s))).length;
}

/** Поиск закончен: completeness 100 или все операторы в финальном статусе. */
export function isProgressiveSearchDone(statusMap: StatusMap | null | undefined, completeness?: number): boolean {
    if (Number(completeness) >= 100) return true;
    const values = Object.values(statusMap || {});
    if (values.length === 0) return false;
    return values.every((s) => !SEARCHING.has(norm(s)));
}

/** «Ищем ещё у 1 оператора», «у 2 операторов», «у 21 оператора», «у 11 операторов». */
export function formatOperatorsLeft(n: number): string {
    const count = Math.max(0, Math.floor(Number(n) || 0));
    const one = count % 10 === 1 && count % 100 !== 11;
    return `Ищем ещё у ${count} ${one ? 'оператора' : 'операторов'}`;
}

type HotelItem = {
    hotel?: { id?: string | number };
    tour_id?: string | number;
    id?: string | number;
    min_price?: number | string;
};

export function hotelItemKey(item: HotelItem | null | undefined): string | null {
    const key = item?.hotel?.id ?? item?.tour_id ?? item?.id;
    return key != null ? String(key) : null;
}

function priceOf(item: HotelItem): number {
    const p = Number(item?.min_price);
    return Number.isFinite(p) && p > 0 ? p : Number.POSITIVE_INFINITY;
}

/**
 * Влить свежую первую страницу выдачи в показанный список.
 *   - первые frozenCount карточек (человек их уже видел) остаются на местах, у них обновляются
 *     данные (цена и т. п.) из свежей выдачи; ключ прежний — React не перемонтирует карточку;
 *   - остальные: свежая выдача в порядке LT, затем ранее показанные, которых в ней нет
 *     (догруженные страницы), без дублей; при sort_by price,asc / price,desc — по цене.
 */
export function mergeProgressiveHotels<T extends HotelItem>(
    shown: T[] | null | undefined,
    incoming: T[] | null | undefined,
    options: { sortBy?: string | null; frozenCount?: number } = {},
): T[] {
    const prev = Array.isArray(shown) ? shown : [];
    const next = Array.isArray(incoming) ? incoming : [];
    if (prev.length === 0) return dedupe(next);

    const frozenCount = Math.max(0, Math.min(prev.length, Math.floor(Number(options.frozenCount) || 0)));
    const incomingByKey = new Map<string, T>();
    next.forEach((item) => {
        const key = hotelItemKey(item);
        if (key != null && !incomingByKey.has(key)) incomingByKey.set(key, item);
    });

    const used = new Set<string>();
    const frozen: T[] = [];
    prev.slice(0, frozenCount).forEach((item) => {
        const key = hotelItemKey(item);
        if (key != null) {
            if (used.has(key)) return;
            used.add(key);
            frozen.push(incomingByKey.get(key) ?? item);
        } else {
            frozen.push(item);
        }
    });

    const rest: T[] = [];
    const pushUnique = (item: T) => {
        const key = hotelItemKey(item);
        if (key != null) {
            if (used.has(key)) return;
            used.add(key);
        }
        rest.push(item);
    };
    next.forEach(pushUnique);
    prev.slice(frozenCount).forEach(pushUnique);

    const sortBy = String(options.sortBy || '');
    if (sortBy === 'price,asc' || sortBy === 'price,desc') {
        const dir = sortBy === 'price,asc' ? 1 : -1;
        // Стабильная сортировка: равные цены — в порядке выдачи LT.
        const indexed = rest.map((item, index) => ({ item, index }));
        indexed.sort((a, b) => {
            const pa = priceOf(a.item);
            const pb = priceOf(b.item);
            if (pa !== pb) {
                if (pa === Number.POSITIVE_INFINITY) return 1;
                if (pb === Number.POSITIVE_INFINITY) return -1;
                return (pa - pb) * dir;
            }
            return a.index - b.index;
        });
        return [...frozen, ...indexed.map((x) => x.item)];
    }

    return [...frozen, ...rest];
}

function dedupe<T extends HotelItem>(items: T[]): T[] {
    const seen = new Set<string>();
    return items.filter((item) => {
        const key = hotelItemKey(item);
        if (key == null) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/** Догрузка следующей страницы: только новые отели (без повторов уже показанных). */
export function appendUniqueHotels<T extends HotelItem>(shown: T[] | null | undefined, incoming: T[] | null | undefined): T[] {
    const prev = Array.isArray(shown) ? shown : [];
    const next = Array.isArray(incoming) ? incoming : [];
    const keys = new Set(prev.map(hotelItemKey).filter((k): k is string => k != null));
    return [...prev, ...dedupe(next).filter((item) => {
        const key = hotelItemKey(item);
        return key == null || !keys.has(key);
    })];
}

// --- сколько карточек человек уже видел (их не двигаем) -----------------------------------

let visibleCountProvider: (() => number) | null = null;

/** Список выдачи сообщает, сколько карточек от начала списка уже на экране или выше него. */
export function setVisibleHotelCountProvider(provider: (() => number) | null): void {
    visibleCountProvider = provider;
}

export function getVisibleHotelCount(): number {
    try {
        const n = visibleCountProvider ? Number(visibleCountProvider()) : 0;
        return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    } catch {
        return 0;
    }
}

/**
 * Сколько карточек списка уже видно или прокручено: все, чей верх выше нижнего края окна.
 * Карточки помечены атрибутом data-hotel-card.
 */
export function countCardsAboveViewportBottom(root: ParentNode | null | undefined, viewportHeight: number): number {
    if (!root) return 0;
    const cards = Array.from(root.querySelectorAll('[data-hotel-card]')) as Array<{ getBoundingClientRect(): { top: number } }>;
    let count = 0;
    for (const card of cards) {
        if (card.getBoundingClientRect().top < viewportHeight) count += 1;
        else break;
    }
    return count;
}

// --- сам поиск -----------------------------------------------------------------------------

export type ProgressiveStatus = { status: StatusMap; completeness: number } | null;

export type ProgressivePageInfo = { first: boolean; final: boolean; listParams: Record<string, unknown> };

export type ProgressiveSearchOptions = {
    searchParams: Record<string, unknown>;
    startSearch: (params: Record<string, unknown>) => Promise<any>;
    checkStatus: (requestId: string) => Promise<ProgressiveStatus>;
    fetchPage: (params: Record<string, unknown>) => Promise<any>;
    /** Текущие фильтры и сортировка (меняются, пока идёт поиск). */
    getListParams: () => Record<string, unknown>;
    /** Этот поиск ещё актуален (не начат новый, человек не ушёл со страницы). */
    isCurrent: () => boolean;
    /** Идёт запрос фильтра / сортировки — его ответ заменит список; не мешаем ему. */
    isListBusy?: () => boolean;
    onStarted?: (requestId: string) => void;
    onStatus?: (info: { statusMap: StatusMap; completeness: number; operatorsLeft: number }) => void;
    onPage: (page: any, info: ProgressivePageInfo) => void;
    now?: () => number;
    sleep?: (ms: number) => Promise<void>;
    maxMs?: number;
    refreshEveryMs?: number;
};

export type ProgressiveSearchResult = {
    requestId: string | null;
    outcome: 'complete' | 'timeout' | 'cancelled';
    hotelsCount: number;
    firstHotelsAtMs: number | null;
};

/** Ключ фильтров и сортировки выдачи — без request_id и номера страницы. */
export function listParamsKey(params: Record<string, unknown> | null | undefined): string {
    const out: Record<string, unknown> = {};
    Object.keys(params || {})
        .filter((k) => k !== 'request_id' && k !== 'page_number' && k !== 'readyOperators' && k !== 'operator_ids')
        .sort()
        .forEach((k) => {
            out[k] = (params as Record<string, unknown>)[k];
        });
    return JSON.stringify(out);
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function runProgressiveSearch(opts: ProgressiveSearchOptions): Promise<ProgressiveSearchResult> {
    const now = opts.now ?? (() => Date.now());
    const sleep = opts.sleep ?? defaultSleep;
    const maxMs = opts.maxMs ?? PROGRESSIVE_MAX_SEARCH_MS;
    const refreshEveryMs = opts.refreshEveryMs ?? PROGRESSIVE_REFRESH_EVERY_MS;
    const isBusy = opts.isListBusy ?? (() => false);
    const startedAt = now();

    const started = await opts.startSearch(opts.searchParams);
    const requestId: string | null = started?.request_id ? String(started.request_id) : null;
    if (!requestId) throw new Error('Missing request_id from search');
    if (!opts.isCurrent()) return { requestId, outcome: 'cancelled', hotelsCount: 0, firstHotelsAtMs: null };
    opts.onStarted?.(requestId);

    let statusMap: StatusMap = started?.status && typeof started.status === 'object' ? started.status : {};
    let completeness = 0;
    let shown = false;
    let firstHotelsAtMs: number | null = null;
    let hotelsCount = 0;
    let lastFetchAt = Number.NEGATIVE_INFINITY;
    let lastReady = -1;
    let lastCompleteness = -1;
    let fetchErrors = 0;

    for (;;) {
        if (!opts.isCurrent()) return { requestId, outcome: 'cancelled', hotelsCount, firstHotelsAtMs };
        // Идёт запрос фильтра / сортировки — его ответ заменит список; ждём коротко, без опроса.
        if (isBusy() && now() - startedAt < maxMs) {
            await sleep(300);
            continue;
        }

        const st = await opts.checkStatus(requestId);
        if (!opts.isCurrent()) return { requestId, outcome: 'cancelled', hotelsCount, firstHotelsAtMs };
        if (st && st.status && typeof st.status === 'object') {
            statusMap = st.status;
            completeness = Number(st.completeness) || 0;
        }
        const operatorsLeft = countSearchingOperators(statusMap);
        opts.onStatus?.({ statusMap, completeness, operatorsLeft });

        const done = isProgressiveSearchDone(statusMap, completeness);
        const elapsed = now() - startedAt;
        const timedOut = elapsed >= maxMs;
        const ready = countReadyOperators(statusMap);
        const due =
            done ||
            timedOut ||
            !shown ||
            ready > lastReady ||
            completeness > lastCompleteness ||
            // Не реже раза в refreshEveryMs: если до следующего опроса срок выйдет — запросить сейчас.
            now() - lastFetchAt + pollDelayMs(elapsed, shown) > refreshEveryMs;

        if (due) {
            const listParams = { ...opts.getListParams(), request_id: requestId, page_number: 1 };
            let page: any = null;
            try {
                page = await opts.fetchPage(listParams);
                fetchErrors = 0;
            } catch (err) {
                fetchErrors += 1;
                if (!shown && fetchErrors >= 3) throw err;
            }
            if (!opts.isCurrent()) return { requestId, outcome: 'cancelled', hotelsCount, firstHotelsAtMs };
            // Пока ждали ответ, человек сменил фильтр или сортировку — этот ответ уже не к месту:
            // выбрасываем и сразу запрашиваем заново с новыми параметрами.
            if (page && listParamsKey(opts.getListParams()) !== listParamsKey(listParams)) {
                continue;
            }
            lastFetchAt = now();
            lastReady = ready;
            lastCompleteness = completeness;

            if (page) {
                const list = Array.isArray(page.hotels) ? page.hotels : [];
                hotelsCount = Number(page.hotels_count ?? list.length) || list.length;
                const final = done || timedOut;
                // За 90 с ни одного отеля и LT ещё ищет — ошибка, как раньше (а не «ничего не найдено»).
                if (timedOut && !done && !shown && list.length === 0) throw new Error('Search timed out');
                if (list.length > 0 || final) {
                    if (list.length > 0 && firstHotelsAtMs == null) firstHotelsAtMs = now() - startedAt;
                    opts.onPage(page, { first: !shown, final, listParams });
                    shown = true;
                }
                if (final) {
                    return { requestId, outcome: done ? 'complete' : 'timeout', hotelsCount, firstHotelsAtMs };
                }
            }
        }

        if (timedOut) {
            if (!shown) throw new Error('Search timed out');
            return { requestId, outcome: 'timeout', hotelsCount, firstHotelsAtMs };
        }

        await sleep(pollDelayMs(elapsed, shown));
    }
}
