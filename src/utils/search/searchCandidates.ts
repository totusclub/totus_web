/**
 * Кандидаты поискового запроса с учётом неправильной раскладки клавиатуры
 * и выполнение поиска по ним.
 *
 * Правила:
 * 1. Сначала всегда ищем по оригинальному запросу (текст в поле ввода не меняется).
 * 2. Вариант в другой раскладке пробуем, только если детектор считает его
 *    вероятным (см. searchNormalizer):
 *    - high   — ищем параллельно с оригиналом и предпочитаем его результаты;
 *    - medium / low — ищем, только если оригинал ничего не нашёл.
 * 3. Не больше трёх запросов на один ввод (оригинал + 2 варианта), обычно — один.
 */

import { convertLayout, detectScript, directionFor } from './keyboardLayout';
import { analyzeQuery, type LayoutConfidence } from './searchNormalizer';

export type SearchCandidateSource = 'original' | 'layout' | 'layoutFallback';

export interface SearchCandidate {
    query: string;
    source: SearchCandidateSource;
    confidence: LayoutConfidence;
}

export const MAX_SEARCH_CANDIDATES = 3;

/** Оригинал + до двух вариантов раскладки. Пустой запрос — только оригинал. */
export function buildSearchCandidates(query: string): SearchCandidate[] {
    const original: SearchCandidate = { query, source: 'original', confidence: 'none' };
    if (!query.trim()) return [original];

    const analysis = analyzeQuery(query);
    const candidates: SearchCandidate[] = [original];
    if (analysis.variant && analysis.variant !== query) {
        candidates.push({ query: analysis.variant, source: 'layout', confidence: analysis.variantConfidence });
    }
    if (analysis.fallback && !candidates.some((c) => c.query === analysis.fallback)) {
        candidates.push({ query: analysis.fallback, source: 'layoutFallback', confidence: 'low' });
    }
    return candidates.slice(0, MAX_SEARCH_CANDIDATES);
}

export interface CandidateSearchResult<T> {
    result: T;
    /** Кандидат, результаты которого показаны (для «Показаны результаты для …»). */
    candidate: SearchCandidate;
    candidates: SearchCandidate[];
}

/**
 * Асинхронный поиск с учётом раскладки (для запросов к API).
 * Ошибка поиска по оригиналу пробрасывается как раньше; ошибки поиска
 * по вариантам раскладки игнорируются — остаётся результат оригинала.
 */
export async function searchWithLayoutFallback<T>(
    query: string,
    search: (q: string) => Promise<T>,
    hasResults: (result: T) => boolean,
): Promise<CandidateSearchResult<T>> {
    const candidates = buildSearchCandidates(query);
    const [original, ...alternatives] = candidates;

    if (!alternatives.length) {
        return { result: await search(original.query), candidate: original, candidates };
    }

    const trySearch = (q: string): Promise<T | null> => search(q).catch(() => null);
    let originalResult: T;
    let rest = alternatives;

    if (alternatives[0].confidence === 'high') {
        // Почти наверняка не та раскладка: не ждём пустого ответа по оригиналу.
        const [orig, alt] = await Promise.all([search(original.query), trySearch(alternatives[0].query)]);
        originalResult = orig;
        if (alt !== null && hasResults(alt)) {
            return { result: alt, candidate: alternatives[0], candidates };
        }
        rest = alternatives.slice(1);
    } else {
        originalResult = await search(original.query);
    }

    if (hasResults(originalResult)) {
        return { result: originalResult, candidate: original, candidates };
    }

    for (const candidate of rest) {
        const alt = await trySearch(candidate.query);
        if (alt !== null && hasResults(alt)) return { result: alt, candidate, candidates };
    }
    return { result: originalResult, candidate: original, candidates };
}

/**
 * Весь запрос в другой раскладке — пословно, без оценки уверенности
 * (каждое слово переводится в раскладку, противоположную той, в которой набрано).
 */
export function convertQueryLayout(query: string): string {
    return query
        .split(/(\s+)/)
        .map((part) => {
            const direction = directionFor(detectScript(part));
            return direction ? convertLayout(part, direction) : part;
        })
        .join('');
}

export interface LocalFilterOptions {
    /**
     * Если ни оригинал, ни найденные детектором варианты ничего не нашли —
     * проверить весь запрос в другой раскладке без оценки уверенности, даже 1–2 буквы.
     * Подходит для локальных списков: сам список служит словарём, лишних запросов
     * к API нет, а результат показывается только вместо пустого списка.
     */
    convertWhenEmpty?: boolean;
}

/**
 * Синхронный вариант для локальной фильтрации (списки, уже загруженные на клиент).
 * Правила те же: high — предпочитаем вариант, если он что-то нашёл;
 * иначе вариант используется, только если оригинал пуст.
 */
export function filterWithLayoutFallback<T>(
    query: string,
    filter: (q: string) => T[],
    options: LocalFilterOptions = {},
): { results: T[]; candidate: SearchCandidate; candidates: SearchCandidate[] } {
    const candidates = buildSearchCandidates(query);
    const [original, ...alternatives] = candidates;
    const originalResults = filter(original.query);

    const first = alternatives[0];
    if (first?.confidence === 'high') {
        const results = filter(first.query);
        if (results.length) return { results, candidate: first, candidates };
    }
    if (originalResults.length) return { results: originalResults, candidate: original, candidates };

    for (const candidate of first?.confidence === 'high' ? alternatives.slice(1) : alternatives) {
        const results = filter(candidate.query);
        if (results.length) return { results, candidate, candidates };
    }

    if (options.convertWhenEmpty && query.trim()) {
        const converted = convertQueryLayout(query);
        if (converted !== query && !candidates.some((c) => c.query === converted)) {
            const results = filter(converted);
            if (results.length) {
                const candidate: SearchCandidate = { query: converted, source: 'layoutFallback', confidence: 'low' };
                return { results, candidate, candidates: [...candidates, candidate] };
            }
        }
    }
    return { results: originalResults, candidate: original, candidates };
}
